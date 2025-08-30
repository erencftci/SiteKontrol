using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DueController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out var userId)) return userId;
            return null;
        }

        // Kullanıcının kendi aidat/borç kalemlerini listele
        [HttpGet]
        public async Task<IActionResult> GetMyDues()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return BadRequest("Kullanıcı bulunamadı");

            var dues = await _context.Dues
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.Amount,
                    d.Description,
                    d.IsPaid,
                    d.CreatedAt
                })
                .ToListAsync();

            return Ok(dues);
        }

        // Kullanıcı kendi aidatını ödenmiş olarak işaretler
        [HttpPut("{id}/pay")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return BadRequest("Kullanıcı bulunamadı");

            var due = await _context.Dues.FirstOrDefaultAsync(d => d.Id == id);
            if (due == null) return NotFound();
            if (due.UserId != userId) return Forbid();

            if (!due.IsPaid)
            {
                due.IsPaid = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}


