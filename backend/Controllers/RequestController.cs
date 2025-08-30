using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RequestController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Tüm istekleri getir - görünürlük kuralları ile
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RequestDto>>> GetRequests()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var userId);
            var currentUser = await _context.Users.FindAsync(userId);

            var query = _context.Requests.Include(r => r.Requester).AsQueryable();

            if (currentUser != null)
            {
                if (currentUser.Role == "Site Sakini")
                {
                    // Site sakini sadece kendi oluşturduğu talepleri görebilir (hedefi ne olursa olsun)
                    query = query.Where(r => r.RequesterId == currentUser.Id);
                }
                else if (currentUser.Role == "Kapıcı")
                {
                    query = query.Where(r => r.Target == "Kapıcı" && r.TargetCaretakerId == currentUser.Id);
                }
                else if (currentUser.Role == "Site Yöneticisi")
                {
                    query = query.Where(r => r.Target == "Yönetici");
                }
            }

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new RequestDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    Content = r.Content,
                    PhotoUrl = r.PhotoUrl,
                    Photos = _context.RequestPhotos.Where(p=>p.RequestId==r.Id).Select(p=>p.Url).ToList(),
                    RequesterName = r.Requester.Name,
                    RequesterRole = r.Requester.Role,
                    Status = r.Status,
                    Response = r.Response,
                    RespondedAt = r.RespondedAt,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    Target = r.Target,
                    TargetCaretakerId = r.TargetCaretakerId
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Belirli bir isteği getir
        [HttpGet("{id}")]
        public async Task<ActionResult<RequestDto>> GetRequest(int id)
        {
            var request = await _context.Requests
                .Include(r => r.Requester)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound();
            }

            var requestDto = new RequestDto
            {
                Id = request.Id,
                Title = request.Title,
                Content = request.Content,
                PhotoUrl = request.PhotoUrl,
                Photos = await _context.RequestPhotos.Where(p=>p.RequestId==request.Id).Select(p=>p.Url).ToListAsync(),
                RequesterName = request.Requester.Name,
                RequesterRole = request.Requester.Role,
                Status = request.Status,
                Response = request.Response,
                RespondedAt = request.RespondedAt,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt
            };

            return Ok(requestDto);
        }

        // Yeni istek oluştur (sadece Site Sakinleri)
        [HttpPost]
        public async Task<ActionResult<RequestDto>> CreateRequest(CreateRequestDto createDto)
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

          
            if (currentUser.Role != "Site Sakini")
            {
                return BadRequest("Sadece Site Sakinleri istek oluşturabilir");
            }

            
            if (createDto.Target == "Kapıcı")
            {
                if (createDto.TargetCaretakerId == null)
                {
                    return BadRequest("Kapıcı hedefli istek için kapıcı seçmelisiniz");
                }
                if (string.IsNullOrWhiteSpace(currentUser.BlogNumber))
                {
                    return BadRequest("Profilinizde blok bilgisi bulunmuyor");
                }
                var allowed = await _context.CaretakerAssignments.AnyAsync(a => a.CaretakerId == createDto.TargetCaretakerId && a.BlogNumber == currentUser.BlogNumber);
                if (!allowed)
                {
                    return BadRequest("Sadece kendi blokunuzdaki kapıcılara talepte bulunabilirsiniz");
                }
            }

            var request = new Request
            {
                Title = createDto.Title,
                Content = createDto.Content,
                RequesterId = currentUser.Id,
                Target = createDto.Target,
                TargetCaretakerId = createDto.Target == "Kapıcı" ? createDto.TargetCaretakerId : null,
                PhotoUrl = createDto.PhotoUrl,
                Status = "Beklemede",
                CreatedAt = DateTime.UtcNow
            };

            _context.Requests.Add(request);
            await _context.SaveChangesAsync();

            // birden fazla fotoğraf desteği
            var photoUrls = new List<string>();
            if (!string.IsNullOrWhiteSpace(createDto.PhotoUrl)) photoUrls.Add(createDto.PhotoUrl);
            if (createDto.Photos != null && createDto.Photos.Count > 0) photoUrls.AddRange(createDto.Photos);
            if (photoUrls.Count > 0)
            {
                foreach (var url in photoUrls.Distinct())
                {
                    _context.RequestPhotos.Add(new RequestPhoto { RequestId = request.Id, Url = url });
                }
                await _context.SaveChangesAsync();
            }

            var requestDto = new RequestDto
            {
                Id = request.Id,
                Title = request.Title,
                Content = request.Content,
                PhotoUrl = request.PhotoUrl,
                RequesterName = currentUser.Name,
                RequesterRole = currentUser.Role,
                Status = request.Status,
                Response = request.Response,
                RespondedAt = request.RespondedAt,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                Target = request.Target,
                TargetCaretakerId = request.TargetCaretakerId
            };

            return CreatedAtAction(nameof(GetRequest), new { id = request.Id }, requestDto);
        }

        // İsteğe yanıt ver (Kapıcı veya Site Yöneticisi)
        [HttpPut("{id}/respond")]
        public async Task<IActionResult> RespondToRequest(int id, RespondToRequestDto respondDto)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;
            if (currentUser == null)
            {
                return BadRequest("Yetkisiz");
            }

            // Yetki kontrolü: hedefe göre kısıt
            if (request.Target == "Yönetici" && currentUser.Role != "Site Yöneticisi")
                return BadRequest("Sadece Site Yöneticisi yanıtlayabilir");
            if (request.Target == "Kapıcı" && !(currentUser.Role == "Kapıcı" && request.TargetCaretakerId == currentUser.Id))
                return BadRequest("Sadece ilgili Kapıcı yanıtlayabilir");

            request.Response = respondDto.Response;
            request.Status = "Yanıtlandı";
            request.RespondedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // İstek durumunu güncelle
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] string status)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;
            if (currentUser == null)
            {
                return BadRequest("Yetkisiz");
            }

            // Hedefe göre yetki: Kapıcı kendi talebini; Yönetici yönetici taleplerini güncelleyebilir
            if (request.Target == "Kapıcı")
            {
                if (currentUser.Role != "Kapıcı" || request.TargetCaretakerId != currentUser.Id)
                    return BadRequest("Sadece ilgili Kapıcı istek durumunu güncelleyebilir");
            }
            else if (request.Target == "Yönetici")
            {
                if (currentUser.Role != "Site Yöneticisi")
                    return BadRequest("Sadece Site Yöneticisi istek durumunu güncelleyebilir");
            }

            request.Status = status;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // İsteği tamamla ve aidata bedel yansıt (sadece Kapıcı)
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteRequest(int id, [FromBody] decimal cost)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId;
            var currentUser = int.TryParse(userIdStr, out userId)
                ? await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                : null;
            if (currentUser == null || currentUser.Role != "Kapıcı")
            {
                return BadRequest("Sadece Kapıcı işlemi tamamlayabilir");
            }

            request.Status = "Tamamlandı";
            request.UpdatedAt = DateTime.UtcNow;

            // Aidata yansıt
            _context.Dues.Add(new Due
            {
                UserId = request.RequesterId,
                Amount = cost,
                Description = $"İstek ücreti: {request.Title}"
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // İsteği sil (sadece isteği oluşturan sakin)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var request = await _context.Requests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            // TODO: Gerçek kullanıcı kimlik doğrulaması eklenecek
            // Şimdilik test için ilk kullanıcıyı alıyoruz
            var currentUser = await _context.Users.FirstOrDefaultAsync();
            if (currentUser == null || currentUser.Id != request.RequesterId)
            {
                return BadRequest("Sadece isteği oluşturan sakin isteği silebilir");
            }

            _context.Requests.Remove(request);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 