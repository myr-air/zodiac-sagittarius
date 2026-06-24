import type { useWorkspaceBookingCommands } from "./use-workspace-booking-commands";
import type { useWorkspaceExpenses } from "./use-workspace-expenses";
import type { useWorkspaceItineraryCommands } from "./use-workspace-itinerary-commands";
import type { useWorkspaceItineraryImport } from "./use-workspace-itinerary-import";

type BookingParams = Parameters<typeof useWorkspaceBookingCommands>[0];
type ExpenseParams = Parameters<typeof useWorkspaceExpenses>[0];
type ImportParams = Parameters<typeof useWorkspaceItineraryImport>[0];
type ItineraryParams = Parameters<typeof useWorkspaceItineraryCommands>[0];

export type UseWorkspacePlanningCommandsParams =
  Omit<ItineraryParams, "currentMemberId"> &
  Omit<
    BookingParams,
    "apiClient" | "currentMemberId" | "updateItineraryItemInline"
  > &
  Omit<ExpenseParams, "apiClient" | "createBookingDoc" | "currentMemberId"> &
  Omit<ImportParams, "apiClient"> & {
    activeMemberId: string;
    resolvedApiClient:
      | ItineraryParams["resolvedApiClient"]
      | BookingParams["apiClient"]
      | ExpenseParams["apiClient"]
      | ImportParams["apiClient"];
  };
