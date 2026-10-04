import React from 'react';
import { 
  Cpu, 
  Search, 
  Activity, 
  Database, 
  RefreshCw, 
  Sliders, 
  Terminal, 
  Globe 
} from 'lucide-react';
import StatusIndicator from '../common/StatusIndicator';

/**
 * Navbar - Top laboratory telemetry and control header.
 */
export default function Navbar({
  worldName = 'SECTOR-07 // NEO-ALEXANDRIA',
  tick = 1420,
  epoch = 'EPOCH 01',
  healthData,
  onOpenCommandBar,
  onRefreshHealth,
  isHealthLoading,
}) {
  const isDbConnected = healthData?.database?.isConnected === true;
  const isServerRunning = healthData?.server?.status === 'running';

  return (
    <header className="h-14 border-b border-[#1a2233] bg-[#090b12]/95 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between gap-4">
      {/* Left: Active Simulation Designation & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0e121d] border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-white tracking-wider truncate">
            {worldName}
          </span>
          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
            SIM-01
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="text-slate-600">/</span>
          <span className="text-[11px] text-slate-300">{epoch}</span>
          <span className="text-slate-600">/</span>
          <span className="text-[11px] font-semibold text-cyan-400 font-mono-data">
            TICK #{tick.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Trigger Button */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={onOpenCommandBar}
          className="w-full px-3 py-1.5 rounded-lg bg-[#0e121d] border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-xs font-mono flex items-center justify-between transition-colors shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search console commands, telemetry, agents...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-400 border border-slate-700/80">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry & Server Status Vitals */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Backend & DB Health Indicator */}
        <div className="flex items-center gap-2">
          <StatusIndicator
            status={isDbConnected ? 'operational' : isServerRunning ? 'degraded' : 'error'}
            label={isDbConnected ? 'DB SYNC' : isServerRunning ? 'DB OFFLINE' : 'OFFLINE'}
            size="sm"
          />

          <button
            onClick={onRefreshHealth}
            disabled={isHealthLoading}
            title="Refresh System Health Telemetry"
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Mobile Command Bar Trigger */}
        <button
          onClick={onOpenCommandBar}
          className="p-1.5 rounded text-slate-400 hover:text-white md:hidden"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
