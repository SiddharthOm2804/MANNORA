# World Map and City Management Audit

## Audit scope

Reviewed the React Three Fiber scene, world and city models, simulation adapter and resource/building systems, map controls, management endpoints, event publisher, HTTP and WebSocket paths, and existing tests before implementation.

## Baseline findings

- The client uses React Three Fiber, Drei and Three.js. `CityScene`, `Buildings`, `Roads`, `CityEnvironment`, `Citizens`, resource markers and camera components render an interactive scene.
- The scene received up to 32 fabricated building objects from `Simulation.jsx`; district, road, tree, solar and turbine positions were hardcoded. Several dashboard numbers, citizens, alerts and events were also demonstration values.
- `World` persisted world-level population, resources, economy, government, simulation settings and city subdocuments. `WorldStateAdapter` converted cities into simulation entities, but did not load buildings/resources/economy into the engine. The engine consequently started with defaults rather than complete world data.
- `SimulationBridgeService` owns active in-memory simulations and their snapshots, branches, experiments, event injection and checkpoints. The resource system detects depleted resources but there was no user-confirmed management action/history route.
- Existing building blueprints support power plants, water filters and farms. Checkpoints persisted summary values, but not building condition/layout.
- SSE and WebSocket publisher channels filtered by world ID, but before this work the ID was supplied by the caller and had no identity check.

## Changes made

- Removed demonstration agents, events, alerts, statistics, unrecorded event markers and artificial building infill from the Command Center. Empty and disconnected states now say what data is absent.
- The map renders saved city records and saved buildings. City districts derive their centre and display size from stored city coordinates/population. Resource source markers appear only for saved buildings that actually produce a resource.
- Added placement-time lot selection for supported facilities. Candidate locations are bounded to the map, avoid the current road corridors, existing facilities, city centres and generated tree positions. The check runs only when a user confirms a facility build.
- Added persistent building hydration to `WorldStateAdapter` and building persistence to checkpoints, so the engine and map use the same facility records.
- Connected play, pause, step and speed controls to the simulation API. Timeline position uses simulation ticks rather than a synthetic timer.
- Added a world problems view for energy, water and agriculture. Supply, demand, stock and deficits use the resource engine state when it is active; otherwise the panel reports the persisted stock and the resource system's base demand/production. Affected population is left unknown because the engine does not track per-district allocation.
- Added confirmed construction actions for power plants, water treatment facilities and vertical farms. The server checks role, funds, minerals, placement and concurrency; writes a facility and actor-stamped before/after history entry atomically; then adds the facility to the active in-memory state. Actions are never automatically chosen.
- Added city action history and location-bearing action events. Event markers only render from received events that include an actual stored location.
- Removed hardcoded geographic coordinates and health/operational claims from the world viewport.

## Known limitations

- Existing world data has no exact buildings, roads, parks, citizen locations, resource locations or district allocations. The visualization cannot reconstruct these facts. Roads remain a representative street template; vegetation is ambient scenery. Only saved cities and saved facilities are treated as authoritative entities.
- Legacy custom cities whose coordinates overlap can still have overlapping district footprints; newly created world coordinates are normalized to valid bounded locations.
- The simulation does not calculate a number of affected residents by district, budget allocation between districts, food purchasing/trading, facility repair, employment/housing actions or a durable AI-generated crisis diagnosis. These are not presented as implemented.
- A resource shortage is shown when the actual available stock is depleted and net production is negative. Other resource imbalance is called supply pressure. The system does not fabricate a shortage event.
- The facility lot checker uses the current fixed road template. A future persisted road/parcel model should replace this template before arbitrary user-defined map layouts are supported.
- Recovered active simulation state still depends on MongoDB checkpoints; full tick-by-tick engine recovery and distributed simulation ownership are outside this pass.

## Files modified for this work

See the final Git change list. Main areas: `client/src/pages/Simulation.jsx`, `client/src/components/three/CityScene.jsx`, `CityEnvironment.jsx`, `ResourceNodes.jsx`, world API services, `server/src/services/cityManagementService.js`, `WorldStateAdapter.js`, `SimulationBridgeService.js`, the `World` schema, and simulation speed routes.

## Verification

- Production client build: passed (Three.js vendor chunk remains above Vite's 900 kB warning threshold).
- Placement unit coverage: added for clear-lot selection and full occupancy.
- Full simulation, AI, and server test suites passed: 101 simulation tests, 16 AI tests, and 41 server tests. Server integration coverage ran with the configured local MongoDB and loopback listeners.
- Production client build passed. Vite still warns that the Three.js vendor chunk is approximately 944 kB, above its 900 kB advisory threshold.
