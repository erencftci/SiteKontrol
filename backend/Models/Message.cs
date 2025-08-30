using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Mesaj modeli
    public class Message
    {
        public int Id { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        public int SenderId { get; set; }
        
        // Navigation property - mesajı gönderen kullanıcı
        public User Sender { get; set; } = null!;
        
        [Required]
        public int ReceiverId { get; set; }
        
        // Navigation property - mesajı alan kullanıcı
        public User Receiver { get; set; } = null!;
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ReadAt { get; set; }
    }
} 