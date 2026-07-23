/**
 * Itinerary import Confirm — append via sequential CRUD (M81HY2YR T5).
 * Creates each stop into the visible planVariantId, then PATCHes times /
 * details / mapLink / coords. Import string ids remap to create UUIDs for
 * parentItemId nesting. Per-item create/PATCH failures are collected; the
 * batch continues. No bulk-write, delete, or reorder.
 */

import {
  createItineraryItem,
  patchItineraryItem,
  type ItineraryApiDeps,
  type ItineraryItemPatchFields,
} from "./itinerary-api";
import type { ItineraryImportItem } from "./itinerary-import-api";

export type ApplyItineraryImportInput = {
  tripId: string;
  sessionToken: string;
  planVariantId: string;
  items: ItineraryImportItem[];
};

export type ApplyItineraryImportFailureEntry = {
  importId: string;
  phase: "create" | "patch";
  error: string;
};

export type ApplyItineraryImportSuccess = {
  ok: true;
  idMap: Record<string, string>;
};

export type ApplyItineraryImportFailure = {
  ok: false;
  idMap: Record<string, string>;
  failures: ApplyItineraryImportFailureEntry[];
};

export type ApplyItineraryImportOutcome =
  | ApplyItineraryImportSuccess
  | ApplyItineraryImportFailure;

function enrichingPatch(item: ItineraryImportItem): ItineraryItemPatchFields {
  const patch: ItineraryItemPatchFields = {
    startTime: item.startTime,
    endTime: item.endTime ?? null,
    mapLink: item.mapLink,
  };

  if (
    item.details !== undefined &&
    item.details !== null &&
    typeof item.details === "object"
  ) {
    patch.details = item.details as Record<string, unknown>;
  }

  if (item.coordinates) {
    patch.latitude = item.coordinates.lat;
    patch.longitude = item.coordinates.lng;
  }

  return patch;
}

/**
 * Append import items into planVariantId: createItineraryItem then
 * patchItineraryItem per item, sequentially. Remaps import parentItemId to
 * created UUIDs; continues after per-item failures. Existing stops are untouched.
 */
export async function applyItineraryImport(
  input: ApplyItineraryImportInput,
  deps: ItineraryApiDeps,
): Promise<ApplyItineraryImportOutcome> {
  const idMap: Record<string, string> = {};
  const versionByCreatedId: Record<string, number> = {};
  const failures: ApplyItineraryImportFailureEntry[] = [];

  for (const item of input.items) {
    const importParentId =
      typeof item.parentItemId === "string" && item.parentItemId.trim()
        ? item.parentItemId.trim()
        : undefined;
    const remappedParentId = importParentId
      ? idMap[importParentId]
      : undefined;
    const parentVersion =
      remappedParentId !== undefined
        ? versionByCreatedId[remappedParentId]
        : undefined;

    const created = await createItineraryItem(
      {
        tripId: input.tripId,
        sessionToken: input.sessionToken,
        planVariantId: input.planVariantId,
        day: item.day,
        activity: item.activity,
        activityType: item.activityType,
        place: item.place,
        ...(remappedParentId
          ? {
              parentItemId: remappedParentId,
              ...(parentVersion !== undefined
                ? { promoteParent: { expectedVersion: parentVersion } }
                : {}),
            }
          : {}),
      },
      deps,
    );
    if (!created.ok) {
      failures.push({
        importId: item.id,
        phase: "create",
        error: created.error,
      });
      continue;
    }

    idMap[item.id] = created.item.id;
    versionByCreatedId[created.item.id] = created.item.version;
    // promoteParent PATCHes isPlanBlock before the child POST — bump tracked version.
    if (remappedParentId !== undefined && parentVersion !== undefined) {
      versionByCreatedId[remappedParentId] = parentVersion + 1;
    }

    const patched = await patchItineraryItem(
      {
        tripId: input.tripId,
        itemId: created.item.id,
        sessionToken: input.sessionToken,
        expectedVersion: created.item.version,
        patch: enrichingPatch(item),
      },
      deps,
    );
    if (!patched.ok) {
      failures.push({
        importId: item.id,
        phase: "patch",
        error: patched.error,
      });
      continue;
    }

    versionByCreatedId[created.item.id] = patched.item.version;
  }

  if (failures.length > 0) {
    return { ok: false, idMap, failures };
  }
  return { ok: true, idMap };
}
