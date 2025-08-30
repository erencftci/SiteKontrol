using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    // Tüm tablolar ve veri tabanı burada yönetilir.
    public class ApplicationDbContext : DbContext
    {
        // Users
        public DbSet<User> Users { get; set; }
        
        // Announcements
        public DbSet<Announcement> Announcements { get; set; }
        
        // Visitors
        public DbSet<Visitor> Visitors { get; set; }
        
        // Requests
        public DbSet<Request> Requests { get; set; }
        public DbSet<RequestPhoto> RequestPhotos { get; set; }
        
        // Parcels
        public DbSet<Parcel> Parcels { get; set; }
        
        // Messages
        public DbSet<Message> Messages { get; set; }
        public DbSet<ParcelNote> ParcelNotes { get; set; }
        
        // RegistrationRequests
        public DbSet<RegistrationRequest> RegistrationRequests { get; set; }
        public DbSet<Due> Dues { get; set; }

        // Kapıcıya özel tablolar
        public DbSet<CaretakerAssignment> CaretakerAssignments { get; set; }
        public DbSet<DailyTask> DailyTasks { get; set; }
        public DbSet<MonthlyRequirement> MonthlyRequirements { get; set; }
        public DbSet<MonthlyCompletion> MonthlyCompletions { get; set; }

        public DbSet<Photo> Photos { get; set; }

        // Okunma/Seen tabloları
        public DbSet<AnnouncementRead> AnnouncementReads { get; set; }
        public DbSet<RequestRead> RequestReads { get; set; }
        public DbSet<VisitorRead> VisitorReads { get; set; }

        // Cameras
        public DbSet<Camera> Cameras { get; set; }

        // Bağlantı ayarları
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}