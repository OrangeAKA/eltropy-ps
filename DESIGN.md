# Design System — Eltropy Mission Control + Cyprus CU Member

This file captures the locked design decisions for both surfaces of the
demo. Read this before making any visual or UI change. All tokens here
exist in `app/globals.css`; fonts are loaded in `app/layout.tsx`. Do
not deviate without explicit approval.

## Product Context

- **What this is:** a two-surface demo. Mission Control is a contact-center
  cockpit for credit union service officers. Cyprus CU is a simulated
  credit union member mobile app rendered alongside it.
- **Who it's for:** built as an interview artifact for an Eltropy FDPM
  review. Internally it mirrors the two real audiences: CSAs and members.
- **Project type:** internal SaaS tool (cockpit) + consumer-grade banking
  app (member view), shown side by side via a proportioned split layout.

## Visual Thesis

Quietly literate fintech for credit unions. Trustworthy without corporate
stiffness. Data-honest without coldness. Closer in spirit to a Bloomberg
terminal with a typographer than a violet-gradient SaaS dashboard.

The two surfaces share a typographic and chromatic family. The cockpit
is dense and editorial. The member view breathes.

## Typography

Loaded via `next/font` in `app/layout.tsx`. CSS variables exposed as
`--font-sans`, `--font-serif`, `--font-mono`.

| Role | Font | When to use |
|------|------|-------------|
| Body, UI labels, buttons, navigation | **Public Sans** (`--font-sans`) | Default for everything that isn't display or numeric data. USWDS heritage = federally regulated, considered. |
| Wordmark, page titles, marketing accents | **Source Serif 4** (`--font-serif`) | Masthead and top-level titles only. Never body. |
| IDs, currency, durations, latencies, timestamps, skill tags | **Geist Mono** (`--font-mono`) | Anything that must align numerically. Always with `font-feature-settings: "tnum"`. |

**Scale (px):** `12 / 14 / 16 / 20 / 25 / 32 / 40`. Modular ratio ~1.25.

**Headings:** `letter-spacing: -0.01em`. Use Public Sans, not Source
Serif 4, except for the masthead.

**Body font features:** `cv11, ss01, ss03` (Public Sans contextual
alternates). Mono uses `calt liga 0` so digits stay honest.

## Color (OKLCH)

All color is OKLCH. Pure black and pure white never appear; every
surface is tinted toward hue 195 by at least chroma 0.003.

### Brand (existing)

`--color-brand-50` through `--color-brand-900` at hue 195. Chroma drops
at extreme lightness per the Impeccable rule. Primary actions use
`--color-brand-600`; active and pressed use `--color-brand-700`.

### Surfaces (existing)

- `--color-surface-page` — app background (oklch 0.980)
- `--color-surface-card` — cards, panels (oklch 0.995)
- `--color-rule` — default 1px hairlines (oklch 0.920)
- `--color-rule-strong` — emphasized borders (oklch 0.880)

### Status (added)

- `--color-status-ok` — approved transfers, success outcomes
- `--color-status-pending` — officer queue items, "under review"
- `--color-status-info` — neutral system notes
- `--destructive` (existing) — blocked transfers, errors

Each has a matching `-fg` for foreground text on top.

### Member surface (added)

- `--color-member-bg` — phone background
- `--color-member-card` — phone cards (lifted slightly above bg)
- `--color-member-rule` — softer hairlines than the cockpit

## Spacing

4pt scale. CSS variables: `--space-2xs (4) / xs (8) / sm (12) / md (16)
/ lg (24) / xl (32) / 2xl (48) / 3xl (64)`.

- **Mission Control:** comfortable density. `--space-md` card padding,
  `--space-xs` to `--space-sm` row gap.
- **Cyprus CU member:** breathable. `--space-lg` card padding,
  `--space-lg` to `--space-xl` section gap.

## Layout

- **Mission Control:** hybrid grid. Left rail = member context + skills.
  Right rail = officer queue. Flexible center = activity feed.
- **Cyprus CU member:** single column inside a ~390px iPhone-sized phone
  frame. iOS-conventional structure.
- **Spotlight layout (root):** either surface can expand to full
  viewport. Default state = proportioned split (phone on left, cockpit
  on right). See Motion below for timing.

## Motion

Existing easing tokens: `--ease-out-quart`, `--ease-out-quint`,
`--ease-out-expo`. Existing duration tokens: `--duration-instant
(140ms) / fast (220ms) / medium (320ms) / slow (560ms)`.

**Added signature tokens:**

- `--duration-spotlight: 320ms`, used with `--ease-out-quint`. The
  spotlight expand/collapse animation.
- `--duration-pulse: 600ms`. The call-landed pulse, choreographed
  simultaneously on both surfaces when a call arrives.

**Principles:**

- Real money never bounces. Use ease-out. Never elastic or spring
  overshoot.
- One signature motion moment per demo: the synchronized pulse.
- Reduced motion: respect `prefers-reduced-motion`. Already handled in
  `globals.css`.

## Patterns

### Activity feed row (Mission Control)

Editorial card layout. Vertical order:

1. Timestamp in `--font-mono`, 12px, `text-muted-foreground`.
2. Caller name + intent in `--font-sans`, 16px, `text-foreground`.
3. Skill chain as inline mono pills (see Skill Pill).
4. Outcome chip at right: mono, 14px, neutral background.
5. Economics footer in 11px muted:
   `47s · $0.03 · saved ~$8 vs CSA call`.

Rows separated by `--color-rule` 1px hairline. No alternating row
colors. No drop shadows.

### Skill pill

- Font: Geist Mono, 11px
- Border: 1px `--color-rule`
- Background: `--color-surface-card`
- Padding: 2px 6px
- Border radius: `--radius-sm`
- Color: `text-muted-foreground`

No saturated chip colors. The marketplace story comes from count and
diversity, not noise.

### Pending hold card (Member)

- Background: `--color-member-card` with `--color-status-pending` at
  ~8% opacity overlay tint
- Headline: "Transfer pending review" in `--font-sans`, 18px
- Subhead: amount + accounts in secondary text, 14px
- Status row: small dot in `--color-status-pending` + plain text
  "Under member services review"
- Time hint: "Typically resolved within 5 minutes" — calm, not anxious
- No action buttons. Read-only acknowledgment.

### Economics badge (Mission Control)

Always renders as a footnote, never as a billboard. Right- or
bottom-aligned on the resolved-call card. 11px muted text. Geist Mono
for the numeric parts:

`47s · $0.03 voice + LLM · deflected from ~12-min CSA call (~$8 saved)`

### Call-landed pulse

On call arrival, both surfaces show a 1px hairline pulse on their
primary container border. Duration `--duration-pulse` (600ms). Color
animates from `--color-brand-300` to `transparent` using `--ease-out-quint`.
This is the demo's "magic beat" — the only synchronized motion across
both surfaces.

## Anti-patterns

Do not ship any of these. They are the AI-slop fingerprints we are
explicitly avoiding.

- Purple or violet gradients of any kind
- 3-column icon grids with rounded-corner icon tiles
- Center-aligned everything
- `border-left` greater than 1px as a colored accent stripe on cards or
  alerts (per Impeccable absolute ban)
- Gradient text via `background-clip: text` (per Impeccable absolute ban)
- Glass morphism / backdrop blur as decoration
- Drop shadows for elevation in Mission Control (use `--color-rule`
  hairlines instead). Member surface may use soft, low-blur elevation.
- Colored chips for skill tags (use the mono hairline Skill Pill instead)
- Bouncy or elastic easing on financial UI
- Inter, Roboto, DM Sans, or any font from the Impeccable reflex-reject
  list. Public Sans + Source Serif 4 + Geist Mono are the locked stack.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Formalized existing design system in DESIGN.md | Existing tokens in globals.css and fonts in layout.tsx were intentional but undocumented. Locking them now so future work does not drift. |
| 2026-06-04 | Added status palette (ok / pending / info) to `@theme` | Only `--destructive` existed. Officer queue + pending hold cards need calm semantic colors. |
| 2026-06-04 | Added member-surface tokens to `@theme` | Phone view needs slightly more lift on cards and softer hairlines than the cockpit. Same hue family preserves family resemblance. |
| 2026-06-04 | Added `--duration-spotlight` and `--duration-pulse` | The proportioned-split layout needs a named motion token for expand/collapse, and the call-landed pulse needs to be reproducible across both surfaces. |
