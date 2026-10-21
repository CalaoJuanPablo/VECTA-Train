# Spec 4 — Client architecture

Everything that defines how the SPA is built and how it talks to the server. Cross-reference: token and theme layers in `packages/design-system` are documented in the design-system skill, not here.

## 1. Design system

`client/src/ui/` holds the token layer, themes, and components.

- Tokens are CSS custom properties (`--vt-*`) split into base and semantic layers.
- Themes are light and dark, applied as cascade-layer overrides on a `data-theme` attribute.
- Cascade order is fixed by `layers.css`: `reset, tokens, theme, core, overrides`.
- Every `*.module.css` imports `layers.css` and declares its rules inside `@layer core`.
- `theme-script.tsx` sets `data-theme` and `data-color-scheme` from `prefers-color-scheme` before paint, so there is no flash of the wrong theme. Theme switching is not React state.
- Components are presentational. They render markup and ARIA wiring; no form state, no validation, no API calls.
- Each component has a co-located test and a Storybook story.
- The design system has no build step. It is consumed from source.

## 2. Forms

`FormsProvider` and `useForm` provide named forms per provider, backed by zustand. Validation schemas live beside the form they validate. Components stay pure-visual; consumers own state, errors, and submission.

## 3. API access

All requests go through the tRPC client in `src/trpc.ts`, configured with `httpBatchLink`, `superjson`, and `credentials: 'include'`. Components never call `fetch` directly.
