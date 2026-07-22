/**
 * Portal CreateTripForm — shared NL seed → classify → editable review.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ClassifiedTripSeed } from "@/src/create-trip/classify-seed";
import { CreateTripForm, type CreateTripFormProps } from "./CreateTripForm";

afterEach(() => {
  cleanup();
});

/** Independent literals from draft / classify examples — not recomputed. */
const SEED_TEXT =
  "Thailand primary, maybe Japan optional, December into January";
const CLASSIFIED_NAME = "Thailand Escape";
const PRIMARY_PLACE = "Thailand";
const OPTIONAL_PLACE = "Japan";
/** Name-only compose fills destination with TBD (seed.ts contract). */
const TBD_LABEL = "TBD";
/** Mission clock year — Dec→Jan spans next calendar year. */
const YEAR = 2026;
const CROSS_YEAR_END = 2027;
const EXACT_LATER = "2026-10-18";
const EXACT_EARLIER = "2026-10-05";
/** Month window → ISO bounds (first of start month → last of end month). */
const MONTHS_START_DATE = "2026-12-01";
const MONTHS_END_DATE = "2027-01-31";

const ACCOUNT_SESSION_TOKEN = "account-session-token-portal-create";
const TRIP_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const OWNER_MEMBER_ID = "11111111-2222-4333-8444-555555555555";
const MEMBER_SESSION_TOKEN = "member-session-token-after-create";
const CREATED_AT = "2026-07-20T00:00:00Z";
const EXPIRES_AT = "2026-07-27T00:00:00Z";
/** Independent literals from join-credentials draft / JoinCredentialsPanel tests. */
const JOIN_ID = "2607-OSAK-0002";
const JOIN_PASSWORD = "6cS3gEFQbFviYAAWmw0uths4";
const CONTINUE_LABEL = "Continue to trip";
const SKIP_LABEL = "Skip for now";

const CREATE_SUCCESS = {
  ok: true as const,
  trip: { id: TRIP_ID, joinId: JOIN_ID },
  joinPassword: JOIN_PASSWORD,
  ownerMemberId: OWNER_MEMBER_ID,
  memberSession: {
    tripId: TRIP_ID,
    memberId: OWNER_MEMBER_ID,
    sessionToken: MEMBER_SESSION_TOKEN,
    createdAt: CREATED_AT,
    expiresAt: EXPIRES_AT,
  },
};

type CreateAccountTripFn = NonNullable<CreateTripFormProps["createAccountTrip"]>;
type SaveMemberSessionFn = NonNullable<CreateTripFormProps["saveMemberSession"]>;
type NavigateFn = NonNullable<CreateTripFormProps["navigate"]>;

type SubmitSeamProps = {
  sessionToken: string;
  createAccountTrip: Mock<CreateAccountTripFn>;
  saveMemberSession: Mock<SaveMemberSessionFn>;
  navigate: Mock<NavigateFn>;
};

function createSubmitMocks(): SubmitSeamProps {
  return {
    sessionToken: ACCOUNT_SESSION_TOKEN,
    createAccountTrip: vi.fn<CreateAccountTripFn>(async () => CREATE_SUCCESS),
    saveMemberSession: vi.fn<SaveMemberSessionFn>(),
    navigate: vi.fn<NavigateFn>(),
  };
}

function formProps(
  classifyTripSeed: (text: string) => ClassifiedTripSeed,
  submit?: SubmitSeamProps,
): ComponentProps<typeof CreateTripForm> {
  return {
    classifyTripSeed,
    ...submit,
  };
}

function seedArgFromCreateCall(
  createAccountTrip: Mock<CreateAccountTripFn>,
): Record<string, unknown> {
  const first = createAccountTrip.mock.calls[0]?.[0] as
    | { seed?: Record<string, unknown> }
    | undefined;
  expect(first?.seed).toBeTruthy();
  return first!.seed as Record<string, unknown>;
}

function savedMemberSessionFromCall(
  saveMemberSession: Mock<SaveMemberSessionFn>,
): Record<string, unknown> {
  expect(saveMemberSession).toHaveBeenCalled();
  const args = saveMemberSession.mock.calls[0]!;
  const session = args.find(
    (arg) =>
      arg &&
      typeof arg === "object" &&
      "sessionToken" in (arg as Record<string, unknown>),
  ) as Record<string, unknown> | undefined;
  expect(session).toBeTruthy();
  return session!;
}

const CLASSIFIED: ClassifiedTripSeed = {
  name: CLASSIFIED_NAME,
  destinations: [
    { label: PRIMARY_PLACE, role: "primary" },
    { label: OPTIONAL_PLACE, role: "optional" },
  ],
  when: {
    mode: "months",
    startY: YEAR,
    startM: 11,
    endY: CROSS_YEAR_END,
    endM: 0,
  },
};

const EMPTY_SEED: ClassifiedTripSeed = {
  name: "",
  destinations: [],
  when: { mode: "flexible" },
};

const NAME_ONLY_SEED: ClassifiedTripSeed = {
  name: CLASSIFIED_NAME,
  destinations: [],
  when: { mode: "flexible" },
};

const DEST_ONLY_SEED: ClassifiedTripSeed = {
  name: "",
  destinations: [{ label: PRIMARY_PLACE, role: "primary" }],
  when: { mode: "flexible" },
};

const EXACT_SEED: ClassifiedTripSeed = {
  name: CLASSIFIED_NAME,
  destinations: [{ label: PRIMARY_PLACE, role: "primary" }],
  when: {
    mode: "exact",
    start: EXACT_EARLIER,
    end: EXACT_LATER,
  },
};

async function classifyAndOpenReview(
  classified: ClassifiedTripSeed,
  seedText = SEED_TEXT,
  submit?: SubmitSeamProps,
) {
  const user = userEvent.setup();
  const classifyTripSeed = vi.fn(() => classified);
  const view = render(
    <CreateTripForm {...formProps(classifyTripSeed, submit)} />,
  );

  const seedField = screen.getByRole("textbox", {
    name: /what are you planning|describe the trip|trip seed/i,
  });
  await user.clear(seedField);
  await user.type(seedField, seedText);
  await user.click(
    screen.getByRole("button", {
      name: /understand with ai|classify/i,
    }),
  );
  return { user, unmount: view.unmount };
}

describe("CreateTripForm", () => {
  it("opens shared flow: NL seed → classify into editable name/destinations/when; Flexible | Months | Exact; no party size or origin", async () => {
    const classifyTripSeed = vi.fn(() => CLASSIFIED);
    const user = userEvent.setup();

    render(<CreateTripForm classifyTripSeed={classifyTripSeed} />);

    // Natural-language seed entry
    const seedField = screen.getByRole("textbox", {
      name: /what are you planning|describe the trip|trip seed/i,
    });
    await user.clear(seedField);
    await user.type(seedField, SEED_TEXT);

    await user.click(
      screen.getByRole("button", {
        name: /understand with ai|classify/i,
      }),
    );

    expect(classifyTripSeed).toHaveBeenCalledWith(SEED_TEXT);

    // Editable name from classify
    const nameField = screen.getByRole("textbox", {
      name: /trip name|name/i,
    });
    expect(nameField).toHaveValue(CLASSIFIED_NAME);
    await user.clear(nameField);
    await user.type(nameField, "Edited Name");
    expect(nameField).toHaveValue("Edited Name");

    // Destinations: editable place labels with primary / optional roles
    const destinations = screen.getByRole("list", {
      name: /destinations|places/i,
    });
    const primaryField = within(destinations).getByDisplayValue(PRIMARY_PLACE);
    const optionalField = within(destinations).getByDisplayValue(OPTIONAL_PLACE);
    expect(primaryField).toBeInTheDocument();
    expect(optionalField).toBeInTheDocument();
    expect(within(destinations).getByText(/primary/i)).toBeInTheDocument();
    expect(within(destinations).getByText(/optional/i)).toBeInTheDocument();
    await user.clear(primaryField);
    await user.type(primaryField, "Edited Place");
    expect(primaryField).toHaveValue("Edited Place");
    await user.click(
      within(destinations).getByRole("button", {
        name: /remove.*optional/i,
      }),
    );
    expect(
      within(destinations).queryByDisplayValue(OPTIONAL_PLACE),
    ).toBeNull();

    // When modes: Flexible | Months | Exact (start+end)
    const whenMode = screen.getByRole("group", { name: /when mode|when/i });
    expect(
      within(whenMode).getByRole("button", { name: /^Flexible$/i }),
    ).toBeInTheDocument();
    expect(
      within(whenMode).getByRole("button", { name: /^Months$/i }),
    ).toBeInTheDocument();
    const exactBtn = within(whenMode).getByRole("button", {
      name: /^Exact( dates)?$/i,
    });
    expect(exactBtn).toBeInTheDocument();

    await user.click(exactBtn);
    expect(screen.getByLabelText(/start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end/i)).toBeInTheDocument();

    // Out of create: party size and origin
    expect(screen.queryByLabelText(/party size|party|headcount/i)).toBeNull();
    expect(screen.queryByLabelText(/origin|home city|from city/i)).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: /party/i })).toBeNull();
  });

  it("maps Months Dec→Jan to a cross-year end", async () => {
    const { user } = await classifyAndOpenReview(CLASSIFIED);

    const whenMode = screen.getByRole("group", { name: /when mode|when/i });
    const monthsBtn = within(whenMode).getByRole("button", {
      name: /^Months$/i,
    });
    expect(monthsBtn).toHaveAttribute("aria-pressed", "true");

    // Classified Dec→Jan must surface end in the next calendar year (not same-year wrap).
    expect(
      screen.getByText(
        new RegExp(
          `December\\s+${YEAR}\\s*[→\\-–]\\s*January\\s+${CROSS_YEAR_END}`,
          "i",
        ),
      ),
    ).toBeInTheDocument();

    // Interactive pick: Dec then Jan also maps end to next year.
    await user.click(within(whenMode).getByRole("button", { name: /^Flexible$/i }));
    await user.click(monthsBtn);
    await user.click(screen.getByRole("button", { name: /^December$/i }));
    await user.click(screen.getByRole("button", { name: /^January$/i }));
    expect(
      screen.getByText(
        new RegExp(
          `December\\s+${YEAR}\\s*[→\\-–]\\s*January\\s+${CROSS_YEAR_END}`,
          "i",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("exact dates require start≤end (swap or error)", async () => {
    const { user } = await classifyAndOpenReview(EXACT_SEED);

    const whenMode = screen.getByRole("group", { name: /when mode|when/i });
    await user.click(
      within(whenMode).getByRole("button", { name: /^Exact( dates)?$/i }),
    );

    const start = screen.getByLabelText(/^start$/i);
    const end = screen.getByLabelText(/^end$/i);

    // Invert: end before start
    fireEvent.change(start, { target: { value: EXACT_LATER } });
    fireEvent.change(end, { target: { value: EXACT_EARLIER } });
    fireEvent.blur(end);

    const startValue = (start as HTMLInputElement).value;
    const endValue = (end as HTMLInputElement).value;
    const swapped =
      startValue === EXACT_EARLIER && endValue === EXACT_LATER;
    const ordered = Boolean(startValue && endValue && startValue <= endValue);
    const hasError = Boolean(
      screen.queryByRole("alert") ||
        screen.queryByText(/start.*(before|≤|<=|after)|end.*(before|invalid)|swap|order/i),
    );

    expect(swapped || ordered || hasError).toBe(true);
    // Must not leave inverted dates silently accepted.
    expect(startValue === EXACT_LATER && endValue === EXACT_EARLIER && !hasError).toBe(
      false,
    );
  });

  it("collapsing/hiding review widgets does not clear confirmed timing", async () => {
    const { user } = await classifyAndOpenReview(CLASSIFIED);

    // Months window confirmed in review
    expect(
      screen.getByText(
        new RegExp(
          `December\\s+${YEAR}\\s*[→\\-–]\\s*January\\s+${CROSS_YEAR_END}`,
          "i",
        ),
      ),
    ).toBeInTheDocument();

    const whenMode = screen.getByRole("group", { name: /when mode|when/i });
    // Hide months pane by switching mode, then restore — timing must remain.
    await user.click(within(whenMode).getByRole("button", { name: /^Flexible$/i }));
    expect(
      screen.queryByRole("button", { name: /^December$/i }),
    ).toBeNull();
    await user.click(within(whenMode).getByRole("button", { name: /^Months$/i }));
    expect(
      screen.getByText(
        new RegExp(
          `December\\s+${YEAR}\\s*[→\\-–]\\s*January\\s+${CROSS_YEAR_END}`,
          "i",
        ),
      ),
    ).toBeInTheDocument();

    // Exact calendar: hide by leaving Exact, values must survive return.
    await user.click(
      within(whenMode).getByRole("button", { name: /^Exact( dates)?$/i }),
    );
    const start = screen.getByLabelText(/^start$/i);
    const end = screen.getByLabelText(/^end$/i);
    fireEvent.change(start, { target: { value: EXACT_EARLIER } });
    fireEvent.change(end, { target: { value: EXACT_LATER } });

    await user.click(within(whenMode).getByRole("button", { name: /^Flexible$/i }));
    expect(screen.queryByLabelText(/^start$/i)).toBeNull();
    expect(screen.queryByLabelText(/^end$/i)).toBeNull();

    await user.click(
      within(whenMode).getByRole("button", { name: /^Exact( dates)?$/i }),
    );
    expect(screen.getByLabelText(/^start$/i)).toHaveValue(EXACT_EARLIER);
    expect(screen.getByLabelText(/^end$/i)).toHaveValue(EXACT_LATER);
  });

  it("create is disabled until name or ≥1 destination", async () => {
    const { user } = await classifyAndOpenReview(EMPTY_SEED);

    const createBtn = screen.getByRole("button", {
      name: /^Create( trip)?$/i,
    });
    expect(createBtn).toBeDisabled();

    // Name alone unlocks create
    const nameField = screen.getByRole("textbox", {
      name: /trip name|name/i,
    });
    await user.clear(nameField);
    await user.type(nameField, CLASSIFIED_NAME);
    expect(createBtn).toBeEnabled();

    await user.clear(nameField);
    expect(createBtn).toBeDisabled();
  });

  it("create is enabled with destination-only seed (no name)", async () => {
    await classifyAndOpenReview(DEST_ONLY_SEED);

    const createBtn = screen.getByRole("button", {
      name: /^Create( trip)?$/i,
    });
    expect(createBtn).toBeEnabled();

    const nameField = screen.getByRole("textbox", {
      name: /trip name|name/i,
    });
    expect(nameField).toHaveValue("");
  });

  it("create is enabled with name-only seed (no destinations)", async () => {
    await classifyAndOpenReview(NAME_ONLY_SEED);

    const createBtn = screen.getByRole("button", {
      name: /^Create( trip)?$/i,
    });
    expect(createBtn).toBeEnabled();

    const destinations = screen.getByRole("list", {
      name: /destinations|places/i,
    });
    expect(within(destinations).queryByRole("listitem")).toBeNull();
  });

  it("signed-in submit with only a name seed or only a destination seed creates via account API, then Continue stores member session and navigates to /trips/{id}", async () => {
    // --- Name-only seed ---
    const nameSubmit = createSubmitMocks();
    const { user: nameUser, unmount: unmountName } = await classifyAndOpenReview(
      NAME_ONLY_SEED,
      SEED_TEXT,
      nameSubmit,
    );

    await nameUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );

    await waitFor(() =>
      expect(nameSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    const nameInput = nameSubmit.createAccountTrip.mock.calls[0]![0] as {
      sessionToken: string;
      seed: Record<string, unknown>;
    };
    expect(nameInput.sessionToken).toBe(ACCOUNT_SESSION_TOKEN);
    expect(nameInput.seed).toMatchObject({
      name: CLASSIFIED_NAME,
      destinationLabel: TBD_LABEL,
    });
    expect(nameSubmit.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    // Session may already be saved at create (decisions); must be present by Continue.
    await nameUser.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    expect(savedMemberSessionFromCall(nameSubmit.saveMemberSession)).toEqual(
      expect.objectContaining({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: MEMBER_SESSION_TOKEN,
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
      }),
    );
    expect(nameSubmit.navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
    unmountName();

    // --- Destination-only seed ---
    const destSubmit = createSubmitMocks();
    const { user: destUser } = await classifyAndOpenReview(
      DEST_ONLY_SEED,
      SEED_TEXT,
      destSubmit,
    );

    await destUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );

    await waitFor(() =>
      expect(destSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    const destInput = destSubmit.createAccountTrip.mock.calls[0]![0] as {
      sessionToken: string;
      seed: Record<string, unknown>;
    };
    expect(destInput.sessionToken).toBe(ACCOUNT_SESSION_TOKEN);
    expect(destInput.seed).toMatchObject({
      name: PRIMARY_PLACE,
      destinationLabel: PRIMARY_PLACE,
    });
    expect(destSubmit.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    await destUser.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    expect(savedMemberSessionFromCall(destSubmit.saveMemberSession)).toEqual(
      expect.objectContaining({
        tripId: TRIP_ID,
        sessionToken: MEMBER_SESSION_TOKEN,
      }),
    );
    expect(destSubmit.navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
  });

  it("after successful account create, credentials panel is shown before navigate(/trips/{id})", async () => {
    const submit = createSubmitMocks();
    const { user } = await classifyAndOpenReview(
      NAME_ONLY_SEED,
      SEED_TEXT,
      submit,
    );

    await user.click(screen.getByRole("button", { name: /^Create( trip)?$/i }));

    await waitFor(() => expect(submit.createAccountTrip).toHaveBeenCalled());

    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    expect(screen.getByText(JOIN_PASSWORD)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONTINUE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SKIP_LABEL })).toBeInTheDocument();
    expect(submit.navigate).not.toHaveBeenCalled();
  });

  it("Continue or Skip navigates to /trips/{id} with member session saved", async () => {
    // --- Continue ---
    const continueSubmit = createSubmitMocks();
    const { user: continueUser, unmount: unmountContinue } =
      await classifyAndOpenReview(NAME_ONLY_SEED, SEED_TEXT, continueSubmit);

    await continueUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );
    await waitFor(() =>
      expect(continueSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    expect(continueSubmit.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();

    await continueUser.click(
      screen.getByRole("button", { name: CONTINUE_LABEL }),
    );
    expect(savedMemberSessionFromCall(continueSubmit.saveMemberSession)).toEqual(
      expect.objectContaining({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: MEMBER_SESSION_TOKEN,
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
      }),
    );
    expect(continueSubmit.navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
    expect(continueSubmit.navigate).toHaveBeenCalledTimes(1);
    unmountContinue();

    // --- Skip ---
    const skipSubmit = createSubmitMocks();
    const { user: skipUser } = await classifyAndOpenReview(
      NAME_ONLY_SEED,
      SEED_TEXT,
      skipSubmit,
    );

    await skipUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );
    await waitFor(() =>
      expect(skipSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    expect(skipSubmit.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();

    await skipUser.click(screen.getByRole("button", { name: SKIP_LABEL }));
    expect(savedMemberSessionFromCall(skipSubmit.saveMemberSession)).toEqual(
      expect.objectContaining({
        tripId: TRIP_ID,
        sessionToken: MEMBER_SESSION_TOKEN,
      }),
    );
    expect(skipSubmit.navigate).toHaveBeenCalledWith(`/trips/${TRIP_ID}`);
    expect(skipSubmit.navigate).toHaveBeenCalledTimes(1);
  });

  it("optional timing fields for the selected mode are sent on create; omitted timing (not-decided/flexible) is left out; party size is never sent", async () => {
    // Exact mode → startDate/endDate present
    const exactSubmit = createSubmitMocks();
    const { user: exactUser, unmount: unmountExact } =
      await classifyAndOpenReview(EXACT_SEED, SEED_TEXT, exactSubmit);

    await exactUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );
    await waitFor(() =>
      expect(exactSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    const exactSeed = seedArgFromCreateCall(exactSubmit.createAccountTrip);
    expect(exactSeed.startDate).toBe(EXACT_EARLIER);
    expect(exactSeed.endDate).toBe(EXACT_LATER);
    expect(exactSeed).not.toHaveProperty("partySize");
    expect("partySize" in exactSeed).toBe(false);
    unmountExact();

    // Months mode → timing bounds for Dec→Jan window
    const monthsSubmit = createSubmitMocks();
    const { user: monthsUser, unmount: unmountMonths } =
      await classifyAndOpenReview(CLASSIFIED, SEED_TEXT, monthsSubmit);

    await monthsUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );
    await waitFor(() =>
      expect(monthsSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    const monthsSeed = seedArgFromCreateCall(monthsSubmit.createAccountTrip);
    expect(monthsSeed.startDate).toBe(MONTHS_START_DATE);
    expect(monthsSeed.endDate).toBe(MONTHS_END_DATE);
    expect(monthsSeed).not.toHaveProperty("partySize");
    unmountMonths();

    // Flexible / not-decided → omit timing so server applies defaults
    const flexibleSubmit = createSubmitMocks();
    const { user: flexibleUser } = await classifyAndOpenReview(
      NAME_ONLY_SEED,
      SEED_TEXT,
      flexibleSubmit,
    );

    await flexibleUser.click(
      screen.getByRole("button", { name: /^Create( trip)?$/i }),
    );
    await waitFor(() =>
      expect(flexibleSubmit.createAccountTrip).toHaveBeenCalled(),
    );
    const flexibleSeed = seedArgFromCreateCall(
      flexibleSubmit.createAccountTrip,
    );
    expect(flexibleSeed).not.toHaveProperty("startDate");
    expect(flexibleSeed).not.toHaveProperty("endDate");
    expect("startDate" in flexibleSeed).toBe(false);
    expect("endDate" in flexibleSeed).toBe(false);
    expect(flexibleSeed).not.toHaveProperty("partySize");
    expect("partySize" in flexibleSeed).toBe(false);
  });
});
