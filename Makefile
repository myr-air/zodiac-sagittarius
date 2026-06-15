FRONTEND_DIR := frontend
BACKEND_MANIFEST := backend/Cargo.toml

PRODUCTION_COMPOSE_FILE ?= docker-compose.yml
PRODUCTION_ENV_FILE ?= .env.production
PRODUCTION_ENV_SOURCE := $(if $(filter /%,$(PRODUCTION_ENV_FILE)),$(PRODUCTION_ENV_FILE),./$(PRODUCTION_ENV_FILE))
PRODUCTION_COMPOSE = set -a; . "$(PRODUCTION_ENV_SOURCE)"; set +a; docker compose --env-file "$(PRODUCTION_ENV_SOURCE)" -f "$(PRODUCTION_COMPOSE_FILE)"
SIGNOFF_ENV_FILE ?= .env.release-signoff
SIGNOFF_ENV_SOURCE := $(if $(filter /%,$(SIGNOFF_ENV_FILE)),$(SIGNOFF_ENV_FILE),./$(SIGNOFF_ENV_FILE))

DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius
TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
SAGITTARIUS_BIND_ADDR ?= 127.0.0.1:5181
SAGITTARIUS_ENV ?= development
SAGITTARIUS_SEED_SAMPLE_DATA ?= 1
PLACE_RESOLUTION_ENABLED ?= 0
PLACE_RESOLUTION_USER_AGENT ?= Sagittarius local dev place resolver
PGADMIN_URL ?= postgres://postgres:postgres@127.0.0.1:5432/postgres
DATABASE_NAME ?= sagittarius
TEST_DATABASE_NAME ?= sagittarius_test
ROLLBACK_TEST_DATABASE_NAME ?= sagittarius_rollback_test
ROLLBACK_TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/$(ROLLBACK_TEST_DATABASE_NAME)
PSQL ?= psql
PSQL_BIN := $(firstword $(PSQL))

.PHONY: backend-dev frontend-dev backend-test backend-daily-briefings-contract frontend-build frontend-test frontend-storybook frontend-verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke perf-smoke production-env-check production-env-file-check staging-preflight release-signoff-check staging-signoff-check production-deploy-gate verify production-readiness-fast production-readiness-local container-build container-production-build container-production-migrate container-production-migrate-baseline container-production-up container-production-down container-production-logs container-production-check db-init db-create db-migrate db-init-test db-migrate-test db-rollback-stop-notes-test db-ensure-psql

backend-dev: db-init
	DATABASE_URL="$(DATABASE_URL)" SAGITTARIUS_BIND_ADDR="$(SAGITTARIUS_BIND_ADDR)" \
	SAGITTARIUS_ENV="$(SAGITTARIUS_ENV)" \
	SAGITTARIUS_SEED_SAMPLE_DATA="$(SAGITTARIUS_SEED_SAMPLE_DATA)" \
	PLACE_RESOLUTION_ENABLED="$(PLACE_RESOLUTION_ENABLED)" \
	PLACE_RESOLUTION_USER_AGENT="$(PLACE_RESOLUTION_USER_AGENT)" \
	cargo run --manifest-path $(BACKEND_MANIFEST) --bin sagittarius-api

frontend-dev:
	cd $(FRONTEND_DIR) && \
	NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL="http://$(SAGITTARIUS_BIND_ADDR)" bun run dev

backend-test: db-init-test
	DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST)

backend-daily-briefings-contract: db-init-test
	DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST) -p sagittarius-api --test daily_briefings_contract

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

perf-smoke: db-init-test
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	bun run test:perf-smoke

production-env-check:
	cd $(FRONTEND_DIR) && bun run test:production-env

production-env-file-check:
	set -a; . "$(PRODUCTION_ENV_SOURCE)"; set +a; cd $(FRONTEND_DIR) && SAGITTARIUS_PRODUCTION_ENV_FILE_CHECK=1 bun run test:production-env

staging-preflight: db-ensure-psql
	cd $(FRONTEND_DIR) && \
	DATABASE_URL="$(TEST_DATABASE_URL)" \
	NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL="http://$(SAGITTARIUS_BIND_ADDR)" \
	PSQL="$(PSQL)" \
	RUST_LOG="info,tower_http=info,sagittarius_api=info" \
	bun run test:staging-preflight

release-signoff-check:
	set -a; . "$(SIGNOFF_ENV_SOURCE)"; set +a; cd $(FRONTEND_DIR) && bun run test:release-signoff

staging-signoff-check: release-signoff-check

production-deploy-gate: production-env-file-check release-signoff-check

verify: frontend-verify backend-test

production-readiness-fast: staging-preflight verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke db-rollback-stop-notes-test

production-readiness-local: production-readiness-fast perf-smoke

container-build:
	docker build -f backend/Dockerfile -t sagittarius-api:local .
	docker build -f frontend/Dockerfile -t sagittarius-frontend:local .

container-production-build:
	$(PRODUCTION_COMPOSE) build

container-production-migrate: production-env-file-check
	$(PRODUCTION_COMPOSE) run --rm --no-deps sagittarius-server sagittarius-migrate

container-production-migrate-baseline: production-env-file-check
	$(PRODUCTION_COMPOSE) run --rm --no-deps -e SAGITTARIUS_MIGRATION_BASELINE=1 sagittarius-server sagittarius-migrate

container-production-up:
	$(PRODUCTION_COMPOSE) up -d

container-production-down:
	$(PRODUCTION_COMPOSE) down

container-production-logs:
	$(PRODUCTION_COMPOSE) logs -f --tail=200

container-production-check: production-env-file-check
	$(PRODUCTION_COMPOSE) ps
	$(PRODUCTION_COMPOSE) exec sagittarius-server curl -fsS http://localhost:5181/api/v1/readiness
	$(PRODUCTION_COMPOSE) exec sagittarius-web bun --eval "fetch('http://localhost:5180').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

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
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_daily_briefings'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0008_trip_daily_briefings.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_join_invite_tokens'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0009_trip_join_invite_tokens.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='path_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0010_itinerary_activity_paths.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_reminders'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0011_expense_reminders.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='exchange_rate_to_settlement_currency'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0012_expense_exchange_rates.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='line_items'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0013_expense_receipts_itemization.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='notes'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0014_expense_notes.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='comments'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0015_expense_comments.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='place_geocode_cache'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0016_place_geocode_cache.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='booking_docs'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0017_booking_docs.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_attempt_locks'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0018_auth_attempt_locks.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='photo_album_links'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0019_photo_album_links.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='origin_label'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0020_trip_city_routes.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='trusted_devices_user_active_label_key'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0021_trusted_device_active_label_unique.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='details'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0022_itinerary_item_details.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plan_checks'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0023_itinerary_table_v1.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plan_checks' AND grantee='sagittarius'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0024_plan_check_runtime_grants.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plan_variants' AND column_name='status'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0025_trip_plan_compatibility.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_tasks' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0026_plan_scoped_records.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='end_time'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0027_itinerary_hierarchy_time_windows.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plan_checks' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0028_plan_check_trip_plan_scope.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expense_reminders' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0029_expense_reminder_trip_plan_scope.sql; \
	fi
	@if ! $(PSQL) "$(DATABASE_URL)" -tAc "SELECT 1 FROM pg_constraint WHERE conname='itinerary_items_activity_type_check' AND pg_get_constraintdef(oid) LIKE '%default%'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(DATABASE_URL)" < backend/migrations/0031_itinerary_activity_type_default.sql; \
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
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_daily_briefings'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0008_trip_daily_briefings.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trip_join_invite_tokens'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0009_trip_join_invite_tokens.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='path_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0010_itinerary_activity_paths.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_reminders'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0011_expense_reminders.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='exchange_rate_to_settlement_currency'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0012_expense_exchange_rates.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='line_items'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0013_expense_receipts_itemization.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='notes'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0014_expense_notes.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='comments'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0015_expense_comments.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='place_geocode_cache'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0016_place_geocode_cache.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='booking_docs'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0017_booking_docs.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_attempt_locks'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0018_auth_attempt_locks.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='photo_album_links'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0019_photo_album_links.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='origin_label'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0020_trip_city_routes.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='trusted_devices_user_active_label_key'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0021_trusted_device_active_label_unique.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='details'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0022_itinerary_item_details.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plan_checks'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0023_itinerary_table_v1.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plan_checks' AND grantee='sagittarius'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0024_plan_check_runtime_grants.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plan_variants' AND column_name='status'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0025_trip_plan_compatibility.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_tasks' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0026_plan_scoped_records.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='itinerary_items' AND column_name='end_time'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0027_itinerary_hierarchy_time_windows.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plan_checks' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0028_plan_check_trip_plan_scope.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expense_reminders' AND column_name='trip_plan_id'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0029_expense_reminder_trip_plan_scope.sql; \
	fi
	@if ! $(PSQL) "$(TEST_DATABASE_URL)" -tAc "SELECT 1 FROM pg_constraint WHERE conname='itinerary_items_activity_type_check' AND pg_get_constraintdef(oid) LIKE '%default%'" | grep -q 1; then \
	  $(PSQL) -v ON_ERROR_STOP=1 "$(TEST_DATABASE_URL)" < backend/migrations/0031_itinerary_activity_type_default.sql; \
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
	@$(PSQL) "$(ROLLBACK_TEST_DATABASE_URL)" -v ON_ERROR_STOP=1 -c "DROP TABLE IF EXISTS booking_doc_stop_notes; DROP INDEX IF EXISTS stop_notes_trip_item_created_at_idx; DROP TABLE IF EXISTS stop_notes;"
	@$(PSQL) "$(ROLLBACK_TEST_DATABASE_URL)" -tAc "SELECT to_regclass('public.stop_notes') IS NULL" | grep -q t
	@$(PSQL) "$(PGADMIN_URL)" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(ROLLBACK_TEST_DATABASE_NAME) WITH (FORCE);"
