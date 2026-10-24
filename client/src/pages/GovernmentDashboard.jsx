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
      name: 'High-Throughput Arterial Transit Grid',
      action: 'ENACT',
      tick: 0,
      costPerTick: 45,
      category: 'infrastructure',
      timestamp: 'Sim Initialization',
    },
    {
      id: 'pol_init_02',
      name: 'Comprehensive Bio-Synthetic Healthcare',
      action: 'ENACT',
      tick: 0,
      costPerTick: 50,
      category: 'healthcare',
      timestamp: 'Sim Initialization',
    },
  ]);

  const [services, setServices] = useState([
    { key: 'healthcare', name: 'Municipal Healthcare & Bio-Synthetics', allocation: 80, capacity: 1280, efficiency: 0.95, satisfaction: 88, icon: '🏥' },
    { key: 'education', name: 'Civic Education & Technical Academies', allocation: 65, capacity: 1050, efficiency: 0.85, satisfaction: 80, icon: '🎓' },
    { key: 'infrastructure', name: 'Grid Logistics & Transit Infrastructure', allocation: 90, capacity: 1450, efficiency: 0.92, satisfaction: 86, icon: '🚆' },
    { key: 'resources', name: 'Public Utility & Strategic Buffers', allocation: 50, capacity: 1200, efficiency: 0.82, satisfaction: 81, icon: '⚡' },
    { key: 'emergency', name: 'Civil Protection & Emergency Response', allocation: 45, capacity: 1500, efficiency: 0.90, satisfaction: 89, icon: '🛡️' },
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
      name: 'High-Throughput Arterial Transit Grid',
      category: 'infrastructure',
      description: 'Expands transit and logistical corridors, increasing building efficiency and civic mobility.',
      costPerTick: 45,
      impact: '+15% Transit Capacity, +8% Productivity',
    },
    {
      id: 'pol_infra_arcology',
      name: 'Ecological Arcology Renovation Act',
      category: 'infrastructure',
      description: 'Mandates solar tiles and water recycling on all commercial and residential structures.',
      costPerTick: 35,
      impact: '-4 Pollution Index, +8 Sustainability',
    },
    {
      id: 'pol_tax_progressive',
      name: 'Syntropic Progressive Dividend Tax',
      category: 'fiscal',
      description: 'Adjusts statutory tax rate to 18% with targeted poverty tax credits.',
      costPerTick: 0,
      impact: '+20% Public Revenue, -1% Short-Term Happiness',
    },
    {
      id: 'pol_tax_freetrade',
      name: 'Special Economic Enterprise Zone',
      category: 'fiscal',
      description: 'Lowers corporate tax rate to 11% to stimulate venture formation and employment.',
      costPerTick: 0,
      impact: '+25% Business Formation, +2% Satisfaction',
    },
    {
      id: 'pol_health_universal',
      name: 'Comprehensive Bio-Synthetic Healthcare',
      category: 'healthcare',
      description: 'Free preventative clinic access, genetic repair therapies, and water inspection.',
      costPerTick: 50,
      impact: '+6 Public Health, -40% Famine/Disease Mortality',
    },
    {
      id: 'pol_edu_academy',
      name: 'Universal Vocational & Cybernetics Academy',
      category: 'education',
      description: 'Public education funding accelerating scientific discovery and worker craftsmanship.',
      costPerTick: 40,
      impact: '+25% Skill Growth Rate, +15% Tech Yield',
    },
    {
      id: 'pol_res_strategic',
      name: 'Strategic Resource Buffer Mandate',
      category: 'resources',
      description: 'Subsidizes base electricity and agricultural tariffs to protect against market shortages.',
      costPerTick: 30,
      impact: '-12% Commodity Price Spikes, Deficit Protection',
    },
    {
      id: 'pol_emg_failsafe',
      name: 'Civil Protection & Crisis Protocol',
      category: 'emergency',
      description: 'Maintains automated disaster response relays and reserve emergency supplies.',
      costPerTick: 25,
      impact: '-40% Disaster Damage, Stability Floor 65',
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
            <span>CIVIC GOVERNANCE ENGINE // PHASE 10</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[10px] uppercase">
              FICTIONAL SIMULATION MODEL
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Government & Civic Policy Directorate
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Administer taxation, infrastructure investment, public service delivery, and regulatory enactments.
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
            <span>{isAiLoading ? 'Synthesizing...' : 'AI Council Advisory'}</span>
          </button>
        </div>
      </div>

      {/* AI Policy Advisory Notification Banner */}
      {aiPolicyAdvice && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#0d121f] to-slate-900 border border-purple-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-purple-300 font-mono font-bold flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Government AI Advisory Resolution</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700 font-mono">
              {aiPolicyAdvice.source || 'llm_cognitive_assistant'}
            </span>
          </div>
          <p className="text-slate-200 text-xs font-sans italic">
            "{aiPolicyAdvice.assessment}"
          </p>
          {Array.isArray(aiPolicyAdvice.recommendations) && (
            <div className="pt-2 border-t border-purple-900/50 space-y-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase">Policy Directives:</div>
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
          label="Civic Approval Rating"
          code="GOV.APPRV.01"
          value={`${approvalRating}%`}
          delta={2.1}
          trend={approvalRating > 60 ? 'up' : 'down'}
          subtitle="Citizen Public Confidence"
          icon={<Heart className="w-4 h-4 text-rose-400" />}
          sparkline={[72, 74, 76, 77, approvalRating]}
        />

        <MetricCard
          label="Municipal Treasury"
          code="GOV.TRES.02"
          value={`${treasury.toLocaleString()} NC`}
          delta={-1.5}
          trend="neutral"
          subtitle={`Net Burn: -${totalGovernmentExpenses} NC/t`}
          icon={<Coins className="w-4 h-4 text-emerald-400" />}
          sparkline={[54000, 53200, 52100, 51000, treasury]}
        />

        <MetricCard
          label="Public Service Quality"
          code="GOV.SERV.03"
          value={`${avgServiceSatisfaction}/100`}
          delta={3.4}
          trend="up"
          subtitle="Composite Service Index"
          icon={<Building2 className="w-4 h-4 text-cyan-400" />}
          sparkline={[78, 80, 82, 84, avgServiceSatisfaction]}
        />

        <MetricCard
          label="Statutory Tax Rate"
          code="GOV.TAX.04"
          value={`${taxRate}%`}
          delta={0}
          trend="neutral"
          subtitle="Civilian Income Tariff"
          icon={<Sliders className="w-4 h-4 text-amber-400" />}
          sparkline={[14, 15, 15, 15, taxRate]}
        />
      </div>

      {/* Main Governance Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Policy Registry & Legislative Chamber (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel
            tag="POLICY.DIRECTIVES"
            title="Legislative Policy Registry"
            subtitle={`${activePolicies.length} Active decrees modifying civilization variables`}
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
                          <span>Cost: <strong className="text-amber-400">{policy.costPerTick} NC/t</strong></span>
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
                        {isActive ? 'Repeal Policy' : 'Enact Decree'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Legislative Event History Log */}
          <Panel
            tag="GOVERNANCE.LOG"
            title="Legislative History & Policy Transitions"
            subtitle="Audited simulation events recorded on every policy enactment or repeal"
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
                      {log.action}
                    </span>
                    <span className="text-white truncate font-medium">{log.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">
                    Tick #{log.tick} • {log.timestamp}
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
            title="Municipal Public Services Delivery"
            subtitle="Operational allocations, citizen capacities, and satisfaction scores"
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
                    <span className="text-emerald-400 font-bold">{s.satisfaction}% Sat</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div>Allocation: <strong className="text-cyan-400">{s.allocation} NC/t</strong></div>
                    <div>Capacity: <strong className="text-slate-200">{s.capacity} Citizens</strong></div>
                  </div>

                  {/* Budget Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Budget Adjustment:</span>
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
            tag="FISCAL.TAXATION"
            title="Municipal Tax Code & Fiscal Policy"
            subtitle="Adjust direct statutory tax rate across population"
          >
            <div className="p-3.5 rounded-lg bg-[#080a11] border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Statutory Tax Rate:</span>
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
                <span>5% (Low Revenue / High Morale)</span>
                <span>35% (High Revenue / Austerity)</span>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
