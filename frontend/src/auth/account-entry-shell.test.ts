import { describe, expect, it } from "vitest";
import {
  accountEntryShellChrome,
  accountEntryShellForRoute,
} from "./account-entry-shell";

/** Independent φ fractions: form:media = 1:φ ≈ 0.382:0.618 (draft v3). */
const PHI = (1 + Math.sqrt(5)) / 2;
const EXPECTED_FORM_SHARE = 1 / (PHI * PHI);
const EXPECTED_MEDIA_SHARE = 1 / PHI;

/** Independent expected chrome literals (not read from the helper under test). */
const EN_CHROME = {
  tabs: { signIn: "Sign in", register: "Register" },
  headings: {
    signIn: "Welcome back",
    register: "Create your Joii account",
  },
  backHome: "← Back to Joii home",
} as const;

const TH_CHROME = {
  tabs: { signIn: "เข้าสู่ระบบ", register: "สมัคร" },
  headings: {
    signIn: "ยินดีต้อนรับกลับ",
    register: "สร้างบัญชี Joii ของคุณ",
  },
  backHome: "← กลับหน้าแรก Joii",
} as const;

describe("accountEntryShellForRoute", () => {
  it("shares AccountEntryShell on /login and /register with φ split, Joii chrome, and no Sagittarius", () => {
    const login = accountEntryShellForRoute("/login");
    const register = accountEntryShellForRoute("/register");

    expect(login.shell).toBe("AccountEntryShell");
    expect(register.shell).toBe("AccountEntryShell");

    expect(login.split.form).toBeCloseTo(EXPECTED_FORM_SHARE, 3);
    expect(login.split.media).toBeCloseTo(EXPECTED_MEDIA_SHARE, 3);
    expect(login.split.form + login.split.media).toBeCloseTo(1, 5);
    expect(register.split).toEqual(login.split);

    expect(login.brand).toBe("Joii");
    expect(register.brand).toBe("Joii");

    expect(login.tabs.map((tab) => tab.label)).toEqual(["Sign in", "Register"]);
    expect(login.tabs.map((tab) => tab.href)).toEqual(["/login", "/register"]);
    expect(login.activeTab).toBe("Sign in");
    expect(register.activeTab).toBe("Register");

    expect(login.locales).toEqual(["EN", "TH"]);
    expect(register.locales).toEqual(["EN", "TH"]);

    expect(login.backHome.href).toBe("/");
    expect(login.backHome.label).toMatch(/back to joii home/i);
    expect(register.backHome).toEqual(login.backHome);

    const publicCopy = [...login.publicCopy, ...register.publicCopy].join("\n");
    expect(publicCopy).toMatch(/Joii/);
    expect(publicCopy).toMatch(/Sign in/);
    expect(publicCopy).toMatch(/Register/);
    expect(publicCopy).toMatch(/\bEN\b/);
    expect(publicCopy).toMatch(/\bTH\b/);
    expect(publicCopy).not.toMatch(/Sagittarius/i);
  });
});

describe("accountEntryShellChrome", () => {
  it("flips shell chrome strings between EN and TH for Sign in and Register tabs", () => {
    const en = accountEntryShellChrome("EN");
    const th = accountEntryShellChrome("TH");

    expect(en.tabs).toEqual(EN_CHROME.tabs);
    expect(en.headings).toEqual(EN_CHROME.headings);
    expect(en.backHome).toBe(EN_CHROME.backHome);

    expect(th.tabs).toEqual(TH_CHROME.tabs);
    expect(th.headings).toEqual(TH_CHROME.headings);
    expect(th.backHome).toBe(TH_CHROME.backHome);

    expect(th.tabs.signIn).not.toBe(en.tabs.signIn);
    expect(th.tabs.register).not.toBe(en.tabs.register);
    expect(th.headings.signIn).not.toBe(en.headings.signIn);
    expect(th.headings.register).not.toBe(en.headings.register);
    expect(th.backHome).not.toBe(en.backHome);
  });
});
