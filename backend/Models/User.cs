using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // Kullanıcı modelimiz: Veritabanında User tablosu olarak tutulacak
    public class User
    {
        [Key] // Birincil anahtar
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // Kullanıcının adı

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty; // Kullanıcının e-posta adresi

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // Şifre (hash'lenmiş olarak tutulacak)

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = string.Empty; // Kullanıcı rolü (Yönetici, Güvenlik, Kapıcı, Site Sakini)

        [MaxLength(20)]
        public string? Phone { get; set; } // Telefon numarası

        [MaxLength(10)]
        public string? BlogNumber { get; set; } // Blog numarası

        [MaxLength(10)]
        public string? ApartmentNumber { get; set; } // Daire numarası

        public DateTime CreatedAt { get; set; } // Hesap oluşturulma tarihi
    }
}