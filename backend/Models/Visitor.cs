using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Ziyaretçi ve misafir modeli
    public class Visitor
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Purpose { get; set; } = string.Empty;
        
        [Required]
        public int ResidentId { get; set; } // Ziyaret edilecek sakin
        
        // Navigation property - ziyaret edilecek sakin
        public User Resident { get; set; } = null!;
        
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // "Ziyaretçi Kaydı", "Misafir Bildirimi"
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Beklemede"; // "Beklemede", "Onaylandı", "Reddedildi", "Tamamlandı"
        
        public DateTime ExpectedTime { get; set; }
        
        // Araç bilgileri
        public bool HasVehicle { get; set; } = false;
        [MaxLength(15)]
        public string? VehiclePlate { get; set; }

        // Giriş/Çıkış zamanları (otopark doluluk için)
        public DateTime? EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
    }
} 