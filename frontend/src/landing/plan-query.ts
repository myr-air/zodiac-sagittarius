/** Start Planning is enabled when the destination query has non-whitespace content. */
export function canStartPlanning(query: string): boolean {
  return query.trim().length > 0;
}
