# Sagittarius Travel Planning Cockpit - UX/UI Issues Report

รายงานนี้สรุปผลการตรวจสอบและแก้ไข UX/UI ของระบบ Sagittarius บน Desktop และ Mobile viewport

---

## 🛠️ รายงานการแก้ไข UX/UI Issues (Status: All Fixed & Verified)

### 1. Account Access Hero Content Collision (Desktop)
* **Symptom**: หัวข้อหลัก `"Travel ideas. Perfectly planned."` ซ้อนทับตรงๆ กับรายการ bullet points (`AuthHighlights`) ทางด้านซ้าย ทำให้อ่านไม่ออก
* **Root Cause**: ตัวแปร `accountHeroClassName` ใน [AccountAccessPanel.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/AccountAccessPanel.tsx) มีคลาส `[.account-shell--entry_&>*]:relative` ซึ่งไป override `absolute` ของ `AuthHighlights` ทำให้ตำแหน่งเสียและซ้อนทับกัน
* **Fix**: ลบ `[.account-shell--entry_&>*]:relative` ออกเรียบร้อย ทำให้แต่ละชิ้นจัดตำแหน่งตัวเองตามที่เขียนไว้ (`relative` หรือ `absolute` ตามปกติ)
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน unit tests และ screenshot `05-login-page-desktop.png`)

### 2. Page Header Vertical Stretching (Itinerary & Timeline Pages)
* **Symptom**: หน้า Itinerary และ Timeline มีช่องว่างสีขาวขนาดใหญ่ประมาณ 300px คั่นระหว่าง PageHeader Card กับตัวตาราง/กิจกรรม ทำให้ UI ดูหลวมเกินไป
* **Root Cause**: ตัวนอกสุดของตาราง/ไทม์ไลน์เป็น `grid min-h-full` และมี grid rows ยืดออกไปจนเต็มพื้นที่ความสูง `min-h-full`
* **Fix**: แก้ไขคลาสของ container ในไฟล์ต่อไปนี้ให้เป็น `grid-rows-[auto_minmax(0,1fr)]` เพื่อล็อกให้ track ต่างๆ ไม่ขยายยืดเกิน content จริง:
  - [SmartItineraryTable.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/SmartItineraryTable.tsx)
  - [TimelineView.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/TimelineView.tsx)
  - [TripMembersPage.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/TripMembersPage.tsx)
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน unit tests และ screenshots `10-cockpit-itinerary-desktop.png`, `12-cockpit-timeline-desktop.png`, `13-cockpit-members-desktop.png`)

### 3. Onboarding & Landing Page Mobile Design Deviations
* **Symptom**: หน้า Landing Page บนมือถือ ยังแสดงปุ่ม "Start planning" / "Join trip" และแสดงกล่อง "Product Preview" (Tokyo-Kamakura card) ซึ่งยาวเกินไปสำหรับมือถือ ขัดแย้งกับหลักการใน [DESIGN.md](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/DESIGN.md)
* **Root Cause**: ขาด class คุม responsive บนหน้าจอขนาดเล็กสำหรับปุ่ม Hero และ Product Preview
* **Fix**: เพิ่ม class `max-[760px]:hidden` คุมส่วนของปุ่ม Hero และ Product Preview ในหน้า [HomeLanding.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/HomeLanding.tsx) เมื่อเปิดด้วย viewport มือถือจะถูกซ่อนตัวอย่างถูกต้องตามดีไซน์
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน screenshot `01-landing-page-mobile.png`)

### 4. Join Flow Participant Password Field - Eye Toggle Wrapping
* **Symptom**: ช่องกรอกรหัสผ่านผู้ร่วมทาง (เช่น ตอนเลือกตัวตน `Beam`) แสดงผลไม่สวยงาม โดยปุ่มรูปตาสำหรับ Show/Hide Password ตกลงไปอยู่อีกบรรทัดหนึ่ง
* **Root Cause**: ไม่มี wrapper block ครอบช่อง `<input>` และ `<button>` แสดงรูปตาเข้าด้วยกันเหมือนฟิลด์ Trip Room Password ด้านบน
* **Fix**: ครอบช่องกรอกรหัสผ่านและปุ่มรูปตาด้วย `<span className={passwordInputRowClassName}>` ในหน้า [TripJoinGate.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/TripJoinGate.tsx) ทำให้ปุ่มตาจัดอยู่ด้านขวามือในบรรทัดเดียวกันอย่างสวยงาม
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน unit tests และ screenshot `08-join-member-selected-desktop.png`)

### 5. Portal/Dashboard Sub-Navigation Mobile Layout Overflow
* **Symptom**: แถบเมนูด้านบนของ Dashboard เช่น "Dashboard", "My Trips", "Explorer..." ยาวเกินขอบหน้าจอมือถือและถูกตัดไปดื้อๆ โดยไม่มี scroll fade หรือการจัดการ wrap
* **Root Cause**: Container ขาด `flex-nowrap` ทำให้ไอเท็มจัดตัวไม่ดี และไม่มี fade mask
* **Fix**: เพิ่ม class `max-[767px]:flex-nowrap` และ fade mask image `max-[767px]:[mask-image:linear-gradient(to_right,#000_82%,transparent)]` ในไฟล์ [AccountAccessPanel.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/AccountAccessPanel.tsx) ทำให้เลื่อนสไลด์แนวนอนได้คล่องตัวและจางหายที่ขอบขวาอย่างพรีเมียม
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน screenshot `04-portal-dashboard-mobile.png`)

### 6. Language Switch Active Highlight Swallowed (Access & Portal Pages)
* **Symptom**: เมนูเปลี่ยนภาษา (Language Switcher) บริเวณมุมบนขวาของกล่องล็อกอิน/ลงทะเบียนและพอร์ทัล ไม่แสดงไฮไลท์ของปุ่มภาษาที่ถูกเลือก (ทั้ง EN และ TH แสดงผลจืดชืดไม่มีการ์ดไฮไลท์บ่งชี้)
* **Root Cause**: เกิดความขัดแย้งของ CSS Class Precedence ใน Tailwind (Utility Collision) เนื่องจากปุ่มภาษาใน [LanguageSwitch.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/i18n/LanguageSwitch.tsx) ใช้คลาสแบบ Array ซึ่งเอา `bg-transparent` และ `text-[var(--color-text-muted)]` ไปปนกับคลาสแอคทีฟ `bg-[var(--color-text)]` ส่งผลให้เบราว์เซอร์จัดลำดับทับซ้อนและเลือกวาดพื้นหลังเป็นโปร่งใสเสมอ อีกทั้งตัวแปรยังมี comma ซ้อนกันทำให้อาจส่งผลต่อการคอมไพล์คลาส
* **Fix**: ปรับโครงสร้างคลาสในปุ่มภาษาใหม่โดยใช้การเช็คแบบมีเงื่อนไข (Mutually Exclusive Style Logic) ให้แยก `bg-transparent`/`bg-[var(--color-text)]` และสีตัวอักษรออกจากกันโดยสิ้นเชิงเมื่อสถานะ Active เปลี่ยนแปลง
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน unit tests และ screenshot `05-login-page-desktop.png` ที่แสดงปุ่มภาษา "EN" ไฮไลท์ดำเด่นชัด)

### 7. Login/Register Tab Active Highlight Border and Contrast Issues
* **Symptom**: แท็บปุ่มสลับหน้าล็อกอิน (Sign in) และสมัครสมาชิก (Register) ด้านบนของฟอร์มหลักมีสีข้อความจางเหมือนกัน และไม่แสดงขีดเส้นขอบสีใต้ปุ่ม (Active Border) เพื่อบ่งบอกว่ากำลังเปิดอยู่หน้าไหน
* **Root Cause**:
  1. ปุ่มใน `accountEntryTabClassName` ใช้คลาส `border-0` ร่วมกับ `border-b-[3px]` ทำให้เบราว์เซอร์ยกเลิกการแสดงสไตล์ขอบทั้งหมด (Border Style: None)
  2. เกิดการซ้อนทับของคลาสสีขอบและสีข้อความทับกันกับค่าเริ่มต้นใน `accountEntryTabClassName`
* **Fix**: ปรับปรุง [AccountAccessPanel.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius-ux-fix/frontend/src/components/AccountAccessPanel.tsx) โดยใส่คลาส `border-solid` กำหนดรูปแบบเส้นขอบ และใช้เงื่อนไขแบบ Mutually Exclusive แยกแยะระหว่าง `border-[var(--color-primary)]` กับ `border-transparent` รวมถึงแยกสีข้อความชัดเจน
* **Status**: ✅ **FIXED** (ยืนยันความถูกต้องผ่าน unit tests และ screenshot `05-login-page-desktop.png` แสดงแท็บ Sign in สีเขียวพร้อมเส้นขีดใต้แท็บเด่นชัด)

---

## 🧪 การตรวจสอบและการทำ E2E Testing Verification (Playwright)

เราได้เตรียม E2E testing flows เพื่อใช้ตรวจสอบความถูกต้องของหน้าจอเหล่านี้ในระยะยาว:

### Flow 1: Landing & Auth Layout Integrity Check
* **Steps**:
  1. เปิดหน้า `/` (Landing Page) บน viewport มือถือ ตรวจเช็คว่าปุ่ม Hero และ Product Preview ซ่อนตัว
  2. ไปที่หน้า `/access?mode=sign-in` ตรวจหาพิกัด (bounding box) ของ Heading `<h1>` และ `AuthHighlights` (`.account-auth-highlights`) ว่าพิกัด Y ไม่ซ้อนทับกัน (`heading.y + heading.height <= highlights.y`)
* **Expected Result**: ไม่มีส่วนใดซ้อนทับกัน และพฤติกรรม Responsive ตรงตามที่กำหนดไว้ใน DESIGN.md

### Flow 2: Smart Table & Timeline Alignment Verify
* **Steps**:
  1. ล็อกอินแล้วเข้าหน้าทริป `/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/itinerary`
  2. ดึงความสูงของ `PageHeader` (`header.page-header`)
  3. ยืนยันว่า `PageHeader` มีความสูงปกติ ไม่โดนยืดออกไปจนเต็มพื้นที่
* **Expected Result**: ส่วนหัวการ์ดขนาดปกติ และตารางข้อมูลถูกจัดเรียงตามลำดับอย่างกระชับ

### Flow 3: Join Page Inline Member Password Form Check
* **Steps**:
  1. เข้าหน้า `/join/HK-SZ-2025` กรอกรหัสผ่านห้องทริปเพื่อผ่านประตู
  2. คลิกเลือกตัวตน `Beam` เพื่อเปิดฟอร์มกรอกรหัสผ่านผู้ร่วมทาง
  3. ตรวจเช็คว่า `<input>` และ `<button>` ของรหัสผ่านมีพิกัด Y ใกล้เคียงกัน (อยู่บรรทัดเดียวกัน)
* **Expected Result**: ปุ่ม Show/Hide Password อยู่ระนาบเดียวกับช่องกรอกรหัสผ่านทางขวามือ

---

## 🚀 ผลการทดสอบ (Verification Results)
* **Frontend Unit & Component Tests**: 🧪 ผ่านทั้งหมด 100% (`bun run test` ผ่านทุกเคส)
* **Backend Integration Tests**: 🧪 ผ่านทั้งหมด 100% (`cargo test` ผ่านทุกเคส)
* **Screenshots Walkthrough**: 📸 จับภาพครบถ้วน 28 รูปแบบ ตรวจสอบแล้ว Layout สมบูรณ์แบบตามทฤษฎีการจัดองค์ประกอบ
