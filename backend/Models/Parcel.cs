using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kargo modeli
    public class Parcel
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string RecipientName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Company { get; set; } = string.Empty; // Kargo şirketi
        
        [Required]
        [MaxLength(50)]
        public string TrackingNumber { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Beklemede"; // "Beklemede", "Teslim Edildi"

        // Hedef adres bilgileri (blok + daire) ve eşleşen sakin
        [MaxLength(10)]
        public string? BlogNumber { get; set; }

        [MaxLength(10)]
        public string? ApartmentNumber { get; set; }

        public int? ResidentId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? DeliveredAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
} 