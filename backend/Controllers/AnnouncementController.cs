using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnnouncementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnnouncementController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Tüm duyuruları getir
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnnouncementDto>>> GetAnnouncements()
        {
            // Aktif kullanıcıya göre görünürlük filtresi uygula
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);

            var query = _context.Announcements.Include(a => a.Author).AsQueryable();
            if (currentUser != null)
            {
                if (currentUser.Role == "Site Sakini")
                {
                    // Yönetici duyuruları (TargetBlogNumber null) + Kapıcının görevli olduğu bloktaki duyurular
                    query = query.Where(a => a.Type == "Duyuru" && (a.TargetBlogNumber == null || a.TargetBlogNumber == currentUser.BlogNumber));
                }
                else if (currentUser.Role == "Kapıcı")
                {
                    // Kapıcı tüm duyuruları kendi yönetimi için görür (opsiyonel: sadece kendi yazdıklarını göstermek istenirse AuthorId filtresi eklenebilir)
                    query = query.Where(a => a.Type == "Duyuru");
                }
            }

            var announcements = await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AnnouncementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Content = a.Content,
                    Type = a.Type,
                    Category = a.Category,
                    IsImportant = a.IsImportant,
                    IsUrgent = a.IsUrgent,
                    AuthorName = a.Author.Name,
                    AuthorRole = a.Author.Role,
                    TargetBlogNumber = a.TargetBlogNumber,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                })
                .ToListAsync();

            return Ok(announcements);
        }

        // Belirli bir duyuruyu getir
        [HttpGet("{id}")]
        public async Task<ActionResult<AnnouncementDto>> GetAnnouncement(int id)
        {
            var announcement = await _context.Announcements
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (announcement == null)
            {
                return NotFound();
            }

            var announcementDto = new AnnouncementDto
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Content = announcement.Content,
                Type = announcement.Type,
                Category = announcement.Category,
                IsImportant = announcement.IsImportant,
                IsUrgent = announcement.IsUrgent,
                AuthorName = announcement.Author.Name,
                AuthorRole = announcement.Author.Role,
                CreatedAt = announcement.CreatedAt,
                UpdatedAt = announcement.UpdatedAt
            };

            return Ok(announcementDto);
        }

        // Yeni duyuru oluştur (Site Yöneticisi genel; Kapıcı sadece kendi bloklarına)
        [HttpPost]
        [Authorize(Roles = "Site Yöneticisi,Kapıcı")]
        public async Task<ActionResult<AnnouncementDto>> CreateAnnouncement(CreateAnnouncementDto createDto)
        {
            // JWT'den kullanıcı ID'sini al
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var author = await _context.Users.FindAsync(userId);
            if (author == null)
            {
                return BadRequest("Kullanıcı bulunamadı");
            }

            // Kurallar: Yönetici -> TargetBlogNumber her zaman null (herkes görür)
            // Kapıcı -> TargetBlogNumber dolu olmalı ve kendi atandığı bloklardan biri olmalı
            string? targetBlogNumber = null;
            if (author.Role == "Kapıcı")
            {
                if (string.IsNullOrWhiteSpace(createDto.TargetBlogNumber))
                {
                    return BadRequest("Kapıcı duyuruları için hedef blok (TargetBlogNumber) zorunludur");
                }
                var assigned = await _context.CaretakerAssignments.AnyAsync(a => a.CaretakerId == author.Id && a.BlogNumber == createDto.TargetBlogNumber);
                if (!assigned)
                {
                    return BadRequest("Sadece görevli olduğunuz bloklara duyuru yayınlayabilirsiniz");
                }
                targetBlogNumber = createDto.TargetBlogNumber;
            }

            var announcement = new Announcement
            {
                Title = createDto.Title,
                Content = createDto.Content,
                Type = createDto.Type,
                Category = createDto.Category,
                IsImportant = createDto.IsImportant,
                IsUrgent = createDto.IsUrgent,
                AuthorId = author.Id,
                TargetBlogNumber = targetBlogNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            var announcementDto = new AnnouncementDto
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Content = announcement.Content,
                Type = announcement.Type,
                Category = announcement.Category,
                IsImportant = announcement.IsImportant,
                IsUrgent = announcement.IsUrgent,
                AuthorName = author.Name,
                AuthorRole = author.Role,
                TargetBlogNumber = announcement.TargetBlogNumber,
                CreatedAt = announcement.CreatedAt,
                UpdatedAt = announcement.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAnnouncement), new { id = announcement.Id }, announcementDto);
        }

        // Duyuru güncelle (Yönetici genel; Kapıcı sadece kendi blok duyurularını)
        [HttpPut("{id}")]
        [Authorize(Roles = "Site Yöneticisi,Kapıcı")]
        public async Task<IActionResult> UpdateAnnouncement(int id, UpdateAnnouncementDto updateDto)
        {
            var announcement = await _context.Announcements
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (announcement == null)
            {
                return NotFound();
            }

            // JWT'den kullanıcı ID'sini al
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUser = await _context.Users.FindAsync(userId);
            if (currentUser == null)
            {
                return BadRequest("Yetkisiz");
            }
            if (currentUser.Role == "Kapıcı")
            {
                // Sadece kendi blok duyurusunu güncelleyebilir
                if (announcement.TargetBlogNumber == null || (updateDto.TargetBlogNumber != null && updateDto.TargetBlogNumber != announcement.TargetBlogNumber))
                {
                    return BadRequest("Kapıcı sadece kendi blok duyurusunu güncelleyebilir");
                }
            }

            announcement.Title = updateDto.Title;
            announcement.Content = updateDto.Content;
            announcement.Type = updateDto.Type;
            announcement.Category = updateDto.Category;
            announcement.IsImportant = updateDto.IsImportant;
            announcement.IsUrgent = updateDto.IsUrgent;
            if (currentUser.Role == "Site Yöneticisi")
            {
                // Yönetici isterse hedef bloğu kaldırabilir (genel yapar)
                announcement.TargetBlogNumber = updateDto.TargetBlogNumber;
            }
            announcement.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Duyuru sil (Yönetici genel; Kapıcı kendi blok duyurusunu)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Site Yöneticisi,Kapıcı")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUser = await _context.Users.FindAsync(userId);
            if (currentUser == null)
            {
                return BadRequest("Yetkisiz");
            }
            if (currentUser.Role == "Kapıcı" && announcement.TargetBlogNumber != currentUser.BlogNumber)
            {
                return BadRequest("Sadece kendi blok duyurunuzu silebilirsiniz");
            }

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Duyuru istatistiklerini getir
        [HttpGet("stats")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult> GetAnnouncementStats()
        {
            try
            {
                var total = await _context.Announcements.CountAsync();
                var important = await _context.Announcements.CountAsync(a => a.IsImportant);
                var urgent = await _context.Announcements.CountAsync(a => a.IsUrgent);
                var general = await _context.Announcements.CountAsync(a => !a.IsImportant && !a.IsUrgent);

                return Ok(new
                {
                    total,
                    important,
                    urgent,
                    general
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "İstatistikler alınırken hata oluştu", error = ex.Message });
            }
        }
    }
} 