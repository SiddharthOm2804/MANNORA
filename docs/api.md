# HTTP and Streaming API

Base URL in local development: `http://localhost:5000`. JSON routes use `Content-Type: application/json` and return JSON. The Vite development server proxies `/api` and `/ws` to this port. Production browser builds should set `VITE_API_URL` to the public API base, for example `https://api.example.org/api`.

## Health and service

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Service name and endpoint hints |
| `GET` | `/api/health` | Liveness and database status; degraded service remains HTTP 200 |
| `GET` | `/api/health?strict=true` | Returns 503 when MongoDB is unavailable |

## Accounts

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account; requires valid email, display name, and a 12–128 character password |
| `POST` | `/api/auth/login` | Start a browser session |
| `GET` | `/api/auth/me` | Return the current account |
| `POST` | `/api/auth/logout` | Revoke the session and close its live world streams |

Sessions use `mannora_session` (HttpOnly) and `mannora_csrf` cookies. Send the CSRF cookie value in `X-CSRF-Token` on all authenticated mutations. Use credentials for cross-origin requests and configure exact CORS origins. New worlds are private to their creator. World responses include `permissions.role` (`owner`, `editor`, or `viewer`).

## Worlds and simulation

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/worlds` | List owned/shared worlds, newest first, capped at 100 |
| `POST` | `/api/worlds` | Create a validated world |
| `GET` | `/api/worlds/:id` | Read a world by 24-character MongoDB ObjectId |
| `PATCH` | `/api/worlds/:id` | Update supported world fields |
| `DELETE` | `/api/worlds/:id` | Delete a world |
| `POST` | `/api/worlds/:id/launch` | Initialize in-memory simulation; optional `{ "autoStart": true }` |
| `POST` | `/api/worlds/:id/step` | Advance one tick |
| `POST` | `/api/worlds/:id/stop` | Stop the active simulation loop |
| `POST` | `/api/worlds/:id/checkpoint` | Save an explicit checkpoint to the world record |
| `POST` | `/api/worlds/:id/inject-event` | Inject event data into the active simulation |
| `GET` | `/api/worlds/:id/events` | SSE stream of world events (`/:id/stream` is an alias) |
| `POST` | `/api/worlds/:id/snapshots` | Capture an in-memory time-machine snapshot |
| `POST` | `/api/worlds/:id/snapshots/:snapshotId/restore` | Restore a snapshot |
| `POST` | `/api/worlds/:id/rewind` | Rewind using `{ "targetTick": number }` |
| `POST` | `/api/worlds/:id/jump-to-day` | Jump using `{ "day": number }` |
| `POST` | `/api/worlds/:id/branches` | Create an in-memory branch |
| `POST` | `/api/worlds/:id/compare` | Run a counterfactual comparison |
| `PATCH` | `/api/worlds/:id/speed` | Set simulation speed from 0.5× to 10× |
| `GET` | `/api/worlds/:id/problems` | Read current energy, water and agriculture conditions |
| `POST` | `/api/worlds/:id/actions/facility` | Confirm and build one supported facility (`energy`, `water`, `agriculture`) |
| `GET` | `/api/worlds/:id/actions` | Read the latest recorded city-management actions |
| `POST` | `/api/worlds/:id/shares` | Owner grants an account viewer/editor access using its email |
| `DELETE` | `/api/worlds/:id/shares/:userId` | Owner revokes an account's access and active streams |

## Experiments

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/worlds/:id/experiments` | Run an experiment for a world |
| `GET` | `/api/worlds/:id/experiments` | List experiments scoped to this world and user |
| `GET` | `/api/worlds/:id/experiments/:expId` | Read a scoped in-process experiment result |
| `POST` | `/api/worlds/:id/experiments/compare` | Compare IDs that all belong to this world and user |

## AI routes

All are `POST /api/ai/...`; request bodies and responses are JSON.

- `/citizen/:id/reflect` — reflection based on citizen/world context.
- `/citizen/:id/plan` — structured personal plan.
- `/citizen/:id/memory` — record a milestone with a description.
- `/government/evaluate` — policy and governance advice.
- `/analyst/diagnostics` — macro-level diagnostic report.
- `/world-prompt/parse` — validate a natural-language world prompt.
- `/causal-inquiry` — answer a question from supplied or active simulation history.

## Streaming transports

WebSocket endpoint: `/ws/simulation?worldId=<id>`. The HTTP upgrade requires a valid account cookie and access to the requested world; subsequent subscriptions are rechecked. A client can request a fresh baseline with `REQUEST_KEYFRAME`. Tick events use keyframes and sparse deltas. The gateway applies payload, message-rate, connection-count, origin, and slow-consumer limits. Revoked shares and logout close streams. SSE also requires an authenticated world session and is not a complete state synchronization protocol.

## Validation, limits, and errors

The server accepts JSON/form request bodies up to 1 MB, strips Mongo operator/path keys from parsed input, applies API rate limits (180 requests per minute per process/IP; AI route requests additionally have a 30 per minute limit; login/register use a tighter per-IP limit), and validates world IDs and selected world fields. Responses may include `401` for missing/expired account sessions, `403` for CSRF/role failures, `429` with `Retry-After`, `400` for invalid input, `404` for missing or inaccessible worlds, `413` for large bodies, and `500` for unexpected failures. Production 500 responses do not expose stack traces or internal messages.

## Security status

CORS uses configured origin allowlists and Helmet supplies security headers. Account auth and CSRF checks protect world and AI APIs. World ownership and sharing are enforced on every world route; unknown ownerless legacy worlds remain inaccessible. Password reset/email verification are not implemented. The in-process limiter, simulations and experiment registry are not shared between replicas. See [the security audit](MULTI_USER_SECURITY_AUDIT.md) and [Architecture security controls](architecture.md#security-controls).
