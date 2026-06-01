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
- **LINE Notifications** — plain text push for: booking confirmed, booking cancelled, topup success, credit expiring soon (`src/lib/notifications/line.ts`)
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

### Task G — LINE Notifications: upgrade to Flex Messages

**Status:** working as plain text (`src/lib/notifications/line.ts`). All 4 notification types fire correctly. Needs visual upgrade.

**What to build:**

Replace the `push()` plain-text calls with Flex Message bubbles for each notification type. LINE Flex Messages are JSON payloads sent to `https://api.line.me/v2/bot/message/push` with `type: "flex"`.

Notification types to upgrade (all in `src/lib/notifications/line.ts`):

1. **`notifyBookingConfirmed`** — green header bubble, show: booking ref, court, date, time range, credit deducted
2. **`notifyBookingCancelled`** — red/grey bubble, show: booking ref, court, refund status + amount
3. **`notifyTopupSuccess`** — green bubble, show: credits added, new balance
4. **`notifyCreditExpiringSoon`** — amber warning bubble, show: amount, days left, expiry date, CTA button "เติมเครดิต" linking to LIFF topup

Flex Message docs: https://developers.line.biz/en/docs/messaging-api/flex-message-elements/

**Files to touch:**
- `src/lib/notifications/line.ts` — replace plain text with Flex Message JSON

**Example structure for each message:**
```ts
body: JSON.stringify({
  to: lineUserId,
  messages: [{
    type: "flex",
    altText: "จองสนามสำเร็จ!",  // fallback text for notifications
    contents: {
      type: "bubble",
      // ... flex message JSON
    }
  }]
})
```

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
```

---

## DB schema commands

```bash
npm run db:push      # push schema changes directly to Neon (no migration files)
npm run db:studio    # open Drizzle Studio
npm run db:seed      # seed courts, tiers, admin user
```

---

## Deployment

Push to `main` → Vercel auto-deploys.
Production URL: `https://tennis-booking-git-main-tpune577-hues-projects.vercel.app`
