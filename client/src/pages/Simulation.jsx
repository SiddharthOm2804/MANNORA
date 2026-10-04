import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import TimelineControl from '../components/common/TimelineControl';

export default function Simulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(1420);
  const [speed, setSpeed] = useState(1);
  const [activeLayer, setActiveLayer] = useState('density'); // density | energy | wealth | influence
  const [selectedCell, setSelectedCell] = useState({
    x: 42,
    y: 18,
    sector: 'Commercial Core // Sector-03',
    zone: 'COMMERCIAL',
    population: 48,
    energy: '920 kWh',
    wealth: '124,000 NC',
    entropy: '0.12 λ',
    agents: ['agt_c049', 'agt_m012', 'agt_g003'],
  });

  const handleStep = () => {
    setTick((prev) => prev + 1);
  };

  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTick(0);
  };

  // Generate 12x12 sample spatial matrix cells
  const gridSize = 12;
  const gridCells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isSelected = selectedCell.x % gridSize === c && selectedCell.y % gridSize === r;
      const densityValue = ((r * 7 + c * 13) % 100) / 100;
      gridCells.push({ r, c, isSelected, densityValue });
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Telemetry & Spatial HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            <span>SPATIAL MATRIX VIEWPORT // SECTOR 07</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Civilization Spatial Simulator
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Coordinate matrix resolution, continuous telemetry layers, and localized agent positioning.
          </p>
        </div>

        {/* Viewport Layer Toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0d101a] border border-[#1a2233] text-xs font-mono">
          <span className="text-[10px] text-slate-400 px-2 uppercase">Layer:</span>
          {[
            { id: 'density', label: 'Density' },
            { id: 'energy', label: 'Energy' },
            { id: 'wealth', label: 'Wealth' },
            { id: 'influence', label: 'Influence' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeLayer === layer.id
                  ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Spatial Grid Viewport (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="lab-panel rounded-xl overflow-hidden relative shadow-2xl">
            {/* Viewport Top Bar */}
            <div className="px-4 py-2.5 bg-[#090b12] border-b border-[#1a2233] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>GRID: 100x100 [ZOOM: 1.0X]</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>LAYER: <span className="text-cyan-400 uppercase">{activeLayer}</span></span>
                <span>•</span>
                <span className="text-emerald-400">FPS: 60.0</span>
              </div>
            </div>

            {/* Interactive Matrix Surface */}
            <div className="p-6 bg-[#06080e] lab-grid-bg min-h-[440px] flex items-center justify-center relative overflow-hidden">
              {/* Coordinate Reticles / Crosshairs */}
              <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 pointer-events-none">
                [X: 000, Y: 000]
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-400 pointer-events-none">
                [X: 099, Y: 099]
              </div>

              {/* Simulation Matrix Cells (12x12 sample grid) */}
              <div className="grid grid-cols-12 gap-1.5 p-3 rounded-lg border border-slate-800/80 bg-[#090b14]/90 shadow-2xl max-w-lg w-full">
                {gridCells.map((cell, idx) => {
                  let cellBg = 'rgba(30, 41, 59, 0.4)';
                  if (activeLayer === 'density') {
                    cellBg = cell.densityValue > 0.7 
                      ? 'rgba(6, 182, 212, 0.45)' 
                      : cell.densityValue > 0.4 
                      ? 'rgba(14, 165, 233, 0.25)' 
                      : 'rgba(30, 41, 59, 0.3)';
                  } else if (activeLayer === 'energy') {
                    cellBg = cell.densityValue > 0.6 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(30, 41, 59, 0.3)';
                  } else if (activeLayer === 'wealth') {
                    cellBg = cell.densityValue > 0.5 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(30, 41, 59, 0.3)';
                  } else {
                    cellBg = cell.densityValue > 0.6 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(30, 41, 59, 0.3)';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setSelectedCell({
                          x: cell.c * 8 + 2,
                          y: cell.r * 8 + 2,
                          sector: `Sector Quadrant // Q-${cell.r}-${cell.c}`,
                          zone: cell.r % 2 === 0 ? 'RESIDENTIAL' : 'COMMERCIAL',
                          population: Math.floor(cell.densityValue * 80) + 10,
                          energy: `${Math.floor(cell.densityValue * 900) + 200} kWh`,
                          wealth: `${Math.floor(cell.densityValue * 150000)} NC`,
                          entropy: `${(cell.densityValue * 0.2).toFixed(2)} λ`,
                          agents: [`agt_${cell.r}${cell.c}_a`, `agt_${cell.r}${cell.c}_b`],
                        })
                      }
                      style={{ backgroundColor: cellBg }}
                      className={`aspect-square rounded-[3px] border cursor-pointer transition-all hover:scale-105 ${
                        cell.isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/30'
                          : 'border-slate-800/60 hover:border-slate-600'
                      }`}
                      title={`Cell [${cell.c}, ${cell.r}]`}
                    />
                  );
                })}
              </div>
            </div>

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
                epoch="EPOCH 01"
              />
            </div>
          </div>
        </div>

        {/* Spatial Cell Inspector Drawer (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Panel
            tag="INSPECT.CELL"
            title="Coordinate Telemetry Inspector"
            subtitle={`Target Coordinates [X: ${selectedCell.x}, Y: ${selectedCell.y}]`}
          >
            <div className="space-y-4 text-xs font-mono">
              {/* Sector Name */}
              <div className="p-3 rounded bg-[#080a11] border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Sector Designation</div>
                <div className="font-bold text-white text-sm truncate">
                  {selectedCell.sector}
                </div>
                <div className="text-[10px] text-cyan-400">ZONING: {selectedCell.zone}</div>
              </div>

              {/* Cell Micro-Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Resident Density:</span>
                  </span>
                  <span className="text-white font-bold font-mono-data">
                    {selectedCell.population} Citizens
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Energy Grid Load:</span>
                  </span>
                  <span className="text-white font-bold font-mono-data">
                    {selectedCell.energy}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Capital Velocity:</span>
                  </span>
                  <span className="text-white font-bold font-mono-data">
                    {selectedCell.wealth}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#080a11] border border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-violet-400" />
                    <span>Entropy Level:</span>
                  </span>
                  <span className="text-white font-bold font-mono-data">
                    {selectedCell.entropy}
                  </span>
                </div>
              </div>

              {/* Active Agent Entities in Cell */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Active Agents in Proximity ({selectedCell.agents.length})
                </div>
                <div className="space-y-1.5">
                  {selectedCell.agents.map((id) => (
                    <div
                      key={id}
                      className="p-2 rounded bg-[#080a11] border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-cyan-300 font-semibold">{id}</span>
                      <span className="text-slate-400">STATUS: NAVIGATING</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Subsystem Ticker */}
          <div className="lab-panel p-3.5 rounded-lg text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>Subsystem Hooks</span>
              <span className="text-emerald-400">SYNCED</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>SpatialEngine.step()</span>
                <span className="text-slate-400">0.82ms</span>
              </div>
              <div className="flex justify-between">
                <span>ResourceGrid.update()</span>
                <span className="text-slate-400">1.14ms</span>
              </div>
              <div className="flex justify-between">
                <span>EntropyDispersion.step()</span>
                <span className="text-slate-400">0.45ms</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
