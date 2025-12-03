#!/bin/bash
# ==================== GOVCONNECT KUBERNETES DEPLOYMENT SCRIPT ====================
# 
# Usage:
#   ./deploy.sh [environment]
#   
#   Environments:
#     - dev      : Development (minikube/kind)
#     - staging  : Staging environment
#     - prod     : Production environment
#
# Prerequisites:
#   - kubectl configured to point to your cluster
#   - Docker images built and pushed to registry
#   - Update secrets in 02-secrets.yaml before deploying!

set -e

NAMESPACE="govconnect"
ENVIRONMENT=${1:-dev}

echo "=========================================="
echo "GovConnect Kubernetes Deployment"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
    exit 1
fi

print_status "Connected to cluster"

# Step 1: Create namespace
echo ""
echo "Step 1: Creating namespace..."
kubectl apply -f 00-namespace.yaml
print_status "Namespace '$NAMESPACE' created/updated"

# Step 2: Apply ConfigMaps
echo ""
echo "Step 2: Applying ConfigMaps..."
kubectl apply -f 01-configmap.yaml
print_status "ConfigMaps applied"

# Step 3: Apply Secrets
echo ""
echo "Step 3: Applying Secrets..."
print_warning "Make sure you've updated the secrets in 02-secrets.yaml!"
read -p "Have you updated the secrets? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl apply -f 02-secrets.yaml
    print_status "Secrets applied"
else
    print_error "Please update secrets before deploying!"
    exit 1
fi

# Step 4: Deploy PostgreSQL
echo ""
echo "Step 4: Deploying PostgreSQL..."
kubectl apply -f 10-postgres.yaml
print_status "PostgreSQL StatefulSet deployed"

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s
print_status "PostgreSQL is ready"

# Step 5: Deploy RabbitMQ
echo ""
echo "Step 5: Deploying RabbitMQ..."
kubectl apply -f 11-rabbitmq.yaml
print_status "RabbitMQ StatefulSet deployed"

echo "Waiting for RabbitMQ to be ready..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=120s
print_status "RabbitMQ is ready"

# Step 6: Deploy microservices
echo ""
echo "Step 6: Deploying microservices..."

# Deploy in order based on dependencies
echo "  - Deploying Channel Service..."
kubectl apply -f 20-channel-service.yaml
print_status "Channel Service deployed"

echo "  - Deploying Case Service..."
kubectl apply -f 22-case-service.yaml
print_status "Case Service deployed"

echo "  - Deploying AI Service..."
kubectl apply -f 21-ai-service.yaml
print_status "AI Service deployed"

echo "  - Deploying Notification Service..."
kubectl apply -f 23-notification-service.yaml
print_status "Notification Service deployed"

echo "  - Deploying Dashboard..."
kubectl apply -f 24-dashboard.yaml
print_status "Dashboard deployed"

# Step 7: Deploy API Gateway (Traefik IngressRoutes)
echo ""
echo "Step 7: Deploying API Gateway (Traefik)..."
kubectl apply -f api-gateway/01-middleware.yaml
kubectl apply -f api-gateway/02-ingressroute.yaml
print_status "Traefik IngressRoutes deployed"

# Step 8: Wait for all deployments to be ready
echo ""
echo "Step 8: Waiting for all deployments to be ready..."
kubectl wait --for=condition=available deployment --all -n $NAMESPACE --timeout=300s
print_status "All deployments are ready!"

# Summary
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE
echo ""
echo "IngressRoutes (Traefik):"
kubectl get ingressroute -n $NAMESPACE
echo ""

# Port forwarding instructions for development
if [ "$ENVIRONMENT" = "dev" ]; then
    echo ""
    echo "For local development, use port-forwarding:"
    echo "  kubectl port-forward svc/dashboard 3000:3000 -n $NAMESPACE"
    echo "  kubectl port-forward svc/channel-service 3001:3001 -n $NAMESPACE"
    echo "  kubectl port-forward svc/rabbitmq 15672:15672 -n $NAMESPACE"
fi

print_status "Deployment script completed successfully!"
