using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
	public class VisitorRead
	{
		public int Id { get; set; }
		[Required]
		public int VisitorId { get; set; }
		[Required]
		public int UserId { get; set; }
		public DateTime SeenAt { get; set; } = DateTime.UtcNow;
	}
}


