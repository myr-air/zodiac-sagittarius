const pathPatternCache = new Map<string, RegExp>();

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function optionalTrailingSlashPattern(path: string): RegExp {
  const cached = pathPatternCache.get(path);
  if (cached) return cached;
  const pattern = new RegExp(`^${escapeRegExp(path)}\\/?$`);
  pathPatternCache.set(path, pattern);
  return pattern;
}
