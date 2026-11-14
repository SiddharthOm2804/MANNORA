import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Building2, ChevronDown, CircleDot, Clock3, Coins, Droplets, Layers3, Map, Maximize2, Pause, Play, Radio, RotateCcw, SkipForward, Sparkles, Users, Zap } from 'lucide-react';
import { CityScene } from '../components/three';
import { worldService } from '../services/worldService';
import { RealTimeSimulationSocket } from '../services/realTimeSimulationSocket';

const layerOptions = [
  { key: 'population', label: 'Population', color: '#82d6b1' },
  { key: 'economy', label: 'Economy', color: '#f4c77a' },
  { key: 'resources', label: 'Resources', color: '#74cce0' },
  { key: 'infrastructure', label: 'Infrastructure', color: '#a9a0ef' },
  { key: 'social', label: 'Social', color: '#e9a8bd' },
  { key: 'events', label: 'Events', color: '#f18f78' },
];

export default function Simulation() {
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [layers, setLayers] = useState(['population', 'economy', 'resources', 'infrastructure', 'social', 'events']);
  const [liveResources, setLiveResources] = useState(null);
  const [liveEconomy, setLiveEconomy] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveAgents, setLiveAgents] = useState([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [problems, setProblems] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [problemsError, setProblemsError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [cityEvents, setCityEvents] = useState([]);
  const [simulationError, setSimulationError] = useState('');
  const [simulationBusy, setSimulationBusy] = useState(false);

  const loadWorlds = () => {
    setIsLoading(true);
    setLoadError('');
    let mounted = true;
    worldService.getAllWorlds().then((res) => {
      if (!mounted) return;
      if (!res.success) {
        setLoadError(res.message || 'World data could not be loaded. Check the server connection and retry.');
        setIsLoading(false);
        return;
      }
      const data = res.success && Array.isArray(res.data) ? res.data : [];
      setWorlds(data);
      if (data.length) { setSelectedWorldId(data[0]._id); setTick(data[0].simulationSettings?.currentTick || 0); setSpeed(data[0].simulationSettings?.speed || 1); setIsRunning(data[0].simulationSettings?.status === 'running'); }
      setIsLoading(false);
    }).catch(() => { if (mounted) { setLoadError('The server could not be reached. Check your connection and retry.'); setIsLoading(false); } });
    return () => { mounted = false; };
  };

  useEffect(() => loadWorlds(), []);

  const activeWorld = worlds.find((world) => world._id === selectedWorldId) || worlds[0];
  useEffect(() => {
    if (!activeWorld) return;
    setTick(activeWorld.simulationSettings?.currentTick || 0);
    setSpeed(activeWorld.simulationSettings?.speed || 1);
    setIsRunning(activeWorld.simulationSettings?.status === 'running');
    setLiveResources(null); setLiveEconomy(null); setLiveMetrics(null); setLiveAgents([]); setCityEvents([]);
  }, [selectedWorldId]);
  useEffect(() => {
    if (!selectedWorldId) return undefined;
    const socket = new RealTimeSimulationSocket(selectedWorldId, {
      onConnected: () => setStreamConnected(true),
      onDisconnected: () => setStreamConnected(false),
      onEvent: (event) => setCityEvents((items) => [{ ...event, receivedAt: new Date().toLocaleTimeString() }, ...items].slice(0, 12)),
      onStatus: (status) => setIsRunning(status?.status === 'running'),
      onKeyframe: (state) => {
        setTick(state.tick);
        setLiveResources({ ...state.resources });
        setLiveEconomy({ ...state.economy });
        setLiveMetrics({ ...state.metrics });
        if (state.agents.size) setLiveAgents(Array.from(state.agents.values()));
      },
      onDelta: (delta, state) => {
        setTick(delta.tick);
        if (delta.changes?.resources) setLiveResources((old) => ({ ...old, ...delta.changes.resources }));
        if (delta.changes?.economy) setLiveEconomy((old) => ({ ...old, ...delta.changes.economy }));
        if (delta.changes?.metrics) setLiveMetrics((old) => ({ ...old, ...delta.changes.metrics }));
        if (delta.changes?.agents) setLiveAgents(Array.from(state.agents.values()));
      },
    });
    socket.connect();
    return () => socket.disconnect();
  }, [selectedWorldId]);

  const population = liveMetrics?.population ?? activeWorld?.population ?? 0;
  const economy = liveEconomy?.treasury ?? activeWorld?.economyConfiguration?.startingMoney ?? 0;
  const resourceData = liveResources || activeWorld?.resources || {};
  const energy = resourceData.energy?.current ?? resourceData.energy ?? 0;
  const water = resourceData.water?.current ?? resourceData.water ?? 0;
  const agents = liveAgents;
  const buildings = useMemo(() => {
    return activeWorld?.buildings || [];
  }, [activeWorld]);

  useEffect(() => {
    if (!selectedWorldId) { setProblems([]); return undefined; }
    let alive = true;
    const refresh = () => {
      worldService.getCityProblems(selectedWorldId).then((result) => { if (alive) { setProblems(result.data); setProblemsError(result.success ? '' : result.message); } });
      worldService.getCityActionHistory(selectedWorldId).then((result) => { if (alive && result.success) setActionHistory(result.data); });
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => { alive = false; clearInterval(interval); };
  }, [selectedWorldId]);

  const confirmFacility = async (problem) => {
    const labels = { agriculture: 'food', water: 'water', energy: 'electricity' };
    const facility = problem.supportedAction;
    if (!facility || !window.confirm(`Build ${facility.name} for ${labels[problem.resource]}?\nCost: ₹${facility.cost.toLocaleString()} and ${facility.minerals} minerals.\nExpected production: about +${facility.production} units per simulation tick.`)) return;
    setActionBusy(true); setActionMessage('');
    const result = await worldService.buildProductionFacility(selectedWorldId, problem.resource);
    setActionBusy(false);
    if (!result.success) {
      setActionMessage(result.message);
      const history = await worldService.getCityActionHistory(selectedWorldId);
      if (history.success) setActionHistory(history.data);
      return;
    }
    setActionMessage(`${result.message} Treasury now ₹${result.data.availableTreasury.toLocaleString()}.`);
    const refreshed = await worldService.getCityProblems(selectedWorldId);
    if (refreshed.success) setProblems(refreshed.data);
    const history = await worldService.getCityActionHistory(selectedWorldId);
    if (history.success) setActionHistory(history.data);
    const worldsResult = await worldService.getAllWorlds();
    if (worldsResult.success) setWorlds(worldsResult.data);
  };

  const toggleSimulation = async () => {
    setSimulationBusy(true); setSimulationError('');
    const result = isRunning ? await worldService.stopSimulation(activeWorld._id) : await worldService.launchSimulation(activeWorld._id, true);
    setSimulationBusy(false);
    if (!result.success) { setSimulationError(result.message); return; }
    setIsRunning(!isRunning);
  };
  const advanceSimulation = async () => {
    setSimulationBusy(true); setSimulationError('');
    let result;
    if (!activeWorld.simulationSettings?.status || activeWorld.simulationSettings.status === 'initialized' || activeWorld.simulationSettings.status === 'paused') {
      result = await worldService.launchSimulation(activeWorld._id, false);
      if (!result.success) { setSimulationBusy(false); setSimulationError(result.message); return; }
    }
    result = await worldService.stepSimulation(activeWorld._id);
    setSimulationBusy(false);
    if (!result.success) { setSimulationError(result.message); return; }
    setTick(result.data.tick);
    setLiveResources(result.data.worldState?.resources || null);
    setLiveEconomy(result.data.worldState?.economy || null);
    setLiveMetrics(result.data.worldState?.metrics || null);
  };
  const changeSpeed = async (value) => {
    setSpeed(value);
    const result = await worldService.setSimulationSpeed(activeWorld._id, value);
    if (!result.success) setSimulationError(result.message);
  };

  const toggleLayer = (key) => setLayers((current) => current.includes(key) ? current.filter((layer) => layer !== key) : [...current, key]);
  const day = Math.floor(tick / 24) + 1;
  const hour = tick % 24;
  const selectedTitle = selectedEntity?.data?.name || selectedEntity?.data?.title || selectedEntity?.data?.id;

  if (isLoading) return <div className="command-center command-state"><div className="command-state-mark"><Activity size={22} /></div><h1>Connecting to the city network</h1><p>Loading world state and simulation telemetry…</p><div className="command-state-progress"><i /></div></div>;
  if (loadError) return <div className="command-center command-state"><div className="command-state-mark error"><AlertTriangle size={22} /></div><h1>World data unavailable</h1><p>{loadError}</p><button onClick={() => loadWorlds()}>Retry connection</button></div>;
  if (!activeWorld) return <div className="command-center command-state"><div className="command-state-mark"><Map size={22} /></div><h1>No simulation worlds yet</h1><p>Create a world to open its command center and inspect its simulation.</p><button onClick={() => navigate('/create-world')}>Create a world</button></div>;

  return (
    <section className="command-center">
      <header className="command-header">
        <div className="command-title-block">
          <div className="command-eyebrow"><span className="eyebrow-pulse" /> MANNORA <span className="eyebrow-divider">/</span> COMMAND CENTER <span className="phase-chip">PHASE 18</span></div>
          <h1>{activeWorld?.name || 'Spiti Valley'} <span>World overview</span></h1>
        </div>
        <div className="command-header-actions">
          <label className="world-select-wrap"><Map size={15} /><select aria-label="Select city" value={selectedWorldId || ''} onChange={(event) => setSelectedWorldId(event.target.value)}>{worlds.map((world) => <option key={world._id} value={world._id}>{world.name}</option>)}</select><ChevronDown size={14} /></label>
          <div className="connection-chip"><span className={streamConnected ? 'connection-dot live' : 'connection-dot'} />{streamConnected ? 'LIVE SYNC' : 'SIMULATION READY'}</div>
          <button className="command-icon-button" title="Expand city view" onClick={() => document.querySelector('.city-viewport')?.requestFullscreen?.()}><Maximize2 size={16} /></button>
        </div>
      </header>

      <div className="overview-strip">
        <article className="overview-metric"><span className="metric-symbol mint"><Users size={16} /></span><div><small>POPULATION</small><strong>{Number(population).toLocaleString()}</strong><em className="metric-neutral">World record</em></div></article>
        <article className="overview-metric"><span className="metric-symbol gold"><Coins size={16} /></span><div><small>TREASURY</small><strong>₹{Number(economy).toLocaleString()}</strong><em className="metric-neutral">Current recorded balance</em></div></article>
        <article className="overview-metric"><span className="metric-symbol blue"><Zap size={16} /></span><div><small>ENERGY RESERVE</small><strong>{Number(energy).toLocaleString()} <span className="metric-unit">units</span></strong><em className="metric-neutral">Current stock</em></div></article>
        <article className="overview-metric"><span className="metric-symbol aqua"><Droplets size={16} /></span><div><small>WATER RESERVE</small><strong>{Number(water).toLocaleString()} <span className="metric-unit">units</span></strong><em className="metric-neutral">Current stock</em></div></article>
        <article className="overview-metric activity-metric"><span className="metric-symbol lilac"><Activity size={16} /></span><div><small>AGENT ACTIVITY</small><strong>{agents.length.toLocaleString()} <span className="metric-unit">loaded</span></strong><em className="metric-neutral">Live simulation agents</em></div></article>
      </div>

      <div className="command-grid">
        <main className="city-column">
          <div className="city-viewport">
            <div className="viewport-topline"><div className="viewport-location"><span className="location-icon"><Map size={14} /></span><span><b>WORLD MAP</b><small>{activeWorld?.geography?.biome || activeWorld?.geography?.terrain || 'World terrain'}</small></span></div><div className="viewport-clock"><Clock3 size={14} /><b>{String(hour).padStart(2, '0')}:00</b><span>DAY {String(day).padStart(3, '0')}</span></div><div className="viewport-live"><span className={`connection-dot ${streamConnected ? 'live' : ''}`} /> {streamConnected ? 'LIVE TELEMETRY' : 'STREAM DISCONNECTED'}</div></div>
            <div className="scene-wrap"><CityScene worldState={activeWorld} agents={agents} buildings={buildings} events={cityEvents} resources={resourceData} deficits={liveMetrics?.deficits || {}} clockHour={hour} selectedEntity={selectedEntity} onSelectEntity={setSelectedEntity} isLoading={isLoading} visibleLayers={layers} /></div>
            <div className="map-label map-label-north"><span>N</span><i /></div><div className="map-scale"><i /><span>WORLD GRID</span></div>
            <div className="viewport-footer"><div className="map-hint"><span className="hint-mouse">⌖</span> DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM <span>·</span> SELECT ANY ENTITY</div><div className="viewport-coords">{buildings.length} mapped entities</div></div>
          </div>

          <div className="timeline-panel">
            <div className="timeline-heading"><div><span className="timeline-label">SIMULATION TIMELINE</span><b>Day {day} <small>·</small> {String(hour).padStart(2, '0')}:00</b></div><div className="timeline-range">CYCLE 01 <span>—</span> CYCLE 30</div></div>
            <div className="timeline-track-wrap"><span className="timeline-date">DAY 01</span><div className="timeline-track"><div className="timeline-fill" style={{ width: `${Math.min((tick % 720) / 720 * 100, 100)}%` }} /><div className="timeline-thumb" style={{ left: `${Math.min((tick % 720) / 720 * 100, 100)}%` }} /><div className="timeline-ticks">{Array.from({ length: 13 }, (_, i) => <i key={i} />)}</div><input aria-label="Simulation timeline" type="range" min="0" max="720" value={tick % 720} onChange={(event) => setTick(Number(event.target.value))} onPointerUp={async (event) => { const result = await worldService.jumpToDay(activeWorld._id, Math.max(1, Math.floor(Number(event.currentTarget.value) / 24) + 1)); if (result.success) setTick(result.data.tick); else setSimulationError(result.message); }} /></div><span className="timeline-date">DAY 30</span></div>
            <div className="timeline-controls"><div className="playback-controls"><button className="transport-button" title="Reset unavailable without a saved initial snapshot" disabled><RotateCcw size={14} /></button><button className={`play-button ${isRunning ? 'is-playing' : ''}`} title={isRunning ? 'Pause simulation' : 'Start simulation'} disabled={simulationBusy} onClick={toggleSimulation}>{simulationBusy ? '…' : isRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}</button><button className="transport-button" title="Advance one tick" disabled={simulationBusy} onClick={advanceSimulation}><SkipForward size={15} /></button><span className="run-state"><i />{isRunning ? 'RUNNING' : 'PAUSED'}</span></div><div className="speed-control"><span>SPEED</span>{[0.5, 1, 2, 5, 10].map((value) => <button className={speed === value ? 'selected' : ''} key={value} onClick={() => changeSpeed(value)}>{value}×</button>)}</div><span className="tick-count">TICK <b>{tick.toLocaleString()}</b></span></div>
            {simulationError && <p className="management-error" role="alert">{simulationError}</p>}
          </div>
        </main>

        <aside className="intel-column">
          <section className="intel-card layers-card"><div className="section-heading"><div><span className="section-kicker">VISUALIZATION</span><h2>Intelligence layers</h2></div><Layers3 size={16} /></div><div className="layer-list">{layerOptions.map((layer, index) => <button key={layer.key} className={`layer-row ${layers.includes(layer.key) ? 'is-active' : ''}`} onClick={() => toggleLayer(layer.key)}><span className="layer-swatch" style={{ '--layer-color': layer.color }}><i /></span><span>{layer.label}</span><kbd>{String(index + 1)}</kbd><span className="layer-toggle"><i /></span></button>)}</div><div className="layer-footnote"><Sparkles size={13} /> Layer rendering optimized for performance</div></section>

          <section className="intel-card selection-card"><div className="section-heading"><div><span className="section-kicker">ENTITY INSPECTOR</span><h2>{selectedEntity ? 'Selected entity' : 'World overview'}</h2></div><CircleDot size={16} /></div>{selectedEntity ? <div className="entity-selection"><div className="entity-icon"><Building2 size={18} /></div><div className="entity-copy"><b>{selectedTitle || 'City entity'}</b><span>{selectedEntity.type?.replace('_', ' ').toUpperCase()}</span></div><button onClick={() => setSelectedEntity(null)}>Clear</button><div className="entity-detail"><span>LOCATION</span><b>{selectedEntity.data?.coordinates ? `${selectedEntity.data.coordinates.x}, ${selectedEntity.data.coordinates.y}` : selectedEntity.data?.location ? `${selectedEntity.data.location.x}, ${selectedEntity.data.location.y}` : selectedEntity.data?.payload?.location ? `${selectedEntity.data.payload.location.x}, ${selectedEntity.data.payload.location.y}` : 'Not provided'}</b></div><div className="entity-detail"><span>STATUS</span><b className="status-operational">{selectedEntity.data?.health ? `${selectedEntity.data.health}% condition` : 'Recorded'}</b></div></div> : <div className="glance-content"><div className="glance-stats"><div><span>City records</span><b>{activeWorld?.cities?.length || 0}</b></div><div><span>Buildings</span><b>{activeWorld?.buildings?.length || 0}</b></div><div><span>Active events</span><b>{cityEvents.length}</b></div></div></div>}</section>

          <section className="intel-card problems-card"><div className="section-heading"><div><span className="section-kicker">MANUAL MANAGEMENT</span><h2>City problems</h2></div><AlertTriangle size={16} /></div><p className="management-note">Problems use current simulation supply and demand. Actions apply only after your confirmation.</p>{problemsError && <div className="management-error">{problemsError}</div>}{actionMessage && <div className="management-result" role="status">{actionMessage}</div>}{problems.map((problem) => <article className="problem-row" key={problem.resource}><div><b>{problem.title}</b><small>Stock {Number(problem.available).toLocaleString()} · production {Number(problem.production).toFixed(1)} · demand {Number(problem.consumption).toFixed(1)} / tick</small><span className={`problem-state ${problem.severity}`}>{problem.active ? `${problem.severity} shortage` : problem.severity === 'pressure' ? 'Supply pressure' : 'Supply stable'}</span></div>{problem.supportedAction && (activeWorld?.permissions?.role === 'viewer' ? <span className="management-note">View only</span> : <button disabled={actionBusy || !activeWorld} onClick={() => confirmFacility(problem)}>{actionBusy ? 'Applying…' : `Build ${problem.supportedAction.name}`}</button>)}</article>)}{!problems.length && !problemsError && <p className="management-note">Loading current resource status…</p>}<div className="management-history"><b>Recent decisions</b>{actionHistory.slice(0, 5).map((entry) => <small className={entry.status === 'failed' ? 'history-failed' : ''} key={entry._id}>{entry.action === 'facility_built' ? `${entry.resource} facility built · ₹${Number(entry.cost).toLocaleString()}` : `${entry.action}: ${entry.errorMessage || 'action not applied'}`} · tick {entry.tick} · by {String(entry.actorId || '').slice(-6)}</small>)}{!actionHistory.length && <small>No management actions recorded.</small>}</div></section>

          <section className="intel-card events-card"><div className="section-heading"><div><span className="section-kicker">CITY FEED <span className={`feed-live-dot ${streamConnected ? 'is-connected' : ''}`} /></span><h2>City signals</h2></div></div><div className="event-list">{cityEvents.map((event, index) => <article className="event-row" key={`${event.type}-${event.tick}-${index}`}><span className="event-icon blue"><Activity size={14} /></span><div><small><b>{String(event.type || 'EVENT').replaceAll('_', ' ')}</b><span>{event.receivedAt}</span></small><p>{event.payload?.facility || event.payload?.message || 'Simulation event recorded.'}</p></div></article>)}</div>{!cityEvents.length && <p className="management-note">No live events received for this world yet.</p>}</section>
        </aside>
      </div>
      <footer className="command-footer"><span><Radio size={13} /> MANNORA CITY SIMULATION NETWORK</span><span>SIMULATION DAY {day} <i /> {streamConnected ? 'STREAM CONNECTED' : 'STREAM DISCONNECTED'} <i /> {activeWorld?.simulationSettings?.status || 'initialized'}</span></footer>
    </section>
  );
}
