# Arsitektur GovConnect - Detail

## 🏗️ High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         EXTERNAL LAYER                           │
│  ┌────────────┐              ┌──────────────┐                   │
│  │  WhatsApp  │              │   Admin      │                   │
│  │   Users    │              │   Browser    │                   │
│  └─────┬──────┘              └──────┬───────┘                   │
└────────┼─────────────────────────────┼──────────────────────────┘
         │                             │
         │ Webhook                     │ HTTPS
         ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Traefik (Reverse Proxy)                   │     │
│  │  - Load Balancing                                      │     │
│  │  - SSL Termination                                     │     │
│  │  - Service Discovery                                   │     │
│  │  - Health Checks                                       │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Internal Routing
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Channel    │    │      AI      │    │     Case     │       │
│  │   Service    │◄──►│   Service    │───►│   Service    │       │
│  │  Port 3001   │    │  Port 3002   │    │  Port 3003   │       │
│  │              │    │              │    │              │       │
│  │  - Webhook   │    │  - Intent    │    │  - Complaint │       │
│  │  - Message   │    │  - RAG       │    │  - Ticket    │       │
│  │  - Takeover  │    │  - LLM       │    │  - Status    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│  ┌──────▼───────┐    ┌──────▼───────┐                           │
│  │Notification  │    │   Dashboard  │                           │
│  │   Service    │    │   (Next.js)  │                           │
│  │  Port 3004   │    │  Port 3000   │                           │
│  └──────────────┘    └──────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Database & Message Broker
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         PostgreSQL 17 + pgvector (Database)            │     │
│  │                                                        │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │     │
│  │  │gc_channel│ │  gc_ai   │ │ gc_case  │ │gc_notif  │  │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │     │
│  │  ┌──────────┐                                          │     │
│  │  │gc_dashbrd│                                          │     │
│  │  └──────────┘                                          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              RabbitMQ (Message Broker)                 │     │
│  │  Exchange: govconnect.events (topic)                   │     │
│  │  VHost: /govconnect                                    │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Monitoring & Logging
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Prometheus  │  │   Grafana    │  │ Loki+Promtail│           │
│  │  (Metrics)   │  │  (Visualize) │  │   (Logs)     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Communication Patterns

### 1. Synchronous Communication (REST API)

**Request-Response Pattern**

```
Client Request
    ↓
API Gateway (Traefik)
    ↓
Target Service
    ↓
Process Request
    ↓
Query Database
    ↓
Return Response
```

**Contoh**: AI Service → Case Service
```typescript
// AI Service memanggil Case Service untuk create complaint
const response = await axios.post(
  'http://case-service:3003/internal/complaints',
  {
    wa_user_id: '628123456789',
    kategori: 'jalan_rusak',
    alamat: 'Jl. Melati No. 15',
    deskripsi: 'Banyak lubang'
  },
  {
    headers: {
      'x-internal-api-key': process.env.INTERNAL_API_KEY
    }
  }
);
```

### 2. Asynchronous Communication (Message Broker)

**Publish-Subscribe Pattern**

```
Producer Service
    ↓
Publish Message to RabbitMQ
    ↓
Exchange: govconnect.events
    ↓
Queue: service-specific queues
    ↓
Consumer Service(s)
    ↓
Process Message
    ↓
Acknowledge
```

**Contoh**: Channel Service → AI Service
```typescript
// Channel Service publish message baru
await rabbitMQ.publish(
  'govconnect.events',           // Exchange
  'whatsapp.message.received',   // Routing key
  {
    wa_user_id: '628123456789',
    message: 'Saya mau lapor jalan rusak',
    message_id: 'msg_123'
  }
);

// AI Service consume message
await rabbitMQ.subscribe(
  'ai-service.whatsapp.message.#',
  async (msg) => {
    await processMessage(msg);
  }
);
```

## 🎯 Service Responsibilities

### Channel Service (Port 3001)

**Domain**: Message Gateway & Communication

**Responsibilities**:
- Menerima webhook dari WhatsApp API
- Validasi dan parsing message
- Menyimpan incoming/outgoing messages
- Mengirim message ke WhatsApp API
- Message batching untuk efisiensi
- Takeover mode (admin live chat)
- Media handling (images, documents)

**Database**: `gc_channel`
- messages, conversations, user_profiles, takeover_sessions

**Endpoints**:
```
POST   /webhook/whatsapp          # Receive webhook
GET    /webhook/whatsapp          # Webhook verification
POST   /internal/messages/send    # Send message
GET    /internal/messages         # Get messages
POST   /internal/takeover/:id/start
POST   /internal/takeover/:id/end
GET    /internal/takeover/:id/status
GET    /health
```

### AI Service (Port 3002)

**Domain**: AI Orchestration & Intelligence

**Responsibilities**:
- Intent detection (KNOWLEDGE_QUERY, CREATE_COMPLAINT, CHECK_STATUS)
- Data extraction dari natural language
- RAG (Retrieval Augmented Generation)
- Vector search untuk knowledge base
- LLM integration (Gemini AI)

**Database**: `gc_ai`
- knowledge_vectors (pgvector extension)

**Endpoints**:
```
POST   /internal/process-message  # Process message
GET    /internal/analytics        # Get analytics
POST   /internal/knowledge/search # Search knowledge
POST   /internal/documents/process # Process documents
GET    /health
```

### Case Service (Port 3003)

**Domain**: Complaint & Ticket Management

**Responsibilities**:
- Create complaint/laporan
- Update complaint status
- Get complaint details
- Search & filter complaints
- Generate complaint ID (LAP-YYYYMMDD-XXX)
- Complaint statistics

**Database**: `gc_case`
- complaints, complaint_updates, complaint_media

**Endpoints**:
```
POST   /internal/complaints       # Create complaint
GET    /internal/complaints/:id   # Get complaint
PUT    /internal/complaints/:id   # Update complaint
GET    /internal/complaints       # List complaints
GET    /internal/complaints/stats # Statistics
GET    /health
```

### Notification Service (Port 3004)

**Domain**: Notification Delivery

**Responsibilities**:
- Send notifications
- Notification templates
- Notification history
- Delivery status tracking

**Database**: `gc_notification`
- notifications, notification_templates

**Endpoints**:
```
POST   /internal/notifications    # Create notification
GET    /internal/notifications    # List notifications
GET    /internal/notifications/:id
PUT    /internal/notifications/:id/status
GET    /health
```

### Dashboard (Port 3000)

**Domain**: Admin Panel & Monitoring

**Responsibilities**:
- Admin authentication (JWT)
- Complaint management UI
- Knowledge base management
- Document upload & processing
- Live chat (takeover)
- Statistics & analytics
- Activity logs

**Database**: `gc_dashboard`
- admin_users, admin_sessions, activity_logs, knowledge_base, knowledge_documents, document_chunks

**Pages**:
```
/login              # Admin login
/dashboard          # Main dashboard
/complaints         # Complaint list
/complaints/:id     # Complaint detail
/knowledge          # Knowledge base
/documents          # Document management
/live-chat          # Live chat with users
/analytics          # Analytics
```

## 🐳 Docker Architecture

### Container Structure

```yaml
# Network Layer
networks:
  infra-network:      # Infrastructure services
  govconnect-network: # Application services

# Infrastructure (database/docker-compose.yml)
services:
  postgres:           # PostgreSQL 17 + pgvector
    image: pgvector/pgvector:pg17
    networks: [infra-network]

# Supporting (supporting/docker-compose.yml)
services:
  rabbitmq:           # Message Broker
  prometheus:         # Metrics
  grafana:            # Visualization
  loki:               # Logging
  promtail:           # Log collector

# Application (govconnect/docker-compose.yml)
services:
  channel-service:
    networks: [govconnect-network, infra-network]
  ai-service:
    networks: [govconnect-network, infra-network]
  case-service:
    networks: [govconnect-network, infra-network]
  notification-service:
    networks: [govconnect-network, infra-network]
  dashboard:
    networks: [govconnect-network, infra-network]
```

### Network Topology

```
┌─────────────────────────────────────────────────────┐
│  infra-network                                      │
│  - PostgreSQL (postgres:5432)                       │
│  - RabbitMQ (rabbitmq:5672)                         │
│  - Prometheus, Grafana, Loki                        │
└─────────────────────────────────────────────────────┘
                        │
                        │ (Services connect to both)
                        │
┌─────────────────────────────────────────────────────┐
│  govconnect-network                                 │
│  - Channel Service (channel-service:3001)          │
│  - AI Service (ai-service:3002)                    │
│  - Case Service (case-service:3003)                │
│  - Notification Service (notification-service:3004)│
│  - Dashboard (dashboard:3000)                      │
│  - Traefik (traefik:80)                            │
└─────────────────────────────────────────────────────┘
```

### Health Check Strategy

Setiap service memiliki health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

## 🔐 Security Architecture

### Authentication Flow

```
1. Admin login (username/password)
    ↓
2. Dashboard validates credentials
    ↓
3. Generate JWT token
    ↓
4. Store JWT in cookie
    ↓
5. Subsequent requests with JWT
    ↓
6. Middleware verifies JWT
```

### Internal Service Communication

```
Service A → Service B
    ↓
Add Header: x-internal-api-key
    ↓
Service B validates key
    ↓
Process request
```

## 📈 Scalability

### Horizontal Scaling

Services yang bisa di-scale horizontal:
- ✅ Channel Service (stateless)
- ✅ AI Service (stateless)
- ✅ Case Service (stateless)
- ✅ Notification Service (stateless)
- ⚠️ Dashboard (session management needed)

### Load Balancing

Traefik otomatis load balance ke multiple instances:

```yaml
channel-service:
  deploy:
    replicas: 3  # 3 instances
```

## 📊 Monitoring Architecture

### Metrics Collection

```
Application Services
    ↓ (expose /health endpoint)
Prometheus scrapes metrics
    ↓
Store time-series data
    ↓
Grafana queries Prometheus
    ↓
Visualize dashboards
```

### Log Aggregation

```
Application Services
    ↓ (write logs to stdout)
Docker captures logs
    ↓
Promtail collects logs
    ↓
Loki stores logs
    ↓
Grafana queries Loki
    ↓
Search & analyze logs
```
