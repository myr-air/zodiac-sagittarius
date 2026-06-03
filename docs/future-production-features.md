# Future Production Features

These are intentionally outside the current production connectivity pivot.

## Now Live In API Mode

- Stop notes persist through backend endpoints.
- Member create/update/reset claim flows have backend endpoints and frontend API wiring.
- Itinerary create/reorder/delete API wiring is live; delete is available from the edit stop dialog.
- Expense create/update/delete is wired through backend APIs from the context rail, with summary reload support.
- Presence updates persist through `POST /presence` and sync the active API session member online.
- Trip metadata updates have a versioned backend route and API client method.
- Local Docker-backed API/browser verification passed for the production-readiness wave.

## Still Future

- Browser-driven staging sign-off for all write journeys in the deployed staging environment.
- Production alert routing from HTTP/write traces into the deployment observability stack.
