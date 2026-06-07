import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
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
    onAddStop: vi.fn(),
    onSelectItem: vi.fn(),
    onMoveItem: vi.fn(),
    onMoveItemToDay: vi.fn(),
    onMoveItemToPath: vi.fn(),
    onUpdateItemInline: vi.fn(),
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    onExportItinerary: vi.fn(),
    onImportItinerary: vi.fn(),
    onChangeDayPath: vi.fn(),
    onClearDayPath: vi.fn(),
    onAutoResolveDayOverlaps: vi.fn(),
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
          role="owner"
          startDate={tripFixture.trip.startDate}
          selectedItemId={tripFixture.planItems[0].id}
          tripName={tripFixture.trip.name}
          onAddStop={vi.fn()}
          onSelectItem={vi.fn()}
          onMoveItem={vi.fn()}
          onMoveItemToDay={vi.fn()}
          onExportItinerary={vi.fn()}
          onImportItinerary={vi.fn()}
          onRedo={vi.fn()}
          onToggleContextRail={vi.fn()}
          onUndo={vi.fn()}
        />
      </>,
    );

    const actions = screen.getByRole("group", { name: /Itinerary actions/i });
    expect(
      within(actions).getByRole("button", { name: /Import|นำเข้า/i }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: /Export|ส่งออก/i }),
    ).toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /Add stop or activity/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /Open details/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /Undo/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /Redo/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ภาษาไทย" }));
    expect(
      within(actions).getByRole("button", { name: /Import|นำเข้า/i }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: /Export|ส่งออก/i }),
    ).toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      within(actions).queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
  }, 30_000);

  it("calls import and export handlers from the itinerary header", async () => {
    const user = userEvent.setup();
    const onExportItinerary = vi.fn();
    const onImportItinerary = vi.fn();
    renderTable({ onExportItinerary, onImportItinerary });

    await user.click(screen.getByRole("button", { name: /Export|ส่งออก/i }));
    expect(onExportItinerary).toHaveBeenCalledOnce();

    const file = new File(
      ['{"schema":"joii.itinerary.export","version":1,"items":[]}'],
      "itinerary.json",
      { type: "application/json" },
    );
    await user.upload(
      screen.getByLabelText(/Import itinerary JSON|นำเข้า itinerary JSON/i),
      file,
    );

    expect(onImportItinerary).toHaveBeenCalledWith(file);
  });

  it("neutralizes unsafe map link hrefs", () => {
    renderTable({
      items: [
        {
          ...tripFixture.planItems[0],
          mapLink: "javascript:alert(document.domain)",
        },
      ],
    });

    expect(screen.getByRole("link", { name: "QR349" })).toHaveAttribute(
      "href",
      "#",
    );
  });

  it("filters visible plans from the checkbox dropdown", async () => {
    const user = userEvent.setup();
    renderTable({
      items: [
        tripFixture.planItems[0],
        {
          ...tripFixture.planItems[0],
          id: "plan-a-item",
          activity: "Plan A museum",
          place: "Plan A checkpoint",
          pathId: "path-plan-1",
          pathName: "Plan 1",
          pathRole: "alternative",
          pathGroupId: "group-plan-a",
        },
      ],
    });

    expect(
      screen.queryByRole("region", { name: /ตัวกรองแผน/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /แสดงตัวกรอง/i }));
    await user.click(screen.getByLabelText("Plan 1"));

    expect(
      screen.getByRole("button", { name: /ซ่อนตัวกรอง/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/เลือก: Main/i)).toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /เปิดรายละเอียดของ เดินทางออกจากกรุงเทพ/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /เปิดรายละเอียดของ Plan A museum/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps generated day plans out of the trip-wide filter while showing them on the matching day", async () => {
    const user = userEvent.setup();
    const onChangeDayPath = vi.fn();
    renderTable({
      onChangeDayPath,
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

    fireEvent.click(screen.getByRole("button", { name: /แสดงตัวกรอง/i }));
    const filterRegion = screen.getByRole("region", { name: /ตัวกรองแผน/i });
    expect(within(filterRegion).getByLabelText("Plan A")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Path for Day 2/i }));
    const dayPathMenu = screen.getByRole("listbox", {
      name: /Path for Day 2/i,
    });
    expect(
      within(dayPathMenu).getByRole("option", { name: "Plan A" }),
    ).toBeInTheDocument();
    expect(dayPathMenu.closest(".table-scroll")).toBeNull();
    await user.click(
      within(dayPathMenu).getByRole("option", { name: "Plan A" }),
    );
    expect(onChangeDayPath).toHaveBeenCalledWith(
      "2026-06-19",
      "path-2026-06-19-sub-a",
    );
    expect(screen.queryByLabelText(/Path for Day 1/i)).not.toBeInTheDocument();
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

    expect(screen.getByLabelText(/Weather for Day 2/i)).toHaveTextContent("☂");
    expect(screen.getByLabelText(/Weather for Day 2/i)).toHaveTextContent(
      "33° 28°",
    );
  });

  it("renders a left-side dot graph without lane controls", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathGroupId: "path-group-graph",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...mainItem,
      id: "graph-plan-a",
      activity: "Graph plan A",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };

    renderTable({
      items: [mainItem],
      graphItems: [mainItem, alternativeItem],
      selectedItemId: "graph-main",
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
    expect(
      screen.getByRole("button", { name: /Graph main on Main/i }),
    ).toHaveClass("activity-path-graph-node--selected", "size-9");
    expect(
      screen.getByRole("button", { name: /Graph plan A on Plan A/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /Graph plan A/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Drop activities on Plan A for Day 2/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".activity-path-graph-lane-label"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: /Activity path graph for Day 1/i }),
    ).not.toBeInTheDocument();
  });

  it("aligns graph dots with the taller editable itinerary rows", () => {
    const firstItem = {
      ...tripFixture.planItems[0],
      id: "graph-row-first",
      day: "2026-06-19",
      activity: "Graph row first",
      pathGroupId: "path-group-row-height",
      pathRole: "main" as const,
    };
    const secondItem = {
      ...tripFixture.planItems[1],
      id: "graph-row-second",
      day: "2026-06-19",
      activity: "Graph row second",
      pathGroupId: "path-group-row-height",
      pathRole: "main" as const,
      sortOrder: firstItem.sortOrder + 10,
    };

    renderTable({
      items: [firstItem, secondItem],
      graphItems: [firstItem, secondItem],
      selectedItemId: "graph-row-first",
    });

    const firstDot = screen.getByRole("button", {
      name: /Graph row first on Main/i,
    });
    const secondDot = screen.getByRole("button", {
      name: /Graph row second on Main/i,
    });
    expect(firstDot).toHaveStyle({ top: "59px" });
    expect(secondDot).toHaveStyle({ top: "118px" });
  });

  it("offers a keyboard fallback for changing an activity path", async () => {
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
  });

  it("keeps graph nodes selectable but disables graph path mutation for read-only roles", () => {
    const onMoveItemToPath = vi.fn();
    const onSelectItem = vi.fn();
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "graph-main",
      day: "2026-06-19",
      activity: "Graph main",
      pathRole: "main" as const,
    };
    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      role: "viewer",
      selectedItemId: "graph-main",
      onMoveItemToPath,
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

    const graphNode = screen.getByRole("button", {
      name: /Graph main on Main/i,
    });
    expect(graphNode).toBeEnabled();
    expect(graphNode).toHaveAttribute("draggable", "false");
    fireEvent.click(graphNode);
    expect(onSelectItem).toHaveBeenCalledWith("graph-main");
    expect(screen.getByLabelText(/Move Graph main to path/i)).toBeDisabled();
  });

  it("does not render graph gap marks between dot nodes", () => {
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

    expect(
      screen.queryByLabelText(/Free time gap 30 min on Main/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Gap .* on Main/i }),
    ).toHaveLength(2);
    expect(
      document.querySelector(".activity-path-graph-line--dashed"),
    ).toBeInTheDocument();
  });

  it("draws mixed-path graph lines through each overlapping plan", () => {
    const earlyItem = {
      ...tripFixture.planItems[0],
      id: "gap-early",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 30,
      activity: "Gap early",
      sortOrder: 100,
      pathGroupId: "gap-group",
      pathRole: "main" as const,
    };
    const branchItem = {
      ...tripFixture.planItems[1],
      id: "gap-branch",
      day: "2026-06-19",
      startTime: "08:15",
      durationMinutes: 30,
      activity: "Gap branch",
      sortOrder: 200,
      pathGroupId: "gap-group",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    const branchFollowUpItem = {
      ...tripFixture.planItems[2],
      id: "gap-branch-follow-up",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 30,
      activity: "Gap branch follow up",
      sortOrder: 250,
      pathGroupId: "gap-group",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    const lateItem = {
      ...tripFixture.planItems[3],
      id: "gap-late",
      day: "2026-06-19",
      startTime: "09:15",
      durationMinutes: 30,
      activity: "Gap late",
      sortOrder: 300,
      pathRole: "main" as const,
    };

    renderTable({
      items: [earlyItem, branchItem, branchFollowUpItem, lateItem],
      graphItems: [earlyItem, branchItem, branchFollowUpItem, lateItem],
      selectedItemId: "gap-early",
      showAllPaths: true,
    });

    expect(
      screen.queryByLabelText(/Free time gap 30 min on Main/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gap branch on Plan A/i }),
    ).toHaveClass("activity-path-graph-node");
    const earlyDot = screen.getByRole("button", { name: /Gap early on Main/i });
    const branchDot = screen.getByRole("button", {
      name: /Gap branch on Plan A/i,
    });
    const followUpDot = screen.getByRole("button", {
      name: /Gap branch follow up on Plan A/i,
    });
    const lateDot = screen.getByRole("button", { name: /Gap late on Main/i });
    expect(findGraphLine(earlyDot, branchDot)).toBeUndefined();
    const followUpLine = findGraphLine(earlyDot, followUpDot);
    const planFollowUpLine = findGraphLine(branchDot, followUpDot);
    const earlyReturnToMainLine = findGraphLine(branchDot, lateDot);
    const returnToMainLine = findGraphLine(followUpDot, lateDot);
    const followUpDotCenterY = Number.parseFloat(followUpDot.style.top) + 18;
    const returnEdgeY = followUpDotCenterY + 29.5;
    expect(followUpLine).toBeDefined();
    expect(planFollowUpLine).toBeUndefined();
    expect(earlyReturnToMainLine).toBeUndefined();
    expect(returnToMainLine?.getAttribute("d")).toContain(
      `L ${Number.parseFloat(lateDot.style.left)} ${returnEdgeY}`,
    );
    expect(returnToMainLine?.getAttribute("d")).toContain(
      `L ${Number.parseFloat(lateDot.style.left)} ${Number.parseFloat(lateDot.style.top) + 18}`,
    );
    expect(returnToMainLine).toHaveClass("activity-path-graph-line--dashed");
    expect(
      document.querySelectorAll(".activity-path-graph-line").length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("keeps same-plan gaps on the plan route but draws them as dashed", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "plan-gap-main",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 45,
      activity: "Plan gap main",
      sortOrder: 100,
      pathRole: "main" as const,
    };
    const firstPlanItem = {
      ...tripFixture.planItems[1],
      id: "plan-gap-first",
      day: "2026-06-19",
      startTime: "08:15",
      durationMinutes: 30,
      activity: "Plan gap first",
      sortOrder: 200,
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    const secondPlanItem = {
      ...tripFixture.planItems[2],
      id: "plan-gap-second",
      day: "2026-06-19",
      startTime: "09:15",
      durationMinutes: 30,
      activity: "Plan gap second",
      sortOrder: 300,
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    const lateMainItem = {
      ...tripFixture.planItems[3],
      id: "plan-gap-late-main",
      day: "2026-06-19",
      startTime: "10:15",
      durationMinutes: 30,
      activity: "Plan gap late main",
      sortOrder: 400,
      pathRole: "main" as const,
    };

    renderTable({
      items: [mainItem, firstPlanItem, secondPlanItem, lateMainItem],
      graphItems: [mainItem, firstPlanItem, secondPlanItem, lateMainItem],
      selectedItemId: "plan-gap-main",
      showAllPaths: true,
    });

    const firstPlanDot = screen.getByRole("button", {
      name: /Plan gap first on Plan A/i,
    });
    const secondPlanDot = screen.getByRole("button", {
      name: /Plan gap second on Plan A/i,
    });
    const lateMainDot = screen.getByRole("button", {
      name: /Plan gap late main on Main/i,
    });
    const planGapLine = findGraphLine(firstPlanDot, secondPlanDot);

    expect(planGapLine).toHaveClass("activity-path-graph-line--dashed");
    expect(findGraphLine(firstPlanDot, lateMainDot)).toBeUndefined();
  });

  it("routes main to a later plan only when that plan has no earlier branch entry", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "branch-main",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 45,
      activity: "Branch main",
      sortOrder: 100,
      pathRole: "main" as const,
    };
    const rainEntry = {
      ...tripFixture.planItems[1],
      id: "branch-rain-entry",
      day: "2026-06-19",
      startTime: "08:15",
      durationMinutes: 45,
      activity: "Branch rain entry",
      sortOrder: 200,
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
    };
    const rainFollowUp = {
      ...tripFixture.planItems[2],
      id: "branch-rain-follow-up",
      day: "2026-06-19",
      startTime: "09:00",
      durationMinutes: 30,
      activity: "Branch rain follow up",
      sortOrder: 300,
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
    };
    const planAEntry = {
      ...tripFixture.planItems[3],
      id: "branch-plan-a-entry",
      day: "2026-06-19",
      startTime: "09:10",
      durationMinutes: 30,
      activity: "Branch plan A entry",
      sortOrder: 400,
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };

    renderTable({
      items: [mainItem, rainEntry, rainFollowUp, planAEntry],
      graphItems: [mainItem, rainEntry, rainFollowUp, planAEntry],
      selectedItemId: "branch-main",
      showAllPaths: true,
    });

    const mainDot = screen.getByRole("button", {
      name: /Branch main on Main/i,
    });
    const rainFollowUpDot = screen.getByRole("button", {
      name: /Branch rain follow up on Rain plan/i,
    });
    const planAEntryDot = screen.getByRole("button", {
      name: /Branch plan A entry on Plan A/i,
    });
    expect(findGraphLine(mainDot, rainFollowUpDot)).toBeUndefined();
    expect(findGraphLine(mainDot, planAEntryDot)).toBeDefined();
  });

  it("routes a main node to a plan node that starts exactly when the next main row starts", () => {
    const requestedItems = [
      [
        "requested-main-0800",
        "08:00",
        60,
        100,
        "Main 08:00 block",
        undefined,
        undefined,
        "main",
      ],
      [
        "requested-main-0900",
        "09:00",
        120,
        200,
        "Main 09:00 block",
        undefined,
        undefined,
        "main",
      ],
      [
        "requested-plan-a-0900",
        "09:00",
        30,
        210,
        "Plan A 09:00 branch",
        "path-2026-06-19-sub-a",
        "Plan A",
        "alternative",
      ],
      [
        "requested-plan-a-1000",
        "10:00",
        60,
        300,
        "Plan A 10:00 follow up",
        "path-2026-06-19-sub-a",
        "Plan A",
        "alternative",
      ],
      [
        "requested-main-1100",
        "11:00",
        60,
        400,
        "Main 11:00 block",
        undefined,
        undefined,
        "main",
      ],
      [
        "requested-main-1200",
        "12:00",
        180,
        500,
        "Main 12:00 block",
        undefined,
        undefined,
        "main",
      ],
      [
        "requested-plan-a-1230",
        "12:30",
        60,
        510,
        "Plan A 12:30 branch",
        "path-2026-06-19-sub-a",
        "Plan A",
        "alternative",
      ],
      [
        "requested-main-1600",
        "16:00",
        60,
        600,
        "Main 16:00 block",
        undefined,
        undefined,
        "main",
      ],
    ].map(
      ([
        id,
        startTime,
        durationMinutes,
        sortOrder,
        activity,
        pathId,
        pathName,
        pathRole,
      ]) => ({
        ...tripFixture.planItems[0],
        id: id as string,
        day: "2026-06-19",
        startTime: startTime as string,
        durationMinutes: durationMinutes as number,
        sortOrder: sortOrder as number,
        activity: activity as string,
        pathId: pathId as string | undefined,
        pathName: pathName as string | undefined,
        pathRole:
          pathRole as (typeof tripFixture.planItems)[number]["pathRole"],
      }),
    );

    renderTable({
      items: requestedItems,
      graphItems: requestedItems,
      selectedItemId: "requested-main-0800",
      showAllPaths: true,
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

    const firstMainDot = screen.getByRole("button", {
      name: /Main 08:00 block on Main/i,
    });
    const nextMainDot = screen.getByRole("button", {
      name: /Main 09:00 block on Main/i,
    });
    const planEntryDot = screen.getByRole("button", {
      name: /Plan A 09:00 branch on Plan A/i,
    });
    const planFollowUpDot = screen.getByRole("button", {
      name: /Plan A 10:00 follow up on Plan A/i,
    });
    const returnMainDot = screen.getByRole("button", {
      name: /Main 11:00 block on Main/i,
    });
    const laterMainDot = screen.getByRole("button", {
      name: /Main 12:00 block on Main/i,
    });
    const laterPlanEntryDot = screen.getByRole("button", {
      name: /Plan A 12:30 branch on Plan A/i,
    });
    const branchEntryLine = findGraphLine(firstMainDot, planEntryDot);

    expect(branchEntryLine).toBeDefined();
    expect(branchEntryLine).not.toHaveClass("activity-path-graph-line--dashed");
    expect(findGraphLine(firstMainDot, nextMainDot)).not.toHaveClass(
      "activity-path-graph-line--dashed",
    );
    expect(findGraphLine(planFollowUpDot, returnMainDot)).toBeDefined();
    expect(findGraphLine(planFollowUpDot, laterPlanEntryDot)).toBeUndefined();
    expect(findGraphLine(returnMainDot, laterPlanEntryDot)).toHaveClass(
      "activity-path-graph-line--dashed",
    );
    expect(findGraphLine(laterMainDot, laterPlanEntryDot)).toBeUndefined();
    expect(findGraphLine(nextMainDot, planEntryDot)).toBeUndefined();
  });

  it("sizes the graph column from visible lanes instead of unused path options", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "single-lane-main",
      day: "2026-06-19",
      activity: "Single lane main",
      pathRole: "main" as const,
    };

    renderTable({
      items: [mainItem],
      graphItems: [mainItem],
      selectedItemId: "single-lane-main",
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        { id: "path-rain", name: "Rain plan", scope: "day", day: "2026-06-19" },
        {
          id: "path-2026-06-19-sub-a",
          name: "Plan A",
          scope: "day",
          day: "2026-06-19",
        },
      ],
    });

    expect(document.querySelector("col")?.getAttribute("style")).toContain(
      "width: 30px",
    );
    expect(
      screen.getByRole("button", { name: /Single lane main on Main/i }).style
        .left,
    ).toBe("15px");
  });

  it("expands the graph column when multiple plans have visible nodes", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "multi-lane-main",
      day: "2026-06-19",
      activity: "Multi lane main",
      pathRole: "main" as const,
    };
    const rainItem = {
      ...tripFixture.planItems[1],
      id: "multi-lane-rain",
      day: "2026-06-19",
      activity: "Multi lane rain",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
    };
    const planAItem = {
      ...tripFixture.planItems[2],
      id: "multi-lane-plan-a",
      day: "2026-06-19",
      activity: "Multi lane plan A",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };

    renderTable({
      items: [mainItem, rainItem, planAItem],
      graphItems: [mainItem, rainItem, planAItem],
      selectedItemId: "multi-lane-main",
      showAllPaths: true,
    });

    expect(document.querySelector("col")?.getAttribute("style")).toContain(
      "width: 66px",
    );
    expect(
      Number.parseFloat(
        screen.getByRole("button", { name: /Multi lane plan A on Plan A/i })
          .style.left,
      ),
    ).toBeGreaterThan(
      Number.parseFloat(
        screen.getByRole("button", { name: /Multi lane main on Main/i }).style
          .left,
      ),
    );
  });

  it("moves an overlapping activity dot to the Plan A position", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "overlap-main-dot",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 60,
      activity: "Overlap main dot",
      sortOrder: 100,
      pathRole: "main" as const,
    };
    const overlapItem = {
      ...tripFixture.planItems[1],
      id: "overlap-plan-a-dot",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 45,
      activity: "Overlap plan A dot",
      sortOrder: 200,
      pathRole: "main" as const,
    };

    renderTable({
      items: [mainItem, overlapItem],
      graphItems: [mainItem, overlapItem],
      selectedItemId: "overlap-main-dot",
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

    const mainDot = screen.getByRole("button", {
      name: /Overlap main dot on Main/i,
    });
    const planADot = screen.getByRole("button", {
      name: /Overlap plan A dot on Plan A/i,
    });
    const startToPlanALine = Array.from(
      document.querySelectorAll(".activity-path-graph-line"),
    ).find(
      (line) =>
        line.getAttribute("data-from-y") === "23.75" &&
        line.getAttribute("data-to-x") ===
          `${Number.parseFloat(planADot.style.left)}` &&
        line.getAttribute("data-to-y") ===
          `${Number.parseFloat(planADot.style.top) + 18}`,
    );
    const mainDotCenter = {
      x: Number.parseFloat(mainDot.style.left),
      y: Number.parseFloat(mainDot.style.top) + 18,
    };
    const planADotCenter = {
      x: Number.parseFloat(planADot.style.left),
      y: Number.parseFloat(planADot.style.top) + 18,
    };
    const dotToDotLine = Array.from(
      document.querySelectorAll(".activity-path-graph-line"),
    ).find(
      (line) =>
        line.getAttribute("data-from-x") === `${mainDotCenter.x}` &&
        line.getAttribute("data-from-y") === `${mainDotCenter.y}` &&
        line.getAttribute("data-to-x") === `${planADotCenter.x}` &&
        line.getAttribute("data-to-y") === `${planADotCenter.y}`,
    );
    expect(Number.parseFloat(planADot.style.left)).toBeGreaterThan(
      Number.parseFloat(mainDot.style.left),
    );
    expect(dotToDotLine).toBeUndefined();
    expect(startToPlanALine).toBeDefined();
    expect(startToPlanALine?.getAttribute("d")).toContain(" C ");
    expect(startToPlanALine?.getAttribute("d")).toContain("47.5");
    expect(screen.getByLabelText(/Start of Day 2/i)).toHaveClass(
      "activity-path-graph-anchor",
    );
    expect(screen.getByLabelText(/End of Day 2/i)).toHaveClass(
      "activity-path-graph-anchor",
    );
    expect(
      document.querySelectorAll(".activity-path-graph-line").length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("hides day path controls when the day only has the main plan", () => {
    renderTable({
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

    expect(screen.queryByLabelText(/Path for Day 1/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Clear path override for Day 1/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Path for Day 2/i)).toBeInTheDocument();
  });

  it("marks rows with pastel red only when they overlap inside the same plan", () => {
    const samePlanA = {
      ...tripFixture.planItems[0],
      id: "same-plan-a",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 120,
      sortOrder: 100,
      activity: "Same plan A",
      pathRole: "main" as const,
    };
    const samePlanB = {
      ...samePlanA,
      id: "same-plan-b",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      activity: "Same plan B",
    };
    renderTable({
      items: [samePlanA, samePlanB],
      selectedItemId: "same-plan-a",
    });

    expect(screen.getByRole("row", { name: /Same plan A/i })).toHaveClass(
      "data-row--path-overlap",
    );
    expect(screen.getByRole("row", { name: /Same plan B/i })).toHaveClass(
      "data-row--path-overlap",
    );
  });

  it("shows an auto fix button only for days with same-plan overlaps", async () => {
    const user = userEvent.setup();
    const samePlanA = {
      ...tripFixture.planItems[0],
      id: "same-plan-a",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 120,
      sortOrder: 100,
      activity: "Same plan A",
      pathRole: "main" as const,
    };
    const samePlanB = {
      ...samePlanA,
      id: "same-plan-b",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      activity: "Same plan B",
    };
    const onAutoResolveDayOverlaps = vi.fn();
    renderTable({
      items: [samePlanA, samePlanB],
      selectedItemId: "same-plan-a",
      onAutoResolveDayOverlaps,
    });

    expect(
      screen.queryByRole("button", { name: /Auto fix overlaps for Day 1/i }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Auto fix overlaps for Day 2/i }),
    );

    expect(onAutoResolveDayOverlaps).toHaveBeenCalledWith("2026-06-19");
  });

  it("does not mark rows that overlap across different plans", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "main-overlap",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 120,
      sortOrder: 100,
      activity: "Main overlap",
      pathGroupId: "path-group-overlap",
      pathRole: "main" as const,
    };
    const planAItem = {
      ...mainItem,
      id: "plan-a-overlap",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      activity: "Plan A overlap",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    renderTable({
      items: [mainItem, planAItem],
      selectedItemId: "main-overlap",
      showAllPaths: true,
    });

    expect(screen.getByRole("row", { name: /Main overlap/i })).not.toHaveClass(
      "data-row--path-overlap",
    );
    expect(
      screen.getByRole("row", { name: /Plan A overlap/i }),
    ).not.toHaveClass("data-row--path-overlap");
  });

  it("uses explicit controls for row selection instead of making table rows interactive", () => {
    const onSelectItem = vi.fn();
    const props = renderTable({ onSelectItem });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    expect(row).not.toHaveAttribute("tabindex");
    fireEvent.keyDown(row, { key: "Enter" });
    expect(props.onSelectItem).not.toHaveBeenCalled();

    const detailsButton = within(row).getByRole("button", {
      name: /เลือกจุด Dim Dim Sum/i,
    });
    expect(detailsButton).not.toHaveClass("sr-only");
    fireEvent.click(detailsButton);
    expect(props.onSelectItem).toHaveBeenCalledWith("item-dimdim");
    expect(
      within(row).getByRole("textbox", { name: /แก้ไขสถานที่ Dim Dim Sum/i }),
    ).toHaveValue("Shop G72, G/F, The Elements");
    onSelectItem.mockClear();
    fireEvent.keyDown(within(row).getByRole("link", { name: /แผนที่/i }), {
      key: "Enter",
      bubbles: true,
    });
    expect(props.onSelectItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /ย่อ วันที่ 2/i }));
    expect(
      document.querySelector('tr[aria-label*="Dim Dim Sum"]'),
    ).not.toBeInTheDocument();
  });

  it("exposes hybrid Tailwind bridge classes for the table shell and selected row", () => {
    renderTable({ selectedItemId: "item-dimdim" });

    const panel = screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i });
    expect(panel).toHaveClass("table-panel", "grid", "min-h-full");

    const scrollFrame = screen.getByLabelText(
      /รายการแผนการเดินทางแบบเลื่อนได้/i,
    );
    expect(scrollFrame).toHaveClass(
      "table-scroll",
      "overflow-x-auto",
      "rounded-(--radius-md)",
    );

    const table = screen.getByRole("table", {
      name: /รายการแผนการเดินทาง แยกตามวัน/i,
    });
    expect(table).toHaveClass("smart-table", "w-full", "min-w-[1080px]");

    const selectedRow = screen.getByRole("row", { name: /Dim Dim Sum/i });
    expect(selectedRow).toHaveClass("data-row", "data-row--selected");
    expect(
      within(selectedRow).getByRole("button", {
        name: /เลือกจุด Dim Dim Sum/i,
      }),
    ).toHaveClass("row-select", "inline-flex", "min-w-0");
    expect(
      within(selectedRow).getByRole("link", { name: /แผนที่/i }),
    ).toHaveClass("map-link", "underline");
  });

  it("saves visible row fields from flat inline controls", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    renderTable({ onUpdateItemInline });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    const activity = within(row).getByRole("textbox", {
      name: /แก้ไขกิจกรรม Dim Dim Sum/i,
    });
    await user.clear(activity);
    await user.type(activity, "Harbour brunch{Enter}");

    const place = within(row).getByRole("textbox", {
      name: /แก้ไขสถานที่ Dim Dim Sum/i,
    });
    await user.clear(place);
    await user.type(place, "Central Pier{Enter}");

    const time = within(row).getByLabelText(/แก้ไขเวลา Dim Dim Sum/i);
    await user.clear(time);
    await user.type(time, "10:15{Enter}");

    await user.click(
      within(row).getByRole("button", { name: /แก้ไขประเภท Dim Dim Sum/i }),
    );
    const typeMenu = screen.getByRole("listbox", {
      name: /แก้ไขประเภท Dim Dim Sum/i,
    });
    expect(typeMenu.closest(".table-scroll")).toBeNull();
    await user.click(
      within(typeMenu).getByRole("option", { name: /กิจกรรม/i }),
    );

    const transportation = within(row).getByRole("textbox", {
      name: /แก้ไขการเดินทาง Dim Dim Sum/i,
    });
    await user.clear(transportation);
    await user.type(transportation, "Walk{Enter}");

    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      activity: "Harbour brunch",
    });
    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      place: "Central Pier",
    });
    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      startTime: "10:15",
    });
    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      activityType: "experience",
    });
    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      transportation: "Walk",
    });
  });

  it("edits duration from a compact row duration picker", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    renderTable({ onUpdateItemInline });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    await user.click(
      within(row).getByRole("button", { name: /แก้ไขระยะเวลา Dim Dim Sum/i }),
    );
    const durationEditor = screen.getByRole("region", {
      name: /แก้ไขระยะเวลา Dim Dim Sum/i,
    });
    expect(
      screen.queryByRole("dialog", { name: /แก้ไขระยะเวลา Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    expect(durationEditor.closest("tr")).toBe(row);
    await user.click(
      within(durationEditor).getByRole("button", { name: /1 h 30 m/i }),
    );

    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      durationMinutes: 90,
    });
    expect(
      screen.queryByRole("region", { name: /แก้ไขระยะเวลา Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
  });

  it("saves a custom duration from the row duration picker", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    renderTable({ onUpdateItemInline });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    await user.click(
      within(row).getByRole("button", { name: /แก้ไขระยะเวลา Dim Dim Sum/i }),
    );
    const editor = screen.getByRole("region", {
      name: /แก้ไขระยะเวลา Dim Dim Sum/i,
    });
    await user.clear(
      within(editor).getByRole("spinbutton", { name: /ชั่วโมง/i }),
    );
    await user.type(
      within(editor).getByRole("spinbutton", { name: /ชั่วโมง/i }),
      "2",
    );
    await user.clear(within(editor).getByRole("spinbutton", { name: /นาที/i }));
    await user.type(
      within(editor).getByRole("spinbutton", { name: /นาที/i }),
      "10",
    );
    await user.click(within(editor).getByRole("button", { name: /บันทึก/i }));

    expect(onUpdateItemInline).toHaveBeenCalledWith("item-dimdim", {
      durationMinutes: 130,
    });
  });

  it("cancels a flat inline edit with Escape", async () => {
    const user = userEvent.setup();
    const onUpdateItemInline = vi.fn();
    renderTable({ onUpdateItemInline });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });
    const activity = within(row).getByRole("textbox", {
      name: /แก้ไขกิจกรรม Dim Dim Sum/i,
    });

    await user.clear(activity);
    await user.type(activity, "Wrong value");
    await user.keyboard("{Escape}");

    expect(activity).toHaveValue("Dim Dim Sum ที่ Tim Ho Wan");
    expect(onUpdateItemInline).not.toHaveBeenCalled();
  });

  it("keeps inline row fields read-only for viewer roles", () => {
    renderTable({ role: "viewer", onUpdateItemInline: vi.fn() });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    expect(
      within(row).getByRole("textbox", { name: /กิจกรรม Dim Dim Sum/i }),
    ).toHaveAttribute("readonly");
    expect(
      within(row).getByRole("textbox", { name: /สถานที่ Dim Dim Sum/i }),
    ).toHaveAttribute("readonly");
    expect(
      within(row).getByLabelText(/^แก้ไขเวลา Dim Dim Sum/i),
    ).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: /ระยะเวลา Dim Dim Sum/i }),
    ).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: /ประเภท Dim Dim Sum/i }),
    ).toBeDisabled();
    expect(
      within(row).getByRole("textbox", { name: /การเดินทาง Dim Dim Sum/i }),
    ).toHaveAttribute("readonly");
  });

  it("shows row action buttons in the last column", async () => {
    const user = userEvent.setup();
    const onEditItem = vi.fn();
    const onDeleteItem = vi.fn();
    const props = renderTable({ onEditItem, onDeleteItem });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    expect(
      within(row).getByRole("button", { name: /ลาก Dim Dim Sum/i }),
    ).toHaveClass("drag-handle");
    expect(
      screen.getByRole("columnheader", { name: /จัดการ/i }),
    ).toBeInTheDocument();

    await user.click(
      within(row).getByRole("button", { name: /แก้ไข Dim Dim Sum/i }),
    );
    await user.click(
      within(row).getByRole("button", { name: /ลบ Dim Dim Sum/i }),
    );

    expect(
      within(row).getByRole("button", { name: /ย้าย Dim Dim Sum .* ขึ้น/i }),
    ).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: /ย้าย Dim Dim Sum .* ลง/i }),
    ).toBeEnabled();
    expect(onEditItem).toHaveBeenCalledWith("item-dimdim");
    expect(onDeleteItem).not.toHaveBeenCalled();
    expect(props.onMoveItem).not.toHaveBeenCalled();
  });

  it("requires Yes before deleting a row and cancels with No", async () => {
    const user = userEvent.setup();
    const onDeleteItem = vi.fn();
    renderTable({ onDeleteItem });
    const row = screen.getByRole("row", { name: /Dim Dim Sum/i });

    await user.click(
      within(row).getByRole("button", { name: /ลบ Dim Dim Sum/i }),
    );
    const firstDialog = screen.getByRole("dialog", {
      name: /ยืนยันการลบ Dim Dim Sum/i,
    });
    expect(onDeleteItem).not.toHaveBeenCalled();

    await user.click(
      within(firstDialog).getByRole("button", { name: /ไม่ลบ/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i }),
    ).not.toBeInTheDocument();

    await user.click(
      within(row).getByRole("button", { name: /ลบ Dim Dim Sum/i }),
    );
    await user.click(
      within(
        screen.getByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i }),
      ).getByRole("button", { name: /ลบกิจกรรม/i }),
    );

    expect(onDeleteItem).toHaveBeenCalledWith("item-dimdim");
    expect(
      screen.queryByRole("dialog", { name: /ยืนยันการลบ Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
  });

  it("reorders rows from a touch drag on the handle", () => {
    const props = renderTable();
    const sourceHandle = screen.getByRole("button", {
      name: /ลาก Victoria Peak/i,
    });
    const targetRow = screen
      .getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })
      .closest("tr")!;
    const originalElementFromPoint = document.elementFromPoint;
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => targetRow),
    });

    fireEvent.touchStart(sourceHandle, {
      changedTouches: [{ identifier: 7, clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(window, {
      changedTouches: [{ identifier: 7, clientX: 20, clientY: 20 }],
    });
    fireEvent.touchEnd(window, {
      changedTouches: [{ identifier: 7, clientX: 20, clientY: 20 }],
    });

    expect(props.onMoveItem).toHaveBeenCalledWith(
      "item-victoria-peak",
      "item-dimdim",
    );
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: originalElementFromPoint,
    });
  });

  it("prevents dragging when role or restructure settings disallow editing", () => {
    renderTable({ role: "viewer", canRestructure: false });

    const actions = screen.getByRole("group", { name: /คำสั่งแผนการเดินทาง/i });
    expect(
      within(actions).getByRole("button", { name: /Import|นำเข้า/i }),
    ).toBeDisabled();
    expect(
      screen.getByText("ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ลาก Dim Dim Sum/i }),
    ).toBeDisabled();
  });

  it("shows every trip day and offers an empty add row at the bottom of each day", async () => {
    const user = userEvent.setup();
    const onAddStop = vi.fn();
    renderTable({
      endDate: "2026-06-20",
      items: [tripFixture.planItems[0]],
      onAddStop,
      startDate: "2026-06-18",
    });

    expect(
      screen.getByRole("button", { name: /ย่อ วันที่ 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ย่อ วันที่ 2/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ย่อ วันที่ 3/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 3/i }),
    );
    expect(onAddStop).toHaveBeenCalledWith("2026-06-20");
  });

  it("ignores drag previews and drops that cannot move an item", () => {
    const props = renderTable({ canRestructure: false });
    const dataTransfer = createDataTransfer();
    const row = screen
      .getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })
      .closest("tr")!;

    fireEvent.dragOver(row, { dataTransfer });
    fireEvent.drop(row, { dataTransfer });

    expect(props.onMoveItem).not.toHaveBeenCalled();
    expect(row).not.toHaveClass("data-row--drop-target");
  });

  it("drops a dragged item onto a different day add row", () => {
    const onMoveItemToDay = vi.fn();
    const props = renderTable({ onMoveItemToDay });
    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "item-dimdim");

    fireEvent.dragOver(
      screen
        .getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 3/i })
        .closest("tr")!,
      { dataTransfer },
    );
    fireEvent.drop(
      screen
        .getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 3/i })
        .closest("tr")!,
      { dataTransfer },
    );

    expect(props.onMoveItemToDay).toHaveBeenCalledWith(
      "item-dimdim",
      "2026-06-20",
    );
  });

  it("ignores missing and self-targeted drag payloads", () => {
    const props = renderTable();
    const row = screen
      .getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })
      .closest("tr")!;

    fireEvent.dragOver(row, { dataTransfer: createDataTransfer() });
    expect(row).not.toHaveClass("data-row--drop-target");

    const selfTransfer = createDataTransfer();
    selfTransfer.setData("text/plain", "item-dimdim");
    fireEvent.dragOver(row, { dataTransfer: selfTransfer });
    fireEvent.drop(row, { dataTransfer: selfTransfer });

    expect(props.onMoveItem).not.toHaveBeenCalled();
  });
});

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => values.set(type, value),
  };
}
