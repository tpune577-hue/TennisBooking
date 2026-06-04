# UAT Checklist — Greenwich Tennis Academy Booking System

> Version: 1.0 | เอกสารนี้ใช้สำหรับทดสอบ User Acceptance ก่อน Go-Live

---

## ผู้ใช้งานในระบบ (Roles)

| Role | คำอธิบาย |
|------|---------|
| **Guest** | ผู้เยี่ยมชมเว็บ ยังไม่ได้สมัครสมาชิก |
| **Member** | สมาชิกทั่วไป ใช้จองคอร์ต |
| **Staff** | เจ้าหน้าที่สนาม สแกน QR รับลูกค้า |
| **Super Admin** | ผู้ดูแลระบบ จัดการทุกอย่าง |

---

## MODULE 1 — หน้าเว็บสาธารณะ (Public Marketing)

### 1.1 Homepage `/`
- [ ] หน้าแรกโหลดได้ปกติ แสดงข้อมูลสโมสร
- [ ] ปุ่ม "Book a Court", "Member App", "Explore Academy" แสดงและคลิกได้
- [ ] ส่วน FAQ แสดงข้อมูลถูกต้อง
- [ ] Responsive บนมือถือ/tablet

### 1.2 Courts Page `/courts`
- [ ] แสดงรายชื่อ 6 คอร์ตพร้อม spec ครบถ้วน
- [ ] ข้อมูลเวลาเปิด-ปิด (06:00–23:00) แสดงถูกต้อง
- [ ] ไม่มีปุ่มจองสำหรับ Guest (redirect ไป sign-in)

### 1.3 Coaches Page `/coaches`
- [ ] แสดงรายชื่อ coach พร้อมรูปและ bio
- [ ] ประเภทโปรแกรม (Private, Group, Junior, Adult) แสดงครบ

### 1.4 Contact Page `/contact`
- [ ] แสดงข้อมูลติดต่อสโมสรถูกต้อง

### 1.5 Privacy / Terms
- [ ] `/privacy` โหลดได้ ข้อมูลครบ
- [ ] `/terms` โหลดได้ ข้อมูลครบ

---

## MODULE 2 — ระบบสมัครสมาชิกและ Login

### 2.1 Sign Up `/sign-up`
- [ ] สมัครด้วย Email ได้ — ได้รับ OTP ทาง email
- [ ] ใส่ OTP ถูกต้อง → ยืนยัน email สำเร็จ
- [ ] ใส่ OTP ผิด → แสดง error message
- [ ] ฟอร์ม First name / Last name validate ว่าต้องกรอก
- [ ] สมัครด้วย email ซ้ำ → แสดง error "email นี้มีอยู่แล้ว"

### 2.2 Sign In `/sign-in`
- [ ] **Login ด้วย LINE** — คลิกแล้ว redirect ไป LINE OAuth ได้
- [ ] **Login ด้วย Phone OTP** — กรอกเบอร์ → ได้รับ SMS OTP → ยืนยันสำเร็จ
- [ ] **Login ด้วย Email link** — กรอก email → ได้รับลิงก์ → คลิกแล้ว login สำเร็จ
- [ ] Login สำเร็จ → redirect ไป `/liff/home` (default)
- [ ] Login สำเร็จ → redirect ไป `callbackUrl` ที่ระบุมา
- [ ] หน้า Sign-in มาพร้อม `?error=` → แสดง error message ทันที (ไม่ต้องคลิก)

### 2.3 Complete Profile `/complete-profile`
- [ ] Member ที่ยังไม่กรอก profile ถูก redirect มาหน้านี้
- [ ] กรอกข้อมูลครบ → ไปหน้าต่อไปได้
- [ ] กรอกไม่ครบ → ไม่ผ่าน validate

### 2.4 Sign Out
- [ ] กด Sign out แล้ว session หาย → redirect ไปหน้า Sign-in

---

## MODULE 3 — LIFF (LINE Mini App)

> ทดสอบบนมือถือผ่าน LINE App เท่านั้น

### 3.1 LIFF Loading & Authentication
- [ ] เปิด LIFF จาก LINE → หน้าโหลดได้ ไม่ขึ้น "This page couldn't load"
- [ ] LIFF แสดง spinner "กำลังเชื่อมต่อ LINE..." ระหว่าง init
- [ ] Login ผ่าน LINE ใน LIFF สำเร็จ → ไปหน้า Home ได้อัตโนมัติ
- [ ] Member ใหม่ที่ยังไม่มีบัญชี → แสดง error message ชัดเจน (ไม่ loop)

### 3.2 LIFF Home `/liff/home`
- [ ] แสดง ชื่อสมาชิก และ tier level ถูกต้อง
- [ ] แสดง **Credit คงเหลือ** ตัวเลขถูกต้อง
- [ ] แสดง **การจองถัดไป** (ถ้ามี) — ชื่อคอร์ต วัน เวลา ครบ
- [ ] ถ้าไม่มีการจอง → แสดง empty state "ยังไม่มีการจองถัดไป"
- [ ] ปุ่ม **"จองคอร์ต"** คลิกได้ → ไปหน้า Book
- [ ] ปุ่ม "เติมเครดิต" คลิกได้ → ไปหน้า Top-up
- [ ] **Onboarding Checklist** แสดงถ้า profile ยังไม่ครบ
- [ ] ปุ่ม "จองคอร์ต" ถูก disable ถ้า profile ไม่ครบ

### 3.3 LIFF Book Court `/liff/book`

#### ขั้นตอนที่ 1 — เลือกวันที่
- [ ] แสดง chip วันที่ 7 วัน (วันนี้ + 6 วัน)
- [ ] คลิก chip เลือกวัน → highlight ถูกต้อง
- [ ] ป้ายวันเป็นภาษาไทยหรืออ่านง่าย

#### ขั้นตอนที่ 2 — เลือกคอร์ต
- [ ] แสดงเฉพาะคอร์ตที่ active
- [ ] แสดงประเภทคอร์ต (indoor/outdoor/clay)
- [ ] เลือกคอร์ตได้ → highlight ถูกต้อง

#### ขั้นตอนที่ 3 — เลือกเวลา
- [ ] แสดง slot ชั่วโมง 06:00–23:00
- [ ] Slot ที่จองแล้ว → แสดงเป็น unavailable (สีจาง/ขีดทับ)
- [ ] Peak hours (17:00–21:00) → แสดงราคาต่างจาก off-peak
- [ ] เลือก start time → เลือก end time → ไฮไลท์ช่วงเวลาที่เลือก
- [ ] เลือก range ที่มี slot ว่างอยู่กลาง → ไม่สามารถทำได้ หรือ auto-clear
- [ ] Footer แสดง **ราคารวม** ถูกต้องตาม duration + tier discount
- [ ] **ยอดเครดิตไม่พอ** → ปุ่ม Proceed disabled, แสดงจำนวนที่ขาด

#### ขั้นตอนที่ 4 — เลือก Coach (optional)
- [ ] แสดงรายชื่อ coach ที่ available
- [ ] แสดงราคา coach/ชั่วโมง
- [ ] เลือก coach → ราคารวมอัพเดทถูกต้อง
- [ ] ยกเลิกเลือก coach (กลับเป็น court_only) ได้

#### ยืนยันการจอง
- [ ] หน้า Confirm แสดงสรุปทุกอย่าง (คอร์ต วัน เวลา coach ราคา)
- [ ] กด Confirm → เครดิตถูกหัก → booking สร้างสำเร็จ
- [ ] หน้า Success แสดง booking reference (รูปแบบ BK-YYYYMMDD-###)
- [ ] หน้า Success แสดงรายละเอียดครบ

#### Business Rules
- [ ] จองล่วงหน้าเกินกว่า tier กำหนด → ไม่แสดงวันนั้น
- [ ] จองเกิน max hours/ครั้งตาม tier → validate ไม่ผ่าน
- [ ] จองเกิน max bookings/วันตาม tier → validate ไม่ผ่าน

### 3.4 LIFF My Bookings `/liff/bookings`
- [ ] Tab "ที่กำลังจะมาถึง" แสดงการจองที่ confirmed และยังไม่ผ่าน
- [ ] Tab "ประวัติ" แสดงการจองเก่า (completed/cancelled/no_show)
- [ ] Card แสดง ชื่อคอร์ต วันที่ เวลา coach (ถ้ามี) สถานะ เครดิต ครบ
- [ ] ปุ่ม **"QR เข้าสนาม"** → ไปหน้า Access QR
- [ ] ปุ่ม **"ยกเลิก"** (เฉพาะ upcoming confirmed)

#### ยกเลิกการจอง
- [ ] กด "ยกเลิก" → มี confirm dialog ก่อน
- [ ] ยกเลิก 24+ ชม. ก่อน → เครดิตคืนครบ, สถานะเป็น cancelled
- [ ] ยกเลิก < 24 ชม. ก่อน → เครดิตไม่คืน, แสดง warning ชัดเจน
- [ ] หลังยกเลิก → บัตรใน list อัพเดทสถานะถูกต้อง

### 3.5 LIFF Access QR `/liff/access`
- [ ] แสดง QR code ของ booking ที่เลือก
- [ ] QR code สแกนได้จริง (ทดสอบกับ admin scan)
- [ ] แสดง booking details ครบ (คอร์ต วัน เวลา)

### 3.6 LIFF Profile `/liff/me`
- [ ] แสดงรูป avatar (จาก LINE หรือที่บันทึกไว้)
- [ ] แสดงชื่อ, tier level, discount %, วันที่สมัคร
- [ ] เมนู "ประวัติเครดิต" ไปได้ถูกต้อง
- [ ] เมนู "เปิด Dashboard (เว็บ)" เปิดได้

### 3.7 LIFF Credit History `/liff/me/credits`
- [ ] แสดง balance ปัจจุบัน
- [ ] แสดง transaction history (topup/booking/refund/expired/adjustment)
- [ ] ทิศทาง +/- ถูกต้อง
- [ ] วันที่และเวลาแสดงถูกต้อง (timezone ไทย)

### 3.8 LIFF Top-Up `/liff/topup`
- [ ] แสดง packages ครบ (500, 1,000, 2,000, 5,000 THB)
- [ ] แสดง bonus credits สำหรับแต่ละ package ถูกต้อง
- [ ] เลือก package แล้วชำระ PromptPay ได้ (ดู section 5)
- [ ] เลือก package แล้วชำระบัตรเครดิตได้ (ดู section 5)

### 3.9 LIFF Navigation
- [ ] Bottom nav แสดง 4 tabs: Home, Book, Bookings, Me
- [ ] Tab highlight ถูกต้องตามหน้าที่อยู่
- [ ] กด back ใน LIFF ทำงานถูกต้อง

---

## MODULE 4 — Member Dashboard (Desktop)

### 4.1 Dashboard Home `/dashboard`
- [ ] แสดงชื่อสมาชิก, tier level, discount %
- [ ] แสดง Credit balance
- [ ] แสดงการจองที่กำลังจะมา (3 รายการ)
- [ ] ปุ่ม Top-up, View All Bookings ทำงานได้

### 4.2 My Bookings `/dashboard/bookings`
- [ ] Tab Upcoming / Past ทำงานถูกต้อง
- [ ] แต่ละ booking card แสดงข้อมูลครบ (ref, court, วัน/เวลา, coach, status, cost)
- [ ] ปุ่ม "QR Access" ทำงานได้
- [ ] ปุ่ม "Cancel" + logic เดียวกับ LIFF (ดู 3.4)

### 4.3 Credit History `/dashboard/credits`
- [ ] Cards สรุป: ยอดปัจจุบัน, topup ทั้งหมด, ใช้ทั้งหมด
- [ ] Transaction table แสดงครบ (50 รายการล่าสุด)
- [ ] ทุก column แสดงถูกต้อง: ประเภท, จำนวน +/-, balance ก่อน-หลัง, วันที่

### 4.4 Top-Up `/dashboard/topup`
- [ ] เหมือน LIFF Top-Up (ดู 3.8)

---

## MODULE 5 — ระบบชำระเงิน (Payment)

### 5.1 PromptPay QR
- [ ] เลือก package → กด PromptPay → QR code แสดง
- [ ] QR code สแกนจ่ายได้จริง (จำเป็นต้องทดสอบกับ payment จริงหรือ sandbox)
- [ ] Countdown timer แสดงถูกต้อง (5 นาที)
- [ ] หลังจ่าย → ระบบรับ webhook → เครดิตเพิ่มอัตโนมัติ (ไม่ต้อง refresh)
- [ ] Timeout (5 นาที) → แสดง expired state

### 5.2 Credit/Debit Card
- [ ] ฟอร์มกรอกบัตรแสดงครบ (เลขบัตร, expiry, CVV, ชื่อ)
- [ ] ข้อมูลบัตรถูก encrypt โดย Omise.js (ไม่ผ่าน server เรา)
- [ ] ชำระสำเร็จ → เครดิตเพิ่มทันที
- [ ] ข้อมูลบัตรไม่ถูกต้อง → แสดง error message จาก Omise

### 5.3 Credit Expiry
- [ ] เครดิตที่ซื้อมีวันหมดอายุ 365 วัน
- [ ] เมื่อหมดอายุ → ถูกตัดออกจาก balance อัตโนมัติ (Cron job)
- [ ] Transaction "expired" แสดงใน history

---

## MODULE 6 — ระบบ QR Access Control

### 6.1 หน้า Access QR (Member)
- [ ] Member ดู QR code ของ booking ได้
- [ ] QR มีข้อมูลถูกต้อง (เข้ารหัส token ของ pass)

### 6.2 Admin Scan Page `/admin/access/scan`
- [ ] Staff เข้าหน้า scan ได้
- [ ] ใส่ token ด้วย manual input → กด scan → แสดงผล
- [ ] Scan สำเร็จ (สถานะ "outside") → แสดงสีเขียว + ข้อมูลผู้ถือ pass
- [ ] Scan ซ้ำ (สถานะ "inside" อยู่แล้ว) → แสดง warning
- [ ] Scan pass ที่ revoked/invalid → แสดง error สีแดง
- [ ] ปุ่ม **Force In** → บังคับ check-in ได้ (ใส่ reason)
- [ ] ปุ่ม **Force Out** → บังคับ check-out ได้ (ใส่ reason)
- [ ] **Reset Pass** → reset presence เป็น "outside" ได้ (ถ้า require reason เปิดอยู่ ต้องใส่ reason)

### 6.3 Grace Period
- [ ] Scan ก่อนเวลาจอง N นาที (ตาม config) → ผ่าน
- [ ] Scan ก่อนเวลา grace period → แสดง warning แต่ยังผ่าน (ถ้า config อนุญาต)
- [ ] Scan หลังเวลาจองสิ้นสุด N นาที → ยังผ่าน (ภายใน grace)

### 6.4 Access Settings `/admin/access/settings`
- [ ] บันทึก Grace minutes before/after ได้
- [ ] เปิด/ปิด "Require reason for reset" ได้
- [ ] การตั้งค่ามีผลกับการ scan จริง

---

## MODULE 7 — Admin Panel

### 7.1 Admin Dashboard `/admin`
- [ ] แสดง Stats: จำนวน booking วันนี้, สมาชิก active, คอร์ต active
- [ ] Recent Bookings table (8 รายการล่าสุด) แสดงถูกต้อง
- [ ] Staff login เข้า admin ได้
- [ ] Customer ปกติเข้า admin ไม่ได้ → redirect

### 7.2 Bookings Management `/admin/bookings`
- [ ] Filter by status ทำงาน (all/confirmed/cancelled/completed/no_show)
- [ ] Filter by date range ทำงาน
- [ ] Table แสดงครบ: ref, สมาชิก, คอร์ต, วัน/เวลา, coach, cost, status
- [ ] ปุ่ม Cancel booking (สำหรับ confirmed) → modal ยืนยัน → ยกเลิกสำเร็จ
- [ ] Stats (จำนวน + เครดิตรวม) อัพเดทตาม filter

### 7.3 Members Management `/admin/members`
- [ ] Search by ชื่อ, email, เบอร์โทร ทำงาน
- [ ] Table แสดง: avatar, ชื่อ, email, phone, role, tier, credit balance
- [ ] สมาชิกที่ inactive แสดง badge "suspended"
- [ ] **Adjust Credits:**
  - [ ] ใส่จำนวน + (เพิ่ม) → balance อัพเดทถูกต้อง
  - [ ] ใส่จำนวน - (ลด) → balance อัพเดทถูกต้อง
  - [ ] ใส่ note/reason ได้
  - [ ] ยอด balance หลังปรับแสดงถูกต้องก่อน confirm
- [ ] **Edit Member** (Super Admin เท่านั้น):
  - [ ] แก้ไขชื่อ, email, phone, วันเกิด, เพศ ได้
  - [ ] บันทึกแล้วข้อมูลอัพเดท

### 7.4 Finance `/admin/finance`
- [ ] แสดง 4 stats ของเดือนปัจจุบัน: เครดิต topup, เครดิตใช้ไป, เครดิตในระบบทั้งหมด, เงินรับจริง (THB)
- [ ] ตัวเลขสอดคล้องกับข้อมูลจริงในระบบ

### 7.5 Courts Management `/admin/courts`
- [ ] แสดงรายชื่อคอร์ตทั้งหมด พร้อม type และ status
- [ ] สร้างคอร์ตใหม่ได้
- [ ] แก้ไขชื่อ, ประเภท, เวลาเปิด-ปิด ได้
- [ ] ตั้ง **Peak/Off-peak pricing** ได้ (ราคา/ชั่วโมง)
- [ ] Toggle active/inactive ได้ → คอร์ต inactive หายจากหน้าจอง
- [ ] สร้าง Court Closure ได้ (วัน/เวลา/เหตุผล) → slot นั้นปิดใน booking
- [ ] ลบ Court Closure ได้ → slot เปิดใหม่

### 7.6 Coaches Management `/admin/coaches`
- [ ] แสดง stats: total coaches, available
- [ ] Table แสดง: avatar, ชื่อ, email, ราคา/ชั่วโมง, bio, สถานะ
- [ ] Toggle available/unavailable → ผลทันที
- [ ] Coach unavailable → ไม่แสดงในหน้าจองของ member
- [ ] แก้ไขราคา, bio ได้
- [ ] เพิ่ม coach ใหม่จาก user ที่มีอยู่แล้วได้

---

## MODULE 8 — Notification System

### 8.1 LINE Notification (ต้องมี `lineUserId` ใน account)
- [ ] Member จองสำเร็จ → ได้รับ LINE message ยืนยันการจอง (ชื่อคอร์ต วัน เวลา)
- [ ] Admin ยกเลิก booking → Member ได้รับ LINE message แจ้งยกเลิก + เครดิตที่คืน
- [ ] Admin ปรับเครดิต → Member ได้รับ LINE message แจ้งยอดใหม่
- [ ] LINE message แสดงข้อมูลถูกต้อง ครบ และอ่านเข้าใจง่าย

---

## MODULE 9 — Tier & Membership System

### 9.1 Tier Rules
- [ ] สมาชิก tier "Regular" → discount 0%, advance booking 7 วัน, max 3 ชม./ครั้ง, max 2 จอง/วัน
- [ ] สมาชิก tier สูงกว่า → discount %, advance booking วันมากกว่า ตาม config
- [ ] Discount ลดราคาคอร์ตถูกต้อง (ไม่ลด coach fee)
- [ ] Admin เปลี่ยน tier ของ member ได้ → กฎอัพเดททันที

---

## MODULE 10 — Security & Edge Cases

### 10.1 Authorization
- [ ] Guest เข้า `/liff/home` → redirect ไป sign-in
- [ ] Member เข้า `/admin` → redirect ออก
- [ ] Staff เข้า `/admin/settings` → redirect ออก (Super Admin only)
- [ ] API endpoint `/api/admin/*` ถูก block ถ้า role ไม่ใช่ admin

### 10.2 Data Validation
- [ ] จองคอร์ต slot ที่มีคนจองแล้ว → error
- [ ] เครดิตไม่พอ → ไม่สามารถจองได้
- [ ] ยกเลิก booking ที่ completed/no_show → ไม่สามารถทำได้
- [ ] Top-up package ที่ inactive → ไม่แสดงให้เลือก

### 10.3 Session
- [ ] Session หมดอายุ → redirect ไป sign-in อัตโนมัติ
- [ ] Multi-tab: logout tab หนึ่ง → tab อื่นก็ logout ด้วย

---

## สรุป Scope ที่ลูกค้าได้รับ

| หมวด | จำนวน Feature |
|------|-------------|
| Marketing / Public | 5 หน้า |
| Authentication | 4 flows (LINE, OTP, Email, Sign-up) |
| LIFF (LINE Mini App) | 9 หน้า + booking 4 ขั้นตอน |
| Member Dashboard (Web) | 4 หน้า |
| Payment | PromptPay + Credit Card |
| QR Access Control | Scan + Force + Reset + Settings |
| Admin Panel | 6 modules (Bookings, Members, Finance, Courts, Coaches, Access) |
| Notifications | LINE push notification |
| Credit System | Top-up, Deduct, Refund, Expiry, Adjustment |
| Tier System | Configurable tiers + discount |

**รวมทั้งหมดประมาณ 100+ test cases**

---

## หมายเหตุสำหรับผู้ทดสอบ

1. **LIFF testing**: ต้องทดสอบบนมือถือใน LINE app เท่านั้น ไม่สามารถทดสอบใน browser ปกติได้ครบทุก feature
2. **Payment testing**: ใช้ Omise test key สำหรับ sandbox, บัตรทดสอบ `4242 4242 4242 4242`
3. **LINE Notification**: ต้องมี LINE Channel Access Token ที่ถูกต้อง และ member ต้อง link LINE account แล้ว
4. **Admin features**: ทดสอบด้วย account ที่มี role = `super_admin`
5. **Tier testing**: ทดสอบโดยให้ admin เปลี่ยน tier ของ test account ก่อนทดสอบ
