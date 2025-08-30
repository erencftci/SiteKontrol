## SiteKontrol — Konut Sitesi Yönetim Sistemi

Modern, rol tabanlı (RBAC) bir site yönetim platformu. Duyurular, talepler, kargo/parsel, ziyaretçiler, kameralar, mesajlaşma ve bildirimler tek uygulamada.

### Teknolojiler
- **Backend**: ASP.NET Core, Entity Framework Core (SQLite), JWT Authentication, SignalR, Cloudinary
- **Frontend**: React, Material UI (MUI), Framer Motion, Recharts, @microsoft/signalr
- **Veritabanı**: SQLite

### Roller ve Yetkiler
- **Site Sakini (Resident)**
  - Duyuruları okur (oluşturamaz).
  - Sadece kendi bloğundaki kapıcı(lar)a talep oluşturur; kendi taleplerini ve genel talepleri görür.
  - Kargolarım: Kendi kargolarını görür, teslim edilmediyse not bırakabilir.
  - Ziyaretçiler: Sadece kendi ziyaretçilerini görür.
  - Mesajlaşma: Tüm kullanıcılara mesaj gönderebilir/alabilir.
  - Bildirim: Hedefli talepler, yeni mesajlar ve ziyaretçi olayları için bildirim alır.

- **Kapıcı (Caretaker)**
  - Aylık Görevlerim: Yönetici tarafından atanan gereklilikleri görür ve tamamlar.
  - Talepler: Yalnızca kendisine hedeflenen talepleri görür/yanıtlar; durum günceller.
  - Duyuru: Sadece sorumlu olduğu blok(lar) için duyuru yayınlayabilir; bu duyuruları ilgili blok sakinleri görür.
  - Kargolar: Sorumlu olduğu blok(lar)ın kargolarını görür; “Teslim Edildi” olarak işaretler.
  - Dashboard: Haftalık ziyaretçi/kargo grafikleri, Misafir Otopark doluluğu.

- **Güvenlik (Security)**
  - Ziyaretçi kaydı ve statü yönetimi (Onay/Reddet). Araçlı ziyaretçilerle Misafir Otopark doluluğu gerçek zamanlı güncellenir.
  - Kamera Kontrol: Kamera ekle/düzenle/sil, aktif/arızalı, kayıt başlat/durdur.
  - Kargo: Kargoyu kaydeder (blok/daire seçer); teslim etmez.
  - Talepler menüsüne erişim yoktur.
  - Dashboard: Misafir Otopark doluluğu ve kamera istatistikleri.

- **Site Yöneticisi (Admin)**
  - Kullanıcılar: Kullanıcı yönetimi; kapıcı atamaları (blok seçimi, o bloktaki mevcut kapıcıları görüntüleme).
  - Kayıt İstekleri: Onay/Reddet (kapıcı onayında FK hatasını önlemek için kullanıcıyı önce kaydedip sonra atama yapılır).
  - Aylık Gereklilikler: Tablo bazlı yönetim, “Kapıcı Durumları” sütununda kim tamamladı görünümü.
  - Duyurular: Genel duyuru yayınlar (tüm roller görür).
  - Talepler: Yöneticiye hedeflenen talepleri tamamlandı yapabilir.
  - Dashboard: Aktif kamera sayısı ve genel istatistikler.

### Mimari ve Proje Yapısı
- **REST API + DTO’lar** (ASP.NET Core)
- **EF Core Migrations** (SQLite)
- **JWT** ile kimlik doğrulama; istemci tarafında `ProtectedRoute`
- **SignalR Hubs**: Gerçek zamanlı mesaj ve bildirim
- **Cloudinary**: Fotoğraf yükleme/önizleme

Klasörler:
- `backend/` — ASP.NET Core API, EF Core, SignalR, Cloudinary servisi
- `frontend/` — React uygulaması (MUI, SignalR, Recharts)
- `config/` — örnek ayarlar (varsa)

### Hızlı Başlangıç

Önkoşullar:
- .NET SDK 7+ (veya 8)
- Node.js 18+ ve npm
- Cloudinary hesabı (fotoğraf için önerilir)

Backend:
```bash
cd backend
dotnet restore
dotnet build
dotnet ef database update
dotnet run
# API: http://localhost:5223/api
# SignalR: http://localhost:5223/hubs/chat
```

Frontend:
```bash
cd frontend
npm install
# (Opsiyonel) API adresini .env ile verin:
# REACT_APP_API_URL=http://localhost:5223/api
npm start
# Uygulama: http://localhost:3000
```

### Varsayılan Admin Hesapları
- E-posta: `admin1@sitekontrol.com` — Şifre: `Admin123!`
- E-posta: `admin2@sitekontrol.com` — Şifre: `Admin123!`
> İlk girişten sonra şifreleri değiştirmeniz önerilir.

### Konfigürasyon Örnekleri

Backend `appsettings.Development.json`:
```json
{
  "Jwt": {
    "Issuer": "SiteKontrol",
    "Audience": "SiteKontrolUsers",
    "SecretKey": "your-super-secret-key-with-at-least-32-characters"
  },
  "Cloudinary": {
    "cloud_name": "YOUR_CLOUD_NAME",
    "api_key": "YOUR_API_KEY",
    "api_secret": "YOUR_API_SECRET"
  },
  "Logging": { "LogLevel": { "Default": "Information" } }
}
```

Frontend `.env` (opsiyonel):
```env
REACT_APP_API_URL=http://localhost:5223/api
```

### Öne Çıkan Özellikler
- Duyuru Yönetimi: Arama/filtre, blok ve role göre görünürlük, yatay taşma yok.
- Aylık Gereklilikler: Admin için tek tablo + kapıcı durumları; kapıcı için “Aylık Görevlerim”.
- Talepler: Blok bazlı hedefleme; çoklu fotoğraf (Cloudinary); yanıt/yorumlar; admin tamamlama.
- Kargolar: Güvenlik kayıt, Kapıcı teslim, Sakin not; rol bazlı görünürlük; “Blok/Daire” odaklı kartlar.
- Ziyaretçiler/Misafir Otoparkı: 80 kapasiteli, gerçek zamanlı doluluk.
- Kamera Kontrol: CRUD, aktif/arızalı, kayıt toggle; admin dashboard’da aktif kamera sayısı.
- Mesajlaşma: Sosyal medya benzeri UI, fotoğraf gönderme, gerçek zamanlı, okunmamış sayacı.
- Bildirimler: Mesaj/talep/ziyaretçi; “Tümünü temizle” veya tek tek.

### Sık Karşılaşılan Sorunlar
- “Cloud name must be specified”: Cloudinary ayarlarını `appsettings.*.json` dosyasına ekleyin.
- “no such column …”: EF migration ve `dotnet ef database update` çalıştırın.
- “backend.exe locked”: Çalışan `dotnet run` sürecini kapatıp yeniden build edin.
- Tarih parse hatası: Frontend’te tarihleri ISO 8601 (`.toISOString()`) gönderin.

### Katkı
Öneri ve katkılar PR/Issue olarak memnuniyetle karşılanır.
