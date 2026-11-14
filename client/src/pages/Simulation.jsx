import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Layers, 
  Eye, 
  Maximize2, 
  Sliders, 
  Compass, 
  Cpu, 
  Crosshair, 
  Zap, 
  Users, 
  Coins, 
  ShieldAlert,
  ChevronRight,
  Info,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  Box
} from 'lucide-react';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import TimelineControl from '../components/common/TimelineControl';
import EventInjectionUI from '../components/common/EventInjectionUI';
import { CityScene } from '../components/three';
import { worldService } from '../services/worldService';
import { RealTimeSimulationSocket } from '../services/realTimeSimulationSocket';

export default function Simulation() {
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(1420);
  const [clockHour, setClockHour] = useState(14); // 0-23 diurnal cycle
  const [speed, setSpeed] = useState(1);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'matrix'
  const [activeLayer, setActiveLayer] = useState('density');
  const [isLoading, setIsLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [activeEvents, setActiveEvents] = useState([]);
  const [isInjectingEvent, setIsInjectingEvent] = useState(false);

  // Selected Entity state: { type: 'district' | 'building' | 'citizen', data: Object }
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Load world data from backend
  const loadWorlds = async () => {
    setIsLoading(true);
    const res = await worldService.getAllWorlds();
    if (res.success && res.data && res.data.length > 0) {
      setWorlds(res.data);
      if (!selectedWorldId) {
        setSelectedWorldId(res.data[0]._id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorlds();
  }, []);

  const activeWorld = worlds.find((w) => w._id === selectedWorldId) || worlds[0];

  // Default synthetic buildings & citizens from active world or generator
  const buildings = activeWorld?.cities?.map((city, idx) => ({
    id: `bld_city_${idx + 1}`,
    name: city.name,
    type: city.isCapital ? 'commercial' : (idx % 2 === 0 ? 'industrial' : 'residential'),
    level: city.isCapital ? 3 : 2,
    health: 95,
    efficiency: 1.0,
    capacity: 60,
    workers: Math.round(city.population / 25),
    coordinates: city.coordinates || { x: 30 + idx * 20, y: 30 + (idx % 2) * 30 },
  })) || [
    { id: 'bld_core_1', name: 'Kaza Community Centre', type: 'commercial', level: 3, coordinates: { x: 50, y: 50 }, workers: 45, capacity: 60 },
    { id: 'bld_ind_2', name: 'Kaza Workshop', type: 'industrial', level: 2, coordinates: { x: 80, y: 50 }, workers: 50, capacity: 70 },
    { id: 'bld_res_3', name: 'Tabo Homes', type: 'residential', level: 2, coordinates: { x: 50, y: 20 }, workers: 0, capacity: 120 },
    { id: 'bld_res_4', name: 'Dhankar Farm', type: 'research_lab', level: 2, coordinates: { x: 50, y: 80 }, workers: 30, capacity: 40 },
  ];

  // Instanced citizens for performant rendering
  const agents = [
    { id: 'agt_01', name: 'Dr. Asha Sharma', occupation: 'scientist', location: { x: 48, y: 52 }, wealth: 340, healthState: { currentAction: 'Reading weather reports', happiness: 94 } },
    { id: 'agt_02', name: 'Arjun Mehta', occupation: 'merchant', location: { x: 52, y: 48 }, wealth: 850, healthState: { currentAction: 'Selling goods', happiness: 88 } },
    { id: 'agt_03', name: 'Priya Nair', occupation: 'administrator', location: { x: 50, y: 50 }, wealth: 490, healthState: { currentAction: 'Reviewing city rules', happiness: 85 } },
    { id: 'agt_04', name: 'Rahul Thakur', occupation: 'engineer', location: { x: 78, y: 48 }, wealth: 260, healthState: { currentAction: 'Fixing equipment', happiness: 80 } },
    { id: 'agt_05', name: 'Kavita Singh', occupation: 'technician', location: { x: 82, y: 52 }, wealth: 210, healthState: { currentAction: 'Repairing tools', happiness: 82 } },
    { id: 'agt_06', name: 'Deepak Negi', occupation: 'farmer', location: { x: 48, y: 78 }, wealth: 190, healthState: { currentAction: 'Working in the fields', happiness: 86 } },
    { id: 'agt_07', name: 'Pooja Rao', occupation: 'citizen', location: { x: 52, y: 22 }, wealth: 140, healthState: { currentAction: 'Resting at home', happiness: 90 } },
    { id: 'agt_08', name: 'Aman Kapoor', occupation: 'entrepreneur', location: { x: 54, y: 54 }, wealth: 620, healthState: { currentAction: 'Running a shop', happiness: 92 } },
  ];

  const handleStep = async () => {
    setTick((prev) => prev + 1);
    setClockHour((prev) => (prev + 1) % 24);

    if (activeWorld?._id) {
      await worldService.stepSimulation(activeWorld._id);
    }
  };

  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTick(0);
    setClockHour(8);
  };

  const handleInjectEvent = async (eventData) => {
    setIsInjectingEvent(true);
    try {
      if (activeWorld?._id) {
        const res = await worldService.injectEvent(activeWorld._id, eventData);
        if (res.success && res.data) {
          setActiveEvents(res.data.activeEvents || [res.data.event]);
          // Refresh world state
          const updatedWorld = await worldService.getWorldById(activeWorld._id);
          if (updatedWorld.success && updatedWorld.data) {
            setWorlds((prev) =>
              prev.map((w) => (w._id === activeWorld._id ? updatedWorld.data : w))
            );
          }
        }
        return res;
      } else {
        // Local simulation fallback
        const mockEvt = {
          id: `evt_local_${Date.now()}`,
          ...eventData,
          remainingTicks: eventData.duration || 10,
          startedAtTick: tick,
          status: 'ACTIVE',
        };
        setActiveEvents((prev) => [mockEvt, ...prev]);
        return { success: true, data: { event: mockEvt } };
      }
    } finally {
      setIsInjectingEvent(false);
    }
  };

  // Phase 16: Real-time WebSocket connection with delta decompression
  const [streamConnected, setStreamConnected] = useState(false);
  const [liveResources, setLiveResources] = useState(null);
  const [liveEconomy, setLiveEconomy] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveAgents, setLiveAgents] = useState([]);

  useEffect(() => {
    if (!selectedWorldId) return;

    const socket = new RealTimeSimulationSocket(selectedWorldId, {
      onConnected: () => {
        setStreamConnected(true);
      },
      onDisconnected: () => {
        setStreamConnected(false);
      },
      onKeyframe: (cachedState) => {
        setTick(cachedState.tick);
        setClockHour(cachedState.tick % 24);
        setLiveResources({ ...cachedState.resources });
        setLiveEconomy({ ...cachedState.economy });
        setLiveMetrics({ ...cachedState.metrics });
        if (cachedState.agents.size > 0) {
          setLiveAgents(Array.from(cachedState.agents.values()));
        }
      },
      onDelta: (delta, cachedState) => {
        setTick(delta.tick);
        setClockHour(delta.tick % 24);
        if (delta.changes?.resources) {
          setLiveResources((prev) => ({ ...prev, ...delta.changes.resources }));
        }
        if (delta.changes?.economy) {
          setLiveEconomy((prev) => ({ ...prev, ...delta.changes.economy }));
        }
        if (delta.changes?.metrics) {
          setLiveMetrics((prev) => ({ ...prev, ...delta.changes.metrics }));
        }
        if (delta.changes?.agents) {
          setLiveAgents(Array.from(cachedState.agents.values()));
        }
      },
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [selectedWorldId]);

  // Automated clock advancement when playing locally if backend is paused
  useEffect(() => {
    if (!isRunning || streamConnected) return;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      setClockHour((prev) => (prev + 1) % 24);
    }, 1000 / Math.max(1, speed));
    return () => clearInterval(interval);
  }, [isRunning, speed, streamConnected]);

  return (
    <div className="space-y-5">
      {/* Top Telemetry & Spatial HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            <span>CITY VIEW</span>
            {activeWorld && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 uppercase font-mono">{activeWorld.name}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            3D Virtual City View
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            See people, buildings, and day and night in the city.
          </p>
        </div>

        {/* View Controls & World Switcher & Event Injector Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900/90 hover:to-amber-900/90 text-amber-300 border border-amber-600/50 hover:border-amber-500 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Trigger Emergency Event</span>
          </button>

          {worlds.length > 1 && (
            <select
              value={selectedWorldId || ''}
              onChange={(e) => setSelectedWorldId(e.target.value)}
              className="bg-[#0e121d] border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {worlds.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {/* Perspective Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0d101a] border border-[#1a2233] text-xs font-mono">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3 h-3 text-cyan-400" />
              <span>3D View</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>2D Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Spatial 3D Viewport (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="lab-panel rounded-xl overflow-hidden relative shadow-2xl">
            {/* Viewport Top Bar */}
            <div className="px-4 py-2 bg-[#090b12] border-b border-[#1a2233] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{String(clockHour).padStart(2, '0')}:00 {clockHour >= 12 ? 'PM' : 'AM'}</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 text-[11px]">
                  DAY TIME: {clockHour >= 21 || clockHour < 5 ? 'NIGHT' : clockHour < 8 ? 'EARLY MORNING' : clockHour >= 18 ? 'EVENING' : 'AFTERNOON'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span className={`font-semibold uppercase tracking-wider flex items-center gap-1.5 ${streamConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${streamConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {streamConnected ? 'WEBSOCKET DELTAS LIVE' : 'DISCONNECTED / OFFLINE'}
                </span>
                <span>•</span>
                <span className="text-cyan-400 uppercase tracking-widest font-semibold">3D PEOPLE</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono-data">60.0 FPS</span>
              </div>
            </div>

            {/* 3D Canvas Scene or Matrix Mode */}
            {viewMode === '3d' ? (
              <div className="h-[480px] w-full relative">
                <CityScene
                  worldState={activeWorld}
                  agents={liveAgents.length > 0 ? liveAgents : agents}
                  buildings={buildings}
                  resources={liveResources || activeWorld?.resources || {}}
                  clockHour={clockHour}
                  selectedEntity={selectedEntity}
                  onSelectEntity={setSelectedEntity}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="p-8 bg-[#06080e] lab-grid-bg min-h-[480px] flex items-center justify-center relative">
                <div className="text-center font-mono space-y-2">
                  <div className="text-sm font-semibold text-white">2D City Map</div>
                  <div className="text-xs text-slate-400">Switch to the 3D city view.</div>
                  <button
                    onClick={() => setViewMode('3d')}
                    className="mt-2 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono transition-colors"
                  >
                    Return to 3D City
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Floating Timeline Control Bar */}
            <div className="p-3 bg-[#090b12] border-t border-[#1a2233]">
              <TimelineControl
                isRunning={isRunning}
                onTogglePlay={handleTogglePlay}
                onStep={handleStep}
                onReset={handleReset}
                tick={tick}
                maxTick={5000}
                speed={speed}
                onSpeedChange={(s) => setSpeed(s)}
                epoch={`HOUR ${String(clockHour).padStart(2, '0')}:00`}
              />
            </div>
          </div>
        </div>

        {/* Spatial Hierarchical Inspector Drawer (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Panel
            tag="DETAILS"
            title="City Details"
            subtitle="Select an area, building, or person to see more."
            actions={
              selectedEntity && (
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                >
                  Clear Selection
                </button>
              )
            }
          >
            {selectedEntity ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Active Entity Card */}
                <div className="p-3.5 rounded-lg bg-[#080a11] border border-cyan-800/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 uppercase">Selected</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-semibold">
                      {selectedEntity.type}
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm">
                    {selectedEntity.data.name || selectedEntity.data.title || selectedEntity.data.id}
                  </div>
                  {selectedEntity.data.description && (
                    <p className="text-[11px] text-slate-300 font-sans leading-tight">
                      {selectedEntity.data.description}
                    </p>
                  )}
                </div>

                {/* Specific Attribute Telemetry */}
                {selectedEntity.type === 'citizen' && (
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Job:</span>
                      <span className="text-cyan-300 font-semibold uppercase">{selectedEntity.data.occupation}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Current activity:</span>
                      <span className="text-white font-mono-data">{selectedEntity.data.healthState?.currentAction || 'ACTIVE'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Savings:</span>
                      <span className="text-emerald-400 font-mono-data">{selectedEntity.data.wealth} ₹</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-300 font-mono-data">[{selectedEntity.data.location?.x}, {selectedEntity.data.location?.y}]</span>
                    </div>
                  </div>
                )}

                {selectedEntity.type === 'building' && (
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Building:</span>
                      <span className="text-cyan-300 font-semibold uppercase">{selectedEntity.data.type}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Building size:</span>
                      <span className="text-white font-mono-data">Level {selectedEntity.data.level || 1}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Workers:</span>
                      <span className="text-emerald-400 font-mono-data">{selectedEntity.data.workers} / {selectedEntity.data.capacity} People</span>
                    </div>
                  </div>
                )}

                {selectedEntity.type === 'district' && (
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Area:</span>
                      <span className="text-cyan-300 font-semibold uppercase">{selectedEntity.data.type}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                      <span className="text-slate-400">Area size:</span>
                      <span className="text-white font-mono-data">{selectedEntity.data.bounds?.width}x{selectedEntity.data.bounds?.depth} Units</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 font-mono text-xs">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="text-white font-semibold">Nothing selected</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Click on any <strong>District Area</strong>, <strong>Building</strong>, or <strong>Person</strong> in the 3D view to inspect their live details.
                </p>
              </div>
            )}
          </Panel>

          {/* Active Events & Crises HUD Card */}
          <Panel
            tag="EVENTS"
            title="City Events"
            subtitle={`${activeEvents.length > 0 ? `${activeEvents.length} events currently affecting the city` : 'City is running normally without emergencies'}`}
            actions={
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
              >
                <span>+ Trigger Event</span>
              </button>
            }
          >
            {activeEvents.length > 0 ? (
              <div className="space-y-2.5 text-xs font-mono">
                {activeEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-red-950/20 border border-red-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        {evt.title || evt.type}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800">
                        {evt.remainingTicks ?? evt.duration} steps left
                      </span>
                    </div>
                    {evt.cause && (
                      <p className="text-[11px] text-slate-400 font-sans leading-tight">
                        <strong className="text-slate-300">Reason:</strong> {evt.cause}
                      </p>
                    )}
                    <div className="text-[10px] text-cyan-400 flex items-center justify-between pt-1 border-t border-red-900/30">
                      <span>How it fixes: {evt.recoveryBehavior || 'GRADUAL_RESTORATION'}</span>
                      <span className="text-slate-500 font-mono-data">Impact: {evt.severity || 3}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#070912] border border-slate-800/60 text-center space-y-1 text-xs font-mono">
                <div className="text-emerald-400 font-semibold">The city is calm</div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Click <strong>Trigger Emergency Event</strong> to create a water shortage, power failure, market crash, or sickness outbreak and see how the city reacts.
                </p>
              </div>
            )}
          </Panel>

          {/* Quick Camera Views */}
          <Panel
            tag="CAMERA"
            title="Quick Camera Views"
            subtitle="Quickly move camera around the 3D city"
          >
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left flex items-center justify-between"
              >
                <span>Show the whole city</span>
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => setSelectedEntity({ type: 'district', data: { name: 'City centre', bounds: { x: 50, z: 50 } } })}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left flex items-center justify-between"
              >
                <span>City centre</span>
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
              </button>
              <button
                onClick={() => setSelectedEntity({ type: 'citizen', data: agents[0] })}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left flex items-center justify-between"
              >
                <span>Follow a person</span>
                <Users className="w-3.5 h-3.5 text-violet-400" />
              </button>
              <button
                onClick={() => setSelectedEntity({ type: 'building', data: buildings[0] })}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left flex items-center justify-between"
              >
                <span>Main workshop</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </Panel>
        </div>

      </div>

      {/* Phase 11 Event Injection UI Modal */}
      <EventInjectionUI
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onInjectEvent={handleInjectEvent}
        isInjecting={isInjectingEvent}
        activeEvents={activeEvents}
      />
    </div>
  );
}
