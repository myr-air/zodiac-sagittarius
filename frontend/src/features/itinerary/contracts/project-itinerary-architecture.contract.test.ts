import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary architecture contracts", () => {
  it("keeps itinerary day group header split from row body rendering", () => {
    const dayGroup = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.tsx");
    const dayGroupActivityRows = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/DayGroupActivityRows.tsx");
    const dayGroupGraphCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/DayGroupGraphCell.tsx");
    const dayGroupHeader = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/DayGroupHeader.tsx");
    const dayTitleEditor = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-title-editor.tsx");
    const dayTitleEditorActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/use-day-title-editor-actions.ts");
    const dayTitleEditorState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-title-editor-state.ts");
    const dayGroupTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.types.ts");

    expect(dayGroup).toContain("./DayGroupHeader");
    expect(dayGroup).toContain("./DayGroupActivityRows");
    expect(dayGroup).toContain("./DayGroupGraphCell");
    expect(dayGroup).toContain("./day-group.types");
    expect(dayGroup).not.toContain("ActivityPathGraphDay");
    expect(dayGroup).not.toContain("ActivityCell");
    expect(dayGroup).not.toContain("addStopInlineButtonClassName");
    expect(dayGroup).not.toContain("DayTitleEditor");
    expect(dayGroup).not.toContain("DayPathControls");
    expect(dayGroupActivityRows).toContain("ActivityCell");
    expect(dayGroupActivityRows).toContain("addStopInlineButtonClassName");
    expect(dayGroupGraphCell).toContain("ActivityPathGraphDay");
    expect(dayGroupHeader).toContain("export function DayGroupHeader");
    expect(dayGroupHeader).toContain("DayTitleEditor");
    expect(dayGroupHeader).toContain("DayPathControls");
    expect(dayTitleEditor).toContain("./day-title-editor-state");
    expect(dayTitleEditor).toContain("./use-day-title-editor-actions");
    expect(dayTitleEditor).toContain("const [state, setState]");
    expect(dayTitleEditor).toContain("const actions = useDayTitleEditorActions");
    expect(dayTitleEditor).not.toContain("async function commit");
    expect(dayTitleEditor).not.toContain("useRef");
    expect(dayTitleEditor).not.toContain("const [draft, setDraft]");
    expect(dayTitleEditor).not.toContain("const [sourceTitle, setSourceTitle]");
    expect(dayTitleEditor).not.toContain("const [saving, setSaving]");
    expect(dayTitleEditorActions).toContain("export function useDayTitleEditorActions");
    expect(dayTitleEditorActions).toContain("async function commit");
    expect(dayTitleEditorActions).toContain("revertWithoutCommit");
    expect(dayTitleEditorState).toContain("export interface DayTitleEditorState");
    expect(dayTitleEditorState).toContain("initialDayTitleEditorState");
    expect(dayGroupTypes).toContain("export interface DayGroupProps");
  });

  it("keeps trip plan controls state split from control rendering", () => {
    const controls = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableTripPlanControls.tsx");
    const controlsState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/use-trip-plan-controls-state.ts");
    const controlsActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/use-trip-plan-controls-actions.ts");
    const controlsDraftState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/trip-plan-controls-draft-state.ts");
    const headerControls = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableHeaderControls.tsx");
    const headerControlsHook = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryHeaderControls.ts");
    const headerControlsState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-header-controls-state.ts");
    const tripPlanControlsStory = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/storybook/SmartItineraryTableTripPlanControls.stories.tsx");
    const pathFiltersStory = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/storybook/SmartItineraryTablePathFilters.stories.tsx");

    expect(controls).toContain("./use-trip-plan-controls-state");
    expect(controls).not.toContain("useState");
    expect(controls).not.toContain("function submitNewTripPlan");
    expect(controls).not.toContain("tripPlanStatus(");
    expect(controlsState).toContain("export function useTripPlanControlsState");
    expect(controlsState).toContain("./trip-plan-controls-draft-state");
    expect(controlsState).toContain("./use-trip-plan-controls-actions");
    expect(controlsState).toContain("const [draftState, setDraftState]");
    expect(controlsState).not.toContain("function submitNewTripPlan");
    expect(controlsState).not.toContain("function submitRenameTripPlan");
    expect(controlsState).toContain("tripPlanStatus(");
    expect(controlsActions).toContain("export function useTripPlanControlsActions");
    expect(controlsActions).toContain("function submitNewTripPlan");
    expect(controlsActions).toContain("function submitRenameTripPlan");
    expect(controlsActions).toContain("clearTripPlanDraftError");
    expect(controlsActions).toContain("markTripPlanRenamed");
    expect(controlsState).not.toContain("interface TripPlanControlDraftState");
    expect(controlsState).not.toContain("const [isCreatingTripPlan, setIsCreatingTripPlan]");
    expect(controlsState).not.toContain("const [newTripPlanName, setNewTripPlanName]");
    expect(controlsDraftState).toContain("export interface TripPlanControlDraftState");
    expect(controlsDraftState).toContain("initialTripPlanControlDraftState");
    expect(controlsDraftState).toContain("resolveEditedTripPlanName");
    expect(headerControls).toContain("./hooks/useSmartItineraryHeaderControls");
    expect(headerControls).not.toContain("./smart-itinerary-header-controls-state");
    expect(headerControls).not.toContain("useState");
    expect(headerControls).not.toContain("useEffect");
    expect(headerControls).not.toContain("useRef");
    expect(headerControls).not.toContain("useDismissOnOutside");
    expect(headerControlsHook).toContain("../smart-itinerary-header-controls-state");
    expect(headerControlsHook).toContain("export function useSmartItineraryHeaderControls");
    expect(headerControlsHook).toContain("const [headerControlsState, setHeaderControlsState]");
    expect(headerControlsHook).toContain("useDismissOnOutside");
    expect(headerControls).not.toContain("const [headerControlsExpanded, setHeaderControlsExpanded]");
    expect(headerControls).not.toContain("const [renderHeaderControls, setRenderHeaderControls]");
    expect(headerControlsState).toContain("export interface SmartItineraryHeaderControlsState");
    expect(headerControlsState).toContain("toggleSmartItineraryHeaderControls");
    expect(tripPlanControlsStory).toContain("SmartItineraryTableTripPlanControlsProps");
    expect(tripPlanControlsStory).not.toContain("ComponentProps<typeof SmartItineraryTableTripPlanControls>");
    expect(pathFiltersStory).toContain("SmartItineraryTablePathFiltersProps");
    expect(pathFiltersStory).not.toContain("ComponentProps<typeof SmartItineraryTablePathFilters>");
  });

  it("keeps smart itinerary item action prop contracts centralized", () => {
    const actionTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/itinerary-action.types.ts");
    const tableTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.types.ts");
    const tableBody = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableBody.tsx");
    const dayGroupTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.types.ts");
    const activityCellTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts");
    const subActivityTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/sub-activity.types.ts");

    expect(actionTypes).toContain("export interface ItineraryBookingActionProps");
    expect(actionTypes).toContain("export interface ItineraryNestedActivityActionProps");
    expect(actionTypes).toContain("export interface ItineraryItemInteractionProps");
    expect(actionTypes).toContain("export interface ItineraryInlineItemEditProps");
    [
      tableTypes,
      tableBody,
      dayGroupTypes,
      activityCellTypes,
      subActivityTypes,
    ].forEach((source) => {
      expect(source).toContain("ItineraryBookingActionProps");
      expect(source).toContain("ItineraryNestedActivityActionProps");
      expect(source).toContain("ItineraryInlineItemEditProps");
      expect(source).not.toContain("onAddBookingForItem?: (");
      expect(source).not.toContain("onAddSubActivity?: (parentItemId: string)");
      expect(source).not.toContain("onUpdateItemInline?: (");
    });
    [
      tableTypes,
      tableBody,
      dayGroupTypes,
      activityCellTypes,
    ].forEach((source) => expect(source).toContain("ItineraryItemInteractionProps"));
    expect(subActivityTypes).not.toContain("ItineraryItemInteractionProps");
  });

  it("keeps itinerary page header metadata centralized", () => {
    const itineraryHeaderMeta = readItineraryArchitectureSource("src/features/itinerary/components/ItineraryHeaderMeta.tsx");
    const itineraryHeaderMetaStory = readItineraryArchitectureSource("src/features/itinerary/components/storybook/ItineraryHeaderMeta.stories.tsx");
    const timelineView = readItineraryArchitectureSource("src/features/itinerary/components/TimelineView.tsx");
    const tableMeta = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableMeta.tsx");

    expect(itineraryHeaderMeta).toContain("export function ItineraryHeaderMeta");
    expect(itineraryHeaderMeta).toContain("formatTripRange");
    expect(itineraryHeaderMeta).toContain("formatDuration");
    expect(itineraryHeaderMetaStory).toContain("ItineraryHeaderMeta");
    expect(itineraryHeaderMetaStory).toContain("Thai");
    [timelineView, tableMeta].forEach((source) => {
      expect(source).toContain("ItineraryHeaderMeta");
      expect(source).not.toContain("formatTripRange");
      expect(source).not.toContain("warningCount({ count:");
    });
  });

  it("keeps activity cell title editing and actions split from shell layout", () => {
    const activityCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCell.tsx");
    const activityCellBody = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellBody.tsx");
    const activityCellRails = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellRails.tsx");
    const titleLine = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellTitleLine.tsx");
    const actionGroup = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellActionGroup.tsx");
    const actionButtons = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityActionButtons.tsx");
    const actionButton = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityActionButton.tsx");
    const activityActionLabels = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-activity-actions.ts");
    const inlineActivityField = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/InlineActivityField.tsx");
    const inlineActivityFieldActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-inline-activity-field-actions.ts");
    const inlineActivityFieldState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/inline-activity-field-state.ts");

    expect(activityCell).toContain("./ActivityCellBody");
    expect(activityCell).toContain("./ActivityCellRails");
    expect(activityCell).not.toContain("./ActivityCellTitleLine");
    expect(activityCell).not.toContain("./ActivityCellActionGroup");
    expect(activityCell).not.toContain("./ActivityTimeButton");
    expect(activityCell).not.toContain("./ActivityTypePicker");
    expect(activityCellBody).toContain("./ActivityCellTitleLine");
    expect(activityCellBody).toContain("./ActivityCellActionGroup");
    expect(activityCellBody).toContain("./ActivityCellMeta");
    expect(activityCellRails).toContain("./ActivityTimeButton");
    expect(activityCellRails).toContain("./ActivityTypePicker");
    expect(activityCell).not.toContain("./InlineActivityField");
    expect(activityCell).not.toContain("./ActivityActionButtons");
    expect(titleLine).toContain("export function ActivityCellTitleLine");
    expect(titleLine).toContain("InlineActivityField");
    expect(inlineActivityField).toContain("./inline-activity-field-state");
    expect(inlineActivityField).toContain("./use-inline-activity-field-actions");
    expect(inlineActivityField).toContain("const [state, setState]");
    expect(inlineActivityField).toContain("const actions = useInlineActivityFieldActions");
    expect(inlineActivityField).not.toContain("async function commit");
    expect(inlineActivityField).not.toContain("const [draft, setDraft]");
    expect(inlineActivityField).not.toContain("const [source, setSource]");
    expect(inlineActivityFieldActions).toContain("export function useInlineActivityFieldActions");
    expect(inlineActivityFieldActions).toContain("async function commit");
    expect(inlineActivityFieldActions).toContain("function reset");
    expect(inlineActivityFieldState).toContain("export interface InlineActivityFieldState");
    expect(inlineActivityFieldState).toContain("initialInlineActivityFieldState");
    expect(actionGroup).toContain("export function ActivityCellActionGroup");
    expect(actionGroup).toContain("ActivityActionButtons");
    expect(actionButtons).toContain("./ActivityActionButton");
    expect(actionButtons).toContain("@/src/features/itinerary/domain/itinerary-activity-actions");
    expect(actionButtons).not.toContain('locale === "th"');
    expect(actionButtons).not.toContain("event.stopPropagation");
    expect(actionButton).toContain("export function ActivityActionButton");
    expect(actionButton).toContain("event.stopPropagation");
    expect(activityActionLabels).toContain("export function activityNoteActionLabel");
    expect(activityActionLabels).toContain("export function activityMapActionLabel");
  });

  it("keeps smart itinerary path filter state split from table derived state", () => {
    const table = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.tsx");
    const tablePageState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryTablePageState.ts");
    const tableState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryTableState.ts");
    const tableStateModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-state.ts");
    const pathFilters = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryPathFilters.ts");

    expect(table).toContain("./hooks/useSmartItineraryTablePageState");
    expect(table).not.toContain("@/src/i18n/I18nProvider");
    expect(table).not.toContain("./hooks/useSmartItineraryTableState");
    expect(tablePageState).toContain("export function useSmartItineraryTablePageState");
    expect(tablePageState).toContain("@/src/i18n/I18nProvider");
    expect(tablePageState).toContain("./useSmartItineraryTableState");
    expect(tableState).toContain("./useSmartItineraryPathFilters");
    expect(tableState).toContain("../smart-itinerary-table-state");
    expect(tableState).not.toContain("export interface SmartItineraryTableState");
    expect(tableState).not.toContain("interface SmartItineraryTableFilterState");
    expect(tableState).not.toContain("knownFilterIdsRef");
    expect(tableState).not.toContain("itineraryItemPathId");
    expect(tableStateModel).toContain("export interface SmartItineraryTableState");
    expect(tableStateModel).toContain("export function toggleCollapsedDay");
    expect(pathFilters).toContain("export function useSmartItineraryPathFilters");
    expect(pathFilters).toContain("knownFilterIdsRef");
    expect(pathFilters).toContain("itineraryItemPathId");
  });

});
