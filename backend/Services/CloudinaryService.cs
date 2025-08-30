using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;

namespace backend.Services
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        // Cloudinary instance'ı Program.cs'de DI ile sağlanır
        public CloudinaryService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        /// <summary>
        /// Dosya yükleme işlemi (genel)
        /// </summary>
        /// <param name="file">Yüklenecek dosya</param>
        /// <param name="folder">Klasör adı (opsiyonel)</param>
        /// <returns>Yüklenen dosyanın URL'i</returns>
        public async Task<string> UploadFileAsync(IFormFile file, string folder = "sitekontrol")
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("Dosya bulunamadı.");

                // Dosya boyutu kontrolü (10MB)
                if (file.Length > 10 * 1024 * 1024)
                    throw new ArgumentException("Dosya boyutu 10MB'dan büyük olamaz.");

                using var stream = file.OpenReadStream();
                var uploadParams = new RawUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                throw new Exception($"Dosya yüklenirken hata: {ex.Message}");
            }
        }

        /// <summary>
        /// Resim yükleme işlemi
        /// </summary>
        /// <param name="file">Yüklenecek dosya</param>
        /// <param name="folder">Klasör adı (opsiyonel)</param>
        /// <returns>Yüklenen resmin URL'i</returns>
        public async Task<string> UploadImageAsync(IFormFile file, string folder = "sitekontrol")
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("Dosya bulunamadı.");

                // Dosya türü kontrolü
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    throw new ArgumentException("Sadece resim dosyaları yüklenebilir.");

                // Dosya boyutu kontrolü (5MB)
                if (file.Length > 5 * 1024 * 1024)
                    throw new ArgumentException("Dosya boyutu 5MB'dan büyük olamaz.");

                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder,
                    Transformation = new Transformation()
                        .Height(800)
                        .Width(800)
                        .Crop("limit") // Boyut sınırı
                        .Quality("auto") // Otomatik kalite optimizasyonu
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                throw new Exception($"Resim yüklenirken hata: {ex.Message}");
            }
        }

        /// <summary>
        /// Resim silme işlemi
        /// </summary>
        /// <param name="publicId">Cloudinary public ID</param>
        /// <returns>Silme işlemi sonucu</returns>
        public async Task<bool> DeleteImageAsync(string publicId)
        {
            try
            {
                if (string.IsNullOrEmpty(publicId))
                    return false;

                var deleteParams = new DeletionParams(publicId);
                var result = await _cloudinary.DestroyAsync(deleteParams);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                throw new Exception($"Resim silinirken hata: {ex.Message}");
            }
        }

        /// <summary>
        /// URL'den public ID çıkarma
        /// </summary>
        /// <param name="url">Cloudinary URL</param>
        /// <returns>Public ID</returns>
        public string? GetPublicIdFromUrl(string url)
        {
            try
            {
                if (string.IsNullOrEmpty(url))
                    return null;

                var uri = new Uri(url);
                var segments = uri.Segments;
                
                // URL formatı: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
                // Public ID: folder/filename
                var uploadIndex = Array.IndexOf(segments, "upload/");
                if (uploadIndex >= 0 && uploadIndex + 2 < segments.Length)
                {
                    var folderAndFile = segments.Skip(uploadIndex + 2).ToArray();
                    return string.Join("", folderAndFile).Replace(".jpg", "").Replace(".png", "").Replace(".gif", "").Replace(".webp", "");
                }

                return null;
            }
            catch
            {
                return null;
            }
        }
    }
} 