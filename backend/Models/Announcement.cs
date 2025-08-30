using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Duyuru, şikayet ve öneri modeli
    public class Announcement
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // "Duyuru", "Şikayet", "Öneri"
        
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Genel"; // "Genel", "Önemli", "Acil"
        
        public bool IsImportant { get; set; } = false;
        
        public bool IsUrgent { get; set; } = false;
        
        [Required]
        public int AuthorId { get; set; }
        
        // Navigation property - yazan kullanıcı
        public User Author { get; set; } = null!;
        
        // Kapıcı duyuruları için hedeflenen blok (Site Yöneticisi duyurularında null)
        [MaxLength(10)]
        public string? TargetBlogNumber { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
    }
} 