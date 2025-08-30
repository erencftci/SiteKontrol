using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Günlük görev (ör: çöp atıldı mı)
    public class DailyTask
    {
        public int Id { get; set; }

        [Required]
        public int CaretakerId { get; set; }

        public User Caretaker { get; set; } = null!;

        // Görev tarihini gün bazında takip ederiz
        public DateTime TaskDate { get; set; } = DateTime.UtcNow.Date;

        [Required]
        [MaxLength(100)]
        public string TaskType { get; set; } = "Cöp"; // "Çöp", vs.

        [Required]
        [MaxLength(10)]
        public string BlogNumber { get; set; } = string.Empty;

        public bool IsDone { get; set; } = false;
    }
}


