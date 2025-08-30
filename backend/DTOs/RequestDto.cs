namespace backend.DTOs
{
    // İstek oluşturma için DTO
    public class CreateRequestDto
    {
        public required string Title { get; set; }
        public required string Content { get; set; }
        public required string Target { get; set; } // "Yönetici" | "Kapıcı"
        public int? TargetCaretakerId { get; set; } // Target==Kapıcı ise zorunlu
        public string? PhotoUrl { get; set; }
        public List<string>? Photos { get; set; }
    }

    // İstek yanıtlama için DTO
    public class RespondToRequestDto
    {
        public required string Response { get; set; }
    }

    // İstek yanıtı için DTO
    public class RequestDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string>? Photos { get; set; }
        public string RequesterName { get; set; } = string.Empty;
        public string RequesterRole { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Response { get; set; }
        public string? PhotoUrl { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string Target { get; set; } = string.Empty;
        public int? TargetCaretakerId { get; set; }
    }
} 