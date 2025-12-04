#!/bin/bash
# ===================================================================================
# GOVCONNECT - SWARM DEPLOYMENT SCRIPT
# ===================================================================================
#
# Script untuk deploy/update GovConnect di Docker Swarm
#
# Usage:
#   ./scripts/swarm-deploy.sh init      # Initialize swarm & secrets (pertama kali)
#   ./scripts/swarm-deploy.sh deploy    # Deploy/update stack
#   ./scripts/swarm-deploy.sh status    # View status
#   ./scripts/swarm-deploy.sh logs      # View logs
#   ./scripts/swarm-deploy.sh rollback  # Rollback service
#
# ===================================================================================

set -e

STACK_NAME="govconnect"
COMPOSE_FILE="docker-compose.swarm.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as docker swarm
check_swarm() {
    if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
        log_error "Docker Swarm is not active. Run: docker swarm init"
        exit 1
    fi
}

# Initialize swarm and secrets
init_swarm() {
    log_info "Initializing Docker Swarm..."
    
    # Check if already in swarm
    if docker info 2>/dev/null | grep -q "Swarm: active"; then
        log_warn "Swarm already active"
    else
        docker swarm init
        log_success "Swarm initialized"
    fi
    
    log_info "Creating secrets..."
    
    # Read from .env or prompt
    if [ -f .env ]; then
        source .env
    fi
    
    # Create secrets if not exist
    create_secret_if_not_exists "postgres_password" "${POSTGRES_PASSWORD:-postgree_govconnect}"
    create_secret_if_not_exists "rabbitmq_password" "${RABBITMQ_PASSWORD:-rabbitmq_govconnect}"
    create_secret_if_not_exists "internal_api_key" "${INTERNAL_API_KEY:-internal_api_key_govconnect}"
    create_secret_if_not_exists "gemini_api_key" "${GEMINI_API_KEY:-your-gemini-api-key}"
    create_secret_if_not_exists "jwt_secret" "${JWT_SECRET:-jwt_secret_govconnect}"
    
    log_success "Secrets created"
    
    # Login to GHCR
    log_info "Logging in to GitHub Container Registry..."
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
        log_success "Logged in to GHCR"
    else
        log_warn "GITHUB_TOKEN not set. You may need to login manually:"
        log_warn "  echo \$GITHUB_TOKEN | docker login ghcr.io -u \$GITHUB_ACTOR --password-stdin"
    fi
}

create_secret_if_not_exists() {
    local name=$1
    local value=$2
    
    if docker secret inspect "$name" >/dev/null 2>&1; then
        log_warn "Secret '$name' already exists, skipping"
    else
        echo "$value" | docker secret create "$name" -
        log_success "Created secret: $name"
    fi
}

# Deploy or update stack
deploy_stack() {
    check_swarm
    
    log_info "Pulling latest images..."
    docker pull ghcr.io/mygads/govconnect-channel-service:latest || true
    docker pull ghcr.io/mygads/govconnect-ai-service:latest || true
    docker pull ghcr.io/mygads/govconnect-case-service:latest || true
    docker pull ghcr.io/mygads/govconnect-notification-service:latest || true
    docker pull ghcr.io/mygads/govconnect-dashboard:latest || true
    
    log_info "Deploying stack: $STACK_NAME..."
    docker stack deploy -c "$COMPOSE_FILE" "$STACK_NAME" --with-registry-auth
    
    log_success "Stack deployed!"
    log_info "Waiting for services to be ready..."
    sleep 10
    
    show_status
}

# Update specific service
update_service() {
    check_swarm
    
    local service=$1
    local image=$2
    
    if [ -z "$service" ]; then
        log_error "Usage: $0 update <service-name> [image:tag]"
        log_info "Available services:"
        docker stack services "$STACK_NAME" --format "  - {{.Name}}"
        exit 1
    fi
    
    if [ -z "$image" ]; then
        image="ghcr.io/mygads/$service:latest"
    fi
    
    log_info "Updating $service to $image..."
    docker service update --image "$image" "${STACK_NAME}_${service}" --with-registry-auth
    
    log_success "Update initiated for $service"
    log_info "Monitor with: docker service logs -f ${STACK_NAME}_${service}"
}

# Rollback service
rollback_service() {
    check_swarm
    
    local service=$1
    
    if [ -z "$service" ]; then
        log_error "Usage: $0 rollback <service-name>"
        log_info "Available services:"
        docker stack services "$STACK_NAME" --format "  - {{.Name}}"
        exit 1
    fi
    
    log_info "Rolling back ${STACK_NAME}_${service}..."
    docker service rollback "${STACK_NAME}_${service}"
    
    log_success "Rollback initiated"
}

# Show status
show_status() {
    check_swarm
    
    echo ""
    log_info "=== Stack Services ==="
    docker stack services "$STACK_NAME"
    
    echo ""
    log_info "=== Service Tasks ==="
    docker stack ps "$STACK_NAME" --no-trunc
}

# Show logs
show_logs() {
    check_swarm
    
    local service=$1
    
    if [ -z "$service" ]; then
        log_info "Available services:"
        docker stack services "$STACK_NAME" --format "{{.Name}}"
        log_info "Usage: $0 logs <service-name>"
        exit 1
    fi
    
    docker service logs -f "${STACK_NAME}_${service}"
}

# Remove stack
remove_stack() {
    check_swarm
    
    log_warn "This will remove all services in stack: $STACK_NAME"
    read -p "Are you sure? (y/N): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker stack rm "$STACK_NAME"
        log_success "Stack removed"
    else
        log_info "Cancelled"
    fi
}

# Main
case "$1" in
    init)
        init_swarm
        ;;
    deploy)
        deploy_stack
        ;;
    update)
        update_service "$2" "$3"
        ;;
    rollback)
        rollback_service "$2"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    remove)
        remove_stack
        ;;
    *)
        echo "GovConnect Swarm Deployment Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  init                    Initialize swarm & create secrets"
        echo "  deploy                  Deploy or update the stack"
        echo "  update <service> [img]  Update specific service"
        echo "  rollback <service>      Rollback service to previous"
        echo "  status                  Show stack status"
        echo "  logs <service>          Show service logs"
        echo "  remove                  Remove the stack"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 deploy"
        echo "  $0 update ai-service"
        echo "  $0 rollback ai-service"
        echo "  $0 logs channel-service"
        exit 1
        ;;
esac
