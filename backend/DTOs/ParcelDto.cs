namespace backend.DTOs
{
    // Kargo oluşturma için DTO
    public class CreateParcelDto
    {
        public required string RecipientName { get; set; }
        public required string Phone { get; set; }
        public required string Company { get; set; }
        public required string TrackingNumber { get; set; }
        // Opsiyonel: alıcının daire bilgileri ile eşleştirme
        public string? BlogNumber { get; set; }
        public string? ApartmentNumber { get; set; }
    }

    // Kargo durum güncelleme için DTO
    public class UpdateParcelStatusDto
    {
        public required string Status { get; set; } // "Beklemede", "Teslim Edildi"
        public string? NoteFromResident { get; set; } // Kapıya bırak vb.
    }

    // Kargo yanıtı için DTO
    public class ParcelDto
    {
        public int Id { get; set; }
        public string RecipientName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string TrackingNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? BlogNumber { get; set; }
        public string? ApartmentNumber { get; set; }
        public int? ResidentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 