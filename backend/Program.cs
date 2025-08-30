using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Services;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers(); // Controller'ları ekliyoruz
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Veritabanı bağlantı ayarını ekliyoruz
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite("Data Source=sitekontrol.db")); // SQLite dosyası proje kökünde olacak

// JWT servisini ekliyoruz
builder.Services.AddScoped<JwtService>();

// Cloudinary servisinin DI container'a eklenmesi
builder.Services.AddSingleton<CloudinaryDotNet.Cloudinary>(provider => {
    var config = provider.GetRequiredService<IConfiguration>();
    var account = new CloudinaryDotNet.Account(
        config["Cloudinary:cloud_name"],
        config["Cloudinary:api_key"],
        config["Cloudinary:api_secret"]
    );
    return new CloudinaryDotNet.Cloudinary(account);
});
builder.Services.AddScoped<backend.Services.CloudinaryService>();
builder.Services.AddSignalR();

// JWT Authentication ayarları
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "your-super-secret-key-with-at-least-32-characters");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Authorization ekliyoruz
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();

// Authentication ve Authorization middleware'lerini ekliyoruz
app.UseAuthentication();
app.UseAuthorization();

// Controller'ları kullanabilmek için routing ekliyoruz
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

// İlk çalıştırmada admin hesaplarını oluştur (sadece bir kez)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        await SeedAdminUsers(context);
        Console.WriteLine("Admin hesapları kontrol edildi.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Admin hesapları oluşturulurken hata: {ex.Message}");
    }
}

app.Run();

// Admin hesaplarını oluşturan fonksiyon
static async Task SeedAdminUsers(ApplicationDbContext context)
{
    var admin1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin1@sitekontrol.com");
    if (admin1 == null)
    {
        context.Users.Add(new User
        {
            Name = "Admin 1",
            Email = "admin1@sitekontrol.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = "Site Yöneticisi",
            CreatedAt = DateTime.UtcNow
        });
    }

    var admin2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin2@sitekontrol.com");
    if (admin2 == null)
    {
        context.Users.Add(new User
        {
            Name = "Admin 2",
            Email = "admin2@sitekontrol.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = "Site Yöneticisi",
            CreatedAt = DateTime.UtcNow
        });
    }

    await context.SaveChangesAsync();
}
