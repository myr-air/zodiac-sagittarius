# Commands Reference

Use `rtk` for shell commands

## Testing

| Check | Directory | Command |
|-------|-----------|---------|
| Backend schema/contracts | `backend/` | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` |
| Frontend type safety | `frontend/` | `rtk bun run typecheck` |
| Real API e2e compatibility | Repository root | `rtk make frontend-e2e-local` |

## Development

```bash
make frontend-dev    # Start Next.js dev server
make backend-dev     # Start Rust API server
```
