# GovConnect AI Feature Updates

## Perubahan yang Dilakukan

### 1. AI Model Configuration
- **Primary Model**: `gemini-2.5-flash`
- **Fallback Model**: `gemini-2.0-flash` (digunakan jika primary gagal)
- File yang diubah:
  - `govconnect-ai-service/src/config/env.ts`
  - `govconnect-ai-service/src/services/llm.service.ts`

### 2. AI Chatbot On/Off Setting
Admin (superadmin) dapat mengaktifkan/menonaktifkan AI chatbot melalui dashboard.
- Jika **ON**: AI akan merespons semua pesan WhatsApp masuk
- Jika **OFF**: Pesan diabaikan, tidak ada respons AI

Setting disimpan di tabel `system_settings` dengan key `ai_chatbot_enabled`.

### 3. Knowledge Base Feature
Admin dapat mengelola knowledge base yang digunakan AI untuk menjawab pertanyaan warga.

**Kategori Knowledge:**
- `informasi_umum` - Informasi umum tentang kelurahan
- `layanan` - Daftar layanan yang tersedia
- `prosedur` - Cara/prosedur mengurus sesuatu
- `jadwal` - Jadwal layanan, jam operasional
- `kontak` - Nomor telepon, alamat kantor
- `faq` - Pertanyaan yang sering ditanyakan

**Fitur:**
- CRUD knowledge entries
- Search by title, content, keywords
- Filter by category
- Priority ordering
- Active/inactive status

### 4. Intent Classification

AI sekarang mengklasifikasikan pesan ke dalam 5 intent:

| Intent | Kapan Digunakan | Butuh Knowledge |
|--------|-----------------|-----------------|
| `CREATE_COMPLAINT` | User ingin melapor masalah (jalan rusak, lampu mati, dll) | ❌ |
| `CREATE_TICKET` | User ingin mengajukan layanan (surat, izin) | ❌ |
| `KNOWLEDGE_QUERY` | User bertanya tentang informasi (jam buka, syarat, dll) | ✅ |
| `QUESTION` | Pertanyaan sederhana (halo, cara pakai, dll) | ❌ |
| `UNKNOWN` | Tidak jelas maksudnya | ❌ |

## File Baru yang Dibuat

### Dashboard API Routes
```
app/api/settings/route.ts           - GET/PUT/POST settings
app/api/internal/settings/route.ts  - Internal API untuk AI service
app/api/knowledge/route.ts          - GET/POST knowledge
app/api/knowledge/[id]/route.ts     - GET/PUT/DELETE knowledge by ID
app/api/internal/knowledge/route.ts - Internal API untuk AI search knowledge
```

### Dashboard Pages
```
app/dashboard/knowledge/page.tsx    - Halaman manage knowledge base
```

### AI Service
```
src/services/knowledge.service.ts   - Service untuk query knowledge
src/services/settings.service.ts    - Service untuk get settings
```

## Database Schema Baru

Tambahkan di `govconnect-dashboard/prisma/schema.prisma`:

```prisma
model system_settings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   @db.Text
  description String?
  updated_at  DateTime @updatedAt
  created_at  DateTime @default(now())
  
  @@schema("dashboard")
}

model knowledge_base {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  category    String
  keywords    String[]
  is_active   Boolean  @default(true)
  priority    Int      @default(0)
  admin_id    String?
  updated_at  DateTime @updatedAt
  created_at  DateTime @default(now())
  
  @@index([category])
  @@index([is_active])
  @@index([keywords])
  @@schema("dashboard")
}
```

## Cara Deploy

### 1. Generate Prisma Client
```bash
cd govconnect-dashboard
pnpm prisma generate
pnpm prisma migrate dev --name add-settings-and-knowledge
```

### 2. Seed Data (Opsional)
```bash
pnpm prisma db seed
```
Seed akan membuat:
- Default system settings
- Sample knowledge base entries

### 3. Rebuild Services
```bash
docker compose build ai-service dashboard
docker compose up -d ai-service dashboard
```

## Environment Variables Baru

### AI Service
```env
DASHBOARD_SERVICE_URL=http://dashboard:3000
LLM_MODEL=gemini-2.5-flash
LLM_FALLBACK_MODEL=gemini-2.0-flash
```

## Flow Diagram

```
User sends message via WhatsApp
         │
         ▼
┌─────────────────────────────────┐
│     Channel Service             │
│  - Save message                 │
│  - Publish to RabbitMQ          │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     AI Orchestrator             │
│                                 │
│  1. Check: AI enabled?          │
│     - No → Skip (no reply)      │
│     - Yes → Continue            │
│                                 │
│  2. Build context + Call LLM    │
│                                 │
│  3. Intent detection:           │
│     - CREATE_COMPLAINT → Case   │
│     - CREATE_TICKET → Case      │
│     - KNOWLEDGE_QUERY → Search  │
│       knowledge + 2nd LLM call  │
│     - QUESTION → Direct reply   │
│     - UNKNOWN → Fallback reply  │
│                                 │
│  4. Publish AI reply            │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     Notification Service        │
│  - Send reply via Channel Svc   │
└─────────────────────────────────┘
```

## Contoh Penggunaan Knowledge

**User**: "jam buka kantor kelurahan?"

**AI Flow**:
1. Deteksi intent: `KNOWLEDGE_QUERY`
2. Search knowledge dengan keyword "jam", "buka"
3. Temukan entry "Jam Operasional Kantor Kelurahan"
4. Panggil LLM kedua dengan knowledge context
5. Generate jawaban berdasarkan knowledge

**Response**: "Kantor Kelurahan buka pada hari Senin - Jumat, pukul 08:00 - 16:00 WIB. Istirahat pukul 12:00 - 13:00 WIB."
