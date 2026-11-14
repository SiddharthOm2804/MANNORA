# Manual City Management Guide

## How the panel works

The Command Center's **City problems** panel reads the authenticated world's resource inventory. When a simulation is active, production, consumption, net flow and stock come from its current `WorldState`. Before launch, the panel uses the persisted stock and the base per-tick resource rules. A depleted stock with negative net flow is shown as a shortage; negative net flow with remaining stock is supply pressure. District-level allocation and affected population are not tracked, so the panel does not claim those values.

Automatic simulation can continue changing stocks under the existing simulation rules. It does not automatically choose or construct a crisis solution. Manual management mode is the default; no automatic crisis policy is currently exposed.

## Supported confirmed actions

Choose a supported facility button, review the browser confirmation, and approve it. The API then checks world role, available treasury, minerals, map bounds, road clearance, city/building spacing and current simulation tick before writing anything.

| Resource | Facility | Cost | Minerals | Expected base output |
|---|---|---:|---:|---:|
| Food (`agriculture`) | Vertical Farm | ₹18,000 | 80 | 35 units per tick |
| Water | Water Treatment Facility | ₹22,000 | 100 | 40 units per tick |
| Electricity (`energy`) | Solar Power Facility | ₹28,000 | 120 | 50 units per tick |

Blueprint output is modified by the simulation's normal building health, level and event modifiers. A facility does not instantly refill storage; its production enters the resource system on subsequent simulation ticks. The server records the facility, debit and before/after history in one Mongo update, then applies the same building to the active simulation. If the check fails, no resource or treasury debit is made.

## History and APIs

- `GET /api/worlds/:id/problems` returns current tracked resource conditions.
- `POST /api/worlds/:id/actions/facility` applies a confirmed `{ "resource": "energy|water|agriculture" }` action.
- `GET /api/worlds/:id/actions` returns the latest 50 recorded city-management actions.
- Action events include the facility location and are published to that world's authenticated realtime stream.

All these routes require a signed-in account, a CSRF token for writes, and owner/editor access. The UI currently requires owner/editor role to show successful mutations; viewers may inspect problems/history only.

## Not yet supported

There are no confirmed user actions for buying/trading resources, moving stock between districts, repairing facilities, creating jobs/housing, changing taxes, assigning district quotas or creating a farm in a selected district. These need simulation and persistence rules before they can be offered. The simulation does not yet measure affected people at district granularity.

## Simulation controls

Play, pause, single-tick advance and speed selection call the world simulation APIs. The current history slider can jump to a day only when the active engine has time-machine history. Reset is visibly disabled until a durable initial snapshot reset operation exists.
