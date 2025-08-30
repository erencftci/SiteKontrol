using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kayıt isteği modeli - Dışarıdan gelen kullanıcıların kayıt istekleri
    public class RegistrationRequest
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string RequestedRole { get; set; } = string.Empty; // "Site Sakini", "Güvenlik", "Kapıcı"
        
        [Required]
        [MaxLength(10)]
        public string BlogNumber { get; set; } = string.Empty; // Blog numarası
        
        [Required]
        [MaxLength(10)]
        public string ApartmentNumber { get; set; } = string.Empty; // Daire numarası
        
        [Required]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty; // Kullanıcının belirlediği şifre
        
        [Required]
        public string Description { get; set; } = string.Empty; // Neden bu role ihtiyaç var?
        
        [MaxLength(500)]
        public string? DocumentUrl { get; set; } // Cloudinary'den gelecek kimlik belgesi URL'i
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Beklemede"; // "Beklemede", "Onaylandı", "Reddedildi"
        
        public string? RejectionReason { get; set; } // Red sebebi
        
        public string? AdminNotes { get; set; } // Yönetici notları
        
        public int? ReviewedById { get; set; } // Hangi yönetici değerlendirdi
        
        // Navigation property - değerlendiren yönetici
        public User? ReviewedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ReviewedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
} 