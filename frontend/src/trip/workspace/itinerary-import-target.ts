import { slugifyFilePart } from "@/src/lib/file-names";
import {
  mainItineraryPathId,
  mainItineraryPathName,
  type ItineraryPathOption,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";

export function buildItineraryImportApplyTarget({
  day,
  memberId,
  mode,
  pathName,
  pathOptions,
  recordMode,
  scope,
  tripPlanId,
}: {
  day?: string;
  memberId: string;
  mode: ItineraryImportApplyTarget["mode"];
  pathName: string;
  pathOptions: ItineraryPathOption[];
  recordMode: ItineraryImportApplyTarget["recordMode"];
  scope: ItineraryImportApplyTarget["scope"];
  tripPlanId: string;
}): ItineraryImportApplyTarget {
  const existingPath = pathOptions.find(
    (option) =>
      option.name.toLowerCase() === pathName.toLowerCase() ||
      option.id === pathName,
  );
  const normalizedPathName = pathName.trim();
  const pathId =
    normalizedPathName.toLowerCase() === mainItineraryPathName.toLowerCase()
      ? mainItineraryPathId
      : (existingPath?.id ??
        `path-${slugifyFilePart(normalizedPathName) || Date.now().toString(36)}`);
  const resolvedPathName =
    pathId === mainItineraryPathId
      ? mainItineraryPathName
      : (existingPath?.name ?? pathName);
  return {
    memberId,
    tripPlanId,
    pathId,
    pathName: resolvedPathName,
    scope,
    day,
    mode,
    recordMode,
  };
}
