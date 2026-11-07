import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  Droplets,
  Flame,
  Activity,
  TrendingDown,
  Cpu,
  BarChart2,
  Users,
  Send,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const CANONICAL_EVENTS = [
  {
    type: 'water_shortage',
    title: 'Water Shortage',
    category: 'resource',
    icon: Droplets,
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30',
    severity: 4,
    defaultDuration: 10,
    cause: 'Aquifer condenser drought and filtration grid contamination',
    effectsSummary: 'Reservoirs drop, farming throttled, dehydration stresses health and happiness.',
    recoveryBehavior: 'AQUIFER_RECHARGE',
  },
  {
    type: 'energy_shortage',
    title: 'Energy Shortage',
    category: 'resource',
    icon: Zap,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
    severity: 3,
    defaultDuration: 10,
    cause: 'Fusion reactor trip & relay bottleneck',
    effectsSummary: 'Power generation throttled to 25%, rolling blackouts reduce factory productivity.',
    recoveryBehavior: 'GRID_REBALANCING',
  },
  {
    type: 'resource_shortage',
    title: 'Resource Shortage',
    category: 'resource',
    icon: AlertTriangle,
    color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/30',
    severity: 3,
    defaultDuration: 12,
    cause: 'Extraction logistical delay and raw minerals depletion',
    effectsSummary: 'Raw materials & minerals production falls 60-70%, price pressures surge.',
    recoveryBehavior: 'GRADUAL_RESTORATION',
  },
  {
    type: 'infrastructure_failure',
    title: 'Infrastructure Failure',
    category: 'infrastructure',
    icon: ShieldAlert,
    color: 'text-orange-400 border-orange-500/40 bg-orange-950/30',
    severity: 3,
    defaultDuration: 10,
    cause: 'Substation explosion and structural conduit overload',
    effectsSummary: 'Building health and efficiency slashed 40-50%, transit arterial congestion.',
    recoveryBehavior: 'INFRASTRUCTURE_REPAIR',
  },
  {
    type: 'economic_crash',
    title: 'Economic Crash',
    category: 'economic',
    icon: TrendingDown,
    color: 'text-red-400 border-red-500/40 bg-red-950/30',
    severity: 4,
    defaultDuration: 16,
    cause: 'Liquidity insolvency contagion and credit panic',
    effectsSummary: 'Treasury shrinks 25%, GDP falls 40%, corporate profits drop, inflation spikes.',
    recoveryBehavior: 'ECONOMIC_STABILIZATION',
  },
  {
    type: 'market_shock',
    title: 'Market Shock',
    category: 'economic',
    icon: BarChart2,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
    severity: 3,
    defaultDuration: 10,
    cause: 'Speculative commodity manipulation and supply disruption',
    effectsSummary: 'Extreme commodity price volatility (energy & water prices double).',
    recoveryBehavior: 'PRICE_EQUILIBRIUM_RESTORE',
  },
  {
    type: 'natural_disaster',
    title: 'Natural Disaster',
    category: 'environmental',
    icon: Flame,
    color: 'text-rose-500 border-rose-500/40 bg-rose-950/30',
    severity: 4,
    defaultDuration: 8,
    cause: 'High-magnitude tectonic shear & cyber-atmospheric storm',
    effectsSummary: 'Direct building damage, resource destruction, population casualties.',
    recoveryBehavior: 'CIVIC_RECONSTRUCTION',
  },
  {
    type: 'disease_outbreak',
    title: 'Disease Outbreak',
    category: 'health',
    icon: Activity,
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
    severity: 3,
    defaultDuration: 14,
    cause: 'Synthetic bio-aerosol pathogen escape',
    effectsSummary: 'Citizen health drops rapidly, worker rest drains, municipal clinic overload.',
    recoveryBehavior: 'EPIDEMIOLOGICAL_CONTAINMENT',
  },
  {
    type: 'technology_breakthrough',
    title: 'Technology Breakthrough',
    category: 'technology',
    icon: Cpu,
    color: 'text-blue-400 border-blue-500/40 bg-blue-950/30',
    severity: 2,
    defaultDuration: 20,
    cause: 'Quantum neural computing milestone and algorithmic fusion',
    effectsSummary: 'Tech generation +120%, industrial efficiency +25%, civic happiness boosts.',
    recoveryBehavior: 'PERMANENT_EFFICIENCY_GAIN',
  },
  {
    type: 'migration_wave',
    title: 'Migration Wave',
    category: 'demographic',
    icon: Users,
    color: 'text-teal-400 border-teal-500/40 bg-teal-950/30',
    severity: 2,
    defaultDuration: 12,
    cause: 'Regional climate refugee influx and frontier arrival',
    effectsSummary: 'Population increases +12%, housing & resource consumption loads rise.',
    recoveryBehavior: 'CIVIC_ABSORPTION',
  },
];

/**
 * EventInjectionUI provides an interactive, full-featured simulation event trigger modal/drawer.
 */
export default function EventInjectionUI({
  isOpen,
  onClose,
  onInjectEvent,
  isInjecting = false,
  activeEvents = [],
}) {
  const [selectedType, setSelectedType] = useState('water_shortage');
  const [severity, setSeverity] = useState(3);
  const [duration, setDuration] = useState(10);
  const [cause, setCause] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!isOpen) return null;

  const currentTemplate = CANONICAL_EVENTS.find((e) => e.type === selectedType) || CANONICAL_EVENTS[0];
  const IconComponent = currentTemplate.icon || AlertTriangle;

  const handleSelectTemplate = (item) => {
    setSelectedType(item.type);
    setSeverity(item.severity);
    setDuration(item.defaultDuration);
    setCause(item.cause);
  };

  const handleTrigger = async () => {
    setFeedbackMsg(null);
    const eventPayload = {
      type: currentTemplate.type,
      title: currentTemplate.title,
      category: currentTemplate.category,
      severity: Number(severity),
      duration: Number(duration),
      cause: cause.trim() || currentTemplate.cause,
      recoveryBehavior: currentTemplate.recoveryBehavior,
    };

    if (onInjectEvent) {
      const res = await onInjectEvent(eventPayload);
      if (res && res.success !== false) {
        setFeedbackMsg({
          type: 'success',
          text: `Event '${currentTemplate.title}' successfully injected into active simulation pipeline!`,
        });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res?.message || 'Failed to inject event',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-[#0b0e17] border border-cyan-800/60 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#07090f] border-b border-[#1a2233] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] text-cyan-400">
                <span className="font-bold">PHASE 11 // EVENT ENGINE</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Stochastic Injection Matrix</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Simulated Event & Shock Injection
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Event Archetype List (5 Cols) */}
          <div className="md:col-span-5 p-4 border-r border-[#1a2233] overflow-y-auto space-y-2 bg-[#080a12]/60">
            <div className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold mb-2 flex items-center justify-between">
              <span>Select Canonical Archetype</span>
              <span className="text-cyan-400">{CANONICAL_EVENTS.length} Types</span>
            </div>

            {CANONICAL_EVENTS.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.type === selectedType;
              return (
                <button
                  key={item.type}
                  onClick={() => handleSelectTemplate(item)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-md'
                      : 'bg-[#090c14] border-slate-800/70 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-md border mt-0.5 ${item.color}`}>
                    <ItemIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                        Tier {item.severity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Parameters & Propagation Inspector (7 Cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-[#0a0d17]">
            
            {/* Active Archetype Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-4 ${currentTemplate.color}`}>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{currentTemplate.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    {currentTemplate.recoveryBehavior}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {currentTemplate.effectsSummary}
                </p>
              </div>
            </div>

            {/* Injection Parameters Form */}
            <div className="space-y-4 text-xs">
              
              {/* Severity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Severity Tier [1 - 5]:</span>
                  <span className="text-cyan-300 font-bold font-mono-data">
                    Level {severity} {severity >= 4 ? '(Critical Shock)' : severity === 3 ? '(Substantial)' : '(Moderate)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Duration Ticks */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration (Ticks / Hours):</span>
                  <span className="text-emerald-400 font-bold font-mono-data">{duration} Ticks</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Cause Description */}
              <div className="space-y-1.5">
                <label className="text-slate-400 block">Exogenous Root Cause / Trigger Rationale:</label>
                <textarea
                  rows={2}
                  value={cause || currentTemplate.cause}
                  onChange={(e) => setCause(e.target.value)}
                  placeholder="Describe the cause of the simulated crisis..."
                  className="w-full bg-[#070910] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-600 font-mono resize-none"
                />
              </div>

              {/* Propagation Chain Visualization */}
              <div className="p-3.5 rounded-lg bg-[#070912] border border-cyan-900/40 space-y-2">
                <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subsystem Propagation Cascade</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="p-2 rounded bg-black/40 border border-slate-800">
                    <span className="text-cyan-400 font-bold">1. Resources:</span> Supply & deficit shocks
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800">
                    <span className="text-amber-400 font-bold">2. Economy:</span> Dynamic prices & treasury
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800">
                    <span className="text-violet-400 font-bold">3. Agents:</span> Drives, anxiety & health
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800">
                    <span className="text-emerald-400 font-bold">4. Government:</span> Approval & public services
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                      : 'bg-red-950/50 border-red-500/60 text-red-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedbackMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-3.5 bg-[#07090f] border-t border-[#1a2233] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Events deterministically mutate state across all engine pipelines.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#0e121d] hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTrigger}
              disabled={isInjecting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isInjecting ? 'Propagating Shock...' : `Trigger ${currentTemplate.title}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

