using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kamera modeli
    public class Camera
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(100)]
        public string? IpAddress { get; set; }

        // "Aktif" | "Arızalı" | "Bakım"
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Aktif";

        public bool Recording { get; set; } = false;

        [MaxLength(20)]
        public string? Resolution { get; set; }

        public DateTime? LastMaintenance { get; set; }

        // 0-100
        public int? StorageUsedPercent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}


