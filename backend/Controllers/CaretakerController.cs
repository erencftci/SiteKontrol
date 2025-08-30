using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CaretakerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CaretakerController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<User?> GetCurrentUser()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out var userId))
            {
                return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            }
            return null;
        }

        // Belirli bir bloktaki kapıcıları listele
        // - Site Yöneticisi: herhangi bir blok için çağırabilir
        // - Site Sakini: yalnızca kendi bloğu için çağırabilir
        [HttpGet("block/{blog}/caretakers")]
        [Authorize(Roles = "Site Yöneticisi,Site Sakini")]
        public async Task<IActionResult> ListCaretakersByBlock(string blog)
        {
            if (string.IsNullOrWhiteSpace(blog)) return BadRequest("Blok gerekli");
            blog = blog.Trim().ToUpperInvariant();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userIdStr);
            if (currentUser == null) return BadRequest("Yetkisiz");

            if (currentUser.Role == "Site Sakini")
            {
                // Site sakini sadece kendi bloğu için sorgulayabilir
                if (string.IsNullOrWhiteSpace(currentUser.BlogNumber) || !string.Equals(currentUser.BlogNumber, blog, StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }
            var caretakers = await _context.CaretakerAssignments
                .Where(a => a.BlogNumber == blog)
                .Join(_context.Users.Where(u => u.Role == "Kapıcı"), a => a.CaretakerId, u => u.Id, (a, u) => new { u.Id, u.Name, u.Email })
                .ToListAsync();
            return Ok(caretakers);
        }

        // Yönetici: Kapıcıyı bloğa atar
        [HttpPost("assign")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> AssignCaretaker([FromBody] CaretakerAssignment dto)
        {
            // Basit doğrulama: kullanıcı kapıcı mı?
            var caretaker = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.CaretakerId && u.Role == "Kapıcı");
            if (caretaker == null) return BadRequest("Kapıcı bulunamadı");

            _context.CaretakerAssignments.Add(new CaretakerAssignment
            {
                CaretakerId = dto.CaretakerId,
                BlogNumber = dto.BlogNumber
            });
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Kapıcı: Günlük çöp/temizlik görevini işaretler
        [HttpPost("daily")]
        [Authorize(Roles = "Kapıcı")]
        public async Task<IActionResult> MarkDaily([FromBody] DailyTask dto)
        {
            var user = await GetCurrentUser();
            if (user == null || user.Role != "Kapıcı") return BadRequest("Yetkisiz");

            _context.DailyTasks.Add(new DailyTask
            {
                CaretakerId = user.Id,
                TaskDate = dto.TaskDate.Date,
                TaskType = string.IsNullOrWhiteSpace(dto.TaskType) ? "Çöp" : dto.TaskType,
                BlogNumber = dto.BlogNumber,
                IsDone = dto.IsDone
            });
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Yönetici: Aylık gereklilik tanımlar
        [HttpPost("monthly/requirement")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> CreateRequirement([FromBody] MonthlyRequirement dto)
        {
            _context.MonthlyRequirements.Add(new MonthlyRequirement
            {
                Title = dto.Title,
                Description = dto.Description,
                BlogNumber = string.IsNullOrWhiteSpace(dto.BlogNumber) ? null : dto.BlogNumber
            });
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Yönetici: Aylık gereklilikleri listeler
        [HttpGet("monthly/requirements")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> ListRequirements()
        {
            var list = await _context.MonthlyRequirements
                .OrderBy(r => r.BlogNumber).ThenBy(r => r.Title)
                .Select(r => new { r.Id, r.Title, r.Description, r.BlogNumber })
                .ToListAsync();
            return Ok(list);
        }

        // Yönetici: Aylık gerekliliği siler
        [HttpDelete("monthly/requirement/{id}")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> DeleteRequirement(int id)
        {
            var req = await _context.MonthlyRequirements.FindAsync(id);
            if (req == null) return NotFound();
            _context.MonthlyRequirements.Remove(req);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Kapıcı: Aylık gerekliliği tamamlar
        [HttpPost("monthly/complete/{requirementId}")]
        [Authorize(Roles = "Kapıcı")]
        public async Task<IActionResult> CompleteRequirement(int requirementId)
        {
            var user = await GetCurrentUser();
            if (user == null || user.Role != "Kapıcı") return BadRequest("Yetkisiz");

            var req = await _context.MonthlyRequirements.FindAsync(requirementId);
            if (req == null) return NotFound();

            _context.MonthlyCompletions.Add(new MonthlyCompletion
            {
                RequirementId = requirementId,
                CaretakerId = user.Id,
                CompletedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Kapıcı: Atandığı bloklara ait gereklilikleri görür
        [HttpGet("monthly/my-requirements")]
        [Authorize(Roles = "Kapıcı")]
        public async Task<IActionResult> GetMyRequirements()
        {
            var user = await GetCurrentUser();
            if (user == null) return BadRequest();

            // Blok bağımlılığını kaldır: genel gereklilikleri herkes görür.
            // Eğer belirli bloklar için tanımlanmışsa ve kapıcı atandıysa, o blok eşleşmeleri de dahil edilir.
            var myBlocks = await _context.CaretakerAssignments
                .Where(a => a.CaretakerId == user.Id)
                .Select(a => a.BlogNumber)
                .ToListAsync();

            var reqs = await _context.MonthlyRequirements
                .Where(r => r.BlogNumber == null || myBlocks.Contains(r.BlogNumber))
                .Select(r => new { r.Id, r.Title, r.Description, r.BlogNumber })
                .ToListAsync();

            return Ok(reqs);
        }

        // Kapıcı: Bu ay tamamladığı gereklilikler
        [HttpGet("monthly/my-completions")]
        [Authorize(Roles = "Kapıcı")]
        public async Task<IActionResult> GetMyCompletions()
        {
            var user = await GetCurrentUser();
            if (user == null) return BadRequest();

            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var list = await _context.MonthlyCompletions
                .Where(c => c.CaretakerId == user.Id && c.CompletedAt >= monthStart)
                .Select(c => new { c.RequirementId, c.CompletedAt })
                .ToListAsync();
            return Ok(list);
        }

        // Yönetici: Aylık gerekliliklerin kapıcı bazlı durum özeti
        [HttpGet("monthly/overview")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> GetMonthlyOverview()
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            var caretakers = await _context.Users
                .Where(u => u.Role == "Kapıcı")
                .Select(u => new { u.Id, u.Name })
                .ToListAsync();

            var requirements = await _context.MonthlyRequirements
                .Select(r => new { r.Id, r.Title, r.Description })
                .ToListAsync();

            var completions = await _context.MonthlyCompletions
                .Where(c => c.CompletedAt >= monthStart)
                .Select(c => new { c.RequirementId, c.CaretakerId, c.CompletedAt })
                .ToListAsync();

            var overview = requirements.Select(r => new
            {
                id = r.Id,
                title = r.Title,
                description = r.Description,
                caretakers = caretakers.Select(c => new
                {
                    caretakerId = c.Id,
                    caretakerName = c.Name,
                    completed = completions.Any(x => x.RequirementId == r.Id && x.CaretakerId == c.Id),
                    completedAt = completions.FirstOrDefault(x => x.RequirementId == r.Id && x.CaretakerId == c.Id)?.CompletedAt
                })
            });

            return Ok(overview);
        }

        // Kapıcı: Özet istatistikleri
        [HttpGet("stats")]
        [Authorize(Roles = "Kapıcı")]
        public async Task<IActionResult> GetStats()
        {
            var user = await GetCurrentUser();
            if (user == null) return BadRequest();

            var today = DateTime.UtcNow.Date;
            var weekStart = today.AddDays(-6);

            var dailyDone = await _context.DailyTasks
                .Where(d => d.CaretakerId == user.Id && d.TaskDate >= weekStart)
                .GroupBy(d => d.TaskDate)
                .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), count = g.Count(x => x.IsDone) })
                .OrderBy(x => x.date)
                .ToListAsync();

            var monthly = await _context.MonthlyCompletions
                .Where(m => m.CaretakerId == user.Id && m.CompletedAt >= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1))
                .CountAsync();

            return Ok(new { weeklyDailyTasks = dailyDone, monthlyCompleted = monthly });
        }
    }
}


