using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Bir kullanıcının bir talebi gördüğünü/okuduğunu takip eder
    public class RequestRead
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        public int RequestId { get; set; }
        public Request Request { get; set; } = null!;

        public DateTime SeenAt { get; set; } = DateTime.UtcNow;
    }
}


