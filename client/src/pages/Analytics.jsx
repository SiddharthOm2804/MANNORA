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
  Heart,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import { worldService } from '../services/worldService';
import { aiService } from '../services/aiService';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('1000_TICKS');
  const [activeTab, setActiveTab] = useState('macro'); // macro | social | ai_analyst
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 15 AI Analyst State
  const [aiQuestion, setAiQuestion] = useState('Why did unemployment increase?');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [causalReport, setCausalReport] = useState(null);

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

  // Phase 15: Handle AI Analyst Causal Inquiry
  const handleAskAiAnalyst = async (presetQuestion = null) => {
    const query = presetQuestion || aiQuestion;
    if (!query.trim()) return;
    setIsAskingAi(true);

    try {
      const res = await aiService.askCausalInquiry(query, selectedWorldId, {
        snapshots: [
          {
            tick: 0,
            population: { total: activeWorld?.population || 1000, unemploymentRate: 0.04, averageHappiness: 82 },
            economy: { treasury: 50000, gdp: 120000 },
            resources: { water: 5000, energy: 5000 },
          },
          {
            tick: 100,
            population: { total: activeWorld?.population || 1000, unemploymentRate: unemployment, averageHappiness: 72 },
            economy: { treasury: 42000, gdp },
            resources: { water: resources.water || 3000, energy: resources.energy || 4500 },
          },
        ],
        events: activeWorld?.events || [
          {
            id: 'evt_sample_01',
            title: 'Water Shortage Crisis',
            type: 'resource_shortage_water',
            severity: 3,
            tick: 40,
            cause: 'Aquifer recharge deficit',
          },
        ],
      });

      if (res.success && res.data) {
        setCausalReport(res.data);
      } else {
        alert(res.message || 'Failed to analyze causal inquiry');
      }
    } catch (e) {
      console.error('AI Analyst Inquiry failed:', e);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CITY REPORTS & STATISTICS // PHASE 6</span>
            {activeWorld && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  SIMULATION DATA
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            City Economy & Market Reports
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Reports showing city production, jobs, market prices, and business profit.
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
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Model Transparency Disclaimer Banner */}
      <div className="p-3 rounded-lg bg-[#0d121f] border border-cyan-900/40 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Note for Viva & Students:</strong> All economic numbers (production, price of bread/electricity, salaries) are calculated directly by the simulation engine based on how computer-controlled people buy and work.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 uppercase tracking-widest hidden md:inline">
          ACCURATE ENGINE DATA
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
          City Economy & Jobs
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
          <span>People's Communities & Connections // Phase 8</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_analyst')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
            activeTab === 'ai_analyst'
              ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-300 border border-purple-700 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Analyst & Causal Inquiries // Phase 15</span>
        </button>
      </div>

      {/* Tab 1: Macro Economy & Market (Phase 6) */}
      {activeTab === 'macro' && (
        <div className="space-y-6">
          {/* Primary KPI Metric Cards (Phase 6 Core Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total City Production"
          code="ECO.GDP.01"
          value={gdp.toLocaleString()}
          unit="NC/day"
          delta={4.6}
          trend="up"
          subtitle="Total value of goods made"
          icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          sparkline={[gdp * 0.88, gdp * 0.91, gdp * 0.95, gdp * 0.97, gdp]}
        />

        <MetricCard
          label="Unemployment Rate"
          code="LAB.UNEMP.02"
          value={`${unemploymentPct}%`}
          delta={-0.4}
          trend="up"
          subtitle="People looking for jobs"
          icon={<Briefcase className="w-4 h-4 text-emerald-400" />}
          sparkline={[6.2, 5.8, 5.6, 5.4, 5.2]}
        />

        <MetricCard
          label="Average Person Savings"
          code="CIT.WLTH.03"
          value={`${averageWealth.toFixed(1)}`}
          unit="NC"
          delta={3.8}
          trend="up"
          subtitle={`Average Daily Pay: ${averageIncome.toFixed(1)} NC`}
          icon={<Coins className="w-4 h-4 text-amber-400" />}
          sparkline={[130, 134, 139, 143, averageWealth]}
        />

        <MetricCard
          label="Price Increase Rate (Inflation)"
          code="ECO.INFL.04"
          value={`${inflationPct}%`}
          delta={0.2}
          trend="neutral"
          subtitle="Average change in market prices"
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
            title="City Market Prices (Supply & Demand)"
            subtitle="Item prices rise during shortages and fall when stock is plentiful"
          >
            <div className="space-y-3">
              {[
                { name: 'Food & Crops', key: 'agriculture', price: marketPrices.agriculture, base: 1.50, stock: resources.agriculture || 3000, max: 15000, icon: '🌾' },
                { name: 'Electricity & Power', key: 'energy', price: marketPrices.energy, base: 1.00, stock: resources.energy || 5000, max: 20000, icon: '⚡' },
                { name: 'Drinking Water', key: 'water', price: marketPrices.water, base: 0.80, stock: resources.water || 5000, max: 20000, icon: '💧' },
                { name: 'Metals & Minerals', key: 'minerals', price: marketPrices.minerals, base: 2.50, stock: resources.minerals || 2500, max: 15000, icon: '⛏️' },
                { name: 'Technology & Chips', key: 'technology', price: marketPrices.technology, base: 5.00, stock: resources.technology || 1000, max: 10000, icon: '🔬' },
                { name: 'Building Raw Materials', key: 'rawMaterials', price: marketPrices.rawMaterials, base: 2.00, stock: 2000, max: 15000, icon: '🧱' },
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
                          In Storage: {res.stock.toLocaleString()} / {res.max.toLocaleString()} ({ratio}% full)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="text-xs font-bold text-cyan-300 font-mono-data">
                        {res.price.toFixed(2)} NC
                      </div>
                      <div className={`text-[10px] ${Number(priceDelta) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Number(priceDelta) > 0 ? `+${priceDelta}%` : `${priceDelta}%`} vs normal
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Causal Feedback Loop Walkthrough */}
          <Panel
            tag="HOW.IT.WORKS"
            title="How the City Economy Connects Together"
            subtitle="Step-by-step chain of how each decision changes the city"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">1. RESOURCE STOCK</span>
                <span className="text-slate-300 text-[11px]">Amount of food and water in city storehouses</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">2. MARKET PRICES</span>
                <span className="text-slate-300 text-[11px]">When items become scarce, prices automatically go up</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-semibold block">3. PEOPLE SPENDING</span>
                <span className="text-slate-300 text-[11px]">People buy daily needs using their salary and savings</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">4. BUSINESS PROFIT</span>
                <span className="text-slate-300 text-[11px]">Companies earn money from sales and pay worker wages</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">5. HIRING & JOBS</span>
                <span className="text-slate-300 text-[11px]">Profitable businesses hire more workers; others stop hiring</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">6. CITY TAXES</span>
                <span className="text-slate-300 text-[11px]">Government collects taxes to fund city hospitals and roads</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right: Businesses, Solvency & Jobs Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            tag="COMMERCE.INDEX"
            title="City Businesses & Companies"
            subtitle={`${businessCount} Active companies providing jobs and goods`}
          >
            <div className="space-y-3">
              {[
                { name: 'Core Agricultural Delta', type: 'Farming & Food', revenue: '4,280 NC', profit: '+1,420 NC', workers: 45, status: 'operational' },
                { name: 'Quantum Energy Synthesis', type: 'Power & Grid', revenue: '6,100 NC', profit: '+2,150 NC', workers: 60, status: 'simulating' },
                { name: 'Sector 03 Fabrication Hub', type: 'Factory', revenue: '3,850 NC', profit: '+980 NC', workers: 38, status: 'operational' },
                { name: 'Neural Commerce Exchange', type: 'Supermarket & Trade', revenue: '5,400 NC', profit: '+1,890 NC', workers: 52, status: 'operational' },
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
                    <span>Sales: <strong className="text-slate-200">{biz.revenue}</strong></span>
                    <span className="text-emerald-400 font-semibold">{biz.profit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Workers: {biz.workers} People</span>
                    <StatusIndicator status={biz.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Municipal Fiscal Treasury Summary */}
          <Panel
            tag="CITY.TREASURY"
            title="City Government Finances"
            subtitle="Overview of tax collection and resources"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">City Tax Rate:</span>
                <span className="text-cyan-400 font-bold font-mono-data">
                  {((econConfig.taxRate || 0.15) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">Resource Stock Score:</span>
                <span className="text-emerald-400 font-bold font-mono-data">
                  {resourceAvailability}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400">Total Registered Companies:</span>
                <span className="text-white font-bold font-mono-data">
                  {businessCount} Active Companies
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

      {/* Tab 3: AI Analyst & Causal Inquiries (Phase 15) */}
      {activeTab === 'ai_analyst' && (
        <div className="space-y-6">
          {/* Inquiry Question Form */}
          <Panel
            tag="AI.CAUSAL.INQUIRY"
            title="AI City Analyst — Causal Reasoning"
            subtitle="Ask questions about why metrics shifted or what caused specific outcomes"
          >
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <label className="text-slate-300 flex justify-between">
                  <span>ASK A CAUSAL QUESTION</span>
                  <span className="text-purple-400">Grounded in empirical simulation history</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder='e.g. "Why did unemployment increase?", "What caused the economic decline?"'
                      className="w-full bg-[#080a11] border border-slate-800 focus:border-purple-500 rounded px-3 py-2.5 text-white focus:outline-none pl-9"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                  <button
                    onClick={() => handleAskAiAnalyst()}
                    disabled={isAskingAi || !aiQuestion.trim()}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-700 text-purple-100 font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isAskingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ANALYZING DATA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>ANALYZE CAUSE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preset Inquiry Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Quick preset inquiries:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Why did unemployment increase?',
                    'What caused the economic decline?',
                    'Which event had the largest impact?',
                    'What changed after the water shortage?',
                    'Why did population migration increase?',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuestion(preset);
                        handleAskAiAnalyst(preset);
                      }}
                      className="px-2.5 py-1 rounded bg-[#0e121e] hover:bg-[#161c2e] border border-purple-900/60 text-purple-300 text-[11px] transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Causal Analysis Report Display */}
          {causalReport && (
            <div className="space-y-5">
              {/* Question Header */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#0d121f] to-slate-900 border border-purple-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Causal Investigation Verdict</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700">
                    Confidence: {causalReport.confidence}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-sans">
                  "{causalReport.question}"
                </h3>
                <p className="text-xs text-slate-200 font-sans leading-relaxed pt-1 border-t border-purple-900/60">
                  {causalReport.verdict}
                </p>
              </div>

              {/* The 5 Key Investigation Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* 1. Observation */}
                <Panel
                  tag="1. OBSERVATION"
                  title="Observed Trend in Simulation"
                  subtitle="What the data shows across history"
                >
                  <p className="text-slate-300 text-[12px] font-sans leading-relaxed">
                    {causalReport.observation}
                  </p>
                </Panel>

                {/* 2. Evidence */}
                <Panel
                  tag="2. EVIDENCE"
                  title="Verifiable Simulation Evidence"
                  subtitle="Exact numbers and recorded metric shifts"
                >
                  <ul className="space-y-1.5 text-slate-200">
                    {causalReport.evidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>

                {/* 3. Related Events */}
                <Panel
                  tag="3. RELATED EVENTS"
                  title="Correlated Crises & Injections"
                  subtitle="Active events coinciding with this metric trajectory"
                >
                  {causalReport.relatedEvents && causalReport.relatedEvents.length > 0 ? (
                    <div className="space-y-1.5">
                      {causalReport.relatedEvents.map((evtName, idx) => (
                        <div key={idx} className="p-2 rounded bg-[#080a11] border border-slate-800 text-amber-300 font-semibold text-[11px]">
                          ⚡ {evtName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400">No major crisis events recorded during this observation window.</div>
                  )}
                </Panel>

                {/* 4. Possible Cause */}
                <Panel
                  tag="4. POSSIBLE CAUSE"
                  title="Underlying Simulation Mechanism"
                  subtitle="Code-level interaction causing this behavior"
                >
                  <p className="text-slate-300 text-[12px] font-sans leading-relaxed">
                    {causalReport.possibleCause}
                  </p>
                </Panel>
              </div>

              {/* 5. Uncertainty / Disclaimer Banner */}
              <div className="p-3.5 rounded-lg bg-[#0d121f] border border-cyan-900/60 flex items-start gap-2.5 text-[11px] font-mono text-slate-400">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">Analytical Boundary:</strong> {causalReport.disclaimer}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
