using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Aylık yapılması gereken işler (yönetici tanımlar)
    public class MonthlyRequirement
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty; // Örn: Asansör bakımı

        [MaxLength(200)]
        public string? Description { get; set; }

        // Blok bilgisi opsiyonel hale getirildi; tüm bloklar için geçerli olabilir
        [MaxLength(10)]
        public string? BlogNumber { get; set; }

        // Her ay yapılması beklenir; tamamlanmaları ayrı tabloda tutulur
    }
}


