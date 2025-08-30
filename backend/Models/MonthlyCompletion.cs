using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kapıcının aylık gerekliliği tamamlaması
    public class MonthlyCompletion
    {
        public int Id { get; set; }

        [Required]
        public int RequirementId { get; set; }

        public MonthlyRequirement Requirement { get; set; } = null!;

        [Required]
        public int CaretakerId { get; set; }

        public User Caretaker { get; set; } = null!;

        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    }
}


