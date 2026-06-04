export type ShortIdMode = "front" | "back";

export interface ShortTripIdOptions {
  mode?: ShortIdMode;
  length?: number;
}

const DEFAULT_SHORT_TRIP_ID_LENGTH = 8;

export function shortTripId(tripId: string, options: ShortTripIdOptions = {}): string {
  const normalized = tripId.trim();
  if (!normalized) return "";

  const length = Math.max(1, options.length ?? DEFAULT_SHORT_TRIP_ID_LENGTH);
  const mode = options.mode ?? "front";

  if (normalized.length <= length) return normalized;

  if (mode === "back") {
    return normalized.slice(-length);
  }

  return normalized.slice(0, length);
}

const uuidHexRegex = /^[0-9a-fA-F]{32}$/;
const uuidStringRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function bytesFromHexTripId(tripId: string): Uint8Array | null {
  const hex = tripId.replace(/-/g, "");
  if (!uuidHexRegex.test(hex)) return null;

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const chunk = hex.slice(i * 2, i * 2 + 2);
    const value = Number.parseInt(chunk, 16);
    if (!Number.isFinite(value)) return null;
    bytes[i] = value;
  }

  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatUuidFromHex(hex: string): string {
  const normalized = hex.toLowerCase();
  if (normalized.length !== 32) return normalized;

  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join("-");
}

function encodeTripIdToBase64Url(raw: string): string {
  const bytes = bytesFromHexTripId(raw);
  if (!bytes) return raw;

  try {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return raw;
  }
}

function decodeTripIdFromBase64Url(raw: string): string | null {
  try {
    let base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const hex = bytesToHex(bytes);
    const formatted = formatUuidFromHex(hex);
    return uuidStringRegex.test(formatted) ? formatted : null;
  } catch {
    return null;
  }
}

export function encodeTripId(tripId: string): string {
  const normalized = tripId.trim().toLowerCase();
  return uuidStringRegex.test(normalized) ? encodeTripIdToBase64Url(normalized) : normalized;
}

export function decodeTripId(value: string): string {
  const normalized = value.trim();
  if (uuidStringRegex.test(normalized)) return normalized.toLowerCase();

  const decoded = decodeTripIdFromBase64Url(normalized);
  if (decoded && uuidStringRegex.test(decoded)) return decoded;

  try {
    const unescaped = decodeURIComponent(normalized);
    return unescaped.length ? unescaped : normalized;
  } catch {
    return normalized;
  }
}
