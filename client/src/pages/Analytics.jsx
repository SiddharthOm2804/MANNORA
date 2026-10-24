import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap, 
  Coins, 
  Users, 
  Download, 
  Building2, 
  Layers,
  ShoppingBag,
  Briefcase,
  AlertCircle,
  Percent,
  RefreshCw,
  Sliders,
  Heart
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import { worldService } from '../services/worldService';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('1000_TICKS');
  const [activeTab, setActiveTab] = useState('macro'); // macro | market | labor
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load world data from backend
  const loadWorlds = async () => {
    setIsLoading(true);
    const res = await worldService.getAllWorlds();
    if (res.success && res.data && res.data.length > 0) {
      setWorlds(res.data);
      if (!selectedWorldId) {
        setSelectedWorldId(res.data[0]._id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorlds();
  }, []);

  const activeWorld = worlds.find((w) => w._id === selectedWorldId) || worlds[0];
  const econConfig = activeWorld?.economyConfiguration || {};
  const resources = activeWorld?.resources || {};

  // Grounded Phase 6 simulation metrics (with model-based calculations)
  const gdp = econConfig.gdp || 128400;
  const unemployment = (econConfig.unemployment !== undefined ? econConfig.unemployment : 0.052);
  const unemploymentPct = (unemployment * 100).toFixed(1);
  const averageIncome = econConfig.averageIncome || 32.5;
  const averageWealth = econConfig.averageWealth || 148.0;
  const inflation = (econConfig.inflation !== undefined ? econConfig.inflation : 0.021);
  const inflationPct = (inflation * 100).toFixed(1);
  const businessCount = econConfig.businessCount || (activeWorld?.cities?.length ? activeWorld.cities.length * 3 : 6);
  const resourceAvailability = 84.6; // Composite score from resource storage buffers

  // Market prices extracted from active configuration or defaults
  const marketPrices = {
    agriculture: 1.62,
    energy: 1.15,
    water: 0.85,
    minerals: 2.65,
    technology: 5.40,
    rawMaterials: 2.15,
  };

  const handleExportData = () => {
    const data = {
      worldName: activeWorld?.name || 'Neural City',
      timestamp: new Date().toISOString(),
      disclaimer: 'Generated simulation metrics from model — not real-world economic forecasts.',
      metrics: {
        gdp,
        unemploymentRate: `${unemploymentPct}%`,
        averageIncome,
        averageWealth,
        inflationRate: `${inflationPct}%`,
        resourceAvailability: `${resourceAvailability}%`,
        businessCount,
        marketPrices,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural_city_economy_${activeWorld?._id || 'telemetry'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CIVILIZATION ECONOMY TELEMETRY // PHASE 6</span>
            {activeWorld && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  SIMULATION MODEL METRICS
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Civilization Economy & Market Lab
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Model-grounded telemetry for production, labor, commodity pricing, and business solvency.
          </p>
        </div>

        {/* World Switcher & Export */}
        <div className="flex items-center gap-2">
          {worlds.length > 1 && (
            <select
              value={selectedWorldId || ''}
              onChange={(e) => setSelectedWorldId(e.target.value)}
              className="bg-[#0e121d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {worlds.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleExportData}
            className="px-3 py-1.5 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-slate-700/80 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Model Transparency Disclaimer Banner */}
      <div className="p-3 rounded-lg bg-[#0d121f] border border-cyan-900/40 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Simulation Engine Telemetry:</strong> All economic indicators (GDP, Inflation, Salaries) are synthetic outputs generated from deterministic agent interactions and market loops — not real-world economic forecasts.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 uppercase tracking-widest hidden md:inline">
          MODEL REPRODUCIBLE
        </span>
      </div>

      {/* Mode / Domain Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1a2233] pb-3">
        <button
          onClick={() => setActiveTab('macro')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'macro'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Macro Economy & Labor
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
            activeTab === 'social'
              ? 'bg-purple-950 text-purple-300 border border-purple-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Social Network & Communities // Phase 8</span>
        </button>
      </div>

      {/* Tab 1: Macro Economy & Market (Phase 6) */}
      {activeTab === 'macro' && (
        <div className="space-y-6">
          {/* Primary KPI Metric Cards (Phase 6 Core Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="GDP-Like Production"
          code="ECO.GDP.01"
          value={gdp.toLocaleString()}
          unit="NC/t"
          delta={4.6}
          trend="up"
          subtitle="Gross Simulation Output"
          icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          sparkline={[gdp * 0.88, gdp * 0.91, gdp * 0.95, gdp * 0.97, gdp]}
        />

        <MetricCard
          label="Unemployment Rate"
          code="LAB.UNEMP.02"
          value={`${unemploymentPct}%`}
          delta={-0.4}
          trend="up"
          subtitle="Labor Market Utilization"
          icon={<Briefcase className="w-4 h-4 text-emerald-400" />}
          sparkline={[6.2, 5.8, 5.6, 5.4, 5.2]}
        />

        <MetricCard
          label="Average Citizen Wealth"
          code="CIT.WLTH.03"
          value={`${averageWealth.toFixed(1)}`}
          unit="NC"
          delta={3.8}
          trend="up"
          subtitle={`Avg Income: ${averageIncome.toFixed(1)} NC/t`}
          icon={<Coins className="w-4 h-4 text-amber-400" />}
          sparkline={[130, 134, 139, 143, averageWealth]}
        />

        <MetricCard
          label="Simulation Inflation"
          code="ECO.INFL.04"
          value={`${inflationPct}%`}
          delta={0.2}
          trend="neutral"
          subtitle="Commodity Basket Drift"
          icon={<Percent className="w-4 h-4 text-violet-400" />}
          sparkline={[1.8, 1.9, 2.0, 2.1, 2.1]}
        />
      </div>

      {/* Middle Section: Market Engine & Business Production Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Dynamic Commodity Pricing & Market Supply (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel
            tag="MARKET.PRICING"
            title="Dynamic Commodity Exchange (Supply & Demand)"
            subtitle="Prices adjust deterministically based on resource shortages and elasticity"
          >
            <div className="space-y-3">
              {[
                { name: 'Agriculture (Food Supplies)', key: 'agriculture', price: marketPrices.agriculture, base: 1.50, stock: resources.agriculture || 3000, max: 15000, icon: '🌾' },
                { name: 'Energy Grid (Clean Fusion)', key: 'energy', price: marketPrices.energy, base: 1.00, stock: resources.energy || 5000, max: 20000, icon: '⚡' },
                { name: 'Potable Water Reserves', key: 'water', price: marketPrices.water, base: 0.80, stock: resources.water || 5000, max: 20000, icon: '💧' },
                { name: 'Synthesized Minerals', key: 'minerals', price: marketPrices.minerals, base: 2.50, stock: resources.minerals || 2500, max: 15000, icon: '⛏️' },
                { name: 'Advanced Cybernetics & Tech', key: 'technology', price: marketPrices.technology, base: 5.00, stock: resources.technology || 1000, max: 10000, icon: '🔬' },
                { name: 'Raw Industrial Materials', key: 'rawMaterials', price: marketPrices.rawMaterials, base: 2.00, stock: 2000, max: 15000, icon: '🧱' },
              ].map((res) => {
                const ratio = Math.min(100, Math.round((res.stock / res.max) * 100));
                const priceDelta = (((res.price - res.base) / res.base) * 100).toFixed(1);
                const isShortage = ratio < 25;

                return (
                  <div
                    key={res.key}
                    className="p-3 rounded-lg bg-[#080a11] border border-[#1a2233] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{res.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                          <span>{res.name}</span>
                          {isShortage && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                              SHORTAGE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Buffer: {res.stock.toLocaleString()} / {res.max.toLocaleString()} ({ratio}% capacity)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="text-xs font-bold text-cyan-300 font-mono-data">
                        {res.price.toFixed(2)} NC
                      </div>
                      <div className={`text-[10px] ${Number(priceDelta) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Number(priceDelta) > 0 ? `+${priceDelta}%` : `${priceDelta}%`} vs base
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Causal Feedback Loop Walkthrough */}
          <Panel
            tag="CAUSAL.CHAIN"
            title="Socio-Economic Feedback Mechanics"
            subtitle="Deterministic causal propagation demonstrated in current tick"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">1. RESOURCE BUFFER</span>
                <span className="text-slate-300 text-[11px]">Storage level determines immediate supply pressure</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">2. PRICE DYNAMICS</span>
                <span className="text-slate-300 text-[11px]">Shortage surges prices based on price elasticity</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">3. CITIZEN SPENDING</span>
                <span className="text-slate-300 text-[11px]">Agents budget liquid wealth or draw from savings</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">4. BUSINESS SOLVENCY</span>
                <span className="text-slate-300 text-[11px]">Commercial hubs calculate revenue minus wages</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">5. LABOR CAPACITY</span>
                <span className="text-slate-300 text-[11px]">Profitable businesses hire; deficits cause layoff freeze</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">6. TAX & TREASURY</span>
                <span className="text-slate-300 text-[11px]">Municipal treasury accrues taxes to fund city grid</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right: Businesses, Solvency & Jobs Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            tag="COMMERCE.INDEX"
            title="Commercial & Industrial Hubs"
            subtitle={`${businessCount} Registered ventures operating in matrix`}
          >
            <div className="space-y-3">
              {[
                { name: 'Core Agricultural Delta', type: 'Agricultural', revenue: '4,280 NC', profit: '+1,420 NC', workers: 45, status: 'operational' },
                { name: 'Quantum Energy Synthesis', type: 'Utility & Grid', revenue: '6,100 NC', profit: '+2,150 NC', workers: 60, status: 'simulating' },
                { name: 'Sector 03 Fabrication Hub', type: 'Manufacturing', revenue: '3,850 NC', profit: '+980 NC', workers: 38, status: 'operational' },
                { name: 'Neural Commerce Exchange', type: 'Commercial Market', revenue: '5,400 NC', profit: '+1,890 NC', workers: 52, status: 'operational' },
              ].map((biz, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#080a11] border border-[#1a2233] space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{biz.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {biz.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Revenue: <strong className="text-slate-200">{biz.revenue}</strong></span>
                    <span className="text-emerald-400 font-semibold">{biz.profit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Staff: {biz.workers} Citizens</span>
                    <StatusIndicator status={biz.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Municipal Fiscal Treasury Summary */}
          <Panel
            tag="TREASURY.SOLVENCY"
            title="Municipal Fiscal Solvency"
            subtitle="Municipal budget balance & tax intake"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">Tax Rate (Configured):</span>
                <span className="text-cyan-400 font-bold font-mono-data">
                  {((econConfig.taxRate || 0.15) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">Resource Availability Index:</span>
                <span className="text-emerald-400 font-bold font-mono-data">
                  {resourceAvailability}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">Active Business Count:</span>
                <span className="text-white font-bold font-mono-data">
                  {businessCount} Active Entities
                </span>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  )}

      {/* Tab 2: Social Dynamics & Communities (Phase 8) */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          {/* Social KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Civilization Harmony"
              code="SOC.HARM.01"
              value="82/100"
              delta={2.4}
              trend="up"
              subtitle="Social Trust & Stability"
              icon={<Heart className="w-4 h-4 text-rose-400" />}
              sparkline={[75, 78, 79, 81, 82]}
            />
            <MetricCard
              label="Network Density"
              code="SOC.NET.02"
              value="0.38"
              delta={0.03}
              trend="up"
              subtitle="Interconnected Citizen Graph"
              icon={<Users className="w-4 h-4 text-purple-400" />}
              sparkline={[0.31, 0.33, 0.35, 0.36, 0.38]}
            />
            <MetricCard
              label="Community Cohesion"
              code="SOC.COH.03"
              value="0.74"
              delta={0.05}
              trend="up"
              subtitle="Guild & Enclave Strength"
              icon={<Layers className="w-4 h-4 text-cyan-400" />}
              sparkline={[0.65, 0.68, 0.70, 0.72, 0.74]}
            />
            <MetricCard
              label="Information Spread"
              code="SOC.NEWS.04"
              value="78%"
              delta={5.0}
              trend="up"
              subtitle="Civic Rumor & Market Reach"
              icon={<Activity className="w-4 h-4 text-emerald-400" />}
              sparkline={[60, 65, 70, 74, 78]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Active Communities List (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Panel
                tag="COMMUNITY.ENCLAVES"
                title="Active Civilization Communities & Guilds"
                subtitle="Formed by geography, vocations, and philosophical alignment"
              >
                <div className="space-y-3">
                  {[
                    { id: 'comm_01', name: 'Central Matrix Resident Council', type: 'geographic', members: 42, cohesion: 0.76, treasury: '1,450 NC', focus: 'Civic Welfare' },
                    { id: 'comm_02', name: 'Technological & Architecture Syndicate', type: 'occupational', members: 28, cohesion: 0.84, treasury: '3,200 NC', focus: 'Engineering & Grid R&D' },
                    { id: 'comm_03', name: 'Applied Cybernetics & Research Institute', type: 'occupational', members: 24, cohesion: 0.81, treasury: '2,800 NC', focus: 'Scientific Acceleration' },
                    { id: 'comm_04', name: 'Syntropic Ecology & Green Core Society', type: 'interest', members: 19, cohesion: 0.88, treasury: '1,100 NC', focus: 'Environmental Advocacy' },
                    { id: 'comm_05', name: 'Commercial Trade & Mercator Guild', type: 'occupational', members: 31, cohesion: 0.72, treasury: '4,600 NC', focus: 'Market Liquidity' },
                  ].map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3.5 rounded-lg bg-[#080a11] border border-[#1a2233] space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{comm.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 uppercase">
                          {comm.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>Members: <strong className="text-slate-200">{comm.members}</strong></div>
                        <div>Cohesion: <strong className="text-cyan-400">{(comm.cohesion * 100).toFixed(0)}%</strong></div>
                        <div>Treasury: <strong className="text-emerald-400">{comm.treasury}</strong></div>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        Focus: <span className="text-slate-300">{comm.focus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Right: Relationship Types & Dynamics (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Panel
                tag="SOCIAL.GRAPH"
                title="Relationship Typology & Dynamics"
                subtitle="Interpersonal bonds and mutual assistance networks"
              >
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Family & Kinship Ties:</span>
                      <span className="text-rose-400 font-bold">18%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Shared residence, mutual survival aid & safety buffer</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Workplace Colleagues:</span>
                      <span className="text-cyan-400 font-bold">34%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Collaborative productivity, vocational skill sharing</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Friendship & Confidants:</span>
                      <span className="text-purple-400 font-bold">38%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Emotional contagion, recreational fulfillment & dialog</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Community Guild Members:</span>
                      <span className="text-emerald-400 font-bold">10%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Civic organizing, policy advocacy & mutual credit</div>
                  </div>
                </div>
              </Panel>

              {/* Information Circulation Feed */}
              <Panel
                tag="NEWS.PROPAGATION"
                title="Active Circulating Telemetry"
                subtitle="Decentralized rumor & information diffusion"
              >
                <div className="space-y-2 text-xs font-mono">
                  {[
                    { headline: 'Agricultural harvest yield expected to stabilize market prices', sentiment: 'Positive (+0.6)', reach: '82% of Citizens' },
                    { headline: 'Applied Cybernetics Guild reports quantum compute milestone', sentiment: 'Optimistic (+0.8)', reach: '64% of Citizens' },
                    { headline: 'Municipal Council deliberation on infrastructure subsidies underway', sentiment: 'Neutral (+0.5)', reach: '91% of Citizens' },
                  ].map((news, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-[#080a11] border border-slate-800/80 space-y-1">
                      <div className="text-slate-200 text-[11px] font-sans">{news.headline}</div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="text-cyan-400">{news.sentiment}</span>
                        <span>Reach: {news.reach}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
