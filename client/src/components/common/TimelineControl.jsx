import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  FastForward, 
  Clock, 
  Bookmark 
} from 'lucide-react';
import StatusIndicator from './StatusIndicator';

/**
 * TimelineControl - Scientific simulation playback and chronometer controls.
 * 
 * @param {Object} props
 * @param {boolean} props.isRunning
 * @param {Function} props.onTogglePlay
 * @param {Function} props.onStep
 * @param {Function} props.onReset
 * @param {number} props.tick - Current simulation tick
 * @param {number} props.maxTick - Benchmark or current buffer max tick
 * @param {Function} [props.onScrub]
 * @param {number} props.speed - Current time scale multiplier (1, 2, 5, etc.)
 * @param {Function} props.onSpeedChange
 * @param {string} [props.epoch='Epoch 01']
 */
export default function TimelineControl({
  isRunning = false,
  onTogglePlay,
  onStep,
  onReset,
  tick = 0,
  maxTick = 5000,
  onScrub,
  speed = 1,
  onSpeedChange,
  epoch = 'EPOCH 01',
  className = '',
}) {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div
      className={`lab-panel px-4 py-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Left: Clock Status & Tick Vitals */}
      <div className="flex items-center gap-3 shrink-0">
        <StatusIndicator
          status={isRunning ? 'simulating' : 'paused'}
          label={isRunning ? 'ACTIVE RUN' : 'PAUSED'}
          size="sm"
        />

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-baseline gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">{epoch}</span>
          <span className="text-white font-bold tracking-tight text-sm font-mono-data">
            TICK #{tick.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center: Playback Buttons & Scrubbing */}
      <div className="flex-1 w-full max-w-xl flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`p-2 rounded-md font-mono text-xs transition-colors flex items-center justify-center ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm shadow-cyan-600/30'
          }`}
          title={isRunning ? 'Pause Engine (Space)' : 'Start Engine (Space)'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Step Forward Tick */}
        <button
          onClick={onStep}
          disabled={isRunning}
          className="p-2 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Step 1 Discrete Tick"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Reset / Rewind */}
        <button
          onClick={onReset}
          className="p-2 rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset Simulation Clock"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Scrubber slider */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={maxTick}
            value={tick}
            onChange={(e) => onScrub && onScrub(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Speed Multipliers */}
      <div className="flex items-center gap-1 shrink-0 bg-[#090b12] p-1 rounded-md border border-slate-800">
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange && onSpeedChange(s)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              speed === s
                ? 'bg-slate-700 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
