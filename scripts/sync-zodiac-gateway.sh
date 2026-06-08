#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ZODIAC_ROOT_DIR:-/Users/xiivth/workspace/zodiac}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SOURCE_CADDYFILE="${PROJECT_DIR}/infra/zodiac/Caddyfile"
SOURCE_COMPOSE="${PROJECT_DIR}/infra/zodiac/docker-compose.yml"
TARGET_CADDYFILE="${ROOT_DIR}/Caddyfile"
TARGET_COMPOSE="${ROOT_DIR}/docker-compose.yml"

usage() {
  cat <<'USAGE'
Usage:
  scripts/sync-zodiac-gateway.sh check
  scripts/sync-zodiac-gateway.sh apply

Environment:
  ZODIAC_ROOT_DIR=/path/to/zodiac  Override the root zodiac directory.
USAGE
}

check_file() {
  local source="$1"
  local target="$2"

  if cmp -s "$source" "$target"; then
    printf 'ok %s matches %s\n' "$target" "$source"
    return 0
  fi

  printf 'drift %s differs from %s\n' "$target" "$source" >&2
  diff -u "$source" "$target" >&2 || true
  return 1
}

apply_file() {
  local source="$1"
  local target="$2"

  install -m 0644 "$source" "$target"
  printf 'synced %s from %s\n' "$target" "$source"
}

command="${1:-check}"

case "$command" in
  check)
    check_file "$SOURCE_CADDYFILE" "$TARGET_CADDYFILE"
    check_file "$SOURCE_COMPOSE" "$TARGET_COMPOSE"
    ;;
  apply)
    apply_file "$SOURCE_CADDYFILE" "$TARGET_CADDYFILE"
    apply_file "$SOURCE_COMPOSE" "$TARGET_COMPOSE"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
