# Greenwich Tennis Academy — Booking & CRM

Next.js app for court booking, member credits, LINE notifications, and staff admin. Operated under **NIWA PRIVATO**.

## Documentation

| Document | Purpose |
|----------|---------|
| **[PROJECT.md](./PROJECT.md)** | What the system does today — roles, channels, and main functionality |
| **[CONTEXT.md](./CONTEXT.md)** | Domain glossary (Credit, Tier, Booking, …) |
| **[PRODUCT.md](./PRODUCT.md)** | Brand, users, and design principles |
| **[TASKS.md](./TASKS.md)** | Stack, env vars, DB commands, engineering backlog |

## AI / Cursor

Agent work follows **[AGENTS.md](./AGENTS.md)** (Karpathy-inspired rules in `.cursor/rules/00-primary-guidelines.mdc`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure `.env.local` (see **TASKS.md**).

```bash
npm run db:push    # schema → Neon
npm run db:seed    # courts, tiers, admin user
npm run db:studio  # Drizzle Studio
```

## Deploy

Push to `main` → Vercel auto-deploy. Production URL and secrets are listed in **TASKS.md**.
