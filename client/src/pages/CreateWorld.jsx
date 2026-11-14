import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  RotateCcw, 
  ArrowRight, 
  Zap, 
  Users, 
  Coins, 
  Factory, 
  Building2, 
  Calendar, 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';
import Panel from '../components/common/Panel';
import Modal from '../components/common/Modal';
import StatusIndicator from '../components/common/StatusIndicator';
import { worldService, generateDefaultCities } from '../services/worldService';
import { aiService } from '../services/aiService';

export default function CreateWorld() {
  const navigate = useNavigate();

  // Natural Language Generation State (Phase 14)
  const [nlPrompt, setNlPrompt] = useState(
    'Create a town in Spiti with 2,500 people, farms, shops, a hospital, and a local council.'
  );
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [nlValidationResult, setNlValidationResult] = useState(null);
  const [isNlConfirmationOpen, setIsNlConfirmationOpen] = useState(false);

  // 1. World Name & Description
  const [worldName, setWorldName] = useState('Spiti Vally');
  const [description, setDescription] = useState(
    'A mountain city in Spiti with local jobs, services, and close-knit communities.'
  );

  // 2. Population
  const [population, setPopulation] = useState(2500);

  // 3. Number of Cities
  const [numberOfCities, setNumberOfCities] = useState(3);

  // 4. Available Resources
  const [resources, setResources] = useState({
    energy: 6500,
    minerals: 3200,
    water: 5800,
    agriculture: 4200,
    technology: 1800,
  });

  // 5. Starting Money
  const [startingMoney, setStartingMoney] = useState(650000);

  // 6. Industries
  const availableIndustries = [
    'Energy & Clean Fusion',
    'Robotics & Manufacturing',
    'Advanced Cybernetics',
    'Synthetic Bio-Agriculture',
    'Financial Capital Markets',
    'Quantum Logistics & Freight',
    'Orbital Infrastructure',
  ];
  const [selectedIndustries, setSelectedIndustries] = useState([
    'Energy & Clean Fusion',
    'Robotics & Manufacturing',
    'Advanced Cybernetics',
  ]);

  // 7. Government Type
  const [governmentType, setGovernmentType] = useState('Technocracy');

  // 8. Simulation Speed
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // 9. Starting Date
  const [startingDate, setStartingDate] = useState('2085-01-01');

  // Additional Environmental Parameter
  const [biome, setBiome] = useState('Cybernetic Basin');
  const [seed, setSeed] = useState(83917492);

  // UI state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 90000000) + 10000000);
  };

  const toggleIndustry = (industry) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const handleResourceChange = (key, val) => {
    setResources((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  // Preview generated cities calculation
  const previewCities = generateDefaultCities(numberOfCities, population, worldName);

  // Natural Language Pipeline Handler (Phase 14)
  const handleParseNlPrompt = async () => {
    if (!nlPrompt.trim()) return;
    setIsParsingNl(true);
    setErrorMessage('');

    try {
      const res = await aiService.parseWorldPrompt(nlPrompt.trim());
      if (res.success && res.data) {
        setNlValidationResult(res.data);
        setIsNlConfirmationOpen(true);
      } else {
        setErrorMessage(res.message || 'Failed to parse natural language prompt');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Error executing AI pipeline');
    } finally {
      setIsParsingNl(false);
    }
  };

  // Apply validated configuration upon explicit user confirmation
  const handleConfirmNlConfiguration = () => {
    if (!nlValidationResult || !nlValidationResult.validatedConfig) return;
    const cfg = nlValidationResult.validatedConfig;

    setWorldName(cfg.name);
    setDescription(cfg.description);
    setPopulation(cfg.population);
    setNumberOfCities(cfg.numberOfCities);
    setBiome(cfg.biome);
    setGovernmentType(cfg.governmentType);
    setResources(cfg.resources);
    setStartingMoney(cfg.startingMoney);
    if (cfg.industries && cfg.industries.length > 0) {
      setSelectedIndustries(cfg.industries);
    }

    setIsNlConfirmationOpen(false);
    setSuccessMessage(`Natural language configuration for "${cfg.name}" applied! Review below or start city.`);
  };

  // Form submission handler
  const handleDeployWorld = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (!worldName.trim()) {
      setErrorMessage('World designation name is required.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: worldName.trim(),
      description: description.trim(),
      population: Number(population),
      numberOfCities: Number(numberOfCities),
      biome,
      startingMoney: Number(startingMoney),
      industries: selectedIndustries,
      governmentType,
      simulationSpeed: Number(simulationSpeed),
      startingDate: new Date(startingDate).toISOString(),
      seed: Number(seed),
      resources,
    };

    const result = await worldService.createWorld(payload);

    if (result.success) {
      setSuccessMessage('Civilization world deployed and persisted to MongoDB!');
      setIsPreviewOpen(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setErrorMessage(result.message || 'Failed to create world. Check backend connectivity.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2233] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Globe className="w-3.5 h-3.5" />
            <span>CREATE NEW CITY // PHASE 3</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Create Virtual City
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Set up city name, population, starting resources, money, and government rules.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-cyan-800/60 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview city</span>
          </button>

          <button
            type="button"
            onClick={handleDeployWorld}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider transition-all shadow-md shadow-cyan-600/25 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>SAVING CITY...</span>
              </>
            ) : (
              <>
                <span>CREATE CITY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* PHASE 14: Natural Language World Creation Section */}
      <Panel
        tag="AI.PROMPT.BUILDER"
        title="Describe a city and let AI set it up"
        subtitle="Describe your city in a few words. AI will fill in the setup."
      >
        <div className="space-y-3 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-slate-300 flex justify-between">
              <span>DESCRIBE YOUR CITY</span>
              <span className="text-cyan-400">Describe your city</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder='For example: "Create a town in Spiti with farms, shops, a hospital, and a local council."'
                className="flex-1 bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParseNlPrompt}
                disabled={isParsingNl || !nlPrompt.trim()}
                className="px-4 py-2 rounded bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/80 font-bold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isParsingNl ? (
                  <>
                    <Cpu className="w-3.5 h-3.5 animate-spin text-purple-300" />
                    <span>READING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>SET UP CITY</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-slate-500">Pipeline:</span>
            <span className="text-cyan-400">User Prompt</span>
            <span>→</span>
            <span className="text-cyan-400">WorldPromptParser</span>
            <span>→</span>
            <span className="text-cyan-400">Strict Validation</span>
            <span>→</span>
            <span className="text-purple-400">Preview & Confirm</span>
          </div>
        </div>
      </Panel>

      {/* Form Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Columns: Structured Configuration */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Designation & Demographics */}
          <Panel
            tag="CITY.NAME"
            title="1. City Name, Population & Areas"
            subtitle="Add the city name and number of people"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* World Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300 flex justify-between">
                  <span>CITY NAME</span>
                  <span className="text-[10px] text-slate-400">Required</span>
                </label>
                <input
                  type="text"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  placeholder="e.g. Spiti Vally"
                  className="w-full bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300">CITY DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-white focus:outline-none font-sans text-xs resize-none"
                />
              </div>

              {/* Total Population */}
              <div className="space-y-1.5">
                <label className="text-slate-300 flex justify-between">
                  <span>STARTING POPULATION</span>
                  <span className="text-cyan-400 font-bold font-mono-data">{population.toLocaleString()} People</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="20000"
                  step="100"
                  value={population}
                  onChange={(e) => setPopulation(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>200 (Small Town)</span>
                  <span>5,000 (Medium City)</span>
                  <span>20,000 (Large City)</span>
                </div>
              </div>

              {/* Number of Cities */}
              <div className="space-y-1.5">
                <label className="text-slate-300 flex justify-between">
                  <span>NUMBER OF CITY AREAS</span>
                  <span className="text-cyan-400 font-bold font-mono-data">{numberOfCities} City Sectors</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumberOfCities(num)}
                      className={`flex-1 py-1.5 rounded border text-xs font-mono transition-colors ${
                        numberOfCities === num
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-[#080a11] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {num} {num === 1 ? 'Area' : 'Areas'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Section 2: Available Resources */}
          <Panel
            tag="STARTING RESOURCES"
            title="2. Starting Resources"
            subtitle="Amount of food, water, and power available at the start"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Energy */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>ELECTRICITY RESERVES</span>
                  </span>
                  <span className="text-amber-400 font-mono-data">{resources.energy.toLocaleString()} MW</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={resources.energy}
                  onChange={(e) => handleResourceChange('energy', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Minerals */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-slate-400" />
                    <span>METALS & MINERALS</span>
                  </span>
                  <span className="text-slate-200 font-mono-data">{resources.minerals.toLocaleString()} Tons</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={resources.minerals}
                  onChange={(e) => handleResourceChange('minerals', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-slate-400"
                />
              </div>

              {/* Water */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CLEAN DRINKING WATER</span>
                  </span>
                  <span className="text-cyan-400 font-mono-data">{resources.water.toLocaleString()} kL</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={resources.water}
                  onChange={(e) => handleResourceChange('water', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Agriculture */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FOOD & GRAIN STOCKS</span>
                  </span>
                  <span className="text-emerald-400 font-mono-data">{resources.agriculture.toLocaleString()} Rations</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={resources.agriculture}
                  onChange={(e) => handleResourceChange('agriculture', e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </Panel>

          {/* Section 3: Economy, Starting Capital & Industries */}
          <Panel
            tag="STARTING MONEY"
            title="3. Starting Money & Key Industries"
            subtitle="Set the starting money and main types of work"
          >
            <div className="space-y-4 text-xs font-mono">
              {/* Starting Money */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>STARTING TREASURY CAPITAL</span>
                  </span>
                  <span className="text-emerald-400 font-bold font-mono-data">
                    {startingMoney.toLocaleString()} Indian rupees (₹)
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="3000000"
                  step="50000"
                  value={startingMoney}
                  onChange={(e) => setStartingMoney(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>50k ₹ (Low amount)</span>
                  <span>500k ₹ (Typical amount)</span>
                  <span>3.0M ₹ (High amount)</span>
                </div>
              </div>

              {/* Industries Multi-Select */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-slate-300 block">
                  MAIN TYPES OF WORK (Choose at least 1)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableIndustries.map((ind) => {
                    const isSelected = selectedIndustries.includes(ind);

                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300'
                            : 'bg-[#080a11] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs truncate">{ind}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-black'
                              : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          {/* Section 4: Government, Simulation Speed & Starting Date */}
          <Panel
            tag="GOVERNMENT & TIME"
            title="4. Government and Start Date"
            subtitle="Choose who makes city decisions and when the city starts"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Government Type */}
              <div className="space-y-1.5">
                <label className="text-slate-300">GOVERNMENT TYPE</label>
                <select
                  value={governmentType}
                  onChange={(e) => setGovernmentType(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Technocracy">Expert-led council</option>
                  <option value="Direct Democracy">Direct democracy</option>
                  <option value="Local republic">Local republic</option>
                  <option value="Corporate Guild">Business council</option>
                  <option value="Data-led council">Data-led council</option>
                </select>
              </div>

              {/* Simulation Speed */}
              <div className="space-y-1.5">
                <label className="text-slate-300">CITY SPEED</label>
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value={0.5}>0.5x (Slow)</option>
                  <option value={1}>1.0x (Normal)</option>
                  <option value={2}>2.0x (Fast)</option>
                  <option value={5}>5.0x (Very fast)</option>
                  <option value={10}>10.0x (Fastest)</option>
                </select>
              </div>

              {/* Starting Date */}
              <div className="space-y-1.5">
                <label className="text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>START DATE</span>
                </label>
                <input
                  type="date"
                  value={startingDate}
                  onChange={(e) => setStartingDate(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
          </Panel>

        </div>

        {/* Right 4 Columns: Deployment Sidebar Summary */}
        <div className="lg:col-span-4 space-y-5">
          <Panel
            tag="MANIFEST"
            title="City Summary"
            subtitle="Check your city setup before saving."
          >
            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase">Designation</div>
                <div className="text-white font-bold text-sm truncate">{worldName}</div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Starting number:</span>
                  <span className="text-cyan-400 font-mono-data">{seed}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Population:</span>
                  <span className="text-white font-mono-data">{population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City areas:</span>
                  <span className="text-white font-mono-data">{numberOfCities} Cities</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Starting Capital:</span>
                  <span className="text-emerald-400 font-mono-data">{startingMoney.toLocaleString()} ₹</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Industries Active:</span>
                  <span className="text-cyan-400 font-mono-data">{selectedIndustries.length} Sectors</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Government:</span>
                  <span className="text-slate-300 font-mono-data">{governmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Starting Chrono:</span>
                  <span className="text-slate-300 font-mono-data">{startingDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full py-2.5 px-3 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-cyan-800/60 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview city</span>
              </button>

              <button
                type="button"
                onClick={handleDeployWorld}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>PERSISTING TO DATABASE...</span>
                  </>
                ) : (
                  <>
                    <span>CREATE CITY</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </Panel>
        </div>

      </div>

      {/* World Preview Modal Before Creation */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size="lg"
        tag="PREVIEW // SIM-MANIFEST"
        title={`World Preview: ${worldName}`}
        description="Comprehensive pre-simulation architectural blueprint and city coordinates"
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              Modify Parameters
            </button>
            <button
              onClick={handleDeployWorld}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
            >
              <span>Confirm & Deploy Civilization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="space-y-5 text-xs font-mono">
          
          {/* Header Overview Card */}
          <div className="p-4 rounded-lg bg-[#080a11] border border-slate-800 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">{worldName}</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{description}</p>
              </div>
              <StatusIndicator status="simulating" label="BLUEPRINT READY" size="sm" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL CITIZENS</span>
                <span className="text-cyan-400 font-bold font-mono-data">{population.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STARTING CAPITAL</span>
                <span className="text-emerald-400 font-bold font-mono-data">{startingMoney.toLocaleString()} ₹</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GOVERNANCE</span>
                <span className="text-white font-bold">{governmentType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">EPOCH START</span>
                <span className="text-white font-bold">{startingDate}</span>
              </div>
            </div>
          </div>

          {/* Generated Cities Matrix */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Municipal Urban Centers ({previewCities.length} Cities Generated)</span>
              <span>Total Quota: {population.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {previewCities.map((city, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate text-xs flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{city.name}</span>
                    </span>
                    {city.isCapital && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold">
                        Capital
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Population: <strong className="text-white font-mono-data">{city.population.toLocaleString()}</strong></span>
                    <span>Coords: [{city.coordinates.x}, {city.coordinates.y}]</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Specialization: {city.specialization}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Reserves Breakdown */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Resource Stockpile Projections
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ENERGY</span>
                <span className="text-amber-400 font-bold font-mono-data">{resources.energy.toLocaleString()} MW</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MINERALS</span>
                <span className="text-slate-200 font-bold font-mono-data">{resources.minerals.toLocaleString()} T</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PURIFIED WATER</span>
                <span className="text-cyan-400 font-bold font-mono-data">{resources.water.toLocaleString()} kL</span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SYNTH FOOD</span>
                <span className="text-emerald-400 font-bold font-mono-data">{resources.agriculture.toLocaleString()} Rations</span>
              </div>
            </div>
          </div>

          {/* Active Industries Badges */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Ratified Industrial Specializations
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedIndustries.map((ind) => (
                <span
                  key={ind}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>

        </div>
      </Modal>

      {/* PHASE 14: Natural Language Validation & Confirmation Modal */}
      {nlValidationResult && (
        <Modal
          isOpen={isNlConfirmationOpen}
          onClose={() => setIsNlConfirmationOpen(false)}
          size="lg"
          tag="AI.VALIDATION // WORLD-CONFIG"
          title={`AI Generated Configuration: ${nlValidationResult.validatedConfig?.name}`}
          description="Review the structured configuration converted from your natural language prompt. Verify all parameters before applying."
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-mono text-slate-400">
                {nlValidationResult.isValid ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Configuration Validated</span>
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Errors Present</span>
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNlConfirmationOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNlConfiguration}
                  disabled={!nlValidationResult.isValid}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Populate Form</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs font-mono">
            {/* User Prompt Echo */}
            <div className="p-3 rounded-lg bg-[#080a11] border border-purple-800/60 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Original Natural Language Prompt</span>
              <p className="text-slate-200 text-xs font-sans italic">"{nlPrompt}"</p>
            </div>

            {/* Validation Warnings or Errors */}
            {nlValidationResult.warnings && nlValidationResult.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/60 space-y-1 text-amber-300 text-[11px]">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Validation Adjustments</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {nlValidationResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extracted Configuration Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">POPULATION</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {nlValidationResult.validatedConfig?.population?.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CITIES COUNT</span>
                <span className="text-white font-bold text-sm">
                  {nlValidationResult.validatedConfig?.numberOfCities} Cities
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">BIOME / CLIMATE</span>
                <span className="text-amber-400 font-bold text-sm">
                  {nlValidationResult.validatedConfig?.biome}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#080a11] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">GOVERNMENT</span>
                <span className="text-emerald-400 font-bold text-sm truncate block">
                  {nlValidationResult.validatedConfig?.governmentType}
                </span>
              </div>
            </div>

            {/* Resources breakdown */}
            <div className="p-3 rounded-lg bg-[#080a11] border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Validated Initial Resources</span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">WATER</span>
                  <strong className={nlValidationResult.validatedConfig?.resources?.water < 2500 ? 'text-rose-400' : 'text-cyan-400'}>
                    {nlValidationResult.validatedConfig?.resources?.water}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ENERGY</span>
                  <strong className="text-amber-400">{nlValidationResult.validatedConfig?.resources?.energy}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">AGRICULTURE</span>
                  <strong className="text-emerald-400">{nlValidationResult.validatedConfig?.resources?.agriculture}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MINERALS</span>
                  <strong className="text-slate-200">{nlValidationResult.validatedConfig?.resources?.minerals}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TECHNOLOGY</span>
                  <strong className="text-violet-400">{nlValidationResult.validatedConfig?.resources?.technology}</strong>
                </div>
              </div>
            </div>

            {/* Extracted Sectors & Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Inferred Industries</span>
                <div className="space-y-0.5 text-slate-200">
                  {nlValidationResult.validatedConfig?.industries?.map((ind, i) => (
                    <div key={i}>• {ind}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded bg-[#080a11] border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Public Infrastructure</span>
                <div className="space-y-0.5 text-slate-200">
                  {nlValidationResult.validatedConfig?.publicServices?.map((srv, i) => (
                    <div key={i}>• {srv}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300">
              Safety Guarantee: All values have been checked against system thresholds. Clicking "Confirm" will populate the city creation form so you can review or modify any setting.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
