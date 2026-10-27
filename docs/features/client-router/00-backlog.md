# Client Router — Backlog

## Context
Client-side routing capability for VECTA Train: pages get real URL paths and unknown URLs get a 404. Routes, navigation behavior, and guards are left to each future feature (starting with auth).
Stack: existing — Vite/React SPA (no router today) + Fastify/tRPC server on Vercel; React Router added as a client dependency.
Expensive decisions: none

## Backlog
1. As a visitor, I want each page to have its own URL that renders the right page when I open it directly or refresh it, so that I can bookmark, share, or return to where I was.
2. As a visitor, I want an unknown URL to show a not-found (404) page, so that I know the page doesn't exist instead of seeing a broken screen. Requires: #1

## Notes
- Deliberately excluded: in-app navigation behavior, auth routes, and route guards — each future feature decides those on top of this capability.
