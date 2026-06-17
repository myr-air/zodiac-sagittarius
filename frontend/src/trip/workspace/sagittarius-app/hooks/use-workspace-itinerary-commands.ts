import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  buildItineraryItemDraft,
  buildUpdatedItineraryItem,
  deleteItineraryItemFromTrip,
  mainItineraryPathId,
  mergeCreatedItineraryItemIntoTrip,
  mergeUpdatedItineraryBranchIntoTrip,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  normalizeStopHierarchyValues,
  replaceItineraryItem,
  replaceItineraryItems,
  selectedItineraryPathIdForDay,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import { buildInlineItineraryItemPatch } from "@/src/trip/itinerary-time";
import {
  buildCreateItineraryItemRequest,
  buildInlineItineraryItemPatchRequest,
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildPatchItineraryItemRequest,
  buildReorderItineraryItemsRequest,
} from "@/src/trip/itinerary-api-requests";
import {
  buildMapPlaceResolutionRequest,
  locationFieldsFromCandidate,
  mapResolutionPlaceHint,
  buildMapLink,
  resolveStopPlace,
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import { safeExternalHref } from "@/src/trip/safe-links";
import {
  applyItemToActivityBranch,
  applyManualActivityPath,
} from "@/src/trip/itinerary-paths";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import {
  nextClientMutationId as nextClientMutationIdFactory,
  nextLocalItemId,
} from "@/src/trip/local-ids";
import type { MapCoordinateResolutionResult } from "@/src/features/itinerary/components";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import type { StopFormValues } from "@/src/features/itinerary/components";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { queueKeyedUpdate } from "../support/queued-updates";

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";

interface ItineraryDialogStateCreate {
  mode: "create";
  day?: string;
  parentItemId?: string | null;
}

interface ItineraryDialogStateEdit {
  mode: "edit";
  item: ItineraryItem;
}

type ItineraryDialogState =
  | ItineraryDialogStateCreate
  | ItineraryDialogStateEdit
  | null;

interface UseWorkspaceItineraryCommandsParams {
  canEdit: boolean;
  canSaveItineraryErrorMessage: string;
  currentMemberId: string;
  dialogState: ItineraryDialogState;
  effectivePlaceResolver: PlaceResolver | null;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: typeof nextClientMutationIdFactory;
  pathOptions: ItineraryPathOption[];
  pathSelection: ItineraryPathSelection;
  planItems: ItineraryItem[];
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  selectedDay: string;
  selectedItemId: string;
  selectedTripPlanId: string;
  setContextRailVisibility: (open: boolean) => void;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  setTripPlanError: (message: string | null) => void;
  tripPlanErrorMessage: string;
  trip: Trip;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryCommands({
  canEdit,
  canSaveItineraryErrorMessage,
  currentMemberId,
  dialogState,
  effectivePlaceResolver,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  pathOptions,
  pathSelection,
  planItems,
  participantSession,
  resolvedApiClient,
  replaceApiTrip,
  replaceCockpitFromApi,
  selectedDay,
  selectedItemId,
  selectedTripPlanId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  setTripPlanError,
  tripPlanErrorMessage,
  trip,
  commitTrip,
  updateApiTrip,
}: UseWorkspaceItineraryCommandsParams) {
  const inlineUpdateQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const addStop = useCallback(
    (day?: string, parentItemId?: string | null) => {
      if (!canEdit) return;
      setStopPlaceResolution({ state: "idle", candidates: [] });
      setContextRailVisibility(false);
      setDialogState({ mode: "create", day, parentItemId: parentItemId ?? null });
    },
    [canEdit, setContextRailVisibility, setDialogState, setStopPlaceResolution],
  );

  const runItineraryItemInlineUpdate = useCallback(
    async (itemId: string, patch: InlineItineraryItemPatch) => {
      if (isApiMode && resolvedApiClient && participantSession) {
        let currentTrip = latestTripRef.current;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const item = currentTrip.itineraryItems.find(
            (candidate) => candidate.id === itemId,
          );
          if (!item) return;
          const nextPatch = buildInlineItineraryItemPatch(item, patch);
          if (!nextPatch) return;
          try {
            const patchedItem = await resolvedApiClient.patchItineraryItem(
              currentTrip.id,
              itemId,
              participantSession.sessionToken,
              buildInlineItineraryItemPatchRequest(nextPatch, {
                clientMutationId: nextClientMutationId(
                  "itinerary-inline-patch",
                ),
                expectedVersion: item.version,
              }),
            );
            const nextTrip = replaceItineraryItem(
              latestTripRef.current,
              patchedItem,
            );
            replaceApiTrip(nextTrip);
            setSelectedItemId(itemId);
            return;
          } catch (error) {
            if (!isVersionConflict(error) || attempt > 0) {
              throw error;
            }
            const cockpit = await resolvedApiClient.loadTrip(
              currentTrip.id,
              participantSession.sessionToken,
            );
            replaceCockpitFromApi(cockpit);
            latestTripRef.current = cockpit.trip;
            currentTrip = cockpit.trip;
          }
        }
        return;
      }

      commitTrip((current) => {
        const item = current.itineraryItems.find(
          (candidate) => candidate.id === itemId,
        );
        if (!item) return current;
        const nextPatch = buildInlineItineraryItemPatch(item, patch);
        if (!nextPatch) return current;
        const updatedItem = {
          ...item,
          ...nextPatch,
          ...(nextPatch.place !== undefined
            ? {
                address: nextPatch.place,
                coordinates: undefined,
                mapLink: buildMapLink(nextPatch.place),
              }
            : {}),
          updatedAt: localMutationTimestamp,
          version: item.version + 1,
        };
        return {
          ...current,
          itineraryItems: current.itineraryItems.map((candidate) =>
            candidate.id === itemId ? updatedItem : candidate,
          ),
        };
      }, itemId);
    },
    [
      isApiMode,
      latestTripRef,
      nextClientMutationId,
      participantSession,
      replaceCockpitFromApi,
      replaceApiTrip,
      resolvedApiClient,
      setSelectedItemId,
      commitTrip,
    ],
  );

  const updateItineraryItemInline = useCallback(
    async (itemId: string, patch: InlineItineraryItemPatch) => {
      if (!canEdit) return;
      try {
        await queueKeyedUpdate(inlineUpdateQueueRef.current, itemId, () =>
          runItineraryItemInlineUpdate(itemId, patch),
        );
        setTripPlanError(null);
      } catch {
        setTripPlanError(canSaveItineraryErrorMessage);
      }
    },
    [
      canEdit,
      canSaveItineraryErrorMessage,
      runItineraryItemInlineUpdate,
      setTripPlanError,
    ],
  );

  const addSubActivity = useCallback(
    async (parentItemId: string) => {
      const parentItem = trip.itineraryItems.find((item) => item.id === parentItemId);
      if (!parentItem) return;
      if (!parentItem.isPlanBlock) {
        try {
          setTripPlanError(null);
          await updateItineraryItemInline(parentItem.id, { isPlanBlock: true });
        } catch {
          setTripPlanError(tripPlanErrorMessage);
          return;
        }
      }
      addStop(parentItem.day, parentItem.id);
    },
    [addStop, setTripPlanError, trip, tripPlanErrorMessage, updateItineraryItemInline],
  );

  const moveItem = useCallback(
    async (draggedItemId: string, targetItemId: string) => {
      if (!canEdit || draggedItemId === targetItemId) return;

      const nextTrip = moveTripItem(
        trip,
        draggedItemId,
        targetItemId,
        selectedTripPlanId,
        localMutationTimestamp,
      );
      if (!nextTrip) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const draggedItem = trip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        const targetItem = nextTrip.itineraryItems.find(
          (item) => item.id === targetItemId,
        );
        if (!draggedItem || !targetItem) return;
        const movedItem = nextTrip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        if (!movedItem) return;
        const parentChanged =
          (draggedItem.parentItemId ?? null) !==
          (movedItem.parentItemId ?? null);
        if (draggedItem.day !== movedItem.day || parentChanged) {
          const patchedItem = await resolvedApiClient.patchItineraryItem(
            trip.id,
            draggedItemId,
            participantSession.sessionToken,
            buildMoveItineraryItemRequest(movedItem, {
              clientMutationId: nextClientMutationId("itinerary-day-move"),
              expectedVersion: draggedItem.version,
            }),
          );
          replaceApiTrip(replaceItineraryItem(nextTrip, patchedItem));
          setSelectedItemId(draggedItemId);
          return;
        }

        const reorderedDayItems = nextTrip.itineraryItems.filter(
          (item) =>
            item.planVariantId === targetItem.planVariantId &&
            item.day === targetItem.day,
        );
        const reorderedItems = await resolvedApiClient.reorderItineraryItems(
          trip.id,
          participantSession.sessionToken,
          buildReorderItineraryItemsRequest(reorderedDayItems, {
            clientMutationId: nextClientMutationId("itinerary-reorder"),
            day: targetItem.day,
            planVariantId: targetItem.planVariantId,
          }),
        );
        updateApiTrip((current) => replaceItineraryItems(current, reorderedItems));
        return;
      }

      commitTrip(() => nextTrip, draggedItemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      replaceApiTrip,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  const moveItemIntoPlanBlock = useCallback(
    async (draggedItemId: string, planBlockItemId: string) => {
      if (!canEdit || draggedItemId === planBlockItemId) return;

      const nextTrip = moveTripItemIntoPlanBlock(
        trip,
        draggedItemId,
        planBlockItemId,
        selectedTripPlanId,
        localMutationTimestamp,
      );
      if (!nextTrip) return;

      const draggedItem = trip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      const movedItem = nextTrip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      if (!draggedItem || !movedItem) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedItem = await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          buildMoveItineraryItemRequest(movedItem, {
            clientMutationId: nextClientMutationId("itinerary-block-move"),
            expectedVersion: draggedItem.version,
          }),
        );
        replaceApiTrip(replaceItineraryItem(nextTrip, patchedItem));
        setSelectedItemId(draggedItemId);
        return;
      }

      commitTrip(() => nextTrip, draggedItemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      replaceApiTrip,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
    ],
  );

  const moveItemToDay = useCallback(
    async (draggedItemId: string, targetDay: string) => {
      if (!canEdit) return;

      const nextTrip = moveTripItemToDay(
        trip,
        draggedItemId,
        targetDay,
        selectedTripPlanId,
        localMutationTimestamp,
      );
      if (!nextTrip) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const draggedItem = trip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        if (!draggedItem) return;
        await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          buildMoveItineraryItemToDayRequest({
            clientMutationId: nextClientMutationId("itinerary-day-move"),
            expectedVersion: draggedItem.version,
            targetDay,
          }),
        );
        replaceApiTrip(nextTrip);
        setSelectedItemId(draggedItemId);
        return;
      }

      commitTrip(() => nextTrip, draggedItemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      replaceApiTrip,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
    ],
  );

  const moveItemToPath = useCallback(
    async (itemId: string, pathId: string) => {
      if (!canEdit) return;

      const branchPlacement = applyManualActivityPath(trip, itemId, pathId);
      if (
        branchPlacement.trip === trip ||
        branchPlacement.changedExistingItems.length === 0
      ) {
        return;
      }

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        const changedItemIds = new Set(
          branchPlacement.changedExistingItems.map((item) => item.id),
        );
        const branchPlacementItems = branchPlacement.trip.itineraryItems.filter(
          (item) => changedItemIds.has(item.id),
        );
        updateApiTrip((current) =>
          replaceItineraryItems(current, [
            ...branchPlacementItems,
            ...patchedBranchItems,
          ]),
        );
        setSelectedItemId(itemId);
        return;
      }

      commitTrip(() => branchPlacement.trip, itemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  const createStop = useCallback(
    async (values: StopFormValues) => {
      values = normalizeStopHierarchyValues(values);
      const day = values.day || selectedDay;
      setStopPlaceResolution(
        effectivePlaceResolver && !values.resolvedPlace && !values.saveUnresolved
          ? { state: "resolving", candidates: [] }
          : { state: "idle", candidates: [] },
      );

      const placeResolution = await resolveStopPlace(
        { ...values, day },
        trip,
        effectivePlaceResolver,
        nextClientMutationId,
      );
      if (placeResolution.state) {
        setStopPlaceResolution(placeResolution.state);
        return;
      }

      setStopPlaceResolution({ state: "idle", candidates: [] });
      const locationFields = locationFieldsFromCandidate(
        placeResolution.candidate,
        values.place,
        values.mapLink,
      );
      const parentItem = values.parentItemId
        ? trip.itineraryItems.find((item) => item.id === values.parentItemId)
        : undefined;
      const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
      const targetPathName = pathOptions.find(
        (option) => option.id === targetPathId,
      )?.name;
      const nextItemId = nextLocalItemId(trip.itineraryItems, "item-new");
      const draftItem = buildItineraryItemDraft(
        { ...values, day },
        {
          address: locationFields.address,
          coordinates: locationFields.coordinates,
          createdBy: currentMemberId,
          mapLink: locationFields.mapLink,
          nextItemId,
          pathId: targetPathId,
          pathName: targetPathName,
          planItems,
          selectedTripPlanId,
          trip,
          updatedAt: localMutationTimestamp,
        },
      );
      const branchPlacement =
        parentItem
          ? appendItineraryItemPlacement(trip, draftItem)
          : targetPathId === mainItineraryPathId
            ? applyItemToActivityBranch(trip, draftItem)
            : appendItineraryItemPlacement(trip, draftItem);

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        const createdItem = await resolvedApiClient.createItineraryItem(
          trip.id,
          participantSession.sessionToken,
          buildCreateItineraryItemRequest(
            branchPlacement.item,
            nextClientMutationId("itinerary-create"),
          ),
        );
        updateApiTrip((current) =>
          mergeCreatedItineraryItemIntoTrip(
            current,
            createdItem,
            branchPlacement,
            patchedBranchItems,
          ),
        );
        setSelectedItemId(createdItem.id);
        setContextRailVisibility(false);
        setDialogState(null);
        return;
      }

      commitTrip(
        (current) =>
          parentItem
            ? appendItineraryItemToTrip(current, draftItem)
            : targetPathId === mainItineraryPathId
              ? applyItemToActivityBranch(current, draftItem).trip
              : appendItineraryItemToTrip(current, draftItem),
        draftItem.id,
      );
      setContextRailVisibility(false);
      setDialogState(null);
    },
    [
      commitTrip,
      currentMemberId,
      effectivePlaceResolver,
      isApiMode,
      nextClientMutationId,
      participantSession,
      pathOptions,
      pathSelection,
      planItems,
      resolvedApiClient,
      selectedDay,
      selectedTripPlanId,
      setContextRailVisibility,
      setDialogState,
      setStopPlaceResolution,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  const updateSelectedStop = useCallback(
    async (values: StopFormValues) => {
      if (dialogState?.mode !== "edit") return;
      const place = dialogState.item;
      values = normalizeStopHierarchyValues(values);
      const itemId = place.id;
      const editDay = values.day || place.day;
      const shouldResolvePlace =
        values.place !== place.place ||
        safeExternalHref(values.mapLink) !== safeExternalHref(place.mapLink) ||
        Boolean(values.resolvedPlace) ||
        Boolean(values.saveUnresolved);
      setStopPlaceResolution(
        shouldResolvePlace &&
          effectivePlaceResolver &&
          !values.resolvedPlace &&
          !values.saveUnresolved
          ? { state: "resolving", candidates: [] }
          : { state: "idle", candidates: [] },
      );
      const placeResolution = shouldResolvePlace
        ? await resolveStopPlace(
            { ...values, day: editDay },
            trip,
            effectivePlaceResolver,
            nextClientMutationId,
          )
        : { candidate: null, state: null };
      if (placeResolution.state) {
        setStopPlaceResolution(placeResolution.state);
        return;
      }
      setStopPlaceResolution({ state: "idle", candidates: [] });

      const locationFields = shouldResolvePlace
        ? locationFieldsFromCandidate(
            placeResolution.candidate,
            values.place,
            values.mapLink,
          )
        : {
            address: place.address ?? place.place,
            coordinates: place.coordinates,
            mapLink: place.mapLink,
          };

      const patchedItem = isApiMode && resolvedApiClient && participantSession
        ? await resolvedApiClient.patchItineraryItem(
            trip.id,
            itemId,
            participantSession.sessionToken,
            buildPatchItineraryItemRequest(
              { ...values, day: editDay },
              {
                address: locationFields.address,
                clientMutationId: nextClientMutationId("itinerary-patch"),
                coordinates: locationFields.coordinates,
                expectedVersion: place.version,
                mapLink: locationFields.mapLink,
              },
            ),
          )
        : undefined;

      if (isApiMode && patchedItem && resolvedApiClient && participantSession) {
        const patchedItemWithDay = {
          ...patchedItem,
          day: values.day || patchedItem.day,
        };
        const tripWithPatchedItem = replaceItineraryItem(trip, patchedItemWithDay);
        const pathPlacement = applyItemToActivityBranch(
          tripWithPatchedItem,
          patchedItemWithDay,
        );
        const branchPlacement = values.pathId
          ? applyManualActivityPath(pathPlacement.trip, itemId, values.pathId)
          : pathPlacement;
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        updateApiTrip((current) =>
          mergeUpdatedItineraryBranchIntoTrip(
            current,
            itemId,
            branchPlacement,
            patchedBranchItems,
          ),
        );
        setSelectedItemId(itemId);
        setDialogState(null);
        return;
      }

      if (!isApiMode) {
        commitTrip((current) => {
          const updatedItem = buildUpdatedItineraryItem(
            place,
            { ...values, day: editDay },
            {
              address: locationFields.address,
              coordinates: locationFields.coordinates,
              mapLink: locationFields.mapLink,
              updatedAt: localMutationTimestamp,
            },
          );
          const tripWithUpdatedItem = replaceItineraryItem(current, updatedItem);
          const pathPlacement = applyItemToActivityBranch(
            tripWithUpdatedItem,
            updatedItem,
          );
          return values.pathId
            ? applyManualActivityPath(
                pathPlacement.trip,
                itemId,
                values.pathId,
              ).trip
            : pathPlacement.trip;
        });
        setSelectedItemId(itemId);
        setDialogState(null);
      }
    },
    [
      isApiMode,
      dialogState,
      effectivePlaceResolver,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      setDialogState,
      setSelectedItemId,
      setStopPlaceResolution,
      trip,
      updateApiTrip,
      commitTrip,
    ],
  );

  const resolveMissingMapCoordinates = useCallback(
    async (itemsToResolve: ItineraryItem[]): Promise<MapCoordinateResolutionResult> => {
      const result: MapCoordinateResolutionResult = {
        attempted: 0,
        failed: 0,
        resolved: 0,
        skipped: 0,
      };
      if (!canEdit || !effectivePlaceResolver) return result;

      for (const item of itemsToResolve) {
        if (item.coordinates) continue;
        result.attempted += 1;
        const placeHint = mapResolutionPlaceHint(item);
        if (!placeHint) {
          result.skipped += 1;
          continue;
        }
        try {
          const response = await effectivePlaceResolver(
            buildMapPlaceResolutionRequest(item, trip, {
              clientMutationId: nextClientMutationId("map-place-resolve"),
              placeHint,
            }),
          );
          if (response.status !== "resolved") {
            result.skipped += 1;
            continue;
          }
          const candidate = response.candidates[0];
          if (!candidate) {
            result.skipped += 1;
            continue;
          }
          await updateItineraryItemInline(item.id, {
            address: candidate.address,
            coordinates: candidate.coordinates,
            mapLink: candidate.mapLink,
          });
          result.resolved += 1;
        } catch {
          result.failed += 1;
        }
      }
      return result;
    },
    [
      canEdit,
      effectivePlaceResolver,
      nextClientMutationId,
      trip,
      updateItineraryItemInline,
    ],
  );

  const deleteStop = useCallback(
    async (itemId: string) => {
      if (!canEdit) return;
      const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
      if (!item) return;
      const remainingItems = trip.itineraryItems.filter(
        (candidate) => candidate.id !== itemId,
      );
      const nextSelectedItemId =
        selectedItemId === itemId
          ? (remainingItems[0]?.id ?? "")
          : selectedItemId;

      if (isApiMode && resolvedApiClient && participantSession) {
        await resolvedApiClient.deleteItineraryItem(
          trip.id,
          itemId,
          participantSession.sessionToken,
        );
        updateApiTrip((current) => deleteItineraryItemFromTrip(current, itemId));
        setSelectedItemId(nextSelectedItemId);
        if (!nextSelectedItemId) setContextRailVisibility(false);
        setDialogState((current) =>
          current?.mode === "edit" && current.item.id === itemId ? null : current,
        );
        return;
      }

      commitTrip(
        (current) => deleteItineraryItemFromTrip(current, itemId),
        nextSelectedItemId,
      );
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setDialogState((current) =>
        current?.mode === "edit" && current.item.id === itemId ? null : current,
      );
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      selectedItemId,
      setContextRailVisibility,
      setDialogState,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  return {
    addStop,
    addSubActivity,
    createStop,
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
    moveItemToPath,
    resolveMissingMapCoordinates,
    updateItineraryItemInline,
    updateSelectedStop,
    deleteStop,
  };
}
