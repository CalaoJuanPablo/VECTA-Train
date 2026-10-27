# 02 — Not-found page

## Story
As a visitor, I want an unknown URL to show a not-found (404) page, so that I know the page doesn't exist instead of seeing a broken screen.

## Acceptance criteria
- [ ] WHEN a visitor opens a URL that matches no route, THE System SHALL render a not-found page stating that the page doesn't exist.
- [ ] IF a visitor refreshes a URL that matches no route THEN THE System SHALL render the not-found page again, with the requested URL unchanged in the address bar.
- [ ] WHEN a visitor opens or refreshes a URL that matches a route, THE System SHALL render that page and not the not-found page.

## Plan
- Add one catch-all entry to the existing route table; it renders only when no declared route matches, so future routes never need to know it exists.
- Add a not-found page styled with the existing design-system tokens: a heading plus one generic sentence, no links.
- Leave the address bar alone — no redirect, no history rewrite — so refresh, back, and shared links behave the same.
- Keep the app root and route table ownership as they are; nothing else in the client changes.
- Test it at two levels: a client test for an unknown path plus a regression test that a known path is unaffected, and an E2E check that loading an unknown URL directly shows the not-found page.

## Out of scope
- A real HTTP 404 status or hosting-level rewrites — the static SPA keeps answering with the app shell, which then renders the page.
- Any link, button, or automatic return to the home page (in-app navigation remains undecided).
- Echoing or logging the requested URL; the message is generic.
- Different 404s depending on auth state, role, or route section; route guards.
- A shared layout, header, or footer.
- Reworking the home page or its test.

## Suggestions (your call)
- Both pages now hand-roll their own wrapper markup with no shared page shell. That is thin evidence, so I'd wait: if a third page lands, extract a page shell then, not now.
