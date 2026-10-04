import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap, 
  Coins, 
  Users, 
  Download, 
  Calendar, 
  Sliders, 
  Layers,
  ChevronDown
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('1000_TICKS');
  const [activeTab, setActiveTab] = useState('macro'); // macro | demographics | energy

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>MACROECONOMIC & SOCIO-DYNAMIC TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Civilization Analytics Lab
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Statistical aggregation of wealth velocity, demographic shifts, thermodynamic flux, and policy impact.
          </p>
        </div>

        {/* Time Window Selector & Data Export */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#0e121d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="500_TICKS">Last 500 Ticks</option>
            <option value="1000_TICKS">Last 1,000 Ticks</option>
            <option value="ALL_TIME">Complete Simulation Epoch</option>
          </select>

          <button
            onClick={() => alert('Exporting simulation telemetry dataset (CSV / JSON)...')}
            className="px-3 py-1.5 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-slate-700/80 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Gini Inequality Index"
          code="ECO.GINI.01"
          value="0.312"
          delta={-1.8}
          trend="up"
          subtitle="Equitable Distribution"
          icon={<Coins className="w-4 h-4 text-emerald-400" />}
          sparkline={[0.34, 0.335, 0.33, 0.325, 0.318, 0.312]}
        />

        <MetricCard
          label="Gross Municipal Output"
          code="ECO.GDP.02"
          value="1.84M"
          unit="NC"
          delta={5.2}
          trend="up"
          subtitle="Per 100 Ticks"
          icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          sparkline={[1.4, 1.5, 1.55, 1.68, 1.74, 1.84]}
        />

        <MetricCard
          label="Energy Net Flow"
          code="NRG.FLUX.03"
          value="+420"
          unit="kW/t"
          delta={0.8}
          trend="up"
          subtitle="Generation > Load"
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          sparkline={[310, 340, 360, 390, 410, 420]}
        />

        <MetricCard
          label="Cognitive Divergence"
          code="AI.DIV.04"
          value="0.082"
          delta={-3.1}
          trend="up"
          subtitle="High Cohesion"
          icon={<Activity className="w-4 h-4 text-violet-400" />}
          sparkline={[0.12, 0.11, 0.095, 0.09, 0.085, 0.082]}
        />
      </div>

      {/* Main Charts & Telemetry Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Chart Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Panel
            tag="TIME.SERIES"
            title="Macroeconomic Flux & Energy Consumption Curves"
            subtitle="Normalized telemetry over current epoch execution"
          >
            {/* High-Tech Technical SVG Visualization */}
            <div className="p-4 bg-[#080a11] rounded-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-1 bg-cyan-400 rounded-sm" />
                    <span>Energy Demand (kW)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-1 bg-emerald-400 rounded-sm" />
                    <span>Capital Velocity (NC/t)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2.5 h-1 bg-amber-400 rounded-sm" />
                    <span>Entropy Level (λ)</span>
                  </span>
                </div>
                <span className="text-slate-400">INTERVAL: 100 TICKS</span>
              </div>

              {/* Multi-line chart SVG */}
              <div className="w-full h-56 pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
                  {/* Grid lines */}
                  {[40, 80, 120, 160].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="700"
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Curve 1: Energy Demand */}
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    points="0,140 100,120 200,135 300,90 400,95 500,70 600,60 700,50"
                  />

                  {/* Curve 2: Capital Velocity */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points="0,160 100,150 200,130 300,125 400,110 500,90 600,85 700,70"
                  />

                  {/* Curve 3: Entropy */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    points="0,180 100,175 200,170 300,165 400,160 500,162 600,158 700,155"
                  />
                </svg>
              </div>

              {/* Time axis markers */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <span>TICK #420</span>
                <span>TICK #670</span>
                <span>TICK #920</span>
                <span>TICK #1,170</span>
                <span>TICK #1,420 (CURRENT)</span>
              </div>
            </div>
          </Panel>

          {/* Demographic & Socioeconomic Histograms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel
              tag="DEMO.DIST"
              title="Agent Wealth Stratification"
              subtitle="Lorenz distribution quintiles"
            >
              <div className="space-y-2 text-xs font-mono">
                {[
                  { label: 'Tier 1 (Lower 20%)', share: '12%', color: 'bg-slate-600' },
                  { label: 'Tier 2 (Lower-Mid)', share: '16%', color: 'bg-sky-600' },
                  { label: 'Tier 3 (Median)', share: '22%', color: 'bg-cyan-500' },
                  { label: 'Tier 4 (Upper-Mid)', share: '24%', color: 'bg-teal-400' },
                  { label: 'Tier 5 (Upper 20%)', share: '26%', color: 'bg-emerald-400' },
                ].map((tier, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{tier.label}</span>
                      <span className="text-white font-mono-data">{tier.share}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tier.color} rounded-full`}
                        style={{ width: tier.share }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              tag="ROLE.QUOTA"
              title="Civilization Role Allocation"
              subtitle="Active occupational breakdown"
            >
              <div className="space-y-2 text-xs font-mono">
                {[
                  { role: 'Citizens (Base Population)', count: 980, pct: '66%' },
                  { role: 'Merchants & Logistics', count: 240, pct: '16%' },
                  { role: 'Industrial Specialists', count: 180, pct: '12%' },
                  { role: 'Council & Observers', count: 82, pct: '6%' },
                ].map((r, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#080a11] border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 text-xs">{r.role}</div>
                      <div className="text-[10px] text-slate-400">{r.count} Autonomous Agents</div>
                    </div>
                    <span className="text-cyan-400 font-bold font-mono-data">{r.pct}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Right Sidebar: Counterfactual Scenario Matrix (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Panel
            tag="COUNTERFACTUAL"
            title="Hypothetical Scenarios"
            subtitle="Simulated policy variance comparisons"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 space-y-1.5">
                <div className="text-[10px] text-cyan-400 font-semibold uppercase">
                  ACTIVE: BASELINE SCENARIO #01
                </div>
                <div className="text-white font-sans text-xs">
                  Balanced energy subsidies with municipal liquidity reserves.
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-cyan-800/40">
                  Expected Growth: <span className="text-emerald-400">+5.4%</span> • Entropy: <span className="text-cyan-300">0.14 λ</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="text-[10px] text-slate-400 uppercase">
                  BRANCH A // FULL DEREGULATION
                </div>
                <div className="text-slate-300 font-sans text-xs">
                  Zero price caps on energy grid; dynamic market bidding.
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Expected Growth: <span className="text-emerald-400">+8.2%</span> • Entropy: <span className="text-rose-400">0.38 λ (High)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="text-[10px] text-slate-400 uppercase">
                  BRANCH B // SYNTHETIC UBI RESERVE
                </div>
                <div className="text-slate-300 font-sans text-xs">
                  Universal energy stipend granted to all Tier 1 citizens.
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Expected Growth: <span className="text-slate-300">+3.1%</span> • Entropy: <span className="text-emerald-400">0.06 λ (Ultra-Stable)</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Telemetry Integrity Status */}
          <div className="lab-panel p-3.5 rounded-lg text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>Statistical Confidence</span>
              <span className="text-emerald-400">99.8%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Monte Carlo convergence validated across 10,000 deterministic sample runs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
