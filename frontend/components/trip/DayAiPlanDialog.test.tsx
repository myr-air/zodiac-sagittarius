/**
 * @vitest-environment happy-dom
 *
 * DayAiPlanDialog — full Why + affects + Accept/Reject (M80VKAX5 T10 #2).
 * Landmarks from day-workspace-theme-a-draft-v9.html #plan-dialog:
 *   role="dialog" → Why / Affects / Accept / Reject
 * Accept/Reject call day-plan-assist client (…/accept|reject); Accept one
 * dismisses sibling batch options; open alone must not mutate itinerary.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { DayAiPlanDialog } from "./DayAiPlanDialog";
import { DayAiSuggestionChip } from "./DayAiSuggestionChip";
import type { DayPlanAssistOption } from "../../src/trip/day-plan-assist-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const BATCH_ID = "018f4e90-0000-7000-8000-0000000000aa";
const SESSION_TOKEN = "member-session-token-day-ai-plan-dialog";

const OPTION_A_ID = "018f4e90-0000-7000-8000-0000000000a1";
const OPTION_B_ID = "018f4e90-0000-7000-8000-0000000000a2";
const OPTION_C_ID = "018f4e90-0000-7000-8000-0000000000a3";

const STOP_A = "Wat Chedi Luang";
const STOP_B = "Doi Suthep overlook";

/** Independent draft Plan A literals. */
const DIALOG_TITLE = "Plan A · Culture morning";
const DIALOG_SUB = "Recommended · Day 2";
const WHY_TEXT =
  "Temple opens early; songthaew is usual for this leg; 45m buffer matches afternoon traffic toward Doi Suthep from Nimman on Saturdays.";
const AFFECTS_TEXT = `Affects: ${STOP_A} · ${STOP_B}`;
const SUMMARY_CHANGE =
  "Keep Wat Chedi Luang → lunch Nimman → Doi Suthep. Add 45m buffer before transfer. Fill Travel by songthaew.";

const OPTION_A: DayPlanAssistOption = {
  id: OPTION_A_ID,
  label: "A",
  title: "Culture morning",
  summary: SUMMARY_CHANGE,
  why: WHY_TEXT,
  affectsItemIds: ["item-wat-chedi", "item-doi-suthep"],
  proposedMutations: [{ op: "patch", itemId: "item-wat-chedi" }],
};

const OPTION_B: DayPlanAssistOption = {
  id: OPTION_B_ID,
  label: "B",
  title: "Food-first",
  summary: "Swap lunch earlier",
  why: "Group food preference noted on trip",
  affectsItemIds: ["item-khao-soi"],
  proposedMutations: [],
};

const OPTION_C: DayPlanAssistOption = {
  id: OPTION_C_ID,
  label: "C",
  title: "Easy transfer",
  summary: "Taxi route fill",
  why: "Three geo pins present so a path is valid",
  affectsItemIds: ["item-transfer"],
  proposedMutations: [],
};

const BATCH_OPTIONS = [OPTION_A, OPTION_B, OPTION_C];

type FetchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function assistResolutionCalls(
  fetchMock: ReturnType<typeof vi.fn>,
  action: "accept" | "reject",
): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "POST" || !url.includes(`/day-plan-assist/`)) return null;
      if (!url.endsWith(`/${action}`)) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: init ?? {}, body };
    })
    .filter((call): call is FetchCall => call !== null);
}

function itineraryWriteCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; method: string }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      if (!url.includes("/itinerary-items")) return null;
      return {
        url,
        method: String(init?.method ?? "GET").toUpperCase(),
      };
    })
    .filter(
      (call): call is { url: string; method: string } => call !== null,
    );
}

afterEach(() => {
  cleanup();
});

/**
 * Controlled harness: chips for open batch options + one plan dialog.
 * Accept must dismiss sibling chips for the same batch (T10 #2).
 */
function BatchChipDialogHarness({
  fetchImpl,
}: {
  fetchImpl: typeof fetch;
}) {
  const [options, setOptions] = useState(BATCH_OPTIONS);
  const [openOptionId, setOpenOptionId] = useState<string | null>(OPTION_A_ID);
  const openOption = options.find((o) => o.id === openOptionId) ?? null;

  return (
    <div>
      <div aria-label="Open batch chips">
        {options.map((option) => (
          <DayAiSuggestionChip
            key={option.id}
            option={{
              id: option.id,
              label: option.label,
              title: option.title,
              summary: option.summary,
            }}
            onOpen={() => setOpenOptionId(option.id)}
          />
        ))}
      </div>
      {openOption ? (
        <DayAiPlanDialog
          open
          tripId={TRIP_ID}
          batchId={BATCH_ID}
          sessionToken={SESSION_TOKEN}
          apiBaseUrl={API_BASE}
          fetch={fetchImpl}
          option={openOption}
          batchOptions={options}
          affectLabels={[STOP_A, STOP_B]}
          subtitle={DIALOG_SUB}
          onClose={() => setOpenOptionId(null)}
          onBatchResolved={({ openOptionIds }) => {
            setOptions((prev) =>
              prev.filter((o) => openOptionIds.includes(o.id)),
            );
            setOpenOptionId(null);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * T10 #2: Accept/Reject call assist client; Accept dismisses sibling batch
 * options; opening the dialog alone does not silently mutate itinerary.
 */
describe("DayAiPlanDialog Accept / Reject via assist client", () => {
  it("shows Why + Affects + Accept/Reject; Accept/Reject POST day-plan-assist; Accept dismisses sibling batch chips; open alone does not mutate", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "POST" &&
        url.endsWith(
          `/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_A_ID}/accept`,
        )
      ) {
        return jsonResponse({
          batchId: BATCH_ID,
          tripId: TRIP_ID,
          optionId: OPTION_A_ID,
          status: "accepted",
          options: [
            { id: OPTION_A_ID, status: "accepted" },
            { id: OPTION_B_ID, status: "rejected" },
            { id: OPTION_C_ID, status: "rejected" },
          ],
          appliedMutations: [{ op: "patch", itemId: "item-wat-chedi" }],
        });
      }
      if (
        method === "POST" &&
        url.endsWith(
          `/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_B_ID}/reject`,
        )
      ) {
        return jsonResponse({
          batchId: BATCH_ID,
          tripId: TRIP_ID,
          optionId: OPTION_B_ID,
          status: "rejected",
          options: [
            { id: OPTION_A_ID, status: "open" },
            { id: OPTION_B_ID, status: "rejected" },
            { id: OPTION_C_ID, status: "open" },
          ],
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    // --- Open alone: full Why / affects / actions; no silent mutation ---
    const { unmount: unmountOpen } = render(
      <DayAiPlanDialog
        open
        tripId={TRIP_ID}
        batchId={BATCH_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        option={OPTION_A}
        batchOptions={BATCH_OPTIONS}
        affectLabels={[STOP_A, STOP_B]}
        subtitle={DIALOG_SUB}
        onClose={vi.fn()}
        onBatchResolved={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole("dialog", {
      name: new RegExp(DIALOG_TITLE, "i"),
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText(/^Why$/i)).toBeInTheDocument();
    expect(within(dialog).getByText(WHY_TEXT)).toBeInTheDocument();
    expect(within(dialog).getByText(AFFECTS_TEXT)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Accept$/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Reject$/i }),
    ).toBeInTheDocument();

    // No silent mutation while dialog is merely open.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(itineraryWriteCalls(fetchMock)).toHaveLength(0);

    unmountOpen();
    fetchMock.mockClear();

    // --- Reject calls assist reject; no parallel itinerary write ---
    const { unmount: unmountReject } = render(
      <DayAiPlanDialog
        open
        tripId={TRIP_ID}
        batchId={BATCH_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        option={OPTION_B}
        batchOptions={BATCH_OPTIONS}
        affectLabels={[STOP_A, STOP_B]}
        subtitle="Alternative · Day 2"
        onClose={vi.fn()}
        onBatchResolved={vi.fn()}
      />,
    );

    const rejectDialog = await screen.findByRole("dialog", {
      name: /Plan B/i,
    });
    await user.click(
      within(rejectDialog).getByRole("button", { name: /^Reject$/i }),
    );
    await waitFor(() => {
      expect(assistResolutionCalls(fetchMock, "reject")).toHaveLength(1);
    });
    const rejectCall = assistResolutionCalls(fetchMock, "reject")[0]!;
    expect(rejectCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_B_ID}/reject`,
    );
    expect((rejectCall.init.method ?? "").toUpperCase()).toBe("POST");
    expect(new Headers(rejectCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof rejectCall.body.clientMutationId).toBe("string");
    expect(String(rejectCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(itineraryWriteCalls(fetchMock)).toHaveLength(0);

    unmountReject();
    fetchMock.mockClear();

    // --- Accept calls assist accept and dismisses sibling batch chips ---
    render(<BatchChipDialogHarness fetchImpl={fetchMock} />);

    const chipRegion = screen.getByLabelText(/Open batch chips/i);
    expect(
      within(chipRegion).getByRole("button", { name: /Plan A/i }),
    ).toBeInTheDocument();
    expect(
      within(chipRegion).getByRole("button", { name: /Plan B/i }),
    ).toBeInTheDocument();
    expect(
      within(chipRegion).getByRole("button", { name: /Plan C/i }),
    ).toBeInTheDocument();

    const acceptDialog = await screen.findByRole("dialog", {
      name: /Plan A/i,
    });
    await user.click(
      within(acceptDialog).getByRole("button", { name: /^Accept$/i }),
    );

    await waitFor(() => {
      expect(assistResolutionCalls(fetchMock, "accept")).toHaveLength(1);
    });
    const acceptCall = assistResolutionCalls(fetchMock, "accept")[0]!;
    expect(acceptCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_A_ID}/accept`,
    );
    expect((acceptCall.init.method ?? "").toUpperCase()).toBe("POST");
    expect(new Headers(acceptCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof acceptCall.body.clientMutationId).toBe("string");
    expect(String(acceptCall.body.clientMutationId).length).toBeGreaterThan(0);
    // FE must not invent a parallel itinerary write path on Accept.
    expect(itineraryWriteCalls(fetchMock)).toHaveLength(0);

    await waitFor(() => {
      expect(
        within(chipRegion).queryByRole("button", { name: /Plan A/i }),
      ).not.toBeInTheDocument();
      expect(
        within(chipRegion).queryByRole("button", { name: /Plan B/i }),
      ).not.toBeInTheDocument();
      expect(
        within(chipRegion).queryByRole("button", { name: /Plan C/i }),
      ).not.toBeInTheDocument();
    });
  });
});
