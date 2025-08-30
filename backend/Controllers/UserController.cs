using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;

        public UserController(ApplicationDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // Site sakinlerini getir (Güvenlik/Danışma/Yönetici erişebilir)
        [HttpGet("residents")]
        [Authorize(Roles = "Site Yöneticisi,Güvenlik,Danışma")]
        public async Task<IActionResult> GetResidents()
        {
            try
            {
                var residents = await _context.Users
                    .Where(u => u.Role == "Site Sakini")
                    .Select(u => new { u.Id, u.Name, u.Email, u.BlogNumber, u.ApartmentNumber })
                    .ToListAsync();

                return Ok(residents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Site sakinleri getirilirken hata: {ex.Message}");
            }
        }

        // Kullanıcı kaydı (sadece Site Yöneticisi yapabilir)
        [HttpPost("register")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
        {
            try
            {
                // E-posta daha önce kullanılmış mı kontrol et
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                    return BadRequest("Bu e-posta zaten kayıtlı.");

                // Şifreyi BCrypt ile hash'le
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                var user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = passwordHash,
                    Role = dto.Role
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Kullanıcı başarıyla oluşturuldu.", userId = user.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcı oluşturulurken hata: {ex.Message}");
            }
        }

        // Kullanıcı girişi
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (user == null)
                    return Unauthorized("E-posta veya şifre hatalı.");

                // BCrypt ile şifre doğrulama
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    return Unauthorized("E-posta veya şifre hatalı.");

                // JWT token oluştur
                var token = _jwtService.GenerateToken(user);

                return Ok(new { 
                    token,
                    user = new { user.Id, user.Name, user.Email, user.Role, user.BlogNumber, user.ApartmentNumber }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Giriş yapılırken hata: {ex.Message}");
            }
        }

        // Tüm kullanıcıları getir (sadece Site Yöneticisi)
        [HttpGet]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi") // Admin'leri gizle
                    .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.CreatedAt })
                    .ToListAsync();
                
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcılar getirilirken hata: {ex.Message}");
            }
        }

        // Kullanıcı istatistiklerini getir (sadece Site Yöneticisi)
        [HttpGet("stats")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                // Toplam kullanıcı sayısı (admin'ler hariç)
                var totalUsers = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi")
                    .CountAsync();

                // Rol bazlı kullanıcı sayıları (admin'ler hariç)
                var roleStats = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi")
                    .GroupBy(u => u.Role)
                    .Select(g => new { Role = g.Key, Count = g.Count() })
                    .ToListAsync();

                // Son 30 günde kayıt olan kullanıcı sayısı (admin'ler hariç)
                var recentUsers = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi" && u.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                // Bu ay kayıt olan kullanıcı sayısı (admin'ler hariç)
                var thisMonthUsers = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi" && 
                               u.CreatedAt.Month == DateTime.UtcNow.Month && 
                               u.CreatedAt.Year == DateTime.UtcNow.Year)
                    .CountAsync();

                // Son 7 günlük kayıt grafiği için veri (admin'ler hariç)
                var weeklyStats = await _context.Users
                    .Where(u => u.Role != "Site Yöneticisi" && u.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                    .GroupBy(u => u.CreatedAt.Date)
                    .Select(g => new { Date = g.Key, Count = g.Count() })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                // Tarih formatını client-side'da yap
                var formattedWeeklyStats = weeklyStats.Select(x => new { 
                    Date = x.Date.ToString("yyyy-MM-dd"), 
                    Count = x.Count 
                }).ToList();

                // Debug için log ekleyelim
                Console.WriteLine($"Total Users: {totalUsers}");
                Console.WriteLine($"Recent Users: {recentUsers}");
                Console.WriteLine($"This Month Users: {thisMonthUsers}");
                Console.WriteLine($"Role Stats: {string.Join(", ", roleStats.Select(r => $"{r.Role}: {r.Count}"))}");
                Console.WriteLine($"Weekly Stats Count: {weeklyStats.Count}");

                return Ok(new
                {
                    totalUsers,
                    roleStats,
                    recentUsers,
                    thisMonthUsers,
                    weeklyStats = formattedWeeklyStats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcı istatistikleri getirilirken hata: {ex.Message}");
            }
        }

        // Kullanıcı sil (sadece Site Yöneticisi)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound("Kullanıcı bulunamadı.");

                if (user.Role == "Site Yöneticisi")
                    return BadRequest("Site Yöneticisi hesapları silinemez.");

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Kullanıcı başarıyla silindi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcı silinirken hata: {ex.Message}");
            }
        }

        // Kullanıcı güncelle (sadece Site Yöneticisi)
        [HttpPut("{id}")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound("Kullanıcı bulunamadı.");

                if (user.Role == "Site Yöneticisi")
                    return BadRequest("Site Yöneticisi hesapları düzenlenemez.");

                user.Name = dto.Name;
                user.Email = dto.Email;
                user.Role = dto.Role;

                // Şifre değiştirilecekse
                if (!string.IsNullOrEmpty(dto.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                }

                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Kullanıcı başarıyla güncellendi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcı güncellenirken hata: {ex.Message}");
            }
        }

        // Mevcut kullanıcı bilgilerini getir
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);
                
                if (user == null)
                    return NotFound("Kullanıcı bulunamadı.");

                return Ok(new { user.Id, user.Name, user.Email, user.Role, user.BlogNumber, user.ApartmentNumber });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Profil bilgileri getirilirken hata: {ex.Message}");
            }
        }

        // Şifre değiştirme
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);
                
                if (user == null)
                    return NotFound("Kullanıcı bulunamadı.");

                // Mevcut şifreyi doğrula
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    return BadRequest("Mevcut şifre hatalı.");

                // Yeni şifreyi hash'le
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Şifre başarıyla değiştirildi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Şifre değiştirilirken hata: {ex.Message}");
            }
        }
    }

    // Kayıt için DTO
    public class UserRegisterDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string Role { get; set; } // Frontend'den rol gelmeli
    }

    // Giriş için DTO
    public class UserLoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    // Şifre değiştirme için DTO
    public class ChangePasswordDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }

    public class UserUpdateDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public string? Password { get; set; } // Opsiyonel
        public required string Role { get; set; }
    }
}