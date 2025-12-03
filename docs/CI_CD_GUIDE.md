# 🔄 GovConnect - CI/CD Pipeline Guide

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**Platform**: GitHub Actions

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Workflow Stages](#workflow-stages)
4. [Configuration](#configuration)
5. [Secrets Setup](#secrets-setup)
6. [Environments](#environments)
7. [Manual Triggers](#manual-triggers)
8. [Monitoring & Debugging](#monitoring--debugging)

---

## 🎯 Overview

### What is CI/CD?

| Term | Definition |
|------|------------|
| **CI (Continuous Integration)** | Automatically build, lint, and test code on every push |
| **CD (Continuous Deployment)** | Automatically deploy to staging/production after tests pass |

### Pipeline Summary

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Push     │───▶│  Lint/Test  │───▶│    Build    │───▶│   Deploy    │
│  to main    │    │  (parallel) │    │   Images    │    │  Staging →  │
│             │    │             │    │             │    │  Production │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Workflow File Location

```
.github/
└── workflows/
    └── ci-cd.yml    # Main CI/CD pipeline
```

---

## 🏗️ Pipeline Architecture

```yaml
# High-level pipeline flow
name: GovConnect CI/CD

┌─────────────────────────────────────────────────────────────────────────┐
│                           TRIGGER                                        │
│  • Push to main/develop                                                  │
│  • Pull request to main                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 1: LINT & TEST                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ channel-svc  │ │   ai-svc     │ │  case-svc    │ │notification  │   │
│  │  • pnpm i    │ │  • pnpm i    │ │  • pnpm i    │ │  • pnpm i    │   │
│  │  • lint      │ │  • lint      │ │  • lint      │ │  • lint      │   │
│  │  • typecheck │ │  • typecheck │ │  • typecheck │ │  • typecheck │   │
│  │  • test      │ │  • test      │ │  • test      │ │  • test      │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                              (Parallel Matrix)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (if main branch)
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 2: BUILD DOCKER IMAGES                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ channel-svc  │ │   ai-svc     │ │  case-svc    │ │  dashboard   │   │
│  │ Build & Push │ │ Build & Push │ │ Build & Push │ │ Build & Push │   │
│  │ to GHCR      │ │ to GHCR      │ │ to GHCR      │ │ to GHCR      │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                              (Parallel Matrix)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 3: SECURITY SCAN                                │
│  • Trivy vulnerability scanner                                           │
│  • Scan for CRITICAL/HIGH severity issues                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 4: DEPLOY TO STAGING                            │
│  • SSH to staging server                                                 │
│  • git pull origin main                                                  │
│  • docker-compose pull                                                   │
│  • docker-compose up -d                                                  │
│  • Environment: staging                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 5: DEPLOY TO PRODUCTION                         │
│  • Setup Google Cloud SDK                                                │
│  • Authenticate with GCP                                                 │
│  • Deploy to GKE/Cloud Run                                              │
│  • Health check                                                          │
│  • Notify success                                                        │
│  • Environment: production                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      JOB 6: CLEANUP                                      │
│  • Delete old container images                                           │
│  • Keep only 5 latest versions                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Workflow Stages

### Stage 1: Lint & Test

**Purpose**: Ensure code quality and catch bugs early

```yaml
lint-and-test:
  name: Lint & Test - ${{ matrix.service }}
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      service:
        - channel-service
        - ai-service
        - case-service
        - notification-service
        - dashboard
```

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Setup pnpm 9
4. Install dependencies (with cache)
5. Run ESLint
6. Run TypeScript type check
7. Run tests

### Stage 2: Build Docker Images

**Purpose**: Create container images and push to registry

```yaml
build:
  name: Build - ${{ matrix.service }}
  needs: lint-and-test
  if: github.ref == 'refs/heads/main'
```

**Features**:
- Multi-platform build (amd64, arm64)
- Layer caching via GitHub Actions cache
- Tags: `sha-xxxxx`, `latest`, branch name

### Stage 3: Security Scan

**Purpose**: Detect vulnerabilities in code and dependencies

```yaml
security-scan:
  name: Security Scan
  needs: build
```

**Tools**: Trivy vulnerability scanner
- Scans for CRITICAL and HIGH severity
- Reports in table format

### Stage 4: Deploy to Staging

**Purpose**: Test deployment in staging environment

```yaml
deploy-staging:
  name: Deploy to Staging
  needs: [build, security-scan]
  environment: staging
```

**Process**:
1. SSH to staging server
2. Pull latest code
3. Pull new Docker images
4. Restart services
5. Cleanup old images

### Stage 5: Deploy to Production

**Purpose**: Deploy to live production environment

```yaml
deploy-production:
  name: Deploy to Production
  needs: deploy-staging
  environment:
    name: production
    url: https://govconnect.my.id
```

**Options**:
- VPS: SSH deploy (same as staging)
- GCP: Cloud Run or GKE
- Manual approval (optional)

### Stage 6: Cleanup

**Purpose**: Remove old Docker images to save storage

```yaml
cleanup:
  name: Cleanup Old Images
  needs: deploy-production
```

---

## ⚙️ Configuration

### Workflow File

`.github/workflows/ci-cd.yml`:

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
  # ... (full workflow in repository)
```

### Matrix Strategy

Run jobs in parallel for all services:

```yaml
strategy:
  fail-fast: false  # Don't cancel other jobs if one fails
  matrix:
    service:
      - channel-service
      - ai-service
      - case-service
      - notification-service
      - dashboard
```

### Caching

Speed up builds with caching:

```yaml
- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ matrix.service }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

---

## 🔐 Secrets Setup

### Required Secrets

Go to **Repository → Settings → Secrets and variables → Actions**

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `STAGING_HOST` | Staging server IP/hostname | Staging deploy |
| `SSH_USERNAME` | SSH username | SSH deploy |
| `SSH_PRIVATE_KEY` | SSH private key (full content) | SSH deploy |
| `GCP_PROJECT_ID` | GCP project ID | GCP deploy |
| `GCP_SA_KEY` | GCP service account JSON key | GCP deploy |

### How to Generate SSH Key

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions@govconnect" -f github-deploy

# Add public key to server
cat github-deploy.pub >> ~/.ssh/authorized_keys

# Copy private key content to GitHub Secret
cat github-deploy
```

### How to Create GCP Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.developer"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com

# Copy content to GitHub Secret
cat key.json
```

---

## 🌍 Environments

### Setting Up Environments

Go to **Repository → Settings → Environments**

#### Staging Environment

```yaml
Name: staging
Protection rules: None (auto-deploy)
Secrets:
  - STAGING_HOST
  - SSH_USERNAME
  - SSH_PRIVATE_KEY
```

#### Production Environment

```yaml
Name: production
URL: https://govconnect.my.id
Protection rules:
  - Required reviewers: 1 (optional)
  - Wait timer: 5 minutes (optional)
Secrets:
  - GCP_PROJECT_ID
  - GCP_SA_KEY
```

### Environment URL

After deploy, the URL appears in:
- Pull Request checks
- Deployments tab
- Actions summary

---

## 🎮 Manual Triggers

### Re-run Failed Jobs

1. Go to **Actions** tab
2. Click failed workflow run
3. Click **Re-run failed jobs**

### Trigger Workflow Manually

Add to workflow:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Enable manual trigger
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
```

Then go to **Actions → Select workflow → Run workflow**

### Skip CI

To skip CI on a commit:

```bash
git commit -m "Update docs [skip ci]"
# or
git commit -m "Fix typo [ci skip]"
```

---

## 🔍 Monitoring & Debugging

### View Workflow Runs

1. Go to repository
2. Click **Actions** tab
3. Select workflow run
4. Click job to see logs

### Common Issues

#### 1. pnpm install fails

```
Error: Cannot find module
```

**Solution**: Check `pnpm-lock.yaml` is committed

#### 2. Docker build fails

```
Error: denied: installation not allowed
```

**Solution**: Check `GITHUB_TOKEN` permissions

```yaml
permissions:
  contents: read
  packages: write
```

#### 3. SSH deploy fails

```
Error: Permission denied (publickey)
```

**Solution**: 
- Check SSH key is correct
- Ensure public key is in `~/.ssh/authorized_keys`
- Check username is correct

#### 4. GCP auth fails

```
Error: google-github-actions/auth failed
```

**Solution**:
- Check `GCP_SA_KEY` is valid JSON
- Ensure service account has required permissions

### View Container Registry

Images are pushed to:
```
ghcr.io/mygads/govconnect-channel-service
ghcr.io/mygads/govconnect-ai-service
ghcr.io/mygads/govconnect-case-service
ghcr.io/mygads/govconnect-notification-service
ghcr.io/mygads/govconnect-dashboard
```

Go to **Packages** tab in repository to view.

---

## 📈 Pipeline Metrics

### Typical Run Times

| Stage | Duration |
|-------|----------|
| Lint & Test | 2-4 min |
| Build Images | 5-10 min |
| Security Scan | 1-2 min |
| Deploy Staging | 1-2 min |
| Deploy Production | 2-5 min |
| **Total** | **12-25 min** |

### Optimization Tips

1. **Use cache** - Already configured for pnpm and Docker layers
2. **Parallel builds** - Matrix strategy runs all services in parallel
3. **fail-fast: false** - One failure doesn't cancel others
4. **Conditional builds** - Only build on main branch push

---

## 📊 Workflow Status Badge

Add to README:

```markdown
[![CI/CD](https://github.com/mygads/gov-connect-wa/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mygads/gov-connect-wa/actions/workflows/ci-cd.yml)
```

Result: ![CI/CD](https://github.com/mygads/gov-connect-wa/actions/workflows/ci-cd.yml/badge.svg)

---

## 🔗 Quick Reference

### Trigger Conditions

| Event | Runs |
|-------|------|
| Push to `main` | Full pipeline (build + deploy) |
| Push to `develop` | Lint & Test only |
| Pull Request to `main` | Lint & Test only |

### Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Main workflow |
| `govconnect-*/Dockerfile` | Docker build instructions |
| `docker-compose.yml` | Local development |
| `k8s/` | Kubernetes manifests |

### Useful Commands

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch

# Trigger workflow manually
gh workflow run ci-cd.yml
```

---

**Happy Automating! 🤖✨**
