# Tennis Club CRM — Remaining Tasks

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Auth | NextAuth v5 beta.31 — JWT strategy, LINE Login OAuth |
| DB | Neon Postgres (HTTP driver) + Drizzle ORM |
| UI | shadcn/ui + Tailwind CSS, dark theme |
| Payments | Omise (PromptPay QR + Credit Card tokenization) |
| LIFF | LINE Front-end Framework v2 (`@line/liff`) |
| Notifications | LINE Messaging API (push messages) |
| Deploy | Vercel — repo: `tpune577-hue/TennisBooking` on `main` |

### Key constraints
- Neon HTTP driver **does not support `db.transaction()`** — use sequential queries only
- All LIFF pages live under `/liff/` and are wrapped in `LiffProvider`
- Auth session is JWT — `creditBalance`, `role`, `lineUserId` live in the token; call `updateSession()` after any mutation that changes them
- Booking state between LIFF pages is passed via URL searchParams (no global state)

---

## What's already done

- **Auth** — LINE Login + NextAuth v5, `proxy.ts` guards, role-based access (`customer`, `coach_employee`, `coach_freelance`, `staff`, `super_admin`)
- **DB schema** — users, tiers, courts, courtPricing, coaches, bookings, payments, creditTransactions, creditBatches, notifications
- **LIFF Booking flow** — `/liff/book` → `/liff/book/select` → `/liff/book/confirm` → `/liff/booking-success`
- **User Dashboard** — `/dashboard` (overview), `/dashboard/bookings` (list + cancel), `/dashboard/credits` (history), `/dashboard/topup` (Omise PromptPay + card)
- **Credit Top-up** — `POST /api/payments`, `GET /api/payments/[id]/status`, `POST /api/payments/webhook`, webhook idempotency via `UPDATE WHERE status='pending' RETURNING`
- **Admin panel** — `/admin` (stats), `/admin/members` (search + adjust credits), `/admin/bookings` (list + filter + cancel), `/admin/coaches` (CRUD), `/admin/courts` (CRUD + pricing)
- **LINE Notifications** — Flex Message bubbles for: booking confirmed, booking cancelled (member/owner/guest), topup success, credit expiring soon (with topup CTA); admin credit adjust stays plain text (`src/lib/notifications/line.ts`)
- **Cron** — `GET /api/cron/expire-credits` runs daily at 02:00 UTC via `vercel.json`

---

## Remaining tasks

### Task F — Admin Finance: monthly revenue chart

**Status:** page exists at `/admin/finance` with stats cards, but the chart section is a placeholder ("กราฟรายรับรายเดือนอยู่ระหว่างพัฒนา")

**What to build:**
- Monthly bar chart: revenue in THB (from `payments` table, `status = 'paid'`) per month for last 12 months
- Monthly credit usage bar: sum of `-amount` from `creditTransactions` where `type = 'booking'`
- Use `recharts` (already a common shadcn dependency) or a simple `<svg>` chart
- Data source: `GET /api/admin/finance/chart` → return `[{ month: "2026-01", revenue: 45000, creditsUsed: 4200 }, ...]`

**Files to touch:**
- `src/app/(admin)/admin/finance/page.tsx` — add chart section
- `src/app/api/admin/finance/chart/route.ts` — new API route (admin-only)

---

### Task H — Admin: mark booking completed / no-show

**Status:** admin can cancel bookings (`POST /api/bookings/[id]/cancel`) but cannot mark them as `completed` or `no_show`. The status enum already includes these values.

**What to build:**
- In `/admin/bookings` page: add action buttons for bookings that are `confirmed` and `startTime` is in the past — "เสร็จแล้ว" and "ไม่มา" buttons
- `POST /api/admin/bookings/[id]/status` — admin-only route to update `status` to `completed` or `no_show`
- No credit change on `completed`. On `no_show`: admin's choice (currently no refund policy needed)

**Files to touch:**
- `src/app/api/admin/bookings/[id]/status/route.ts` — new route
- `src/app/(admin)/admin/bookings/page.tsx` — add status action buttons

---

### Task I — Admin Packages page

**Status:** `/admin/packages` is a full placeholder stub.

**What to build:**
- Display the 4 CREDIT_PACKAGES from `src/lib/omise.ts` (read-only display for now)
- Display membership tiers from `tiers` DB table (name, discountPercent, maxHoursPerBooking)
- Allow editing tier discount % and maxHours via a dialog (PUT to existing `/api/admin/...` or new route)
- `GET/PUT /api/admin/tiers/[id]` — new admin routes for tier management

**Files to touch:**
- `src/app/(admin)/admin/packages/page.tsx` — replace stub
- `src/app/api/admin/tiers/route.ts` + `src/app/api/admin/tiers/[id]/route.ts` — new routes

---

### Task J — Booking reminder cron (24h before)

**Status:** cron infrastructure exists (`vercel.json`, `/api/cron/expire-credits`). No reminder cron yet.

**What to build:**
- `GET /api/cron/booking-reminders` — finds bookings with `status = 'confirmed'` and `startTime` between now+23h and now+25h, sends LINE push to each user
- Add to `vercel.json` crons: `{ "path": "/api/cron/booking-reminders", "schedule": "0 * * * *" }` (run every hour)
- Notification text: "⏰ เตือนการจองพรุ่งนี้: {court} เวลา {time}"

**Files to touch:**
- `src/app/api/cron/booking-reminders/route.ts` — new route
- `vercel.json` — add cron entry

---

### Task K — Club entry QR (access passes + staff scan)

**Status:** done (phase 1). Design agreed in chat (grill-me); depends on existing `bookings`, `bookingGuests`, `bookingInvites`.

**Goal:** QR for club entry per person (host, guests, freelance coach). Valid window = `startTime − graceBefore` → `endTime + graceAfter` (timezone `Asia/Bangkok`, default 60 min each, editable in admin). Staff tablet scan now; turnstile/device API key later (`POST /api/access/scan` shared). Opaque token + DB state (`outside` / `inside`); multiple in/out within window; reject second “entry” while `inside` (alert on staff UI); staff reset/override with mandatory reason + audit log.

**Quota & invites (no singles/doubles UI):**
- Max **6 participants per booking including host** → up to **5 guests** (`maxParticipantsPerBooking` in access settings, default 6).
- Invite UI: no 1:1 / 2:2 picker — “ชวนเพื่อน” + show `รับเชิญแล้ว X/5`; prefer one invite link per booking (reuse token).
- `POST /api/invites/[token]/accept` — reject when guest slots full (409).
- **Coach:** `coach_freelance` → auto `coach` pass (not counted in 6); `coach_employee` → no pass (staff entry policy).

**LINE:** booking confirmed Flex footer adds **「ดู QR」** → LIFF `/liff/access?bookingId=…` (QR only shown inside valid window; countdown before).

**Config (`/admin/access/settings`):** `enabled`, grace before/after, `maxParticipantsPerBooking`, reset roles, require reset reason.

**Revoke on:** booking `cancelled` (immediate); time window end (deny scan). Phase 2: tie to `completed` / `no_show`.

**Files (phase 1 — indicative):**
- Schema: `club_access_settings`, `booking_access_passes`, `access_scan_events` (+ `access_devices` later)
- `src/lib/access/*` — validity window, scan toggle, revoke
- `POST /api/access/scan`, `POST /api/access/passes/[id]/reset`, `GET /api/access/passes/me`
- `GET/PUT /api/admin/access-settings`
- `/admin/access/scan`, `/admin/access/settings`
- `/liff/access`, dashboard booking QR view
- Hook: create host (+ freelance coach) pass on `POST /api/bookings`; guest pass on accept
- Update `notifyBookingConfirmed` Flex footer (ดู QR)

---

### Task K2 — Guest full + host revoke from party

**Status:** done (shipped with Task K).

**When guest slots are full (5/5):**
- **Accept API:** return `409` with clear message (e.g. `GUEST_SLOTS_FULL`).
- **Invite / share UI (host):** show **「แขกครบแล้ว (5/5)」** — disable or hide “สร้างลิงก์ใหม่” if not needed; still show invite link if already created.
- **Invite accept page (`/invite/[token]`):** show **「คิวเชิญเต็มแล้ว」** instead of accept button (do not allow new accept).

**Host can free a slot — revoke guest from party:**
- Host-only (booking owner) on LIFF + dashboard: list accepted guests (name, acceptedAt) with **「ถอนออกจากก๊วน」** per guest.
- `DELETE /api/bookings/[id]/guests/[userId]` or `POST .../guests/[userId]/revoke` — host auth, booking `confirmed`, not past access window end (optional: allow revoke until `endTime + grace`).
- On revoke: remove `booking_guests` row; **revoke** guest `booking_access_pass` (`status = revoked`, `presence` reset); optional LINE notify guest (“ถูกถอนออกจากการจอง …”).
- After revoke, slot opens — new accept via invite link works again; UI shows `X/5` updated.

**Edge cases:**
- Cannot revoke **host** or **coach** pass via this flow (coach freelance pass revoked only if coach removed from booking — future).
- Revoked guest who was `inside` → revoke pass immediately; staff UI should not show them as active on that booking.

**Files to touch:**
- `src/app/api/bookings/[id]/guests/[userId]/route.ts` — new revoke route
- `src/app/liff/booking-success/page.tsx` — guest list + full state messaging
- `src/app/(dashboard)/dashboard/bookings/page.tsx` (or booking detail) — same revoke UI
- `src/app/invite/[token]/page.tsx` — full-slot UX
- `src/app/api/invites/[token]/accept/route.ts` — quota check before insert

---

## Environment variables

All set in `.env.local` (local) and must also be set in Vercel dashboard:

```
DATABASE_URL=...                          # Neon Postgres
AUTH_SECRET=...                           # NextAuth secret
AUTH_URL=https://your-domain.vercel.app   # must match deployment URL
LINE_CHANNEL_ID=...                       # LINE Login channel
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...             # Messaging API (for push notifications)
NEXT_PUBLIC_LIFF_ID=...                   # LIFF App ID
OMISE_SECRET_KEY=...                      # Server-side Omise key
NEXT_PUBLIC_OMISE_PUBLIC_KEY=...          # Client-side Omise key
CRON_SECRET=...                           # Bearer token for cron endpoint auth
SETUP_SECRET=...                          # One-time setup endpoint
ACCESS_DEVICE_KEY=...                     # Optional: turnstile / hardware scan (Bearer on POST /api/access/scan)
```

---

## DB schema commands

```bash
npm run db:push      # push schema (incl. club_access_settings, booking_access_passes, access_scan_events)
npm run db:studio    # open Drizzle Studio
npm run db:seed      # seed courts, tiers, admin user
```

---

## Deployment

Push to `main` → Vercel auto-deploys.
Production URL: `https://tennis-booking-git-main-tpune577-hues-projects.vercel.app`
