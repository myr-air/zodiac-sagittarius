# Joii / Sagittarius — essential Make targets only
# See AGENTS.md for workflow.

FRONTEND_DIR := frontend
BACKEND_MANIFEST := backend/Cargo.toml

DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius
TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
PGADMIN_URL ?= postgres://postgres:postgres@127.0.0.1:5432/postgres
DATABASE_NAME ?= sagittarius
TEST_DATABASE_NAME ?= sagittarius_test

SAGITTARIUS_BIND_ADDR ?= 127.0.0.1:5181
SAGITTARIUS_ENV ?= development
SAGITTARIUS_SEED_SAMPLE_DATA ?= 1
RUST_LOG ?= info,tower_http=info,sagittarius_api=info

PSQL ?= psql
PSQL_BIN := $(firstword $(PSQL))

.DEFAULT_GOAL := help

.PHONY: help backend-dev frontend-dev verify db-init db-reset db-reset-test

help:
	@printf '%s\n' \
		'  make backend-dev     API on $(SAGITTARIUS_BIND_ADDR)' \
		'  make frontend-dev    Web on 127.0.0.1:5180' \
		'  make verify          Frontend checks + backend tests' \
		'  make db-init         Create DB and run migrations' \
		'  make db-reset        Drop/recreate DB and migrate' \
		'  make db-reset-test   Drop/recreate test DB and migrate'

backend-dev: db-init
	DATABASE_URL="$(DATABASE_URL)" \
	SAGITTARIUS_BIND_ADDR="$(SAGITTARIUS_BIND_ADDR)" \
	SAGITTARIUS_ENV="$(SAGITTARIUS_ENV)" \
	SAGITTARIUS_SEED_SAMPLE_DATA="$(SAGITTARIUS_SEED_SAMPLE_DATA)" \
	RUST_LOG="$(RUST_LOG)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-api

frontend-dev:
	cd $(FRONTEND_DIR) && \
	NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL="http://$(SAGITTARIUS_BIND_ADDR)" bun run dev

verify:
	cd $(FRONTEND_DIR) && bun run verify:frontend
	@$(MAKE) db-reset-test
	DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST)

db-init:
	@$(MAKE) db-ensure-psql
	@if ! $(PSQL) "$(PGADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname='$(DATABASE_NAME)'" | grep -q 1; then \
	  $(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(DATABASE_NAME);"; \
	fi
	DATABASE_URL="$(DATABASE_URL)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-migrate

db-reset: db-ensure-psql
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$(DATABASE_NAME)' AND pid <> pg_backend_pid();" >/dev/null
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(DATABASE_NAME);"
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(DATABASE_NAME);"
	DATABASE_URL="$(DATABASE_URL)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-migrate

db-reset-test: db-ensure-psql
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$(TEST_DATABASE_NAME)' AND pid <> pg_backend_pid();" >/dev/null
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(TEST_DATABASE_NAME);"
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(TEST_DATABASE_NAME);"
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-migrate

# --- internal --------------------------------------------------------------

.PHONY: db-ensure-psql db-init-test

db-ensure-psql:
	@if ! command -v $(PSQL_BIN) >/dev/null 2>&1; then \
	  echo "Error: $(PSQL_BIN) not found. Install PostgreSQL client tools."; \
	  exit 1; \
	fi

db-init-test: db-ensure-psql
	@if ! $(PSQL) "$(PGADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname='$(TEST_DATABASE_NAME)'" | grep -q 1; then \
	  $(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(TEST_DATABASE_NAME);"; \
	fi
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-migrate
