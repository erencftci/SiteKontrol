using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Okunmamış bildirimleri getir: yeni duyurular + yeni talepler
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnread()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var currentUserId))
            {
                return Unauthorized();
            }

            // Son 14 gün ile sınırlayalım (opsiyonel)
            var since = DateTime.UtcNow.AddDays(-14);

            // Duyurular (
            var unreadAnnouncements = await _context.Announcements
                .Where(a => a.CreatedAt >= since)
                .Where(a => !_context.AnnouncementReads.Any(ar => ar.UserId == currentUserId && ar.AnnouncementId == a.Id))
                .Select(a => new {
                    type = "announcement",
                    id = a.Id,
                    title = a.Title,
                    content = "Yeni duyuru: " + a.Title,
                    createdAt = a.CreatedAt
                })
                .ToListAsync();

            // Talepler 
            var unreadRequests = await _context.Requests
                .Where(r => r.CreatedAt >= since)
                .Where(r => !_context.RequestReads.Any(rr => rr.UserId == currentUserId && rr.RequestId == r.Id))
                .Where(r => r.RequesterId == currentUserId || r.TargetCaretakerId == currentUserId)
                .Include(r => r.Requester)
                .Select(r => new {
                    type = "request",
                    id = r.Id,
                    title = r.Title,
                    content = (r.TargetCaretakerId == currentUserId)
                        ? (r.Requester != null ? r.Requester.Name + " kişisinden yeni talep." : "Yeni talep")
                        : "Talebiniz oluşturuldu.",
                    createdAt = r.CreatedAt
                })
                .ToListAsync();

            // Kargo notları kapıcılar için
            var myBlocks = await _context.CaretakerAssignments
                .Where(a => a.CaretakerId == currentUserId)
                .Select(a => a.BlogNumber)
                .ToListAsync();
            var unreadParcelNotes = await _context.ParcelNotes
                .Where(n => n.CreatedAt >= since)
                .Join(_context.Parcels,
                      n => n.ParcelId,
                      p => p.Id,
                      (n, p) => new { n, p })
                .Where(x => myBlocks.Contains(x.p.BlogNumber!))
                .Join(_context.Users,
                      x => x.n.AuthorId,
                      u => u.Id,
                      (x, u) => new { x.n, x.p, authorName = u.Name })
                .Select(x => new {
                    type = "parcel-note",
                    id = x.n.Id,
                    title = "Kargo Notu",
                    content = x.authorName + " kişisinden kargo notu.",
                    createdAt = x.n.CreatedAt
                })
                .ToListAsync();

            // Misafir bildirimi (okunmamış) - güvenlik için
            var unreadVisitors = await _context.Visitors
                .Where(v => v.CreatedAt >= since)
                .Where(v => !_context.VisitorReads.Any(vr => vr.UserId == currentUserId && vr.VisitorId == v.Id))
                .Select(v => new {
                    type = "visitor",
                    id = v.Id,
                    title = "Misafir Bildirimi",
                    content = ("Yeni misafir bildirimi: " + v.Name + (v.HasVehicle ? " (Araç: " + v.VehiclePlate + ")" : "")),
                    createdAt = v.CreatedAt
                })
                .ToListAsync();

            // Mesajlar (okunmamış) - doğrudan alıcıya giden ve IsRead=false
            var unreadMessages = await _context.Messages
                .Where(m => m.CreatedAt >= since && m.ReceiverId == currentUserId && !m.IsRead)
                .Include(m => m.Sender)
                .Select(m => new {
                    type = "message",
                    id = m.Id,
                    title = "Yeni Mesaj",
                    content = m.Sender.Name + " kişisinden yeni mesaj.",
                    createdAt = m.CreatedAt
                })
                .ToListAsync();

            var items = unreadAnnouncements
                .Concat(unreadRequests)
                .Concat(unreadParcelNotes)
                .Concat(unreadVisitors)
                .Concat(unreadMessages)
                .OrderByDescending(x => x.createdAt)
                .Take(20)
                .ToList();

            return Ok(new { count = items.Count, items });
        }

        // Belirli bildirimleri okundu işaretle
        [HttpPost("mark-seen")]
        public async Task<IActionResult> MarkSeen([FromBody] MarkSeenRequest body)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var currentUserId))
            {
                return Unauthorized();
            }

            if (body == null || body.Items == null || body.Items.Count == 0)
            {
                return BadRequest("Boş istek");
            }

            var now = DateTime.UtcNow;

            foreach (var item in body.Items)
            {
                if (item.Type == "announcement")
                {
                    var exists = await _context.AnnouncementReads.AnyAsync(ar => ar.UserId == currentUserId && ar.AnnouncementId == item.Id);
                    if (!exists)
                    {
                        _context.AnnouncementReads.Add(new AnnouncementRead
                        {
                            UserId = currentUserId,
                            AnnouncementId = item.Id,
                            SeenAt = now
                        });
                    }
                }
                else if (item.Type == "request")
                {
                // parcel-note için şimdilik state tutulmuyor; istenirse ParcelNoteReads tablosu eklenir
                    var exists = await _context.RequestReads.AnyAsync(rr => rr.UserId == currentUserId && rr.RequestId == item.Id);
                    if (!exists)
                    {
                        _context.RequestReads.Add(new RequestRead
                        {
                            UserId = currentUserId,
                            RequestId = item.Id,
                            SeenAt = now
                        });
                    }
                }
                else if (item.Type == "visitor")
                {
                    var exists = await _context.VisitorReads.AnyAsync(vr => vr.UserId == currentUserId && vr.VisitorId == item.Id);
                    if (!exists)
                    {
                        _context.VisitorReads.Add(new VisitorRead
                        {
                            UserId = currentUserId,
                            VisitorId = item.Id,
                            SeenAt = now
                        });
                    }
                }
                else if (item.Type == "message")
                {
                    // Sadece belirli mesajı okundu işaretle; paneli açınca toplu okuma olmasın
                    var msg = await _context.Messages.FirstOrDefaultAsync(m => m.Id == item.Id && m.ReceiverId == currentUserId);
                    if (msg != null && !msg.IsRead)
                    {
                        msg.IsRead = true;
                        msg.ReadAt = now;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        public class MarkSeenRequest
        {
            public List<SeenItem> Items { get; set; } = new();
        }

        public class SeenItem
        {
            public string Type { get; set; } = string.Empty; // announcement | request
            public int Id { get; set; }
        }
    }
}


