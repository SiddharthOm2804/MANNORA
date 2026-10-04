import React, { useState } from 'react';
import { 
  GitBranch, 
  Clock, 
  RotateCcw, 
  Bookmark, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  ArrowRight,
  PlusCircle,
  Copy
} from 'lucide-react';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import TimelineControl from '../components/common/TimelineControl';

export default function Timeline() {
  const [activeBranch, setActiveBranch] = useState('main_trunk');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(1100);

  const branches = [
    {
      id: 'main_trunk',
      name: 'Main Trunk // Baseline Civilization',
      ticks: 1420,
      status: 'active',
      description: 'Canonical deterministic simulation execution without counterfactual intervention.',
    },
    {
      id: 'branch_alpha',
      name: 'Branch Alpha // Energy Subsidy Deregulation',
      ticks: 1100,
      forkedFrom: 800,
      status: 'forked',
      description: 'Forked at Tick 800 to evaluate zero-cap energy pricing on industrial velocity.',
    },
    {
      id: 'branch_beta',
      name: 'Branch Beta // Synthetic UBI Cohort',
      ticks: 950,
      forkedFrom: 600,
      status: 'dormant',
      description: 'Forked at Tick 600 exploring universal energy quotas across lower quintiles.',
    },
  ];

  const checkpoints = [
    {
      tick: 1420,
      title: 'Current Head State // Epoch 01',
      date: 'Just now',
      type: 'HEAD',
      metrics: { population: 1482, treasury: '942.8k NC', entropy: '0.14 λ' },
      notes: 'State Manager snapshot #142 committed to in-memory buffer.',
    },
    {
      tick: 1100,
      title: 'Zoning Ordinance #42 Ratified',
      date: '320 ticks ago',
      type: 'CHECKPOINT',
      metrics: { population: 1320, treasury: '860.2k NC', entropy: '0.16 λ' },
      notes: 'Sector 04 designated as high-density residential terrace quadrant.',
    },
    {
      tick: 720,
      title: 'Municipal Solar Grid Transition',
      date: '700 ticks ago',
      type: 'MILESTONE',
      metrics: { population: 980, treasury: '620.0k NC', entropy: '0.22 λ' },
      notes: 'Primary energy generator flipped to 90% sustainable photovoltaic core.',
    },
    {
      tick: 350,
      title: 'Formation of Merchant Exchange Guild',
      date: '1,070 ticks ago',
      type: 'CHECKPOINT',
      metrics: { population: 640, treasury: '380.5k NC', entropy: '0.28 λ' },
      notes: 'Autonomous agents clustered to establish centralized commodity exchange.',
    },
    {
      tick: 0,
      title: 'Simulation Matrix Inception',
      date: '1,420 ticks ago',
      type: 'ROOT',
      metrics: { population: 500, treasury: '100.0k NC', entropy: '0.35 λ' },
      notes: 'Deterministic Mulberry32 seed #83917492 initialized.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span>TEMPORAL CHRONOMETER & BRANCHING GRAPH</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Temporal Timeline & Checkpoints
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Deterministic state history rollback, counterfactual branching, and simulation epoch checkpoints.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Forking new counterfactual branch from current state...')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Fork Branch</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Branches (Left) & Checkpoint Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Branches Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            tag="BRANCH.TREE"
            title="Simulation Branch Tree"
            subtitle="Parallel world executions and counterfactual timelines"
          >
            <div className="space-y-3">
              {branches.map((b) => {
                const isActive = activeBranch === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBranch(b.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#121726] border-cyan-500/80 shadow-md shadow-cyan-600/10'
                        : 'bg-[#080a11] border-[#1a2233] hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">
                            {b.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                          {b.description}
                        </p>
                      </div>

                      <StatusIndicator
                        status={b.status === 'active' ? 'simulating' : 'idle'}
                        label={b.status.toUpperCase()}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>DEPTH: {b.ticks} TICKS</span>
                      {b.forkedFrom && <span>FORKED AT: #{b.forkedFrom}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Rollback Instructions */}
          <div className="lab-panel p-4 rounded-lg space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <History className="w-3.5 h-3.5" />
              <span>DETERMINISTIC ROLLBACK CAPABILITY</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              NEURAL CITY StateManager maintains immutable cloned snapshots of `WorldState`. Stepping backward to any checkpoint restores exact entity memory and socioeconomic metrics.
            </p>
          </div>
        </div>

        {/* Historical Checkpoints Feed (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Panel
            tag="SNAPSHOT.LOG"
            title="State Checkpoint History"
            subtitle="Ring-buffer checkpoints recorded in StateManager (Retention: 100)"
          >
            <div className="space-y-4">
              {checkpoints.map((cp, idx) => {
                const isSelected = selectedCheckpoint === cp.tick;

                return (
                  <div
                    key={cp.tick}
                    onClick={() => setSelectedCheckpoint(cp.tick)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#101424] border-cyan-500/70 ring-1 ring-cyan-500/30'
                        : 'bg-[#080a11] border-[#1a2233] hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                            TICK #{cp.tick.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono px-1 rounded bg-[#101422] text-slate-400 border border-slate-800">
                            {cp.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {cp.date}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white font-sans pt-1">
                          {cp.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans">
                          {cp.notes}
                        </p>
                      </div>

                      {/* Rollback Trigger Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Initiating deterministic state rollback to Tick #${cp.tick}...`);
                        }}
                        className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 transition-colors shrink-0 flex items-center gap-1"
                        title={`Revert simulation to Tick #${cp.tick}`}
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Rollback</span>
                      </button>
                    </div>

                    {/* Checkpoint Telemetry Snapshot */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                      <div>
                        POP: <span className="text-white font-mono-data">{cp.metrics.population}</span>
                      </div>
                      <div>
                        TREASURY: <span className="text-emerald-400 font-mono-data">{cp.metrics.treasury}</span>
                      </div>
                      <div>
                        ENTROPY: <span className="text-cyan-400 font-mono-data">{cp.metrics.entropy}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
