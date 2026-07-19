import { describe, expect, it } from "vitest";
import {
  AUTH_LOCALE_STORAGE_KEY,
  loadAuthLocale,
  saveAuthLocale,
} from "./locale";
import { authCopy } from "./auth-copy";

describe("auth locale freeze", () => {
  it("persists EN/TH and reloads the frozen choice", () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
    };

    expect(loadAuthLocale(storage)).toBe("EN");
    saveAuthLocale(storage, "TH");
    expect(data[AUTH_LOCALE_STORAGE_KEY]).toBe("TH");
    expect(loadAuthLocale(storage)).toBe("TH");
    saveAuthLocale(storage, "EN");
    expect(loadAuthLocale(storage)).toBe("EN");
  });

  it("exposes full TH and EN copy for sign-in, register, email code, and trip access", () => {
    const en = authCopy("EN");
    const th = authCopy("TH");

    expect(en.signIn.submit).toBe("Sign in");
    expect(th.signIn.submit).toBe("เข้าสู่ระบบ");
    expect(en.register.confirmPassword).toBe("Confirm password");
    expect(th.register.confirmPassword).toBe("ยืนยันรหัสผ่าน");
    expect(en.emailCode.verify).toMatch(/Verify/i);
    expect(th.emailCode.verify).toMatch(/ยืนยัน/);
    expect(en.trip.enter).toBe("Enter trip");
    expect(th.trip.enter).toBe("เข้าทริป");
    expect(en.gallery.length).toBe(th.gallery.length);
    expect(en.gallery.length).toBeGreaterThan(0);
  });
});
