namespace backend.DTOs
{
    // kayıt req. için dto
    public class CreateRegistrationRequestDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public required string RequestedRole { get; set; } // roller
        public required string Description { get; set; }
        public string? DocumentUrl { get; set; } // Cloudinary bağlantısı
    }

    // istek değerlendirmek için dto 
    public class ReviewRegistrationRequestDto
    {
        public required string Status { get; set; } // onay red
        public string? RejectionReason { get; set; } // neden reddedildi?
    }

    // istek yanıtı iciö
    public class RegistrationRequestDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string RequestedRole { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? DocumentUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public string? ReviewerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
} 