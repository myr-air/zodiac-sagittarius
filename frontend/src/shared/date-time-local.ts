export function toDateTimeLocalValue(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : "";
}

export function fromDateTimeLocalValue(value: string): string | null {
  return value.trim() || null;
}
