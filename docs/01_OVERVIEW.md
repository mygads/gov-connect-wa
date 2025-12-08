# GovConnect - Smart Government Service Platform

## 📋 Deskripsi Proyek

**GovConnect** adalah platform digital berbasis **Microservices Architecture** yang mengintegrasikan layanan pemerintahan kelurahan dengan masyarakat melalui WhatsApp. Sistem ini menerapkan **Enterprise Application Integration (EAI)** dengan komunikasi synchronous (REST API) dan asynchronous (Message Broker).

## 🎯 Tujuan Sistem

1. **Digitalisasi Layanan Kelurahan**: Warga dapat mengakses layanan tanpa datang ke kantor
2. **Otomasi Proses**: AI mengidentifikasi intent dan membuat laporan otomatis
3. **Real-time Communication**: Integrasi dengan WhatsApp untuk komunikasi instant
4. **Monitoring & Analytics**: Dashboard admin untuk monitoring dan statistik
5. **Scalability**: Arsitektur microservices yang mudah di-scale

## 🏗️ Arsitektur Sistem

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Traefik)                    │
│                         Port: 80, 443, 8080                     │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Channel    │      │      AI      │     │     Case     │
│   Service    │◄────►│   Service    │────►│   Service    │
│  Port: 3001  │      │  Port: 3002  │     │  Port: 3003  │
│ DB: gc_      │      │ DB: gc_ai    │     │ DB: gc_case  │
│   channel    │      │              │     │              │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ Notification │      │   Dashboard  │     │   RabbitMQ   │
│   Service    │      │   (Next.js)  │     │   (Message   │
│  Port: 3004  │      │  Port: 3000  │     │    Broker)   │
│ DB: gc_notif │      │ DB: gc_      │     │  Port: 5672  │
│              │      │   dashboard  │     │              │
└──────────────┘      └──────────────┘     └──────────────┘
```

## 📊 Komponen Utama

### 1. Microservices (5 Services)

| Service | Port | Database | Fungsi Utama |
|---------|------|----------|--------------|
| **Channel Service** | 3001 | gc_channel | Gateway WhatsApp, Message handling, Takeover |
| **AI Service** | 3002 | gc_ai | AI Orchestration, Intent detection, RAG |
| **Case Service** | 3003 | gc_case | Complaint management, Ticketing |
| **Notification Service** | 3004 | gc_notification | Notification delivery |
| **Dashboard** | 3000 | gc_dashboard | Admin panel, Monitoring, Knowledge base |

### 2. Infrastructure Components

| Component | Fungsi | Port |
|-----------|--------|------|
| **PostgreSQL 17** | Database dengan pgvector | 5432 |
| **RabbitMQ** | Message Broker (Async communication) | 5672, 15672 |
| **Traefik** | API Gateway & Reverse Proxy | 80, 443, 8080 |
| **Prometheus** | Metrics collection | 9090 |
| **Grafana** | Monitoring dashboard | 3300 |
| **Loki** | Centralized logging | 3101 |
| **Promtail** | Log collector | - |

### 3. External Services

| Service | Fungsi |
|---------|--------|
| **WhatsApp API** | WhatsApp Business API (api-wa.genfity.com) |
| **Google Gemini AI** | LLM untuk intent detection & RAG |

## 🔄 Pola Komunikasi

### Synchronous Communication (REST API)
- Dashboard → Services (HTTP/REST)
- AI Service → Case Service (HTTP/REST)
- AI Service → Channel Service (HTTP/REST)
- Channel Service → WhatsApp API (HTTP/REST)

### Asynchronous Communication (Message Broker)
- Channel Service → AI Service (via RabbitMQ)
- AI Service → Channel Service (via RabbitMQ)
- AI Service → Notification Service (via RabbitMQ)

## 🗄️ Database Architecture

### Database per Service Pattern

Setiap service memiliki database sendiri (✅ **Requirement EAI terpenuhi**):

```
PostgreSQL Server (postgres:5432)
├── gc_channel (Channel Service)
│   ├── messages
│   ├── conversations
│   ├── user_profiles
│   └── takeover_sessions
│
├── gc_ai (AI Service)
│   └── knowledge_vectors (pgvector)
│
├── gc_case (Case Service)
│   ├── complaints
│   ├── complaint_updates
│   └── complaint_media
│
├── gc_notification (Notification Service)
│   ├── notifications
│   └── notification_templates
│
└── gc_dashboard (Dashboard)
    ├── admin_users
    ├── admin_sessions
    ├── activity_logs
    ├── knowledge_base
    ├── knowledge_documents
    └── document_chunks
```

**✅ Tidak ada shared database antar service!**

## 🚀 Teknologi Stack

### Backend
- **Node.js** (v23) - Runtime
- **TypeScript** - Programming language
- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL 17** - Database
- **pgvector** - Vector extension
- **RabbitMQ** - Message broker

### Frontend (Dashboard)
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Programming language
- **Tailwind CSS** - Styling
- **Radix UI** - Component library

### AI/ML
- **Google Gemini 2.5 Flash** - LLM untuk intent detection
- **pgvector** - Vector database untuk RAG

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local orchestration
- **Traefik** - API Gateway
- **Prometheus** - Metrics
- **Grafana** - Monitoring
- **Loki + Promtail** - Logging

## 📦 Struktur Folder

```
containers/
├── database/              # PostgreSQL container
│   ├── docker-compose.yml
│   └── init/              # SQL init scripts
│
├── supporting/            # Supporting services
│   ├── docker-compose.yml
│   ├── rabbitmq/
│   ├── prometheus/
│   ├── grafana/
│   ├── loki/
│   └── promtail/
│
├── traefik/              # API Gateway
│   ├── docker-compose.yml
│   ├── docker-compose.local.yml
│   └── dynamic/
│
├── networks/             # Docker networks
│   └── docker-compose.yml
│
├── govconnect/           # Main application
│   ├── docker-compose.yml
│   ├── govconnect-channel-service/
│   ├── govconnect-ai-service/
│   ├── govconnect-case-service/
│   ├── govconnect-notification-service/
│   ├── govconnect-dashboard/
│   └── shared/
│
└── docs/                 # Dokumentasi
    ├── 01_OVERVIEW.md
    ├── 02_ARCHITECTURE.md
    ├── 04_BUSINESS_FLOW.md
    └── 07_EAI_MAPPING.md
```

## 🎓 Pemenuhan Requirement Tugas EAI

| Requirement | Status | Implementasi |
|-------------|--------|--------------|
| **4+ Microservices** | ✅ | 5 services (Channel, AI, Case, Notification, Dashboard) |
| **Database per Service** | ✅ | 5 database terpisah |
| **Synchronous Comm** | ✅ | REST API antar services |
| **Asynchronous Comm** | ✅ | RabbitMQ untuk event-driven |
| **Docker** | ✅ | Setiap service punya Dockerfile |
| **API Gateway** | ✅ | Traefik sebagai reverse proxy |
| **Circuit Breaker** | ✅ | Bonus - implemented |
| **Centralized Logging** | ✅ | Bonus - Loki + Grafana |
| **Monitoring** | ✅ | Bonus - Prometheus + Grafana |

## 📈 Fitur Unggulan

1. **AI-Powered Intent Detection** - Otomatis mendeteksi intent user
2. **Event-Driven Architecture** - Message batching, async processing
3. **Real-time Communication** - WhatsApp integration, live chat
4. **Monitoring & Observability** - Centralized logging, metrics
5. **Security** - JWT authentication, API key validation

## 🔗 Dokumentasi Lengkap

- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - Arsitektur detail
- [04_BUSINESS_FLOW.md](./04_BUSINESS_FLOW.md) - Business flow & demo
- [07_EAI_MAPPING.md](./07_EAI_MAPPING.md) - Mapping ke requirement tugas
