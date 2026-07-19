export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const ACCOUNT_SESSION_STORAGE_KEY = "joii.account.session";

export type AccountSessionKind = "temporary" | "trusted";

export type AccountSessionRecord = {
  userId: string;
  sessionToken: string;
  kind: AccountSessionKind;
  trustedDeviceId: string | null;
  createdAt: string;
  expiresAt: string;
};

export function loadAccountSession(
  storage: StorageLike | null | undefined,
): AccountSessionRecord | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ACCOUNT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAccountSessionRecord(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAccountSession(
  storage: StorageLike | null | undefined,
  session: AccountSessionRecord,
): void {
  if (!storage) return;
  try {
    storage.setItem(ACCOUNT_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

function isAccountSessionRecord(value: unknown): value is AccountSessionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === "string" &&
    typeof record.sessionToken === "string" &&
    (record.kind === "temporary" || record.kind === "trusted") &&
    (record.trustedDeviceId === null ||
      typeof record.trustedDeviceId === "string") &&
    typeof record.createdAt === "string" &&
    typeof record.expiresAt === "string"
  );
}
