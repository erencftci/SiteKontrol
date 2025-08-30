using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Cloudinary'ye yüklenen fotoğrafları temsil eden model
    public class Photo
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Url { get; set; } = string.Empty;
        public string? PublicId { get; set; }
        public string? Description { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        // İleride kullanıcıya veya başka bir modele bağlanabilir
    }
} 