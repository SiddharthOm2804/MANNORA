import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Landmark, 
  Coins, 
  Heart, 
  GraduationCap, 
  Truck, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import { worldService } from '../services/worldService';
import { aiService } from '../services/aiService';

export default function GovernmentDashboard() {
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | policies | services | history
  const [taxRate, setTaxRate] = useState(15);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPolicyAdvice, setAiPolicyAdvice] = useState(null);

  // Policy registry & active state
  const [activePolicies, setActivePolicies] = useState([
    'pol_infra_transit',
    'pol_health_universal',
  ]);

  const [policyHistory, setPolicyHistory] = useState([
    {
      id: 'pol_init_01',
      name: 'Better Roads and Bus Service',
      action: 'ENACT',
      tick: 0,
      costPerTick: 45,
      category: 'infrastructure',
      timestamp: 'Sim Initialization',
    },
    {
      id: 'pol_init_02',
      name: 'Free Health Care',
      action: 'ENACT',
      tick: 0,
      costPerTick: 50,
      category: 'healthcare',
      timestamp: 'Sim Initialization',
    },
  ]);

  const [services, setServices] = useState([
    { key: 'healthcare', name: 'Health Care', allocation: 80, capacity: 1280, efficiency: 0.95, satisfaction: 88, icon: '🏥' },
    { key: 'education', name: 'Schools and Training', allocation: 65, capacity: 1050, efficiency: 0.85, satisfaction: 80, icon: '🎓' },
    { key: 'infrastructure', name: 'Roads and Public Transport', allocation: 90, capacity: 1450, efficiency: 0.92, satisfaction: 86, icon: '🚆' },
    { key: 'resources', name: 'Water and Power', allocation: 50, capacity: 1200, efficiency: 0.82, satisfaction: 81, icon: '⚡' },
    { key: 'emergency', name: 'Emergency Services', allocation: 45, capacity: 1500, efficiency: 0.90, satisfaction: 89, icon: '🛡️' },
  ]);

  // Load world data
  useEffect(() => {
    async function load() {
      const res = await worldService.getAllWorlds();
      if (res.success && res.data && res.data.length > 0) {
        setWorlds(res.data);
        setSelectedWorldId(res.data[0]._id);
      }
    }
    load();
  }, []);

  const activeWorld = worlds.find((w) => w._id === selectedWorldId) || worlds[0];
  const treasury = activeWorld?.economyConfiguration?.treasury || 50000;
  const population = activeWorld?.population || 1000;

  // Simulated Civic Approval Metric [0 - 100]
  const avgServiceSatisfaction = Math.round(
    services.reduce((acc, s) => acc + s.satisfaction, 0) / services.length
  );
  const taxPenalty = Math.max(0, (taxRate - 12) * 1.5);
  const approvalRating = Math.max(10, Math.min(100, Math.round(avgServiceSatisfaction * 0.5 + 45 - taxPenalty)));

  // Available policy catalog
  const policyCatalog = [
    {
      id: 'pol_infra_transit',
      name: 'Better Roads and Bus Service',
      category: 'infrastructure',
      description: 'Improves roads and bus routes so people and goods can get around faster.',
      costPerTick: 45,
      impact: 'More bus service and faster deliveries',
    },
    {
      id: 'pol_infra_arcology',
      name: 'Solar Panels and Water Saving',
      category: 'infrastructure',
      description: 'Adds solar panels and reuses water in homes and shops.',
      costPerTick: 35,
      impact: 'Less pollution and lower water use',
    },
    {
      id: 'pol_tax_progressive',
      name: 'Fair Income Tax',
      category: 'fiscal',
      description: 'Sets income tax to 18% and gives tax help to people with low incomes.',
      costPerTick: 0,
      impact: 'More money for city services; people may be less happy at first',
    },
    {
      id: 'pol_tax_freetrade',
      name: 'Support for Local Shops',
      category: 'fiscal',
      description: 'Lowers shop taxes to 11% to help local businesses grow and hire people.',
      costPerTick: 0,
      impact: 'More local shops and jobs',
    },
    {
      id: 'pol_health_universal',
      name: 'Free Health Care',
      category: 'healthcare',
      description: 'Gives everyone free check-ups and safe drinking water.',
      costPerTick: 50,
      impact: 'Better health and fewer deaths from illness',
    },
    {
      id: 'pol_edu_academy',
      name: 'Skills and Training Centre',
      category: 'education',
      description: 'Pays for schools and job training.',
      costPerTick: 40,
      impact: 'More skills and better job options',
    },
    {
      id: 'pol_res_strategic',
      name: 'Save Water and Power for Emergencies',
      category: 'resources',
      description: 'Keeps water, power, and food costs steady when supplies run low.',
      costPerTick: 30,
      impact: 'Fewer sudden price rises during shortages',
    },
    {
      id: 'pol_emg_failsafe',
      name: 'Emergency Help Plan',
      category: 'emergency',
      description: 'Keeps emergency supplies ready and helps people after a disaster.',
      costPerTick: 25,
      impact: 'Less damage when a disaster happens',
    },
  ];

  const handleTogglePolicy = (policy) => {
    const isActive = activePolicies.includes(policy.id);
    const action = isActive ? 'REPEAL' : 'ENACT';

    if (isActive) {
      setActivePolicies(activePolicies.filter((id) => id !== policy.id));
    } else {
      setActivePolicies([...activePolicies, policy.id]);
    }

    const logEntry = {
      id: `pol_log_${Date.now()}`,
      name: policy.name,
      action,
      tick: 142,
      costPerTick: policy.costPerTick,
      category: policy.category,
      timestamp: new Date().toLocaleTimeString(),
    };

    setPolicyHistory([logEntry, ...policyHistory]);
  };

  const handleServiceAllocationChange = (key, delta) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.key === key) {
          const newAlloc = Math.max(10, s.allocation + delta);
          const newCap = Math.round(newAlloc * 16);
          const newSat = Math.min(100, Math.round(s.satisfaction + delta * 0.2));
          return { ...s, allocation: newAlloc, capacity: newCap, satisfaction: newSat };
        }
        return s;
      })
    );
  };

  const handleRequestAiAdvisory = async () => {
    setIsAiLoading(true);
    const res = await aiService.evaluateGovernmentPolicy({
      population,
      stability: approvalRating,
      happiness: avgServiceSatisfaction,
      treasury,
      taxRate: taxRate / 100,
    });
    if (res.success && res.data) {
      setAiPolicyAdvice(res.data);
    }
    setIsAiLoading(false);
  };

  const totalPolicyExpenditure = activePolicies.reduce((acc, id) => {
    const p = policyCatalog.find((item) => item.id === id);
    return acc + (p?.costPerTick || 0);
  }, 0);

  const totalServiceExpenditure = services.reduce((acc, s) => acc + s.allocation, 0);
  const totalGovernmentExpenses = totalPolicyExpenditure + totalServiceExpenditure;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Landmark className="w-3.5 h-3.5" />
            <span>CITY GOVERNMENT & RULES // PHASE 10</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[10px] uppercase">
              VIRTUAL CITY SIMULATION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Government Rules & Public Services
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage city taxes, public services like hospitals and schools, and active government rules.
          </p>
        </div>

        {/* AI Policy Advisory Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestAiAdvisory}
            disabled={isAiLoading}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 border border-purple-700/80 text-purple-200 font-mono text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAiLoading ? 'Thinking...' : 'Ask AI City Assistant'}</span>
          </button>
        </div>
      </div>

      {/* AI Policy Advisory Notification Banner */}
      {aiPolicyAdvice && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#0d121f] to-slate-900 border border-purple-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-purple-300 font-mono font-bold flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI City Assistant Advice</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700 font-mono">
              {aiPolicyAdvice.source || 'ai_assistant'}
            </span>
          </div>
          <p className="text-slate-200 text-xs font-sans italic">
            "{aiPolicyAdvice.assessment}"
          </p>
          {Array.isArray(aiPolicyAdvice.recommendations) && (
            <div className="pt-2 border-t border-purple-900/50 space-y-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase">Suggested Actions:</div>
              <ul className="text-xs font-mono text-slate-300 list-disc list-inside space-y-0.5">
                {aiPolicyAdvice.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Metric Cards (Phase 10 Governance Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Citizen Satisfaction"
          code="GOV.APPRV.01"
          value={`${approvalRating}%`}
          delta={2.1}
          trend={approvalRating > 60 ? 'up' : 'down'}
          subtitle="Public Trust in Government"
          icon={<Heart className="w-4 h-4 text-rose-400" />}
          sparkline={[72, 74, 76, 77, approvalRating]}
        />

        <MetricCard
          label="City Bank Balance"
          code="GOV.TRES.02"
          value={`${treasury.toLocaleString()} ₹`}
          delta={-1.5}
          trend="neutral"
          subtitle={`Running Cost: -${totalGovernmentExpenses} ₹/day`}
          icon={<Coins className="w-4 h-4 text-emerald-400" />}
          sparkline={[54000, 53200, 52100, 51000, treasury]}
        />

        <MetricCard
          label="Public Service Quality"
          code="GOV.SERV.03"
          value={`${avgServiceSatisfaction}/100`}
          delta={3.4}
          trend="up"
          subtitle="Average Quality of City Services"
          icon={<Building2 className="w-4 h-4 text-cyan-400" />}
          sparkline={[78, 80, 82, 84, avgServiceSatisfaction]}
        />

        <MetricCard
          label="City Tax Rate"
          code="GOV.TAX.04"
          value={`${taxRate}%`}
          delta={0}
          trend="neutral"
          subtitle="Income Tax on Citizens"
          icon={<Sliders className="w-4 h-4 text-amber-400" />}
          sparkline={[14, 15, 15, 15, taxRate]}
        />
      </div>

      {/* Main Governance Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Policy Registry & Legislative Chamber (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel
            tag="CITY.RULES"
            title="City Rules"
            subtitle={`${activePolicies.length} Rules now in place in the city`}
          >
            <div className="space-y-3">
              {policyCatalog.map((policy) => {
                const isActive = activePolicies.includes(policy.id);

                return (
                  <div
                    key={policy.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-[#0f1424] border-cyan-500/70 shadow-sm shadow-cyan-950/20'
                        : 'bg-[#080a11] border-[#1a2233] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${
                            isActive
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {policy.category}
                          </span>
                          <span className="text-sm font-semibold text-white truncate">
                            {policy.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans mt-1">
                          {policy.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-mono mt-2 text-slate-400">
                          <span>Cost: <strong className="text-amber-400">{policy.costPerTick} ₹/day</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Impact: {policy.impact}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePolicy(policy)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                          isActive
                            ? 'bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300'
                            : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300'
                        }`}
                      >
                        {isActive ? 'Stop Rule' : 'Apply Rule'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Legislative Event History Log */}
          <Panel
            tag="RULES.HISTORY"
            title="Past Rule Changes"
            subtitle="When each rule started or stopped"
          >
            <div className="space-y-2 text-xs font-mono">
              {policyHistory.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded bg-[#080a11] border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      log.action === 'ENACT'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {log.action === 'ENACT' ? 'STARTED' : 'STOPPED'}
                    </span>
                    <span className="text-white truncate font-medium">{log.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">
                    Day #{log.tick} • {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right: Public Services & Budget Solvency (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            tag="PUBLIC.SERVICES"
            title="Public Services"
            subtitle="Money spent and how well each service works"
          >
            <div className="space-y-3.5">
              {services.map((s) => (
                <div
                  key={s.key}
                  className="p-3.5 rounded-lg bg-[#080a11] border border-[#1a2233] space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icon}</span>
                      <span className="font-semibold text-white">{s.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{s.satisfaction}% Happy</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div>Budget: <strong className="text-cyan-400">{s.allocation} ₹/day</strong></div>
                    <div>Capacity: <strong className="text-slate-200">{s.capacity} People</strong></div>
                  </div>

                  {/* Budget Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Change Budget:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleServiceAllocationChange(s.key, -10)}
                        className="w-6 h-6 rounded bg-[#121726] hover:bg-[#1a2238] border border-slate-700 text-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleServiceAllocationChange(s.key, 10)}
                        className="w-6 h-6 rounded bg-[#121726] hover:bg-[#1a2238] border border-slate-700 text-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tax Code Regulation Panel */}
          <Panel
            tag="CITY.TAX"
            title="Income Tax"
            subtitle="Change how much tax people pay"
          >
            <div className="p-3.5 rounded-lg bg-[#080a11] border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Current Tax Rate:</span>
                <span className="text-cyan-400 font-bold text-base">{taxRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5% (Lower Revenue / Happier People)</span>
                <span>35% (Higher Revenue / Less Happy)</span>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
