# Future Production Features

These are intentionally outside the current production connectivity pivot.

## Now Live In API Mode

- Stop notes persist through backend endpoints.
- Member create/update/reset claim flows have backend endpoints and frontend API wiring.
- Itinerary create/reorder API wiring is live; delete has backend/client support.
- Expense write endpoints exist on the backend, with summary reload support.

## Still Future

- Browser-driven staging sign-off for all write journeys after local/staging Postgres is available.
- Production alert routing from HTTP/write traces into the deployment observability stack.
- Full expense editing UI if the product wants expense CRUD beyond summary/context controls.
