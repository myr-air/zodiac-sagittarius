FRONTEND_DIR := frontend
BACKEND_MANIFEST := backend/Cargo.toml
TEST_DATABASE_URL := postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test

.PHONY: frontend-dev frontend-build frontend-test frontend-storybook frontend-verify frontend-e2e-local backend-test verify

frontend-dev:
	cd $(FRONTEND_DIR) && bun run dev

frontend-build:
	cd $(FRONTEND_DIR) && bun run build

frontend-test:
	cd $(FRONTEND_DIR) && bun run test

frontend-storybook:
	cd $(FRONTEND_DIR) && bun run storybook

frontend-verify:
	cd $(FRONTEND_DIR) && bun run verify:frontend

frontend-e2e-local:
	cd $(FRONTEND_DIR) && bun run test:e2e:local

backend-test:
	DATABASE_URL=$(TEST_DATABASE_URL) cargo test --manifest-path $(BACKEND_MANIFEST)

verify: frontend-verify backend-test
