import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import type { Messages } from "@/src/i18n/messages";
import {
  formatTripPlanOptionLabel,
  tripPlanStatus,
} from "../smart-itinerary-table-utils";
import {
  headerControlsButtonClassName,
  headerControlsContentClassName,
  headerControlsGridClassName,
  headerControlsPanelClassName,
  headerControlsSectionClassName,
  headerControlsSectionHeaderClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
  pathFilterOptionClassName,
  pathFilterPanelClassName,
  pathFilterSummaryClassName,
  showAllPathsToggleClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanFieldClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
  tripPlanSelectClassName,
} from "../smart-itinerary-table.styles";

type FilterOption = { id: string; name: string };

interface TripPlanHeaderControlsProps {
  canEdit: boolean;
  canManageTripPlans: boolean;
  filterOptions: FilterOption[];
  itineraryLabels: Messages["itinerary"];
  isTripPlanBusy: boolean;
  mainTripPlanId: string;
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  selectedFilterLabel: string;
  selectedTripPlanId: string;
  showAllPaths: boolean;
  tripPlans: PlanVariant[];
  tripPlanError: string | null;
}

interface TripPlanHeaderControlActionsProps {
  onTogglePathFilter: (pathId: string) => void;
  selectedPathIds: Set<string>;
}

export function SmartItineraryTableHeaderControls({
  canEdit,
  canManageTripPlans,
  filterOptions,
  itineraryLabels,
  isTripPlanBusy,
  mainTripPlanId,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onCreateTripPlan,
  onRenameTripPlan,
  onSetMainTripPlan,
  onTogglePathFilter,
  selectedFilterLabel,
  selectedPathIds,
  selectedTripPlanId,
  showAllPaths,
  onChangeShowAllPaths,
  tripPlans,
  tripPlanError,
}: TripPlanHeaderControlActionsProps & TripPlanHeaderControlsProps) {
  const [headerControlsExpanded, setHeaderControlsExpanded] = useState(false);
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [editedTripPlanNameDraft, setEditedTripPlanNameDraft] = useState<{
    name: string;
    planId: string;
  } | null>(null);
  const [newTripPlanError, setNewTripPlanError] = useState<string | null>(null);
  const [renderHeaderControls, setRenderHeaderControls] = useState(false);
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const headerControlsButtonRef = useRef<HTMLButtonElement>(null);

  const selectedTripPlanIdForControl = tripPlans.some(
    (plan) => plan.id === selectedTripPlanId,
  )
    ? selectedTripPlanId
    : (tripPlans[0]?.id ?? "");
  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanIdForControl) ?? null;
  const selectedTripPlanStatus = selectedTripPlan
    ? tripPlanStatus(selectedTripPlan)
    : "draft";
  const editedTripPlanName =
    editedTripPlanNameDraft &&
    selectedTripPlan &&
    editedTripPlanNameDraft.planId === selectedTripPlan.id
      ? editedTripPlanNameDraft.name
      : (selectedTripPlan?.name ?? "");
  const selectedTripPlanIsMain =
    Boolean(selectedTripPlanIdForControl) &&
    selectedTripPlanIdForControl === mainTripPlanId;

  const tripPlanSelectorDisabled = isTripPlanBusy || tripPlans.length === 0;
  const tripPlanControlsDisabled = !canManageTripPlans || tripPlanSelectorDisabled;
  const tripPlanStatusDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const setMainTripPlanDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const renameTripPlanDisabled =
    tripPlanControlsDisabled ||
    !selectedTripPlan ||
    !editedTripPlanName.trim() ||
    editedTripPlanName.trim() === selectedTripPlan.name;
  const tripPlanMessage = newTripPlanError ?? tripPlanError;

  useEffect(() => {
    if (headerControlsExpanded || !renderHeaderControls) return;

    const timeoutId = window.setTimeout(() => {
      setRenderHeaderControls(false);
    }, 170);
    return () => window.clearTimeout(timeoutId);
  }, [headerControlsExpanded, renderHeaderControls]);

  useDismissOnOutside({
    enabled: headerControlsExpanded,
    onDismiss: () => setHeaderControlsExpanded(false),
    triggerRefs: [headerControlsRef],
    onEscape: () => {
      setHeaderControlsExpanded(false);
      headerControlsButtonRef.current?.focus();
    },
  });

  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = newTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(itineraryLabels.tripPlans.emptyName);
      return;
    }
    setNewTripPlanError(null);
    const created = await onCreateTripPlan(name);
    if (created === false) return;
    setNewTripPlanName("");
    setIsCreatingTripPlan(false);
  }

  async function submitRenameTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans || !selectedTripPlan) return;
    const name = editedTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(itineraryLabels.tripPlans.emptyName);
      return;
    }
    if (name === selectedTripPlan.name) return;
    setNewTripPlanError(null);
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setEditedTripPlanNameDraft({ name, planId: selectedTripPlan.id });
  }

  return (
    <div
      ref={headerControlsRef}
      className={pageHeaderActionsClassName}
      role="group"
      aria-label={itineraryLabels.actionsLabel}
    >
      <button
        ref={headerControlsButtonRef}
        type="button"
        className={headerControlsButtonClassName}
        aria-label={`${itineraryLabels.tripPlans.selectorLabel} controls`}
        aria-controls="itinerary-header-controls"
        aria-expanded={headerControlsExpanded}
        onClick={() => {
          if (!headerControlsExpanded) setRenderHeaderControls(true);
          setHeaderControlsExpanded((current) => !current);
        }}
      >
        <Icon name="settings" />
        <span className="min-w-0 truncate">
          {selectedTripPlan?.name ?? itineraryLabels.tripPlans.selectorLabel}
        </span>
        <Icon
          name="chevronRight"
          className={cn(
            "transition-transform duration-150",
            headerControlsExpanded && "rotate-90",
          )}
        />
      </button>
      {!canEdit ? (
        <p className={pageHeaderNoteClassName}>
          {itineraryLabels.editRequiresOrganizer}
        </p>
      ) : null}
      {renderHeaderControls ? (
        <div
          className={headerControlsPanelClassName}
          data-state={headerControlsExpanded ? "open" : "closed"}
          id="itinerary-header-controls"
          aria-hidden={!headerControlsExpanded}
          inert={headerControlsExpanded ? undefined : true}
        >
          <div className={headerControlsTitleBarClassName}>
            <div className={headerControlsTitleClassName}>
              <strong>{itineraryLabels.tripPlans.selectorLabel}</strong>
              {isTripPlanBusy ? (
                <span className={pathFilterSummaryClassName}>
                  {itineraryLabels.tripPlans.busy}
                </span>
              ) : tripPlanMessage ? (
                <span className={pathFilterSummaryClassName}>
                  {tripPlanMessage}
                </span>
              ) : null}
            </div>
            <span className={pathFilterSummaryClassName}>
              {selectedTripPlan?.name ?? itineraryLabels.tripPlans.selectorLabel}
            </span>
          </div>
          <div className={headerControlsContentClassName}>
            <div className={headerControlsSectionClassName}>
              <form className={headerControlsGridClassName} onSubmit={submitRenameTripPlan}>
                <label className={tripPlanFieldClassName}>
                  <span>{itineraryLabels.tripPlans.selectorLabel}</span>
                  <Select
                    className={tripPlanSelectClassName}
                    value={selectedTripPlanIdForControl}
                    disabled={tripPlanSelectorDisabled}
                    onChange={(event) => {
                      setNewTripPlanError(null);
                      setEditedTripPlanNameDraft(null);
                      onChangeTripPlan(event.target.value);
                    }}
                  >
                    {tripPlans.map((plan) => (
                      <option value={plan.id} key={plan.id}>
                        {formatTripPlanOptionLabel(
                          plan,
                          itineraryLabels.tripPlans.status,
                        )}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className={tripPlanFieldClassName}>
                  <span>{itineraryLabels.tripPlans.statusLabel}</span>
                  <Select
                    className={tripPlanSelectClassName}
                    value={selectedTripPlanStatus}
                    disabled={tripPlanStatusDisabled}
                    onChange={(event) =>
                      onChangeTripPlanStatus(
                        selectedTripPlanIdForControl,
                        event.target.value as Exclude<PlanStatus, "main">,
                      )
                    }
                  >
                    <option value="main" disabled>
                      {itineraryLabels.tripPlans.status.main}
                    </option>
                    <option value="draft">
                      {itineraryLabels.tripPlans.status.draft}
                    </option>
                    <option value="backup">
                      {itineraryLabels.tripPlans.status.backup}
                    </option>
                    <option value="proposal">
                      {itineraryLabels.tripPlans.status.proposal}
                    </option>
                  </Select>
                </label>
                <label className={tripPlanFieldClassName}>
                  <span>{itineraryLabels.tripPlans.nameLabel}</span>
                  <input
                    className={tripPlanNameInputClassName}
                    value={editedTripPlanName}
                    disabled={tripPlanControlsDisabled || !selectedTripPlan}
                    onChange={(event) => {
                      if (!selectedTripPlan) return;
                      setEditedTripPlanNameDraft({
                        name: event.target.value,
                        planId: selectedTripPlan.id,
                      });
                      setNewTripPlanError(null);
                    }}
                  />
                </label>
                <Button
                  type="submit"
                  disabled={renameTripPlanDisabled}
                  className={tripPlanButtonClassName}
                >
                  {itineraryLabels.tripPlans.saveName}
                </Button>
              </form>
              {canManageTripPlans ? (
                <div className={tripPlanActionsClassName}>
                  <Button
                    type="button"
                    disabled={setMainTripPlanDisabled}
                    className={tripPlanButtonClassName}
                    onClick={() =>
                      onSetMainTripPlan(selectedTripPlanIdForControl)
                    }
                  >
                    {itineraryLabels.tripPlans.setMain}
                  </Button>
                  {isCreatingTripPlan ? (
                    <form
                      className={tripPlanCreateFormClassName}
                      onSubmit={submitNewTripPlan}
                    >
                      <label className={tripPlanNameFieldClassName}>
                        <span>{itineraryLabels.tripPlans.nameLabel}</span>
                        <input
                          className={tripPlanNameInputClassName}
                          value={newTripPlanName}
                          disabled={isTripPlanBusy}
                          placeholder={itineraryLabels.tripPlans.namePlaceholder}
                          onChange={(event) => {
                            setNewTripPlanName(event.target.value);
                            setNewTripPlanError(null);
                          }}
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={isTripPlanBusy}
                        className={tripPlanButtonClassName}
                      >
                        {itineraryLabels.tripPlans.createConfirm}
                      </Button>
                      <button
                        type="button"
                        className={tripPlanSecondaryButtonClassName}
                        disabled={isTripPlanBusy}
                        onClick={() => {
                          setIsCreatingTripPlan(false);
                          setNewTripPlanName("");
                          setNewTripPlanError(null);
                        }}
                      >
                        {itineraryLabels.tripPlans.createCancel}
                      </button>
                    </form>
                  ) : (
                    <Button
                      type="button"
                      disabled={isTripPlanBusy}
                      className={tripPlanButtonClassName}
                      onClick={() => setIsCreatingTripPlan(true)}
                    >
                      {itineraryLabels.tripPlans.create}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
            <div className={headerControlsSectionClassName}>
              <div className={headerControlsSectionHeaderClassName}>
                <strong>{itineraryLabels.filters.panelLabel}</strong>
                <span className={pathFilterSummaryClassName}>{selectedFilterLabel}</span>
              </div>
              <label className={showAllPathsToggleClassName}>
                <input
                  type="checkbox"
                  checked={showAllPaths}
                  disabled={!onChangeShowAllPaths}
                  onChange={(event) => onChangeShowAllPaths?.(event.target.checked)}
                />
                <span>{itineraryLabels.filters.showAllPaths}</span>
              </label>
              <div
                className={pathFilterPanelClassName}
                id="itinerary-plan-filters"
                role="region"
                aria-label={itineraryLabels.filters.panelLabel}
              >
                {filterOptions.map((option) => (
                  <label className={pathFilterOptionClassName} key={option.id}>
                    <input
                      type="checkbox"
                      checked={selectedPathIds.has(option.id)}
                      onChange={() => onTogglePathFilter(option.id)}
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
