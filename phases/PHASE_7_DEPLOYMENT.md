# PHASE 7: PRODUCTION DEPLOYMENT

**Duration**: 3-4 jam  
**Complexity**: ⭐⭐ Medium  
**Prerequisites**: Phase 0-6 completed
**Status**: ✅ FILES CREATED

---

## 🎯 OBJECTIVES

- Setup production environment dengan Docker Compose
- Deploy semua services dengan konfigurasi production
- Configure NGINX sebagai API Gateway
- Setup monitoring & logging
- Configure domain & SSL

---

## 📐 CURRENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌──────────────────────────────────────────┐
              │         NGINX (API Gateway)              │
              │         Port 80/443                      │
              │   - SSL Termination                      │
              │   - Rate Limiting                        │
              │   - Request Routing                      │
              └──────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                         ▼                         ▼
  ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
  │  Dashboard    │         │   Channel     │         │   API Routes  │
  │    :3000      │         │   Service     │         │  /api/cases   │
  │   (Next.js)   │         │    :3001      │         │  /api/ai      │
  └───────────────┘         │  (Webhook)    │         │  /api/notif   │
                            └───────────────┘         └───────────────┘

  ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
  │  AI Service   │         │ Case Service  │         │ Notification  │
  │    :3002      │         │    :3003      │         │    :3004      │
  └───────────────┘         └───────────────┘         └───────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
          ┌─────────────────────────────────────────────────┐
          │   ┌────────────────┐    ┌────────────────────┐  │
          │   │  PostgreSQL    │    │     RabbitMQ       │  │
          │   │   (pgvector)   │    │    (govconnect)    │  │
          │   │  ┌─────────┐   │    │  Exchanges:        │  │
          │   │  │ channel │   │    │  - messages        │  │
          │   │  │  cases  │   │    │  - cases           │  │
          │   │  │ notif.  │   │    │  - notifications   │  │
          │   │  │dashboard│   │    │                    │  │
          │   │  └─────────┘   │    │                    │  │
          │   │   Schemas      │    │                    │  │
          │   └────────────────┘    └────────────────────┘  │
          └─────────────────────────────────────────────────┘
```

## 📦 DATABASE ARCHITECTURE

Menggunakan **single PostgreSQL instance** dengan **schema-per-service pattern**:

```
govconnect (database)
├── channel (schema)     → Channel Service
├── cases (schema)       → Case Service  
├── notification (schema) → Notification Service
└── dashboard (schema)   → Dashboard Service
```

**Database URL Pattern:**
```
postgresql://postgres:{password}@postgres:5432/govconnect?schema={schema_name}
```

---

## 📋 PRODUCTION FILES CREATED

### ✅ docker-compose.prod.yml
- Single PostgreSQL dengan pgvector
- RabbitMQ dengan vhost `govconnect`
- 5 Microservices dengan health checks & resource limits
- NGINX sebagai API Gateway

### ✅ .env.production.example
Template environment variables untuk production

### ✅ nginx/nginx.conf
- Rate limiting (30 req/s API, 100 req/s webhook)
- Security headers
- Request routing
- Gzip compression

---

## 📋 CHECKLIST

### 1. Pre-Deployment Preparation

- [ ] **Environment Variables**:
  - [ ] Create `.env.production` untuk semua services
  - [ ] Generate production API keys & secrets
  - [ ] Setup WA API credentials (production)
  - [ ] Setup Gemini API key (production quota)
  - [ ] Setup strong JWT secret
- [ ] **Database Backup**:
  - [ ] Backup seed data
  - [ ] Document restore procedure
- [ ] **Code Review Final**:
  - [ ] Remove all console.log
  - [ ] Remove development comments
  - [ ] Check all error handlers
  - [ ] Verify no hardcoded URLs

### 2. Docker Images

- [ ] **Build all Docker images**:
  - [ ] Service 1 (Channel): `docker build -t govconnect-channel:latest`
  - [ ] Service 2 (AI): `docker build -t govconnect-ai:latest`
  - [ ] Service 3 (Case): `docker build -t govconnect-case:latest`
  - [ ] Service 4 (Dashboard): `docker build -t govconnect-dashboard:latest`
  - [ ] Service 5 (Notification): `docker build -t govconnect-notification:latest`
- [ ] Test all images locally
- [ ] Push to registry (optional: Docker Hub / private registry)

### 3. Production Docker Compose

- [ ] Create `docker-compose.prod.yml`:
  - [ ] Use production environment variables
  - [ ] Configure restart policies (`restart: always`)
  - [ ] Setup health checks
  - [ ] Configure resource limits
  - [ ] Setup networks & volumes
- [ ] Add Nginx reverse proxy (optional)
- [ ] Add SSL certificates (Let's Encrypt)

### 4. Server Setup

- [ ] **Provision Server** (VPS / Cloud):
  - [ ] Minimum: 4 CPU, 8GB RAM, 50GB SSD
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] Install Docker & Docker Compose
  - [ ] Install Nginx (if not using Docker)
  - [ ] Configure firewall (UFW)
- [ ] **Clone Repository**:
  - [ ] `git clone <repo>`
  - [ ] Copy `.env.production`
  - [ ] Set correct file permissions

### 5. Database Migration

- [ ] Run migrations for all services:
  - [ ] `docker-compose -f docker-compose.prod.yml run channel-service pnpm prisma migrate deploy`
  - [ ] Repeat for case-service, notification-service, dashboard
- [ ] Seed default admin user (dashboard)
- [ ] Verify all tables created

### 6. Deployment

- [ ] Start services:
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```
- [ ] Check all containers running:
  ```bash
  docker-compose ps
  ```
- [ ] Check logs:
  ```bash
  docker-compose logs -f
  ```

### 7. Domain & SSL Setup

- [ ] **Configure Domain**:
  - [ ] Point domain to server IP (A record)
  - [ ] Subdomain for dashboard: `dashboard.govconnect.id`
  - [ ] Subdomain for webhook: `api.govconnect.id`
- [ ] **Setup SSL**:
  - [ ] Install Certbot
  - [ ] Generate Let's Encrypt certificates
  - [ ] Configure Nginx with SSL
  - [ ] Auto-renewal setup

### 8. WhatsApp Webhook Configuration

- [ ] Configure webhook URL in WA provider:
  - [ ] URL: `https://api.govconnect.id/webhook/whatsapp`
  - [ ] Verify token setup
  - [ ] Test webhook delivery
- [ ] Verify HMAC signature (if enabled)

### 9. Monitoring & Logging

- [ ] **Setup Log Rotation**:
  - [ ] Configure logrotate for all services
  - [ ] Keep last 7 days of logs
- [ ] **Setup Monitoring** (optional):
  - [ ] Install Prometheus + Grafana (or use cloud monitoring)
  - [ ] Setup alerts (email/Slack)
  - [ ] Monitor:
    - [ ] CPU & memory usage
    - [ ] Disk space
    - [ ] Service health
    - [ ] RabbitMQ queue depth
    - [ ] Database connections
- [ ] **Error Tracking** (optional):
  - [ ] Setup Sentry or similar
  - [ ] Configure error reporting

### 10. Production Testing

- [ ] **Smoke Tests**:
  - [ ] Send test webhook → verify end-to-end flow
  - [ ] Login to dashboard → verify access
  - [ ] Create test complaint → verify in DB
  - [ ] Update status → verify notification sent
- [ ] **Load Test**:
  - [ ] Run load test script (100 concurrent requests)
  - [ ] Monitor server resources
  - [ ] Check for errors
- [ ] **Security Scan**:
  - [ ] Run SSL test (ssllabs.com)
  - [ ] Check open ports (`nmap`)
  - [ ] Verify firewall rules

### 11. Backup & Recovery

- [ ] **Database Backup**:
  - [ ] Setup automated daily backups (pg_dump)
  - [ ] Store backups off-site (S3 / Backblaze)
  - [ ] Test restore procedure
- [ ] **Code Backup**:
  - [ ] Push to Git repository
  - [ ] Tag release version
- [ ] **Disaster Recovery Plan**:
  - [ ] Document restore steps
  - [ ] Document rollback procedure

### 12. Documentation

- [ ] **Production README**:
  - [ ] Server specs
  - [ ] Deployment steps
  - [ ] Monitoring URLs
  - [ ] Emergency contacts
- [ ] **Runbook**:
  - [ ] How to restart services
  - [ ] How to view logs
  - [ ] How to scale
  - [ ] Common issues & fixes
- [ ] **User Guide** (for admin):
  - [ ] How to login
  - [ ] How to manage laporan/tiket
  - [ ] How to update status

---

## 🚀 DEPLOYMENT COMMANDS

```powershell
# 1. Navigate to govconnect folder
cd c:\Yoga\Programming\Kuliah\clivy\govconnect

# 2. Copy environment template
Copy-Item .env.production.example .env.production

# 3. Edit .env.production (CHANGE ALL PASSWORDS!)

# 4. Build all images
docker-compose -f docker-compose.prod.yml build

# 5. Start services
docker-compose -f docker-compose.prod.yml up -d

# 6. Check status
docker-compose -f docker-compose.prod.yml ps

# 7. Run migrations
docker-compose -f docker-compose.prod.yml exec channel-service npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec case-service npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec notification-service npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec dashboard npx prisma migrate deploy
```

---

## 🔄 API ROUTING (NGINX)

| Path | Destination | Service |
|------|-------------|---------|
| `/` | `dashboard:3000` | Dashboard |
| `/webhook` | `channel-service:3001` | WhatsApp Webhook |
| `/api/channel/*` | `channel-service:3001` | Channel API |
| `/api/cases/*` | `case-service:3003` | Case API |
| `/api/ai/*` | `ai-service:3002` | AI API |
| `/api/notifications/*` | `notification-service:3004` | Notification API |
| `/uploads/*` | `channel-service:3001` | Media Files |

---

## ✅ COMPLETION CRITERIA

- [x] `docker-compose.prod.yml` created
- [x] `.env.production.example` created  
- [x] `nginx/nginx.conf` created
- [ ] All images build successfully
- [ ] All containers start and pass health checks
- [ ] Database migrations run successfully

---

**Phase 7 Status**: ✅ FILES CREATED  
**Last Updated**: November 25, 2025
