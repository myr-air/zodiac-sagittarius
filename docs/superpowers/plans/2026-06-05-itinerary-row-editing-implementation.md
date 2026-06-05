# Itinerary Row Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hybrid Notion-like inline editing to the itinerary table while keeping the full edit dialog for larger fields and adding an app-styled delete confirmation modal.

**Architecture:** `SmartItineraryTable` owns transient inline field state and delete confirmation state. `SagittariusApp` owns persisted mutations for local/API modes through a narrow inline patch callback. Existing `StopDialog` remains the full edit modal.

**Tech Stack:** React 19, TypeScript, Next.js app, Tailwind utilities, Vitest, Testing Library.

---

## File Structure

- Modify `frontend/src/components/SmartItineraryTable.tsx`
  - Add `InlineItineraryItemPatch`.
  - Add flat inline input/select controls for visible row fields.
  - Add an app-styled delete confirmation dialog.
  - Preserve existing edit button callback.
- Modify `frontend/src/app/SagittariusApp.tsx`
  - Add `updateItineraryItemInline`.
  - Pass the inline callback to `SmartItineraryTable`.
  - Remove `window.confirm` from the shared delete function; confirmation moves to table/delete dialog.
- Modify `frontend/src/components/SmartItineraryTable.test.tsx`
  - Add red tests for inline edits, Escape cancel, read-only behavior, and delete confirmation.
  - Update existing row action expectations for modal confirmation.
- Modify `frontend/src/i18n/messages.ts`
  - Add accessible labels for inline fields and delete confirmation copy in English/Thai.

---

### Task 1: Add Table Inline Editing Tests

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.test.tsx`

- [ ] **Step 1: Write failing tests for inline edit behavior**

Add tests near the existing row action tests:

```ts
it("saves visible row fields from flat inline controls", async () => {
  const user = userEvent.setup();
  const onUpdateItemInline = vi.fn();
  renderTable({ onUpdateItemInline });
  const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

  const activity = within(row).getByRole("textbox", { name: /แก้ไขกิจกรรม Dim Dim Sum/i });
  await user.clear(activity);
  await user.type(activity, "Harbour brunch{Enter}");

  await user.clear(within(row).getByRole("textbox", { name: /แก้ไขสถานที่ Dim Dim Sum/i }));
  await user.type(within(row).getByRole("textbox", { name: /แก้ไขสถานที่ Dim Dim Sum/i }), "Central Pier{Enter}");

  await user.clear(within(row).getByLabelText(/แก้ไขเวลา Dim Dim Sum/i));
  await user.type(within(row).getByLabelText(/แก้ไขเวลา Dim Dim Sum/i), "10:15{Enter}");

  await user.selectOptions(within(row).getByRole("combobox", { name: /แก้ไขประเภท Dim Dim Sum/i }), "experience");
  await user.clear(within(row).getByRole("textbox", { name: /แก้ไขการเดินทาง Dim Dim Sum/i }));
  await user.type(within(row).getByRole("textbox", { name: /แก้ไขการเดินทาง Dim Dim Sum/i }), "Walk{Enter}");

  expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", { activity: "Harbour brunch" });
  expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", { place: "Central Pier" });
  expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", { startTime: "10:15" });
  expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", { activityType: "experience" });
  expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", { transportation: "Walk" });
});

it("cancels a flat inline edit with Escape", async () => {
  const user = userEvent.setup();
  const onUpdateItemInline = vi.fn();
  renderTable({ onUpdateItemInline });
  const activity = within(screen.getByRole("row", { name: /Dim Dim Sum/i })).getByRole("textbox", { name: /แก้ไขกิจกรรม Dim Dim Sum/i });

  await user.clear(activity);
  await user.type(activity, "Wrong value");
  await user.keyboard("{Escape}");

  expect(activity).toHaveValue("Dim Dim Sum");
  expect(onUpdateItemInline).not.toHaveBeenCalled();
});

it("keeps inline row fields read-only for viewer roles", () => {
  renderTable({ role: "viewer", onUpdateItemInline: vi.fn() });
  const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

  expect(within(row).getByRole("textbox", { name: /กิจกรรม Dim Dim Sum/i })).toBeReadOnly();
  expect(within(row).getByRole("textbox", { name: /สถานที่ Dim Dim Sum/i })).toBeReadOnly();
  expect(within(row).getByLabelText(/เวลา Dim Dim Sum/i)).toBeDisabled();
  expect(within(row).getByRole("combobox", { name: /ประเภท Dim Dim Sum/i })).toBeDisabled();
  expect(within(row).getByRole("textbox", { name: /การเดินทาง Dim Dim Sum/i })).toBeReadOnly();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd frontend && bun run test src/components/SmartItineraryTable.test.tsx`

Expected: FAIL because `onUpdateItemInline` is not a supported prop and inline controls/labels are missing.

---

### Task 2: Implement Smart Table Inline Controls

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Modify: `frontend/src/i18n/messages.ts`

- [ ] **Step 1: Add labels and prop types**

Add message functions under `itinerary.row`:

```ts
inlineActivity: ({ activity }: { activity: string }) => `Edit activity ${activity}`,
inlinePlace: ({ activity }: { activity: string }) => `Edit place ${activity}`,
inlineTime: ({ activity }: { activity: string }) => `Edit time ${activity}`,
inlineType: ({ activity }: { activity: string }) => `Edit type ${activity}`,
inlineTransportation: ({ activity }: { activity: string }) => `Edit transportation ${activity}`,
```

Thai equivalents:

```ts
inlineActivity: ({ activity }: { activity: string }) => `แก้ไขกิจกรรม ${activity}`,
inlinePlace: ({ activity }: { activity: string }) => `แก้ไขสถานที่ ${activity}`,
inlineTime: ({ activity }: { activity: string }) => `แก้ไขเวลา ${activity}`,
inlineType: ({ activity }: { activity: string }) => `แก้ไขประเภท ${activity}`,
inlineTransportation: ({ activity }: { activity: string }) => `แก้ไขการเดินทาง ${activity}`,
```

Add:

```ts
type InlineItineraryItemPatch = Partial<Pick<ItineraryItem, "startTime" | "activity" | "place" | "activityType" | "transportation">>;
```

and prop:

```ts
onUpdateItemInline?: (itemId: string, patch: InlineItineraryItemPatch) => void | Promise<void>;
```

- [ ] **Step 2: Render flat controls and commit on blur/Enter**

Replace visible text cells with compact inputs/selects. Inputs call `onUpdateItemInline` only when `canEdit` is true and the trimmed value differs. `Escape` restores the local draft value to the current item value.

- [ ] **Step 3: Run tests and verify GREEN**

Run: `cd frontend && bun run test src/components/SmartItineraryTable.test.tsx`

Expected: inline edit tests pass or reveal label/state issues to fix.

---

### Task 3: Add Delete Confirmation Tests And Modal

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.test.tsx`
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Modify: `frontend/src/i18n/messages.ts`

- [ ] **Step 1: Write failing delete confirmation test**

Update the row action test so delete does not call immediately, then add:

```ts
it("requires Yes before deleting a row and cancels with No", async () => {
  const user = userEvent.setup();
  const onDeleteItem = vi.fn();
  renderTable({ onDeleteItem });
  const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

  await user.click(within(row).getByRole("button", { name: /ลบ Dim Dim Sum/i }));
  const dialog = screen.getByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i });
  expect(onDeleteItem).not.toHaveBeenCalled();

  await user.click(within(dialog).getByRole("button", { name: /ไม่ลบ/i }));
  expect(screen.queryByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i })).not.toBeInTheDocument();

  await user.click(within(row).getByRole("button", { name: /ลบ Dim Dim Sum/i }));
  await user.click(within(screen.getByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i })).getByRole("button", { name: /ลบกิจกรรม/i }));

  expect(onDeleteItem).toHaveBeenCalledWith("item-dimdim");
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd frontend && bun run test src/components/SmartItineraryTable.test.tsx`

Expected: FAIL because delete still calls immediately and no dialog exists.

- [ ] **Step 3: Implement confirmation modal**

Add messages:

```ts
confirmDeleteTitle: ({ activity }: { activity: string }) => `Confirm delete ${activity}`,
confirmDeleteBody: ({ activity }: { activity: string }) => `Delete "${activity}" from the itinerary?`,
confirmDeleteYes: "Delete activity",
confirmDeleteNo: "No, keep it",
```

Thai:

```ts
confirmDeleteTitle: ({ activity }: { activity: string }) => `ยืนยันการลบ ${activity}`,
confirmDeleteBody: ({ activity }: { activity: string }) => `ลบ "${activity}" ออกจากแผนการเดินทางไหม`,
confirmDeleteYes: "ลบกิจกรรม",
confirmDeleteNo: "ไม่ลบ",
```

Store pending delete item in `SmartItineraryTable`, render a compact dialog, call `onDeleteItem(id)` only on Yes, close on No.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `cd frontend && bun run test src/components/SmartItineraryTable.test.tsx`

Expected: row action and delete confirmation tests pass.

---

### Task 4: Wire Parent Inline Mutation

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`

- [ ] **Step 1: Add inline update handler**

Add `updateItineraryItemInline(itemId, patch)` near `updateSelectedStop`. It:

- returns if `!canEdit`;
- finds the current item;
- trims `activity`, `place`, and `transportation`;
- rejects empty `activity` or `place`;
- in API mode calls `patchItineraryItem` with `expectedVersion: item.version`;
- in local mode commits updated item with `updatedAt` and `version + 1`;
- preserves all path fields and does not apply manual path changes.

- [ ] **Step 2: Pass callback to table**

Add `onUpdateItemInline={updateItineraryItemInline}` to `SmartItineraryTable`.

- [ ] **Step 3: Remove browser confirm from delete**

Delete the `window.confirm` guard from `deleteStop`. The table modal now owns row delete confirmation, and full `StopDialog` delete can remain a direct destructive action from the modal.

- [ ] **Step 4: Run app-level relevant tests**

Run: `cd frontend && bun run test src/components/SmartItineraryTable.test.tsx src/components/SagittariusApp.test.tsx`

Expected: PASS or focused failures for the new callback wiring.

---

### Task 5: Browser QA

**Files:**
- No code files unless QA exposes issues.

- [ ] **Step 1: Start dev server**

Run: `cd frontend && bun run dev`

Expected: local app serves at `http://127.0.0.1:5180`.

- [ ] **Step 2: Verify desktop itinerary table flow**

Use Playwright/browser:

- open the itinerary page/app;
- edit activity/place/time/type/transportation inline;
- open full edit modal from edit button;
- open delete modal, choose No, then Yes on another row if safe in local seed;
- check console/page errors.

- [ ] **Step 3: Verify mobile overflow**

Use a mobile viewport and confirm horizontal table scroll still exposes row controls and inline fields without blocking toolbar/context rail controls.

---

## Self-Review

- Spec coverage: inline fields, full edit fallback, delete confirmation, local/API mutation rules, path preservation, accessibility labels, unit tests, and browser QA are covered.
- Placeholder scan: no `TBD`, `TODO`, or vague "handle edge cases" steps remain.
- Type consistency: `InlineItineraryItemPatch` matches the approved spec and only includes visible row fields.
