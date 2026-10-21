# Token Usage Reference

Apply tokens by **meaning**, not by appearance. Pick the variable whose name
describes the role, so theme switching and future retuning stay automatic.

## Color decision rules

| You're styling…                           | Use                                                  |
| ----------------------------------------- | ---------------------------------------------------- |
| Page background                           | `--vt-color-surface-app`                             |
| A card, panel, list item container        | `--vt-color-surface`                                 |
| A nested box or hover state inside a card | `--vt-color-surface-raised`                          |
| An input field, progress track, or "well" | `--vt-color-surface-sunken`                          |
| A default hairline divider/border         | `--vt-color-border-subtle`                           |
| A focused/active/interactive border       | `--vt-color-border-strong`                           |
| Main text (headings, values)              | `--vt-color-text-primary`                            |
| Supporting text, axis labels              | `--vt-color-text-secondary`                          |
| Labels, captions, metadata                | `--vt-color-text-muted`                              |
| Placeholder, disabled, faint hints        | `--vt-color-text-faint` / `--vt-color-text-disabled` |
| A primary action / TRIMP / "good" state   | `--vt-color-accent`                                  |
| Text/icon sitting on an accent fill       | `--vt-color-on-accent`                               |

## Data-viz palette

Charts are core to this product — keep series colors consistent across every
screen so users learn them.

- Heart rate / HR zones → `--vt-color-viz-hr` (blue)
- Effort / training load / pace intensity → `--vt-color-viz-effort` (orange)
- Elevation / tertiary series → `--vt-color-viz-alt` (purple)
- TRIMP / fitness / "optimal" → `--vt-color-viz-accent` (mint)

Never recolor a series per-chart. HR is always blue, everywhere.

Status mirrors viz: `--vt-color-positive` (mint), `--vt-color-warning` (orange),
`--vt-color-info` (blue). ACWR "sweet spot" uses mint; out-of-range uses warning.

## Numbers

Any digit a user reads as data — TRIMP, pace, HR, distance, duration, counts —
renders in `--vt-font-mono` with `--vt-font-feature-tnum`. Use the `.num` global
class or set both properties locally. This stops columns of numbers from
shifting width as values change. Body prose stays in `--vt-font-ui`.

## Type roles

- `--vt-font-size-display` — the one big number/title per screen (hero metric)
- `--vt-font-size-h1` / `--vt-font-size-h2` — panel and section headings, `--vt-tracking-tight`
- `--vt-font-size-body` — default
- `--vt-font-size-eyebrow` — uppercase section labels, `--vt-tracking-eyebrow`, `--vt-color-text-muted`

## Spacing & radii

Use the `--vt-space-*` scale only (4px base). Card padding is typically
`--vt-space-4`; tight rows `--vt-space-2`/`--vt-space-3`. Cards use `--vt-radius-lg`,
inner chips/inputs `--vt-radius-md` or `--vt-radius-sm`, avatars/dots `--vt-radius-circle`.

## What NOT to do

- No raw hex, rgb, or px color values in component CSS.
- No new colors outside this file — if a real need appears, add a token
  to the base tokens first, then use it.
- No `px` font sizes outside the `--vt-font-size-*` scale.
- Don't flip brand/viz colors between themes; only surfaces/text/borders flip.
