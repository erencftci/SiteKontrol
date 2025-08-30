using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Site sakini tarafından kargoya bırakılan notlar
    public class ParcelNote
    {
        public int Id { get; set; }

        [Required]
        public int ParcelId { get; set; }

        [Required]
        public int AuthorId { get; set; } // Site sakini

        [Required]
        [MaxLength(300)]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}


