export interface PatchTripApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  name?: string;
  destinationLabel?: string;
  countries?: string[];
  partySize?: number;
  defaultTimezone?: string;
  startDate?: string;
  endDate?: string;
  activePlanVariantId?: string;
}

export interface PatchDailyBriefingApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  dayTitle?: string | null;
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}
