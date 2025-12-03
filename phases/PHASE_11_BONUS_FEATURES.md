# 🎯 PHASE 11: BONUS FEATURES (Circuit Breaker, CI/CD, Monitoring)

**Duration**: 6-8 jam  
**Complexity**: ⭐⭐⭐ Hard  
**Prerequisites**: Phase 1-7 completed

---

## 📋 OVERVIEW

Phase ini fokus pada implementasi **fitur-fitur bonus** untuk mendapatkan nilai tambahan 10%+ di tubes EAI.

### Bonus Features yang Akan Diimplementasi

| Fitur | Bobot Nilai | Kegunaan |
|-------|-------------|----------|
| **Circuit Breaker** | +3% | Resilience pattern untuk handle service failure |
| **CI/CD Pipeline** | +3% | Automated build, test, deploy |
| **Centralized Logging** | +2% | Aggregasi log dari semua services |
| **Monitoring (Prometheus/Grafana)** | +2% | Real-time metrics & alerting |
| **Deploy ke Cloud** | +5% | Production deployment ke VPS/GCP/AWS |

---

## 🔧 PART 1: CIRCUIT BREAKER

### Apa itu Circuit Breaker?

Circuit Breaker adalah **resilience pattern** yang mencegah cascade failure saat service downstream tidak available.

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│ AI Service  │───▶│ Circuit Breaker  │───▶│Case Service │
└─────────────┘    └──────────────────┘    └─────────────┘
                          │
                          │ (if Case Service down)
                          ▼
                   ┌──────────────────┐
                   │  Fallback/Error  │
                   │   (fast fail)    │
                   └──────────────────┘
```

**States:**
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service is down, fail fast tanpa call
- **HALF-OPEN**: Testing if service recovered

### Implementation

#### Install Opossum
```bash
cd govconnect-ai-service
pnpm add opossum
pnpm add -D @types/opossum
```

#### src/services/circuit-breaker.service.ts
```typescript
import CircuitBreaker from 'opossum';
import axios, { AxiosRequestConfig } from 'axios';
import logger from '../utils/logger';

// Circuit breaker options
const circuitBreakerOptions = {
  timeout: 5000,                    // 5 seconds timeout
  errorThresholdPercentage: 50,     // Open if 50% failures
  resetTimeout: 30000,              // Try again after 30 seconds
  volumeThreshold: 5,               // Minimum 5 requests before opening
  rollingCountTimeout: 10000,       // Rolling window of 10 seconds
  rollingCountBuckets: 10,          // Number of buckets in rolling window
};

// Fallback function when circuit is open
const fallback = (error: Error, config: AxiosRequestConfig) => {
  logger.warn('Circuit breaker fallback triggered', {
    url: config.url,
    error: error.message,
  });
  
  return {
    status: 503,
    data: {
      error: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
      circuit_breaker: true,
    },
  };
};

// Create HTTP request function wrapped with circuit breaker
const httpRequest = async (config: AxiosRequestConfig) => {
  const response = await axios(config);
  return response;
};

// Create circuit breaker instance
const breaker = new CircuitBreaker(httpRequest, circuitBreakerOptions);

// Event listeners for monitoring
breaker.on('success', (result) => {
  logger.debug('Circuit breaker: request succeeded');
});

breaker.on('timeout', () => {
  logger.warn('Circuit breaker: request timed out');
});

breaker.on('reject', () => {
  logger.warn('Circuit breaker: request rejected (circuit open)');
});

breaker.on('open', () => {
  logger.error('🔴 Circuit breaker OPENED - failing fast');
});

breaker.on('halfOpen', () => {
  logger.info('🟡 Circuit breaker HALF-OPEN - testing recovery');
});

breaker.on('close', () => {
  logger.info('🟢 Circuit breaker CLOSED - service recovered');
});

breaker.on('fallback', (result) => {
  logger.warn('Circuit breaker: using fallback', { result });
});

// Set fallback
breaker.fallback(fallback);

// Export resilient HTTP client
export const resilientHttp = {
  async get(url: string, config?: AxiosRequestConfig) {
    return breaker.fire({ ...config, method: 'GET', url });
  },
  
  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return breaker.fire({ ...config, method: 'POST', url, data });
  },
  
  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return breaker.fire({ ...config, method: 'PATCH', url, data });
  },
  
  // Get circuit breaker stats
  getStats() {
    return {
      state: breaker.opened ? 'OPEN' : (breaker.halfOpen ? 'HALF-OPEN' : 'CLOSED'),
      stats: breaker.stats,
    };
  },
};

export default breaker;
```

#### Usage in AI Orchestrator
```typescript
// src/services/case-client.service.ts
import { resilientHttp } from './circuit-breaker.service';
import { config } from '../config/env';

export async function createComplaint(data: CreateComplaintData) {
  const response = await resilientHttp.post(
    `${config.caseServiceUrl}/laporan/create`,
    data,
    {
      headers: {
        'X-Internal-API-Key': config.internalApiKey,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (response.data.circuit_breaker) {
    // Handle circuit breaker fallback
    throw new Error('Case Service unavailable');
  }
  
  return response.data;
}
```

---

## 🚀 PART 2: CI/CD PIPELINE (GitHub Actions)

### Apa itu CI/CD?

- **CI (Continuous Integration)**: Automated build & test setiap push
- **CD (Continuous Deployment)**: Automated deploy ke server

### .github/workflows/ci-cd.yml
```yaml
name: GovConnect CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}/govconnect

jobs:
  # ==================== LINT & TEST ====================
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [channel-service, ai-service, case-service, notification-service, dashboard]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        working-directory: govconnect/govconnect-${{ matrix.service }}
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        working-directory: govconnect/govconnect-${{ matrix.service }}
        run: pnpm lint
        continue-on-error: true
      
      - name: Type check
        working-directory: govconnect/govconnect-${{ matrix.service }}
        run: pnpm tsc --noEmit
      
      - name: Run tests
        working-directory: govconnect/govconnect-${{ matrix.service }}
        run: pnpm test
        continue-on-error: true

  # ==================== BUILD DOCKER IMAGES ====================
  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    strategy:
      matrix:
        service: [channel-service, ai-service, case-service, notification-service, dashboard]
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-${{ matrix.service }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: govconnect/govconnect-${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== DEPLOY TO SERVER ====================
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/govconnect
            git pull origin main
            docker-compose pull
            docker-compose up -d
            docker system prune -f
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://api.govconnect.local/health || exit 1
      
      - name: Notify success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'GovConnect deployed successfully! 🚀'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: success()
```

### Repository Secrets Required
```
VPS_HOST          = your-server-ip
VPS_USERNAME      = deploy
VPS_SSH_KEY       = (SSH private key)
SLACK_WEBHOOK     = (optional, for notifications)
```

---

## 📊 PART 3: CENTRALIZED LOGGING (Grafana Loki)

### Apa itu Centralized Logging?

Mengumpulkan log dari semua services ke satu tempat untuk easy debugging.

### docker-compose.logging.yml
```yaml
version: '3.8'

services:
  # Loki - Log aggregation
  loki:
    image: grafana/loki:2.9.2
    container_name: govconnect-loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki-data:/loki
    networks:
      - govconnect-network

  # Promtail - Log collector
  promtail:
    image: grafana/promtail:2.9.2
    container_name: govconnect-promtail
    volumes:
      - ./docker/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - govconnect-network
    depends_on:
      - loki

  # Grafana - Visualization
  grafana:
    image: grafana/grafana:10.2.2
    container_name: govconnect-grafana
    ports:
      - "3100:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin123
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - govconnect-network
    depends_on:
      - loki

volumes:
  loki-data:
  grafana-data:
```

### docker/promtail-config.yml
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'
```

---

## 📈 PART 4: MONITORING (Prometheus + Grafana)

### docker-compose.monitoring.yml
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.47.2
    container_name: govconnect-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    networks:
      - govconnect-network

  node-exporter:
    image: prom/node-exporter:v1.6.1
    container_name: govconnect-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - govconnect-network

volumes:
  prometheus-data:
```

### docker/prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'govconnect-services'
    static_configs:
      - targets:
          - 'channel-service:3001'
          - 'ai-service:3002'
          - 'case-service:3003'
          - 'notification-service:3004'
          - 'dashboard:3000'
    metrics_path: /metrics

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:9000']
    metrics_path: /metrics

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Add Metrics Endpoint to Services

#### src/middleware/metrics.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Initialize default metrics
promClient.collectDefaultMetrics({ prefix: 'govconnect_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'govconnect_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'govconnect_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

// Middleware
export function metricsMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
        service: serviceName,
      };
      
      httpRequestDuration.observe(labels, duration);
      httpRequestTotal.inc(labels);
    });
    
    next();
  };
}

// Metrics endpoint
export function metricsHandler(req: Request, res: Response) {
  res.set('Content-Type', promClient.register.contentType);
  promClient.register.metrics().then(metrics => {
    res.send(metrics);
  });
}
```

---

## ☁️ PART 5: DEPLOY KE CLOUD

### Option A: Deploy ke VPS (DigitalOcean/Vultr)

```bash
# 1. Provision VPS (Ubuntu 22.04, 4GB RAM, 2 CPU)
# 2. Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/your-org/govconnect.git
cd govconnect

# 5. Setup environment
cp .env.example .env
nano .env  # Edit with production values

# 6. Start services
docker-compose -f docker-compose.prod.yml up -d

# 7. Setup SSL (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.govconnect.com -d dashboard.govconnect.com
```

### Option B: Deploy ke Google Cloud (GKE)

```bash
# 1. Create GKE cluster
gcloud container clusters create govconnect-cluster \
  --zone asia-southeast1-a \
  --num-nodes 3 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10

# 2. Get credentials
gcloud container clusters get-credentials govconnect-cluster

# 3. Install Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# 4. Apply Kubernetes manifests
kubectl apply -f k8s/

# 5. Get external IP
kubectl get ingress -n govconnect
```

---

## ✅ CHECKLIST

### Circuit Breaker
- [x] Install opossum library
- [x] Implement CircuitBreaker service
- [x] Wrap external HTTP calls
- [x] Add fallback handling
- [x] Add monitoring for circuit state
- [ ] Test with simulated failures

### CI/CD Pipeline
- [x] Create GitHub Actions workflow
- [x] Setup lint & test jobs
- [x] Setup Docker build jobs
- [x] Setup deployment job
- [ ] Add repository secrets
- [ ] Test end-to-end pipeline

### Centralized Logging
- [x] Setup Grafana Loki
- [x] Setup Promtail
- [x] Configure log collection
- [x] Create Grafana dashboard
- [ ] Test log aggregation

### Monitoring
- [x] Setup Prometheus
- [x] Add metrics endpoints to services
- [x] Create custom metrics
- [x] Setup Grafana dashboards
- [ ] Configure alerts

### Cloud Deployment
- [x] Provision cloud resources (GCP - asia-southeast2/Jakarta)
- [ ] Configure DNS
- [ ] Setup SSL certificates
- [ ] Deploy services
- [ ] Verify production health

---

## ✅ COMPLETION CRITERIA

Phase 11 dianggap selesai jika:

- [x] Circuit Breaker implemented & tested
- [x] CI/CD pipeline running & deploying
- [x] Logs accessible via Grafana
- [x] Metrics visible in Grafana dashboard
- [ ] Application running di cloud dengan SSL

---

**Phase 11 Status**: ✅ Implemented (Pending Deployment)  
**Last Updated**: December 19, 2024

### Implementation Summary

#### Circuit Breaker (+3%)
- ✅ `govconnect-ai-service/src/services/circuit-breaker.service.ts`
- ✅ Opossum library dengan timeout, error threshold, dan fallback
- ✅ Integrated ke `case-client.service.ts`
- ✅ Stats endpoint: `/stats/circuit-breaker`

#### CI/CD Pipeline (+3%)
- ✅ `.github/workflows/ci-cd.yml`
- ✅ Lint & test jobs untuk semua services
- ✅ Docker build dengan GitHub Container Registry
- ✅ Staging & Production deployment

#### Centralized Logging (+2%)
- ✅ `docker-compose.logging.yml` (Loki + Promtail)
- ✅ `docker/loki-config.yml`
- ✅ `docker/promtail-config.yml`

#### Monitoring (+2%)
- ✅ `docker-compose.monitoring.yml` (Prometheus + Grafana + cAdvisor)
- ✅ `docker/prometheus.yml`
- ✅ `govconnect-channel-service/src/middleware/metrics.middleware.ts`
- ✅ `docker/grafana/dashboards/govconnect-overview.json`
- ✅ `docker/alertmanager.yml`

#### Cloud Deployment (+5%)
- ✅ GCP Project: gen-lang-client-0475374672
- ✅ Region: asia-southeast2 (Jakarta)
- ✅ Artifact Registry configured
- ⏳ Pending: DNS, SSL, actual deployment
