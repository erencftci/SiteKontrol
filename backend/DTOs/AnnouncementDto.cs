namespace backend.DTOs
{
    // Duyuru oluşturma için DTO
    public class CreateAnnouncementDto
    {
        public required string Title { get; set; }
        public required string Content { get; set; }
        public required string Type { get; set; } // "Duyuru", "Şikayet", "Öneri"
        public string Category { get; set; } = "Genel";
        public bool IsImportant { get; set; } = false;
        public bool IsUrgent { get; set; } = false;
        // Kapıcı duyuruları için opsiyonel hedef blok
        public string? TargetBlogNumber { get; set; }
    }

    // Duyuru güncelleme için DTO
    public class UpdateAnnouncementDto
    {
        public required string Title { get; set; }
        public required string Content { get; set; }
        public required string Type { get; set; }
        public string Category { get; set; } = "Genel";
        public bool IsImportant { get; set; } = false;
        public bool IsUrgent { get; set; } = false;
        public string? TargetBlogNumber { get; set; }
    }

    // Duyuru yanıtı için DTO
    public class AnnouncementDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsImportant { get; set; } = false;
        public bool IsUrgent { get; set; } = false;
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorRole { get; set; } = string.Empty;
        public string? TargetBlogNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 