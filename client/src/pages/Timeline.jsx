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
      name: 'Spiti Vally: Current City',
      ticks: 1420,
      status: 'active',
      description: 'The main city simulation running with original settings and policies.',
    },
    {
      id: 'branch_alpha',
      name: 'What if power were free?',
      ticks: 1100,
      forkedFrom: 800,
      status: 'forked',
      description: 'Branched at Day 800 to see what happens when electricity is made free for all factories.',
    },
    {
      id: 'branch_beta',
      name: 'What if families got monthly support?',
      ticks: 950,
      forkedFrom: 600,
      status: 'dormant',
      description: 'Branched at Day 600 to test giving monthly allowances to low-income citizens.',
    },
  ];

  const checkpoints = [
    {
      tick: 1420,
      title: 'Current City State',
      date: 'Just now',
      type: 'LATEST',
      metrics: { population: 1482, treasury: '₹9,42,800', entropy: '86%' },
      notes: 'Latest simulation state saved in memory.',
    },
    {
      tick: 1100,
      title: 'City Expansion Rule Approved',
      date: '320 days ago',
      type: 'SAVED POINT',
      metrics: { population: 1320, treasury: '₹8,60,200', entropy: '82%' },
      notes: 'Dhankar homes opened for new residential houses and apartments.',
    },
    {
      tick: 720,
      title: 'Solar Power Plant Completed',
      date: '700 days ago',
      type: 'MILESTONE',
      metrics: { population: 980, treasury: '₹6,20,000', entropy: '75%' },
      notes: 'Switched main power generation to clean solar power.',
    },
    {
      tick: 350,
      title: 'City Traders Association Formed',
      date: '1,070 days ago',
      type: 'SAVED POINT',
      metrics: { population: 640, treasury: '₹3,80,500', entropy: '68%' },
      notes: 'Local merchants established a central market for goods.',
    },
    {
      tick: 0,
      title: 'Spiti Vally Opened',
      date: '1,420 days ago',
      type: 'START',
      metrics: { population: 500, treasury: '₹1,00,000', entropy: '60%' },
      notes: 'Simulation initialized with starter population and seed.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span>TIME MACHINE & SAVED SIMULATION POINTS // PHASE 12</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Time Machine & City History
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rewind to earlier days, save snapshots of your city, and test "what if" decisions in separate branches.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Creating a new test version from current simulation day...')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Test Version</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Branches (Left) & Checkpoint Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Branches Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            tag="SIMULATION.VERSIONS"
            title="Saved City Versions"
            subtitle="Compare city versions with different choices"
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
                        label={b.status === 'active' ? 'RUNNING' : 'SAVED'}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>LENGTH: {b.ticks} DAYS</span>
                      {b.forkedFrom && <span>STARTED FROM: DAY #{b.forkedFrom}</span>}
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
              <span>HOW TO USE THE TIME MACHINE</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              MANNORA saves complete snapshots of the entire city. When you rewind time to any saved point, all citizens, jobs, bank balance, and city buildings return exactly to how they were on that day.
            </p>
          </div>
        </div>

        {/* Historical Checkpoints Feed (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Panel
            tag="SAVED.POINTS"
            title="Saved City History"
            subtitle="Choose a saved day to return to."
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
                            DAY #{cp.tick.toLocaleString()}
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
                          alert(`Rewinding city state back to Day #${cp.tick}...`);
                        }}
                        className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 transition-colors shrink-0 flex items-center gap-1"
                        title={`Rewind simulation to Day #${cp.tick}`}
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Rewind Here</span>
                      </button>
                    </div>

                    {/* Checkpoint Telemetry Snapshot */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                      <div>
                        PEOPLE: <span className="text-white font-mono-data">{cp.metrics.population}</span>
                      </div>
                      <div>
                        CITY FUNDS: <span className="text-emerald-400 font-mono-data">{cp.metrics.treasury}</span>
                      </div>
                      <div>
                        CITY WELLBEING: <span className="text-cyan-400 font-mono-data">{cp.metrics.entropy}</span>
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
