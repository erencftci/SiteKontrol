using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RegistrationRequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;

        public RegistrationRequestController(ApplicationDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // Tüm kayıt isteklerini getir (sadece Site Yöneticisi)
        [HttpGet]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult<IEnumerable<RegistrationRequest>>> GetRegistrationRequests()
        {
            try
            {
                var requests = await _context.RegistrationRequests
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt istekleri alınırken hata oluştu", error = ex.Message });
            }
        }

        // Yeni kayıt isteği oluştur (herkes yapabilir)
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<RegistrationRequest>> CreateRegistrationRequest([FromBody] RegistrationRequestDto requestDto)
        {
            try
            {
                // Aynı e-posta ile daha önce başvuru yapılmış mı kontrol et
                var existingRequest = await _context.RegistrationRequests
                    .FirstOrDefaultAsync(r => r.Email == requestDto.Email && r.Status == "Beklemede");

                if (existingRequest != null)
                {
                    return BadRequest(new { message = "Bu e-posta adresi ile daha önce başvuru yapılmış" });
                }

                // Aynı e-posta ile aktif kullanıcı var mı kontrol et
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == requestDto.Email);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "Bu e-posta adresi ile zaten bir kullanıcı kayıtlı" });
                }

                // rol bazlı zorunlular 
                var validBlocks = new HashSet<string>(new[]{"A","B","C","D","E","F","G","H","I","J"});
                if (string.IsNullOrWhiteSpace(requestDto.RequestedRole)) return BadRequest(new { message = "Rol gerekli" });
                if (requestDto.RequestedRole == "Site Sakini")
                {
                    if (string.IsNullOrWhiteSpace(requestDto.BlogNumber) || !validBlocks.Contains(requestDto.BlogNumber))
                        return BadRequest(new { message = "Geçerli bir blok seçmelisiniz (A-J)" });
                    if (string.IsNullOrWhiteSpace(requestDto.ApartmentNumber))
                        return BadRequest(new { message = "Daire seçmelisiniz" });
                    // daire doluluk kontrolü aynı blokdairede aktif kullanıcı var mı
                    var occupied = await _context.Users.AnyAsync(u => u.Role == "Site Sakini" && u.BlogNumber == requestDto.BlogNumber && u.ApartmentNumber == requestDto.ApartmentNumber);
                    if (occupied) return BadRequest(new { message = "Seçtiğiniz daire dolu" });
                }
                else if (requestDto.RequestedRole == "Kapıcı")
                {
                    if (string.IsNullOrWhiteSpace(requestDto.BlogNumber) || !validBlocks.Contains(requestDto.BlogNumber))
                        return BadRequest(new { message = "Kapıcı için bir blok (A-J) seçmelisiniz" });
                    //kapıcı için daire zorunlu değildir
                }

                var registrationRequest = new RegistrationRequest
                {
                    Name = requestDto.Name,
                    Email = requestDto.Email,
                    Phone = requestDto.Phone,
                    RequestedRole = requestDto.RequestedRole,
                    BlogNumber = requestDto.BlogNumber,
                    ApartmentNumber = requestDto.ApartmentNumber,
                    Password = requestDto.Password,
                    Description = requestDto.Description,
                    Status = "Beklemede",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.RegistrationRequests.Add(registrationRequest);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetRegistrationRequests), new { id = registrationRequest.Id }, registrationRequest);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt isteği oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        // Kayıt isteğini onayla (sadece Site Yöneticisi)
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult> ApproveRegistrationRequest(int id, [FromBody] ApprovalDto approvalDto)
        {
            try
            {
                var request = await _context.RegistrationRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound(new { message = "Kayıt isteği bulunamadı" });
                }

                if (request.Status != "Beklemede")
                {
                    return BadRequest(new { message = "Bu başvuru zaten değerlendirilmiş" });
                }

                // Kullanıcı hesabı oluştur
                var newUser = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = request.RequestedRole,
                    BlogNumber = request.BlogNumber,
                    ApartmentNumber = request.ApartmentNumber,
                    // Kullanıcının belirlediği şifre
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                // Önce kullanıcıyı kalıcılaştır ki FK sorun çıkmasın
                await _context.SaveChangesAsync();

                // Kapıcı ise atamasını otomatik oluştur (blok zorunlu)
                if (request.RequestedRole == "Kapıcı")
                {
                    if (string.IsNullOrWhiteSpace(request.BlogNumber))
                    {
                        return BadRequest(new { message = "Kapıcı için blok bilgisi zorunludur" });
                    }

                    _context.CaretakerAssignments.Add(new CaretakerAssignment
                    {
                        CaretakerId = newUser.Id,
                        BlogNumber = request.BlogNumber
                    });
                    await _context.SaveChangesAsync();
                }

                // Kayıt isteğini güncelle
                request.Status = "Onaylandı";
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                // Güvenlik için: reviewer gerçekten var mı kontrol et
                var reviewer = await _context.Users.FirstOrDefaultAsync(u => u.Id == reviewerId);
                if (reviewer == null)
                {
                    return BadRequest(new { message = "Geçersiz yönetici oturumu" });
                }
                request.ReviewedById = reviewer.Id;
                request.ReviewedAt = DateTime.UtcNow;
                request.AdminNotes = approvalDto.AdminNotes;
                request.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Kayıt isteği başarıyla onaylandı ve kullanıcı hesabı oluşturuldu",
                    userId = newUser.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt isteği onaylanırken hata oluştu", error = ex.Message });
            }
        }

        // Kayıt isteğini reddet (sadece Site Yöneticisi)
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult> RejectRegistrationRequest(int id, [FromBody] RejectionDto rejectionDto)
        {
            try
            {
                var request = await _context.RegistrationRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound(new { message = "Kayıt isteği bulunamadı" });
                }

                if (request.Status != "Beklemede")
                {
                    return BadRequest(new { message = "Bu başvuru zaten değerlendirilmiş" });
                }

                // Kayıt isteğini güncelle
                request.Status = "Reddedildi";
                request.ReviewedById = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                request.ReviewedAt = DateTime.UtcNow;
                request.RejectionReason = rejectionDto.RejectionReason;
                request.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Kayıt isteği reddedildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt isteği reddedilirken hata oluştu", error = ex.Message });
            }
        }

        // Kayıt isteği detayını getir
        [HttpGet("{id}")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult<RegistrationRequest>> GetRegistrationRequest(int id)
        {
            try
            {
                var request = await _context.RegistrationRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound(new { message = "Kayıt isteği bulunamadı" });
                }

                return Ok(request);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt isteği alınırken hata oluştu", error = ex.Message });
            }
        }

        // Kayıt isteği istatistiklerini getir
        [HttpGet("stats")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<ActionResult> GetRegistrationStats()
        {
            try
            {
                var stats = await _context.RegistrationRequests
                    .GroupBy(r => r.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var total = await _context.RegistrationRequests.CountAsync();
                var pending = await _context.RegistrationRequests.CountAsync(r => r.Status == "Beklemede");
                var approved = await _context.RegistrationRequests.CountAsync(r => r.Status == "Onaylandı");
                var rejected = await _context.RegistrationRequests.CountAsync(r => r.Status == "Reddedildi");

                return Ok(new
                {
                    total,
                    pending,
                    approved,
                    rejected,
                    details = stats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "İstatistikler alınırken hata oluştu", error = ex.Message });
            }
        }
    }

    // DTO sınıfları
    public class RegistrationRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string RequestedRole { get; set; } = string.Empty;
        public string BlogNumber { get; set; } = string.Empty;
        public string ApartmentNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ApprovalDto
    {
        public string AdminNotes { get; set; } = string.Empty;
    }

    public class RejectionDto
    {
        public string RejectionReason { get; set; } = string.Empty;
    }
} 