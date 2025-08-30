using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhotoController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly CloudinaryService _cloudinaryService;

        public PhotoController(ApplicationDbContext context, CloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // Fotoğraf yükleme endpoint'i
        [HttpPost("upload")]
        [Authorize] // Giriş yapmış herkes yükleyebilir
        public async Task<IActionResult> UploadPhoto([FromForm] IFormFile file, [FromForm] string? description)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Dosya seçilmedi.");

            // Cloudinary'ye yükle
            var url = await _cloudinaryService.UploadImageAsync(file);

            // Veritabanına kaydet
            var photo = new Photo
            {
                Url = url,
                Description = description
            };
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            return Ok(photo);
        }

        // Yüklenen tüm fotoğrafları listele
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPhotos()
        {
            var photos = await _context.Photos.OrderByDescending(p => p.UploadedAt).ToListAsync();
            return Ok(photos);
        }
    }
} 