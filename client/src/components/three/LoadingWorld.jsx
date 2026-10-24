import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';

/**
 * LoadingWorld displays a high-fidelity cybernetic 3D loading overlay
 * during simulation world asset compilation and database synchronization.
 */
export function LoadingWorld({ message = 'INITIALIZING 3D SPATIAL MATRIX...' }) {
  return (
    <div className="absolute inset-0 z-20 bg-[#080a11]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
        <div className="absolute inset-1 rounded-full border border-dashed border-cyan-500/40 animate-spin" />
        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1 text-center font-mono">
        <div className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
          {message}
        </div>
        <div className="text-[11px] text-slate-400">
          Synchronizing Three.js mesh instances with SimulationEngine
        </div>
      </div>

      {/* Progress bar shimmer */}
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-24 animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

export default LoadingWorld;
