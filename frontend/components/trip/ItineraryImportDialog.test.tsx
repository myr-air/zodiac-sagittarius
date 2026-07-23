/**
 * @vitest-environment happy-dom
 *
 * ItineraryImportDialog — paste → normalize → preview (M81HY2YR T4).
 * Landmarks from places-bulk-ingest-draft-v1.html #dlg-import:
 *   role="dialog" → "Import itinerary"
 *   textarea aria-label="Import content"
 *   Preview control → normalizeItineraryImport (mode auto|json)
 *   .preview-list / .preview-row from returned document items
 *   .error-box calm copy on unsupported/unavailable AI or invalid content
 * Confirm append → applyItineraryImport (T5); failures in .error-box; success closes.
 * M81LW2UJ T1: Escape closes (AccountSettings* keydown pattern) + focus restore;
 *   backdrop onClick still closes; open affordance/backdrop must not block Share/Map/nav.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import {
  useState,
  type ComponentProps,
  type ReactElement,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("../../src/trip/itinerary-import-api", () => ({
  normalizeItineraryImport: vi.fn(),
}));

vi.mock("../../src/trip/itinerary-import-apply", () => ({
  applyItineraryImport: vi.fn(),
}));

import { normalizeItineraryImport } from "../../src/trip/itinerary-import-api";
import { applyItineraryImport } from "../../src/trip/itinerary-import-apply";
import { ItineraryImportDialog } from "./ItineraryImportDialog";
import type { ItineraryImportDocument } from "../../src/trip/itinerary-import-api";

const TRIP_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const PLAN_VARIANT_ID = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
/** Visible plan context — draft subtitle “appends to Main”. */
const PLAN_LABEL = "Main";
const SESSION_TOKEN = "member-session-token-itinerary-import-dialog";
const API_BASE = "http://127.0.0.1:5181";

const DIALOG_TITLE = "Import itinerary";
const CONTENT_LABEL = /^Import content$/i;
const PREVIEW_ACTION = /^Preview$/i;

/** Independent paste payload (not recomputed from the mock document). */
const PASTE_CONTENT = JSON.stringify({
  schema: "joii.itinerary.export",
  version: 1,
  items: [{ activity: "Ignored until normalize returns" }],
});

/**
 * Free-text paste that would need AI normalize — used for unavailable/unsupported
 * AI failure (draft #import-error calm copy).
 */
const FREE_TEXT_PASTE =
  "Morning at the shrine, then lunch on Takeshita Street around noon.";

/** Draft #import-error calm copy — independent expected surface literal. */
const CALM_IMPORT_ERROR =
  "Could not read that import. Check the JSON, or try again later if text import is unavailable.";

/** Independent preview literals — must come from normalize return, not paste. */
const PREVIEW_ACTIVITY_A = "Meiji Shrine";
const PREVIEW_PLACE_A = "Harajuku";
const PREVIEW_START_A = "10:00";
const PREVIEW_ACTIVITY_B = "Takeshita lunch";
const PREVIEW_PLACE_B = "Takeshita Street";
const PREVIEW_START_B = "12:00";

/** Path-field noise that must not invent M3 path product UI in the dialog. */
const PATH_PRODUCT_UI = /alternate path|path graph|paths workspace|path switcher/i;

const NORMALIZED_DOCUMENT: ItineraryImportDocument = {
  schema: "joii.itinerary.export",
  version: 1,
  source: "json",
  exportedAt: "2026-04-09T12:00:00.000Z",
  trip: {
    id: TRIP_ID,
    name: "Tokyo spring",
    destinationLabel: "Tokyo",
    startDate: "2026-04-09",
    endDate: "2026-04-12",
    activePlanVariantId: PLAN_VARIANT_ID,
    mainTripPlanId: PLAN_VARIANT_ID,
  },
  items: [
    {
      id: "import-meiji",
      day: "2026-04-10",
      sortOrder: 100,
      startTime: PREVIEW_START_A,
      activity: PREVIEW_ACTIVITY_A,
      activityType: "attraction",
      place: PREVIEW_PLACE_A,
      mapLink: "",
      transportation: "",
      note: "",
    },
    {
      id: "import-takeshita",
      day: "2026-04-10",
      sortOrder: 200,
      startTime: PREVIEW_START_B,
      activity: PREVIEW_ACTIVITY_B,
      activityType: "food",
      place: PREVIEW_PLACE_B,
      mapLink: "",
      transportation: "",
      note: "",
    },
  ],
  records: {},
};

const normalizeMock = vi.mocked(normalizeItineraryImport);
const applyMock = vi.mocked(applyItineraryImport);

const CONFIRM_ACTION = /Confirm append/i;

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  normalizeMock.mockReset();
  normalizeMock.mockResolvedValue({ ok: true, document: NORMALIZED_DOCUMENT });
  applyMock.mockReset();
  applyMock.mockResolvedValue({
    ok: true,
    idMap: {
      "import-meiji": "018f4e90-aaaa-7c00-b111-000000000001",
      "import-takeshita": "018f4e90-bbbb-7c00-b111-000000000002",
    },
  });
});

/**
 * T4 #1 (dialog half): paste + Preview calls normalizeItineraryImport with
 * preferred mode auto|json and renders .preview-row items for the visible plan.
 */
describe("ItineraryImportDialog paste → normalize → preview", () => {
  it("paste + Preview calls normalizeItineraryImport (mode auto|json) and renders preview rows from returned document items for the visible plan context", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ItineraryImportDialog
        open
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        planVariantId={PLAN_VARIANT_ID}
        planLabel={PLAN_LABEL}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: DIALOG_TITLE });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Draft subtitle: paste copy · appends to currently visible plan.
    expect(dialog.textContent ?? "").toMatch(
      new RegExp(`appends to ${PLAN_LABEL}`, "i"),
    );

    const textarea = within(dialog).getByLabelText(CONTENT_LABEL);
    await user.click(textarea);
    await user.clear(textarea);
    // Prefer paste for JSON braces (user.type treats `{`/`[` as special).
    await user.paste(PASTE_CONTENT);
    expect(textarea).toHaveValue(PASTE_CONTENT);

    expect(normalizeMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: PREVIEW_ACTION }));

    await waitFor(() => {
      expect(normalizeMock).toHaveBeenCalledTimes(1);
    });

    const [input] = normalizeMock.mock.calls[0]!;
    expect(input).toEqual(
      expect.objectContaining({
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        content: PASTE_CONTENT,
      }),
    );
    // Prefer auto/json (not ai) for the paste → normalize happy path.
    expect(input.mode === "auto" || input.mode === "json").toBe(true);

    const previewList = dialog.querySelector(".preview-list");
    expect(previewList).toBeTruthy();
    const rows = [...previewList!.querySelectorAll(".preview-row")];
    expect(rows.length).toBe(NORMALIZED_DOCUMENT.items.length);

    // Preview must render returned document items — not the ignored paste stub.
    expect(previewList!.textContent).toContain(PREVIEW_ACTIVITY_A);
    expect(previewList!.textContent).toContain(PREVIEW_ACTIVITY_B);
    expect(previewList!.textContent).toContain(PREVIEW_PLACE_A);
    expect(previewList!.textContent).not.toContain(
      "Ignored until normalize returns",
    );

    // Confirm append is present for later T5; this acceptance stops at preview.
    expect(
      within(dialog).getByRole("button", { name: /Confirm append/i }),
    ).toBeInTheDocument();
  });
});

/**
 * T4 #2: unsupported/unavailable AI or invalid content → calm .error-box
 * (no fake preview success); trip-plan subtitle without path product UI.
 */
describe("ItineraryImportDialog honest normalize failures", () => {
  it("unsupported/unavailable AI or invalid content surfaces calm error-box copy (no fake preview); trip-plan context without path product UI", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    normalizeMock.mockResolvedValue({
      ok: false,
      error: CALM_IMPORT_ERROR,
    });

    render(
      <ItineraryImportDialog
        open
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        planVariantId={PLAN_VARIANT_ID}
        planLabel={PLAN_LABEL}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: DIALOG_TITLE });

    // Trip-plan display distinction: subtitle names the visible plan (not a path).
    expect(dialog.textContent ?? "").toMatch(
      new RegExp(`appends to ${PLAN_LABEL}`, "i"),
    );
    expect(dialog.textContent ?? "").not.toMatch(PATH_PRODUCT_UI);
    expect(dialog.querySelector(".path-switcher, .path-graph, [data-path-ui]")).toBeNull();

    const textarea = within(dialog).getByLabelText(CONTENT_LABEL);
    await user.click(textarea);
    await user.clear(textarea);
    await user.paste(FREE_TEXT_PASTE);

    await user.click(within(dialog).getByRole("button", { name: PREVIEW_ACTION }));

    await waitFor(() => {
      expect(normalizeMock).toHaveBeenCalledTimes(1);
    });

    const [input] = normalizeMock.mock.calls[0]!;
    expect(input.content).toBe(FREE_TEXT_PASTE);
    // Prefer auto/json; AI unavailable must fail honestly when normalize returns ok:false.
    expect(input.mode === "auto" || input.mode === "json").toBe(true);

    const errorBox = dialog.querySelector(".error-box");
    expect(errorBox).toBeTruthy();
    expect(errorBox!.textContent ?? "").toContain(CALM_IMPORT_ERROR);

    // No fake preview success from prior happy-path fixtures or paste stubs.
    expect(dialog.querySelectorAll(".preview-row")).toHaveLength(0);
    expect(dialog.textContent ?? "").not.toContain(PREVIEW_ACTIVITY_A);
    expect(dialog.textContent ?? "").not.toContain(PREVIEW_ACTIVITY_B);
    expect(dialog.textContent ?? "").not.toMatch(PATH_PRODUCT_UI);
  });
});

/**
 * T5 #2 (dialog half): Confirm calls applyItineraryImport; partial failures
 * surface in .error-box; full success closes and invokes onImported.
 */
describe("ItineraryImportDialog Confirm apply", () => {
  async function previewReady(user: ReturnType<typeof userEvent.setup>) {
    const dialog = screen.getByRole("dialog", { name: DIALOG_TITLE });
    const textarea = within(dialog).getByLabelText(CONTENT_LABEL);
    await user.click(textarea);
    await user.clear(textarea);
    await user.paste(PASTE_CONTENT);
    await user.click(within(dialog).getByRole("button", { name: PREVIEW_ACTION }));
    await waitFor(() => {
      expect(normalizeMock).toHaveBeenCalledTimes(1);
    });
    return dialog;
  }

  it("Confirm calls applyItineraryImport; failures surface in error-box; success closes + onImported", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onImported = vi.fn();

    applyMock.mockResolvedValueOnce({
      ok: false,
      idMap: { "import-meiji": "018f4e90-aaaa-7c00-b111-000000000001" },
      failures: [
        {
          importId: "import-takeshita",
          phase: "create",
          error: "create rejected: activity required",
        },
      ],
    });

    const { rerender } = render(
      <ItineraryImportDialog
        open
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        planVariantId={PLAN_VARIANT_ID}
        planLabel={PLAN_LABEL}
        onClose={onClose}
        onImported={onImported}
      />,
    );

    const dialog = await previewReady(user);
    await user.click(within(dialog).getByRole("button", { name: CONFIRM_ACTION }));

    await waitFor(() => {
      expect(applyMock).toHaveBeenCalledTimes(1);
    });
    expect(applyMock.mock.calls[0]![0]).toMatchObject({
      tripId: TRIP_ID,
      sessionToken: SESSION_TOKEN,
      planVariantId: PLAN_VARIANT_ID,
      items: NORMALIZED_DOCUMENT.items,
    });

    const errorBox = dialog.querySelector(".error-box");
    expect(errorBox).toBeTruthy();
    expect(errorBox!.textContent ?? "").toMatch(/import-takeshita/);
    expect(errorBox!.textContent ?? "").toMatch(/create rejected/);
    expect(onClose).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();

    applyMock.mockResolvedValueOnce({
      ok: true,
      idMap: {
        "import-meiji": "018f4e90-aaaa-7c00-b111-000000000001",
        "import-takeshita": "018f4e90-bbbb-7c00-b111-000000000002",
      },
    });

    // Keep open after failure path; Confirm again for success.
    await user.click(within(dialog).getByRole("button", { name: CONFIRM_ACTION }));
    await waitFor(() => {
      expect(applyMock).toHaveBeenCalledTimes(2);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onImported).toHaveBeenCalledTimes(1);

    // Rerender closed to mirror shell onClose → open=false.
    rerender(
      <ItineraryImportDialog
        open={false}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        planVariantId={PLAN_VARIANT_ID}
        planLabel={PLAN_LABEL}
        onClose={onClose}
        onImported={onImported}
      />,
    );
    expect(screen.queryByRole("dialog", { name: DIALOG_TITLE })).toBeNull();
  });
});

const IMPORT_TRIGGER = /^Import$/i;
const SHARE_ACTION = /^Share$/i;
const MAP_ACTION = /^Map$/i;
const MEMBERS_ACTION = /^Members$/i;

function dialogProps(
  overrides: Partial<ComponentProps<typeof ItineraryImportDialog>> &
    Pick<ComponentProps<typeof ItineraryImportDialog>, "onClose" | "open">,
) {
  return {
    tripId: TRIP_ID,
    sessionToken: SESSION_TOKEN,
    apiBaseUrl: API_BASE,
    planVariantId: PLAN_VARIANT_ID,
    planLabel: PLAN_LABEL,
    ...overrides,
  };
}

/**
 * M81LW2UJ T1 — Escape closes Import (mirror AccountSettings* document keydown);
 * open affordance/backdrop must leave Share/Map/nav unblocked; focus restores to
 * Import trigger (or trap releases); backdrop onClick still closes.
 */
describe("ItineraryImportDialog Escape close", () => {
  it("when open, Escape calls onClose and removing open affordance clears backdrop so Share/Map/nav are unblocked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    function Harness({ open }: { open: boolean }): ReactElement {
      return (
        <div>
          <button type="button">Share</button>
          <button type="button">Map</button>
          <nav aria-label="Trip nav">
            <button type="button">Members</button>
          </nav>
          <ItineraryImportDialog {...dialogProps({ open, onClose })} />
        </div>
      );
    }

    const { rerender } = render(<Harness open />);

    expect(
      screen.getByRole("dialog", { name: DIALOG_TITLE }),
    ).toBeInTheDocument();
    expect(document.querySelector("#dlg-import.stop-dlg.open")).toBeTruthy();
    expect(document.querySelector(".stop-dlg-backdrop")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    // Shell mirrors onClose → open=false (removes dialog + backdrop affordance).
    rerender(<Harness open={false} />);

    expect(screen.queryByRole("dialog", { name: DIALOG_TITLE })).toBeNull();
    expect(document.querySelector("#dlg-import")).toBeNull();
    expect(document.querySelector(".stop-dlg-backdrop")).toBeNull();

    // Cockpit chrome is interactable again — no leftover blocking backdrop.
    await user.click(screen.getByRole("button", { name: SHARE_ACTION }));
    await user.click(screen.getByRole("button", { name: MAP_ACTION }));
    await user.click(screen.getByRole("button", { name: MEMBERS_ACTION }));
  });

  it("Escape restores focus to Import trigger; backdrop onClick still closes", async () => {
    const user = userEvent.setup();

    function Harness(): ReactElement {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Import
          </button>
          <ItineraryImportDialog
            {...dialogProps({
              open,
              onClose: () => setOpen(false),
            })}
          />
        </div>
      );
    }

    render(<Harness />);

    const importBtn = screen.getByRole("button", { name: IMPORT_TRIGGER });

    // Backdrop onClick still closes (existing path — must not regress).
    await user.click(importBtn);
    await screen.findByRole("dialog", { name: DIALOG_TITLE });
    const backdrop = document.querySelector(".stop-dlg-backdrop");
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as Element);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: DIALOG_TITLE })).toBeNull();
    });

    // Escape closes and restores focus to the Import cockpit control.
    importBtn.focus();
    expect(importBtn).toHaveFocus();
    await user.click(importBtn);
    await screen.findByRole("dialog", { name: DIALOG_TITLE });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: DIALOG_TITLE })).toBeNull();
    });
    expect(importBtn).toHaveFocus();
  });
});
