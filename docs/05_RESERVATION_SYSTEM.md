# Sistem Reservasi Layanan Pemerintahan

## 📋 Overview

Sistem Reservasi menggantikan sistem Tiket sebelumnya dengan fitur yang lebih lengkap untuk membantu warga melakukan reservasi kedatangan ke kantor kelurahan.

## 🎯 Fitur Utama

### 1. Layanan Pemerintahan (Fixed)
Daftar layanan sudah tetap dan tidak bisa ditambah/dihapus. Admin hanya bisa:
- **Toggle Aktif/Nonaktif** - Mengaktifkan atau menonaktifkan layanan
- **Toggle Online** - Mengaktifkan atau menonaktifkan reservasi online

### 2. Daftar Layanan

| Kode | Nama Layanan | Kategori |
|------|--------------|----------|
| SKD | Surat Keterangan Domisili | Administrasi |
| SKU | Surat Keterangan Usaha | Administrasi |
| SKTM | Surat Keterangan Tidak Mampu | Sosial |
| SKBM | Surat Keterangan Belum Menikah | Administrasi |
| IKR | Izin Keramaian | Perizinan |
| SPKTP | Surat Pengantar KTP | Kependudukan |
| SPKK | Surat Pengantar Kartu Keluarga | Kependudukan |
| SPSKCK | Surat Pengantar SKCK | Kependudukan |
| SPAKTA | Surat Pengantar Akta | Kependudukan |
| SKK | Surat Keterangan Kematian | Sosial |
| SPP | Surat Pengantar Pindah | Kependudukan |

### 3. Data Umum Warga (Wajib)
Pertanyaan standar yang ditanyakan untuk SEMUA layanan:
1. **nama_lengkap** - Nama sesuai KTP
2. **nik** - NIK 16 digit
3. **alamat** - Alamat tempat tinggal
4. **no_hp** - Nomor HP yang bisa dihubungi

### 4. Pertanyaan Tambahan per Layanan
Setiap layanan memiliki pertanyaan spesifik tambahan, contoh:
- **SKD**: keperluan
- **SKU**: nama_usaha, jenis_usaha, alamat_usaha
- **IKR**: nama_acara, jenis_acara, tanggal_acara, lokasi_acara, jumlah_tamu

## 🔄 Flow Reservasi

### Via WhatsApp (Async)

```
User: "mau buat surat domisili"
    ↓
Channel Service: Receive webhook → Publish to RabbitMQ
    ↓
AI Service: Consume message → 2-Layer Processing
    ↓
Layer 1: Deteksi intent CREATE_RESERVATION, service_code: SKD
    ↓
Layer 2: Generate response, tanyakan data
    ↓
AI: Tanyakan data umum satu per satu
    - nama_lengkap
    - nik
    - alamat
    - no_hp
    ↓
AI: Tanyakan pertanyaan tambahan (keperluan)
    ↓
AI: Tanyakan tanggal dan jam kedatangan
    ↓
AI: Konfirmasi semua data
    ↓
System: Buat reservasi dengan nomor RSV-YYYYMMDD-XXX
    ↓
AI: Kirim konfirmasi + persyaratan dokumen via RabbitMQ
```

### Via Webchat (Sync)

```
User: "mau buat surat domisili"
    ↓
Webchat Widget: POST /api/webchat
    ↓
AI Service: Synchronous 2-Layer Processing
    ↓
Layer 1: Deteksi intent CREATE_RESERVATION, service_code: SKD
    ↓
Layer 2: Generate response, tanyakan data
    ↓
HTTP Response: Return response langsung ke widget
    ↓
(Conversation continues via HTTP request/response)
    ↓
System: Buat reservasi dengan nomor RSV-YYYYMMDD-XXX
    ↓
HTTP Response: Konfirmasi + persyaratan dokumen
```

### Perbedaan Channel

| Aspect | WhatsApp | Webchat |
|--------|----------|---------|
| Processing | Async (RabbitMQ) | Sync (HTTP) |
| User ID | Phone (628xxx) | Session (web_xxx) |
| Response Delivery | WhatsApp API | HTTP Response |
| Session Persistence | Database | In-memory + DB sync |

## 📊 Status Reservasi

| Status | Deskripsi |
|--------|-----------|
| pending | Reservasi baru dibuat, menunggu konfirmasi |
| confirmed | Dikonfirmasi oleh admin |
| arrived | Warga sudah hadir di kantor |
| completed | Layanan selesai |
| cancelled | Dibatalkan |
| no_show | Warga tidak hadir |

## 🛠️ API Endpoints

### Services
```
GET  /reservasi/services           # Semua layanan (admin)
GET  /reservasi/services/active    # Layanan aktif (public)
GET  /reservasi/services/:code     # Detail layanan + pertanyaan
PATCH /reservasi/services/:code/toggle-active
PATCH /reservasi/services/:code/toggle-online
```

### Slots
```
GET  /reservasi/slots/:code/:date  # Cek slot tersedia
```

### Reservations
```
POST /reservasi/create             # Buat reservasi (dari AI)
GET  /reservasi                    # List reservasi (dashboard)
GET  /reservasi/:id                # Detail reservasi
PATCH /reservasi/:id/status        # Update status
POST /reservasi/:id/cancel         # Batalkan (user)
GET  /reservasi/statistics         # Statistik
GET  /reservasi/history/:wa_user_id # Riwayat user
```

## 🗄️ Database Schema

### Service
```prisma
model Service {
  id                  String   @id
  code                String   @unique
  name                String
  description         String
  category            String
  is_active           Boolean  @default(true)
  is_online_available Boolean  @default(true)
  requirements        String[]
  sop_steps           String[]
  estimated_duration  Int
  daily_quota         Int
  operating_hours     Json?
}
```

### Reservation
```prisma
model Reservation {
  id               String   @id
  reservation_id   String   @unique  // RSV-YYYYMMDD-XXX
  wa_user_id       String
  service_id       String
  citizen_data     Json     // {nama_lengkap, nik, alamat, no_hp, ...}
  reservation_date DateTime
  reservation_time String
  queue_number     Int
  status           String
  admin_notes      String?
  cancel_reason    String?
}
```

## 🎨 Dashboard Features

### Halaman Reservasi (/dashboard/reservasi)
- List semua reservasi
- Filter by status, tanggal, layanan
- Search by nama, nomor reservasi
- Detail reservasi + update status

### Halaman Layanan (/dashboard/layanan)
- List semua layanan dengan toggle
- Toggle aktif/nonaktif
- Toggle reservasi online
- Lihat persyaratan per layanan

## 📝 Knowledge Base Integration

AI akan membaca SOP dari knowledge base jika tersedia. Jika tidak ada, gunakan default dari config.

Prioritas:
1. Knowledge Base (jika ada)
2. Default dari `services.ts`
