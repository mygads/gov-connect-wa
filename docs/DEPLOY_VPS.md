# 🚀 GovConnect - VPS Deployment Guide

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**Target Environment**: Ubuntu 22.04 LTS VPS

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Requirements](#vps-requirements)
3. [Initial Server Setup](#initial-server-setup)
4. [Docker Installation](#docker-installation)
5. [DNS Configuration](#dns-configuration)
6. [Application Deployment](#application-deployment)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Database Migration](#database-migration)
9. [Verification](#verification)
10. [Maintenance](#maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Accounts & Access
- [ ] VPS with root/sudo access (DigitalOcean, Vultr, Linode, Hetzner, etc.)
- [ ] Domain name: `govconnect.my.id` (or your domain)
- [ ] DNS management access (Cloudflare, Niagahoster, etc.)
- [ ] GitHub account with repository access
- [ ] Google Gemini API Key

### Local Requirements
- SSH client (Terminal/PowerShell/PuTTY)
- Git installed locally

---

## 💻 VPS Requirements

### Minimum Specifications

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 80 GB SSD |
| Bandwidth | 1 TB | Unlimited |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Estimated Cost

| Provider | Spec | Monthly Cost |
|----------|------|--------------|
| DigitalOcean | 4GB/2vCPU | $24/month |
| Vultr | 4GB/2vCPU | $24/month |
| Hetzner | 4GB/2vCPU | €4.51/month |
| Linode | 4GB/2vCPU | $24/month |
| Contabo | 8GB/4vCPU | €5.99/month |

---

## 🔐 Initial Server Setup

### Step 1: Connect to VPS

```bash
# Connect via SSH
ssh root@YOUR_VPS_IP

# Or with custom port
ssh -p 22 root@YOUR_VPS_IP
```

### Step 2: Update System

```bash
# Update package list
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nano htop ufw fail2ban
```

### Step 3: Create Deploy User

```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Setup SSH key for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Step 4: Configure Firewall

```bash
# Setup UFW
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 5: Configure Fail2Ban

```bash
# Start and enable fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status
```

---

## 🐳 Docker Installation

### Step 1: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash

# Add deploy user to docker group
usermod -aG docker deploy

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
```

### Step 2: Install Docker Compose

```bash
# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify installation
docker compose version
```

### Step 3: Logout and Login

```bash
# Logout to apply group changes
exit

# Login as deploy user
ssh deploy@YOUR_VPS_IP
```

---

## 🌐 DNS Configuration

### Required DNS Records

Configure these records at your DNS provider (Cloudflare, Niagahoster, etc.):

| Type | Name | Value | TTL | Proxy |
|------|------|-------|-----|-------|
| A | @ | YOUR_VPS_IPv4 | Auto | DNS Only |
| A | api | YOUR_VPS_IPv4 | Auto | DNS Only |
| A | traefik | YOUR_VPS_IPv4 | Auto | DNS Only |
| A | grafana | YOUR_VPS_IPv4 | Auto | DNS Only |
| A | prometheus | YOUR_VPS_IPv4 | Auto | DNS Only |
| AAAA | @ | YOUR_VPS_IPv6 | Auto | DNS Only |
| AAAA | api | YOUR_VPS_IPv6 | Auto | DNS Only |

> ⚠️ **Important**: Disable Cloudflare Proxy (orange cloud) for initial setup to allow Let's Encrypt certificate generation.

### Verify DNS Propagation

```bash
# Check DNS propagation
dig govconnect.my.id +short
dig api.govconnect.my.id +short

# Or use online tool
# https://www.whatsmydns.net/
```

---

## 📦 Application Deployment

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /opt/govconnect
sudo chown deploy:deploy /opt/govconnect

# Clone repository
cd /opt/govconnect
git clone https://github.com/mygads/gov-connect-wa.git .

# Or if private repo
git clone git@github.com:mygads/gov-connect-wa.git .
```

### Step 2: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit with production values
nano .env
```

**Required changes in `.env`:**

```bash
# ==================== PRODUCTION VALUES ====================
NODE_ENV=production

# Database (use strong password!)
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>

# RabbitMQ (use strong password!)
RABBITMQ_PASSWORD=<GENERATE_STRONG_PASSWORD>

# Security (generate with: openssl rand -base64 32)
INTERNAL_API_KEY=<GENERATE_RANDOM_STRING>
JWT_SECRET=<GENERATE_RANDOM_STRING>

# AI/LLM
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

# WhatsApp
WA_ACCESS_TOKEN=<YOUR_WA_SESSION_TOKEN>

# Monitoring
GRAFANA_PASSWORD=<STRONG_PASSWORD>

# Domain
ACME_EMAIL=admin@govconnect.my.id
```

**Generate passwords:**

```bash
# Generate random password
openssl rand -base64 32

# Or
head -c 32 /dev/urandom | base64
```

### Step 3: Create Required Directories

```bash
# Create directories for volumes
mkdir -p docker/grafana/dashboards
mkdir -p docker/grafana/provisioning/dashboards
mkdir -p docker/grafana/provisioning/datasources
```

### Step 4: Start Services

```bash
# Development mode (testing)
docker compose up -d

# Production mode with SSL
docker compose --profile production up -d

# Full stack (production + monitoring + logging)
docker compose --profile production --profile monitoring --profile logging up -d
```

### Step 5: View Logs

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f channel-service
docker compose logs -f traefik
```

---

## 🔒 SSL Certificate Setup

### Automatic (Let's Encrypt via Traefik)

SSL certificates are automatically provisioned by Traefik when:
1. DNS is pointing to server IP
2. Port 80 is open
3. `--profile production` is used

### Verify SSL

```bash
# Check certificate
curl -vI https://govconnect.my.id 2>&1 | grep -i "ssl\|certificate"

# Or use SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=govconnect.my.id
```

---

## 🗄️ Database Migration

### Run Prisma Migrations

```bash
# Channel Service
docker exec -it govconnect-channel-service npx prisma migrate deploy

# Case Service
docker exec -it govconnect-case-service npx prisma migrate deploy

# Notification Service
docker exec -it govconnect-notification-service npx prisma migrate deploy

# Dashboard
docker exec -it govconnect-dashboard npx prisma migrate deploy
```

### Seed Initial Data (Optional)

```bash
# Seed dashboard admin user
docker exec -it govconnect-dashboard npx prisma db seed
```

---

## ✅ Verification

### Health Checks

```bash
# Check all services running
docker ps

# Check health endpoints
curl https://api.govconnect.my.id/health
curl https://api.govconnect.my.id/health/channel
curl https://api.govconnect.my.id/health/ai
curl https://api.govconnect.my.id/health/cases
curl https://api.govconnect.my.id/health/notifications

# Check dashboard
curl -I https://govconnect.my.id
```

### Service URLs

| Service | URL |
|---------|-----|
| Dashboard | https://govconnect.my.id |
| API Gateway | https://api.govconnect.my.id |
| Swagger (Channel) | https://api.govconnect.my.id/api-docs (via port forward) |
| Traefik Dashboard | https://traefik.govconnect.my.id |
| Grafana | https://grafana.govconnect.my.id |
| Prometheus | https://prometheus.govconnect.my.id |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| RabbitMQ | admin | (from .env) |
| Grafana | admin | govconnect-grafana-2025 |
| Traefik Dashboard | admin | govconnect2025 |

---

## 🔧 Maintenance

### Update Application

```bash
cd /opt/govconnect

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose --profile production build
docker compose --profile production up -d

# Or with zero-downtime (rolling update)
docker compose --profile production up -d --no-deps --build channel-service
```

### Backup Database

```bash
# Backup PostgreSQL
docker exec govconnect-postgres pg_dump -U postgres govconnect > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore
gunzip backup_YYYYMMDD.sql.gz
docker exec -i govconnect-postgres psql -U postgres govconnect < backup_YYYYMMDD.sql
```

### View Logs

```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100 channel-service

# With timestamps
docker compose logs -t channel-service
```

### Cleanup

```bash
# Remove unused images
docker system prune -f

# Remove all unused data (careful!)
docker system prune -a --volumes
```

---

## 🔥 Troubleshooting

### Container Not Starting

```bash
# Check container status
docker ps -a

# Check logs
docker logs govconnect-channel-service

# Check resource usage
docker stats
```

### Database Connection Error

```bash
# Check PostgreSQL status
docker exec govconnect-postgres pg_isready -U postgres

# Check connection from service
docker exec govconnect-channel-service nc -zv postgres 5432
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker logs govconnect-traefik

# Force certificate renewal
docker exec govconnect-traefik rm /letsencrypt/acme.json
docker restart govconnect-traefik
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Kill process
sudo kill -9 <PID>

# Or stop conflicting service
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Cleanup
docker system prune -a --volumes
```

---

## 📊 Monitoring Commands

```bash
# CPU/Memory usage
htop

# Docker stats
docker stats

# Disk usage
df -h

# Network connections
netstat -tlnp

# Service status
docker compose ps
```

---

## 🔐 Security Checklist

- [ ] SSH key-only authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban enabled
- [ ] Strong passwords in .env
- [ ] SSL/TLS enabled
- [ ] Regular backups configured
- [ ] Monitoring enabled

---

**Happy Deploying! 🎉**

For support: Create an issue at https://github.com/mygads/gov-connect-wa/issues
