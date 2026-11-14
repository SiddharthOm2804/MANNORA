import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Zap, 
  Coins, 
  Heart, 
  Activity, 
  ShieldAlert, 
  Play, 
  Sliders, 
  Layers, 
  ArrowUpRight, 
  Clock,
  Compass,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  MapPin,
  Globe,
  Building2,
  Cpu
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import StatusIndicator from '../components/common/StatusIndicator';
import EmptyState from '../components/common/EmptyState';
import { worldService } from '../services/worldService';

export default function WorldDashboard() {
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch worlds from MongoDB backend
  const loadWorlds = async () => {
    setIsLoading(true);
    const res = await worldService.getAllWorlds();
    if (res.success && res.data && res.data.length > 0) {
      let savedWorlds = res.data;
      const spitiCity = savedWorlds.find((world) => world.name === 'Spiti Vally');
      const hasOldAreaNames = spitiCity?.cities?.some((city) =>
        /Capital Prime|Spiti Vally Core|Spiti Vally Station/.test(city.name)
      );
      const hasOldDescription = /high-altitude|Himalayan city/i.test(spitiCity?.description || '');

      if (spitiCity && (hasOldAreaNames || hasOldDescription)) {
        const placeNames = ['Kaza', 'Tabo', 'Dhankar', 'Kibber', 'Langza'];
        const updatedCities = spitiCity.cities.map((city, index) => ({
          ...city,
          name: placeNames[index] || `Spiti Area ${index + 1}`,
          specialization: ['Council and local shops', 'Farming and food', 'Schools and health care'][index % 3],
        }));
        const update = await worldService.updateWorld(spitiCity._id, {
          cities: updatedCities,
          description: 'A mountain city in Spiti with local jobs, services, and close-knit communities.',
        });
        if (update.success && update.data) {
          savedWorlds = savedWorlds.map((world) => world._id === spitiCity._id ? update.data : world);
        }
      }

      setWorlds(savedWorlds);
      setSelectedWorldId(savedWorlds[0]._id);
    } else {
      setWorlds([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorlds();
  }, []);

  const activeWorld = worlds.find((w) => w._id === selectedWorldId) || worlds[0];

  // Dynamic values or fallback
  const population = activeWorld?.population || 2500;
  const startingMoney = activeWorld?.economyConfiguration?.startingMoney || 650000;
  const energy = activeWorld?.resources?.energy || 6500;
  const cities = activeWorld?.cities || [];
  const industries = activeWorld?.economyConfiguration?.industries || [];
  const government = activeWorld?.governmentConfiguration?.type || 'Technocracy';
  const governmentLabel = ({ Technocracy: 'Expert-led council', 'Direct Democracy': 'Direct democracy', 'Autonomous Republic': 'Local republic', 'Corporate Guild': 'Business council', 'Algorithmic Syndicate': 'Data-led council' })[government] || government;
  const industryLabels = { 'Energy & Clean Fusion': 'Solar power', 'Robotics & Manufacturing': 'Local workshops', 'Advanced Cybernetics': 'Schools and research', 'Synthetic Bio-Agriculture': 'Farming and food', 'Financial Capital Markets': 'Local shops and trade', 'Quantum Logistics & Freight': 'Transport and delivery', 'Orbital Infrastructure': 'Public services' };
  const worldName = activeWorld?.name || 'Spiti Vally';
  const startingDate = activeWorld?.simulationSettings?.startingDate 
    ? new Date(activeWorld.simulationSettings.startingDate).toLocaleDateString()
    : '2085-01-01';

  const recentEvents = [
    { id: 'ev_01', tick: 1420, type: 'RULE', message: 'The council approved help with power bills.', time: '12 seconds ago' },
    { id: 'ev_02', tick: 1416, type: 'MARKET', message: 'Some shop prices rose because supplies were low.', time: '48 seconds ago' },
    { id: 'ev_03', tick: 1409, type: 'PEOPLE', message: 'People across the city feel 2.8% happier.', time: '2 minutes ago' },
    { id: 'ev_04', tick: 1395, type: 'NEW PEOPLE', message: `New residents settled in ${cities[0]?.name || 'Kaza'}.`, time: '4 minutes ago' },
    { id: 'ev_05', tick: 1380, type: 'WEATHER', message: 'The city cooled down and returned to normal.', time: '7 minutes ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Laboratory Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Globe className="w-3.5 h-3.5" />
            <span>CITY DASHBOARD & OVERVIEW</span>
            {activeWorld && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">SAVED</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {worldName}
            </h1>

            {worlds.length > 1 && (
              <select
                value={selectedWorldId || ''}
                onChange={(e) => setSelectedWorldId(e.target.value)}
                className="bg-[#0e121d] border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
              >
                {worlds.map((w) => (
                  <option key={w._id} value={w._id}>
                    Switch City: {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {activeWorld?.description || 'See the people, money, power, and recent events in your city.'}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/simulation')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold tracking-wider transition-colors shadow-sm shadow-cyan-600/25 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Open 3D City</span>
          </button>

          <button
            onClick={() => navigate('/create-world')}
            className="px-3 py-1.5 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-slate-700/80 text-cyan-300 font-mono text-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Create New City</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Population"
          code="CITY.POP.01"
          value={population.toLocaleString()}
          unit="People"
          delta={4.8}
          trend="up"
          subtitle={`Density: ${(population / 100).toFixed(1)} people/km²`}
          icon={<Users className="w-4 h-4 text-cyan-400" />}
          sparkline={[population * 0.8, population * 0.85, population * 0.9, population * 0.95, population]}
        />

        <MetricCard
          label="City Bank Balance"
          code="CITY.MONEY.02"
          value={startingMoney.toLocaleString()}
          unit="₹"
          delta={3.2}
          trend="up"
          subtitle="Money in the city account"
          icon={<Coins className="w-4 h-4 text-emerald-400" />}
          sparkline={[startingMoney * 0.9, startingMoney * 0.94, startingMoney * 0.98, startingMoney]}
        />

        <MetricCard
          label="Power Available"
          code="CITY.PWR.03"
          value={energy.toLocaleString()}
          unit="Units"
          delta={-0.6}
          trend="down"
          subtitle="Use: 1,120 Units/step"
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          sparkline={[energy * 1.1, energy * 1.05, energy * 1.02, energy]}
        />

        <MetricCard
          label="City Wellbeing"
          code="CITY.PEACE.04"
          value={activeWorld?.governmentConfiguration?.stabilityIndex || 85}
          unit="%"
          delta={1.5}
          trend="up"
          subtitle={`Government: ${governmentLabel}`}
          icon={<Heart className="w-4 h-4 text-rose-400" />}
          sparkline={[80, 82, 83, 85]}
        />
      </div>

      {/* Middle Section: Cities & Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Municipal Cities Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel
            tag="AREAS"
            title={`City Areas (${cities.length})`}
            subtitle="See the people who live in each area"
            actions={
              <button
                onClick={() => navigate('/create-world')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>New City</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {cities.length === 0 ? (
              <EmptyState
                title="No city areas yet"
                description="This city does not have any areas yet."
                actionLabel="Create New City"
                onAction={() => navigate('/create-world')}
              />
            ) : (
              <div className="space-y-3">
                {cities.map((city, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#080a11] border border-[#1a2233] flex items-center justify-between gap-4 transition-colors hover:border-slate-700/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {city.isCapital ? 'MAIN AREA' : `AREA-${idx + 1}`}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white tracking-wide truncate flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{city.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          People: <span className="text-slate-200 font-mono-data">{city.population.toLocaleString()}</span> • Location: [{city.coordinates?.x}, {city.coordinates?.y}]
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        {city.specialization}
                      </span>
                      <StatusIndicator
                        status={city.isCapital ? 'simulating' : 'operational'}
                        label={city.isCapital ? 'MAIN' : 'ACTIVE'}
                        size="sm"
                        pulse={city.isCapital}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Active Industries Badges */}
          <Panel
            tag="BUSINESSES"
            title="Shops and Workplaces"
            subtitle="Places where people work"
          >
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {industries.length === 0 ? (
                <span className="text-slate-400">Shops, farms, and public services</span>
              ) : (
                industries.map((ind) => (
                  <span
                    key={ind}
                    className="px-2.5 py-1 rounded bg-[#080a11] border border-cyan-800/40 text-cyan-300 font-mono text-[11px]"
                  >
                    {industryLabels[ind] || ind}
                  </span>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Right: Live Event Stream & Incident Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            tag="EVENTS"
            title="Recent City Events"
            subtitle="Recent changes in the city"
            actions={
              <button
                onClick={() => navigate('/timeline')}
                className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1"
              >
                <span>Time Machine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-3">
              {recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg bg-[#080a11] border border-[#1a2233] space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyan-400 font-semibold font-mono-data">
                      TICK #{ev.tick}
                    </span>
                    <span className="text-slate-400">{ev.time}</span>
                  </div>
                  <div className="text-slate-200 text-xs font-sans leading-snug">
                    {ev.message}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                    TYPE: <span className="text-slate-300 font-semibold">{ev.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Quick Lab Actions Panel */}
          <Panel
            tag="SHORTCUTS"
            title="Quick Shortcuts"
            subtitle="Jump directly to other city tools"
          >
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => navigate('/simulation')}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-left transition-colors flex items-center justify-between"
              >
                <span>3D City View</span>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => navigate('/create-world')}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-left transition-colors flex items-center justify-between"
              >
                <span>New City</span>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                onClick={() => navigate('/agents')}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-left transition-colors flex items-center justify-between"
              >
                <span>Manage People</span>
                <Users className="w-3.5 h-3.5 text-violet-400" />
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="p-2.5 rounded bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-left transition-colors flex items-center justify-between"
              >
                <span>City reports</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}
