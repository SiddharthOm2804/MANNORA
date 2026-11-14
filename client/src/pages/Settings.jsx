import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  Eye, 
  Sliders, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Activity,
  Terminal
} from 'lucide-react';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';

export default function Settings() {
  const [tickRate, setTickRate] = useState(10);
  const [maxHistory, setMaxHistory] = useState(100);
  const [prngAlgorithm, setPrngAlgorithm] = useState('mulberry32');
  const [telemetryInterval, setTelemetryInterval] = useState(1);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:5005');
  const [mongoUri, setMongoUri] = useState('mongodb://localhost:27017/neural_city');
  const [renderQuality, setRenderQuality] = useState('high');
  const [gridOpacity, setGridOpacity] = useState(0.4);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>CITY SETTINGS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            City Settings
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Choose how fast the city changes and how often to save it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SAVED SUCCESSFULLY</span>
            </span>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Settings Deck (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Simulation Engine Settings */}
          <Panel
            tag="ENGINE.SPEED"
            title="1. City Speed and Starting Number"
            subtitle="Set how fast the city changes and choose a starting number"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300">CITY STEPS PER SECOND</label>
                <select
                  value={tickRate}
                  onChange={(e) => setTickRate(Number(e.target.value))}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value={10}>10 steps per second (normal)</option>
                  <option value={20}>20 steps per second (fast)</option>
                  <option value={60}>60 steps per second (fastest)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300">REPEATABLE RESULTS</label>
                <select
                  value={prngAlgorithm}
                  onChange={(e) => setPrngAlgorithm(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="mulberry32">Repeat the same results (Method 1)</option>
                  <option value="splitmix64">Repeat the same results (Method 2)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 flex justify-between">
                  <span>SAVED CITY DAYS</span>
                  <span className="text-cyan-400 font-mono-data">{maxHistory} saved days</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={maxHistory}
                  onChange={(e) => setMaxHistory(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300">AUTO-SAVE FREQUENCY</label>
                <select
                  value={telemetryInterval}
                  onChange={(e) => setTelemetryInterval(Number(e.target.value))}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value={1}>Every 1 Day (Detailed)</option>
                  <option value={5}>Every 5 Days (Recommended)</option>
                  <option value={10}>Every 10 Days (Lightweight)</option>
                </select>
              </div>
            </div>
          </Panel>

          {/* Section 2: Backend Persistence & Network */}
          <Panel
            tag="DATABASE.SETTINGS"
            title="2. Server and Database"
            subtitle="Server and database addresses"
          >
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300">SERVER ADDRESS</label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300">DATABASE ADDRESS</label>
                <input
                  type="text"
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Your server sets this address.
                </span>
              </div>
            </div>
          </Panel>

          {/* Section 3: Viewport & Client Rendering */}
          <Panel
            tag="GRAPHICS.SETTINGS"
            title="3. City Display"
            subtitle="Change how the 3D city looks"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300">GRAPHICS QUALITY</label>
                <select
                  value={renderQuality}
                  onChange={(e) => setRenderQuality(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="high">High Quality (Sharp Details)</option>
                  <option value="balanced">Balanced (Normal Quality)</option>
                  <option value="eco">Battery Saver (Fast Performance)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 flex justify-between">
                  <span>MAP GRID DARKNESS</span>
                  <span className="text-cyan-400 font-mono-data">{(gridOpacity * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </Panel>

        </div>

        {/* Diagnostic Metadata Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Panel
            tag="SYSTEM.STATUS"
            title="About this project"
            subtitle="Tools used to build MANNORA"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Project Version:</span>
                  <span className="text-cyan-400">v0.2.0-alpha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Node.js Runtime:</span>
                  <span className="text-white">v20.18.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frontend:</span>
                  <span className="text-white">React 18 + Vite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">3D Graphics:</span>
                  <span className="text-white">Three.js / React Three Fiber</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-white">MongoDB + Mongoose</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300">
                The same starting number gives the same city results each time.
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
