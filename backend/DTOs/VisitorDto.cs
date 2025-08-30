namespace backend.DTOs
{
    // Ziyaretçi oluşturma için DTO
    public class CreateVisitorDto
    {
        public required string Name { get; set; }
        public required string Phone { get; set; }
        public required string Purpose { get; set; }
        public required int ResidentId { get; set; }
        public required string Type { get; set; } // "Ziyaretçi Kaydı", "Misafir Bildirimi"
        public required DateTime ExpectedTime { get; set; }
        public bool HasVehicle { get; set; } = false;
        public string? VehiclePlate { get; set; }
    }

    // Ziyaretçi durum güncelleme için DTO
    public class UpdateVisitorStatusDto
    {
        public required string Status { get; set; } // "Onaylandı", "Reddedildi", "Tamamlandı"
    }

    // Ziyaretçi yanıtı için DTO
    public class VisitorDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ResidentName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ExpectedTime { get; set; }
        public bool HasVehicle { get; set; }
        public string? VehiclePlate { get; set; }
        public DateTime? EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 