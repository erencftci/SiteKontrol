using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CameraController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CameraController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Listele: Güvenlik ve Yönetici görebilir
        [HttpGet]
        [Authorize(Roles = "Güvenlik,Site Yöneticisi")]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Cameras
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new {
                    c.Id,
                    c.Name,
                    c.Location,
                    c.IpAddress,
                    c.Status,
                    c.Recording,
                    c.Resolution,
                    LastMaintenance = c.LastMaintenance,
                    StorageUsed = c.StorageUsedPercent
                })
                .ToListAsync();
            return Ok(list);
        }

        //aktif kamera sayısı
        [HttpGet("active-count")]
        [Authorize(Roles = "Site Yöneticisi")]
        public async Task<IActionResult> GetActiveCount()
        {
            var count = await _context.Cameras.CountAsync(c => c.Status != "Arızalı");
            return Ok(new { active = count });
        }

        //güvenlik ekleyebilir
        [HttpPost]
        [Authorize(Roles = "Güvenlik")]
        public async Task<IActionResult> Create([FromBody] Camera dto)
        {
            if (dto == null) return BadRequest("Geçersiz veri");
            var entity = new Camera
            {
                Name = dto.Name,
                Location = dto.Location,
                IpAddress = dto.IpAddress,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Aktif" : dto.Status,
                Recording = dto.Recording,
                Resolution = string.IsNullOrWhiteSpace(dto.Resolution) ? "1080p" : dto.Resolution,
                LastMaintenance = dto.LastMaintenance,
                StorageUsedPercent = dto.StorageUsedPercent
            };
            _context.Cameras.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(new { entity.Id });
        }

        //hüvenlik düzenleyebilir
        [HttpPut("{id}")]
        [Authorize(Roles = "Güvenlik")]
        public async Task<IActionResult> Update(int id, [FromBody] Camera dto)
        {
            if (dto == null) return BadRequest("Geçersiz veri");
            var cam = await _context.Cameras.FindAsync(id);
            if (cam == null) return NotFound();

            cam.Name = dto.Name;
            cam.Location = dto.Location;
            cam.IpAddress = dto.IpAddress;
            cam.Status = string.IsNullOrWhiteSpace(dto.Status) ? cam.Status : dto.Status;
            cam.Recording = dto.Recording;
            cam.Resolution = dto.Resolution ?? cam.Resolution;
            cam.LastMaintenance = dto.LastMaintenance;
            cam.StorageUsedPercent = dto.StorageUsedPercent;
            cam.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Sil: Güvenlik silebilir
        [HttpDelete("{id}")]
        [Authorize(Roles = "Güvenlik")]
        public async Task<IActionResult> Delete(int id)
        {
            var cam = await _context.Cameras.FindAsync(id);
            if (cam == null) return NotFound();
            _context.Cameras.Remove(cam);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}


