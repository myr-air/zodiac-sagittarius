import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { weatherBriefings } from "@/src/components/WeatherBriefing.fixtures";
import { SmartItineraryTable } from "@/src/features/itinerary/components";

function renderTable(
  overrides: Partial<Parameters<typeof SmartItineraryTable>[0]> = {},
) {
  const props: Parameters<typeof SmartItineraryTable>[0] = {
    canRedo: false,
    canRestructure: true,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    tripPlans: tripFixture.trip.planVariants,
    selectedTripPlanId: tripFixture.trip.activePlanVariantId,
    mainTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
    tripPlanError: null,
    isTripPlanBusy: false,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: tripFixture.planItems[0].id,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-plan-1", name: "Plan 1", scope: "trip" },
      { id: "path-rain", name: "Rain plan", scope: "day", day: "2026-06-19" },
    ],
    selectedTripPathId: "main",
    dayPathOverrides: {},
    showAllPaths: false,
    tripName: tripFixture.trip.name,
    onAddBookingForItem: vi.fn(),
    onAddStop: vi.fn(),
    onOpenItemDetails: vi.fn(),
    onSelectItem: vi.fn(),
    onMoveItem: vi.fn(),
    onMoveItemIntoPlanBlock: vi.fn(),
    onMoveItemToDay: vi.fn(),
    onMoveItemToPath: vi.fn(),
    onAddSubActivity: vi.fn(),
    onAddNoteForItem: vi.fn(),
    onAddTaskForItem: vi.fn(),
    onUpdateItemInline: vi.fn(),
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    onExportItinerary: vi.fn(),
    onImportItinerary: vi.fn(),
    onChangeTripPlan: vi.fn(),
    onChangeTripPlanStatus: vi.fn(),
    onSetMainTripPlan: vi.fn(),
    onCreateTripPlan: vi.fn(),
    onRenameTripPlan: vi.fn(),
    onChangeDayPath: vi.fn(),
    onClearDayPath: vi.fn(),
    onToggleShowAllPaths: vi.fn(),
    onRedo: vi.fn(),
    onToggleContextRail: vi.fn(),
    onUndo: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<SmartItineraryTable {...props} />, { locale: "th" });
  return props;
}

function findGraphLine(
  from: HTMLElement,
  to: HTMLElement,
): Element | undefined {
  const fromCenter = {
    x: Number.parseFloat(from.style.left),
    y: Number.parseFloat(from.style.top) + 18,
  };
  const toCenter = {
    x: Number.parseFloat(to.style.left),
    y: Number.parseFloat(to.style.top) + 18,
  };
  return Array.from(
    document.querySelectorAll(".activity-path-graph-line"),
  ).find(
    (line) =>
      line.getAttribute("data-from-x") === `${fromCenter.x}` &&
      line.getAttribute("data-from-y") === `${fromCenter.y}` &&
      line.getAttribute("data-to-x") === `${toCenter.x}` &&
      line.getAttribute("data-to-y") === `${toCenter.y}`,
  );
}

function layoutRect(top: number, height: number, width = 120): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: width,
    top,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function createDragDataTransfer() {
  const store = new Map<string, string>();
  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: vi.fn((type: string) => store.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      store.set(type, value);
    }),
  };
}

async function openHeaderControls(user: ReturnType<typeof userEvent.setup>) {
  const controlsButton = screen.getByRole("button", { name: "Trip Plan controls" });
  await user.click(controlsButton);
  return controlsButton;
}

describe("SmartItineraryTable", () => {
  it("uses English itinerary shell labels by default and Thai after switching", () => {
    renderWithI18n(
      <>
        <LanguageSwitch />
        <SmartItineraryTable
          canRedo={false}
          canRestructure
          canUndo={false}
          contextRailOpen={false}
          endDate={tripFixture.trip.endDate}
          items={tripFixture.planItems}
          tripPlans={tripFixture.trip.planVariants}
          selectedTripPlanId={tripFixture.trip.activePlanVariantId}
          mainTripPlanId={tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId}
          tripPlanError={null}
          isTripPlanBusy={false}
          role="owner"
          startDate={tripFixture.trip.startDate}
          selectedItemId={tripFixture.planItems[0].id}
          tripName={tripFixture.trip.name}
          onAddStop={vi.fn()}
          onOpenItemDetails={vi.fn()}
          onSelectItem={vi.fn()}
          onMoveItem={vi.fn()}
          onMoveItemIntoPlanBlock={vi.fn()}
          onMoveItemToDay={vi.fn()}
          onExportItinerary={vi.fn()}
          onImportItinerary={vi.fn()}
          onChangeTripPlan={vi.fn()}
          onChangeTripPlanStatus={vi.fn()}
          onSetMainTripPlan={vi.fn()}
          onCreateTripPlan={vi.fn()}
          onRenameTripPlan={vi.fn()}
          onRedo={vi.fn()}
          onToggleContextRail={vi.fn()}
          onUndo={vi.fn()}
        />
      </>,
    );

    const actions = screen.getByRole("group", {
      name: /Itinerary actions|คำสั่งแผนการเดินทาง/i,
    });
    expect(
      within(actions).getByRole("button", { name: "Trip Plan controls" }),
    ).toBeInTheDocument();
    expect(within(actions).queryByRole("button", { name: /Import|นำเข้า/i })).toBeNull();
    expect(within(actions).queryByRole("button", { name: /Export|ส่งออก/i })).toBeNull();
    expect(
      within(actions).queryByRole("button", { name: /Add stop or activity/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /Open details/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Language and currency" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));

    expect(
      within(actions).getByRole("button", { name: "Trip Plan controls" }),
    ).toBeInTheDocument();
    expect(within(actions).queryByRole("button", { name: /Import|นำเข้า/i })).toBeNull();
    expect(within(actions).queryByRole("button", { name: /Export|ส่งออก/i })).toBeNull();
    expect(
      within(actions).queryByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
  }, 30_000);

  it("keeps Trip Plan selection and management separate from itinerary paths", async () => {
    const user = userEvent.setup();
    const onChangeTripPlan = vi.fn();
    const onChangeTripPlanStatus = vi.fn();
    const onSetMainTripPlan = vi.fn();
    const onRenameTripPlan = vi.fn().mockResolvedValue(true);
    renderTable({
      selectedTripPlanId: "plan-rain",
      onChangeTripPlan,
      onChangeTripPlanStatus,
      onSetMainTripPlan,
      onRenameTripPlan,
    });

    await openHeaderControls(user);
    const selector = screen.getByLabelText("Trip Plan");
    expect(selector).toHaveValue("plan-rain");
    expect(screen.getByRole("option", { name: "แผนหลัก (V1) - แผนหลัก" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "แผนฝนตก - สำรอง" })).toBeInTheDocument();

    await user.selectOptions(selector, tripFixture.trip.activePlanVariantId);
    expect(onChangeTripPlan).toHaveBeenCalledWith(tripFixture.trip.activePlanVariantId);

    await user.selectOptions(screen.getByLabelText("สถานะแผน"), "proposal");
    expect(onChangeTripPlanStatus).toHaveBeenCalledWith("plan-rain", "proposal");

    const nameInput = screen.getByLabelText("ชื่อแผน");
    await user.clear(nameInput);
    await user.type(nameInput, "Rain window");
    await user.click(screen.getByRole("button", { name: "บันทึกชื่อ" }));
    expect(onRenameTripPlan).toHaveBeenCalledWith("plan-rain", "Rain window");

    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));
    expect(onSetMainTripPlan).toHaveBeenCalledWith("plan-rain");

    cleanup();
    renderTable({
      selectedTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
    });
    await openHeaderControls(user);
    expect(screen.getByLabelText("สถานะแผน")).toBeDisabled();
    expect(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" })).toBeDisabled();
  });

  it("renders Trip Plan controls as an animated overlay instead of inline layout", async () => {
    const user = userEvent.setup();
    renderTable();

    const actions = screen.getByRole("group", {
      name: /Itinerary actions|คำสั่งแผนการเดินทาง/i,
    });
    const header = screen.getByRole("banner");
    const controlsButton = await openHeaderControls(user);
    const controlsPanel = document.querySelector<HTMLElement>(
      "#itinerary-header-controls",
    );

    expect(header).toHaveClass("z-[40]", "overflow-visible");
    expect(controlsButton).toHaveAttribute("aria-expanded", "true");
    expect(controlsPanel).not.toBeNull();
    expect(controlsPanel).toHaveAttribute("data-state", "open");
    expect(controlsPanel?.closest(".page-header-actions")).toBe(actions);
    expect(controlsPanel).toHaveClass(
      "absolute",
      "right-0",
      "top-[calc(100%_+_8px)]",
      "z-[30]",
      "max-h-[min(72vh,620px)]",
      "w-[min(640px,calc(100vw_-_32px))]",
      "data-[state=closed]:opacity-0",
      "motion-reduce:transition-none",
    );
    expect(controlsPanel?.querySelector("select")).toHaveClass(
      "w-full",
      "min-w-0",
    );
    expect(controlsPanel?.querySelector(".trip-plan-create-form")).toBeNull();
    expect(controlsPanel?.querySelector(".itinerary-filter-panel")).toHaveClass(
      "grid",
      "grid-cols-[repeat(auto-fit,minmax(118px,1fr))]",
    );

    await user.keyboard("{Escape}");

    expect(controlsButton).toHaveAttribute("aria-expanded", "false");
    expect(controlsPanel).toHaveAttribute("data-state", "closed");
    expect(controlsPanel).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => {
      expect(
        document.querySelector("#itinerary-header-controls"),
      ).not.toBeInTheDocument();
    });
  });

  it("lets organizers create a named Trip Plan and keeps failed creation editable", async () => {
    const user = userEvent.setup();
    const onCreateTripPlan = vi.fn().mockResolvedValue(false);
    renderTable({ role: "organizer", onCreateTripPlan, tripPlanError: "Could not update Trip Plan." });

    await openHeaderControls(user);
    await user.click(screen.getByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "Food crawl");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    expect(onCreateTripPlan).toHaveBeenCalledWith("Food crawl");
    expect(screen.getByPlaceholderText("ตั้งชื่อแผน")).toHaveValue("Food crawl");
    expect(screen.getByText("Could not update Trip Plan.")).toBeInTheDocument();
  });

  it("keeps the activity path filter UI and day path picker separate from Trip Plans", async () => {
    const user = userEvent.setup();
    const onChangeDayPath = vi.fn();
    const onToggleShowAllPaths = vi.fn();
    renderTable({
      onChangeDayPath,
      onToggleShowAllPaths,
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        { id: "path-plan-1", name: "Plan 1", scope: "trip" },
        {
          id: "path-2026-06-19-sub-a",
          name: "Plan A",
          scope: "day",
          day: "2026-06-19",
        },
      ],
    });

    expect(screen.getByRole("button", { name: "Trip Plan controls" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตัวกรองแผน/i }),
    ).not.toBeInTheDocument();

    await openHeaderControls(user);
    const filterRegion = screen.getByRole("region", { name: /ตัวกรองแผน/i });
    expect(within(filterRegion).getByLabelText("Plan 1")).toBeInTheDocument();
    expect(within(filterRegion).getByLabelText("Plan A")).toBeInTheDocument();
    expect(within(filterRegion).queryByText("แผนฝนตก")).not.toBeInTheDocument();

    const showAllToggle = screen.getByRole("checkbox", { name: /แสดงทุก path/i });
    await user.click(showAllToggle);
    expect(onToggleShowAllPaths).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: /Path for Day 2/i }));
    const dayPathMenu = screen.getByRole("listbox", {
      name: /Path for Day 2/i,
    });
    expect(dayPathMenu.closest(".table-scroll")).toBeNull();
    await user.click(
      within(dayPathMenu).getByRole("option", { name: "Plan A" }),
    );
    expect(onChangeDayPath).toHaveBeenCalledWith(
      "2026-06-19",
      "path-2026-06-19-sub-a",
    );
  });

  it("shows each day's weather icon in the itinerary day header", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "rain",
                conditionLabel: "Rain",
                temperatureMaxCelsius: 33,
                temperatureMinCelsius: 28,
                apparentTemperatureMaxCelsius: 38,
                apparentTemperatureMinCelsius: 31,
                sunrise: "2026-06-19T05:46",
                sunset: "2026-06-19T18:47",
                uvIndexMax: 8.2,
                precipitationSumMm: 12.4,
                precipitationHours: 4,
                rainChancePercent: 64,
                windSpeedKph: 18,
                windGustsKph: 42,
                visibilityMinMeters: 1900,
              }
            : null,
        },
      ],
    });

    const weatherChip = screen.getByLabelText(/Weather for Day 2/i);
    expect(weatherChip.querySelector(".icon")).toBeInTheDocument();
    expect(weatherChip).toHaveTextContent("33° 28°");
    expect(weatherChip).toHaveTextContent("05:46");
    expect(weatherChip).toHaveTextContent("18:47");
    expect(weatherChip.querySelectorAll(".icon")).toHaveLength(3);
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Feels 38° 31°"),
    );
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Rain 64% · 12.4 mm · 4h"),
    );
    expect(weatherChip).toHaveAttribute("title", expect.stringContaining("UV 8.2"));
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Wind 18 km/h · gust 42 km/h"),
    );
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Visibility min 1.9 km"),
    );
  });

  it("hides pending weather chips until real temperature or solar data exists", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "unavailable",
                conditionLabel: "Forecast pending",
                temperatureMaxCelsius: null,
                temperatureMinCelsius: null,
                sunrise: null,
                sunset: null,
              }
            : null,
        },
      ],
    });

    expect(screen.queryByLabelText(/Weather for Day 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Forecast pending")).not.toBeInTheDocument();
  });

  it("shows real solar times even when temperatures are unavailable", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "unavailable",
                conditionLabel: "Forecast pending",
                temperatureMaxCelsius: null,
                temperatureMinCelsius: null,
                sunrise: "2026-06-19T05:39",
                sunset: "2026-06-19T19:09",
              }
            : null,
        },
      ],
    });

    const weatherChip = screen.getByLabelText(/Weather for Day 2/i);
    expect(weatherChip).toHaveTextContent("05:39");
    expect(weatherChip).toHaveTextContent("19:09");
    expect(weatherChip).not.toHaveTextContent("Forecast pending");
  });

  it("saves custom day titles inline with the daily briefing version", async () => {
    const user = userEvent.setup();
    const onSaveDayTitle = vi.fn();
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          version: 7,
          manualOverrides: { dayTitle: "Old title" },
        },
      ],
      onSaveDayTitle,
    });

    const titleInput = screen.getByLabelText("Trip day title for Day 2");
    expect(titleInput).toHaveAttribute("maxLength", "48");
    expect(titleInput).toHaveValue("Old title");
    expect(titleInput).toHaveClass("border-transparent", "text-[13px]", "font-extrabold");
    expect(titleInput).toHaveStyle({ width: "12ch" });
    await user.clear(titleInput);
    await user.type(titleInput, "Shenzhen border hop");
    expect(titleInput).toHaveStyle({ width: "20ch" });
    await user.tab();

    await waitFor(() => {
      expect(onSaveDayTitle).toHaveBeenCalledWith(
        "2026-06-19",
        7,
        "Shenzhen border hop",
      );
    });
  });

  it("renders graph and compact activity cells for activity rows", () => {
    renderTable();

    const table = document.querySelector(".smart-table");
    expect(table).toHaveClass("smart-table", "min-w-[520px]");
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|Time|place|Type|Map|Actions|ประเภท|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = document.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.querySelector(".activity-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).not.toBe("");
      expect(
        within(row).getByRole("button", {
          name: /เปิดรายละเอียดของ|Open details for/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(row).getAllByRole("button", {
          name: /แก้ไขประเภท|Edit type/i,
        }).length,
      ).toBeGreaterThanOrEqual(1);
    }
    expect(itemRows[0]?.querySelector(".activity-cell")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(
      itemRows[0]?.querySelector(".activity-cell"),
    ).toHaveClass(
      "min-h-[60px]",
      "grid-cols-[64px_112px_minmax(0,1fr)]",
      "data-[selected=true]:bg-(--color-route-soft)",
    );
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /เปิดรายละเอียดของ|Open details for/i,
      }),
    ).toHaveClass("size-7");
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      }).find((button) => button.className.includes("activity-type-picker ")),
    ).toHaveClass(
      "activity-type-picker",
      "!min-h-[52px]",
      "rounded-(--radius-sm)",
      "[&_.inline-option-picker-caret]:hidden",
    );
    expect(
      within(itemRows[0]).getAllByRole("button", {
        name: /แก้ไขประเภท|Edit type/i,
      })[0]?.querySelector(".icon"),
    ).toBeInTheDocument();
    const subActivityToggle = within(itemRows[0]).getAllByRole("button", {
      name: /Sub-activities for/i,
    })[0];
    expect(subActivityToggle).toHaveClass("size-7");
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "false");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toBeInTheDocument();
    expect(
      within(itemRows[0]).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    ).toBeInTheDocument();
    const rowWithoutSubItems = Array.from(itemRows).find(
      (row) =>
        row !== itemRows[0] &&
        within(row).queryByRole("button", {
          name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
        }) === null,
    );
    expect(rowWithoutSubItems).toBeDefined();

    expect(
      screen.queryByRole("region", { name: /รายละเอียดจุดที่เลือก/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(subActivityToggle);
    expect(subActivityToggle).toHaveAttribute("aria-expanded", "true");
    expect(itemRows[0]?.querySelector(".sub-activity-list")).toHaveClass(
      "max-[640px]:hidden",
    );
  });

  it("edits activity start and optional end time in a focused modal", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "time-modal-item",
      activity: "Harbour transfer",
      startTime: "08:00",
      endTime: "09:15",
      endOffsetDays: 0,
      durationMinutes: 75,
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="time-modal-item"]',
    );
    expect(row).not.toBeNull();
    const timeButton = within(row as HTMLElement).getByRole("button", {
      name: /แก้ไขเวลา Harbour transfer/i,
    });
    expect(timeButton).toHaveTextContent("08:00");
    expect(timeButton).toHaveAttribute("title", "08:00 - 09:15\n1 h 15 m");
    expect(row).toHaveTextContent("08:00");
    expect(row).not.toHaveTextContent("08:00-09:15");

    await user.click(timeButton);

    const dialog = screen.getByRole("dialog", {
      name: /แก้ไขเวลา Harbour transfer/i,
    });
    expect(within(dialog).getByText(/ตัวอย่างที่จะแสดง/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/ระยะเวลา: 1 h 15 m/i)).toBeInTheDocument();

    const endInput = within(dialog).getByLabelText("เวลาจบ");
    await user.clear(endInput);
    await user.type(endInput, "10:30");
    expect(within(dialog).getByText(/ระยะเวลา: 2 h 30 m/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    await waitFor(() => {
      expect(onUpdateItemInline).toHaveBeenCalledWith("time-modal-item", {
        startTime: "08:00",
        endTime: "10:30",
        endOffsetDays: 0,
        durationMinutes: 150,
      });
    });
  });

  it("shows travel from/to details and creates booking drafts from the mode icon", async () => {
    const user = userEvent.setup();
    const onAddBookingForItem = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      transportation: "",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onAddBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("From");
    expect(row).toHaveTextContent("To");
    expect(row).not.toHaveTextContent("@");
    expect(within(row as HTMLElement).getByDisplayValue("BKK")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByDisplayValue("HKG")).toBeInTheDocument();

    const bookingButton = within(row as HTMLElement).getAllByRole("button", {
        name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
      })[0];
    expect(bookingButton).toHaveClass("text-(--color-text-muted)");

    await user.click(bookingButton);

    expect(onAddBookingForItem).toHaveBeenCalledWith("travel-flight-row", "flight");
  });

  it("opens a ticket modal from the mode icon and reuses an existing ticket", async () => {
    const user = userEvent.setup();
    const onSaveBookingForItem = vi.fn();
    const flightItem = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      startTime: "09:00",
      endTime: "11:30",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };
    const busItem = {
      ...tripFixture.planItems[1],
      id: "bus-leg-row",
      activity: "Terminal shuttle",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [
        {
          id: "booking-shared-flight",
          tripId: tripFixture.trip.id,
          tripPlanId: tripFixture.trip.activePlanVariantId,
          type: "flight",
          title: "CX shared flight ticket",
          status: "booked",
          visibility: "shared",
          ownerMemberId: tripFixture.trip.members[0].id,
          providerName: "Cathay Pacific",
          confirmationCode: "CX1234",
          startsAt: "2026-06-19T09:00:00",
          endsAt: "2026-06-19T11:30:00",
          timezone: tripFixture.trip.defaultTimezone,
          priceAmount: null,
          currency: null,
          travelerIds: [tripFixture.trip.members[0].id],
          externalLinks: [],
          relatedItineraryItemIds: [busItem.id],
          relatedTaskIds: [],
          relatedExpenseIds: [],
          noteIds: [],
          notes: "Shared ticket",
          createdBy: tripFixture.trip.members[0].id,
          updatedAt: "2026-05-28T00:00:00.000Z",
          version: 1,
        },
      ],
      onSaveBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    const linkedBusRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="bus-leg-row"]',
    );
    expect(linkedBusRow).not.toBeNull();
    expect(
      within(linkedBusRow as HTMLElement).getAllByRole("button", {
        name: /สร้าง booking draft แบบ รถบัส สำหรับ Terminal shuttle/i,
      })[0],
    ).toHaveClass("text-(--color-route)");

    await user.click(
      within(row as HTMLElement).getAllByRole("button", {
        name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
      })[0],
    );
    const dialog = await screen.findByRole("dialog", {
      name: /ตั๋วสำหรับ Airport transfer/i,
    });

    await user.click(
      within(dialog).getByRole("button", { name: /ใช้ตั๋วเดิม/i }),
    );
    expect(within(dialog).getByText("CX shared flight ticket")).toBeInTheDocument();
    const terminalShuttleCheckbox = within(dialog)
      .getAllByLabelText(/Terminal shuttle/i)
      .find(
        (element): element is HTMLInputElement =>
          element instanceof HTMLInputElement && element.type === "checkbox",
      );
    expect(terminalShuttleCheckbox).toBeChecked();

    await user.clear(within(dialog).getByLabelText("เลข booking / ticket"));
    await user.type(within(dialog).getByLabelText("เลข booking / ticket"), "CX5678");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกตั๋ว/i }));

    await waitFor(() => {
      expect(onSaveBookingForItem).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingDocId: "booking-shared-flight",
          confirmationCode: "CX5678",
          itemId: flightItem.id,
          relatedItineraryItemIds: [busItem.id, flightItem.id],
          template: "flight",
          type: "flight",
        }),
      );
    });
  });

  it("unlinks the current activity from an existing ticket without deleting the ticket", async () => {
    const user = userEvent.setup();
    const onSaveBookingForItem = vi.fn();
    const onUnlinkBookingForItem = vi.fn();
    const flightItem = {
      ...tripFixture.planItems[0],
      id: "travel-flight-row",
      activity: "Airport transfer",
      activityType: "travel" as const,
      place: "HKG",
      startTime: "09:00",
      endTime: "11:30",
      details: {
        ...tripFixture.planItems[0].details,
        from: "BKK",
        mode: "flight",
        to: "HKG",
      },
    };
    const busItem = {
      ...tripFixture.planItems[1],
      id: "bus-leg-row",
      activity: "Terminal shuttle",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [flightItem, busItem],
      graphItems: [flightItem, busItem],
      selectedItemId: flightItem.id,
      bookingDocs: [
        {
          id: "booking-shared-flight",
          tripId: tripFixture.trip.id,
          tripPlanId: tripFixture.trip.activePlanVariantId,
          type: "flight",
          title: "CX shared flight ticket",
          status: "booked",
          visibility: "shared",
          ownerMemberId: tripFixture.trip.members[0].id,
          providerName: "Cathay Pacific",
          confirmationCode: "CX1234",
          startsAt: "2026-06-19T09:00:00",
          endsAt: "2026-06-19T11:30:00",
          timezone: tripFixture.trip.defaultTimezone,
          priceAmount: null,
          currency: null,
          travelerIds: [tripFixture.trip.members[0].id],
          externalLinks: [],
          relatedItineraryItemIds: [flightItem.id, busItem.id],
          relatedTaskIds: [],
          relatedExpenseIds: [],
          noteIds: [],
          notes: "Shared ticket",
          createdBy: tripFixture.trip.members[0].id,
          updatedAt: "2026-05-28T00:00:00.000Z",
          version: 1,
        },
      ],
      onSaveBookingForItem,
      onUnlinkBookingForItem,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-flight-row"]',
    );
    expect(row).not.toBeNull();
    const bookingButton = within(row as HTMLElement).getAllByRole("button", {
      name: /สร้าง booking draft แบบ เครื่องบิน สำหรับ Airport transfer/i,
    })[0];
    expect(bookingButton).toHaveClass("text-(--color-route)");

    await user.click(bookingButton);
    const dialog = await screen.findByRole("dialog", {
      name: /ตั๋วสำหรับ Airport transfer/i,
    });

    expect(within(dialog).getByText("CX shared flight ticket")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /ยกเลิก link/i }));

    await waitFor(() => {
      expect(onUnlinkBookingForItem).toHaveBeenCalledWith(
        "booking-shared-flight",
        flightItem.id,
      );
    });
    expect(screen.queryByRole("dialog", { name: /ตั๋วสำหรับ Airport transfer/i })).not.toBeInTheDocument();
  });

  it("opens travel sub-type options from the type picker and stores the selected mode", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "travel-subtype-row",
      activity: "Hotel transfer",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[0].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="travel-subtype-row"]',
    );
    expect(row).not.toBeNull();
    const typeButton = within(row as HTMLElement)
      .getAllByRole("button", { name: /แก้ไขประเภท Hotel transfer/i })
      .find((button) => button.className.includes("activity-type-picker "));
    expect(typeButton).toBeDefined();

    await user.click(typeButton as HTMLElement);
    expect(screen.getByRole("listbox", { name: /แก้ไขประเภท Hotel transfer/i })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: /เดินทาง options/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /แท็กซี่/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("travel-subtype-row", {
      activityType: "travel",
      activitySubtype: "taxi",
      details: expect.objectContaining({ mode: "bus", subtype: "taxi" }),
    });
  });

  it("uses the same travel sub-type patch from the mobile type picker", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const item = {
      ...tripFixture.planItems[0],
      id: "mobile-travel-subtype-row",
      activity: "Mobile transfer",
      activityType: "travel" as const,
      details: {
        ...tripFixture.planItems[0].details,
        mode: "bus",
      },
    };

    renderTable({
      items: [item],
      graphItems: [item],
      selectedItemId: item.id,
      onUpdateItemInline,
    });

    const row = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="mobile-travel-subtype-row"]',
    );
    expect(row).not.toBeNull();
    const typeButton = within(row as HTMLElement)
      .getAllByRole("button", { name: /แก้ไขประเภท Mobile transfer/i })
      .find((button) => button.className.includes("activity-type-picker-mobile"));
    expect(typeButton).toBeDefined();

    await user.click(typeButton as HTMLElement);
    expect(screen.getByRole("listbox", { name: /เดินทาง options/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /แท็กซี่/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("mobile-travel-subtype-row", {
      activityType: "travel",
      activitySubtype: "taxi",
      details: expect.objectContaining({ mode: "bus", subtype: "taxi" }),
    });
  });

  it("lets sub-activities switch from travel to another type and default", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "parent-type-switch",
      activity: "Parent route",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "child-type-switch",
      parentItemId: "parent-type-switch",
      activity: "Airport transfer",
      activityType: "travel" as const,
      activitySubtype: "bus" as const,
      details: {
        ...tripFixture.planItems[1].details,
        mode: "bus",
      },
      day: "2026-06-19",
      sortOrder: 11,
    };

    renderTable({
      items: [parent, child],
      graphItems: [parent, child],
      selectedItemId: parent.id,
      onUpdateItemInline,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="parent-type-switch"]',
    );
    expect(parentRow).not.toBeNull();
    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    const childLine = within(parentRow as HTMLElement)
      .getByDisplayValue("Airport transfer")
      .closest("[data-sub-item-id]");
    expect(childLine).not.toBeNull();

    const typeButton = within(childLine as HTMLElement).getByRole("button", {
      name: /แก้ไขประเภท Airport transfer/i,
    });
    await user.click(typeButton);
    await user.click(screen.getByRole("option", { name: /อาหาร/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("child-type-switch", {
      activityType: "food",
      activitySubtype: null,
      details: expect.not.objectContaining({ mode: expect.anything() }),
    });

    await user.click(typeButton);
    await user.click(screen.getByRole("option", { name: /ทั่วไป/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("child-type-switch", {
      activityType: "default",
      activitySubtype: null,
      details: expect.not.objectContaining({ mode: expect.anything() }),
    });
  });

  it("renders sub-activities inside their parent activity cell", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "parent-activity",
      activity: "Parent route",
      place: "",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "child-activity",
      parentItemId: "parent-activity",
      activity: "Buy Octopus card",
      place: "Airport station",
      day: "2026-06-19",
      sortOrder: 11,
    };
    const childWithoutPlace = {
      ...tripFixture.planItems[2],
      id: "child-without-place",
      parentItemId: "parent-activity",
      activity: "Check stored value",
      activityType: "food" as const,
      place: "",
      day: "2026-06-19",
      sortOrder: 12,
    };

    renderTable({
      items: [parent, child, childWithoutPlace],
      graphItems: [parent, child, childWithoutPlace],
      selectedItemId: "parent-activity",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="parent-activity"]',
    );
    expect(parentRow).not.toBeNull();
    expect(within(parentRow as HTMLElement).getByDisplayValue("Parent route")).toBeInTheDocument();
    const parentBody = parentRow?.querySelector(".activity-cell > div:nth-of-type(3)");
    expect(parentBody).not.toHaveTextContent("@");
    within(parentBody as HTMLElement)
      .getAllByLabelText(/แก้ไขสถานที่|Edit place/i)
      .forEach((placeInput) => {
        expect(placeInput).toHaveAttribute("placeholder", "");
      });
    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent route/i,
      })[0],
    );
    expect(within(parentRow as HTMLElement).getByDisplayValue("Buy Octopus card")).toBeInTheDocument();
    expect(parentRow?.querySelector(".sub-activity-list")).toHaveClass(
      "relative",
      "col-start-2",
      "col-span-2",
      "pl-5",
    );
    expect(parentRow?.querySelector(".sub-activity-line")).toHaveClass(
      "relative",
      "before:left-[-12px]",
    );
    const childWithoutPlaceLine = parentRow?.querySelector(
      '[data-sub-item-id="child-without-place"]',
    );
    expect(childWithoutPlaceLine).not.toHaveTextContent("@");
    expect(childWithoutPlaceLine?.querySelectorAll("input")).toHaveLength(2);
    expect(
      within(childWithoutPlaceLine as HTMLElement).getByLabelText(
        /แก้ไขสถานที่|Edit place/i,
      ),
    ).toHaveAttribute("placeholder", "");
    expect(document.querySelector('[data-item-id="child-activity"]')).not.toBeInTheDocument();

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("parent-activity");
  });

  it("renders add activity rows for expanded days", async () => {
    const user = userEvent.setup();
    const onAddStop = vi.fn();

    renderTable({ onAddStop });

    const addActivityButtons = screen.getAllByRole("button", {
      name: /เพิ่มสถานที่ \/ กิจกรรม|Add stop/i,
    });
    expect(addActivityButtons.length).toBeGreaterThan(0);

    await user.click(addActivityButtons[0]);
    expect(onAddStop).toHaveBeenCalledWith(tripFixture.planItems[0].day);
  });

  it("shows an add sub-activity row for a selected activity with no sub-activities", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const parent = {
      ...tripFixture.planItems[0],
      id: "empty-sub-parent",
      activity: "Harbour transfer",
      day: "2026-06-19",
      sortOrder: 10,
    };

    renderTable({
      items: [parent],
      graphItems: [parent],
      selectedItemId: "empty-sub-parent",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="empty-sub-parent"]',
    );
    expect(parentRow).not.toBeNull();
    expect(parentRow?.querySelector(".sub-activity-list")).toBeInTheDocument();

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("empty-sub-parent");
  });

  it("shows an add sub-activity row after expanding an unselected empty activity", async () => {
    const user = userEvent.setup();
    const onAddSubActivity = vi.fn();
    const selectedSibling = {
      ...tripFixture.planItems[0],
      id: "selected-sibling",
      activity: "Selected sibling",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const parent = {
      ...tripFixture.planItems[1],
      id: "unselected-empty-sub-parent",
      activity: "Bus to Shenzhen",
      day: "2026-06-19",
      sortOrder: 20,
    };

    renderTable({
      items: [selectedSibling, parent],
      graphItems: [selectedSibling, parent],
      selectedItemId: "selected-sibling",
      onAddSubActivity,
    });

    const parentRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="unselected-empty-sub-parent"]',
    );
    expect(parentRow).not.toBeNull();
    expect(parentRow?.querySelector(".sub-activity-list")).toBeNull();

    await user.click(
      within(parentRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Bus to Shenzhen/i,
      })[0],
    );

    await user.click(
      within(parentRow as HTMLElement).getByRole("button", {
        name: /Add sub-activity|เพิ่มกิจกรรมย่อย/i,
      }),
    );
    expect(onAddSubActivity).toHaveBeenCalledWith("unselected-empty-sub-parent");
  });

  it("renders sub-activities without inline drag and drop controls", () => {
    const onMoveItem = vi.fn();
    const parentA = {
      ...tripFixture.planItems[0],
      id: "parent-a",
      activity: "Parent A",
      day: "2026-06-19",
      sortOrder: 10,
    };
    const parentB = {
      ...tripFixture.planItems[0],
      id: "parent-b",
      activity: "Parent B",
      day: "2026-06-19",
      sortOrder: 30,
    };
    const childA1 = {
      ...tripFixture.planItems[1],
      id: "child-a-1",
      parentItemId: "parent-a",
      activity: "Child A1",
      day: "2026-06-19",
      sortOrder: 11,
    };
    const childA2 = {
      ...tripFixture.planItems[2],
      id: "child-a-2",
      parentItemId: "parent-a",
      activity: "Child A2",
      day: "2026-06-19",
      sortOrder: 12,
    };
    const childB1 = {
      ...tripFixture.planItems[3],
      id: "child-b-1",
      parentItemId: "parent-b",
      activity: "Child B1",
      day: "2026-06-19",
      sortOrder: 31,
    };

    renderTable({
      items: [parentA, childA1, childA2, parentB, childB1],
      graphItems: [parentA, childA1, childA2, parentB, childB1],
      selectedItemId: "parent-a",
      onMoveItem,
    });

    const parentARow = document.querySelector<HTMLElement>(
      '[data-item-id="parent-a"]',
    );
    const parentBRow = document.querySelector<HTMLElement>(
      '[data-item-id="parent-b"]',
    );
    expect(parentARow).not.toBeNull();
    expect(parentBRow).not.toBeNull();
    fireEvent.click(
      within(parentARow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent A/i,
      })[0],
    );
    fireEvent.click(
      within(parentBRow as HTMLElement).getAllByRole("button", {
        name: /Sub-activities for Parent B/i,
      })[0],
    );

    const childA1Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-a-1"]',
    );
    const childA2Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-a-2"]',
    );
    const childB1Line = document.querySelector<HTMLElement>(
      '[data-sub-item-id="child-b-1"]',
    );
    expect(childA1Line).not.toBeNull();
    expect(childA2Line).not.toBeNull();
    expect(childB1Line).not.toBeNull();

    expect(childA1Line).not.toHaveAttribute("draggable", "true");
    expect(childA2Line).not.toHaveAttribute("draggable", "true");
    expect(childB1Line).not.toHaveAttribute("draggable", "true");
    expect(childA1Line?.querySelector(".cursor-grab")).toBeNull();
    fireEvent.drop(childA2Line as HTMLElement, {
      dataTransfer: createDragDataTransfer(),
    });
    expect(onMoveItem).not.toHaveBeenCalled();
  });

  it("keeps graph nodes selectable while activity cells remain independent", async () => {
    const user = userEvent.setup();
    const onSelectItem = vi.fn();
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathGroupId: "path-group-graph",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...tripFixture.planItems[1],
      id: "graph-plan-a",
      day: "2026-06-19",
      activity: "Graph plan A",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
      sortOrder: mainItem.sortOrder + 10,
    };

    renderTable({
      items: [mainItem, alternativeItem],
      graphItems: [mainItem, alternativeItem],
      selectedItemId: "graph-main",
      onSelectItem,
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        {
          id: "path-2026-06-19-sub-a",
          name: "Plan A",
          scope: "day",
          day: "2026-06-19",
        },
      ],
    });

    expect(
      screen.getByRole("group", { name: /Activity path graph for Day 2/i }),
    ).toHaveClass("activity-path-graph");
    await user.click(screen.getByRole("button", { name: /Graph plan A on Plan A/i }));
    expect(onSelectItem).toHaveBeenCalledWith("graph-plan-a");
    expect(
      screen.queryByRole("button", {
        name: /Drop activities on Plan A for Day 2/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Move Graph plan A to path/i)).toBeInTheDocument();

    const planRow = document.querySelector<HTMLTableRowElement>(
      '[data-item-id="graph-plan-a"]',
    );
    expect(within(planRow as HTMLElement).getByDisplayValue("Graph plan A")).toBeInTheDocument();
    expect(onSelectItem).toHaveBeenCalledTimes(1);
  });

  it("keeps data-day-drop anchors for graph measurement with add activity affordances", () => {
    renderTable();

    const dayDropAnchors = document.querySelectorAll("[data-day-drop]");
    expect(dayDropAnchors.length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม|Add stop or activity/i,
      }),
    ).toHaveLength(dayDropAnchors.length);
  });

  it("aligns graph dots with measured blank activity rows", async () => {
    const firstItem = {
      ...tripFixture.planItems[0],
      id: "graph-measured-first",
      day: "2026-06-19",
      activity: "Graph measured first",
      pathGroupId: "path-group-measured-height",
      pathRole: "main" as const,
    };
    const secondItem = {
      ...tripFixture.planItems[1],
      id: "graph-measured-second",
      day: "2026-06-19",
      activity: "Graph measured second",
      pathGroupId: "path-group-measured-height",
      pathRole: "main" as const,
      sortOrder: firstItem.sortOrder + 10,
    };
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains("activity-path-graph")) return layoutRect(100, 284, 76);
      if (this.tagName === "TR" && this.querySelector(".activity-path-graph")) return layoutRect(100, 60);
      if (this.dataset.itemId === "graph-measured-first") return layoutRect(160, 108);
      if (this.dataset.itemId === "graph-measured-second") return layoutRect(268, 72);
      if (this.dataset.dayDrop === "2026-06-19") return layoutRect(340, 44);
      return layoutRect(0, 0);
    });

    try {
      renderTable({
        items: [firstItem, secondItem],
        graphItems: [firstItem, secondItem],
        selectedItemId: "graph-measured-first",
      });

      const firstDot = screen.getByRole("button", {
        name: /Graph measured first on Main/i,
      });
      const secondDot = screen.getByRole("button", {
        name: /Graph measured second on Main/i,
      });
      await waitFor(() => expect(firstDot).toHaveStyle({ top: "96px" }));
      expect(secondDot).toHaveStyle({ top: "186px" });
      const graph = screen.getByRole("group", {
        name: /Activity path graph for Day 2/i,
      });
      expect(graph).toHaveStyle({ height: "201.5px" });
      expect(graph.querySelector("svg")).toHaveStyle({ height: "284px" });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("allows keyboard graph path mutation and disables it for read-only roles", async () => {
    const user = userEvent.setup();
    const onMoveItemToPath = vi.fn();
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathGroupId: "path-group-graph",
      pathRole: "main" as const,
    };

    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      selectedItemId: "graph-main",
      onMoveItemToPath,
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        {
          id: "path-2026-06-19-sub-a",
          name: "Plan A",
          scope: "day",
          day: "2026-06-19",
        },
      ],
    });

    await user.selectOptions(
      screen.getByLabelText(/Move Graph main to path/i),
      "path-2026-06-19-sub-a",
    );
    expect(onMoveItemToPath).toHaveBeenCalledWith(
      "graph-main",
      "path-2026-06-19-sub-a",
    );

    cleanup();
    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      role: "viewer",
      selectedItemId: "graph-main",
      onMoveItemToPath,
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        {
          id: "path-2026-06-19-sub-a",
          name: "Plan A",
          scope: "day",
          day: "2026-06-19",
        },
      ],
    });
    expect(screen.getByRole("button", { name: /Graph main on Main/i })).toHaveAttribute(
      "draggable",
      "false",
    );
    expect(screen.getByLabelText(/Move Graph main to path/i)).toBeDisabled();
  });

  it("draws dashed graph lines for same-plan gaps", () => {
    const earlyItem = {
      ...tripFixture.planItems[0],
      id: "gap-early",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 30,
      activity: "Gap early",
      sortOrder: 100,
      pathRole: "main" as const,
    };
    const lateItem = {
      ...tripFixture.planItems[1],
      id: "gap-late",
      day: "2026-06-19",
      startTime: "09:15",
      durationMinutes: 30,
      activity: "Gap late",
      sortOrder: 200,
      pathRole: "main" as const,
    };

    renderTable({
      items: [earlyItem, lateItem],
      graphItems: [earlyItem, lateItem],
      selectedItemId: "gap-early",
    });

    const earlyDot = screen.getByRole("button", { name: /Gap early on Main/i });
    const lateDot = screen.getByRole("button", { name: /Gap late on Main/i });
    expect(findGraphLine(earlyDot, lateDot)).toHaveClass(
      "activity-path-graph-line--dashed",
    );
  });
});
