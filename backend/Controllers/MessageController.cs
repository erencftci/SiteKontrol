using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using backend.Services;

namespace backend.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	public class MessageController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly IHubContext<ChatHub> _hub;

		public MessageController(ApplicationDbContext context, IHubContext<ChatHub> hub)
		{
			_context = context;
			_hub = hub;
		}

		// Mesajlaşma için kişi listesi (kendim hariç herkes)
		[HttpGet("contacts")]
		public async Task<IActionResult> GetContacts()
		{
			var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

			var users = await _context.Users
				.Where(u => u.Id != userId)
				.Select(u => new { u.Id, u.Name, u.Role })
				.ToListAsync();

			return Ok(users);
		}

		// konuşma listesison mesaj ve okunmayan sayısı ile
		[HttpGet("chats")]
		public async Task<IActionResult> GetChats()
		{
			var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

			var query = _context.Messages
				.Where(m => m.SenderId == userId || m.ReceiverId == userId);

			var chatGroups = await query
				.GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
				.Select(g => new
				{
					UserId = g.Key,
					LastMessageTime = g.Max(x => x.CreatedAt),
					Unread = g.Count(x => x.SenderId == g.Key && x.ReceiverId == userId && !x.IsRead)
				})
				.ToListAsync();

			var userIds = chatGroups.Select(c => c.UserId).ToList();
			var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
			var lastMessages = await query
				.Where(m => userIds.Contains(m.SenderId == userId ? m.ReceiverId : m.SenderId))
				.OrderByDescending(m => m.CreatedAt)
				.ToListAsync();

			var chats = chatGroups
				.Select(c => new
				{
					userId = c.UserId,
					userName = users.First(u => u.Id == c.UserId).Name,
					userRole = users.First(u => u.Id == c.UserId).Role,
					lastMessage = lastMessages.First(m => (m.SenderId == userId && m.ReceiverId == c.UserId) || (m.SenderId == c.UserId && m.ReceiverId == userId)).Content,
					lastMessageTime = c.LastMessageTime,
					unread = c.Unread
				})
				.OrderByDescending(c => c.lastMessageTime)
				.ToList();

			return Ok(chats);
		}

		// İkili sohbet geçmişi
		[HttpGet("thread/{otherUserId}")]
		public async Task<IActionResult> GetThread(int otherUserId)
		{
			var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

			var messages = await _context.Messages
				.Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) || (m.SenderId == otherUserId && m.ReceiverId == userId))
				.OrderBy(m => m.CreatedAt)
				.Select(m => new {
					id = m.Id,
					content = m.Content,
					senderId = m.SenderId,
					receiverId = m.ReceiverId,
					isRead = m.IsRead,
					createdAt = m.CreatedAt,
					readAt = m.ReadAt
				})
				.ToListAsync();

			return Ok(messages);
		}

		// Mesaj gönder
		[HttpPost]
		public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
		{
			var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

			if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Mesaj boş olamaz");
			if (dto.ReceiverId <= 0) return BadRequest("Alıcı seçiniz");

			var msg = new Message
			{
				Content = dto.Content.Trim(),
				SenderId = userId,
				ReceiverId = dto.ReceiverId,
				CreatedAt = DateTime.UtcNow
			};
			_context.Messages.Add(msg);
			await _context.SaveChangesAsync();

			// Realtime bildirimler
			await _hub.Clients.User(dto.ReceiverId.ToString()).SendAsync("MessageReceived", new
			{
				id = msg.Id,
				content = msg.Content,
				senderId = msg.SenderId,
				receiverId = msg.ReceiverId,
				createdAt = msg.CreatedAt
			});
			// Bildirim menüsü sayısı için
			await _hub.Clients.User(dto.ReceiverId.ToString()).SendAsync("Notification", new { type = "message", id = msg.Id, title = "Yeni Mesaj", content = msg.Content, createdAt = msg.CreatedAt });
			await _hub.Clients.Users(new[] { userId.ToString(), dto.ReceiverId.ToString() }).SendAsync("ChatUpdated", new { userId = userId, otherUserId = dto.ReceiverId });

			return Ok(new { id = msg.Id, createdAt = msg.CreatedAt });
		}

		// Okundu işaretle (konuşmadaki karşı tarafın gönderdiği tüm okunmamışlar)
		[HttpPost("thread/{otherUserId}/read")]
		public async Task<IActionResult> MarkRead(int otherUserId)
		{
			var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

			var unread = await _context.Messages
				.Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && !m.IsRead)
				.ToListAsync();
			foreach (var m in unread)
			{
				m.IsRead = true;
				m.ReadAt = DateTime.UtcNow;
			}
			await _context.SaveChangesAsync();
			return NoContent();
		}

		public class SendMessageDto
		{
			public required int ReceiverId { get; set; }
			public required string Content { get; set; }
		}
	}
}