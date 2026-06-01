# Product

## Register

product

## Users

Thai tennis club members booking courts on mobile (the primary action), coaches checking schedules, and staff/admins managing bookings, credits, and members — all through the same web app with role-based views. Members arrive via LINE OA; admins sit at a desk. Mobile-first for the member surface; desktop-comfortable for admin.

## Product Purpose

The CRM for Greenwich Tennis Academy (by NIWA PRIVATO): a private members' club for serious tennis players. Members top up credits via PromptPay, book indoor courts, and receive LINE notifications. Staff manage bookings, credits, and coach scheduling through an admin panel. Success means frictionless booking in under 60 seconds, and a club experience that feels as premium on-screen as the physical facility does in person.

## Brand Personality

Calm, Premium, Precise.

The club is a private sanctuary — serious about tennis, elevated in every detail. Greenwich Tennis Academy carries the NIWA PRIVATO DNA: Japanese garden serenity (the bonsai mark, cherry blossom landscaping) fused with European architectural grandeur (the aluminium-vaulted courts). The digital experience should feel like stepping into the lobby — unhurried, confident, nothing cheap or loud.

Voice: formal but warm. No marketing language. The product doesn't sell; it serves.

## Anti-references

- Generic Thai sports booking apps (Sportsman, CourtConnect, FitBuddy): busy grids, bright-orange CTAs, clip-art icons, information overload
- Developer-dark SaaS dashboards that look like VS Code (the current state of the app is too close to this)
- Cheap hotel booking UI: cramped tables, muted teal, low-contrast small print
- Any interface where the brand color fights with the court blue — court blue IS the brand

## Design Principles

1. **The lobby test.** Every screen should feel like arriving at the front desk of a premium club — calm, uncluttered, quietly impressive. If a page feels like a spreadsheet, it has failed.
2. **Court blue earns its place.** The deep sapphire of the court surface is the primary brand signal. Use it on primary actions, current state, and key data — not on decoration. When it appears, it should mean something.
3. **Space is a material.** The physical facility has generous ceilings and open vistas. The UI should breathe. Dense information when necessary (tables, schedules); generous whitespace everywhere else.
4. **Precision, not minimalism.** Luxury is not empty. It is complete — every label clear, every state accounted for, every interaction resolved. Unfinished states (missing empty states, no loading skeletons, vague error messages) destroy the premium illusion.
5. **Thai context, international standard.** Thai is the primary language. Typography and spacing must work for Thai script, which runs taller and denser than Latin. Treat Thai readability as a first-class constraint, not an afterthought.

## Accessibility & Inclusion

- WCAG AA minimum. Thai body text at ≥4.5:1 contrast on all surfaces.
- Mobile-first: tap targets ≥44px, bottom-nav patterns where appropriate on small screens.
- Reduced motion: fade/instant fallbacks for all transitions.
- The club membership includes older adults — avoid type below 14px for any content the user needs to read, not just labels.
