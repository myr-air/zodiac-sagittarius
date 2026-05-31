FRONTEND_DIR := frontend
BACKEND_MANIFEST := backend/Cargo.toml

DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius
TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
SAGITTARIUS_BIND_ADDR ?= 127.0.0.1:5181
PGADMIN_URL ?= postgres://postgres:postgres@127.0.0.1:5432/postgres
DATABASE_NAME ?= sagittarius
TEST_DATABASE_NAME ?= sagittarius_test
PSQL ?= psql

.PHONY: backend-dev frontend-dev backend-test frontend-build frontend-test frontend-storybook frontend-verify frontend-e2e-local verify db-init db-create db-migrate db-init-test db-migrate-test db-ensure-psql

backend-dev: db-init
	DATABASE_URL="$(DATABASE_URL)" SAGITTARIUS_BIND_ADDR="$(SAGITTARIUS_BIND_ADDR)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-api

frontend-dev:
	cd $(FRONTEND_DIR) && \
	NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL="http://$(SAGITTARIUS_BIND_ADDR)" bun run dev

backend-test: db-init-test
	DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST)

frontend-build:
	cd $(FRONTEND_DIR) && bun run build

frontend-test:
	cd $(FRONTEND_DIR) && bun run test

frontend-storybook:
	cd $(FRONTEND_DIR) && bun run storybook

frontend-verify:
	cd $(FRONTEND_DIR) && bun run verify:frontend

frontend-e2e-local:
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" SAGITTARIUS_BIND_ADDR="$(SAGITTARIUS_BIND_ADDR)" \
	bun run test:e2e:local

verify: frontend-verify backend-test

db-init: db-create
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trips'" | grep -q 1; then \
	  $(MAKE) db-migrate; \
	elif ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0004_account_password_auth.sql; \
	fi

db-init-test: db-create-test
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trips'" | grep -q 1; then \
	  $(MAKE) db-migrate-test; \
	elif ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0004_account_password_auth.sql; \
	fi

db-ensure-psql:
	@if ! command -v $(PSQL) >/dev/null 2>&1; then \
	  echo "Error: $(PSQL) not found in PATH. Install PostgreSQL client and retry."; \
	  echo "Examples:"; \
	  echo "  rtk brew install postgresql"; \
	  echo "  rtk sudo apt-get install postgresql-client"; \
	  echo "  rtk docker-psql via container (not covered by this Makefile)"; \
	  echo "Or set PSQL path manually, e.g. PSQL=/opt/homebrew/bin/psql make backend-dev"; \
	  exit 1; \
	fi

db-create:
	@$(MAKE) db-ensure-psql
	@if ! $(PSQL) "$(PGADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname='$(DATABASE_NAME)'" | grep -q 1; then \
	  $(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(DATABASE_NAME);"; \
	fi

db-create-test:
	@$(MAKE) db-ensure-psql
	@if ! $(PSQL) "$(PGADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname='$(TEST_DATABASE_NAME)'" | grep -q 1; then \
	  $(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(TEST_DATABASE_NAME);"; \
	fi

db-migrate:
	@for f in backend/migrations/*.sql; do \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < "$$f"; \
	done

db-migrate-test:
	@for f in backend/migrations/*.sql; do \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < "$$f"; \
	done
