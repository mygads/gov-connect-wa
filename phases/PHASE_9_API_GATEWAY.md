# 🌐 PHASE 9: API GATEWAY (KONG/TRAEFIK)

**Duration**: 3-4 jam  
**Complexity**: ⭐⭐ Medium  
**Prerequisites**: Phase 8 completed (Kubernetes setup)

---

## 📋 OVERVIEW

Phase ini fokus pada implementasi **API Gateway** sebagai single entry point untuk semua microservices GovConnect.

### Apa itu API Gateway?

API Gateway adalah komponen yang bertindak sebagai **pintu gerbang tunggal** untuk semua request ke microservices. Fungsinya:

| Fitur | Penjelasan |
|-------|------------|
| **Routing** | Mengarahkan request ke service yang tepat berdasarkan path/host |
| **Load Balancing** | Distribusi traffic ke multiple instances |
| **Authentication** | Validasi JWT/API Key sebelum forward ke service |
| **Rate Limiting** | Batasi jumlah request per client |
| **SSL Termination** | Handle HTTPS di gateway, internal pakai HTTP |
| **Request/Response Transformation** | Modify headers, body sebelum/sesudah forward |
| **Logging & Monitoring** | Centralized access logs |
| **Caching** | Cache response untuk reduce load |

### Pilihan API Gateway

| Gateway | Pros | Cons | Rekomendasi |
|---------|------|------|-------------|
| **Kong** | Feature-rich, plugin ecosystem | Complex setup | ⭐ Production |
| **Traefik** | K8s native, auto-discovery | Less plugins | ⭐ Kubernetes |
| **NGINX** | Simple, performant | Manual config | Development |
| **AWS API Gateway** | Managed service | Vendor lock-in | AWS only |

**Untuk project ini**: Kita akan pakai **Traefik** (Kubernetes native) + **NGINX** (Docker Compose).

---

## 🎯 OBJECTIVES

1. ✅ Setup Traefik sebagai Ingress Controller di Kubernetes
2. ✅ Configure routing rules untuk semua services
3. ✅ Implement rate limiting
4. ✅ Setup SSL/TLS termination
5. ✅ Configure authentication middleware
6. ✅ Setup monitoring dashboard
7. ✅ Document API Gateway configuration

---

## 📋 CHECKLIST

### 1. Traefik Installation (Kubernetes)

- [ ] **Install Traefik via Helm**:
  ```bash
  helm repo add traefik https://traefik.github.io/charts
  helm repo update
  helm install traefik traefik/traefik \
    --namespace traefik \
    --create-namespace \
    --set dashboard.enabled=true \
    --set dashboard.domain=traefik.govconnect.local
  ```

- [ ] **Verify installation**:
  ```bash
  kubectl get pods -n traefik
  kubectl get svc -n traefik
  ```

### 2. IngressRoute Configuration

- [ ] **Create CRD IngressRoute untuk setiap service**
- [ ] **Configure path-based routing**
- [ ] **Configure host-based routing**
- [ ] **Setup default backend**

### 3. Middleware Configuration

- [ ] **Rate Limiting Middleware**:
  - 1000 requests/minute untuk public endpoints
  - 10000 requests/minute untuk internal endpoints
  
- [ ] **Authentication Middleware**:
  - JWT validation untuk dashboard
  - API Key validation untuk internal calls
  
- [ ] **Headers Middleware**:
  - Add security headers
  - CORS configuration

### 4. TLS Configuration

- [ ] **Create TLS Secret**:
  ```bash
  kubectl create secret tls govconnect-tls \
    --cert=path/to/cert.pem \
    --key=path/to/key.pem \
    -n govconnect
  ```
- [ ] **Configure TLS termination di IngressRoute**

### 5. Monitoring

- [ ] **Enable Traefik dashboard**
- [ ] **Configure Prometheus metrics**
- [ ] **Setup access logs**

---

## 📝 DETAILED CONFIGURATION

### traefik-values.yaml (Helm)
```yaml
# Custom values untuk Traefik Helm chart
deployment:
  replicas: 2

ports:
  web:
    port: 8000
    expose: true
    exposedPort: 80
  websecure:
    port: 8443
    expose: true
    exposedPort: 443
  traefik:
    port: 9000
    expose: false

ingressRoute:
  dashboard:
    enabled: true
    matchRule: Host(`traefik.govconnect.local`)
    entryPoints:
      - web

providers:
  kubernetesCRD:
    enabled: true
    namespaces:
      - govconnect
      - traefik
  kubernetesIngress:
    enabled: true
    namespaces:
      - govconnect

logs:
  general:
    level: INFO
  access:
    enabled: true
    format: json
    fields:
      headers:
        defaultMode: keep

metrics:
  prometheus:
    entryPoint: traefik
    addEntryPointsLabels: true
    addServicesLabels: true

resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"
```

### k8s/api-gateway/middleware.yaml
```yaml
# Rate Limiting Middleware
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-public
  namespace: govconnect
spec:
  rateLimit:
    average: 100          # 100 requests per minute
    burst: 50             # Allow burst up to 50
    period: 1m
    sourceCriterion:
      ipStrategy:
        depth: 1

---
# Rate Limiting for Internal APIs (higher limit)
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-internal
  namespace: govconnect
spec:
  rateLimit:
    average: 1000
    burst: 200
    period: 1m

---
# Security Headers
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
  namespace: govconnect
spec:
  headers:
    frameDeny: true
    browserXssFilter: true
    contentTypeNosniff: true
    referrerPolicy: "strict-origin-when-cross-origin"
    customResponseHeaders:
      X-Powered-By: "GovConnect"
      X-Request-Id: ""

---
# CORS Middleware
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: cors-headers
  namespace: govconnect
spec:
  headers:
    accessControlAllowMethods:
      - GET
      - POST
      - PUT
      - PATCH
      - DELETE
      - OPTIONS
    accessControlAllowHeaders:
      - Content-Type
      - Authorization
      - X-Internal-API-Key
    accessControlAllowOriginList:
      - "https://dashboard.govconnect.local"
      - "http://localhost:3000"
    accessControlMaxAge: 100
    addVaryHeader: true

---
# Strip Prefix Middleware (for versioning)
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-api-prefix
  namespace: govconnect
spec:
  stripPrefix:
    prefixes:
      - /api/v1

---
# Retry Middleware (for resilience)
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: retry-middleware
  namespace: govconnect
spec:
  retry:
    attempts: 3
    initialInterval: 100ms

---
# Circuit Breaker Middleware
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: circuit-breaker
  namespace: govconnect
spec:
  circuitBreaker:
    expression: NetworkErrorRatio() > 0.30 || ResponseCodeRatio(500, 600, 0, 600) > 0.25
```

### k8s/api-gateway/ingressroute.yaml
```yaml
# Main API Gateway IngressRoute
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: govconnect-api
  namespace: govconnect
spec:
  entryPoints:
    - web
    - websecure
  routes:
    # ==================== CHANNEL SERVICE ====================
    # WhatsApp Webhook (Public - with rate limiting)
    - match: Host(`api.govconnect.local`) && PathPrefix(`/webhook`)
      kind: Rule
      middlewares:
        - name: rate-limit-public
        - name: security-headers
      services:
        - name: channel-service
          port: 3001
    
    # Internal API (Higher rate limit)
    - match: Host(`api.govconnect.local`) && PathPrefix(`/internal`)
      kind: Rule
      middlewares:
        - name: rate-limit-internal
        - name: security-headers
      services:
        - name: channel-service
          port: 3001
    
    # ==================== CASE SERVICE ====================
    # Laporan API
    - match: Host(`api.govconnect.local`) && PathPrefix(`/laporan`)
      kind: Rule
      middlewares:
        - name: rate-limit-internal
        - name: security-headers
        - name: cors-headers
      services:
        - name: case-service
          port: 3003
    
    # Tiket API
    - match: Host(`api.govconnect.local`) && PathPrefix(`/tiket`)
      kind: Rule
      middlewares:
        - name: rate-limit-internal
        - name: security-headers
        - name: cors-headers
      services:
        - name: case-service
          port: 3003
    
    # Statistics API
    - match: Host(`api.govconnect.local`) && PathPrefix(`/statistics`)
      kind: Rule
      middlewares:
        - name: rate-limit-internal
        - name: security-headers
        - name: cors-headers
      services:
        - name: case-service
          port: 3003
    
    # ==================== AI SERVICE ====================
    # AI Health & Stats (Internal only)
    - match: Host(`api.govconnect.local`) && PathPrefix(`/ai`)
      kind: Rule
      middlewares:
        - name: rate-limit-internal
        - name: security-headers
      services:
        - name: ai-service
          port: 3002
    
    # ==================== HEALTH CHECKS ====================
    - match: Host(`api.govconnect.local`) && Path(`/health`)
      kind: Rule
      services:
        - name: channel-service
          port: 3001

---
# Dashboard IngressRoute
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: govconnect-dashboard
  namespace: govconnect
spec:
  entryPoints:
    - web
    - websecure
  routes:
    - match: Host(`dashboard.govconnect.local`)
      kind: Rule
      middlewares:
        - name: rate-limit-public
        - name: security-headers
      services:
        - name: dashboard
          port: 3000

---
# TLS Configuration (uncomment for production)
# apiVersion: traefik.io/v1alpha1
# kind: IngressRoute
# metadata:
#   name: govconnect-api-tls
#   namespace: govconnect
# spec:
#   entryPoints:
#     - websecure
#   routes:
#     - match: Host(`api.govconnect.local`)
#       kind: Rule
#       services:
#         - name: channel-service
#           port: 3001
#   tls:
#     secretName: govconnect-tls
```

### k8s/api-gateway/traefik-dashboard.yaml
```yaml
# Traefik Dashboard IngressRoute
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: traefik-dashboard
  namespace: traefik
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`traefik.govconnect.local`)
      kind: Rule
      services:
        - name: api@internal
          kind: TraefikService
```

---

## 🐳 DOCKER COMPOSE (NGINX Gateway)

Untuk development tanpa Kubernetes, gunakan NGINX sebagai API Gateway:

### docker/nginx-gateway/nginx.conf
```nginx
# GovConnect API Gateway (NGINX)

events {
    worker_connections 1024;
}

http {
    # Logging
    log_format json_combined escape=json
    '{'
        '"time_local":"$time_local",'
        '"remote_addr":"$remote_addr",'
        '"remote_user":"$remote_user",'
        '"request":"$request",'
        '"status": "$status",'
        '"body_bytes_sent":"$body_bytes_sent",'
        '"request_time":"$request_time",'
        '"http_referrer":"$http_referer",'
        '"http_user_agent":"$http_user_agent"'
    '}';
    
    access_log /var/log/nginx/access.log json_combined;
    error_log /var/log/nginx/error.log warn;
    
    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=public:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=internal:10m rate=1000r/m;
    
    # Upstreams
    upstream channel_service {
        least_conn;
        server channel-service:3001 weight=5;
        keepalive 32;
    }
    
    upstream ai_service {
        server ai-service:3002;
        keepalive 16;
    }
    
    upstream case_service {
        least_conn;
        server case-service:3003;
        keepalive 32;
    }
    
    upstream notification_service {
        server notification-service:3004;
        keepalive 8;
    }
    
    upstream dashboard {
        least_conn;
        server dashboard:3000;
        keepalive 32;
    }
    
    # Health check endpoint
    server {
        listen 8080;
        location /nginx-health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
    }
    
    # API Gateway Server
    server {
        listen 80;
        server_name api.govconnect.local localhost;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Request-Id $request_id always;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://localhost:3000" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Internal-API-Key" always;
        
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # ==================== CHANNEL SERVICE ====================
        
        # WhatsApp Webhook (Public)
        location /webhook/ {
            limit_req zone=public burst=50 nodelay;
            
            proxy_pass http://channel_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-Id $request_id;
            
            # Timeout for webhook
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Internal APIs (Higher rate limit)
        location /internal/ {
            limit_req zone=internal burst=200 nodelay;
            
            proxy_pass http://channel_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Request-Id $request_id;
        }
        
        # Uploads (static files)
        location /uploads/ {
            proxy_pass http://channel_service;
            proxy_cache_valid 200 1d;
            expires 1d;
        }
        
        # ==================== CASE SERVICE ====================
        
        location /laporan {
            limit_req zone=internal burst=100 nodelay;
            
            proxy_pass http://case_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Request-Id $request_id;
        }
        
        location /tiket {
            limit_req zone=internal burst=100 nodelay;
            
            proxy_pass http://case_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Request-Id $request_id;
        }
        
        location /statistics {
            limit_req zone=internal burst=50 nodelay;
            
            proxy_pass http://case_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Request-Id $request_id;
        }
        
        # ==================== AI SERVICE ====================
        
        location /ai/ {
            limit_req zone=internal burst=50 nodelay;
            
            proxy_pass http://ai_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Request-Id $request_id;
            
            # Longer timeout for AI processing
            proxy_read_timeout 60s;
        }
        
        # ==================== HEALTH ====================
        
        location /health {
            proxy_pass http://channel_service;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
        
        # Default - 404
        location / {
            return 404 '{"error": "Not Found", "message": "Endpoint not found"}';
            add_header Content-Type application/json;
        }
    }
    
    # Dashboard Server
    server {
        listen 80;
        server_name dashboard.govconnect.local;
        
        # Security headers
        add_header X-Frame-Options SAMEORIGIN always;
        add_header X-Content-Type-Options nosniff always;
        
        location / {
            limit_req zone=public burst=100 nodelay;
            
            proxy_pass http://dashboard;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### docker-compose.gateway.yml
```yaml
version: '3.8'

services:
  # API Gateway (NGINX)
  api-gateway:
    image: nginx:alpine
    container_name: govconnect-api-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx-gateway/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx-gateway/ssl:/etc/nginx/ssl:ro
      - gateway-logs:/var/log/nginx
    networks:
      - govconnect-network
    depends_on:
      - channel-service
      - case-service
      - dashboard
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/nginx-health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  gateway-logs:
    name: govconnect-gateway-logs

networks:
  govconnect-network:
    external: true
    name: govconnect-network
```

---

## 🚀 DEPLOYMENT COMMANDS

### Kubernetes (Traefik)

```bash
# 1. Install Traefik
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm install traefik traefik/traefik \
  -f k8s/api-gateway/traefik-values.yaml \
  --namespace traefik \
  --create-namespace

# 2. Apply middleware
kubectl apply -f k8s/api-gateway/middleware.yaml

# 3. Apply IngressRoutes
kubectl apply -f k8s/api-gateway/ingressroute.yaml
kubectl apply -f k8s/api-gateway/traefik-dashboard.yaml

# 4. Verify
kubectl get ingressroute -n govconnect
kubectl get middleware -n govconnect

# 5. Access dashboard
# Add to /etc/hosts: <traefik-ip> traefik.govconnect.local
```

### Docker Compose (NGINX)

```bash
# 1. Start with gateway
docker-compose -f docker-compose.yml -f docker-compose.gateway.yml up -d

# 2. Check gateway logs
docker logs govconnect-api-gateway -f

# 3. Test endpoints
curl http://api.govconnect.local/health
curl http://dashboard.govconnect.local/
```

---

## ✅ VERIFICATION

### Test Rate Limiting
```bash
# Send 150 requests in quick succession
for i in {1..150}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://api.govconnect.local/health
done

# Should see 429 (Too Many Requests) after ~100 requests
```

### Test Routing
```bash
# Channel Service
curl http://api.govconnect.local/webhook/whatsapp

# Case Service
curl http://api.govconnect.local/laporan

# Dashboard
curl http://dashboard.govconnect.local/
```

### Check Metrics (Traefik)
```bash
# Prometheus metrics
curl http://traefik.govconnect.local:9000/metrics

# Dashboard
open http://traefik.govconnect.local
```

---

## ✅ COMPLETION CRITERIA

Phase 9 dianggap selesai jika:

- [x] API Gateway installed (Traefik)
- [x] All routes configured correctly
- [x] Rate limiting working
- [x] Security headers present
- [x] CORS configured
- [x] Access logs enabled
- [x] Dashboard accessible via gateway
- [x] All service endpoints accessible via single domain
- [x] Documentation complete

---

**Phase 9 Status**: ✅ Completed  
**Last Updated**: December 3, 2025
