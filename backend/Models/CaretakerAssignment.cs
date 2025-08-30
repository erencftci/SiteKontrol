using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kapıcının sorumlu olduğu blok atamaları
    public class CaretakerAssignment
    {
        public int Id { get; set; }

        [Required]
        public int CaretakerId { get; set; }

        public User Caretaker { get; set; } = null!;

        [Required]
        [MaxLength(10)]
        public string BlogNumber { get; set; } = string.Empty;
    }
}


