---
name: Greenwich Tennis Academy CRM
description: Premium club CRM — white marble canvas, court blue signal, warm oak commitment on mobile LIFF.
colors:
  canvas: "#ffffff"
  brand-paper: "#faf6ef"
  brand-header: "#faf6efdb"
  brand-ink: "#2a2620"
  court-blue: "#17527b"
  court-blue-foreground: "#fafafa"
  brand-oak: "#c4a06a"
  brand-oak-deep: "#9c7a4c"
  brand-cta: "#86602f"
  brand-cta-deep: "#6b4c23"
  booking-subtle: "#5c5348"
  border-warm: "#e0d9ce"
  destructive: "#c44a2e"
typography:
  display:
    fontFamily: "Trirong, Times New Roman, serif"
    fontWeight: 500
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans Thai, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "IBM Plex Sans Thai, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.22em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-cta}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-cta-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
  button-selection:
    backgroundColor: "{colors.court-blue}"
    textColor: "{colors.court-blue-foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  chip-default:
    backgroundColor: "{colors.brand-paper}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Greenwich Tennis Academy CRM

## Overview

**Creative North Star: "The Members' Lobby"**

Members open LINE on a bright phone, often outdoors or in a car park, and expect the same calm confidence they feel at the club entrance: unhurried, precise, never loud. The digital system mirrors the facility: white marble content areas, warm wood and paper surfaces for wayfinding, court sapphire for “this slot is yours,” and oak bronze for committing money or time. Admin surfaces inherit the same tokens but may use denser tables; the LIFF member flow is the reference implementation.

The system rejects generic Thai sports-app grids, developer-dark SaaS chrome, and cheap-hotel booking tables. Space is a material on marketing-empty screens; precision (labels, states, errors, credits) is what makes minimalism feel premium rather than unfinished.

**Key Characteristics:**

- White `#ffffff` canvas with `#faf6ef` paper pockets, not a cream-tinted full-page wash
- Court blue (`oklch(0.38 0.175 248)`) reserved for selection, links, and focus rings
- Oak CTA (`#86602f`) for primary commits on LIFF; shadcn default button maps here
- IBM Plex Sans Thai body + Trirong headings; Thai readability ≥14px for readable copy
- Subtle corners (`6px` booking, `10px` base radius); tonal elevation over heavy shadow
- `prefers-reduced-motion`: instant or near-instant transitions; no layout animation

## Colors

Warm wood neutrals carry the club; court blue signals state; oak carries commitment.

### Primary

- **Court Sapphire** (`#17527b` / `oklch(0.38 0.175 248)`): Selected time slots, primary links, focus rings (`--ring`), chart-1. Appears when something is *active* or *chosen*, not on every button.
- **Court Sapphire Foreground** (`#fafafa` / `oklch(0.99 0 0)`): Text and icons on court-blue fills.

### Secondary

- **Lobby Oak** (`#c4a06a`): Dividers, intro eyebrows, decorative rules beside section labels.
- **Deep Oak** (`#9c7a4c`): Uppercase booking intro label, badge borders, coin icon accent in header.

### Tertiary

- **Commitment Bronze** (`#86602f` / `--brand-cta`): Default shadcn `Button`, `.btn-brand`, sticky footer “continue” when enabled.
- **Pressed Bronze** (`#6b4c23` / `--brand-cta-deep`): Hover and pressed CTA states.

### Neutral

- **Marble Canvas** (`#ffffff` / `--background`): Main content background; LIFF scroll areas.
- **Club Paper** (`#faf6ef` / `--brand-paper`): Headers, chips at rest, empty states, credit pill background.
- **Frosted Header** (`#faf6efdb` / `--brand-header`): LIFF top bar with `backdrop-blur-md`.
- **Warm Ink** (`#2a2620` / `--brand-ink`): Summary panels, dark booking footer blocks.
- **Booking Secondary** (`oklch(0.42 0.024 78)` / `.text-booking-subtle`): Subtitles and helper text on paper; must stay ≥4.5:1 on `#faf6ef`.
- **Foreground** (`oklch(0.20 0.018 75)`): Body text on white.
- **Muted Foreground** (`oklch(0.50 0.022 78)`): Tertiary descriptions on white.
- **Warm Border** (`oklch(0.88 0.018 78)`): Dividers, chip outlines, form shells.

**The Court Blue Means Something Rule.** Court blue marks selection, navigation emphasis, and focus. If it decorates static chrome or fills more than ~10% of a LIFF screen, it has failed the lobby test.

**The White Canvas Rule.** Page background stays true white. Warmth lives in paper pockets, oak accents, and typography, not a sand-tinted full viewport.

## Typography

**Display Font:** Trirong (500, `font-heading`) — club name, page titles, booking intro headlines.

**Body Font:** IBM Plex Sans Thai (400, line-height 1.75) — all UI copy, including Thai labels.

**Label/Mono Font:** Geist Mono — IDs, codes, timestamps in admin contexts only.

**Character:** Serif display + humanist Thai sans: European club signage meets readable Thai mobile UI. One deliberate uppercase tracked label per booking intro (`11px`, `0.22em`, oak-deep), not per section.

### Hierarchy

- **Display** (Trirong 500, up to `text-2xl` / ~24px on LIFF, `text-wrap: balance`): Screen titles inside flows, booking intro headline.
- **Headline** (Trirong 500, `text-base`–`text-lg`): Header bar titles, card titles.
- **Title** (IBM Plex Sans Thai 600, `text-sm`): Section labels, credit balance emphasis.
- **Body** (IBM Plex Sans Thai 400, `text-sm`–`text-base`, max ~60–65ch in prose blocks): Instructions, empty states, errors.
- **Label** (600, `10px`–`11px`, uppercase + tracking only for the single booking intro eyebrow): Not repeated above every section.

**The Thai-First Rule.** Do not go below 14px for content the member must read. Subtle secondary text uses `--booking-subtle`, not default Tailwind `text-muted-foreground` on paper.

## Elevation

Flat-by-default with warm tonal layering. Depth comes from paper vs white, ink summary panels, and hairline borders—not stacked card shadows.

### Shadow Vocabulary

- **Surface hairline** (`0 1px 2px oklch(0.22 0.02 75 / 0.05)`): `BookingForm` shell, light cards.
- **Lifted panel** (`0 1px 2px …, 0 8px 24px -16px oklch(0.22 0.02 75 / 0.18)`): Sticky footer container on booking.
- **Selected tile** (`0 1px 2px oklch(0.22 0.02 75 / 0.06)`): Court-type cards when selected.

**The No Glass Default Rule.** `backdrop-blur-md` is allowed only on the branded header strip. Do not add decorative glass cards elsewhere.

## Components

Booking primitives in `src/components/liff/booking/booking-ui.tsx` are the LIFF signature; shadcn/ui covers admin.

### Buttons

- **Shape:** `rounded-lg` (10px) for shadcn; `rounded-sm` (6px) for LIFF footer CTAs.
- **Primary (commit):** `#86602f` background, white text, min-height 48px on LIFF footer; hover `#6b4c23`; focus `ring-2` court blue with offset.
- **Selection (time/court chips):** Rest on paper + border; selected = court blue fill + white text; `active:scale-[0.98]` with reduced-motion override.
- **Ghost / outline:** Border `border-border`, hover `bg-muted` — secondary escapes only.

### Chips

- **Style:** `BookingChip` — min height 44px, `rounded-sm`, border `border-border`, background paper or court blue when selected.
- **State:** Disabled = reduced opacity + no pointer; loading uses pulse skeletons with `motion-reduce:animate-none`.

### Cards / Containers

- **Corner Style:** `rounded-sm` (6px) on LIFF forms and empty states.
- **Background:** White card on white canvas, or paper tint for dashed empty states.
- **Border:** 1px `border-border`; selected court cards pick up oak border + light shadow.
- **Internal Padding:** `p-4`–`p-5` for touch-friendly blocks; `max-w-md` column centered on LIFF.

### Inputs / Fields

- **Style:** Inherited from shadcn on admin; LIFF uses segmented `BookingToggle` (paper track, 44px min height segments).
- **Focus:** `.booking-focus-ring` — `ring-2 ring-ring ring-offset-2 ring-offset-background`.

### Navigation

- **LIFF bottom nav:** Thai labels, paper/oak accents, safe-area padding.
- **Branded header:** Logo on paper square, Trirong “Greenwich”, tracked uppercase academy line, credit pill with coin icon.

### Booking Summary Panel

- **Ink panel:** `--brand-ink` background, light warm text (`oklch(0.93 0.012 85)`), used in sticky footer summary before confirm.

## Do's and Don'ts

### Do:

- **Do** keep LIFF booking in a single `max-w-md` column with `pb` scroll padding above the sticky footer.
- **Do** use court blue only for selected slots, links, and focus rings.
- **Do** use oak CTA (`#86602f`) for actions that spend credits or advance the booking flow.
- **Do** provide empty states with dashed paper panels and one clear next step (onboard pattern).
- **Do** honor `prefers-reduced-motion` via `.motion-safe-transition` and `.motion-safe-active`.
- **Do** write Thai copy: verb + object buttons (“ยืนยันการจอง”), standalone link text.

### Don't:

- **Don't** ship interfaces that feel like generic Thai sports booking apps (Sportsman, CourtConnect, FitBuddy): busy grids, bright-orange CTAs, clip-art icons, information overload.
- **Don't** use developer-dark SaaS dashboards (VS Code aesthetic) on member-facing LIFF.
- **Don't** use cheap hotel booking UI: cramped tables, muted teal, low-contrast small print.
- **Don't** let brand color fight court blue — court blue is the brand signal for state.
- **Don't** tint the entire viewport cream/sand; paper is a surface, not the canvas.
- **Don't** add side-stripe accent borders, gradient text, hero-metric templates, or identical icon+heading card grids.
- **Don't** put tiny uppercase tracked eyebrows above every section; one intro eyebrow on the booking flow is enough.
- **Don't** use numbered section markers (01 / 02 / 03) unless the UI is a real ordered sequence.
- **Don't** animate layout properties or use bounce/elastic easing on member flows.
