FRONTEND_DIR := frontend
BACKEND_MANIFEST := backend/Cargo.toml

DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius
TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
SAGITTARIUS_BIND_ADDR ?= 127.0.0.1:5181
PGADMIN_URL ?= postgres://postgres:postgres@127.0.0.1:5432/postgres
DATABASE_NAME ?= sagittarius
TEST_DATABASE_NAME ?= sagittarius_test
ROLLBACK_TEST_DATABASE_NAME ?= sagittarius_rollback_test
ROLLBACK_TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/$(ROLLBACK_TEST_DATABASE_NAME)
PSQL ?= psql
PSQL_BIN := $(firstword $(PSQL))

.PHONY: backend-dev frontend-dev backend-test frontend-build frontend-test frontend-storybook frontend-verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke verify production-readiness-local db-init db-create db-migrate db-init-test db-migrate-test db-rollback-stop-notes-test db-ensure-psql

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

frontend-e2e-local: db-init-test
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" SAGITTARIUS_BIND_ADDR="$(SAGITTARIUS_BIND_ADDR)" \
	bun run test:e2e:local

frontend-e2e-auth-browser: db-init-test
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	bun run test:e2e:auth-browser

api-trace-smoke: db-init-test
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	bun run test:api-trace-smoke

verify: frontend-verify backend-test

production-readiness-local: verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke db-rollback-stop-notes-test

db-init: db-create
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trips'" | grep -q 1; then \
	  $(MAKE) db-migrate; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0004_account_password_auth.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='account_vault_items'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0005_account_portal.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='countries'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0006_trip_countries.sql; \
	fi

db-init-test: db-create-test
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trips'" | grep -q 1; then \
	  $(MAKE) db-migrate-test; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0004_account_password_auth.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='account_vault_items'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0005_account_portal.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='countries'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0006_trip_countries.sql; \
	fi

db-ensure-psql:
	@if ! command -v $(PSQL_BIN) >/dev/null 2>&1; then \
	  echo "Error: $(PSQL_BIN) not found in PATH. Install PostgreSQL client and retry."; \
	  echo "Examples:"; \
	  echo "  rtk brew install postgresql"; \
	  echo "  rtk sudo apt-get install postgresql-client"; \
	  echo "  PSQL='docker exec -i sagittarius-test-postgres psql' rtk make verify"; \
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

db-rollback-stop-notes-test:
	@$(MAKE) db-ensure-psql
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(ROLLBACK_TEST_DATABASE_NAME) WITH (FORCE);"
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(ROLLBACK_TEST_DATABASE_NAME);"
	@for f in backend/migrations/*.sql; do \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(ROLLBACK_TEST_DATABASE_URL)" < "$$f"; \
	done
	@$(PSQL) "$(ROLLBACK_TEST_DATABASE_URL)" -tAc "SELECT to_regclass('public.stop_notes') IS NOT NULL" | grep -q t
	@$(PSQL) "$(ROLLBACK_TEST_DATABASE_URL)" -v ON_ERROR_STOP=1 -c "DROP INDEX IF EXISTS stop_notes_trip_item_created_at_idx; DROP TABLE IF EXISTS stop_notes;"
	@$(PSQL) "$(ROLLBACK_TEST_DATABASE_URL)" -tAc "SELECT to_regclass('public.stop_notes') IS NULL" | grep -q t
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(ROLLBACK_TEST_DATABASE_NAME) WITH (FORCE);"
