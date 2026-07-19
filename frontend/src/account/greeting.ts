/**
 * Time-of-day account greeting from profile.displayName.
 */

/**
 * Build a draft-v3 greeting like "Good Morning, Aom" from displayName + clock.
 */
export function formatAccountGreeting(
  displayName: string,
  now: Date,
): string {
  const hour = now.getHours();
  const period =
    hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return `Good ${period}, ${displayName}`;
}
