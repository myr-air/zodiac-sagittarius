# Itinerary JSON Format

Use JSON for itinerary import/export because the frontend, API contracts, and
stored itinerary rows already use JSON-shaped TypeScript objects. The file is
machine-safe, easy to validate, and keeps YAML/TOML parser edge cases out of the
planning flow.

Suggested file name:

```text
<trip-name>-itinerary-v1.json
```

Schema envelope:

```json
{
  "schema": "joii.itinerary.export",
  "version": 1,
  "exportedAt": "2026-06-04T12:00:00.000Z",
  "trip": {
    "id": "trip-hong-kong-shenzhen",
    "name": "Hong Kong + Shenzhen Trip",
    "destinationLabel": "Hong Kong + Shenzhen",
    "startDate": "2025-05-15",
    "endDate": "2025-05-20",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main"
  },
  "items": [
    {
      "id": "item-dimdim",
      "pathGroupId": "path-group-item-dimdim",
      "pathId": "path-rain",
      "pathName": "Rain plan",
      "pathRole": "alternative",
      "parentItemId": null,
      "itemKind": "meal",
      "timeMode": "scheduled",
      "isPlanBlock": false,
      "status": "planned",
      "priority": "normal",
      "day": "2025-05-16",
      "sortOrder": 100,
      "startTime": "08:30",
      "endTime": "09:30",
      "endOffsetDays": 0,
      "activity": "Dim Dim Sum ที่ Tim Ho Wan",
      "activityType": "food",
      "place": "Shop G72, G/F, The Elements",
      "linkLabel": "แผนที่",
      "mapLink": "https://maps.google.com/?q=Dim+Dim+Sum",
      "address": "Shop G72, G/F, The Elements, 1 Austin Rd W",
      "durationMinutes": 60,
      "transportation": "เดิน",
      "advisories": [
        { "code": "booking-recommended", "label": "จองล่วงหน้าแนะนำ", "severity": "warning" }
      ],
      "note": "ร้านนี้เหมาะกับมื้อเช้าแบบไม่เร่ง"
    }
  ],
  "records": {
    "expenses": [],
    "bookingDocs": [],
    "stopNotes": [],
    "tasks": []
  }
}
```

Import behavior:

- Only files with `schema: "joii.itinerary.export"` and `version: 1` are accepted.
- Import asks for a target Trip Plan before applying rows. Imported rows are
  assigned to that destination Trip Plan unless a later import mode explicitly
  says otherwise.
- Imported rows may also carry optional Activity Path fields for comparing
  route options inside a day or itinerary block. Activity Path is separate from
  the target Trip Plan.
- Imported rows can carry optional activity branch fields: `pathGroupId`,
  `pathId`, `pathName`, and `pathRole`.
- Imported rows preserve itinerary hierarchy and time-window fields:
  `parentItemId`, `itemKind`, `timeMode`, `isPlanBlock`, `status`, `priority`,
  `endTime`, and `endOffsetDays`. `parentItemId` is a string because local
  exports can use stable client ids before rows exist in the backend database.
- The export metadata includes canonical `mainTripPlanId` beside deprecated
  `activePlanVariantId`.
- Import accepts `trip.activePlanVariantId`, `trip.mainTripPlanId`, both, or
  neither as compatibility metadata. The current destination trip id and target
  Trip Plan are supplied by the importing app state, so source metadata never
  switches the destination Main Plan by itself.
- Exports carry compatibility `expenses`, `bookingDocs`, `stopNotes`, and
  `tasks` under `records` so later phases can round-trip booking, ticket, note,
  checklist, or Actual Expense context without losing source information.
- Import record handling is explicit. `Clone linked records` creates linked
  expenses, booking docs, notes, and tasks in the selected destination Trip Plan
  and remaps item/record links during apply. `Activities only` imports the
  itinerary rows while leaving the source records as reference context in the
  uploaded file. Invalid or dangling record references are rejected before apply.
  Neither mode switches the destination Main Plan.
- Other plan variants, members, and suggestions are not changed.

## Import Normalizer Endpoint

Use one frontend `Import` action. The backend decides whether the uploaded text
is already Joii JSON or needs AI conversion.

```text
POST /api/v1/trips/:tripId/itinerary-imports
Authorization: Bearer <member-session-token>
```

Request:

```json
{
  "fileName": "notes.md",
  "contentType": "text/markdown",
  "mode": "auto",
  "content": "09:00 breakfast at Central\n10:30 Peak Tram"
}
```

Modes:

- `auto`: parse Joii JSON first; if that fails, convert text through the configured AI provider.
- `json`: accept only Joii JSON.
- `ai`: always convert text through the configured AI provider.

AI provider environment:

```text
SAGITTARIUS_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-5.2
OPENROUTER_SITE_URL=https://app.example.test
OPENROUTER_SITE_NAME=Joii
```

For local development only, the import service can call Google Antigravity CLI:

```text
SAGITTARIUS_ENV=development
SAGITTARIUS_AI_PROVIDER=antigravity-cli
ANTIGRAVITY_CLI_BIN=agy
ANTIGRAVITY_CLI_TIMEOUT_SECONDS=45
```

The `antigravity-cli` provider is blocked in `production` and `staging`. It is a
best-effort local bridge for text-mode CLI use, not a production API provider.

Only owners and organizers can use the endpoint.
