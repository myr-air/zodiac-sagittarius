export function encodeApiPathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export function apiQueryString(params: Record<string, string | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
