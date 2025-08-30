using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    // bildirim görüldü mü?
    public class AnnouncementRead
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        public int AnnouncementId { get; set; }
        public Announcement Announcement { get; set; } = null!;

        public DateTime SeenAt { get; set; } = DateTime.UtcNow;
    }
}


