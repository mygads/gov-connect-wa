# ☁️ GovConnect - Google Cloud Platform Deployment Guide

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**Target Environment**: Google Cloud Platform (GCP)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Option A: Google Compute Engine (VM)](#option-a-google-compute-engine-vm)
5. [Option B: Google Kubernetes Engine (GKE)](#option-b-google-kubernetes-engine-gke)
6. [Option C: Cloud Run (Serverless)](#option-c-cloud-run-serverless)
7. [Cloud SQL Setup](#cloud-sql-setup)
8. [Artifact Registry Setup](#artifact-registry-setup)
9. [Domain & SSL Configuration](#domain--ssl-configuration)
10. [CI/CD with Cloud Build](#cicd-with-cloud-build)
11. [Monitoring & Logging](#monitoring--logging)
12. [Cost Estimation](#cost-estimation)

---

## 🎯 Overview

### Architecture Options

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Google Cloud Platform                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Option A: Compute Engine (Recommended for Tubes)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  VM Instance (e2-medium)                                         │   │
│  │  ├── Docker Compose                                              │   │
│  │  ├── All 5 microservices                                        │   │
│  │  ├── PostgreSQL + RabbitMQ                                      │   │
│  │  └── Traefik (SSL/Load Balancer)                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Option B: GKE (Production Grade)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  GKE Autopilot Cluster                                           │   │
│  │  ├── 5 Deployments (microservices)                              │   │
│  │  ├── Cloud SQL (PostgreSQL)                                     │   │
│  │  ├── Cloud Memorystore (RabbitMQ alternative)                   │   │
│  │  └── Ingress (Load Balancer + SSL)                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Option C: Cloud Run (Serverless)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  5 Cloud Run Services                                            │   │
│  │  ├── Auto-scaling                                               │   │
│  │  ├── Cloud SQL (managed)                                        │   │
│  │  ├── Cloud Pub/Sub (messaging)                                  │   │
│  │  └── Cloud Load Balancer + SSL                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended for Tubes EAI

**Option A: Compute Engine** is recommended because:
- Simplest setup (same as VPS)
- Cheapest for demo/presentation
- Full control over infrastructure
- Uses existing Docker Compose configuration

---

## 🔧 Prerequisites

### Required Accounts
- [ ] Google Cloud account with billing enabled
- [ ] GCP Project created
- [ ] gcloud CLI installed locally
- [ ] Domain with DNS access

### Install gcloud CLI

**Windows (PowerShell):**
```powershell
# Download and install
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:TEMP\GoogleCloudSDKInstaller.exe")
& $env:TEMP\GoogleCloudSDKInstaller.exe
```

**Linux/Mac:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Initialize gcloud

```bash
# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Set region (Jakarta)
gcloud config set compute/region asia-southeast2
gcloud config set compute/zone asia-southeast2-a
```

---

## 🖥️ Option A: Google Compute Engine (VM)

### Step 1: Create VM Instance

```bash
# Create VM with Container-Optimized OS
gcloud compute instances create govconnect-vm \
    --machine-type=e2-medium \
    --zone=asia-southeast2-a \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
        apt-get update
        apt-get install -y docker.io docker-compose-plugin git
        systemctl start docker
        systemctl enable docker'

# Or with more resources
gcloud compute instances create govconnect-vm \
    --machine-type=e2-standard-2 \
    --zone=asia-southeast2-a \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=80GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server
```

### Step 2: Configure Firewall

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server

# Allow Traefik Dashboard (optional, for debugging)
gcloud compute firewall-rules create allow-traefik \
    --allow tcp:8080 \
    --target-tags http-server \
    --source-ranges="YOUR_IP/32"
```

### Step 3: Reserve Static IP

```bash
# Reserve external IP
gcloud compute addresses create govconnect-ip \
    --region=asia-southeast2

# Get the IP address
gcloud compute addresses describe govconnect-ip \
    --region=asia-southeast2 \
    --format='get(address)'

# Attach to VM
gcloud compute instances delete-access-config govconnect-vm \
    --access-config-name="external-nat" \
    --zone=asia-southeast2-a

gcloud compute instances add-access-config govconnect-vm \
    --access-config-name="external-nat" \
    --address=STATIC_IP \
    --zone=asia-southeast2-a
```

### Step 4: SSH into VM

```bash
# SSH via gcloud
gcloud compute ssh govconnect-vm --zone=asia-southeast2-a

# Or traditional SSH
ssh -i ~/.ssh/google_compute_engine username@STATIC_IP
```

### Step 5: Deploy Application

```bash
# Inside VM
sudo usermod -aG docker $USER
newgrp docker

# Clone repository
cd /opt
sudo mkdir govconnect
sudo chown $USER:$USER govconnect
git clone https://github.com/mygads/gov-connect-wa.git govconnect
cd govconnect

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker compose --profile production up -d
```

### Step 6: Configure DNS

Point your domain to the static IP:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_STATIC_IP |
| A | api | YOUR_STATIC_IP |
| A | traefik | YOUR_STATIC_IP |

---

## ⎈ Option B: Google Kubernetes Engine (GKE)

### Step 1: Enable APIs

```bash
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### Step 2: Create GKE Cluster

```bash
# Create Autopilot cluster (recommended)
gcloud container clusters create-auto govconnect-cluster \
    --region=asia-southeast2 \
    --release-channel=stable

# Or Standard cluster (more control)
gcloud container clusters create govconnect-cluster \
    --zone=asia-southeast2-a \
    --num-nodes=3 \
    --machine-type=e2-medium \
    --enable-autoscaling \
    --min-nodes=2 \
    --max-nodes=10
```

### Step 3: Get Credentials

```bash
gcloud container clusters get-credentials govconnect-cluster \
    --region=asia-southeast2
```

### Step 4: Create Artifact Registry

```bash
gcloud artifacts repositories create govconnect \
    --repository-format=docker \
    --location=asia-southeast2 \
    --description="GovConnect Docker images"

# Configure Docker auth
gcloud auth configure-docker asia-southeast2-docker.pkg.dev
```

### Step 5: Build and Push Images

```bash
# Build and tag images
cd govconnect

for service in channel-service ai-service case-service notification-service dashboard; do
    docker build -t asia-southeast2-docker.pkg.dev/PROJECT_ID/govconnect/$service:latest \
        govconnect-$service/
    docker push asia-southeast2-docker.pkg.dev/PROJECT_ID/govconnect/$service:latest
done
```

### Step 6: Deploy to GKE

```bash
# Update image references in k8s manifests
# Then apply
kubectl apply -k k8s/

# Or step by step
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
kubectl apply -f k8s/api-gateway/
```

### Step 7: Setup Ingress

```bash
# Install Traefik via Helm
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik \
    -n traefik --create-namespace \
    -f k8s/api-gateway/traefik-values.yaml

# Get Load Balancer IP
kubectl get svc traefik -n traefik
```

---

## 🚀 Option C: Cloud Run (Serverless)

### Step 1: Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 2: Create Cloud SQL Instance

```bash
gcloud sql instances create govconnect-db \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=asia-southeast2 \
    --storage-size=10GB \
    --storage-type=SSD

# Create database
gcloud sql databases create govconnect --instance=govconnect-db

# Set password
gcloud sql users set-password postgres \
    --instance=govconnect-db \
    --password=YOUR_SECURE_PASSWORD
```

### Step 3: Deploy Services to Cloud Run

```bash
# Deploy Channel Service
gcloud run deploy channel-service \
    --source=govconnect-channel-service \
    --region=asia-southeast2 \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=PROJECT:asia-southeast2:govconnect-db \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --set-secrets="DATABASE_URL=govconnect-db-url:latest"

# Repeat for other services...
```

### Step 4: Setup Cloud Load Balancer

```bash
# Create serverless NEG for each service
gcloud compute network-endpoint-groups create channel-service-neg \
    --region=asia-southeast2 \
    --network-endpoint-type=serverless \
    --cloud-run-service=channel-service

# Create backend service, URL map, and forwarding rules
# (Complex - use Console UI for easier setup)
```

---

## 🗄️ Cloud SQL Setup

### Create Instance

```bash
gcloud sql instances create govconnect-postgres \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=asia-southeast2 \
    --storage-size=10GB \
    --storage-auto-increase

# Create database
gcloud sql databases create govconnect \
    --instance=govconnect-postgres

# Create schemas
gcloud sql connect govconnect-postgres --user=postgres
# Then in psql:
# CREATE SCHEMA channel;
# CREATE SCHEMA cases;
# CREATE SCHEMA notification;
# CREATE SCHEMA dashboard;
```

### Connection from GKE/Cloud Run

```bash
# Enable Cloud SQL Auth Proxy
gcloud iam service-accounts create cloudsql-proxy

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:cloudsql-proxy@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

---

## 📦 Artifact Registry Setup

```bash
# Create repository
gcloud artifacts repositories create govconnect \
    --repository-format=docker \
    --location=asia-southeast2

# Configure Docker
gcloud auth configure-docker asia-southeast2-docker.pkg.dev

# Tag and push images
docker tag govconnect/channel-service:latest \
    asia-southeast2-docker.pkg.dev/PROJECT_ID/govconnect/channel-service:latest

docker push asia-southeast2-docker.pkg.dev/PROJECT_ID/govconnect/channel-service:latest
```

---

## 🌐 Domain & SSL Configuration

### Using Cloud DNS

```bash
# Create managed zone
gcloud dns managed-zones create govconnect-zone \
    --dns-name=govconnect.my.id. \
    --description="GovConnect DNS zone"

# Add A record
gcloud dns record-sets create govconnect.my.id. \
    --zone=govconnect-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=LOAD_BALANCER_IP

gcloud dns record-sets create api.govconnect.my.id. \
    --zone=govconnect-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=LOAD_BALANCER_IP
```

### Managed SSL Certificates

```bash
# Create managed certificate
gcloud compute ssl-certificates create govconnect-cert \
    --domains=govconnect.my.id,api.govconnect.my.id \
    --global
```

---

## 🔄 CI/CD with Cloud Build

### cloudbuild.yaml

```yaml
# cloudbuild.yaml
steps:
  # Build images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/channel-service:$COMMIT_SHA', 'govconnect-channel-service/']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/ai-service:$COMMIT_SHA', 'govconnect-ai-service/']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/case-service:$COMMIT_SHA', 'govconnect-case-service/']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/notification-service:$COMMIT_SHA', 'govconnect-notification-service/']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/dashboard:$COMMIT_SHA', 'govconnect-dashboard/']

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/channel-service']

  # Deploy to GKE
  - name: 'gcr.io/cloud-builders/kubectl'
    args: ['set', 'image', 'deployment/channel-service', 'channel-service=asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/channel-service:$COMMIT_SHA']
    env:
      - 'CLOUDSDK_COMPUTE_REGION=asia-southeast2'
      - 'CLOUDSDK_CONTAINER_CLUSTER=govconnect-cluster'

images:
  - 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/channel-service:$COMMIT_SHA'
  - 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/ai-service:$COMMIT_SHA'
  - 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/case-service:$COMMIT_SHA'
  - 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/notification-service:$COMMIT_SHA'
  - 'asia-southeast2-docker.pkg.dev/$PROJECT_ID/govconnect/dashboard:$COMMIT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY
```

### Setup Trigger

```bash
gcloud builds triggers create github \
    --repo-name=gov-connect-wa \
    --repo-owner=mygads \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

---

## 📊 Monitoring & Logging

### Cloud Monitoring

```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud monitoring uptime-check-configs create govconnect-health \
    --display-name="GovConnect Health Check" \
    --http-check-path="/health" \
    --monitored-resource-type="uptime_url" \
    --hostname="api.govconnect.my.id"
```

### Cloud Logging

```bash
# View logs
gcloud logging read "resource.type=gce_instance" --limit=50

# Create log-based metric
gcloud logging metrics create govconnect-errors \
    --description="GovConnect Error Count" \
    --filter='severity>=ERROR'
```

---

## 💰 Cost Estimation

### Option A: Compute Engine (Recommended for Tubes)

| Resource | Spec | Monthly Cost |
|----------|------|--------------|
| VM (e2-medium) | 2vCPU, 4GB RAM | ~$25 |
| Boot Disk | 50GB SSD | ~$8 |
| Static IP | 1 | ~$3 |
| Egress | ~50GB | ~$6 |
| **Total** | | **~$42/month** |

### Option B: GKE

| Resource | Spec | Monthly Cost |
|----------|------|--------------|
| GKE Autopilot | 3 pods min | ~$73 |
| Cloud SQL | db-f1-micro | ~$8 |
| Load Balancer | 1 | ~$18 |
| Egress | ~50GB | ~$6 |
| **Total** | | **~$105/month** |

### Option C: Cloud Run

| Resource | Spec | Monthly Cost |
|----------|------|--------------|
| Cloud Run | 5 services | ~$0-50 (usage based) |
| Cloud SQL | db-f1-micro | ~$8 |
| Load Balancer | 1 | ~$18 |
| **Total** | | **~$30-80/month** |

### Free Tier Benefits

- 1 e2-micro VM always free (Oregon only)
- Cloud Run: 2M requests/month free
- Cloud Build: 120 minutes/day free
- Cloud Storage: 5GB free

---

## 🎓 Recommendation for Tubes EAI

**Use Option A (Compute Engine)** because:

1. ✅ Cheapest (~$42/month or use free credits)
2. ✅ Simplest setup (reuse Docker Compose)
3. ✅ Full control for demo
4. ✅ Easy to troubleshoot
5. ✅ No complex Kubernetes knowledge needed

### Quick Deploy Command

```bash
# 1. Create VM
gcloud compute instances create govconnect-vm \
    --machine-type=e2-medium \
    --zone=asia-southeast2-a \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --tags=http-server,https-server

# 2. SSH and deploy
gcloud compute ssh govconnect-vm
# Then follow VPS deployment steps...
```

---

## 🔗 Useful Links

- [GCP Console](https://console.cloud.google.com)
- [GCP Free Tier](https://cloud.google.com/free)
- [Compute Engine Pricing](https://cloud.google.com/compute/pricing)
- [GKE Pricing](https://cloud.google.com/kubernetes-engine/pricing)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)

---

**Happy Cloud Deploying! ☁️🚀**
