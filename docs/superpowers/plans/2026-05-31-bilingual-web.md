# Bilingual Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sagittarius web app bilingual in English and Thai with English as the default language and no locale segments in URLs.

**Architecture:** Add a typed client-side i18n layer with `en` and `th` message dictionaries, a React provider, a `useI18n` hook, and a compact language switch. Migrate production UI strings from hardcoded copy to dictionary-backed labels while preserving trip data, member names, place names, and route paths. Verify with focused unit tests, representative component tests, Storybook coverage, and real browser QA.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Storybook, localStorage, CSS modules through existing global CSS.

---

## File Structure

- Create `frontend/src/i18n/types.ts`: locale types, message type, and helpers for dictionary typing.
- Create `frontend/src/i18n/messages.ts`: English and Thai dictionaries.
- Create `frontend/src/i18n/I18nProvider.tsx`: provider, hook, persistence, and `<html lang>` side effect.
- Create `frontend/src/i18n/LanguageSwitch.tsx`: reusable `EN | TH` switch.
- Create `frontend/src/i18n/test-utils.tsx`: test render helper that wraps components in `I18nProvider`.
- Create `frontend/src/i18n/I18nProvider.test.tsx`: provider and persistence tests.
- Modify `frontend/app/layout.tsx`: keep server default `lang="en"` and wrap children with the provider.
- Modify `frontend/app/globals.css`: language switch styling.
- Modify `frontend/src/routes/app-routes.ts`: make nav labels dictionary-driven through a new helper that accepts translated labels.
- Modify `frontend/src/components/AppShell.tsx`: translate shell labels, role labels, confirm text, and add switch.
- Modify `frontend/src/components/AccountAccessPanel.tsx`: translate access surfaces and add switch when sidebar is absent.
- Modify `frontend/src/components/TripJoinGate.tsx`: translate join flow labels, errors, status, and password affordances.
- Modify planning components in `frontend/src/components`: translate user-facing UI copy in overview, itinerary, map, timeline, members, context rail, stop dialog, suggestion panel, page header helpers, and itinerary display helpers.
- Modify existing component tests that assert labels so they use English default or wrap in Thai for language-specific assertions.
- Modify Storybook stories for page templates so English is default and at least one Thai variant exists.

## Task 1: Add Typed I18n Core

**Files:**
- Create: `frontend/src/i18n/types.ts`
- Create: `frontend/src/i18n/messages.ts`
- Create: `frontend/src/i18n/I18nProvider.tsx`
- Create: `frontend/src/i18n/LanguageSwitch.tsx`
- Create: `frontend/src/i18n/test-utils.tsx`
- Create: `frontend/src/i18n/I18nProvider.test.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Write provider tests**

Create `frontend/src/i18n/I18nProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nProvider";
import { LanguageSwitch } from "./LanguageSwitch";

function Probe() {
  const { locale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span>{t.common.language.english}</span>
      <span>{t.appShell.nav.overview}</span>
      <LanguageSwitch />
    </div>
  );
}

describe("I18nProvider", () => {
  it("renders English by default", () => {
    localStorage.clear();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("switches to Thai immediately and persists the choice", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    const { unmount } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("th");
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
    expect(localStorage.getItem("sagittarius-locale")).toBe("th");
    expect(document.documentElement).toHaveAttribute("lang", "th");

    unmount();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("th");
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
  });

  it("falls back to English for an unknown stored locale", () => {
    localStorage.setItem("sagittarius-locale", "fr");

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
cd frontend
bun run test src/i18n/I18nProvider.test.tsx
```

Expected: fail because `I18nProvider`, `LanguageSwitch`, and dictionaries do not exist yet.

- [ ] **Step 3: Add locale types**

Create `frontend/src/i18n/types.ts`:

```ts
export const supportedLocales = ["en", "th"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "th";
}
```

- [ ] **Step 4: Add the initial typed dictionaries**

Create `frontend/src/i18n/messages.ts`:

```ts
import type { Locale } from "./types";

export const messages = {
  en: {
    common: {
      language: {
        label: "Language",
        english: "English",
        thai: "Thai",
        switchToEnglish: "English",
        switchToThai: "ภาษาไทย",
      },
      actions: {
        cancel: "Cancel",
        close: "Close",
        save: "Save",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        back: "Back",
        loading: "Loading",
      },
      status: {
        all: "All",
        open: "Open",
        done: "Done",
        disabled: "Disabled",
        active: "Active",
        pending: "Pending",
        copied: "Copied",
        copyFailed: "Copy failed",
      },
    },
    appShell: {
      navLabel: "Sagittarius planning navigation",
      nav: {
        overview: "Overview",
        itinerary: "Itinerary",
        map: "Map",
        timeline: "Timeline",
        members: "Members",
        expenses: "Expenses",
      },
      expandNavigation: "Expand navigation",
      collapseNavigation: "Collapse navigation",
      planSummary: "Plan summary",
      tripDuration: ({ days, nights }: { days: number; nights: number }) => `${days} days ${nights} nights`,
      placeCount: ({ count }: { count: number }) => `${count} places`,
      viewDetails: "View details",
      switchIdentity: "Switch identity",
      confirmSwitchIdentity: ({ name }: { name: string }) => `Switch identity from ${name}? You will need to verify again to return.`,
      roles: {
        owner: "Owner",
        organizer: "Organizer",
        traveler: "Traveler",
        viewer: "Viewer",
      },
    },
    routes: {
      overview: "Overview",
      itinerary: "Itinerary",
      map: "Map",
      timeline: "Timeline",
      members: "Members",
    },
    access: {
      mainLabels: {
        combined: "Account access",
        accountLogin: "Account login",
        accountRegister: "Account register",
        tripAccess: "Trip access",
      },
      eyebrow: "Sagittarius access",
      titles: {
        combined: "Manage trips with an account or temporary access",
        accountLogin: "Sign in to your account",
        accountRegister: "Create an account",
        tripAccess: "Enter a trip with temporary access",
      },
      details: {
        combined: "Accounts keep trip history, stats, and owner rights. Temporary access still opens an existing trip immediately.",
        accountLogin: "Use an email code or passkey to return to the account connected to your trips.",
        accountRegister: "Create an account with an email code to keep trip history, stats, and owner rights.",
        tripAccess: "Enter the Trip ID and password to open an existing trip without an account.",
      },
      tabs: {
        account: "Account",
        temp: "Temp access",
        label: "Access mode",
      },
      messages: {
        accountLoadFailed: "Could not load account data.",
        loggedOut: "Signed out of account.",
        trustedLogin: "Signed in as a trusted device.",
        temporaryLogin: "Signed in temporarily.",
      },
    },
    join: {
      pageLabel: "Join trip",
      eyebrow: "Sagittarius trip access",
      roomTitle: "Enter trip room",
      participantTitle: "Choose identity",
      roomDetail: "Enter this plan's Trip ID and password before choosing a member.",
      participantDetail: "Choose your name, then set or confirm your personal password for this trip.",
      tripId: "Trip ID",
      tripPassword: "Trip password",
      showTripPassword: "Show trip password",
      hideTripPassword: "Hide trip password",
      submitRoom: "Enter trip",
      backToRoom: "Change trip",
      participantListLabel: "Trip member list",
      participantPassword: ({ name }: { name: string }) => `${name}'s password`,
      setParticipantPassword: ({ name }: { name: string }) => `Set password for ${name}`,
      showParticipantPassword: "Show participant password",
      hideParticipantPassword: "Hide participant password",
      start: "Start",
      errors: {
        tripCredentials: "Trip ID or password is incorrect.",
        participantPassword: "Password is incorrect.",
        shortPassword: "Set a password with at least 4 characters.",
      },
      memberStatus: {
        ready: "Ready",
        claimed: "Verified",
        disabled: "Disabled",
      },
    },
  },
  th: {
    common: {
      language: {
        label: "ภาษา",
        english: "English",
        thai: "ไทย",
        switchToEnglish: "English",
        switchToThai: "ภาษาไทย",
      },
      actions: {
        cancel: "ยกเลิก",
        close: "ปิด",
        save: "บันทึก",
        add: "เพิ่ม",
        edit: "แก้ไข",
        delete: "ลบ",
        confirm: "ยืนยัน",
        back: "ย้อนกลับ",
        loading: "กำลังโหลด",
      },
      status: {
        all: "ทั้งหมด",
        open: "ยังไม่ได้ทำ",
        done: "เรียบร้อย",
        disabled: "ปิดสิทธิ์",
        active: "เปิดสิทธิ์",
        pending: "รอเข้าร่วม",
        copied: "คัดลอกแล้ว",
        copyFailed: "คัดลอกไม่สำเร็จ",
      },
    },
    appShell: {
      navLabel: "เมนูวางแผน Sagittarius",
      nav: {
        overview: "ภาพรวม",
        itinerary: "แผนการเดินทาง",
        map: "แผนที่",
        timeline: "ไทม์ไลน์",
        members: "สมาชิก",
        expenses: "ค่าใช้จ่าย",
      },
      expandNavigation: "ขยายเมนู",
      collapseNavigation: "ย่อเมนู",
      planSummary: "สรุปแผน",
      tripDuration: ({ days, nights }: { days: number; nights: number }) => `${days} วัน ${nights} คืน`,
      placeCount: ({ count }: { count: number }) => `${count} สถานที่`,
      viewDetails: "ดูสรุปรายละเอียด",
      switchIdentity: "เปลี่ยนตัวตน",
      confirmSwitchIdentity: ({ name }: { name: string }) => `เปลี่ยนตัวตนจาก ${name}? คุณจะต้องยืนยันตัวตนใหม่เพื่อกลับเข้ามา`,
      roles: {
        owner: "เจ้าของแผน",
        organizer: "ผู้จัดทริป",
        traveler: "ผู้ร่วมเดินทาง",
        viewer: "ผู้ชม",
      },
    },
    routes: {
      overview: "ภาพรวม",
      itinerary: "แผนการเดินทาง",
      map: "แผนที่",
      timeline: "ไทม์ไลน์",
      members: "สมาชิก",
    },
    access: {
      mainLabels: {
        combined: "Account access",
        accountLogin: "Account login",
        accountRegister: "Account register",
        tripAccess: "Trip access",
      },
      eyebrow: "Sagittarius access",
      titles: {
        combined: "จัดการ trip ด้วย account หรือเข้าแบบ temp",
        accountLogin: "เข้าสู่ account",
        accountRegister: "สร้าง account",
        tripAccess: "เข้า trip แบบ temp access",
      },
      details: {
        combined: "Account จะเก็บประวัติ สถิติ และสิทธิ owner ส่วน temp access ยังใช้เข้าทริปเดิมได้ทันที",
        accountLogin: "ใช้ email code หรือ passkey เพื่อกลับเข้า account ที่ผูกกับ trip ของคุณ",
        accountRegister: "สร้าง account ด้วย email code เพื่อเก็บประวัติ trip สถิติ และสิทธิ owner",
        tripAccess: "กรอก Trip ID และ password เพื่อเข้า trip เดิมโดยไม่ต้องใช้ account",
      },
      tabs: {
        account: "Account",
        temp: "Temp access",
        label: "โหมดเข้าใช้งาน",
      },
      messages: {
        accountLoadFailed: "โหลดข้อมูล account ไม่สำเร็จ",
        loggedOut: "ออกจาก account แล้ว",
        trustedLogin: "เข้าสู่ระบบแบบ trusted device แล้ว",
        temporaryLogin: "เข้าสู่ระบบแบบ temporary แล้ว",
      },
    },
    join: {
      pageLabel: "Join trip",
      eyebrow: "Sagittarius trip access",
      roomTitle: "เข้าห้อง trip",
      participantTitle: "เลือกตัวตน",
      roomDetail: "กรอก Trip ID และ password ของแผนนี้ก่อนเลือกสมาชิก",
      participantDetail: "เลือกชื่อของคุณ แล้วตั้งหรือยืนยันรหัสเฉพาะตัวสำหรับ trip นี้",
      tripId: "Trip ID",
      tripPassword: "Trip password",
      showTripPassword: "แสดงรหัสห้อง trip",
      hideTripPassword: "ซ่อนรหัสห้อง trip",
      submitRoom: "เข้าห้อง trip",
      backToRoom: "เปลี่ยน trip",
      participantListLabel: "รายชื่อสมาชิกใน trip",
      participantPassword: ({ name }: { name: string }) => `รหัสของ ${name}`,
      setParticipantPassword: ({ name }: { name: string }) => `ตั้งรหัสสำหรับ ${name}`,
      showParticipantPassword: "แสดงรหัสสมาชิก",
      hideParticipantPassword: "ซ่อนรหัสสมาชิก",
      start: "เริ่มใช้งาน",
      errors: {
        tripCredentials: "Trip ID หรือ password ไม่ถูกต้อง",
        participantPassword: "รหัสไม่ถูกต้อง",
        shortPassword: "ตั้งรหัสอย่างน้อย 4 ตัวอักษร",
      },
      memberStatus: {
        ready: "พร้อมใช้งาน",
        claimed: "ยืนยันแล้ว",
        disabled: "ปิดสิทธิ์",
      },
    },
  },
} as const;

export type Messages = typeof messages.en;

const checkedMessages: Record<Locale, Messages> = messages;

export function getMessages(locale: Locale): Messages {
  return checkedMessages[locale];
}
```

- [ ] **Step 5: Add provider and hook**

Create `frontend/src/i18n/I18nProvider.tsx`:

```tsx
"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getMessages, type Messages } from "./messages";
import { defaultLocale, isLocale, type Locale } from "./types";

export const localeStorageKey = "sagittarius-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      setLocaleState(nextLocale);
      try {
        window.localStorage.setItem(localeStorageKey, nextLocale);
      } catch {
        // Keep the in-memory language switch working when storage is blocked.
      }
    }

    return { locale, setLocale, t: getMessages(locale) };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
}

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(localeStorageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
```

- [ ] **Step 6: Add language switch component**

Create `frontend/src/i18n/LanguageSwitch.tsx`:

```tsx
"use client";

import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "th", label: "TH" },
];

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={["language-switch", className].filter(Boolean).join(" ")} role="group" aria-label={t.common.language.label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.locale}
          className={option.locale === locale ? "language-switch-option language-switch-option--active" : "language-switch-option"}
          aria-pressed={option.locale === locale}
          aria-label={option.locale === "en" ? t.common.language.switchToEnglish : t.common.language.switchToThai}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Add i18n test render helper**

Create `frontend/src/i18n/test-utils.tsx`:

```tsx
import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider } from "./I18nProvider";
import type { Locale } from "./types";

interface RenderWithI18nOptions extends RenderOptions {
  locale?: Locale;
}

export function renderWithI18n(ui: ReactElement, { locale, ...options }: RenderWithI18nOptions = {}) {
  if (locale) {
    window.localStorage.setItem("sagittarius-locale", locale);
  }

  return render(<I18nProvider>{ui}</I18nProvider>, options);
}
```

- [ ] **Step 8: Wrap app layout with provider**

Modify `frontend/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sagittarius Travel Planning Cockpit",
  description: "A production-oriented collaborative travel planning cockpit.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Run the focused test and commit**

Run:

```bash
cd frontend
bun run test src/i18n/I18nProvider.test.tsx
```

Expected: pass.

Commit:

```bash
git add frontend/src/i18n frontend/app/layout.tsx
git commit -m "Add bilingual i18n foundation"
```

## Task 2: Style And Wire The Persistent Language Switch

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/components/AppShell.test.tsx`
- Modify: `frontend/src/routes/app-routes.ts`
- Modify: `frontend/src/routes/app-routes.test.ts`

- [ ] **Step 1: Add failing AppShell language tests**

Modify `frontend/src/components/AppShell.test.tsx` to wrap renders with `renderWithI18n` and add:

```tsx
it("renders English shell labels by default and can switch to Thai", async () => {
  const user = userEvent.setup();
  renderWithI18n(
    <AppShell
      activeView="overview"
      collapsed={false}
      currentMember={seedTrip.members.find((member) => member.role === "traveler")!}
      trip={seedTrip}
      onToggleCollapsed={() => {}}
    >
      <main>content</main>
    </AppShell>,
  );

  expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
  expect(screen.getByText("Traveler")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

  expect(screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
  expect(screen.getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the AppShell test and confirm it fails**

Run:

```bash
cd frontend
bun run test src/components/AppShell.test.tsx
```

Expected: fail because `AppShell` still uses hardcoded Thai and the language switch is not rendered.

- [ ] **Step 3: Make route nav labels injectable**

Modify `frontend/src/routes/app-routes.ts` so `tripWorkspaceNavItems` accepts labels:

```ts
export interface TripWorkspaceNavLabels {
  overview: string;
  itinerary: string;
  map: string;
  timeline: string;
  members: string;
}

export function tripWorkspaceNavItems(tripId: string, labels: TripWorkspaceNavLabels): TripWorkspaceNavItem[] {
  return [
    { id: "overview", label: labels.overview, icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: labels.itinerary, icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: labels.map, icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: labels.timeline, icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "members", label: labels.members, icon: "users", href: appRoutes.tripMembers(tripId) },
  ];
}
```

Update `frontend/src/routes/app-routes.test.ts` so calls pass:

```ts
const labels = {
  overview: "Overview",
  itinerary: "Itinerary",
  map: "Map",
  timeline: "Timeline",
  members: "Members",
};
```

- [ ] **Step 4: Translate AppShell and add switch**

Modify `frontend/src/components/AppShell.tsx`:

```tsx
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
```

Inside `AppShell`:

```tsx
const { t } = useI18n();
const navItems = tripWorkspaceNavItems(trip.id, t.routes);
```

Use dictionary labels:

```tsx
<nav className="side-rail" data-collapsed={collapsed ? "true" : "false"} aria-label={t.appShell.navLabel}>
```

```tsx
aria-label={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
title={collapsed ? t.appShell.expandNavigation : t.appShell.collapseNavigation}
```

Add the switch after the rail links:

```tsx
<LanguageSwitch className="side-rail-language" />
```

Replace summary and role text with:

```tsx
<div className="rail-summary" aria-label={t.appShell.planSummary}>
  <strong>{t.appShell.planSummary}</strong>
  <span><Icon name="calendar" /> {t.appShell.tripDuration({ days: tripDays, nights: tripNights })}</span>
  <span><Icon name="location" /> {t.appShell.placeCount({ count: trip.itineraryItems.length })}</span>
  <Link href={appRoutes.tripOverview(trip.id)} className="rail-summary-link">{t.appShell.viewDetails}</Link>
</div>
```

Change the role helper:

```tsx
function roleLabel(role: Member["role"], labels: ReturnType<typeof useI18n>["t"]["appShell"]["roles"]): string {
  return labels[role];
}
```

Call it with:

```tsx
<span>{roleLabel(currentMember.role, t.appShell.roles)}</span>
```

- [ ] **Step 5: Add language switch CSS**

Append to `frontend/app/globals.css` near sidebar utility styles:

```css
.language-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
}

.language-switch-option {
  min-width: 38px;
  min-height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.language-switch-option--active {
  background: var(--text-strong);
  color: var(--surface);
}

.side-rail-language {
  margin: 8px 14px 4px;
  align-self: flex-start;
}

.side-rail[data-collapsed="true"] .side-rail-language {
  align-self: center;
  margin-inline: 0;
}
```

- [ ] **Step 6: Run route and AppShell tests, then commit**

Run:

```bash
cd frontend
bun run test src/routes/app-routes.test.ts src/components/AppShell.test.tsx
```

Expected: pass.

Commit:

```bash
git add frontend/app/globals.css frontend/src/routes/app-routes.ts frontend/src/routes/app-routes.test.ts frontend/src/components/AppShell.tsx frontend/src/components/AppShell.test.tsx
git commit -m "Add bilingual workspace shell"
```

## Task 3: Translate Account And Trip Access Flow

**Files:**
- Modify: `frontend/src/components/AccountAccessPanel.tsx`
- Modify: `frontend/src/components/TripJoinGate.tsx`
- Modify: `frontend/src/components/AccountAccessPanel.test.tsx`
- Modify: `frontend/src/components/TripJoinGate.test.tsx`
- Modify: `frontend/src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Add default English and Thai switch tests for access flow**

In `frontend/src/components/TripJoinGate.test.tsx`, add a test rendering the component inside `I18nProvider`:

```tsx
it("renders the join flow in English by default and switches to Thai", async () => {
  const user = userEvent.setup();
  renderWithI18n(
    <TripJoinGate
      trip={seedTrip}
      onTripChange={() => {}}
      onAuthenticated={() => {}}
    />,
  );

  expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Trip ID/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

  expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run access tests and confirm failure**

Run:

```bash
cd frontend
bun run test src/components/TripJoinGate.test.tsx src/components/AccountAccessPanel.test.tsx
```

Expected: fail because the access flow is still hardcoded and has no language switch on standalone access screens.

- [ ] **Step 3: Translate TripJoinGate**

Modify `frontend/src/components/TripJoinGate.tsx`:

```tsx
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
```

Inside the component:

```tsx
const { t } = useI18n();
```

Replace user-facing labels and errors:

```tsx
setError(t.join.errors.tripCredentials);
setError(errorMessage(caught, t.join.errors.tripCredentials));
setError(t.join.errors.participantPassword);
setError(t.join.errors.shortPassword);
```

In the hero:

```tsx
<p className="join-eyebrow">{t.join.eyebrow}</p>
<h1>{step === "room" ? t.join.roomTitle : t.join.participantTitle}</h1>
<p>{step === "room" ? t.join.roomDetail : t.join.participantDetail}</p>
<LanguageSwitch className="access-language-switch" />
```

Use dictionary labels in forms:

```tsx
<span>{t.join.tripId}</span>
<span>{t.join.tripPassword}</span>
aria-label={showTripPassword ? t.join.hideTripPassword : t.join.showTripPassword}
{t.join.submitRoom}
{t.join.backToRoom}
aria-label={t.join.participantListLabel}
{selectedMember.claimPasswordHash ? t.join.participantPassword({ name: selectedMember.displayName }) : t.join.setParticipantPassword({ name: selectedMember.displayName })}
aria-label={showParticipantPassword ? t.join.hideParticipantPassword : t.join.showParticipantPassword}
{t.join.start}
```

Change helpers to accept labels:

```tsx
function roleLabel(role: Member["role"], labels: Messages["appShell"]["roles"]): string {
  return labels[role];
}

function participantStatusLabel(member: Member, labels: Messages["join"]["memberStatus"]): string {
  if (isTripParticipantDisabled(member)) return labels.disabled;
  if (member.claimPasswordHash) return labels.claimed;
  return labels.ready;
}
```

- [ ] **Step 4: Translate AccountAccessPanel**

Modify `frontend/src/components/AccountAccessPanel.tsx`:

```tsx
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
```

Inside the component:

```tsx
const { t } = useI18n();
```

Replace hero/access labels:

```tsx
<main className="account-page" aria-label={mainLabel(accessMode, t.access.mainLabels)}>
<p className="join-eyebrow">{t.access.eyebrow}</p>
<h1>{heroTitle(accessMode, t.access.titles)}</h1>
<p>{heroDetail(accessMode, t.access.details)}</p>
<LanguageSwitch className="access-language-switch" />
```

Replace tab labels and messages:

```tsx
aria-label={t.access.tabs.label}
{t.access.tabs.account}
{t.access.tabs.temp}
setError(errorMessage(caught, t.access.messages.accountLoadFailed));
setMessage(t.access.messages.loggedOut);
setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
```

Change helper signatures:

```tsx
function mainLabel(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["mainLabels"]): string
function heroTitle(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["titles"]): string
function heroDetail(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["details"]): string
```

- [ ] **Step 5: Add access language CSS**

Append to `frontend/app/globals.css`:

```css
.access-language-switch {
  margin-top: 14px;
}
```

- [ ] **Step 6: Update changed tests for English default**

In `frontend/src/components/SagittariusApp.test.tsx`, replace default access-flow expectations with English labels. Use these exact replacements in the guest-authentication tests:

```tsx
await user.click(screen.getByRole("button", { name: /Enter trip/i }));
await user.type(screen.getByLabelText(/Set password for Explorer Friend/i), "traveler-pin");
await user.click(screen.getByRole("button", { name: /Start/i }));
```

Use Thai labels only in tests that first click the Thai language switch:

```tsx
await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));
await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
```

- [ ] **Step 7: Run access tests and commit**

Run:

```bash
cd frontend
bun run test src/components/TripJoinGate.test.tsx src/components/AccountAccessPanel.test.tsx src/components/SagittariusApp.test.tsx
```

Expected: pass.

Commit:

```bash
git add frontend/app/globals.css frontend/src/components/AccountAccessPanel.tsx frontend/src/components/TripJoinGate.tsx frontend/src/components/AccountAccessPanel.test.tsx frontend/src/components/TripJoinGate.test.tsx frontend/src/components/SagittariusApp.test.tsx
git commit -m "Translate account and trip access flow"
```

## Task 4: Translate Planning Workspace Surfaces

**Files:**
- Modify: `frontend/src/i18n/messages.ts`
- Modify: `frontend/src/components/OverviewPage.tsx`
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Modify: `frontend/src/components/RouteMapView.tsx`
- Modify: `frontend/src/components/TimelineView.tsx`
- Modify: `frontend/src/components/TripMembersPage.tsx`
- Modify: `frontend/src/components/ContextRail.tsx`
- Modify: `frontend/src/components/StopDialog.tsx`
- Modify: `frontend/src/components/SuggestionPanel.tsx`
- Modify: `frontend/src/components/PageHeader.tsx`
- Modify: `frontend/src/components/itineraryDisplay.ts`
- Modify related tests in `frontend/src/components/*.test.tsx`

- [ ] **Step 1: Add representative failing tests**

Add one English-default assertion and one Thai-switch assertion to existing tests:

```tsx
expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: /Focus for today/i })).toBeInTheDocument();
```

For Thai after switching:

```tsx
await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));
expect(screen.getByRole("heading", { name: /วันนี้ต้องโฟกัส/i })).toBeInTheDocument();
```

Add itinerary shell assertions:

```tsx
expect(screen.getByRole("button", { name: /Add stop or activity/i })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));
expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run representative tests and confirm failure**

Run:

```bash
cd frontend
bun run test src/components/OverviewPage.test.tsx src/components/SmartItineraryTable.test.tsx src/components/SagittariusApp.test.tsx
```

Expected: fail because planning surfaces are still Thai-first.

- [ ] **Step 3: Expand messages for planning UI**

Add these sections to both dictionaries in `frontend/src/i18n/messages.ts`: `overview`, `itinerary`, `map`, `timeline`, `members`, `contextRail`, `stopDialog`, `suggestions`, and `dates`.

Use English labels that match current intent:

```ts
overview: {
  pageLabel: "Trip overview",
  roleHeadings: {
    manager: "Command center",
    traveler: "My travel view",
    viewer: "Trip preview",
  },
  stats: {
    duration: "Trip length",
    activities: "Planned stops",
    totalSpend: "Total spend",
    activeMembers: "Active members",
  },
  focusToday: "Focus for today",
  checklist: "My checklist",
  addPersonalTask: "Add something to prepare",
  personalTaskPlaceholder: "For example, pack a travel adapter",
  addTask: "Add",
  noChecklist: "No checklist items yet.",
  expenses: "My trip money",
  generalExpense: "Add a shared expense",
}
```

Use Thai labels equivalent to the current UI:

```ts
overview: {
  pageLabel: "Trip overview",
  roleHeadings: {
    manager: "ศูนย์จัดการทริป",
    traveler: "มุมมองการเดินทางของฉัน",
    viewer: "ภาพรวมทริป",
  },
  stats: {
    duration: "ระยะทริป",
    activities: "กิจกรรมในแผน",
    totalSpend: "ค่าใช้จ่ายรวม",
    activeMembers: "สมาชิกที่ใช้งาน",
  },
  focusToday: "วันนี้ต้องโฟกัส",
  checklist: "เช็กลิสต์ของฉัน",
  addPersonalTask: "เพิ่มของที่ต้องเตรียม",
  personalTaskPlaceholder: "เช่น เตรียมปลั๊กแปลง",
  addTask: "เพิ่ม",
  noChecklist: "ยังไม่มีเช็กลิสต์ของคุณ",
  expenses: "เงินทริปของฉัน",
  generalExpense: "เพิ่มค่าใช้จ่ายทั่วไป",
}
```

Add similar concrete keys for visible labels in each touched component. Keep all keys nested by component domain so TypeScript catches missing Thai translations.

- [ ] **Step 4: Migrate each planning component**

For each component listed in this task:

1. Import `useI18n`.
2. Read `const { locale, t } = useI18n();`.
3. Replace hardcoded UI strings with `t.<domain>.<key>`.
4. Pass `locale` into date/label helpers where English and Thai differ.
5. Leave trip data untouched, including item activity, place, member names, notes, tasks, and suggestions.

Example for `OverviewPage.tsx`:

```tsx
const { t } = useI18n();

return (
  <section className="overview-page" aria-label={t.overview.pageLabel}>
    <PageHeader
      title={t.overview.roleHeadings[roleLens]}
      subtitle={trip.name}
      ...
    />
    <OverviewStat icon="calendar" label={t.overview.stats.duration} value={t.dates.dayCount({ count: tripDays.length })} />
  </section>
);
```

- [ ] **Step 5: Update helper functions for locale-aware labels**

Change `frontend/src/components/itineraryDisplay.ts` helpers from fixed Thai labels to locale-aware labels:

```ts
import type { Locale } from "@/src/i18n/types";

export function formatThaiDate(value: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
```

Rename the function only if all call sites are updated in the same task; otherwise keep the current name and make behavior locale-aware to reduce churn.

- [ ] **Step 6: Run component test batch and commit**

Run:

```bash
cd frontend
bun run test src/components/OverviewPage.test.tsx src/components/SmartItineraryTable.test.tsx src/components/RouteMapView.test.tsx src/components/TripMembersPage.test.tsx src/components/ContextRail.test.tsx src/components/StopDialog.test.tsx src/components/SuggestionPanel.test.tsx src/components/SagittariusApp.test.tsx
```

Expected: pass.

Commit:

```bash
git add frontend/src/i18n/messages.ts frontend/src/components frontend/src/i18n/test-utils.tsx
git commit -m "Translate trip planning workspace"
```

## Task 5: Storybook Bilingual Coverage

**Files:**
- Modify: `frontend/src/components/AppShell.stories.tsx`
- Modify: `frontend/src/components/OverviewPage.stories.tsx`
- Modify: `frontend/src/components/ItineraryPage.stories.tsx`
- Modify: `frontend/src/components/MapPage.stories.tsx`
- Modify: `frontend/src/components/TimelinePage.stories.tsx`
- Modify: `frontend/src/components/MembersPage.stories.tsx`
- Modify: `frontend/src/components/HomeLanding.stories.tsx`

- [ ] **Step 1: Add a Storybook decorator helper**

Create or update story decorators to wrap page stories:

```tsx
import { I18nProvider } from "@/src/i18n/I18nProvider";

const withI18n = (Story: () => React.ReactNode) => (
  <I18nProvider>
    <Story />
  </I18nProvider>
);
```

- [ ] **Step 2: Keep English as default stories**

Update play assertions from Thai labels to English default labels. Example in `AppShell.stories.tsx`:

```tsx
play: async ({ canvas }) => {
  await expect(canvas.getByRole("link", { name: /Overview/i })).toHaveAttribute("aria-current", "page");
},
```

- [ ] **Step 3: Add at least one Thai variant**

Add a Thai story for the workspace shell:

```tsx
export const OwnerThai: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: "ภาษาไทย" }).click();
    await expect(canvas.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
  },
};
```

- [ ] **Step 4: Run Storybook tests and commit**

Run:

```bash
cd frontend
bun run test:storybook
```

Expected: pass.

Commit:

```bash
git add frontend/src/components/*.stories.tsx
git commit -m "Add bilingual Storybook coverage"
```

## Task 6: Full Verification And Real-System QA

**Files:**
- Verify current worktree only.
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: Run static and unit verification**

Run:

```bash
cd frontend
bun run lint
bun run typecheck
bun run test
bun run test:storybook
bun run build
bun run build-storybook
```

Expected: all pass.

- [ ] **Step 2: Start the dev app**

Run:

```bash
cd frontend
bun run dev
```

Expected: Next dev server listening on `http://127.0.0.1:5180`.

- [ ] **Step 3: Browser QA default English**

Open `http://127.0.0.1:5180/login` in the in-app browser.

Verify:

- The URL is `/login`, not `/en/login` or `/th/login`.
- The first visible access title is English.
- The language switch shows `EN` active.
- Browser console has no framework overlay, page errors, or hydration errors.

- [ ] **Step 4: Browser QA Thai persistence**

In the browser:

1. Click `TH`.
2. Confirm the visible access title changes to Thai.
3. Reload.
4. Confirm Thai is still active.
5. Click `EN`.
6. Confirm English returns and the URL remains unchanged.

- [ ] **Step 5: Browser QA workspace surface**

Use demo access on `http://127.0.0.1:5180/login`:

1. Enter `DEMO-TRIP`.
2. Enter `demo-trip-pass`.
3. Choose `Explorer Friend`.
4. Set `traveler-pin`.
5. Confirm the workspace opens in the active language.
6. Switch language in the sidebar.
7. Confirm navigation, summary, role label, and one planning panel update.
8. Confirm trip name and place names do not change.

- [ ] **Step 6: Browser QA mobile**

Set viewport to mobile width around `390x844`.

Verify:

- Language switch fits without overlapping sidebar/access content.
- Text does not overflow buttons.
- Current route still does not include a locale segment.

- [ ] **Step 7: Commit verification fixes or mark complete**

If fixes were needed:

```bash
git add frontend docs/superpowers/plans/2026-05-31-bilingual-web.md
git commit -m "Fix bilingual QA issues"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers no URL locale, English default, persisted switch, typed dictionaries, UI-only translation, storage fallback, Storybook, and real browser QA.
- Placeholder scan: The plan avoids `TBD`, `TODO`, and unnamed future work. Task 4 groups repeated component migration but gives the exact component list, dictionary domains, migration rule, and verification command.
- Type consistency: `Locale`, `Messages`, `I18nProvider`, `useI18n`, `LanguageSwitch`, and `renderWithI18n` names are consistent across tasks.
