---
name: vecta-design-system
description: The design system for VECTA Train — a running training-analytics web app. Use this skill WHENEVER building, styling, or restyling any frontend UI in this project: pages, screens, React components, layouts, charts, or CSS. This includes the Dashboard, Activities list, Activity detail, Calendar, Insights, and Settings screens, plus any buttons, cards, metric/stat displays, badges, inputs, gauges, and HR/pace/elevation/TRIMP charts. Trigger it even when the user just says "build the dashboard", "make a component", "style this", "add a page", or names any UI element — do not invent ad-hoc colors, fonts, or spacing. Always apply this system so the app stays visually consistent with the approved wireframes.
---

# VECTA Train Design System

A dark-first, data-dense "athletic instrument" aesthetic: warm-grey neutrals, a single mint accent, monospaced tabular numerals for every metric, and a fixed categorical palette for charts. Built for **React atomic components with CSS Modules** — no CSS framework, no utility classes, no inline style objects for theming.

## Architecture

Everything is built on **CSS cascade layers + design tokens**. Components ship structural CSS once, and any number of brands/themes/color-schemes can restyle them by overriding CSS custom properties — with zero specificity wars, thanks to `@layer`.

### The five-layer cascade

```css
@layer reset, tokens, theme, core, overrides;
```

| Order | Layer | Purpose | Who writes here |
|-------|-------|---------|-----------------|
| 1 | `reset` | Normalize browser (box-sizing, color-scheme, font inheritance) | Foundation only |
| 2 | `tokens` | Declare every design value as a CSS custom property on `html` (base → semantic → component) | Token files |
| 3 | `theme` | Per-brand overrides of token values, scoped by `[data-theme="..."]` | Theme files |
| 4 | `core` | Structural CSS of components — layout, spacing, states. **Consumes** tokens via `var()`. | Component modules |
| 5 | `overrides` | Escape hatch for consuming apps to win over component CSS without `!important` | Consumer apps |

Every CSS file wraps its rules in the appropriate `@layer { ... }` block.

### The three-tier token system

All tokens use the `--vt-` prefix (VECTA Token). They form a reference chain:

**Tier 1 — Base / primitive tokens** (`@vecta/design-system/src/tokens/base/`): Raw, context-free values (hex, px). One file per category: `color`, `spacing`, `font-size`, `font-family`, `font-weight`, `line-height`, `letter-spacing`, `border-radius`, `box-shadow`.

```css
--vt-color-accent: #00e5a0;
--vt-space-4: 16px;
--vt-font-size-body: 14px;
```

**Tier 2 — Semantic tokens** (`@vecta/design-system/src/tokens/semantic/`): Intent-based aliases that map meaning onto base tokens. Uses `light-dark()` for automatic light/dark switching:

```css
--vt-color-surface-app: light-dark(#fafaf8, #131311);
--vt-color-text-primary: light-dark(#1a1a17, #f2f1ec);
```

**Tier 3 — Component tokens** (`@vecta/design-system/src/tokens/component/`): Per-component knobs (populated as components are built).

Reference chain: `component token → semantic token → base token → literal value`

### Themes

Themes live in `@vecta/design-system/src/themes/`. A theme is a set of token re-declarations inside `@layer theme`, scoped to a `[data-theme]` attribute. The default theme (dark) is empty — defaults live in tokens. Light theme overrides only surfaces/borders/text:

```css
[data-theme='light'] {
  --vt-color-surface-app: #fafaf8;
  --vt-color-text-primary: #1a1a17;
}
```

### Color scheme (light / dark)

Handled via `data-color-scheme` attribute and the native `color-scheme` property, set in `reset.css`:

```css
[data-color-scheme='light'] { color-scheme: only light; }
[data-color-scheme='dark']  { color-scheme: only dark; }
```

Once `color-scheme` is set, every `light-dark()` call in the semantic layer resolves automatically. No `.dark { ... }` duplicate-selector sheet.

### Breakpoints

Breakpoints are exposed as CSS Modules `@value` entries in `@vecta/design-system/src/breakpoints.css`:

```css
@value breakpoint-xs: (0 <= width);
@value breakpoint-sm: (576px <= width);
@value breakpoint-md: (768px <= width);
@value breakpoint-lg: (992px <= width);
@value breakpoint-xl: (1200px <= width);
@value breakpoint-xxl: (1320px <= width);
```

Use in component CSS: `@media breakpoint-md { ... }`.

## Before writing any UI, do this

1. Import the design system in your root layout:
   ```tsx
   import '@vecta/design-system/src/layers.css';
   import '@vecta/design-system/src/reset.css';
   import '@vecta/design-system/src/tokens.css';
   import '@vecta/design-system/src/themes.css';
   ```
2. Read `references/tokens.md` — how to choose tokens by meaning.
3. Read `references/components.md` — the atomic component recipes.
4. Everything else consumes those variables via `var(--vt-...)`.

## Non-negotiables

These keep the product coherent. Follow them on every component:

- **Tokens only.** No raw hex/rgb/px colors and no off-scale font sizes in component CSS. If a value you need isn't a token, add it to the base tokens first, then use the variable.
- **CSS Modules, not frameworks.** One `.module.css` per component. No Tailwind, no styled-components, no global class names leaking between components.
- **Mono tabular numbers.** Any data digit (TRIMP, pace, HR, distance, time, counts) uses `--vt-font-mono` + `--vt-font-feature-tnum`. Prose stays in `--vt-font-ui`.
- **Fixed chart colors.** HR is always blue, effort always orange, elevation always purple, TRIMP/fitness always mint — identical on every screen.
- **Compose atoms.** Build bigger pieces (StatCard, metrics panel, ChartFrame) from the primitives in `components.md`. Don't reimplement a card.
- **Dark is default; light theme only flips surfaces/text/borders** via `[data-theme="light"]` on `<html>`. Brand and viz colors never flip.

## Building a component — checklist

- Folder: `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `index.ts`. (Pattern in `components.md`.)
- Variants come from props mapped to classes; use a small `cx()` helper.
- Pull the closest recipe from `components.md` and adapt — don't start blank.
- Numbers → mono/tnum (`--vt-font-mono`, `--vt-font-feature-tnum`). Labels → `.eyebrow`. Surfaces → `--vt-color-surface-*`.
- Add the focus ring (inherited from reset) and don't encode state in color alone.

## Screen-level guidance

The wireframes cover Dashboard, Activities, Activity detail, Calendar, Insights, Settings. Shared shell (sidebar + max-width main column + VECTA·TRAIN wordmark) is in `components.md` under "App shell". Each screen is a composition of Card, Stat, Badge, ChartFrame, and Gauge — no screen needs bespoke colors or fonts.

## When something isn't covered

If a needed pattern (e.g. a new chart type or empty state) isn't in `components.md`, design it from existing tokens and the nearest recipe, keep it atomic, and note it so it can be folded back into `components.md`. Never reach for a one-off color or font to ship faster.
