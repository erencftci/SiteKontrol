using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class VisitorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly backend.Services.JwtService _jwtService;

        public VisitorController(ApplicationDbContext context, backend.Services.JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // Tüm ziyaretçileri getir
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VisitorDto>>> GetVisitors()
        {
            // Aktif kullanıcıyı al ve Site Sakini ise kendi ziyaretçileri ile sınırla
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);

            var query = _context.Visitors
                .Include(v => v.Resident)
                .AsQueryable();

            if (currentUser != null && currentUser.Role == "Site Sakini")
            {
                query = query.Where(v => v.ResidentId == currentUser.Id);
            }

            var visitors = await query
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VisitorDto
                {
                    Id = v.Id,
                    Name = v.Name,
                    Phone = v.Phone,
                    Purpose = v.Purpose,
                    ResidentName = v.Resident.Name,
                    Type = v.Type,
                    Status = v.Status,
                    ExpectedTime = v.ExpectedTime,
                    HasVehicle = v.HasVehicle,
                    VehiclePlate = v.VehiclePlate,
                    EntryTime = v.EntryTime,
                    ExitTime = v.ExitTime,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt
                })
                .ToListAsync();

            return Ok(visitors);
        }

        // Belirli bir ziyaretçiyi getir
        [HttpGet("{id}")]
        public async Task<ActionResult<VisitorDto>> GetVisitor(int id)
        {
            var visitor = await _context.Visitors
                .Include(v => v.Resident)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (visitor == null)
            {
                return NotFound();
            }

            var visitorDto = new VisitorDto
            {
                Id = visitor.Id,
                Name = visitor.Name,
                Phone = visitor.Phone,
                Purpose = visitor.Purpose,
                ResidentName = visitor.Resident.Name,
                Type = visitor.Type,
                Status = visitor.Status,
                ExpectedTime = visitor.ExpectedTime,
                HasVehicle = visitor.HasVehicle,
                VehiclePlate = visitor.VehiclePlate,
                EntryTime = visitor.EntryTime,
                ExitTime = visitor.ExitTime,
                CreatedAt = visitor.CreatedAt,
                UpdatedAt = visitor.UpdatedAt
            };

            return Ok(visitorDto);
        }

        
        [HttpPost]
        public async Task<ActionResult<VisitorDto>> CreateVisitor([FromBody] CreateVisitorDto createDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;
            if (currentUser == null)
            {
                return BadRequest("Kullanıcı bulunamadı");
            }

            
            var resident = await _context.Users.FirstOrDefaultAsync(u => u.Id == createDto.ResidentId);
            if (resident == null)
            {
                return BadRequest("Ziyaret edilecek sakin bulunamadı");
            }

            // rol 
            if (createDto.Type == "Ziyaretçi Kaydı" && currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik ziyaretçi kaydı oluşturabilir");
            }

            if (createDto.Type == "Misafir Bildirimi" && currentUser.Role != "Site Sakini")
            {
                return BadRequest("Sadece Site Sakinleri misafir bildirimi yapabilir");
            }

            var visitor = new Visitor
            {
                Name = createDto.Name,
                Phone = createDto.Phone,
                Purpose = createDto.Purpose,
                ResidentId = createDto.ResidentId,
                Type = createDto.Type,
                Status = "Beklemede",
                ExpectedTime = createDto.ExpectedTime,
                HasVehicle = createDto.HasVehicle,
                VehiclePlate = createDto.VehiclePlate,
                CreatedAt = DateTime.UtcNow
            };

            // Güvenlik kapıda kayıt açıyorsa ve araçlı ise giriş zamanı o anda kabul edilir
            if (currentUser.Role == "Güvenlik" && createDto.HasVehicle)
            {
                visitor.EntryTime = DateTime.UtcNow;
            }

            _context.Visitors.Add(visitor);
            await _context.SaveChangesAsync();

            var visitorDto = new VisitorDto
            {
                Id = visitor.Id,
                Name = visitor.Name,
                Phone = visitor.Phone,
                Purpose = visitor.Purpose,
                ResidentName = resident.Name,
                Type = visitor.Type,
                Status = visitor.Status,
                ExpectedTime = visitor.ExpectedTime,
                HasVehicle = visitor.HasVehicle,
                VehiclePlate = visitor.VehiclePlate,
                EntryTime = visitor.EntryTime,
                ExitTime = visitor.ExitTime,
                CreatedAt = visitor.CreatedAt,
                UpdatedAt = visitor.UpdatedAt
            };

            return CreatedAtAction(nameof(GetVisitor), new { id = visitor.Id }, visitorDto);
        }

        // Ziyaretçi durumunu güncelle (sadece Güvenlik)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateVisitorStatus(int id, [FromBody] UpdateVisitorStatusDto updateDto)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;
            if (currentUser == null || currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik ziyaretçi durumunu güncelleyebilir");
            }

            visitor.Status = updateDto.Status;
            visitor.UpdatedAt = DateTime.UtcNow;

            // Onay verildiğinde araçlı ziyaretçinin otopark girişini kaydet (tek seferlik)
            if (updateDto.Status == "Onaylandı" && visitor.HasVehicle && visitor.EntryTime == null)
            {
                visitor.EntryTime = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Ziyaretçi girişini işaretle (otopark için EntryTime)
        [HttpPut("{id}/enter")]
        public async Task<IActionResult> MarkVisitorEnter(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
            {
                return NotFound();
            }

            var userIdStrExit = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userIdExit;
            var currentUser = int.TryParse(userIdStrExit, out userIdExit)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userIdExit)
                : null;
            if (currentUser == null || currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik ziyaretçi girişini işaretleyebilir");
            }

            visitor.EntryTime = DateTime.UtcNow;
            visitor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Ziyaretçi çıkışını işaretle (otopark için ExitTime)
        [HttpPut("{id}/exit")]
        public async Task<IActionResult> MarkVisitorExit(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
            {
                return NotFound();
            }

            var userIdStr2 = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId2;
            var currentUser = int.TryParse(userIdStr2, out userId2)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId2)
                : null;
            if (currentUser == null || currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik ziyaretçi çıkışını işaretleyebilir");
            }

            visitor.ExitTime = DateTime.UtcNow;
            visitor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Güvenlik dashboard için istatistikler
        [HttpGet("stats")]
        public async Task<IActionResult> GetVisitorStats()
        {
            var nowActiveVisitors = await _context.Visitors.CountAsync(v => v.Status == "Onaylandı" && v.ExitTime == null);
            var pendingVisitors = await _context.Visitors.CountAsync(v => v.Status == "Beklemede");
            // Misafir otoparkı doluluğu: Onaylanmış ve çıkış yapmamış araçlı ziyaretçiler (EntryTime şart değil)
            var activeVehicleVisitors = await _context.Visitors.CountAsync(v => v.HasVehicle && v.Status == "Onaylandı" && v.ExitTime == null);

            // Misafir otoparkı kapasitesi 80; dolu = aktif araçlı ziyaretçi sayısı
            var capacity = 80;
            var occupied = activeVehicleVisitors;

            return Ok(new
            {
                activeVisitors = nowActiveVisitors,
                pendingVisitors,
                parking = new { capacity, occupied }
            });
        }

        // Son N gün için günlük ziyaretçi sayıları (eksik günleri 0 ile doldurur)
        [HttpGet("daily")]
        public async Task<IActionResult> GetVisitorDaily([FromQuery] int days = 7)
        {
            // Aktif kullanıcıyı al ve Site Sakini ise kendi ziyaretçileri ile sınırla
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);

            var since = DateTime.UtcNow.Date.AddDays(-days + 1);

            var visitorsQuery = _context.Visitors.AsQueryable();
            if (currentUser != null && currentUser.Role == "Site Sakini")
            {
                visitorsQuery = visitorsQuery.Where(v => v.ResidentId == currentUser.Id);
            }

            var grouped = await visitorsQuery
                .Where(v => v.CreatedAt >= since)
                .GroupBy(v => v.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dict = grouped.ToDictionary(x => x.Date, x => x.Count);
            var result = new List<object>();
            for (int i = 0; i < days; i++)
            {
                var day = since.AddDays(i);
                dict.TryGetValue(day, out int cnt);
                result.Add(new { date = day.ToString("yyyy-MM-dd"), count = cnt });
            }
            return Ok(result);
        }

        // Ziyaretçi kaydını sil (sadece Güvenlik)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisitor(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
            {
                return NotFound();
            }

            var authHeader = Request.Headers["Authorization"].ToString();
            var token = authHeader.StartsWith("Bearer ") ? authHeader.Substring("Bearer ".Length) : authHeader;
            var currentUserId = _jwtService.GetUserIdFromToken(token);
            var currentUser = currentUserId.HasValue ? await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value) : null;
            if (currentUser == null || currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik ziyaretçi kayıtlarını silebilir");
            }

            _context.Visitors.Remove(visitor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 