# Multi-User Security Audit

## Baseline findings

- There was no account model, login/register/logout, session storage, authentication middleware, or ownership field on `World`.
- World list/read/update/delete/create APIs were global and unauthenticated. Simulation lifecycle, snapshot/branch/experiment and event injection routes were also unprotected.
- SSE checked world existence but not identity. WebSocket allowed a caller-selected world ID and subscription with no account check.
- AI routes were unauthenticated. Citizen AI memory cache keys used only citizen IDs and could be reused by different callers.
- CORS, origin checks, Helmet, rate limiting and input sanitization existed in the prior Phase 18 work, but none of those controls provided account identity or world authorization.
- Experiment lookup/list/compare used a process-wide registry and was not associated with a world or user.

## Controls implemented

- Added `User` and `AuthSession` Mongo models. Passwords use Node's scrypt; browser sessions use random opaque tokens stored as SHA-256 hashes with seven-day expiry. Session cookies are HttpOnly, Secure in production and SameSite configurable. CSRF double-submit tokens are validated against the session hash for all authenticated mutations.
- Added registration, login, logout and session inspection routes, plus a responsive account gate for product routes. Account creation and login have tighter rate limits.
- Every new world records its creator as `ownerId`; list queries only return owned or explicitly shared worlds. World route parameter authorization queries ownership/share membership before all world-scoped APIs. Editors can write; viewers can read; only owners can delete or manage sharing. Unknown/legacy ownerless worlds fail closed.
- Added explicit owner share/revoke endpoints by account email and viewer/editor role. Revocation closes matching WebSocket sessions and terminates the affected user's SSE stream. Logout also revokes live world streams.
- All AI routes require an account; citizen AI cache keys are account-scoped. Causal analysis that includes a world ID requires access to that world.
- WebSocket upgrade checks session, origin and world access before acceptance, and validates the selected world again on subscribe. SSE requires the same world authorization.
- Global experiment listing/lookup/compare endpoints were removed from the router. Experiment IDs are scoped in the active process to both the world and user that created them; comparison rejects mixed/unowned IDs.
- Manual facility updates include the authenticated actor and recheck ownership/editor membership in the atomic database update.

## Isolation boundary and migration

- World access returns 404 for a world the caller cannot see, avoiding an ID-existence oracle. View-only writes return 403.
- World owner IDs are never accepted from the client on creation or update.
- Previously existing worlds have no trustworthy owner mapping. They remain inaccessible until an operator maps each world to the correct account. Do not assign every legacy world to the first registered user.
- There is no user-facing account recovery, password reset, or email verification flow in this repository. Those are deployment prerequisites for a public account service.
- Rate limiting is process-local and does not coordinate between replicas. Use a shared edge/Redis limiter for horizontally scaled production.
- Cookies can be set to `COOKIE_SAME_SITE=none` only for a separately hosted client/API pair that requires cross-site credentials; production cookies remain Secure. Add exact app origins to `CORS_ORIGINS`.

## Verification status

- Added world API tests for unauthenticated access, two-account isolation, viewer read-only access, sharing and revocation. Updated AI, SSE and WebSocket integration tests to use authenticated sessions.
- The full simulation, AI, and server suites pass: 101 simulation tests, 16 AI tests, and 41 server tests. Server integration tests used the configured local MongoDB and loopback listeners.
- Client production build passed. Vite reports the Three.js vendor chunk at approximately 944 kB, above its 900 kB advisory threshold; this does not fail the build.
