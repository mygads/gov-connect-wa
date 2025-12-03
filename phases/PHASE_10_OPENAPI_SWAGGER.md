# 📚 PHASE 10: OPENAPI/SWAGGER DOCUMENTATION

**Duration**: 2-3 jam  
**Complexity**: ⭐⭐ Medium  
**Prerequisites**: All services implemented (Phase 1-5)

---

## 📋 OVERVIEW

Phase ini fokus pada pembuatan **dokumentasi API menggunakan OpenAPI/Swagger** untuk semua endpoints di GovConnect.

### Mengapa Dokumentasi API Penting?

| Aspek | Penjelasan |
|-------|------------|
| **Developer Experience** | Memudahkan developer memahami dan menggunakan API |
| **Interactive Testing** | Swagger UI memungkinkan test API langsung dari browser |
| **Contract First** | API spec sebagai kontrak antara frontend dan backend |
| **Code Generation** | Bisa generate client SDK otomatis |
| **Standardization** | OpenAPI adalah standar industri (fka Swagger) |
| **Requirement Tugas** | Disebutkan di spesifikasi tubes sebagai deliverable |

### Struktur Dokumentasi

```
docs/
├── openapi/
│   ├── openapi.yaml              # Main OpenAPI spec
│   ├── channel-service.yaml      # Service 1 API spec
│   ├── case-service.yaml         # Service 3 API spec
│   ├── dashboard-api.yaml        # Service 4 API spec
│   └── schemas/                  # Shared schemas
│       ├── common.yaml
│       ├── complaint.yaml
│       ├── ticket.yaml
│       └── message.yaml
└── postman/
    └── GovConnect.postman_collection.json
```

---

## 🎯 OBJECTIVES

1. ✅ Create OpenAPI 3.0 specification for all services
2. ✅ Setup Swagger UI di setiap Express service
3. ✅ Document all request/response schemas
4. ✅ Add example values untuk setiap endpoint
5. ✅ Generate Postman collection
6. ✅ Setup ReDoc untuk public documentation

---

## 📋 CHECKLIST

### 1. Install Dependencies

- [ ] **Express Services** (Channel, Case, Notification):
  ```bash
  pnpm add swagger-jsdoc swagger-ui-express
  pnpm add -D @types/swagger-jsdoc @types/swagger-ui-express
  ```

- [ ] **Next.js Dashboard**:
  ```bash
  pnpm add next-swagger-doc swagger-ui-react
  ```

### 2. Create OpenAPI Specifications

- [ ] **Channel Service** (`/api-docs`):
  - POST /webhook/whatsapp
  - POST /internal/send
  - GET /internal/messages
  - GET /internal/conversations
  - POST /internal/takeover
  - GET /health
  
- [ ] **Case Service** (`/api-docs`):
  - POST /laporan/create
  - GET /laporan
  - GET /laporan/:id
  - PATCH /laporan/:id/status
  - POST /tiket/create
  - GET /tiket
  - GET /tiket/:id
  - PATCH /tiket/:id/status
  - GET /statistics/overview
  - GET /health
  
- [ ] **Dashboard API** (`/api/docs`):
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  - GET /api/statistics/overview
  - GET /api/complaints
  - GET /api/tickets

### 3. Swagger UI Setup

- [ ] Configure Swagger UI di setiap service
- [ ] Add authentication support (API Key, JWT)
- [ ] Configure server URLs (development, production)

### 4. Export & Tooling

- [ ] Generate Postman collection dari OpenAPI
- [ ] Setup ReDoc untuk static documentation
- [ ] Add API documentation to README

---

## 📝 DETAILED IMPLEMENTATION

### Express.js Swagger Setup

#### src/config/swagger.ts
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GovConnect Channel Service API',
      version,
      description: `
# Channel Service API

Channel Service adalah **pintu gerbang WhatsApp** untuk sistem GovConnect.

## Fitur Utama
- Menerima webhook dari WhatsApp Cloud API
- Menyimpan history chat (FIFO 30 messages)
- Internal API untuk kirim pesan
- Takeover management untuk live chat

## Authentication
- **Internal APIs**: Membutuhkan header \`X-Internal-API-Key\`
- **Webhook**: Verified via WhatsApp signature

## Rate Limiting
- Webhook: 100 requests/minute
- Internal: 1000 requests/minute
      `,
      contact: {
        name: 'GovConnect Team',
        email: 'support@govconnect.local',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.govconnect.local',
        description: 'Production server (via API Gateway)',
      },
    ],
    tags: [
      {
        name: 'Webhook',
        description: 'WhatsApp webhook endpoints',
      },
      {
        name: 'Internal',
        description: 'Internal service-to-service APIs',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
    components: {
      securitySchemes: {
        InternalApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Internal-API-Key',
          description: 'API Key untuk internal service calls',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Bad Request',
            },
            message: {
              type: 'string',
              example: 'Invalid request body',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'degraded', 'error'],
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            uptime: {
              type: 'number',
              description: 'Uptime in seconds',
            },
            version: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

#### src/routes/webhook.routes.ts (dengan JSDoc annotations)
```typescript
import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * @openapi
 * /webhook/whatsapp:
 *   get:
 *     tags:
 *       - Webhook
 *     summary: WhatsApp webhook verification
 *     description: |
 *       Endpoint untuk verifikasi webhook WhatsApp Cloud API.
 *       Dipanggil saat setup webhook di Meta Business Suite.
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [subscribe]
 *         description: Mode verifikasi (harus "subscribe")
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token verifikasi yang dikonfigurasi
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge string dari WhatsApp
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: "1234567890"
 *       403:
 *         description: Invalid verify token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', webhookController.verify);

/**
 * @openapi
 * /webhook/whatsapp:
 *   post:
 *     tags:
 *       - Webhook
 *     summary: Receive WhatsApp message
 *     description: |
 *       Endpoint untuk menerima pesan dari WhatsApp Cloud API.
 *       
 *       ## Flow:
 *       1. Terima webhook dari WhatsApp
 *       2. Validasi signature (HMAC)
 *       3. Simpan pesan ke database (FIFO 30)
 *       4. Publish event ke RabbitMQ
 *       
 *       ## Idempotency:
 *       Pesan dengan message_id yang sama akan di-skip (tidak diproses ulang).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object:
 *                 type: string
 *                 example: whatsapp_business_account
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: object
 *                             properties:
 *                               messages:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     from:
 *                                       type: string
 *                                       example: "6281234567890"
 *                                     id:
 *                                       type: string
 *                                       example: "wamid.xxx"
 *                                     timestamp:
 *                                       type: string
 *                                     text:
 *                                       type: object
 *                                       properties:
 *                                         body:
 *                                           type: string
 *                                           example: "Jalan rusak di depan komplek"
 *           example:
 *             object: whatsapp_business_account
 *             entry:
 *               - id: "123456789"
 *                 changes:
 *                   - value:
 *                       messaging_product: whatsapp
 *                       messages:
 *                         - from: "6281234567890"
 *                           id: "wamid.HBgNNjI4MTIzNDU2Nzg5MBUCABI"
 *                           timestamp: "1701590400"
 *                           text:
 *                             body: "Jalan rusak di depan komplek saya"
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message_id:
 *                   type: string
 *                   example: "wamid.HBgNNjI4MTIzNDU2Nzg5MBUCABI"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate message (already processed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: duplicate
 *                 message:
 *                   type: string
 */
router.post('/', webhookController.receive);

export default router;
```

#### src/routes/internal.routes.ts
```typescript
import { Router } from 'express';
import { internalController } from '../controllers/internal.controller';
import { internalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /internal/send:
 *   post:
 *     tags:
 *       - Internal
 *     summary: Send WhatsApp message
 *     description: |
 *       Endpoint untuk mengirim pesan WhatsApp ke user.
 *       Digunakan oleh Notification Service untuk mengirim notifikasi.
 *     security:
 *       - InternalApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wa_user_id
 *               - message
 *             properties:
 *               wa_user_id:
 *                 type: string
 *                 description: WhatsApp phone number (format 628xxx)
 *                 example: "6281234567890"
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: "Laporan Anda #LAP-20251203-001 sudah diterima"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [sent, failed]
 *                 message_id:
 *                   type: string
 *                 error:
 *                   type: string
 *             example:
 *               status: sent
 *               message_id: "wamid.xxx"
 *       401:
 *         description: Missing or invalid API key
 *       500:
 *         description: Failed to send message
 */
router.post('/send', internalAuth, internalController.send);

/**
 * @openapi
 * /internal/messages:
 *   get:
 *     tags:
 *       - Internal
 *     summary: Get message history
 *     description: |
 *       Mengambil history chat untuk user tertentu.
 *       Digunakan oleh AI Service untuk context building.
 *       
 *       **FIFO 30**: Hanya menyimpan 30 pesan terakhir per user.
 *     security:
 *       - InternalApiKey: []
 *     parameters:
 *       - in: query
 *         name: wa_user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: WhatsApp phone number
 *         example: "6281234567890"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 30
 *         description: Maximum messages to return
 *     responses:
 *       200:
 *         description: Message history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       message_text:
 *                         type: string
 *                       direction:
 *                         type: string
 *                         enum: [IN, OUT]
 *                       source:
 *                         type: string
 *                         enum: [WA_WEBHOOK, AI, SYSTEM]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *             example:
 *               messages:
 *                 - id: "cm123abc"
 *                   message_text: "Jalan rusak di depan rumah"
 *                   direction: "IN"
 *                   source: "WA_WEBHOOK"
 *                   timestamp: "2025-12-03T10:00:00Z"
 *                 - id: "cm456def"
 *                   message_text: "Laporan Anda sudah diterima"
 *                   direction: "OUT"
 *                   source: "AI"
 *                   timestamp: "2025-12-03T10:00:05Z"
 *               total: 2
 *       401:
 *         description: Missing or invalid API key
 */
router.get('/messages', internalAuth, internalController.getMessages);

/**
 * @openapi
 * /internal/conversations:
 *   get:
 *     tags:
 *       - Internal
 *     summary: Get conversation list
 *     description: Daftar semua percakapan untuk Live Chat dashboard
 *     security:
 *       - InternalApiKey: []
 *     parameters:
 *       - in: query
 *         name: is_takeover
 *         schema:
 *           type: boolean
 *         description: Filter by takeover status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Conversation list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wa_user_id:
 *                         type: string
 *                       user_name:
 *                         type: string
 *                       last_message:
 *                         type: string
 *                       last_message_at:
 *                         type: string
 *                         format: date-time
 *                       unread_count:
 *                         type: integer
 *                       is_takeover:
 *                         type: boolean
 *                 total:
 *                   type: integer
 */
router.get('/conversations', internalAuth, internalController.getConversations);

export default router;
```

### OpenAPI Spec (Full YAML)

#### docs/openapi/case-service.yaml
```yaml
openapi: 3.0.3
info:
  title: GovConnect Case Service API
  version: 1.0.0
  description: |
    # Case Service API

    Case Service mengelola **Laporan Warga** dan **Tiket Layanan** dalam sistem GovConnect.

    ## Entities

    ### Laporan (Complaint)
    - Pengaduan tentang masalah infrastruktur
    - Kategori: jalan_rusak, lampu_mati, sampah, drainase, pohon_tumbang, fasilitas_rusak
    - Status: baru → proses → selesai/ditolak

    ### Tiket (Ticket)
    - Permohonan layanan administratif
    - Jenis: surat_keterangan, surat_pengantar, izin_keramaian
    - Status: pending → proses → selesai/ditolak

    ## Authentication
    - Internal APIs: Header `X-Internal-API-Key`
    - Dashboard proxy: JWT via cookie

servers:
  - url: http://localhost:3003
    description: Development
  - url: https://api.govconnect.local
    description: Production

tags:
  - name: Laporan
    description: Complaint/report management
  - name: Tiket
    description: Service ticket management
  - name: Statistics
    description: Dashboard statistics
  - name: Health
    description: Health checks

paths:
  /laporan/create:
    post:
      tags:
        - Laporan
      summary: Create new complaint
      description: |
        Membuat laporan baru dari warga.
        Dipanggil oleh AI Service setelah mengekstrak informasi dari chat.
      security:
        - InternalApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateComplaintRequest'
            example:
              wa_user_id: "6281234567890"
              kategori: "jalan_rusak"
              deskripsi: "Jalan berlubang besar di depan gang"
              alamat: "Jl. Melati No. 15"
              rt_rw: "RT 02 RW 05"
      responses:
        '201':
          description: Complaint created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateComplaintResponse'
              example:
                status: success
                data:
                  complaint_id: "LAP-20251203-001"
                  status: "baru"
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized
        '500':
          description: Server error

  /laporan:
    get:
      tags:
        - Laporan
      summary: Get complaints list
      description: Mengambil daftar laporan dengan filter dan pagination
      security:
        - InternalApiKey: []
      parameters:
        - $ref: '#/components/parameters/StatusFilter'
        - $ref: '#/components/parameters/KategoriFilter'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Offset'
        - $ref: '#/components/parameters/SortBy'
        - $ref: '#/components/parameters/SortOrder'
      responses:
        '200':
          description: Complaints list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ComplaintsListResponse'

  /laporan/{id}:
    get:
      tags:
        - Laporan
      summary: Get complaint detail
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: Complaint ID (LAP-YYYYMMDD-XXX)
      responses:
        '200':
          description: Complaint detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Complaint'
        '404':
          description: Complaint not found

  /laporan/{id}/status:
    patch:
      tags:
        - Laporan
      summary: Update complaint status
      description: |
        Mengubah status laporan.
        Akan trigger event ke RabbitMQ untuk notifikasi.
      security:
        - InternalApiKey: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateStatusRequest'
      responses:
        '200':
          description: Status updated
        '404':
          description: Complaint not found

  /tiket/create:
    post:
      tags:
        - Tiket
      summary: Create new ticket
      security:
        - InternalApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTicketRequest'
      responses:
        '201':
          description: Ticket created

  /tiket:
    get:
      tags:
        - Tiket
      summary: Get tickets list
      security:
        - InternalApiKey: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, proses, selesai, ditolak]
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Offset'
      responses:
        '200':
          description: Tickets list

  /statistics/overview:
    get:
      tags:
        - Statistics
      summary: Get dashboard statistics
      description: Statistik untuk dashboard overview
      security:
        - InternalApiKey: []
      responses:
        '200':
          description: Statistics data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StatisticsResponse'
              example:
                totalLaporan: 150
                totalTiket: 45
                laporan:
                  baru: 25
                  proses: 50
                  selesai: 70
                  ditolak: 5
                  hariIni: 10
                tiket:
                  pending: 10
                  proses: 15
                  selesai: 18
                  ditolak: 2
                  hariIni: 3

  /health:
    get:
      tags:
        - Health
      summary: Health check
      responses:
        '200':
          description: Service healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

components:
  securitySchemes:
    InternalApiKey:
      type: apiKey
      in: header
      name: X-Internal-API-Key

  parameters:
    StatusFilter:
      name: status
      in: query
      schema:
        type: string
        enum: [baru, proses, selesai, ditolak]
      description: Filter by status
    KategoriFilter:
      name: kategori
      in: query
      schema:
        type: string
        enum: [jalan_rusak, lampu_mati, sampah, drainase, pohon_tumbang, fasilitas_rusak]
    Limit:
      name: limit
      in: query
      schema:
        type: integer
        default: 20
        maximum: 100
    Offset:
      name: offset
      in: query
      schema:
        type: integer
        default: 0
    SortBy:
      name: sort_by
      in: query
      schema:
        type: string
        enum: [created_at, updated_at, status]
        default: created_at
    SortOrder:
      name: sort_order
      in: query
      schema:
        type: string
        enum: [asc, desc]
        default: desc

  schemas:
    CreateComplaintRequest:
      type: object
      required:
        - wa_user_id
        - kategori
        - deskripsi
      properties:
        wa_user_id:
          type: string
          pattern: '^628\d{8,12}$'
          description: WhatsApp phone number
        kategori:
          type: string
          enum: [jalan_rusak, lampu_mati, sampah, drainase, pohon_tumbang, fasilitas_rusak]
        deskripsi:
          type: string
          minLength: 10
          maxLength: 1000
        alamat:
          type: string
        rt_rw:
          type: string
        foto_url:
          type: string
          format: uri

    CreateComplaintResponse:
      type: object
      properties:
        status:
          type: string
          enum: [success]
        data:
          type: object
          properties:
            complaint_id:
              type: string
              pattern: '^LAP-\d{8}-\d{3}$'
            status:
              type: string

    Complaint:
      type: object
      properties:
        id:
          type: string
        complaint_id:
          type: string
        wa_user_id:
          type: string
        kategori:
          type: string
        deskripsi:
          type: string
        alamat:
          type: string
        rt_rw:
          type: string
        foto_url:
          type: string
        status:
          type: string
          enum: [baru, proses, selesai, ditolak]
        admin_notes:
          type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ComplaintsListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Complaint'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        total:
          type: integer
        limit:
          type: integer
        offset:
          type: integer

    UpdateStatusRequest:
      type: object
      required:
        - status
      properties:
        status:
          type: string
          enum: [baru, proses, selesai, ditolak]
        admin_notes:
          type: string

    CreateTicketRequest:
      type: object
      required:
        - wa_user_id
        - jenis
        - data_json
      properties:
        wa_user_id:
          type: string
        jenis:
          type: string
          enum: [surat_keterangan, surat_pengantar, izin_keramaian]
        data_json:
          type: object
          additionalProperties: true

    StatisticsResponse:
      type: object
      properties:
        totalLaporan:
          type: integer
        totalTiket:
          type: integer
        laporan:
          type: object
          properties:
            baru:
              type: integer
            proses:
              type: integer
            selesai:
              type: integer
            ditolak:
              type: integer
            hariIni:
              type: integer
        tiket:
          type: object
          properties:
            pending:
              type: integer
            proses:
              type: integer
            selesai:
              type: integer
            ditolak:
              type: integer
            hariIni:
              type: integer

    HealthResponse:
      type: object
      properties:
        status:
          type: string
        timestamp:
          type: string
          format: date-time
        uptime:
          type: number
        version:
          type: string

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
```

### Integrate ke Express App

#### src/app.ts
```typescript
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// ... other middleware

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'GovConnect Channel Service API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
  },
}));

// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ... routes
```

---

## 🚀 DEPLOYMENT COMMANDS

```bash
# 1. Install dependencies di semua services
cd govconnect-channel-service && pnpm add swagger-jsdoc swagger-ui-express
cd ../govconnect-case-service && pnpm add swagger-jsdoc swagger-ui-express

# 2. Access Swagger UI
# Channel Service: http://localhost:3001/api-docs
# Case Service: http://localhost:3003/api-docs
# Dashboard API: http://localhost:3000/api/docs

# 3. Export OpenAPI spec
curl http://localhost:3003/api-docs.json > docs/openapi/case-service.json

# 4. Generate Postman collection (using openapi-to-postman)
npx openapi2postmanv2 -s docs/openapi/case-service.json -o docs/postman/case-service.json
```

---

## ✅ COMPLETION CRITERIA

Phase 10 dianggap selesai jika:

- [x] swagger-jsdoc & swagger-ui-express installed
- [x] All endpoints documented dengan JSDoc annotations
- [x] Swagger UI accessible di `/api-docs`
- [x] Request/Response schemas defined
- [x] Example values provided
- [x] Authentication documented (API Key, JWT)
- [x] OpenAPI spec exportable sebagai JSON/YAML
- [x] Postman collection generated (docs/openapi/openapi.yaml)

---

**Phase 10 Status**: ✅ Completed  
**Last Updated**: December 3, 2025
