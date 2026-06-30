# Component Recipes

Atomic React components, one folder each, styled with CSS Modules consuming the
global tokens. Read this when building or restyling any UI component.

## File layout per component

```
src/components/<Name>/
├── <Name>.tsx
├── <Name>.module.css
└── index.ts          // export { Name } from './Name'
```

Rules:
- The component owns its layout and variants; it never sets page-level margins.
- `.module.css` references only `var(--vt-...)` tokens — no literals.
- Variants are props mapped to classes, not boolean style soup.
- Compose, don't fork: build `StatCard` from `Card` + `Stat`, not a new blob.

## Class naming inside a module

Use role names: `.root` for the top element, then descriptive parts
(`.label`, `.value`, `.icon`, `.track`, `.fill`). Variants get their own class
(`.primary`, `.ghost`, `.danger`) toggled via a lookup, e.g.:

```tsx
import s from "./Button.module.css";
const variantClass = { primary: s.primary, ghost: s.ghost }[variant];
<button className={`${s.root} ${variantClass}`} {...rest} />
```

For conditional classes prefer a tiny `cx(...parts)` helper that filters falsy
values over string templates with ternaries.

---

## Button

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", size = "md", ...rest }: ButtonProps) {
  return <button className={cx(s.root, s[variant], s[size])} {...rest} />;
}
```

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .root {
    display: inline-flex;
    align-items: center;
    gap: var(--vt-space-2);
    border: 1px solid transparent;
    border-radius: var(--vt-radius-md);
    font-family: var(--vt-font-ui);
    font-weight: var(--vt-font-weight-semibold);
    letter-spacing: var(--vt-tracking-label);
    transition: background var(--vt-duration-fast) var(--vt-ease-out),
                border-color var(--vt-duration-fast) var(--vt-ease-out);
  }
  .md { padding: var(--vt-space-2) var(--vt-space-4); font-size: var(--vt-font-size-sm); }
  .sm { padding: var(--vt-space-1) var(--vt-space-3); font-size: var(--vt-font-size-xs); }

  .primary { background: var(--vt-color-accent); color: var(--vt-color-on-accent); }
  .primary:hover { background: var(--vt-color-accent-strong); }

  .secondary {
    background: var(--vt-color-surface-raised);
    color: var(--vt-color-text-primary);
    border-color: var(--vt-color-border-subtle);
  }
  .secondary:hover { border-color: var(--vt-color-border-strong); }

  .ghost { background: transparent; color: var(--vt-color-text-secondary); }
  .ghost:hover { background: var(--vt-color-surface-raised); color: var(--vt-color-text-primary); }

  .root:disabled { color: var(--vt-color-text-disabled); cursor: not-allowed; }
}
```

---

## Card / Panel

The base surface for everything on the dashboard.

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .root {
    background: var(--vt-color-surface);
    border: 1px solid var(--vt-color-border-subtle);
    border-radius: var(--vt-radius-lg);
    padding: var(--vt-space-4);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--vt-space-3);
  }
  .title { font-size: var(--vt-font-size-h2); letter-spacing: var(--vt-tracking-tight); }
}
```

Optional `interactive` variant adds `box-shadow: var(--vt-shadow-md)` on hover and
`border-color: var(--vt-color-border-strong)`.

---

## Stat (metric display)

The workhorse: a labeled number. Used in metrics panels, activity cards,
weekly summaries. Always tabular mono.

```tsx
type StatProps = { label: string; value: string; unit?: string; tone?: "default" | "accent" };
```

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .label { /* compose the global .eyebrow */ margin-bottom: var(--vt-space-1); }
  .value {
    font-family: var(--vt-font-mono);
    font-feature-settings: var(--vt-font-feature-tnum);
    font-size: var(--vt-font-size-display);
    font-weight: var(--vt-font-weight-semibold);
    color: var(--vt-color-text-primary);
    line-height: var(--vt-line-height-tight);
  }
  .unit { font-size: var(--vt-font-size-sm); color: var(--vt-color-text-muted); margin-left: var(--vt-space-1); }
  .accent .value { color: var(--vt-color-accent); }   /* used for TRIMP */
}
```

---

## Badge / Pill

Status chips: provider (Strava/COROS), sport type, ACWR zone, sync state.

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .root {
    display: inline-flex;
    align-items: center;
    gap: var(--vt-space-1);
    padding: var(--vt-space-1) var(--vt-space-3);
    border-radius: var(--vt-radius-pill);
    font-size: var(--vt-font-size-xs);
    font-weight: var(--vt-font-weight-medium);
    letter-spacing: var(--vt-tracking-label);
  }
  .positive { background: color-mix(in srgb, var(--vt-color-positive) 16%, transparent); color: var(--vt-color-positive); }
  .warning  { background: color-mix(in srgb, var(--vt-color-warning) 16%, transparent);  color: var(--vt-color-warning); }
  .strava   { background: color-mix(in srgb, var(--vt-color-strava) 18%, transparent);   color: var(--vt-color-strava); }
  .neutral  { background: var(--vt-color-surface-raised); color: var(--vt-color-text-secondary); }
}
```

---

## Input / Select

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .field {
    width: 100%;
    background: var(--vt-color-surface-sunken);
    border: 1px solid var(--vt-color-border-subtle);
    border-radius: var(--vt-radius-md);
    padding: var(--vt-space-2) var(--vt-space-3);
    color: var(--vt-color-text-primary);
    font-family: var(--vt-font-ui);
    font-size: var(--vt-font-size-body);
  }
  .field::placeholder { color: var(--vt-color-text-faint); }
  .field:focus { border-color: var(--vt-color-accent); outline: none; }
  .label { /* global .eyebrow */ display: block; margin-bottom: var(--vt-space-2); }
}
```

Numeric inputs (restingHR, maxHR, weight) add `font-family: var(--vt-font-mono)`.

---

## ChartFrame (wrapper for HR / pace / elevation / TRIMP charts)

Charts render with a charting lib (Recharts/visx) but their **container,
title, axes, and series colors come from tokens**, so they match the UI.

```css
@import '@vecta/design-system/src/layers.css';

@layer core {
  .root { /* compose Card */ }
  .head { display: flex; justify-content: space-between; align-items: baseline; }
  .title { /* global .eyebrow */ }
  .legend { display: flex; gap: var(--vt-space-3); }
  .dot { width: 8px; height: 8px; border-radius: var(--vt-radius-circle); }
}
```

Pass token values into the chart lib via JS, e.g.
`stroke="var(--vt-color-viz-hr)"` or read the CSS var with `getComputedStyle`.
Grid lines use `--vt-color-border-subtle`; axis text uses `--vt-color-text-muted` at `--vt-font-size-xs`.

---

## Gauge (ACWR / sweet-spot indicator)

Radial or linear range with a target band. Sweet spot uses `--vt-color-positive`,
caution zones use `--vt-color-warning`. Track is `--vt-color-surface-sunken`, ticks are
`--vt-color-border-strong`. Value label uses the Stat `.value` styling.

---

## App shell

- Sidebar `width: var(--vt-sidebar-width)`, `background: var(--vt-color-surface)`,
  right `border: 1px solid var(--vt-color-border-subtle)`.
- Nav items: `--vt-color-text-secondary`, active item `--vt-color-text-primary` with a
  `--vt-color-accent` left indicator or background tint.
- Main column max width `var(--vt-max-content)`, padding `--vt-space-6`.
- Wordmark "VECTA" `--vt-color-text-primary` + "TRAIN" `--vt-color-accent` or `--vt-color-text-muted`,
  uppercase, `--vt-tracking-eyebrow`.

---

## Accessibility baseline

- All interactive elements get the global `:focus-visible` ring.
- Never signal state with color alone — pair ACWR/zone colors with a label.
- Maintain text contrast: avoid `--vt-color-text-faint` for anything load-bearing.
- Respect `prefers-reduced-motion` (already handled in reset).
