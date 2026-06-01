# Greenwich Tennis Academy — System Overview

Operational software for **Greenwich Tennis Academy** under **NIWA PRIVATO**: members book indoor courts and spend club **credits**; staff run bookings, members, courts, coaches, and finance from an admin panel. The product UI is primarily Thai; this document is in English for repository onboarding.

For canonical domain terms (Credit, Tier, Top-up package, etc.), see **[CONTEXT.md](./CONTEXT.md)**. For brand and UX intent, see **[PRODUCT.md](./PRODUCT.md)**. For engineering backlog and stack detail, see **[TASKS.md](./TASKS.md)**.

---

## Purpose

The system replaces ad-hoc court booking with a single web application:

1. Members acquire **credits** by paying in Thai baht (Omise).
2. Members **book** courts (and optionally a **coach**) by spending credits.
3. The club **notifies** members on LINE when bookings and balances change.
4. **Staff** oversee bookings, adjust credits, and configure courts, pricing, and coaches.

Success is measured in the product sense as fast mobile booking and reliable credit accounting—not as a generic CRM for unrelated sales pipelines.

---

## Users and access

Everyone signs in with **LINE Login** (NextAuth, JWT session). There is no separate email/password product login.

| Role | Who | What they use |
|------|-----|----------------|
| **Member** (`customer`) | Club members | LIFF surface and member dashboard |
| **Coach user** (`coach_employee`, `coach_freelance`) | Coaches with accounts | Same self-service as members today |
| **Staff** (`staff`) | Front desk / operations | Admin panel |
| **Super admin** (`super_admin`) | System owner | Admin panel + settings |

**Coach** (the person on a booking) is a bookable resource with a profile and hourly credit price; a **coach user** is an account that may also book courts and use the same self-service channels as members.

Route guards enforce roles: admin paths require staff or super admin; settings require super admin.

---

## Money model

### Credits vs baht

- **Credits** pay for bookings (court time and coach time).
- **Baht** enter the system only through **top-up** (Omise). Successful **payments** increase credit balance.
- In practice **one credit is bought for about one baht**; larger **top-up packages** add **bonus credits**.

### Top-up packages (today)

Configured in application code (four fixed bundles):

| Pay (THB) | Credits received | Bonus credits |
|-----------|------------------|---------------|
| 500 | 500 | 0 |
| 1,000 | 1,100 | 100 |
| 2,000 | 2,400 | 400 |
| 5,000 | 6,000 | 1,000 |

Payment methods: **PromptPay QR** and **credit card** (Omise). Webhook fulfillment is idempotent (only one completion per pending payment).

### Credit lifecycle

- Each top-up creates **credit batches** with a **one-year expiry**.
- A daily job expires unused batch balance and records **credit transactions**.
- Members see balance and history on the dashboard; staff can **adjust** credits on the members admin screen.

### Tiers

Each member has one **tier** (membership level). Tiers affect booking rules—for example **discount on court credit price** and **maximum hours per booking**—not a separate “package” purchase flow in the product today.

---

## Channels (member-facing)

**LIFF surface** and **member dashboard** are **peer channels**: same account, same credits, same core tasks. Neither is documented as a fallback for the other.

| Channel | Typical use | Capabilities |
|---------|-------------|--------------|
| **LIFF** (inside LINE) | Book from the OA / mobile | Court booking flow; top-up |
| **Member dashboard** (browser) | Account management | Overview; list and cancel bookings; credit history; top-up |

Booking state between LIFF steps is carried in URL parameters (no global client store for the flow).

---

## What the system does today

### Authentication

- LINE OAuth sign-in and sign-out.
- JWT holds role, credit balance, and LINE user id; session refresh after balance-changing actions where implemented.

### Court booking

- Choose court, date, and time slot; optional **coach** for `court_with_coach` bookings.
- Pricing uses court peak/off-peak rules and the member’s **tier** discount.
- Conflicts with existing non-cancelled bookings are rejected.
- On confirm: booking is **confirmed**, credits are deducted immediately, ledger line written, **LINE push** (plain text) sent when the member has a LINE user id.
- Booking reference format: `BK-YYYYMMDD-###`.

### Cancellation

- Members (own bookings) and staff can cancel **confirmed** bookings.
- If cancellation is **at least 24 hours before start**, credits are **refunded**; otherwise not.
- Cancelled bookings trigger a LINE cancellation message (with refund detail when applicable).

### Member dashboard

- **Overview** — summary for the signed-in member.
- **My bookings** — list and cancel.
- **Credits** — transaction history.
- **Top-up** — choose package and pay via Omise.

### LIFF

- **Book** — multi-step flow: select slot → confirm → success page.
- **Top-up** — credit purchase inside LINE.

### LINE notifications (Messaging API)

Plain-text pushes for:

- Booking confirmed  
- Booking cancelled (with refund note when relevant)  
- Top-up success (amount and new balance)  
- Credits expiring soon (from the expiry cron’s warning pass)

### Staff admin panel

| Area | Functionality |
|------|----------------|
| **Dashboard** | High-level stats and recent bookings |
| **Bookings** | Search/filter; cancel on behalf of the club |
| **Members** | Search; view balances; manual credit adjustment |
| **Courts** | CRUD courts; configure peak/off-peak **pricing** |
| **Coaches** | CRUD coach profiles (linked to users), pricing per hour |
| **Finance** | Summary cards: credits topped up this month, credits used for bookings this month, total credits in the system, total paid revenue (THB) |
| **Settings** | Super admin only |

### Automation

- **Expire credits** — daily cron (authorized with `CRON_SECRET`): expires batches, writes ledger entries, warns members whose credits expire within about seven days.

---

## Related documentation

| Document | Contents |
|----------|----------|
| [CONTEXT.md](./CONTEXT.md) | Domain glossary only |
| [PRODUCT.md](./PRODUCT.md) | Brand, users, design principles |
| [TASKS.md](./TASKS.md) | Stack, constraints, engineering tasks |
| [README.md](./README.md) | Local dev entry (see also AGENTS.md) |

---

## Deployment

Production is deployed on **Vercel** from the `main` branch (see `TASKS.md` for environment variables and URLs).
