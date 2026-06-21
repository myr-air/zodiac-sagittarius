const unsupportedImportFileMessage = "Unsupported itinerary import file.";

export function unsupportedImportFileError(): Error {
  return new Error(unsupportedImportFileMessage);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): T {
  if (typeof value === "string" && allowedValues.includes(value as T)) {
    return value as T;
  }
  throw unsupportedImportFileError();
}

export function readOptionalEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return readEnum(value, allowedValues);
}
