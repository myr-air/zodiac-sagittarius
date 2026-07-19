const PARALLAX_FACTOR = 0.35;
const PARALLAX_MAX_SCROLL = 720;

/** Scroll-linked hero offset in px: clamp scrollY to [0, 720], multiply by 0.35. */
export function parallaxOffset(scrollY: number): number {
  const clamped = Math.min(Math.max(scrollY, 0), PARALLAX_MAX_SCROLL);
  return Math.round(clamped * PARALLAX_FACTOR);
}
