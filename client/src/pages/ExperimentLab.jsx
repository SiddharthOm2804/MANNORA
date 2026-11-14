import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  Sliders, 
  BarChart2, 
  Layers, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Clock,
  Shuffle,
  ShieldAlert,
  Building,
  Droplets,
  Zap,
  Users,
  Coins
} from 'lucide-react';
import Panel from '../components/common/Panel';
import MetricCard from '../components/common/MetricCard';
import StatusIndicator from '../components/common/StatusIndicator';
import { worldService } from '../services/worldService';

export default function ExperimentLabPage() {
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [activeTab, setActiveTab] = useState('define'); // define | results | comparison

  // Form State
  const [experimentName, setExperimentName] = useState('Water Shortage Stress Test');
  const [population, setPopulation] = useState(10000);
  const [variableType, setVariableType] = useState('water'); // water | energy | taxRate | treasury
  const [variableValue, setVariableValue] = useState(150); // override value
  const [durationDays, setDurationDays] = useState(365);
  const [runs, setRuns] = useState(10); // Default to 10 for interactive responsiveness, can be set to 50, 100
  const [seedBehavior, setSeedBehavior] = useState('incremental'); // incremental | fixed | random
  const [baseSeed, setBaseSeed] = useState(42);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [activeExperiment, setActiveExperiment] = useState(null);
  const [historyExperiments, setHistoryExperiments] = useState([]);
  const [comparisonSelection, setComparisonSelection] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Load Worlds
  useEffect(() => {
    async function fetchWorlds() {
      const res = await worldService.getAllWorlds();
      if (res.success && res.data && res.data.length > 0) {
        setWorlds(res.data);
        setSelectedWorldId(res.data[0]._id);
      }
    }
    fetchWorlds();
  }, []);

  // Run Simulation Experiment
  const handleRunExperiment = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: runs });

    const spec = {
      name: experimentName,
      startingConditions: {
        population: Number(population),
        resources: {
          water: variableType === 'water' ? Number(variableValue) : 5000,
          energy: variableType === 'energy' ? Number(variableValue) : 5000,
          agriculture: 4000,
          minerals: 2500,
          technology: 1500,
        },
        economy: {
          treasury: variableType === 'treasury' ? Number(variableValue) : 50000,
          taxRate: variableType === 'taxRate' ? Number(variableValue) / 100 : 0.15,
        },
      },
      variables: {
        [variableType]: Number(variableValue),
      },
      durationDays: Number(durationDays),
      ticksPerDay: 1,
      runs: Number(runs),
      seedBehavior,
      baseSeed: Number(baseSeed),
    };

    try {
      const apiRes = await worldService.runExperiment(selectedWorldId, spec);
      if (apiRes.success && apiRes.data) {
        setActiveExperiment(apiRes.data);
        setHistoryExperiments((prev) => [apiRes.data, ...prev]);
        setActiveTab('results');
      } else {
        alert(apiRes.message || 'Failed to execute experiment on backend');
      }
    } catch (err) {
      console.error('Experiment failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run Comparative Analysis
  const handleCompareExperiments = async () => {
    if (comparisonSelection.length < 2) return;
    try {
      const compRes = await worldService.compareExperiments(comparisonSelection);
      if (compRes.success && compRes.data) {
        setComparisonResult(compRes.data);
        setActiveTab('comparison');
      } else {
        alert(compRes.message || 'Failed to compare experiments');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const activeStats = activeExperiment?.results?.aggregatedStats || activeExperiment?.aggregatedStats;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>TEST CITY CHOICES</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Test City Choices
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Choose a city change, run the test, and compare what happens.
          </p>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('define')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'define'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-[#080a11] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            1. Set Up Test
          </button>
          <button
            onClick={() => setActiveTab('results')}
            disabled={!activeStats}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-40 ${
              activeTab === 'results'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-[#080a11] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            2. Test Results
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            disabled={historyExperiments.length < 2}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-40 ${
              activeTab === 'comparison'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-[#080a11] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            3. Compare Tests
          </button>
        </div>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-600/40 flex items-start gap-3 text-xs font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-amber-300 font-bold tracking-wide uppercase text-[11px] flex items-center gap-2">
            <span>These results are from the city model</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
            The charts show results from this virtual city model. They help you compare choices; <strong>they do not predict what will happen in a real city.</strong>
          </p>
        </div>
      </div>

      {/* TAB 1: DEFINE EXPERIMENT */}
      {activeTab === 'define' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Configuration Deck (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <Panel
              tag="SETUP.VARIABLES"
              title="Set Up a Test"
              subtitle="Choose what to change and how many times to run the test."
            >
              <div className="space-y-4 text-xs font-mono">
                {/* Experiment Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 flex justify-between">
                    <span>TEST NAME</span>
                    <span className="text-slate-400">Give your test a name</span>
                  </label>
                  <input
                    type="text"
                    value={experimentName}
                    onChange={(e) => setExperimentName(e.target.value)}
                    placeholder="e.g. Water Availability Stress Test"
                    className="w-full bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Baseline Population */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 flex justify-between">
                      <span>STARTING POPULATION</span>
                      <span className="text-cyan-400 font-bold">{population.toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="50000"
                      step="500"
                      value={population}
                      onChange={(e) => setPopulation(Number(e.target.value))}
                      className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  {/* Test Variable Selection */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300">TEST VARIABLE</label>
                    <select
                      value={variableType}
                      onChange={(e) => {
                        setVariableType(e.target.value);
                        if (e.target.value === 'water') setVariableValue(150);
                        if (e.target.value === 'energy') setVariableValue(200);
                        if (e.target.value === 'taxRate') setVariableValue(25);
                        if (e.target.value === 'treasury') setVariableValue(10000);
                      }}
                      className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="water">Water Availability (Reserve Stock)</option>
                      <option value="energy">Energy Availability (Fusion Grid)</option>
                      <option value="taxRate">City Income Tax Rate (%)</option>
                      <option value="treasury">Starting city money (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Variable Value Slider */}
                <div className="p-3.5 rounded-lg bg-[#080a11] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">
                      Variable Value ({variableType}):
                    </span>
                    <span className="text-amber-400 font-bold text-sm">
                      {variableValue} {variableType === 'taxRate' ? '%' : variableType === 'treasury' ? 'NC' : 'Units'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={variableType === 'taxRate' ? 5 : 50}
                    max={variableType === 'taxRate' ? 40 : variableType === 'treasury' ? 100000 : 5000}
                    step={variableType === 'taxRate' ? 1 : 50}
                    value={variableValue}
                    onChange={(e) => setVariableValue(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="text-[10px] text-slate-400">
                    Lower values simulate shortages and economic stress; higher values test abundant surplus conditions.
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">NUMBER OF RUNS</label>
                    <select
                      value={runs}
                      onChange={(e) => setRuns(Number(e.target.value))}
                      className="w-full bg-[#080a11] border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300 text-xs focus:outline-none"
                    >
                      <option value={5}>5 Runs (Fast Sample)</option>
                      <option value={10}>10 Runs (Standard)</option>
                      <option value={25}>25 Runs (Detailed)</option>
                      <option value={50}>50 Runs (High Sample)</option>
                      <option value={100}>100 Runs (Exhaustive)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">DURATION</label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-[#080a11] border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300 text-xs focus:outline-none"
                    >
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={90}>90 Days (1 Quarter)</option>
                      <option value={180}>180 Days (Half Year)</option>
                      <option value={365}>365 Days (1 Year)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">RANDOM SEED BEHAVIOR</label>
                    <select
                      value={seedBehavior}
                      onChange={(e) => setSeedBehavior(e.target.value)}
                      className="w-full bg-[#080a11] border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300 text-xs focus:outline-none"
                    >
                      <option value="incremental">Incremental (Base + n*137)</option>
                      <option value="random">Randomized Seeds</option>
                      <option value="fixed">Fixed Seed (Same PRNG)</option>
                    </select>
                  </div>
                </div>

                {/* Submit Launch Button */}
                <div className="pt-2">
                  <button
                    onClick={handleRunExperiment}
                    disabled={isRunning}
                    className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>RUNNING TRIALS ({progress.current}/{progress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>RUN EXPERIMENT ({runs} SIMULATION RUNS)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          {/* Right Summary Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Panel
              tag="METHODOLOGY"
              title="How Repeated Tests Work"
              subtitle="Run the same test again to compare results."
            >
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-1.5">
                  <span className="text-cyan-400 font-bold block text-[11px]">1. RUN THE TEST</span>
                  <p className="text-slate-300 text-[11px] font-sans">
                    Each run starts a fresh city with your settings and follows it for {durationDays} days.
                  </p>
                </div>

                <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-1.5">
                  <span className="text-cyan-400 font-bold block text-[11px]">2. COMPARE THE RESULTS</span>
                  <p className="text-slate-300 text-[11px] font-sans">
                    We compare the number of people, savings, prices, and city events across each run.
                  </p>
                </div>

                <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-1.5">
                  <span className="text-cyan-400 font-bold block text-[11px]">3. CHOOSE WHAT WORKS</span>
                  <p className="text-slate-300 text-[11px] font-sans">
                    Try a big change, like an 80% water cut, before using it in your city.
                  </p>
                </div>
              </div>
            </Panel>

            {/* Previous Experiments History */}
            {historyExperiments.length > 0 && (
              <Panel
                tag="HISTORY"
                title="Finished Tests"
                subtitle="Choose tests to compare."
              >
                <div className="space-y-2 text-xs font-mono">
                  {historyExperiments.map((exp) => {
                    const isSelected = comparisonSelection.includes(exp.id);
                    return (
                      <div
                        key={exp.id}
                        className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-cyan-950/40 border-cyan-500' : 'bg-[#080a11] border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate text-[11px]">{exp.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {exp.spec?.runs} Runs • {exp.spec?.durationDays} Days • {exp.spec?.seedBehavior}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setComparisonSelection(comparisonSelection.filter((id) => id !== exp.id));
                            } else {
                              setComparisonSelection([...comparisonSelection, exp.id]);
                            }
                          }}
                          className="accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    );
                  })}

                  {comparisonSelection.length >= 2 && (
                    <button
                      onClick={handleCompareExperiments}
                      className="w-full mt-2 py-2 px-3 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-mono text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Compare selected tests ({comparisonSelection.length})</span>
                    </button>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STATISTICAL RESULTS */}
      {activeTab === 'results' && activeStats && (
        <div className="space-y-6">
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Population Average"
              code="EXP.POP.MEAN"
              value={activeStats.metrics.population.mean.toLocaleString()}
              subtitle={`Typical change: ±${activeStats.metrics.population.stdDev} (Range: ${activeStats.metrics.population.range})`}
              icon={<Users className="w-4 h-4 text-cyan-400" />}
              sparkline={[
                activeStats.metrics.population.min,
                activeStats.metrics.population.quartiles.q1,
                activeStats.metrics.population.quartiles.median,
                activeStats.metrics.population.quartiles.q3,
                activeStats.metrics.population.max,
              ]}
            />

            <MetricCard
              label="Citizen Happiness Score"
              code="EXP.HAP.MEAN"
              value={`${activeStats.metrics.happiness.mean}/100`}
              subtitle={`Difference: ${activeStats.metrics.happiness.variance} • Middle value: ${activeStats.metrics.happiness.quartiles.median}`}
              icon={<Sparkles className="w-4 h-4 text-rose-400" />}
              sparkline={[
                activeStats.metrics.happiness.min,
                activeStats.metrics.happiness.quartiles.q1,
                activeStats.metrics.happiness.quartiles.median,
                activeStats.metrics.happiness.quartiles.q3,
                activeStats.metrics.happiness.max,
              ]}
            />

            <MetricCard
              label="City Treasury Balance"
              code="EXP.TRES.MEAN"
              value={`${Math.round(activeStats.metrics.treasury.mean).toLocaleString()} ₹`}
              subtitle={`Min: ${activeStats.metrics.treasury.min} • Max: ${activeStats.metrics.treasury.max}`}
              icon={<Coins className="w-4 h-4 text-emerald-400" />}
              sparkline={[
                activeStats.metrics.treasury.min,
                activeStats.metrics.treasury.quartiles.q1,
                activeStats.metrics.treasury.quartiles.median,
                activeStats.metrics.treasury.quartiles.q3,
                activeStats.metrics.treasury.max,
              ]}
            />

            <MetricCard
              label="Unemployment Rate"
              code="EXP.UNEMP.MEAN"
              value={`${activeStats.metrics.unemployment.mean}%`}
              subtitle={`Typical change: ±${activeStats.metrics.unemployment.stdDev}% across runs`}
              icon={<Building className="w-4 h-4 text-amber-400" />}
              sparkline={[
                activeStats.metrics.unemployment.min,
                activeStats.metrics.unemployment.quartiles.q1,
                activeStats.metrics.unemployment.quartiles.median,
                activeStats.metrics.unemployment.quartiles.q3,
                activeStats.metrics.unemployment.max,
              ]}
            />
          </div>

          {/* Histogram Distributions & Event Frequencies */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Cols: Distribution Histograms */}
            <div className="lg:col-span-7 space-y-6">
              <Panel
                tag="DISTRIBUTIONS"
                title="How Often Each Result Happened"
                subtitle={`Results from all ${activeStats.totalRuns} simulation runs`}
              >
                <div className="space-y-6 text-xs font-mono">
                  {/* Population Distribution */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold text-white">Population Distribution:</span>
                      <span className="text-[11px] text-slate-400">Average: {activeStats.metrics.population.mean} | Middle value: {activeStats.metrics.population.quartiles.median}</span>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5 items-end h-24 pt-2">
                      {activeStats.metrics.population.distribution.map((bin, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            style={{ height: `${Math.max(12, bin.frequency * 100)}%` }}
                            className="w-full bg-cyan-600/70 hover:bg-cyan-500 rounded-t border border-cyan-400/80 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                            title={`Range ${bin.binStart} - ${bin.binEnd}: ${bin.count} runs (${Math.round(bin.frequency * 100)}%)`}
                          >
                            {bin.count > 0 ? bin.count : ''}
                          </div>
                          <span className="text-[8px] text-slate-400 truncate w-full text-center">{bin.binStart}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citizen Happiness Distribution */}
                  <div className="space-y-2 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold text-white">Happiness Distribution:</span>
                      <span className="text-[11px] text-slate-400">Average: {activeStats.metrics.happiness.mean} | Middle range: {activeStats.metrics.happiness.quartiles.iqr}</span>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5 items-end h-24 pt-2">
                      {activeStats.metrics.happiness.distribution.map((bin, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            style={{ height: `${Math.max(12, bin.frequency * 100)}%` }}
                            className="w-full bg-rose-600/70 hover:bg-rose-500 rounded-t border border-rose-400/80 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                            title={`Range ${bin.binStart} - ${bin.binEnd}: ${bin.count} runs`}
                          >
                            {bin.count > 0 ? bin.count : ''}
                          </div>
                          <span className="text-[8px] text-slate-400 truncate w-full text-center">{bin.binStart}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Right 5 Cols: Event Frequencies & Summary Table */}
            <div className="lg:col-span-5 space-y-6">
              <Panel
                tag="EVENT.FREQUENCY"
                title="Emergencies During Tests"
                subtitle="How often emergencies happened during the test"
              >
                <div className="space-y-2.5 text-xs font-mono">
                  {Object.keys(activeStats.eventFrequencies).length === 0 ? (
                    <div className="p-3 rounded bg-[#080a11] border border-slate-800 text-slate-400 text-center">
                      No emergencies happened during these tests.
                    </div>
                  ) : (
                    Object.entries(activeStats.eventFrequencies).map(([type, stats]) => (
                      <div
                        key={type}
                        className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white uppercase text-[11px]">{type.replace(/_/g, ' ')}</span>
                          <span className="text-amber-400 font-bold">{stats.percentageOfRuns}% of runs</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Total Occurrences: {stats.totalOccurrences}</span>
                          <span>Avg Per Run: {stats.frequencyPerRun}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              {/* Statistical Variance Summary Table */}
              <Panel
                tag="METRICS.TABLE"
                title="Average Results and Ranges"
                subtitle="A simple summary of all results"
              >
                <div className="overflow-x-auto text-[11px] font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-1.5">Item</th>
                        <th className="pb-1.5">Average</th>
                        <th className="pb-1.5">Typical change</th>
                        <th className="pb-1.5">Min / Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(activeStats.metrics).map(([key, stat]) => (
                        <tr key={key} className="text-slate-300">
                          <td className="py-1.5 font-medium text-white capitalize">{key}</td>
                          <td className="py-1.5 text-cyan-300 font-mono-data">{stat.mean}</td>
                          <td className="py-1.5 text-slate-400 font-mono-data">±{stat.stdDev}</td>
                          <td className="py-1.5 text-slate-400 font-mono-data">{stat.min} - {stat.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: COMPARATIVE EXPERIMENTS */}
      {activeTab === 'comparison' && comparisonResult && (
        <div className="space-y-6">
          <Panel
            tag="COMPARISON.MATRIX"
            title="Compare Test Results"
            subtitle={`Compare ${comparisonResult.experimentCount} finished tests`}
          >
            <div className="space-y-6 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonResult.experiments.map((e) => (
                  <div key={e.id} className="p-3.5 rounded-lg bg-[#080a11] border border-cyan-800/50 space-y-1">
                    <div className="text-sm font-bold text-white">{e.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {e.runs} Runs • {e.durationDays} Days Duration
                    </div>
                    <div className="text-[10px] text-cyan-400 pt-1">
                      Variables: {JSON.stringify(e.variables)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparative Metrics Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Item</th>
                      {comparisonResult.experiments.map((e) => (
                        <th key={e.id} className="pb-2 text-white">{e.name} (Mean ± SD)</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {['population', 'happiness', 'health', 'treasury', 'unemployment', 'water', 'approval'].map((metricKey) => (
                      <tr key={metricKey} className="text-slate-300">
                        <td className="py-2.5 font-bold text-white capitalize">{metricKey}</td>
                        {comparisonResult.metricsComparison[metricKey]?.map((res, i) => (
                          <td key={i} className="py-2.5 font-mono-data">
                            <span className="text-cyan-300 font-bold">{res.mean}</span>
                            <span className="text-slate-500 text-[10px] ml-1">±{res.stdDev}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

