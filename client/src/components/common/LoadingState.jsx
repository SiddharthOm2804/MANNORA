import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';

/**
 * LoadingState - Scientific radar/matrix loading state component.
 * 
 * @param {Object} props
 * @param {string} [props.message='INITIALIZING SIMULATION MATRIX...']
 * @param {string} [props.subtext='Synchronizing deterministic state and neural telemetry']
 * @param {boolean} [props.fullScreen=false]
 */
export default function LoadingState({
  message = 'INITIALIZING SIMULATION MATRIX...',
  subtext = 'Synchronizing deterministic state and neural telemetry',
  fullScreen = false,
}) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {/* High-tech scientific radar icon */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
        <div className="absolute inset-1 rounded-full border border-dashed border-cyan-500/40 animate-spin-slow" />
        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-mono font-semibold tracking-wider text-slate-200 uppercase">
          {message}
        </div>
        {subtext && (
          <div className="text-[11px] font-mono text-slate-400">
            {subtext}
          </div>
        )}
      </div>

      {/* Progress bar shimmer */}
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-24 animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#080a11]/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="lab-panel rounded-lg flex items-center justify-center min-h-[220px]">
      {content}
    </div>
  );
}
