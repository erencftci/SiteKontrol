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
    public class ParcelController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly backend.Services.JwtService _jwtService;

        public ParcelController(ApplicationDbContext context, backend.Services.JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // Tüm kargoları getir (kapıcı sadece sorumlu olduğu blokları görür site sakini kendi kargılarını görür güvenlik hepsini görür)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParcelDto>>> GetParcels()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);

            var query = _context.Parcels.AsQueryable();

            if (currentUser != null)
            {
                if (currentUser.Role == "Kapıcı")
                {
                    var myBlocks = await _context.CaretakerAssignments
                        .Where(a => a.CaretakerId == currentUser.Id)
                        .Select(a => a.BlogNumber)
                        .ToListAsync();
                    query = query.Where(p => p.BlogNumber != null && myBlocks.Contains(p.BlogNumber));
                }
                else if (currentUser.Role == "Site Sakini")
                {
                    query = query.Where(p => p.ResidentId == currentUser.Id);
                }
            }

            var parcels = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ParcelDto
                {
                    Id = p.Id,
                    RecipientName = p.RecipientName,
                    Phone = p.Phone,
                    Company = p.Company,
                    TrackingNumber = p.TrackingNumber,
                    Status = p.Status,
                    BlogNumber = p.BlogNumber,
                    ApartmentNumber = p.ApartmentNumber,
                    ResidentId = p.ResidentId,
                    CreatedAt = p.CreatedAt,
                    DeliveredAt = p.DeliveredAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(parcels);
        }

        // Son N gün için günlük kargo sayıları (eksik günleri 0 ile doldurur)
        [HttpGet("daily")]
        public async Task<IActionResult> GetParcelDaily([FromQuery] int days = 7)
        {
            var since = DateTime.UtcNow.Date.AddDays(-days + 1);
            var grouped = await _context.Parcels
                .Where(p => p.CreatedAt >= since)
                .GroupBy(p => p.CreatedAt.Date)
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

        // Belirli bir kargoyu getir
        [HttpGet("{id}")]
        public async Task<ActionResult<ParcelDto>> GetParcel(int id)
        {
            var parcel = await _context.Parcels.FindAsync(id);

            if (parcel == null)
            {
                return NotFound();
            }

            var parcelDto = new ParcelDto
            {
                Id = parcel.Id,
                RecipientName = parcel.RecipientName,
                Phone = parcel.Phone,
                Company = parcel.Company,
                TrackingNumber = parcel.TrackingNumber,
                Status = parcel.Status,
                BlogNumber = parcel.BlogNumber,
                ApartmentNumber = parcel.ApartmentNumber,
                ResidentId = parcel.ResidentId,
                CreatedAt = parcel.CreatedAt,
                DeliveredAt = parcel.DeliveredAt,
                UpdatedAt = parcel.UpdatedAt
            };

            return Ok(parcelDto);
        }

        // Kargoya bırakılan notları getir (sadece ilgili kullanıcılar)
        [HttpGet("{id}/notes")]
        public async Task<IActionResult> GetParcelNotes(int id)
        {
            var parcel = await _context.Parcels.FindAsync(id);
            if (parcel == null) return NotFound();
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);
            if (currentUser == null) return Unauthorized();
            if (currentUser.Role == "Site Sakini" && parcel.ResidentId != currentUser.Id) return Forbid();
            if (currentUser.Role == "Kapıcı")
            {
                var allowed = await _context.CaretakerAssignments.AnyAsync(a => a.CaretakerId == currentUser.Id && a.BlogNumber == parcel.BlogNumber);
                if (!allowed) return Forbid();
            }
            var notes = await _context.ParcelNotes
                .Where(n => n.ParcelId == id)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new { n.Id, n.Content, n.AuthorId, n.CreatedAt })
                .ToListAsync();
            return Ok(notes);
        }

        // Yeni kargo kaydı oluştur (sadece Güvenlik) + bildirimler
        [HttpPost]
        public async Task<ActionResult<ParcelDto>> CreateParcel([FromBody] CreateParcelDto createDto)
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

            // Rol kontrolü - sadece Güvenlik kargo kaydı oluşturabilir
            if (currentUser.Role != "Güvenlik")
            {
                return BadRequest("Sadece Güvenlik kargo kaydı oluşturabilir");
            }

            var parcel = new Parcel
            {
                RecipientName = createDto.RecipientName,
                Phone = createDto.Phone,
                Company = createDto.Company,
                TrackingNumber = createDto.TrackingNumber,
                Status = "Beklemede",
                BlogNumber = string.IsNullOrWhiteSpace(createDto.BlogNumber) ? null : createDto.BlogNumber,
                ApartmentNumber = string.IsNullOrWhiteSpace(createDto.ApartmentNumber) ? null : createDto.ApartmentNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.Parcels.Add(parcel);
            await _context.SaveChangesAsync();

            // Eşleşen kullanıcıyı bularak mesaj/notification kaydı oluştur
            if (!string.IsNullOrEmpty(createDto.BlogNumber) && !string.IsNullOrEmpty(createDto.ApartmentNumber))
            {
                var resident = await _context.Users.FirstOrDefaultAsync(u => u.BlogNumber == createDto.BlogNumber && u.ApartmentNumber == createDto.ApartmentNumber);
                if (resident != null)
                {
                    parcel.ResidentId = resident.Id;
                    await _context.SaveChangesAsync();

                    _context.Messages.Add(new Message
                    {
                        Content = $"{createDto.Company} kargonuz geldi. TakipNo: {createDto.TrackingNumber}",
                        SenderId = currentUser.Id,
                        ReceiverId = resident.Id,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                    await _context.SaveChangesAsync();

                    // Kapıcıya bildirim: sorumlu bloktayım
                    var caretakers = await _context.CaretakerAssignments
                        .Where(a => a.BlogNumber == createDto.BlogNumber)
                        .Select(a => a.CaretakerId)
                        .ToListAsync();
                    foreach (var ct in caretakers)
                    {
                        _context.Messages.Add(new Message
                        {
                            Content = $"Sorumlu olduğunuz {createDto.BlogNumber} bloğuna yeni kargo geldi (Takip: {createDto.TrackingNumber}).",
                            SenderId = currentUser.Id,
                            ReceiverId = ct,
                            CreatedAt = DateTime.UtcNow,
                            IsRead = false
                        });
                    }
                    await _context.SaveChangesAsync();
                }
            }

            var parcelDto = new ParcelDto
            {
                Id = parcel.Id,
                RecipientName = parcel.RecipientName,
                Phone = parcel.Phone,
                Company = parcel.Company,
                TrackingNumber = parcel.TrackingNumber,
                Status = parcel.Status,
                BlogNumber = parcel.BlogNumber,
                ApartmentNumber = parcel.ApartmentNumber,
                ResidentId = parcel.ResidentId,
                CreatedAt = parcel.CreatedAt,
                DeliveredAt = parcel.DeliveredAt,
                UpdatedAt = parcel.UpdatedAt
            };

            return CreatedAtAction(nameof(GetParcel), new { id = parcel.Id }, parcelDto);
        }

        // Kargo durumunu güncelle (Güvenlik veya Kapıcı). Kapıcı sadece sorumlu olduğu blok kargolarını güncelleyebilir.
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateParcelStatus(int id, [FromBody] UpdateParcelStatusDto updateDto)
        {
            var parcel = await _context.Parcels.FindAsync(id);
            if (parcel == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;

            // Site sakini: sadece kendi kargosuna not bırakabilir, durum değiştiremez
            if (currentUser != null && currentUser.Role == "Site Sakini")
            {
                if (parcel.ResidentId != currentUser.Id)
                {
                    return BadRequest("Sadece kendi kargonuz için işlem yapabilirsiniz");
                }
                if (parcel.Status == "Teslim Edildi")
                {
                    return BadRequest("Teslim edilen kargoya not eklenemez");
                }
                if (string.IsNullOrWhiteSpace(updateDto.NoteFromResident))
                {
                    return BadRequest("Not gereklidir");
                }
                var caretakers = await _context.CaretakerAssignments
                    .Where(a => a.BlogNumber == parcel.BlogNumber)
                    .Select(a => a.CaretakerId)
                    .ToListAsync();
                foreach (var ct in caretakers)
                {
                    _context.Messages.Add(new Message
                    {
                        Content = $"Kargo notu: {updateDto.NoteFromResident}",
                        SenderId = currentUser.Id,
                        ReceiverId = ct,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                }
                _context.ParcelNotes.Add(new ParcelNote
                {
                    ParcelId = parcel.Id,
                    AuthorId = currentUser.Id,
                    Content = updateDto.NoteFromResident,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return NoContent();
            }

            if (currentUser == null || (currentUser.Role != "Güvenlik" && currentUser.Role != "Kapıcı"))
            {
                return BadRequest("Sadece Güvenlik veya Kapıcı kargo durumunu güncelleyebilir");
            }

            if (currentUser.Role == "Kapıcı")
            {
                var allowed = await _context.CaretakerAssignments.AnyAsync(a => a.CaretakerId == currentUser.Id && a.BlogNumber == parcel.BlogNumber);
                if (!allowed)
                {
                    return BadRequest("Sadece sorumlu olduğunuz bloktaki kargoları güncelleyebilirsiniz");
                }
            }

            // Site sakini path üstte ele alındı

            parcel.Status = updateDto.Status;
            parcel.UpdatedAt = DateTime.UtcNow;

            // Eğer teslim edildi olarak işaretleniyorsa teslim tarihini güncelle
            if (updateDto.Status == "Teslim Edildi")
            {
                parcel.DeliveredAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Kargo kaydını sil (sadece Güvenlik)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteParcel(int id)
        {
            var parcel = await _context.Parcels.FindAsync(id);
            if (parcel == null)
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
                return BadRequest("Sadece Güvenlik kargo kayıtlarını silebilir");
            }

            _context.Parcels.Remove(parcel);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 