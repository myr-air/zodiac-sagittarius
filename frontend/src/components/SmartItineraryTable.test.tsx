import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { weatherBriefings } from "./WeatherBriefing.fixtures";
import { SmartItineraryTable } from "./SmartItineraryTable";

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
    renderTable({
      selectedTripPlanId: "plan-rain",
      onChangeTripPlan,
      onChangeTripPlanStatus,
      onSetMainTripPlan,
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

    expect(header).toHaveClass("overflow-visible");
    expect(controlsButton).toHaveAttribute("aria-expanded", "true");
    expect(controlsPanel).not.toBeNull();
    expect(controlsPanel).toHaveAttribute("data-state", "open");
    expect(controlsPanel?.closest(".page-header-actions")).toBe(actions);
    expect(controlsPanel).toHaveClass(
      "absolute",
      "right-0",
      "top-[calc(100%_+_8px)]",
      "z-[30]",
      "max-h-[min(70vh,560px)]",
      "w-[min(424px,calc(100vw_-_32px))]",
      "data-[state=closed]:opacity-0",
      "motion-reduce:transition-none",
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
    await user.type(screen.getByLabelText("ชื่อแผน"), "Food crawl");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    expect(onCreateTripPlan).toHaveBeenCalledWith("Food crawl");
    expect(screen.getByLabelText("ชื่อแผน")).toHaveValue("Food crawl");
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
              }
            : null,
        },
      ],
    });

    const weatherChip = screen.getByLabelText(/Weather for Day 2/i);
    expect(weatherChip.querySelector(".icon")).toBeInTheDocument();
    expect(weatherChip).toHaveTextContent("33° 28°");
  });

  it("renders only graph and blank item canvas columns for activity rows", () => {
    renderTable();

    const table = document.querySelector(".smart-table");
    expect(table).toHaveClass("smart-table", "min-w-[520px]");
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Itinerary item canvas" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|Time|Activity|place|Type|Map|Actions|ประเภท|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = document.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).toBe("");
      expect(within(row).queryByRole("button")).not.toBeInTheDocument();
      expect(within(row).queryByRole("link")).not.toBeInTheDocument();
      expect(within(row).queryByRole("textbox")).not.toBeInTheDocument();
      expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
    }

    expect(screen.queryByRole("link", { name: "QR349" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open details|เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /รายละเอียดจุดที่เลือก/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps graph nodes selectable while activity cells stay blank", async () => {
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
    expect(planRow?.textContent?.trim()).toBe("");
  });

  it("keeps blank data-day-drop anchors for graph measurement without add buttons", () => {
    renderTable();

    const dayDropAnchors = document.querySelectorAll("[data-day-drop]");
    expect(dayDropAnchors.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม|Add stop or activity/i,
      }),
    ).not.toBeInTheDocument();
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
