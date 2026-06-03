# Production Freeze Checklist

Use this checklist after Wave 4 real-system verification passes in staging.

## Logging And Alerts

- Run API with `RUST_LOG=info,tower_http=info,sagittarius_api=info`.
- Confirm write requests emit HTTP trace spans with status and latency.
- Route 4xx/5xx write-operation logs to the staging alert sink before production.
- Alert on repeated `401`, `403`, `409`, and `500` spikes for:
  - itinerary write routes
  - stop-note routes
  - expense routes
  - member management routes

## Rollback

Migration `0007_stop_notes.sql` is additive. Rollback options:

- application rollback only: deploy previous app version while leaving
  `stop_notes` table unused.
- database rollback for test/staging only:

```sql
DROP INDEX IF EXISTS stop_notes_trip_item_created_at_idx;
DROP TABLE IF EXISTS stop_notes;
```

Before production, verify both paths in staging:

- upgrade from database with migrations `0001` through `0006`
- apply `0007_stop_notes.sql`
- boot API and load trip cockpit
- execute stop-note create/delete
- rollback app version and confirm old cockpit still loads

## Security And Access

- Run the checks in `/Users/xiivth/.codex/REAL_SYSTEM_QA.md`.
- Verify every write route rejects missing/invalid bearer tokens.
- Verify cross-trip IDs return `404` rather than mutating another trip.
- Verify viewer cannot create stop notes, mutate itinerary, edit expenses, or manage members.
- Verify traveler can create stop notes/suggestions but cannot directly edit itinerary, expenses, or members.
- Verify disabled members lose active sessions.

## Browser And Accessibility

- Desktop and mobile viewport smoke on:
  - overview
  - itinerary
  - members
  - account access/join flow
- Browser console has no runtime errors.
- Network panel has no failed write calls on success paths.
- Reload after each write shows persisted backend state.
- Keyboard and screen-reader labels remain present for member and stop-note controls.

## Ship Gate

Production can open only when:

- staging DB migration is verified
- backend integration and frontend targeted tests pass
- real browser e2e write journeys pass
- no known P1/P2 issues remain
- rollback owner and feature owner have signed off
