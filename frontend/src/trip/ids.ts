export function shortTripId(tripId: string): string {
  const normalized = tripId.trim();
  if (!normalized) return "";
  return normalized.split("-")[0] ?? normalized.slice(0, 8);
}
