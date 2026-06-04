# Sagittarius Travel Planning Cockpit - UX/UI Review Report

**Date:** May 30, 2026  
**Auditor:** Antigravity (Advanced AI Coding Assistant)  
**Status:** Complete Audit & Fully Implemented Premium Patches (100% Resolved)  
**Testing Account:** `DEMO-TRIP` / `demo-trip-pass` (Owner: *Demo Traveler*)

---

## ✅ Implementation Checklist

สถานะนี้อัปเดตจากการแก้ใน codebase วันที่ 2026-05-31 และใช้เป็นแหล่งอ้างอิงเร็วว่า issue ในไฟล์นี้ถูกจัดการครบหรือยัง

### Onboarding & Authentication
- [x] เพิ่ม password fallback สำหรับ account login/register ด้วย backend route จริง (`/api/v1/auth/password/sessions`) และเก็บ `password_hash`
- [x] เพิ่มปุ่ม `ส่งรหัสอีกครั้ง` ใน email verification flow
- [x] เพิ่ม resend countdown/cooldown ให้ผู้ใช้เห็นเวลารอก่อนส่งรหัสซ้ำ
- [x] เพิ่ม quick switch ระหว่าง `/login` และ `/register`
- [x] แปล field labels หลักเป็นไทย (`อีเมล`, `รหัสยืนยัน`, `เชื่อถืออุปกรณ์นี้`)
- [x] จำกัดและจัดกลาง card ของ login/register และ join ให้ขนาดสม่ำเสมอ
- [x] เพิ่ม password visibility toggle สำหรับ trip password และ member password
- [x] แปล role/status badge ใน join flow เป็นไทย
- [x] เพิ่ม helper text อธิบายรหัสส่วนตัวของสมาชิกใน first-entry flow
- [x] ย้าย/แสดง member password form ต่อจาก member card ที่เลือกทันที เพื่อไม่ให้ซ่อนท้ายลิสต์

### UX/UI Issues
- [x] แก้ double-password confusion ด้วย helper text
- [x] แก้ mixed language เช่น `First entry` เป็นข้อความไทย
- [x] ทำ role preview switcher ให้มองเห็นได้ใน demo/development review flow
- [x] ปลด `inert` จาก live MapLibre container เมื่อ map พร้อมใช้งาน
- [x] เพิ่มปุ่ม reorder ขึ้น/ลงสำหรับ touch และ keyboard users
- [x] เปลี่ยน start time เป็น native `input type="time"`
- [x] แยก duration เป็นชั่วโมงและนาที
- [x] เปลี่ยน close icon ใน `StopDialog` เป็น `x`

### Accessibility & Design Anti-Patterns
- [x] แสดง location/place metadata ใน itinerary row แทนการซ่อนด้วย `display: none`
- [x] เอา interactive/focusable behavior ออกจาก `<tr>` และใช้ปุ่ม explicit สำหรับ row selection
- [x] เพิ่ม explicit `id`/`htmlFor` ให้ field ใน `StopDialog`
- [x] เพิ่ม show/hide password controls

### User Friction
- [x] reset invite copy feedback หลัง 2.5 วินาที
- [x] ทำ budget widget ให้เป็น action เปิด expenses workspace
- [x] เพิ่ม shortcut ใน side navigation ไปยังค่าใช้จ่าย
- [x] เพิ่มปุ่ม `เพิ่มค่าใช้จ่ายทั่วไป` สำหรับค่าใช้จ่ายที่ไม่ผูกกับ stop รายชั่วโมง
- [x] เพิ่ม edit/delete ให้ stop notes ของเจ้าของ note หรือผู้มีสิทธิ์แก้
- [x] แก้ double-scrollbar trap โดยให้ planning shell เป็น vertical scroll หลัก และ table scroll รับผิดชอบแนวนอน
- [x] เพิ่ม undo toast หลัง toggle checklist task

### Code-Level Bugs
- [x] แก้ `formatThaiDate` ไม่ให้ hardcode เดือน `พ.ค.`
- [x] แก้ `formatTripRange` ให้รองรับช่วงวันที่ข้ามเดือน/ข้ามปี
- [x] เพิ่ม error recovery เมื่อ API `loadTrip` reject เพื่อไม่ให้ UI ค้างถาวร

### Verification
- [x] Unit/component/contract tests ครอบคลุม regression ที่แก้
- [x] Backend contract tests ครอบคลุม password fallback register/login, password hash, invalid payload, และ wrong password
- [x] Frontend tests ครอบคลุม resend cooldown, password fallback, selected member auth placement, expense shortcut, และ side-nav expense entry
- [x] Frontend verification suite ผ่าน (`lint`, `typecheck`, unit tests, Storybook tests, Next build, Storybook build)
- [x] Browser smoke QA สำหรับ `/login`, `/register`, `/join` และ itinerary fixture
- [x] Real backend end-to-end flow ผ่านครบด้วย database + Rust API จริง
- [x] Migration/bootstrap path ครอบคลุม schema เก่าและ local e2e seed: `db-init`, `db-init-test`, และ `seed_e2e` apply `0004_account_password_auth.sql`

### Real Backend QA Evidence
- [x] `rtk make frontend-verify` ผ่านหลังเพิ่ม password fallback, resend countdown, inline member auth form, expense nav/shortcut, overview expense rail, และ mobile rail overflow fix
  - Unit: `26 passed | 1 skipped`, `223 passed | 1 skipped`
  - Storybook tests: `17 passed`, `58 passed`
  - Next production build: passed
  - Storybook build: passed
- [x] `rtk make backend-test` ผ่านหลังเพิ่ม password fallback, migration `0004_account_password_auth.sql`, idempotent migration guard, และ `seed_e2e` migration update
- [x] `rtk make frontend-e2e-local SAGITTARIUS_BIND_ADDR=127.0.0.1:5201` ผ่านหลัง `seed_e2e` apply migration 0004: seed `sagittarius_test`, start Rust API จริง, join trip, hydrate cockpit, create task
- [x] Direct API QA ยืนยัน password endpoint บน Rust server จริง: `POST /api/v1/auth/password/sessions` ตอบ `200` หลัง seed/migration path ล่าสุด
- [x] Playwright browser QA ผ่านบน production Next build ที่ฝัง `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=http://127.0.0.1:5196`
  - Frontend: `http://127.0.0.1:5202`
  - Backend: `http://127.0.0.1:5196`
  - Flow: `/register` → password register → backend password login check → `/join/HK-SZ-2025` → claim participant → overview → side-nav `ค่าใช้จ่าย` → expense rail → `เพิ่มค่าใช้จ่ายทั่วไป`
  - Checks: password login API ตอบ `200`, selected member auth panel อยู่ติดกับ card, expense rail visible, `เพิ่มค่าใช้จ่ายทั่วไป` ไม่ปิด rail, mobile viewport `390x844` ไม่มี horizontal document overflow (`scrollWidth=clientWidth=390`, `offenders=[]`)
  - Console/page/network errors: none
  - Screenshots: `/tmp/sagittarius-real-browser-desktop-after-fix.png`, `/tmp/sagittarius-real-browser-mobile-after-fix.png`
- [x] `rtk make frontend-e2e-local SAGITTARIUS_BIND_ADDR=127.0.0.1:5191` ผ่าน: seed `sagittarius_test`, start Rust API จริง, join trip, hydrate cockpit, create task
- [x] `rtk make backend-test` ผ่าน: backend unit + contract/integration tests ทั้งหมด
- [x] Browser/Playwright real-backend flow ผ่านบน production Next server ที่ชี้ไป Rust API จริง:
  - API: `http://127.0.0.1:5192`
  - Frontend: `http://127.0.0.1:5194`
  - Flow: `/join` → join `HK-SZ-2025` → claim member → cockpit overview → itinerary
  - Network: `/api/v1/trip-join-sessions`, `/claims`, `/trips/:tripId` ตอบ `200`
  - UI checks: smart table render, reorder controls render, row ไม่ focusable, place metadata visible, no horizontal overflow, table vertical overflow computed as hidden
  - Console/page errors: none
  - Screenshot: `/tmp/sagittarius-real-backend-itinerary.png`
- [x] Note: รอบแรกที่ port `127.0.0.1:5181` ล้มเพราะมี `sagittarius-api` process เก่าค้างอยู่และตอบ join route เป็น `404`; rerun บน port ว่าง `5191` ผ่าน

---

## 🎨 Overview of Design & Aesthetics

The **Sagittarius Travel Planning Cockpit** is built with a highly customized, premium design system. It follows the **Calm Travel Ops** and **Friendly Trip Studio** design philosophies.

### Key Visual Strengths
* **Watercolor Paper Texture Theme:** The application implements a highly aesthetic warm cream background (`#fffaf0` / `var(--color-paper-warm)`) with subtle grain textures (`var(--paper-grain)`) and watercolor page washes. It feels organic, premium, and warm—perfect for a travel application.
* **Curated Color Palette:** The UI successfully avoids standard harsh web colors. It uses a sophisticated **Teal** (`#0f766e` / `var(--color-primary)`) as the primary tone, **Blue** (`#2563eb`) for route paths, and warm accent colors (Sunshine `#facc15`, Sky `#38bdf8`, Coral `#fb7185`) that evoke the feeling of a postcard.
* **Beautiful Page Headers:** Each view features a custom `PageHeader` adorned with interactive and responsive decorative elements (`TravelMotif` / `TimelineMotif`) that feel premium and dynamic.

---

## 🔍 Key Pages Inspection & Flow Validation

We successfully signed into the application via `/join` using the demo credentials and checked every main page in the cockpit. Below is our step-by-step flow review:

```mermaid
graph TD
    A["/join (Trip ID & Password)"] --> B["เลือกตัวตน (Select Identity)"]
    B --> C["ตั้งรหัสสมาชิก (Set Member Password)"]
    C --> D["/trips/trip-hong-kong-shenzhen (ภาพรวม)"]
    D --> E["/itinerary (แผนการเดินทาง)"]
    D --> F["/map (แผนที่)")
    D --> G["/timeline (ไทม์ไลน์)"]
    D --> H["/members (รายชื่อสมาชิก)"]
```

### 1. Trip Access / Join Page (`/join`)
* **Purpose:** Allows quick trip entry without needing a global registered account.
* **UX Review:** Clean form, centered layout, clear instructions. The transition from the Trip Login to the "เลือกตัวตน" (Select Identity) screen is smooth.

### 2. Dashboard Home (`/trips/[tripId]`)
* **Purpose:** High-level summary of trip status, focus areas, checklist readiness, alerts, and budgets.
* **UX Review:** Adapts nicely to different member roles. Managers (Owner/Organizer) get a comprehensive health board, while Travelers get a streamlined "วันนี้ต้องโฟกัส" (Today's Focus) list and personal checklists.

### 3. Itinerary View (`/itinerary`)
* **Purpose:** Interactive spreadsheet-like view of the days, activities, transportation, and advisories.
* **UX Review:** Grouping items by day with collapsible group headers is excellent for readability. Highlights selected items and supports dragging rows for quick rescheduling.

### 4. Route Map View (`/map`)
* **Purpose:** Visualization of stops and travel lines across Hong Kong and Shenzhen.
* **UX Review:** Dynamic day filtering allows toggling between days. It supports a live MapLibre GL JS engine with OpenFreeMap coordinates, falling back gracefully to a beautiful mock SVG map if offline.

### 5. Timeline view (`/timeline`)
* **Purpose:** Vertical grid timeline that groups stops into visual time blocks side-by-side.
* **UX Review:** The grid structure allows a quick chronological scan of the entire trip.

### 6. Members View (`/members`)
* **Purpose:** Overview of participant roles, access control, and copyable invite links.
* **UX Review:** Clean, interactive switches for toggling access or editing passwords, plus clear summary badges.

---

## 🔑 Onboarding & Authentication Review (Login / Register / Join)

The onboarding flow provides two pathways to access a trip: **Global Account Access (Login/Register via Email Verification or Passkey)** and **Room-level Temporary Access (Trip Join)**. While the layouts are clean, we identified several significant UX friction points:

### 1. Account Login & Registration (`/login` & `/register` via `EmailLoginPanel`)
* **Passwordless OTP Only (No Password Fallback):** The system relies solely on an Email Verification Code (OTP) or Passkeys. While highly secure, forcing OTP-only login on every new session causes substantial friction because users are forced to task-switch (leave the app, open their email, copy the code, and return).
* **Missing "Resend Code" (ส่งรหัสอีกครั้ง) Button:** Once the email is requested, the code entry screen lacks a resend timer or button. If the verification email is delayed, users are stuck. Their only way out is to click "เปลี่ยนอีเมล" (Change email) and re-type their email address to trigger a new email.
* **Lack of Quick Navigation Switcher:** The Login and Register card forms look identical. There is no simple text link at the bottom (e.g., *"ยังไม่มีบัญชี? สมัครใช้งาน"* or *"มีบัญชีแล้ว? เข้าสู่ระบบ"*) to let users toggle between flows easily.
* **Mixed Language Labels:** Field labels like `"Email *"`, `"Code *"`, and the checkbox label `"Trust this PC"` are written in English, whereas the primary submit buttons are localized in Thai (`"ส่งรหัส login"`, `"เข้า account"`).

### 2. Temporary Trip Join Flow (`/join` via `TripJoinGate`)
* **Hidden Password Input (Below-the-Fold Blindness):** In the "เลือกตัวตน" (Select Identity) step, clicking a member card reveals the password field (`"รหัสของ..."` or `"ตั้งรหัสสำหรับ..."`) at the very bottom of the component. If the list of members is long (e.g. 5+ members), the form is rendered **below the visible screen fold**. Users often click a member card and think nothing happened because the input field is scroll-hidden.
* **No Password Visibility Toggle (Eye Icon):** The password fields for both the shared trip room password and the traveler-specific passwords are typed blindly. On mobile touchscreens, this leads to frequent typos and login frustration.
* **Mixed-Language Roles and Status Badges:** The member cards feature subtitles like `Owner`, `Organizer`, `Traveller`, `Viewer` and badges like `Disabled` (Red), `Claimed` (Green), or `First entry` (Yellow) in English, contrasting with the Thai headers and instructions.

---

## ⚠️ 7 Bad UX/UI Issues & Actionable Fixes

During the audit, we discovered **7 specific UX/UI issues** ranging from interaction friction, mobile limitations, visual inconsistencies, and broken interactive elements. Here is the detailed breakdown:

### 1. Confusing "Double Password" Flow on First Entry
* **The Issue:** When a traveler first joins the shared room, they must enter the **Trip Password** (`demo-trip-pass`). Once they select their identity, they are immediately asked to **"ตั้งรหัสสำหรับ..." (Set password for...)** to secure their member slot. New users are often confused by why they are entering two consecutive passwords and frequently re-enter the shared trip password or feel stuck.
* **The Bad UX:** High cognitive load, lack of context explanation.
* **Actionable Recommendation:** Add a small helper text explaining that this is a **personal password** to prevent other members of the trip from editing or selecting their avatar:
  > **คำแนะนำ:** "ตั้งรหัสส่วนตัวเฉพาะคุณ เพื่อป้องกันไม่ให้สมาชิกคนอื่นเข้าใช้งานแทนคุณในอนาคต (ไม่ใช่รหัสผ่านห้อง trip)"

---

### 2. English Suffix Splicing in a Thai UI ("First entry")
* **The Issue:** On the identity selection screen, button labels are rendered as `Demo Traveler Owner First entry` or `Family Member Viewer First entry`. The term `"First entry"` is hardcoded in English, which breaks the language consistency of an otherwise fully localized Thai UI.
* **The Bad UX:** Visual polish failure, language mix.
* **Code Location:** `frontend/src/trip/auth.ts` or dynamically formatted in the Join screen component.
* **Actionable Recommendation:** Localize `"First entry"` to Thai (e.g., `" (เข้าครั้งแรก)"` or `" (ยังไม่ได้ตั้งรหัส)"`) so it matches the surrounding Thai language:
  ```diff
  - `${member.displayName} ${roleLabel} First entry`
  + `${member.displayName} (${roleLabel} - เข้าครั้งแรก)`
  ```

---

### 3. Visually Hidden "Role Preview / Switcher" Dropdown
* **The Issue:** To test different role views (Owner vs. Organizer vs. Viewer), the app mounts a `<select>` for Role Preview in `SagittariusApp.tsx` (lines 650–659). However, it is wrapped in `className="sr-only"` (Screen Reader Only), making it completely invisible to visual developers, QA testers, or reviewers. To change identities visually, a tester is forced to log out and go through the `/join` flow again.
* **The Bad UX:** High testing friction. For QA and product review, a visible simulation toolbar is invaluable.
* **Actionable Recommendation:** Remove the `sr-only` class or wrap it in a floating "Debug/Preview Bar" visible only in development/demo mode (`process.env.NODE_ENV !== 'production'`) to let reviewers try roles seamlessly:
  ```tsx
  {process.env.NODE_ENV === "development" && (
    <div className="debug-role-switcher">
      <label>Simulation Role: 
        <select value={currentMember.id} onChange={...}>...</select>
      </label>
    </div>
  )}
  ```

---

### 4. Interactive Live Map is Blocked (`inert = true`)
* **The Issue:** When the MapLibre GL map loads, the code explicitly locks the container:
  ```typescript
  container.inert = true;
  container.tabIndex = -1;
  ```
  This makes the live map **completely non-interactive**. Users cannot pan, zoom, pinch, or click on markers. It behaves exactly like a static image despite loading a heavy canvas library.
* **The Bad UX:** Frustrating experience for users who try to drag or zoom the map. The map already utilizes `cooperativeGestures: true` (requiring two-finger scroll), so blocking the entire element with `inert` is a double-locking mistake.
* **Code Location:** `frontend/src/components/RouteMapView.tsx` (lines 88, 89, 186).
* **Actionable Recommendation:** Remove `container.inert = true` and `container.tabIndex = -1` when the map state is `"ready"` to restore native map navigation and zooming:
  ```diff
  - container.inert = true;
  - container.tabIndex = -1;
  ```

---

### 5. Itinerary Reordering is Inaccessible on Mobile (Desktop-Only Drag & Drop)
* **The Issue:** Reordering stops in the itinerary spreadsheet uses HTML5 Drag and Drop handles. Drag handles do not translate well to mobile touch viewports without specialized touch support, and there are no keyboard or click fallback controls (like "Move Up" / "Move Down" buttons).
* **The Bad UX:** Mobile users cannot change the order of stops at all.
* **Code Location:** `frontend/src/components/SmartItineraryTable.tsx`
* **Actionable Recommendation:** Under mobile responsive views (`max-width: 767px`), render subtle Up/Down chevron buttons next to the drag handle, or allow users to click a button to change the stop order via dropdown selection.

---

### 6. Time and Duration Inputs Usability Friction in `StopDialog`
* **The Issue:** 
  1. The "เวลา" (Start Time) field uses a standard text input (`<input type="text">`) instead of a native time picker (`<input type="time">`). Mobile users must type characters manually, which is slow and causes parsing errors.
  2. The "ระยะเวลา" (Duration) field requires typing raw minutes (e.g., `120` minutes instead of `2 ชม.`).
* **The Bad UX:** Form friction, high interaction cost.
* **Code Location:** `frontend/src/components/StopDialog.tsx` (lines 75–86).
* **Actionable Recommendation:**
  1. Change `type="time"` for the start time field.
  2. Split the duration input into **Hours** and **Minutes** dropdowns, converting back to minutes under the hood before submission.

---

### 7. Visual Inconsistency of Modal Close Buttons
* **The Issue:** In the `StopDialog` (add/edit stop modal), the close button uses `Icon name="chevronRight"`:
  ```tsx
  <button type="button" aria-label="ปิดฟอร์ม" onClick={onClose}>
    <Icon name="chevronRight" />
  </button>
  ```
  However, in the `OverviewPage` task dialog, the close button correctly uses `Icon name="x"`. 
* **The Bad UX:** Using a right chevron for a "Close Modal" action is highly misleading (it looks like a pagination or next-step arrow).
* **Code Location:** `frontend/src/components/StopDialog.tsx` (lines 66–68).
* **Actionable Recommendation:** Replace `chevronRight` with `x` to ensure modal close buttons are consistent across the entire application:
  ```diff
  - <Icon name="chevronRight" />
  + <Icon name="x" />
  ```

---

### 8. Visual Layout Discrepancy between Login and Join Cards
* **The Issue:** There is a severe visual inconsistency in form widths and alignments between the Login/Register and Join flows when hosted inside the parent `.account-shell`:
  1. **Login & Register cards** are constrained to `width: min(100%, 560px)` in CSS, but because their parent `.account-shell` is a wide Grid container (`max-width: 1180px`), they float awkwardly to the **top-left side of the viewport**, leaving a massive empty space on the right.
  2. **The Join card (`join-shell`)**, when embedded, overrides its width to `width: 100%` under `.account-shell .join-shell`. As a result, it stretches **all the way to 1180px wide** on desktop monitors, making the form fields look extremely wide, stretched out, and visually unappealing.
* **The Bad UX:** Shocking visual layout jump when switching tabs between Account (Login) and Temp Access (Join). One form is narrow and left-aligned, while the other is gigantic and stretches full-width.
* **Code Location:** `frontend/app/globals.css` (lines 343 and 548).
* **Actionable Recommendation:** Center both containers horizontally and give them a consistent, readable max-width (e.g. `560px` or `640px` max) so they don't shift layout positions or stretch awkwardly on desktop viewports:
  ```css
  /* Center the login flow horizontally in the shell */
  .account-login-flow {
    width: min(100%, 560px);
    justify-self: center; /* Center in grid */
  }

  /* Set consistent max-width and center the join shell */
  .account-shell .join-shell {
    width: min(100%, 640px);
    justify-self: center; /* Center in grid */
  }
  ```

---

## 🚀 Summary of Suggested Enhancements

Implementing these fixes will polish the Sagittarius Travel Planning Cockpit from an extremely beautiful prototype into a production-grade, highly responsive, and accessible experience:

| Issue | Category | Severity | Action |
|---|---|---|---|
| **1. Double Password** | User Flow | Medium | Add clear explanatory helper text |
| **2. Mixed Languages** | Aesthetics | Low | Localize `"First entry"` to Thai |
| **3. Hidden Switcher** | Developer UX | Low | Enable floating debug bar in dev mode |
| **4. Inert Live Map** | Interactivity | High | Remove `inert` lock on MapLibre container |
| **5. Mobile Sorting** | Responsiveness | High | Add Up/Down sorting buttons on mobile |
| **6. Input Friction** | Forms | Medium | Use `type="time"` & Split duration into H/M |
| **7. Close Icon** | Consistency | Medium | Replace `chevronRight` with standard `x` |
| **8. Card Layouts** | Layout Grid | High | Center both flows and set consistent max-width |

---

## 🚫 UI Design Anti-Patterns (DON'Ts in Web Design)

Beyond functional bugs, there are several visual layouts, form constructs, and semantic structures in the codebase that violate **WAI-ARIA Accessibility Standards**, **HTML5 Semantics**, or **Good Web Design Practices**. These are design "DON'Ts" that should be avoided in modern web development:

### 1. DON'T: Hide Crucial Row Metadata by Default (`display: none` on Locations)
* **The Anti-pattern:** The itinerary table lists stops in rows. Inside the activity title cell, the location/address is rendered inside a `<span>` tag (`<span>{item.place}</span>`), but the global CSS hides it entirely:
  ```css
  .row-select span {
    display: none;
  }
  ```
* **Why it's a DON'T:** Hiding primary metadata in a table view forces users to click each row to open the sidebar just to find out *where* the restaurant, hotel, or attraction is! It completely defeats the visual scanning advantage of spreadsheet-like grid lists.
* **Good Practice:** Nest the location subtext directly below the activity title in a smaller, muted gray font, or render it in its own visible "สถานที่ / ที่ตั้ง" column.

### 2. DON'T: Nest Interactive Elements (Clickable `tr` containing clickable `button`)
* **The Anti-pattern:** In `SmartItineraryTable.tsx`, the table row itself has a click handler: `<tr onClick={handleRowClick} tabIndex={0}>`. Yet, inside this row is another `<button className="row-select" onClick={...}>` which triggers the exact same selection!
* **Why it's a DON'T:** Nesting an interactive `<button>` inside another focusable/clickable `<tr>` parent element is a severe violation of **HTML5 Semantics** and **WAI-ARIA specifications**. 
  * It creates a focus trap for screen readers (duplicate announcements, tab focus jumps).
  * If a user clicks the cell button, it triggers event propagation to the parent row, running double click handlers unnecessarily.
* **Good Practice:** The row should be purely decorative and non-focusable. Only the cells containing buttons or links should be focusable (`tabIndex={0}`) and interactive.

### 3. DON'T: Use Implicit Form Labeling Without Explicit ID Connections
* **The Anti-pattern:** Throughout `StopDialog.tsx`, inputs are wrapped inside label elements implicitly without connecting `id` and `htmlFor` properties:
  ```tsx
  <label>
    <span>เวลา</span>
    <input value={values.startTime} required />
  </label>
  ```
* **Why it's a DON'T:** Some older browsers, password managers, and screen readers fail to map nested inputs to their labels without an explicit `htmlFor` and `id` pair. It also prevents CSS layouts from styling the label text independently from the input's bounding box.
* **Good Practice:** Always pair labels explicitly:
  ```tsx
  <label htmlFor="start-time">เวลา</label>
  <input id="start-time" type="time" ... />
  ```

### 4. DON'T: Blind Type Passwords (Lack of Visibility Toggle)
* **The Anti-pattern:** Standard text-masking (`type="password"`) is used for the room password and traveler-specific passwords without a "Show/Hide Password" option.
* **Why it's a DON'T:** Blind typing is a leading cause of onboarding drop-offs and form submission failures on mobile touchscreens.
* **Good Practice:** Include a simple eye icon button next to the password input that toggles the input type between `"password"` and `"text"`.

---

## 🧠 User Usability & Friction Audit (ใช้ง่าย/ใช้ยาก ในมุมผู้ใช้จริง)

Let's put ourselves in the shoes of a traveler using Sagittarius on their trip. What makes them smile, and what makes them want to throw their phone in the harbor?

### 🟢 What is EASY to Use (User Delights)
1. **Collapsible Days in Itinerary:** Grouping a long 16-stop itinerary by days and allowing users to collapse "Day 1" once it's over is extremely satisfying. It declutters the screen and lets them focus only on active planning.
2. **Readiness Summary Badges:** The Members dashboard gives a quick numerical breakdown of roles (Active vs. Pending vs. Disabled). It gives an immediate sense of who is "in" the trip room and who is still waiting.
3. **Role-Driven Layout Adaptability:** Seeing only what you need based on your role (e.g. travelers don't get cluttered with management tools) lowers visual noise.

---

### 🔴 What is FRUSTRATING to Use (User Pain Points)

#### 1. The "Forever Copied" Success Label (Lack of Temporal Decay)
* **The Friction:** When an organizer clicks "คัดลอกลิงก์เชิญ" (Copy Invite Link), the subtext changes to `"คัดลอกแล้ว"` (Copied) and **stays "คัดลอกแล้ว" forever**. If they click it a second time (or if they return to the page later), there is no visual change. 
* **The Frustration:** The user double-guesses if the link actually copied on subsequent attempts because the interface provides zero visual feedback loop.
* **The Solution:** Use a simple `setTimeout` in React to automatically reset `copyState` back to `"idle"` (and the text back to `"พร้อมเชิญสมาชิก"`) after 2.5 seconds.

#### 2. The Dead-End Budget Widget & Hidden Expenses
* **The Friction:** The prominent "งบประมาณ" (Budget) widget on the Overview dashboard showing debt and spending looks highly interactive. Yet, **it is completely static and unclickable**. Even worse, there is **no "Expenses" or "Budget" tab in the side navigation!**
* **The Frustration:** To log a new cost or check who owes what, the user is lost. They don't know that expenses are *secretly hidden* at the bottom of the details drawer (`ContextRail`) on the Itinerary page, accessible only after clicking a specific stop!
* **The Solution:** 
  1. Make the dashboard Budget widget clickable, navigating the user directly to the Itinerary view and auto-opening the Expense drawer.
  2. Add an action button or shortcut link to log general expenses (like flights or hotels) that aren't tied to a specific hourly stop.

#### 3. Carved-in-Stone Stop Notes (No Edit or Delete Actions)
* **The Friction:** Travelers can add text notes to specific stops (e.g. *"จองชื่อแอน"*, *"ต้องพกบัตร"*) inside the `ContextRail` notes tab. However, once submitted, there is **no delete button and no edit button**.
* **The Frustration:** If a user makes a typo, writes wrong information, or posts something confidential by accident, they are stuck. Their mistake is immortalized in the planning document.
* **The Solution:** Render a subtle trash can icon and a pencil edit icon next to notes created by the current member.

#### 4. The Double Scrollbar Trap (Scroll Hijacking on Desktop)
* **The Friction:** On desktop, both the parent main content panel `.planning-main` and the inner table wrapper `.table-scroll` are configured with `overflow-y: auto`.
* **The Frustration:** This creates **two parallel vertical scrollbars** side-by-side. When using a trackpad, scrolling gets captured by the inner box, locking the scroll context and preventing smooth page navigation. It looks visually cluttered and feels highly annoying to navigate.
* **The Solution:** Remove vertical scrolling boundaries from the inner table container, letting the table expand naturally within the main scrollable viewport.

#### 5. Instant Disappearing Checklist Items (No Undo Path)
* **The Friction:** On the dashboard, clicking a checkbox to complete a task immediately registers it as done. If the user is filtering by "ค้าง" (Open), the task **instantly vanishes** from their screen.
* **The Frustration:** If a user accidentally checks an item while scrolling on a touchscreen, it disappears immediately. They have no idea what they checked off, no way to undo it instantly, and must change status filters to hunt down the accidental click.
* **The Solution:** Implement a temporary "Undo" toast alert at the bottom of the screen when a task status changes, or delay the visual list-filtering by 1-2 seconds so they can see the change happen.

---

## 🐛 3 Critical Code-Level Bugs (พบบัญชีความผิดพลาดในระดับโค้ด)

นอกเหนือจากปัญหาความลื่นไหลของอินเทอร์เฟซและการออกแบบแล้ว เรายังได้เจาะลึกเข้าไปในระดับซอร์สโค้ดและพบ **3 บั๊กวิกฤตระดับระบบ** ที่อาจทำให้แอปพลิเคชันทำงานผิดพลาด ข้อมูลบิดเบือน หรือเกิดอาการหน้าจอค้างถาวรสำหรับผู้ใช้งานจริง:

### 1. บั๊กฮาร์ดโค้ดชื่อเดือนในระบบปฏิทิน (`itineraryDisplay.ts`)
* **ปัญหา:** ฟังก์ชัน `formatThaiDate` ที่ใช้ในการแสดงปฏิทินรายวันของทริป มีการเขียนฮาร์ดโค้ดคำว่า `"พ.ค."` (พฤษภาคม) เอาไว้โดยตรง:
  ```typescript
  export function formatThaiDate(day: string): string {
    const date = new Date(`${day}T00:00:00`);
    const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return `${date.getDate()} พ.ค. (${weekdays[date.getDay()]})`;
  }
  ```
* **ความร้ายแรง:** **สูงมาก (Critical)** — หากผู้ใช้วางแผนทริปในเดือนอื่น เช่น มิถุนายน สิงหาคม หรือธันวาคม ปฏิทินของทริปในหน้าจอแผนการเดินทางจะแสดงวันที่ลงท้ายด้วยคำว่า `"พ.ค."` ทั้งหมดโดยไม่มีการเปลี่ยนตามเดือนจริง ทำให้ข้อมูลบิดเบือนอย่างรุนแรง
* **แนวทางแก้ไขระดับซอร์สโค้ด:** ปรับปรุงฟังก์ชันให้ดึงชื่อย่อเดือนภาษาไทยตามเดือนของวันที่นั้น ๆ แบบไดนามิก:
  ```typescript
  export function formatThaiDate(day: string): string {
    const date = new Date(`${day}T00:00:00`);
    const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${date.getDate()} ${months[date.getMonth()]} (${weekdays[date.getDay()]})`;
  }
  ```

---

### 2. บั๊กการแสดงผลช่วงวันที่ข้ามเดือน (`PageHeader.tsx`)
* **ปัญหา:** ฟังก์ชัน `formatTripRange` ที่ใช้จัดรูปแบบการแสดงผลช่วงวันที่ของทริปบนเฮดเดอร์ของหน้าจอ สมมติว่าทริปนั้นอยู่ในเดือนเดียวกันเสมอ:
  ```typescript
  export function formatTripRange(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    return `${start.getDate()}–${end.getDate()} ${formatThaiMonth(end)} ${end.getFullYear()}`;
  }
  ```
* **ความร้ายแรง:** **ปานกลาง-สูง (Medium-High)** — เมื่อทริปมีช่วงเวลาที่ข้ามเดือน (เช่น เริ่มวันที่ 28 พฤษภาคม สิ้นสุดวันที่ 2 มิถุนายน) แอปพลิเคชันจะแสดงผลเป็น `28–2 มิ.ย. 2026` ซึ่งซ่อนชื่อเดือนเริ่มต้น (พ.ค.) เอาไว้ ทำให้ผู้ใช้อ่านแล้วรู้สึกสับสนเสมือนว่าทริปย้อนเวลากลับ หรือสับสนกับจำนวนวันจริง
* **แนวทางแก้ไขระดับซอร์สโค้ด:** ตรวจสอบความขัดแย้งของเดือนและปีในฟังก์ชัน เพื่อแยกจัดรูปแบบอย่างถูกต้องเมื่อมีการข้ามเดือนหรือข้ามปี:
  ```typescript
  export function formatTripRange(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
  
    if (startYear !== endYear) {
      return `${start.getDate()} ${formatThaiMonth(start)} ${startYear} – ${end.getDate()} ${formatThaiMonth(end)} ${endYear}`;
    }
  
    if (startMonth !== endMonth) {
      return `${start.getDate()} ${formatThaiMonth(start)} – ${end.getDate()} ${formatThaiMonth(end)} ${endYear}`;
    }
  
    return `${start.getDate()}–${end.getDate()} ${formatThaiMonth(end)} ${endYear}`;
  }
  ```

---

### 3. บั๊ก Promise เงียบสลายและหน้าจอค้างถาวรเมื่อระบบเน็ตเวิร์กขัดข้อง (`SagittariusApp.tsx`)
* **ปัญหา:** เอฟเฟกต์การโหลดข้อมูลทริปจาก API ใน `loadTrip` ทำงานผ่าน Promise แต่ไม่มีบล็อก `.catch()` เพื่อดักจับความล้มเหลว:
  ```typescript
  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient) return undefined;
    let cancelled = false;
  
    void resolvedApiClient
      .loadTrip(participantSession.tripId, participantSession.sessionToken)
      .then((cockpit) => {
        if (cancelled) return;
        setTripState({ trip: cockpit.trip, past: [], future: [] });
        // ...
      });
  
    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient]);
  ```
* **ความร้ายแรง:** **สูงมาก (Critical)** — หากเซิร์ฟเวอร์แบ็กเอนด์ออฟไลน์, การเชื่อมต่ออินเทอร์เน็ตหลุด, หรือโทเค็นเซสชันของผู้ใช้หมดอายุ Promise จะถูกรีเจกต์ (Rejected) ไปแบบเงียบ ๆ (Silent Unhandled Promise Rejection) โดยแอปพลิเคชันจะไม่มีการแจ้งเตือนใด ๆ และค้างอยู่ที่หน้าจอโหลดสีขาวหรือสปินเนอร์หมุนวนถาวร ผู้ใช้ไม่สามารถกดรีเฟรชหรือแก้ไขอะไรได้
* **แนวทางแก้ไขระดับซอร์สโค้ด:** เพิ่มบล็อก `.catch` เพื่อประมวลผลข้อผิดพลาด พิมพ์บันทึกเชิงพัฒนาระบบ และอัปเดตสถานะความล้มเหลวเพื่อให้ระบบนำทางสลับกลับมาหน้าล็อกอินหรือหน้าแจ้งปัญหาเซิร์ฟเวอร์ล่ม:
  ```typescript
  void resolvedApiClient
    .loadTrip(participantSession.tripId, participantSession.sessionToken)
    .then((cockpit) => {
      // ...
    })
    .catch((error) => {
      console.error("Failed to load trip from API:", error);
      // พัฒนาระบบแสดง Toast Error หรือสลับ UI State กลับไปหน้าเข้าห้องทริปใหม่แบบสวยงาม
    });
  ```

---

### 4. Fixture วันที่ของ itinerary test ไม่ตรงกับ `seedTrip.startDate`
* **วันที่พบ:** 2026-06-04
* **หลักฐาน:** ระหว่างเพิ่ม TDD สำหรับ activity branch group รันคำสั่ง:
  ```bash
  rtk bun run test -- src/trip/itinerary.test.ts
  ```
  แล้วพบ failures เดิมที่ไม่เกี่ยวกับ branch resolver เช่น `getTripDates(seedTrip.startDate, seedTrip.endDate)` คืน `2026-06-18` ถึง `2026-06-23` แต่ test เดิมยังคาดวันที่ `2025-05-16` ถึง `2025-05-19`; `formatDayLabel("2025-05-16", seedTrip.startDate)` จึงกลายเป็น `Day -397`.
* **ผลกระทบ:** ทำให้การรันทั้ง `frontend/src/trip/itinerary.test.ts` fail แม้ tests ใหม่ของ activity path resolver จะ pass เมื่อ run เฉพาะ case ใหม่ด้วย `-t`.
* **แนวทางแก้:** ปรับ fixture/test ให้ใช้ date range เดียวกัน หรือแยก historical Hong Kong fixture ออกจาก current trip fixture เพื่อไม่ให้ domain tests ผูกกับวันที่คนละยุค.
