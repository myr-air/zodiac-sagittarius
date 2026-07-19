import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_SESSION_STORAGE_KEY,
  saveAccountSession,
  type StorageLike,
} from "../auth/account-session";
import {
  accountHomeGate,
  accountHomeShellCopy,
} from "./account-home-gate";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "../..");

/** Independent login path literal (auth entry route, not from SUT). */
const LOGIN_HREF = "/login";

/** Forbidden legacy /trips placeholder copy from the pre-AccountHome page. */
const LEGACY_TRIPS_PLACEHOLDER = "Trips list placeholder";

const SESSION = {
  userId: "018f4e80-0000-7000-a000-000000000001",
  sessionToken: "account-session-token-xyz",
  kind: "temporary" as const,
  trustedDeviceId: null,
  createdAt: "2026-07-19T00:00:00Z",
  expiresAt: "2026-07-20T00:00:00Z",
};

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

describe("accountHomeGate", () => {
  it("redirects to /login when loadAccountSession returns null; otherwise proceeds to home", () => {
    const empty = accountHomeGate(memoryStorage());
    expect(empty).toEqual({ kind: "redirect", href: LOGIN_HREF });

    expect(accountHomeGate(null)).toEqual({
      kind: "redirect",
      href: LOGIN_HREF,
    });
    expect(accountHomeGate(undefined)).toEqual({
      kind: "redirect",
      href: LOGIN_HREF,
    });

    const storage = memoryStorage();
    saveAccountSession(storage, SESSION);
    expect(storage.data[ACCOUNT_SESSION_STORAGE_KEY]).toBeDefined();

    const home = accountHomeGate(storage);
    expect(home).toEqual({ kind: "home", session: SESSION });
  });
});

describe("accountHomeShellCopy", () => {
  it("exposes AccountHome shell title with Joii brand and no Trips list placeholder", () => {
    const copy = accountHomeShellCopy();
    const surface = [copy.brand, copy.title, ...Object.values(copy)].join(
      "\n",
    );

    expect(copy.brand).toBe("Joii");
    expect(copy.title.length).toBeGreaterThan(0);
    expect(surface).not.toMatch(new RegExp(LEGACY_TRIPS_PLACEHOLDER, "i"));
    expect(surface).not.toMatch(/cockpit wiring comes later/i);
  });
});

describe("account home routes", () => {
  it("mounts AccountHome at /portal and redirects bare /trips to /portal", () => {
    const portalSource = readFileSync(
      join(FRONTEND_ROOT, "app/portal/page.tsx"),
      "utf8",
    );
    const tripsSource = readFileSync(
      join(FRONTEND_ROOT, "app/trips/page.tsx"),
      "utf8",
    );
    const cockpitSource = readFileSync(
      join(FRONTEND_ROOT, "app/trips/[id]/page.tsx"),
      "utf8",
    );

    expect(portalSource).toMatch(/AccountHome/);
    expect(tripsSource).toMatch(/redirect\(["']\/portal["']\)/);
    expect(tripsSource).not.toMatch(/AccountHome/);
    expect(cockpitSource.length).toBeGreaterThan(0);
    expect(cockpitSource).not.toMatch(/redirect\(["']\/portal["']\)/);
  });

  it("documents Account Home gate path as /portal (not legacy /trips home)", () => {
    const gateSource = readFileSync(
      join(HERE, "account-home-gate.ts"),
      "utf8",
    );
    expect(gateSource).toMatch(/`\/portal`/);
    expect(gateSource).not.toMatch(/Account Home \(`\/trips`\)/);
  });
});
