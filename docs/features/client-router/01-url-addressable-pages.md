# 01 — URL-addressable pages

## Story
As a visitor, I want each page to have its own URL that renders the right page when I open it directly or refresh it, so that I can bookmark, share, or return to where I was.

## Acceptance criteria
- [ ] WHEN a visitor opens the home URL (`/`) directly or refreshes it, THE System SHALL render the home page.

## Plan
- Add React Router to the client dependencies; nothing else new.
- Configure the data router (`createBrowserRouter`) with a route table of one entry: the home page at `/`.
- Mount the router provider at the app root, leaving the query provider and style imports untouched.
- Rely on the existing dev server fallback for direct opens and refreshes; no deployment changes.
- Cover it with a client test that renders the app at `/`, plus an E2E check that a direct load of `/` shows the home page.

## Out of scope
- In-app navigation/links and any layout or nested routes.
- The 404 for unknown URLs (backlog story #2).
- Auth routes, redirects, and route guards.
- Router loaders/data fetching, lazy routes — TanStack Query + tRPC stay as they are.
- Verifying the production build / hosting SPA fallback (Vercel `rewrites`).

## Suggestions (your call)
- None — the data router is already decided, and the auth backlog's route-level gate fits it when it lands.
