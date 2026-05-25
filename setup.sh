#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILES=(-f docker-compose.yml)
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"
SERVICES=(postgres redis neo4j minio)
CONTAINERS=(sentient-postgres sentient-redis sentient-neo4j sentient-minio)

info() {
  printf "\033[1;34m[setup]\033[0m %s\n" "$1"
}

success() {
  printf "\033[1;32m[setup]\033[0m %s\n" "$1"
}

fail() {
  printf "\033[1;31m[setup]\033[0m %s\n" "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH."
}

copy_env_file() {
  if [[ -f "$ENV_FILE" && "${OVERWRITE_ENV:-0}" != "1" ]]; then
    info "$ENV_FILE already exists; leaving it unchanged."
    return
  fi

  cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
  success "Created $ENV_FILE from $ENV_EXAMPLE_FILE."
}

wait_for_container_health() {
  local container="$1"
  local timeout_seconds="${2:-180}"
  local elapsed=0
  local interval=3

  info "Waiting for $container to become healthy..."

  while ((elapsed < timeout_seconds)); do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"

    case "$status" in
      healthy|running)
        success "$container is $status."
        return
        ;;
      unhealthy|exited|dead)
        docker logs --tail=80 "$container" >&2 || true
        fail "$container became $status during startup."
        ;;
    esac

    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  docker logs --tail=80 "$container" >&2 || true
  fail "Timed out waiting for $container to become healthy."
}

main() {
  info "Starting Sentient Phase 0 local setup."

  require_command docker
  require_command pnpm

  docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker Desktop and rerun ./setup.sh."

  if [[ ! -f "$ENV_EXAMPLE_FILE" ]]; then
    fail "$ENV_EXAMPLE_FILE is missing."
  fi

  copy_env_file

  if [[ ! -d node_modules ]]; then
    info "node_modules not found; installing workspace dependencies with pnpm install."
    pnpm install
  fi

  info "Starting Docker Compose services: ${SERVICES[*]}."
  docker compose "${COMPOSE_FILES[@]}" up -d "${SERVICES[@]}"

  for container in "${CONTAINERS[@]}"; do
    wait_for_container_health "$container" 240
  done

  info "Running Prisma migrations."
  pnpm db:migrate

  info "Running database seed script."
  pnpm db:seed

  success "Sentient local environment is ready."
  cat <<'NEXT_STEPS'

Next steps:
  1. Start app development servers:
     pnpm dev

  2. Open local infrastructure:
     PostgreSQL: localhost:5432
     Redis: localhost:6379
     Neo4j Browser: http://localhost:7474
     MinIO Console: http://localhost:9001

  3. Optional Neo4j graph setup:
     cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password -f packages/graph/cypher/001_schema.cypher
     cypher-shell -a bolt://localhost:7687 -u neo4j -p sentient-neo4j-password -f packages/graph/cypher/002_seed_demo_graph.cypher

Security reminder:
  Replace local placeholder secrets before any non-local deployment.
NEXT_STEPS
}

main "$@"
