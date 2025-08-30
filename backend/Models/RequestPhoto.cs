using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
	public class RequestPhoto
	{
		public int Id { get; set; }
		[Required]
		public int RequestId { get; set; }
		[Required]
		[MaxLength(500)]
		public string Url { get; set; } = string.Empty;
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	}
}


