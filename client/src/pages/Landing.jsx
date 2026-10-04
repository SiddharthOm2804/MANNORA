import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Terminal, 
  Layers, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  RefreshCw, 
  Server, 
  Clock, 
  GitBranch, 
  Users, 
  BarChart3, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { getHealth } from '../services/api';
import NeuralCityCanvas from '../components/NeuralCityCanvas';
import StatusIndicator from '../components/common/StatusIndicator';

export default function Landing() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testSeed, setTestSeed] = useState(42);
  const [simTick, setSimTick] = useState(1420);
  const [randomStream, setRandomStream] = useState(['0.6011', '0.8842', '0.1294', '0.4571']);

  const fetchHealth = async () => {
    setLoading(true);
    const res = await getHealth();
    if (res.success) {
      setHealthData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleStepTick = () => {
    setSimTick((prev) => prev + 1);
    let t = (testSeed + simTick) >>> 0;
    const stream = [];
    for (let i = 0; i < 4; i++) {
      t = (t += 0x6d2b79f5);
      let s = Math.imul(t ^ (t >>> 15), t | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      const val = ((s ^ (s >>> 14)) >>> 0) / 4294967296;
      stream.push(val.toFixed(4));
    }
    setRandomStream(stream);
  };

  const isDbConnected = healthData?.database?.isConnected === true;

  return (
    <div className="min-h-screen bg-[#080a11] text-slate-100 flex flex-col justify-between lab-dots-bg">
      {/* Top Laboratory Bar */}
      <header className="border-b border-[#1a2233] bg-[#090b12]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-violet-600 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d17] rounded-[7px] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-mono text-sm font-bold tracking-wider text-white">
                NEURAL CITY
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101524] text-cyan-400 border border-cyan-800/40">
                LABORATORY SPEC 2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator
              status={isDbConnected ? 'operational' : 'degraded'}
              label={isDbConnected ? 'CLUSTER ONLINE' : 'SERVER DEGRADED'}
              size="sm"
            />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1.5 rounded-md bg-[#121827] hover:bg-[#1a2236] border border-slate-700/80 text-white font-mono text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Scientific Mission & Value */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0f1422] border border-slate-800 text-[11px] font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>CIVILIZATION SIMULATION ENGINE // MULTI-AGENT LAB</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Deterministic AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 font-mono">
                Civilization Platform
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
              An intelligent scientific simulation platform coupling cognitive agent architectures with macroeconomic, environmental, and spatial city dynamics. Engineered for high-throughput counterfactual analysis and emergent societal exploration.
            </p>

            {/* Scientific Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold tracking-wider transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2 active:scale-95"
              >
                <span>OPEN WORLD DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/create-world')}
                className="px-4 py-2.5 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-slate-700/80 text-slate-200 font-mono text-xs font-medium tracking-wider transition-colors flex items-center gap-2"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>INITIALIZE NEW MATRIX</span>
              </button>

              <button
                onClick={() => navigate('/simulation')}
                className="px-4 py-2.5 rounded-lg bg-[#0e121d] hover:bg-[#161c2e] border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs transition-colors"
              >
                SPATIAL VIEWPORT
              </button>
            </div>

            {/* Technical Laboratory Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 rounded-lg bg-[#0d101a] border border-[#1a2233]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">PRNG Engine</div>
                <div className="text-sm font-bold font-mono text-white mt-1">Mulberry32</div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">Deterministic</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d101a] border border-[#1a2233]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Clock Precision</div>
                <div className="text-sm font-bold font-mono text-white mt-1">Fixed Delta</div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">10 - 60 TPS</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d101a] border border-[#1a2233]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Storage Tier</div>
                <div className="text-sm font-bold font-mono text-white mt-1">MongoDB 9</div>
                <div className="text-[10px] font-mono text-violet-400 mt-0.5">Mongoose ODM</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d101a] border border-[#1a2233]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Cognition</div>
                <div className="text-sm font-bold font-mono text-white mt-1">Multi-Tier</div>
                <div className="text-[10px] font-mono text-amber-400 mt-0.5">Working + Episodic</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Matrix & Live Telemetry Deck */}
          <div className="lg:col-span-5 space-y-5">
            {/* Holographic Matrix Node */}
            <div className="h-64 sm:h-72 w-full rounded-xl bg-[#0b0e18] border border-[#1a2233] relative overflow-hidden flex items-center justify-center shadow-2xl">
              <NeuralCityCanvas />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-cyan-400">
                SPATIAL PROJECTION // 3D R3F
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400">
                HOLOGRAPHIC NODE v0.2
              </div>
            </div>

            {/* Interactive Engine Sandbox Panel */}
            <div className="p-4 rounded-xl bg-[#0d101a] border border-[#1a2233] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>DETERMINISTIC ENGINE DIAGNOSTIC</span>
                </span>
                <span>TICK #{simTick}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleStepTick}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Step Tick</span>
                </button>

                <div className="flex-1 bg-[#070910] px-3 py-1.5 rounded border border-slate-800/80 text-xs font-mono text-slate-300 truncate">
                  Stream: [{randomStream.join(', ')}]
                </div>
              </div>
            </div>

            {/* Backend Connectivity Status */}
            <div className="p-3.5 rounded-lg bg-[#0d101a] border border-[#1a2233] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Target Database:</span>
                <span className="text-cyan-400">
                  {healthData?.database?.database || 'neural_city'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Latency:</span>
                <span className="text-emerald-400">1.2ms</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a2233] bg-[#090b12] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>
            NEURAL CITY — AI-Driven Civilization Simulation Platform
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>PHASE 2: PRODUCT INTERFACE</span>
            <span>•</span>
            <span>API READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
