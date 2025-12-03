# 📊 GOVCONNECT - SERVICE ARCHITECTURE DOCUMENTATION

Dokumen ini menjelaskan **kegunaan dan fungsi** setiap service dalam arsitektur GovConnect.

---

## 🏗️ OVERVIEW ARSITEKTUR

GovConnect adalah sistem **Layanan Pemerintah berbasis WhatsApp dengan AI** yang dibangun menggunakan **Microservices Architecture** dengan 5 services utama.

### Diagram Arsitektur

```
                                    ┌─────────────────┐
                                    │   WARGA/MASYARAKAT  │
                                    │    (WhatsApp)       │
                                    └─────────┬───────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Traefik/NGINX)                            │
│  • Routing          • Rate Limiting      • SSL Termination   • Load Balancing  │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────────┐    ┌───────────────────────┐    ┌───────────────────┐
│  SERVICE 1        │    │     SERVICE 4         │    │   INFRASTRUCTURE  │
│  CHANNEL SERVICE  │    │     DASHBOARD         │    │                   │
│  (Port 3001)      │    │     (Port 3000)       │    │  ┌─────────────┐  │
│                   │    │                       │    │  │ PostgreSQL  │  │
│  • WhatsApp       │    │  • Admin Login        │    │  │   (5432)    │  │
│    Webhook        │    │  • View Laporan       │    │  └─────────────┘  │
│  • FIFO 30 Msg    │    │  • View Tiket         │    │                   │
│  • Live Chat      │    │  • Statistik          │    │  ┌─────────────┐  │
│  • Media Upload   │    │  • AI Settings        │    │  │  RabbitMQ   │  │
│                   │    │  • Knowledge Base     │    │  │   (5672)    │  │
│  DB: channel      │    │                       │    │  └─────────────┘  │
│      schema       │    │  DB: dashboard schema │    │                   │
└─────────┬─────────┘    └───────────┬───────────┘    └───────────────────┘
          │                          │
          │ (RabbitMQ Event)         │ (REST API)
          ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE 2: AI ORCHESTRATOR                             │
│                              (Port 3002)                                       │
│                                                                               │
│  • Consume: whatsapp.message.received                                         │
│  • Fetch chat history dari Channel Service                                    │
│  • Call LLM (Gemini) dengan structured output                                 │
│  • Intent Detection: CREATE_COMPLAINT | CREATE_TICKET | QUESTION | UNKNOWN   │
│  • SYNC call ke Case Service untuk buat laporan/tiket                         │
│  • Publish: govconnect.ai.reply                                               │
│                                                                               │
│  ❌ STATELESS - No Database (sesuai requirement)                              │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    ▼ (SYNC REST API)
┌───────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE 3: CASE SERVICE                                │
│                              (Port 3003)                                       │
│                                                                               │
│  • POST /laporan/create - Buat laporan baru                                   │
│  • GET /laporan - Daftar semua laporan                                        │
│  • PATCH /laporan/:id/status - Update status                                  │
│  • POST /tiket/create - Buat tiket layanan                                    │
│  • GET /statistics - Data untuk dashboard                                     │
│  • Publish events: govconnect.complaint.created, govconnect.status.updated    │
│                                                                               │
│  DB: cases schema (complaints, tickets tables)                                │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    ▼ (RabbitMQ Event)
┌───────────────────────────────────────────────────────────────────────────────┐
│                      SERVICE 5: NOTIFICATION SERVICE                           │
│                              (Port 3004)                                       │
│                                                                               │
│  • Consume: govconnect.ai.reply                                               │
│  • Consume: govconnect.complaint.created                                      │
│  • Consume: govconnect.status.updated                                         │
│  • Build notification templates                                               │
│  • POST ke Channel Service untuk kirim WhatsApp                               │
│  • Log semua notification (success/failed)                                    │
│                                                                               │
│  DB: notification schema (notification_logs table)                            │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 DETAIL SETIAP SERVICE

### SERVICE 1: CHANNEL SERVICE

**Port**: 3001  
**Tech Stack**: Express.js + TypeScript + Prisma  
**Database Schema**: `channel`

#### Fungsi Utama
| Fungsi | Deskripsi |
|--------|-----------|
| **WhatsApp Webhook** | Menerima pesan masuk dari WhatsApp Cloud API |
| **FIFO 30 Messages** | Menyimpan maksimal 30 pesan terakhir per user |
| **Send Messages** | API internal untuk kirim pesan WhatsApp |
| **Live Chat** | Daftar conversation untuk admin takeover |
| **Media Upload** | Handle upload foto dari user |
| **Takeover Management** | Admin bisa ambil alih chat dari AI |

#### Endpoints
```
GET  /webhook/whatsapp     - Verify webhook
POST /webhook/whatsapp     - Receive WhatsApp message
POST /internal/send        - Send WhatsApp message
GET  /internal/messages    - Get chat history (FIFO 30)
GET  /internal/conversations - List all conversations
POST /internal/takeover    - Admin takeover conversation
GET  /health               - Health check
```

#### RabbitMQ Events
- **Publish**: `whatsapp.message.received`

#### Database Tables
```sql
-- messages: Semua pesan masuk/keluar
CREATE TABLE channel.messages (
  id, wa_user_id, message_id, message_text, direction, source, timestamp
);

-- conversations: Summary percakapan untuk live chat
CREATE TABLE channel.conversations (
  id, wa_user_id, user_name, last_message, unread_count, is_takeover
);

-- takeover_sessions: Log admin takeover
CREATE TABLE channel.takeover_sessions (
  id, wa_user_id, admin_id, admin_name, started_at, ended_at
);
```

---

### SERVICE 2: AI ORCHESTRATOR

**Port**: 3002  
**Tech Stack**: Express.js + TypeScript + Google Gemini SDK  
**Database**: ❌ **STATELESS** (No Database)

#### Fungsi Utama
| Fungsi | Deskripsi |
|--------|-----------|
| **Message Consumer** | Listen event dari RabbitMQ |
| **Context Builder** | Fetch 30 messages untuk context LLM |
| **LLM Integration** | Call Gemini API dengan structured output |
| **Intent Detection** | Klasifikasi: COMPLAINT, TICKET, QUESTION, UNKNOWN |
| **Field Extraction** | Ekstrak: kategori, alamat, deskripsi |
| **Case Creation** | SYNC call ke Case Service |

#### Flow Proses
```
1. Consume event: whatsapp.message.received
2. GET /internal/messages dari Channel Service (30 messages)
3. Build prompt dengan context + system prompt
4. Call Gemini API → JSON structured output
5. Parse intent dan fields
6. IF intent == CREATE_COMPLAINT → POST /laporan/create
7. IF intent == CREATE_TICKET → POST /tiket/create
8. Publish event: govconnect.ai.reply dengan reply_text
```

#### RabbitMQ Events
- **Consume**: `whatsapp.message.received`
- **Publish**: `govconnect.ai.reply`

#### LLM Output Schema
```json
{
  "intent": "CREATE_COMPLAINT | CREATE_TICKET | QUESTION | UNKNOWN",
  "fields": {
    "kategori": "jalan_rusak | lampu_mati | sampah | ...",
    "deskripsi": "Deskripsi detail masalah",
    "alamat": "Alamat lengkap",
    "rt_rw": "RT XX RW YY"
  },
  "reply_text": "Balasan ramah untuk user",
  "guidance_text": "Panduan jika butuh info tambahan"
}
```

---

### SERVICE 3: CASE SERVICE

**Port**: 3003  
**Tech Stack**: Express.js + TypeScript + Prisma  
**Database Schema**: `cases`

#### Fungsi Utama
| Fungsi | Deskripsi |
|--------|-----------|
| **Complaint Management** | CRUD untuk laporan warga |
| **Ticket Management** | CRUD untuk tiket layanan |
| **Status Update** | Update status laporan/tiket |
| **Statistics API** | Provide data untuk dashboard |
| **Event Publishing** | Trigger notification saat status berubah |

#### Endpoints
```
POST   /laporan/create       - Buat laporan baru
GET    /laporan              - List laporan (with filters)
GET    /laporan/:id          - Detail laporan
PATCH  /laporan/:id/status   - Update status
POST   /tiket/create         - Buat tiket baru
GET    /tiket                - List tiket
GET    /tiket/:id            - Detail tiket
PATCH  /tiket/:id/status     - Update status
GET    /statistics/overview  - Dashboard statistics
GET    /health               - Health check
```

#### RabbitMQ Events
- **Publish**: `govconnect.complaint.created`
- **Publish**: `govconnect.ticket.created`
- **Publish**: `govconnect.status.updated`

#### Database Tables
```sql
-- complaints: Laporan/pengaduan warga
CREATE TABLE cases.complaints (
  id, complaint_id, wa_user_id, kategori, deskripsi, 
  alamat, rt_rw, foto_url, status, admin_notes, created_at, updated_at
);

-- tickets: Tiket layanan administratif
CREATE TABLE cases.tickets (
  id, ticket_id, wa_user_id, jenis, data_json, 
  status, admin_notes, created_at, updated_at
);
```

#### Kategori Laporan
| Kategori | Deskripsi |
|----------|-----------|
| `jalan_rusak` | Jalan berlubang, rusak |
| `lampu_mati` | Lampu jalan mati/rusak |
| `sampah` | Sampah menumpuk |
| `drainase` | Saluran air tersumbat |
| `pohon_tumbang` | Pohon tumbang |
| `fasilitas_rusak` | Fasilitas umum rusak |

#### Jenis Tiket
| Jenis | Deskripsi |
|-------|-----------|
| `surat_keterangan` | Surat keterangan domisili, usaha, dll |
| `surat_pengantar` | Surat pengantar untuk berbagai keperluan |
| `izin_keramaian` | Izin acara/keramaian |

---

### SERVICE 4: DASHBOARD

**Port**: 3000  
**Tech Stack**: Next.js 14 (App Router) + TypeScript + Prisma  
**Database Schema**: `dashboard`

#### Fungsi Utama
| Fungsi | Deskripsi |
|--------|-----------|
| **Admin Authentication** | Login/logout dengan JWT |
| **Complaint Viewer** | List dan detail laporan |
| **Ticket Viewer** | List dan detail tiket |
| **Status Management** | Update status via UI |
| **Statistics Dashboard** | Charts dan analytics |
| **Knowledge Base** | Manage knowledge untuk RAG |
| **AI Settings** | Konfigurasi model LLM |
| **Live Chat** | View dan takeover percakapan |

#### Pages
```
/login                    - Admin login
/dashboard                - Overview statistik
/dashboard/laporan        - List laporan
/dashboard/laporan/[id]   - Detail laporan
/dashboard/tiket          - List tiket
/dashboard/tiket/[id]     - Detail tiket
/dashboard/statistik      - Charts & analytics
/dashboard/livechat       - Live chat management
/dashboard/knowledge      - Knowledge base management
/dashboard/ai-settings    - AI configuration
```

#### Database Tables
```sql
-- admin_users: User admin dashboard
CREATE TABLE dashboard.admin_users (
  id, username, password_hash, name, role, is_active, created_at
);

-- admin_sessions: Session management
CREATE TABLE dashboard.admin_sessions (
  id, admin_id, token, expires_at, created_at
);

-- knowledge_base: Knowledge untuk RAG
CREATE TABLE dashboard.knowledge_base (
  id, title, content, category, keywords, is_active, 
  embedding, quality_score, usage_count
);
```

---

### SERVICE 5: NOTIFICATION SERVICE

**Port**: 3004  
**Tech Stack**: Express.js + TypeScript + Prisma  
**Database Schema**: `notification`

#### Fungsi Utama
| Fungsi | Deskripsi |
|--------|-----------|
| **Event Consumer** | Listen events dari RabbitMQ |
| **Template Builder** | Build pesan notifikasi sesuai event |
| **Send Notification** | POST ke Channel Service untuk kirim |
| **Retry Logic** | 3x retry dengan exponential backoff |
| **Notification Log** | Log semua notifikasi (success/failed) |

#### RabbitMQ Events
- **Consume**: `govconnect.ai.reply`
- **Consume**: `govconnect.complaint.created`
- **Consume**: `govconnect.ticket.created`
- **Consume**: `govconnect.status.updated`

#### Notification Templates
```
AI Reply:
"[Pesan dari AI berdasarkan LLM response]"

Complaint Created:
"✅ *Laporan Diterima*

Nomor Laporan: LAP-20251203-001
Kategori: Jalan Rusak
Status: Baru

Laporan Anda sedang kami proses..."

Status Updated:
"📢 *Update Status Laporan*

Nomor: LAP-20251203-001
Status: Dalam Proses
Catatan: Tim sudah ditugaskan..."
```

#### Database Tables
```sql
-- notification_logs: Log semua notifikasi
CREATE TABLE notification.notification_logs (
  id, wa_user_id, message_text, notification_type, 
  status, error_msg, sent_at
);
```

---

## 🔗 KOMUNIKASI ANTAR SERVICE

### Synchronous (REST API)

| From | To | Endpoint | Purpose |
|------|-----|----------|---------|
| AI Service | Channel Service | GET /internal/messages | Fetch chat history |
| AI Service | Case Service | POST /laporan/create | Create complaint |
| AI Service | Case Service | POST /tiket/create | Create ticket |
| Notification Service | Channel Service | POST /internal/send | Send WhatsApp |
| Dashboard | Case Service | GET /laporan | List complaints |
| Dashboard | Case Service | PATCH /laporan/:id/status | Update status |

### Asynchronous (RabbitMQ)

| Event | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| `whatsapp.message.received` | Channel Service | AI Service | `{wa_user_id, message, message_id}` |
| `govconnect.ai.reply` | AI Service | Notification Service | `{wa_user_id, reply_text}` |
| `govconnect.complaint.created` | Case Service | Notification Service | `{wa_user_id, complaint_id, kategori}` |
| `govconnect.ticket.created` | Case Service | Notification Service | `{wa_user_id, ticket_id, jenis}` |
| `govconnect.status.updated` | Case Service | Notification Service | `{wa_user_id, id, status, admin_notes}` |

---

## 💾 DATABASE ARCHITECTURE

### Single PostgreSQL Instance, Multiple Schemas

```
PostgreSQL Server (govconnect-postgres:5432)
│
├── Schema: channel (Channel Service)
│   ├── messages
│   ├── conversations
│   ├── takeover_sessions
│   ├── pending_messages
│   └── wa_settings
│
├── Schema: cases (Case Service)
│   ├── complaints
│   └── tickets
│
├── Schema: dashboard (Dashboard Service)
│   ├── admin_users
│   ├── admin_sessions
│   ├── activity_logs
│   ├── system_settings
│   ├── knowledge_base
│   └── knowledge_documents
│
└── Schema: notification (Notification Service)
    └── notification_logs
```

**Catatan**: Meskipun menggunakan single PostgreSQL instance, setiap service hanya mengakses schema-nya sendiri melalui connection string yang berbeda. Ini memenuhi requirement **"Database per Service"**.

---

## 🚀 FLOW UTAMA

### Skenario 1: Warga Melaporkan Jalan Rusak

```
1. Warga kirim WA: "Pak, jalan depan rumah rusak banyak lubang di Jl Melati 21 RT 02 RW 05"

2. Channel Service:
   - Terima webhook dari WhatsApp
   - Simpan ke database (FIFO 30)
   - Publish event: whatsapp.message.received

3. AI Orchestrator:
   - Consume event
   - Fetch 30 messages dari Channel Service
   - Call Gemini dengan context
   - Gemini response:
     {
       "intent": "CREATE_COMPLAINT",
       "fields": {
         "kategori": "jalan_rusak",
         "deskripsi": "Jalan rusak banyak lubang",
         "alamat": "Jl Melati 21",
         "rt_rw": "RT 02 RW 05"
       },
       "reply_text": "Baik Pak, laporan jalan rusak sudah kami terima..."
     }
   - POST ke Case Service: /laporan/create
   - Publish event: govconnect.ai.reply

4. Case Service:
   - Buat complaint: LAP-20251203-001
   - Publish event: govconnect.complaint.created

5. Notification Service:
   - Consume event: govconnect.ai.reply
   - POST ke Channel Service: /internal/send
   
   - Consume event: govconnect.complaint.created
   - POST ke Channel Service: /internal/send

6. Channel Service:
   - Kirim 2 pesan WA ke warga:
     a. Balasan AI
     b. Konfirmasi nomor laporan
```

### Skenario 2: Admin Update Status Laporan

```
1. Admin login ke Dashboard

2. Admin buka /dashboard/laporan/LAP-20251203-001

3. Admin ubah status: baru → proses
   - Dashboard PATCH ke Case Service: /laporan/LAP-20251203-001/status
   - Body: { "status": "proses", "admin_notes": "Tim sudah ditugaskan" }

4. Case Service:
   - Update database
   - Publish event: govconnect.status.updated

5. Notification Service:
   - Consume event
   - Build template "Update Status Laporan"
   - POST ke Channel Service: /internal/send

6. Channel Service:
   - Kirim WA ke warga: "Laporan Anda #LAP-20251203-001 sedang diproses"
```

---

## 📚 REFERENSI

- [govconnect.instructions.md](../.github/instructions/govconnect.instructions.md) - Aturan coding lengkap
- [GOVCONNECT_DEV_PHASES.md](./GOVCONNECT_DEV_PHASES.md) - Development phases
- [Phase 6 Complete](./PHASE_6_COMPLETE.md) - Integration test results

---

**Last Updated**: December 3, 2025
