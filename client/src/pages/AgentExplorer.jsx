import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Activity, 
  Heart, 
  Zap, 
  Coins, 
  Brain, 
  Clock, 
  Compass, 
  CheckCircle2, 
  ChevronRight,
  Shield,
  ArrowRight
} from 'lucide-react';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';

export default function AgentExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAgentId, setSelectedAgentId] = useState('agt_001');

  const agents = [
    {
      id: 'agt_001',
      name: 'Dr. Evelyn Voss',
      role: 'OBSERVER',
      status: 'active',
      happiness: 92,
      energy: 88,
      wealth: 18400,
      sector: 'Sector-05 // Biosphere',
      currentAction: 'ANALYZING_THERMODYNAMIC_ENTROPY',
      traits: { rationality: 0.95, ambition: 0.82, riskTolerance: 0.35, socialAffinity: 0.64 },
      workingMemory: [
        { time: 'TICK #1419', observation: 'Detected 0.02% temperature drop in North Biosphere corridor.' },
        { time: 'TICK #1412', observation: 'Processed consensus report from Technocratic Council.' },
        { time: 'TICK #1398', observation: 'Exchanged research telemetry with Citizen agt_042.' },
      ],
      goals: [
        { level: 'PRIMARY', title: 'Maintain Systemic Thermodynamic Equilibrium', progress: 85 },
        { level: 'SECONDARY', title: 'Catalogue Emergent Trade Behavioral Anomalies', progress: 42 },
      ],
    },
    {
      id: 'agt_042',
      name: 'Kaelen Rask',
      role: 'MERCHANT',
      status: 'active',
      happiness: 84,
      energy: 74,
      wealth: 92500,
      sector: 'Sector-03 // Exchange',
      currentAction: 'NEGOTIATING_ENERGY_CONTRACT',
      traits: { rationality: 0.88, ambition: 0.91, riskTolerance: 0.72, socialAffinity: 0.85 },
      workingMemory: [
        { time: 'TICK #1418', observation: 'Subscribed to Municipal Solar Grid surplus bid.' },
        { time: 'TICK #1405', observation: 'Settled trade arbitrage with Sector 02 manufacturing node.' },
      ],
      goals: [
        { level: 'PRIMARY', title: 'Accumulate Capital Liquidity for Sector 03 Warehouse', progress: 70 },
      ],
    },
    {
      id: 'agt_088',
      name: 'Governor Linnea Sol',
      role: 'GOVERNOR',
      status: 'voting',
      happiness: 79,
      energy: 82,
      wealth: 45000,
      sector: 'Sector-01 // Council Core',
      currentAction: 'TABULATING_ENERGY_SUBSIDY_VOTES',
      traits: { rationality: 0.92, ambition: 0.78, riskTolerance: 0.40, socialAffinity: 0.90 },
      workingMemory: [
        { time: 'TICK #1420', observation: 'Ratified Council Resolution #14 for Energy Subsidies.' },
        { time: 'TICK #1410', observation: 'Reviewed public satisfaction metrics from Sector 04.' },
      ],
      goals: [
        { level: 'PRIMARY', title: 'Preserve Civil Harmony Above 80% Index', progress: 88 },
      ],
    },
    {
      id: 'agt_104',
      name: 'Tarek Chen',
      role: 'CITIZEN',
      status: 'resting',
      happiness: 81,
      energy: 95,
      wealth: 12800,
      sector: 'Sector-04 // Residential',
      currentAction: 'RESTORING_HOMEOSTATIC_ENERGY',
      traits: { rationality: 0.75, ambition: 0.55, riskTolerance: 0.30, socialAffinity: 0.78 },
      workingMemory: [
        { time: 'TICK #1415', observation: 'Completed work cycle at Sector 02 Industrial Hub.' },
        { time: 'TICK #1401', observation: 'Purchased bio-synthetic rations from Merchant node.' },
      ],
      goals: [
        { level: 'PRIMARY', title: 'Acquire Residential Terrace Permit', progress: 54 },
      ],
    },
  ];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || agent.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Users className="w-3.5 h-3.5" />
            <span>MULTI-AGENT POPULATION REGISTRY</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Cognitive Agent Explorer
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time inspection of autonomous cognitive states, memory buffers, and emergent behavior trees.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agent ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0e121d] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#0e121d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CITIZEN">Citizens</option>
            <option value="MERCHANT">Merchants</option>
            <option value="GOVERNOR">Governors</option>
            <option value="OBSERVER">Observers</option>
          </select>
        </div>
      </div>

      {/* Directory & Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Agent Roster List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
            Population Roster ({filteredAgents.length} Agents)
          </div>

          <div className="space-y-2">
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#121726] border-cyan-500/80 shadow-md shadow-cyan-600/10'
                      : 'bg-[#0d101a] border-[#1a2233] hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                          {agent.id}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {agent.name}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        ROLE: <span className="text-slate-200">{agent.role}</span> • {agent.sector}
                      </div>
                    </div>

                    <StatusIndicator
                      status={agent.status === 'active' ? 'simulating' : 'idle'}
                      label={agent.status.toUpperCase()}
                      size="sm"
                      pulse={agent.status === 'active'}
                    />
                  </div>

                  {/* Vitals Mini-Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      <span>{agent.happiness}%</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{agent.energy}%</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-400" />
                      <span>{agent.wealth.toLocaleString()} NC</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Agent Cognitive Dossier (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Panel
            tag={`DOSSIER // ${activeAgent.id}`}
            title={activeAgent.name}
            subtitle={`Role: ${activeAgent.role} • Location: ${activeAgent.sector}`}
            actions={
              <StatusIndicator
                status={activeAgent.status === 'active' ? 'simulating' : 'idle'}
                label={activeAgent.status.toUpperCase()}
              />
            }
          >
            <div className="space-y-5 text-xs font-mono">
              
              {/* Current Autonomous Action */}
              <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Active Cognitive Action
                </div>
                <div className="text-sm font-bold text-cyan-300 font-mono">
                  {activeAgent.currentAction}
                </div>
              </div>

              {/* Cognitive Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                  <div className="text-[10px] text-slate-400">SATISFACTION</div>
                  <div className="text-base font-bold text-white font-mono-data mt-0.5">
                    {activeAgent.happiness}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                  <div className="text-[10px] text-slate-400">ENERGY RESERVES</div>
                  <div className="text-base font-bold text-white font-mono-data mt-0.5">
                    {activeAgent.energy}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                  <div className="text-[10px] text-slate-400">ACCUMULATED WEALTH</div>
                  <div className="text-base font-bold text-emerald-400 font-mono-data mt-0.5">
                    {activeAgent.wealth.toLocaleString()} NC
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                  <div className="text-[10px] text-slate-400">RATIONALITY INDEX</div>
                  <div className="text-base font-bold text-cyan-400 font-mono-data mt-0.5">
                    {(activeAgent.traits.rationality * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Active Goal Tree */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Goal Hierarchy & Intentions
                </div>
                {activeAgent.goals.map((goal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                        {goal.level}
                      </span>
                      <span className="text-cyan-400 font-mono-data">{goal.progress}% complete</span>
                    </div>
                    <div className="text-white text-xs font-sans">{goal.title}</div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Working Memory Stream Buffer */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Working Memory Stream Buffer (Latest Observations)
                </div>
                <div className="space-y-1.5">
                  {activeAgent.workingMemory.map((mem, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-[#080a11] border border-slate-800/80 text-[11px] font-mono flex items-start gap-2.5"
                    >
                      <span className="text-cyan-400 shrink-0 font-semibold">{mem.time}</span>
                      <span className="text-slate-300 font-sans">{mem.observation}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
