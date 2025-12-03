# 🎯 PHASE 8: KUBERNETES ORCHESTRATION

**Duration**: 4-6 jam  
**Complexity**: ⭐⭐⭐ Hard  
**Prerequisites**: Phase 0-7 completed, basic Kubernetes knowledge
**Status**: ✅ MANIFESTS CREATED

---

## 📋 OVERVIEW

Phase ini fokus pada pembuatan Kubernetes manifest untuk deployment GovConnect ke cluster Kubernetes (Minikube/K3s/GKE/EKS).

### Mengapa Kubernetes Penting?

| Aspek | Penjelasan |
|-------|------------|
| **Container Orchestration** | Otomatis manage container lifecycle (start, stop, restart) |
| **Self-Healing** | Auto-restart container yang crash |
| **Scaling** | Horizontal Pod Autoscaler untuk handle traffic spike |
| **Service Discovery** | Internal DNS untuk komunikasi antar service |
| **Load Balancing** | Distribusi traffic ke multiple pods |
| **Rolling Updates** | Zero-downtime deployment |
| **Secret Management** | Secure storage untuk credentials |

### 📁 MANIFESTS CREATED

```
k8s/
├── 00-namespace.yaml          # Namespace govconnect
├── 01-configmap.yaml          # Non-sensitive configuration
├── 02-secrets.yaml            # Sensitive data (base64 encoded)
├── 10-postgres.yaml           # PostgreSQL StatefulSet + Service + PVC
├── 11-rabbitmq.yaml           # RabbitMQ StatefulSet + Config + PVC
├── 20-channel-service.yaml    # Deployment + Service + HPA
├── 21-ai-service.yaml         # Deployment + Service + HPA
├── 22-case-service.yaml       # Deployment + Service + HPA
├── 23-notification-service.yaml # Deployment + Service + HPA
├── 24-dashboard.yaml          # Deployment + Service + HPA
├── 30-ingress.yaml            # NGINX Ingress + Network Policy
├── deploy.sh                  # Deployment script
└── kustomization.yaml         # Kustomize configuration
```

---

## 🎯 OBJECTIVES

1. ✅ Create Kubernetes namespace untuk isolasi
2. ✅ Setup ConfigMap dan Secrets
3. ✅ Deploy PostgreSQL sebagai StatefulSet
4. ✅ Deploy RabbitMQ sebagai StatefulSet
5. ✅ Deploy semua 5 microservices
6. ✅ Setup Ingress untuk API Gateway
7. ✅ Configure Horizontal Pod Autoscaler
8. ✅ Implement Network Policies

---

## 📋 CHECKLIST

### 1. Namespace & Basic Resources

- [ ] **Create namespace**:
  ```bash
  kubectl create namespace govconnect
  ```
- [ ] **Create `namespace.yaml`**:
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: govconnect
    labels:
      name: govconnect
      project: tubes-eai
  ```

### 2. ConfigMap (Non-Sensitive Config)

- [ ] **Create `configmap.yaml`**:
  - NODE_ENV
  - Service ports
  - Log levels
  - RabbitMQ vhost
  - Internal service URLs

### 3. Secrets (Sensitive Data)

- [ ] **Create `secrets.yaml`** (base64 encoded):
  - DATABASE_URL (per service)
  - RABBITMQ_URL
  - INTERNAL_API_KEY
  - JWT_SECRET
  - GEMINI_API_KEY
  - WA_ACCESS_TOKEN

### 4. StatefulSets (Databases)

- [ ] **PostgreSQL StatefulSet**:
  - PersistentVolumeClaim (10Gi)
  - Init container untuk schema creation
  - Health checks (pg_isready)
  - Resource limits (1Gi RAM, 500m CPU)
  
- [ ] **RabbitMQ StatefulSet**:
  - PersistentVolumeClaim (5Gi)
  - Management plugin enabled
  - Default vhost configuration
  - Resource limits

### 5. Deployments (Microservices)

- [ ] **Channel Service** (Port 3001):
  - Replicas: 2
  - Resource limits: 256Mi RAM, 250m CPU
  - Liveness & Readiness probes
  - Environment from ConfigMap/Secret
  
- [ ] **AI Service** (Port 3002):
  - Replicas: 2
  - Resource limits: 512Mi RAM, 500m CPU (LLM processing)
  - No persistent volume (stateless)
  
- [ ] **Case Service** (Port 3003):
  - Replicas: 2
  - Resource limits: 256Mi RAM, 250m CPU
  
- [ ] **Notification Service** (Port 3004):
  - Replicas: 1
  - Resource limits: 128Mi RAM, 100m CPU
  
- [ ] **Dashboard** (Port 3000):
  - Replicas: 2
  - Resource limits: 256Mi RAM, 250m CPU

### 6. Services (ClusterIP/LoadBalancer)

- [ ] **Internal Services (ClusterIP)**:
  - channel-service → Port 3001
  - ai-service → Port 3002
  - case-service → Port 3003
  - notification-service → Port 3004
  - postgres → Port 5432
  - rabbitmq → Port 5672, 15672

- [ ] **External Services (LoadBalancer/NodePort)**:
  - dashboard → Port 3000 (LoadBalancer)
  - channel-service webhook → Port 3001 (for WhatsApp callback)

### 7. Ingress (API Gateway)

- [ ] **Install Ingress Controller**:
  ```bash
  # For Minikube
  minikube addons enable ingress
  
  # For bare metal
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
  ```

- [ ] **Create `ingress.yaml`**:
  - Host: api.govconnect.local (webhook)
  - Host: dashboard.govconnect.local (admin)
  - TLS termination (optional)

### 8. Horizontal Pod Autoscaler

- [ ] **Channel Service HPA**:
  - Min: 2, Max: 10
  - Target CPU: 70%
  - Target Memory: 80%

- [ ] **AI Service HPA**:
  - Min: 2, Max: 5
  - Target CPU: 80%

### 9. Network Policies

- [ ] **Default deny all ingress**
- [ ] **Allow specific service-to-service communication**
- [ ] **Allow ingress controller to services**

---

## 📝 DETAILED MANIFESTS

### namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: govconnect
  labels:
    name: govconnect
    project: tubes-eai
    environment: production
```

### configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: govconnect-config
  namespace: govconnect
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  
  # Service Ports
  CHANNEL_SERVICE_PORT: "3001"
  AI_SERVICE_PORT: "3002"
  CASE_SERVICE_PORT: "3003"
  NOTIFICATION_SERVICE_PORT: "3004"
  DASHBOARD_PORT: "3000"
  
  # Internal Service URLs (Kubernetes DNS)
  CHANNEL_SERVICE_URL: "http://channel-service:3001"
  AI_SERVICE_URL: "http://ai-service:3002"
  CASE_SERVICE_URL: "http://case-service:3003"
  NOTIFICATION_SERVICE_URL: "http://notification-service:3004"
  
  # RabbitMQ
  RABBITMQ_HOST: "rabbitmq"
  RABBITMQ_PORT: "5672"
  RABBITMQ_VHOST: "govconnect"
  
  # PostgreSQL
  POSTGRES_HOST: "postgres"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "govconnect"
  
  # LLM Configuration
  LLM_MODEL: "gemini-2.5-flash"
  LLM_FALLBACK_MODEL: "gemini-2.0-flash"
  LLM_TEMPERATURE: "0.3"
  LLM_MAX_TOKENS: "2000"
```

### secrets.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: govconnect-secrets
  namespace: govconnect
type: Opaque
data:
  # Base64 encoded values - generate with: echo -n 'value' | base64
  
  # Database URLs (per schema)
  DATABASE_URL_CHANNEL: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3RncmVzX3NlY3JldF8yMDI1QHBvc3RncmVzOjU0MzIvZ292Y29ubmVjdD9zY2hlbWE9Y2hhbm5lbA==
  DATABASE_URL_CASES: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3RncmVzX3NlY3JldF8yMDI1QHBvc3RncmVzOjU0MzIvZ292Y29ubmVjdD9zY2hlbWE9Y2FzZXM=
  DATABASE_URL_NOTIFICATION: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3RncmVzX3NlY3JldF8yMDI1QHBvc3RncmVzOjU0MzIvZ292Y29ubmVjdD9zY2hlbWE9bm90aWZpY2F0aW9u
  DATABASE_URL_DASHBOARD: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3RncmVzX3NlY3JldF8yMDI1QHBvc3RncmVzOjU0MzIvZ292Y29ubmVjdD9zY2hlbWE9ZGFzaGJvYXJk
  
  # RabbitMQ
  RABBITMQ_URL: YW1xcDovL2FkbWluOnJhYmJpdG1xX3NlY3JldF8yMDI1QHJhYmJpdG1xOjU2NzIvZ292Y29ubmVjdA==
  RABBITMQ_USER: YWRtaW4=
  RABBITMQ_PASSWORD: cmFiYml0bXFfc2VjcmV0XzIwMjU=
  
  # Security
  INTERNAL_API_KEY: Z292Y29ubmVjdC1pbnRlcm5hbC0yMDI1LXNlY3JldA==
  JWT_SECRET: Z292Y29ubmVjdC1qd3Qtc2VjcmV0LTIwMjUtY2hhbmdlLWluLXByb2R1Y3Rpb24=
  
  # External APIs
  GEMINI_API_KEY: <YOUR_GEMINI_API_KEY_BASE64>
  WA_ACCESS_TOKEN: Z292Y29ubmVjdA==
  WA_WEBHOOK_VERIFY_TOKEN: Z292Y29ubmVjdF92ZXJpZnlfdG9rZW5fMjAyNQ==
```

### deployments/channel-service.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: channel-service
  namespace: govconnect
  labels:
    app: channel-service
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: channel-service
  template:
    metadata:
      labels:
        app: channel-service
    spec:
      containers:
      - name: channel-service
        image: govconnect/channel-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: govconnect-config
              key: CHANNEL_SERVICE_PORT
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: govconnect-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: DATABASE_URL_CHANNEL
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: RABBITMQ_URL
        - name: INTERNAL_API_KEY
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: INTERNAL_API_KEY
        - name: WA_WEBHOOK_VERIFY_TOKEN
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: WA_WEBHOOK_VERIFY_TOKEN
        - name: WA_ACCESS_TOKEN
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: WA_ACCESS_TOKEN
        - name: CASE_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: govconnect-config
              key: CASE_SERVICE_URL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "250m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: uploads
        emptyDir: {}
```

### services/channel-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: channel-service
  namespace: govconnect
  labels:
    app: channel-service
spec:
  type: ClusterIP
  selector:
    app: channel-service
  ports:
  - name: http
    port: 3001
    targetPort: 3001
    protocol: TCP
```

### statefulsets/postgres.yaml
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: govconnect
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: pgvector/pgvector:pg16
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "govconnect"
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: govconnect-secrets
              key: RABBITMQ_PASSWORD
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: govconnect
spec:
  type: ClusterIP
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: govconnect-ingress
  namespace: govconnect
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  rules:
  # API Gateway - WhatsApp Webhook
  - host: api.govconnect.local
    http:
      paths:
      - path: /webhook
        pathType: Prefix
        backend:
          service:
            name: channel-service
            port:
              number: 3001
      - path: /internal
        pathType: Prefix
        backend:
          service:
            name: channel-service
            port:
              number: 3001
  
  # Dashboard
  - host: dashboard.govconnect.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dashboard
            port:
              number: 3000
  
  # Case Service API (for dashboard proxy)
  - host: api.govconnect.local
    http:
      paths:
      - path: /laporan
        pathType: Prefix
        backend:
          service:
            name: case-service
            port:
              number: 3003
      - path: /tiket
        pathType: Prefix
        backend:
          service:
            name: case-service
            port:
              number: 3003
      - path: /statistics
        pathType: Prefix
        backend:
          service:
            name: case-service
            port:
              number: 3003
```

### hpa/channel-service-hpa.yaml
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: channel-service-hpa
  namespace: govconnect
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: channel-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

---

## 🚀 DEPLOYMENT COMMANDS

### Local Development (Minikube)

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192

# 2. Enable Ingress addon
minikube addons enable ingress

# 3. Build and load images
eval $(minikube docker-env)
docker-compose build

# 4. Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/statefulsets/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa/

# 5. Check status
kubectl get all -n govconnect

# 6. Get Minikube IP
minikube ip

# 7. Add to /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)
# <minikube-ip> api.govconnect.local dashboard.govconnect.local
```

### Production (Cloud)

```bash
# 1. Create cluster (GKE example)
gcloud container clusters create govconnect-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium

# 2. Get credentials
gcloud container clusters get-credentials govconnect-cluster

# 3. Push images to registry
docker tag govconnect/channel-service gcr.io/PROJECT_ID/channel-service
docker push gcr.io/PROJECT_ID/channel-service

# 4. Apply manifests
kubectl apply -f k8s/

# 5. Get external IP
kubectl get ingress -n govconnect
```

---

## ✅ VERIFICATION

### Health Checks

```bash
# Check all pods running
kubectl get pods -n govconnect

# Check services
kubectl get svc -n govconnect

# Check ingress
kubectl get ingress -n govconnect

# Check HPA
kubectl get hpa -n govconnect

# View logs
kubectl logs -f deployment/channel-service -n govconnect

# Describe pod (debugging)
kubectl describe pod <pod-name> -n govconnect
```

### Test Endpoints

```bash
# Test webhook (via Ingress)
curl -X POST http://api.govconnect.local/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test dashboard
curl http://dashboard.govconnect.local/api/health
```

---

## ✅ COMPLETION CRITERIA

Phase 8 dianggap selesai jika:

- [x] Namespace `govconnect` manifest created
- [x] ConfigMap dan Secrets manifest created
- [x] PostgreSQL StatefulSet manifest with PVC
- [x] RabbitMQ StatefulSet manifest with PVC
- [x] All 5 microservices Deployment manifests
- [x] Services created (ClusterIP)
- [x] Ingress configured (API Gateway)
- [x] HPA configured untuk scaling
- [ ] Deploy to cluster and verify
- [ ] End-to-end test passed via Ingress
- [ ] `kubectl get all -n govconnect` shows healthy resources

---

## 🚀 DEPLOYMENT COMMANDS

### Option 1: Using Kustomize (Recommended)

```bash
# Deploy all manifests at once
kubectl apply -k k8s/
```

### Option 2: Using deploy.sh

```bash
# Navigate to k8s folder
cd k8s

# Make script executable (Linux/Mac)
chmod +x deploy.sh

# Run deployment
./deploy.sh dev
```

### Option 3: Manual Deployment

```bash
# Apply in order
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/10-postgres.yaml
kubectl apply -f k8s/11-rabbitmq.yaml
kubectl apply -f k8s/20-channel-service.yaml
kubectl apply -f k8s/21-ai-service.yaml
kubectl apply -f k8s/22-case-service.yaml
kubectl apply -f k8s/23-notification-service.yaml
kubectl apply -f k8s/24-dashboard.yaml
kubectl apply -f k8s/30-ingress.yaml
```

### Verification

```bash
# Check all resources
kubectl get all -n govconnect

# Check pods
kubectl get pods -n govconnect

# Check services
kubectl get svc -n govconnect

# Check ingress
kubectl get ingress -n govconnect

# View logs
kubectl logs -f deployment/channel-service -n govconnect
```

---

**Phase 8 Status**: ✅ MANIFESTS CREATED  
**Last Updated**: November 25, 2025
