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

  it("keeps context rail booking display labels in the itinerary booking domain", () => {
    const bookingDocItem = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailBookingDocItem.tsx");
    const bookingDocItemModel = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/context-rail-booking-doc-item-model.ts");
    const bookingSection = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailBookingSection.tsx");
    const contextRailItemActionButtons = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailItemActionButtons.tsx");
    const contextRailItemActionButtonsStory = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/storybook/ContextRailItemActionButtons.stories.tsx");
    const noteItem = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailNoteItem.tsx");
    const expenseItem = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailExpenseItem.tsx");
    const suggestionsSection = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailSuggestionsSection.tsx");
    const contextRailUtils = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/context-rail.utils.ts");
    const bookingDisplay = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-booking-display.ts");
    const contextRailDisplay = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-context-rail-display.ts");

    expect(bookingDocItem).toContain("@/src/features/itinerary/domain/itinerary-booking-display");
    expect(bookingDocItem).toContain("./context-rail-booking-doc-item-model");
    expect(bookingDocItem).not.toContain("function bookingDocQuickFieldCopy");
    expect(bookingDocItem).not.toContain("function getDraftValue");
    expect(bookingDocItemModel).toContain("export function bookingDocQuickFieldCopy");
    expect(bookingDocItemModel).toContain("bookingDocQuickFieldPatchFromDraft");
    [noteItem, expenseItem].forEach((source) => {
      expect(source).toContain("./ContextRailItemActionButtons");
      expect(source).not.toContain("noteActionButtonClassName");
      expect(source).not.toContain("noteActionsClassName");
    });
    expect(contextRailItemActionButtons).toContain("export function ContextRailItemActionButtons");
    expect(contextRailItemActionButtons).toContain("noteActionButtonClassName");
    expect(contextRailItemActionButtons).toContain("noteActionsClassName");
    expect(contextRailItemActionButtonsStory).toContain("ContextRailItemActionButtons");
    expect(contextRailItemActionButtonsStory).toContain("Disabled");
    [bookingDocItem, bookingSection, noteItem, suggestionsSection].forEach(
      (source) =>
        expect(source).toContain(
          "@/src/features/itinerary/domain/itinerary-context-rail-display",
        ),
    );
    expect(contextRailUtils).not.toContain("function formatBookingDocTypeLabel");
    expect(contextRailUtils).not.toContain("function suggestionLabel");
    expect(contextRailUtils).not.toContain("function memberDisplayName");
    expect(contextRailUtils).not.toContain("bookingDocTypeOptions");
    expect(contextRailUtils).not.toContain("taskKindLabel");
    expect(bookingDisplay).toContain("export function formatBookingDocTypeLabel");
    expect(contextRailDisplay).toContain("export const bookingDocTypeOptions");
    expect(contextRailDisplay).toContain("export function suggestionLabel");
    expect(contextRailDisplay).toContain("export function memberDisplayName");
    expect(contextRailDisplay).toContain("export { taskKindLabel }");
  });

  it("keeps itinerary ticket modal form state split from modal render", () => {
    const noteModal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryNoteModal.tsx");
    const noteModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-note-modal-model.ts");
    const noteActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-note-modal-actions.ts");
    const noteState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/itinerary-note-modal-state.ts");
    const noteDisplay = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-note-display.ts");
    const modalHeader = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalHeader.tsx");
    const modalActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalActions.tsx");
    const ticketModal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModal.tsx");
    const modalPortal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalPortal.tsx");
    const bookingButton = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryBookingButton.tsx");
    const exports = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/components.tsx");
    const ticketFooter = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalFooter.tsx");
    const ticketSections = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalSections.tsx");
    const existingTicketList = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ExistingTicketList.tsx");
    const ticketFieldGrid = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/TicketFieldGrid.tsx");
    const linkedActivitiesPicker = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/LinkedActivitiesPicker.tsx");
    const ticketModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-modal-model.ts");
    const ticketActions = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-modal-actions.ts");
    const ticketFormValues = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-form-values.ts");
    const ticketViewState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/itinerary-ticket-modal-view-state.ts");
    const ticketForm = readItineraryArchitectureSource("src/features/itinerary/domain/booking-ticket-form.ts");

    expect(noteModal).toContain("./use-itinerary-note-modal-model");
    expect(noteModal).toContain("./ActivityCellModalHeader");
    expect(noteModal).not.toContain("useState");
    expect(noteModel).toContain("export function useItineraryNoteModalModel");
    expect(noteModel).toContain("@/src/features/itinerary/domain/itinerary-note-display");
    expect(noteModel).toContain("./itinerary-note-modal-state");
    expect(noteModel).toContain("./use-itinerary-note-modal-actions");
    expect(noteModel).toContain("const [state, setState]");
    expect(noteModel).not.toContain("async function submit");
    expect(noteActions).toContain("export function useItineraryNoteModalActions");
    expect(noteActions).toContain("async function submit");
    expect(noteActions).toContain("buildItineraryNoteModalSubmission");
    expect(noteActions).toContain("setItineraryNoteModalSaving");
    expect(noteState).toContain("export function buildItineraryNoteModalSubmission");
    expect(noteModel).not.toContain('locale === "th"');
    expect(noteModel).not.toContain("Close note modal");
    expect(noteModel).not.toContain("const [body, setBody]");
    expect(noteModel).not.toContain("const [saving, setSaving]");
    expect(noteDisplay).toContain("export function itineraryNoteModalCopy");
    expect(noteDisplay).toContain("export interface ItineraryNoteModalCopy");
    expect(ticketModal).toContain("./use-itinerary-ticket-modal-model");
    expect(ticketModal).toContain("./ActivityCellModalHeader");
    expect(bookingButton).toContain("export function ItineraryBookingButton");
    expect(bookingButton).toContain("./ItineraryTicketModal");
    expect(exports).toContain("./activity-cell/ItineraryBookingButton");
    expect(exports).toContain("./activity-cell/ItineraryTicketModal");
    expect(exports).not.toContain("BookingComponents");
    expect(ticketModal).toContain("./ItineraryTicketModalFooter");
    expect(ticketModal).toContain("./ItineraryTicketModalSections");
    expect(ticketModal).toContain("./ActivityCellModalPortal");
    expect(ticketModal).not.toContain("createPortal");
    expect(ticketModal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(ticketModal).not.toContain("useState");
    expect(ticketModal).not.toContain("buildTicketSubmitInput");
    expect(ticketModal).not.toContain("formatBookingSummary");
    expect(ticketModal).not.toContain("DateTimePickerField");
    expect(ticketFooter).toContain("export function ItineraryTicketModalFooter");
    expect(ticketSections).toContain("export { TicketModeToggle }");
    expect(ticketSections).toContain("export { TicketFieldGrid }");
    expect(ticketSections).toContain("export { LinkedActivitiesPicker }");
    expect(existingTicketList).toContain("export function ExistingTicketList");
    expect(existingTicketList).toContain("formatBookingSummary");
    expect(ticketFieldGrid).toContain("export function TicketFieldGrid");
    expect(ticketFieldGrid).toContain("DateTimePickerField");
    expect(linkedActivitiesPicker).toContain("export function LinkedActivitiesPicker");
    expect(linkedActivitiesPicker).toContain("toggleId");
    expect(ticketModel).toContain("export function useItineraryTicketModalModel");
    expect(ticketModel).toContain("@/src/features/itinerary/domain/booking-ticket-form");
    expect(ticketModel).toContain("./use-itinerary-ticket-modal-actions");
    expect(ticketModel).toContain("./use-itinerary-ticket-form-values");
    expect(ticketModel).toContain("./itinerary-ticket-modal-view-state");
    expect(ticketModel).toContain("const [viewState, setViewState]");
    expect(ticketModel).not.toContain("buildTicketSubmitInput");
    expect(ticketModel).not.toContain("beginItineraryTicketModalViewSave");
    expect(ticketActions).toContain("export function useItineraryTicketModalActions");
    expect(ticketActions).toContain("buildTicketSubmitInput");
    expect(ticketActions).toContain("beginItineraryTicketModalViewSave");
    expect(ticketActions).toContain("beginItineraryTicketModalViewUnlink");
    expect(ticketModel).not.toContain("type TicketFormValues");
    expect(ticketModel).not.toContain("const [formValues, setFormValues]");
    expect(ticketModel).not.toContain("@/src/shared/form-state");
    expect(ticketModel).not.toContain("function updateTicketField");
    expect(ticketFormValues).toContain("export function useItineraryTicketFormValues");
    expect(ticketFormValues).toContain("type TicketFormValues");
    expect(ticketFormValues).toContain("const [formValues, setFormValues]");
    expect(ticketFormValues).toContain("@/src/shared/form-state");
    expect(ticketFormValues).toContain("function updateTicketField");
    expect(ticketFormValues).toContain("buildTicketFormValues");
    expect(ticketModel).not.toContain("function buildTicketSubmitInput");
    expect(ticketModel).not.toContain("const [mode, setMode]");
    expect(ticketModel).not.toContain("const [selectedBookingId, setSelectedBookingId]");
    expect(ticketModel).not.toContain("const [submitState, setSubmitState]");
    expect(ticketModel).not.toContain("const [title, setTitle]");
    expect(ticketModel).not.toContain("const [providerName, setProviderName]");
    expect(ticketModel).not.toContain("const [saving, setSaving]");
    expect(ticketModel).not.toContain("const [unlinking, setUnlinking]");
    expect(ticketViewState).toContain("export interface ItineraryTicketModalViewState");
    expect(ticketViewState).toContain("./itinerary-ticket-modal-submit-state");
    expect(ticketViewState).toContain("buildInitialItineraryTicketModalViewState");
    expect(ticketForm).toContain("export function buildTicketSubmitInput");
    expect(ticketForm).toContain("export interface TicketFormValues");
    expect(modalPortal).toContain("export function ActivityCellModalPortal");
    expect(modalPortal).toContain("createPortal");
    expect(modalPortal).toContain("@/src/shared/hooks/use-escape-to-close");
    expect(modalHeader).toContain("export function ActivityCellModalHeader");
    expect(modalHeader).toContain("subActivityModalCloseClassName");
    expect(modalActions).toContain("export function ActivityCellModalActions");
    expect(modalActions).toContain("saveIconName");
    expect(ticketFooter).toContain("./ActivityCellModalActions");
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

  it("keeps itinerary table weather formatting split from path utilities", () => {
    const tableUtils = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts");
    const tableGrouping = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-table-grouping.ts");
    const tableGraph = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-graph.ts");
    const tableLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-labels.ts");
    const tableTripPlanLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-trip-plan-labels.ts");
    const weatherSummary = readItineraryArchitectureSource("src/features/itinerary/domain/weather-summary.ts");
    const weatherChip = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-weather-chip.tsx");

    expect(tableUtils).not.toContain("TripDailyBriefing");
    expect(tableUtils).not.toContain("weather-briefings");
    expect(tableUtils).not.toContain("buildWeatherSummary");
    expect(tableUtils).not.toContain("buildWeatherTooltip");
    expect(tableUtils).toContain("@/src/features/itinerary/domain/itinerary-table-grouping");
    expect(tableUtils).toContain("./smart-itinerary-table-graph");
    expect(tableUtils).toContain("./smart-itinerary-table-labels");
    expect(tableUtils).toContain("./smart-itinerary-table-trip-plan-labels");
    expect(tableUtils).not.toContain("function mergeTripDayGroups");
    expect(tableUtils).not.toContain("function itemStatusLabel");
    expect(tableGrouping).toContain("export function mergeTripDayGroups");
    expect(tableGrouping).toContain("export function groupChildItemsByParent");
    expect(tableGraph).toContain("export function buildGraphColumnWidth");
    expect(tableLabels).toContain("export function itemStatusLabel");
    expect(tableLabels).toContain("export function formatSelectedPlanLabel");
    expect(tableTripPlanLabels).toContain("export function tripPlanStatus");
    expect(weatherSummary).toContain("export function buildWeatherSummary");
    expect(weatherSummary).toContain("export function buildWeatherTooltip");
    expect(weatherChip).toContain("@/src/features/itinerary/domain/weather-summary");
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

  it("keeps weather briefing drawer formatting split from render", () => {
    const drawer = readItineraryArchitectureSource("src/shared/components/weather/WeatherBriefingDrawer.tsx");
    const drawerModel = readItineraryArchitectureSource("src/shared/components/weather/model/weather-briefing-drawer-model.ts");
    const drawerCopy = readItineraryArchitectureSource("src/shared/components/weather/model/weather-briefing-drawer-copy.ts");

    expect(drawer).toContain("./model/weather-briefing-drawer-model");
    expect(drawer).not.toContain("function formatWeatherSummary");
    expect(drawer).not.toContain("function buildWeatherDetailLines");
    expect(drawer).not.toContain("function weatherDrawerCopy");
    expect(drawerModel).toContain("export function formatWeatherSummary");
    expect(drawerModel).toContain("export function buildWeatherDetailLines");
    expect(drawerModel).toContain("./weather-briefing-drawer-copy");
    expect(drawerModel).not.toContain('regionLabel: "Weather briefing"');
    expect(drawerCopy).toContain("export function weatherDrawerCopy");
    expect(drawerCopy).toContain("export function emptyText");
  });

  it("keeps weather forecast strip formatting split from render", () => {
    const strip = readItineraryArchitectureSource("src/shared/components/weather/WeatherForecastStrip.tsx");
    const stripModel = readItineraryArchitectureSource("src/shared/components/weather/model/weather-forecast-strip-model.ts");

    expect(strip).toContain("./model/weather-forecast-strip-model");
    expect(strip).not.toContain("function formatDayLabel");
    expect(strip).not.toContain("function weatherStripCopy");
    expect(strip).not.toContain("displayDateTimeLocaleCode");
    expect(stripModel).toContain("export function formatWeatherStripDayLabel");
    expect(stripModel).toContain("export function weatherStripCopy");
  });
});
