#!/bin/bash
# ==================== TRAEFIK DEPLOYMENT SCRIPT ====================
# Deploy Traefik API Gateway for GovConnect
# Usage: ./deploy-traefik.sh [install|upgrade|uninstall]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE_TRAEFIK="traefik"
NAMESPACE_GOVCONNECT="govconnect"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        log_error "helm not found. Please install helm."
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster."
        exit 1
    fi
    
    log_success "Prerequisites check passed!"
}

# Install Traefik
install_traefik() {
    log_info "Installing Traefik API Gateway..."
    
    # Add Traefik Helm repository
    log_info "Adding Traefik Helm repository..."
    helm repo add traefik https://traefik.github.io/charts
    helm repo update
    
    # Create namespace if not exists
    kubectl create namespace $NAMESPACE_TRAEFIK --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Traefik
    log_info "Installing Traefik via Helm..."
    helm install traefik traefik/traefik \
        -f "$SCRIPT_DIR/traefik-values.yaml" \
        --namespace $NAMESPACE_TRAEFIK \
        --wait \
        --timeout 5m
    
    log_success "Traefik installed successfully!"
    
    # Apply middleware and IngressRoutes
    apply_configs
}

# Upgrade Traefik
upgrade_traefik() {
    log_info "Upgrading Traefik..."
    
    helm repo update
    
    helm upgrade traefik traefik/traefik \
        -f "$SCRIPT_DIR/traefik-values.yaml" \
        --namespace $NAMESPACE_TRAEFIK \
        --wait \
        --timeout 5m
    
    log_success "Traefik upgraded successfully!"
    
    # Apply configs
    apply_configs
}

# Apply middleware and IngressRoutes
apply_configs() {
    log_info "Applying Traefik configurations..."
    
    # Ensure govconnect namespace exists
    kubectl create namespace $NAMESPACE_GOVCONNECT --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply dashboard auth secret
    log_info "Applying Traefik dashboard auth..."
    kubectl apply -f "$SCRIPT_DIR/03-traefik-dashboard-secret.yaml"
    
    # Apply middleware
    log_info "Applying middleware configurations..."
    kubectl apply -f "$SCRIPT_DIR/01-middleware.yaml"
    
    # Apply IngressRoutes
    log_info "Applying IngressRoutes..."
    kubectl apply -f "$SCRIPT_DIR/02-ingressroute.yaml"
    
    log_success "All configurations applied!"
}

# Install cert-manager (optional)
install_cert_manager() {
    log_info "Installing cert-manager for automatic TLS..."
    
    # Install cert-manager
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
    
    # Wait for cert-manager to be ready
    log_info "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=120s
    kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=120s
    
    # Apply certificate configurations
    log_info "Applying certificate configurations..."
    kubectl apply -f "$SCRIPT_DIR/04-cert-manager.yaml"
    
    log_success "cert-manager installed and configured!"
}

# Uninstall Traefik
uninstall_traefik() {
    log_warning "Uninstalling Traefik..."
    
    # Delete IngressRoutes and middleware
    kubectl delete -f "$SCRIPT_DIR/02-ingressroute.yaml" --ignore-not-found
    kubectl delete -f "$SCRIPT_DIR/01-middleware.yaml" --ignore-not-found
    kubectl delete -f "$SCRIPT_DIR/03-traefik-dashboard-secret.yaml" --ignore-not-found
    
    # Uninstall Traefik Helm release
    helm uninstall traefik --namespace $NAMESPACE_TRAEFIK || true
    
    # Delete namespace
    kubectl delete namespace $NAMESPACE_TRAEFIK --ignore-not-found
    
    log_success "Traefik uninstalled!"
}

# Show status
show_status() {
    log_info "Traefik Status:"
    echo ""
    
    echo "=== Traefik Pods ==="
    kubectl get pods -n $NAMESPACE_TRAEFIK -l app.kubernetes.io/name=traefik
    echo ""
    
    echo "=== Traefik Service ==="
    kubectl get svc -n $NAMESPACE_TRAEFIK
    echo ""
    
    echo "=== IngressRoutes ==="
    kubectl get ingressroute -n $NAMESPACE_GOVCONNECT 2>/dev/null || echo "No IngressRoutes found"
    echo ""
    
    echo "=== Middleware ==="
    kubectl get middleware -n $NAMESPACE_GOVCONNECT 2>/dev/null || echo "No Middleware found"
    echo ""
    
    # Get external IP
    EXTERNAL_IP=$(kubectl get svc traefik -n $NAMESPACE_TRAEFIK -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$EXTERNAL_IP" ]; then
        log_info "External IP: $EXTERNAL_IP"
        echo ""
        echo "Add to your DNS:"
        echo "  govconnect.my.id     A    $EXTERNAL_IP"
        echo "  api.govconnect.my.id A    $EXTERNAL_IP"
    fi
}

# Main
case "${1:-install}" in
    install)
        check_prerequisites
        install_traefik
        show_status
        ;;
    upgrade)
        check_prerequisites
        upgrade_traefik
        show_status
        ;;
    uninstall)
        uninstall_traefik
        ;;
    status)
        show_status
        ;;
    cert-manager)
        check_prerequisites
        install_cert_manager
        ;;
    configs)
        apply_configs
        ;;
    *)
        echo "Usage: $0 {install|upgrade|uninstall|status|cert-manager|configs}"
        exit 1
        ;;
esac
