using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // İstek modeli (Site sakinlerinden kapıcıya)
    public class Request
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        public int RequesterId { get; set; } // İsteği yapan sakin
        
        // Navigation property - isteği yapan sakin
        public User Requester { get; set; } = null!;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Beklemede"; // "Beklemede", "Yanıtlandı", "Tamamlandı"

        // Hedef: "Yönetici" veya "Kapıcı"
        [Required]
        [MaxLength(20)]
        public string Target { get; set; } = "Yönetici";

        // Eğer hedef Kapıcı ise spesifik kapıcı Id'si zorunlu
        public int? TargetCaretakerId { get; set; }
        
        public string? Response { get; set; } // Kapıcının yanıtı
        public string? PhotoUrl { get; set; } // İsteğe eklenen fotoğraf (opsiyonel)
        
        public DateTime? RespondedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
    }
} 