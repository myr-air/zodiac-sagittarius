import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  defaultPathOptionsForPanel,
  pathIdStoryPlanA,
  openHeaderControls,
  renderSmartItineraryTable,
} from "@/src/features/itinerary/testing";
import { weatherBriefings } from "@/src/shared/components/weather";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable", () => {
  it("uses English itinerary shell labels by default and Thai after switching", () => {
    renderWithI18n(
      <>
        <LanguageSwitch />
        <SmartItineraryTable
          canRestructure
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
          onChangeTripPlan={vi.fn()}
          onChangeTripPlanStatus={vi.fn()}
          onSetMainTripPlan={vi.fn()}
          onCreateTripPlan={vi.fn()}
          onRenameTripPlan={vi.fn()}
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
      pathOptions: [...defaultPathOptionsForPanel],
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
      pathIdStoryPlanA,
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

});
