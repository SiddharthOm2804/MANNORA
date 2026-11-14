import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Building2, ChevronRight, CircleCheck, Clock3, Database, Layers3, MapPin, Play, Plus, Users } from 'lucide-react';
import { getHealth } from '../services/api';
import NeuralCityCanvas from '../components/NeuralCityCanvas';

export default function Landing() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [simTick, setSimTick] = useState(1420);
  useEffect(() => { getHealth().then((res) => { if (res.success) setHealthData(res.data); }).catch(() => {}); }, []);
  const connected = healthData?.database?.isConnected === true;

  return <div className="landing-page">
    <header className="landing-header"><div className="landing-brand"><span className="brand-mark"><Building2 size={19} /></span><strong>MANNORA</strong><span className="brand-divider" /><span className="brand-subtitle">Virtual city platform</span></div><div className="landing-header-right"><span className="connection-label"><span className={`online-dot ${connected ? '' : 'is-muted'}`} />{connected ? 'All systems ready' : 'Platform preview'}</span><button className="button button-secondary button-small" onClick={() => navigate('/dashboard')}>Open workspace <ArrowRight size={15} /></button></div></header>

    <main className="landing-main">
      <section className="landing-hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> A living model of a city</div><h1>See how a city<br /><em>comes together.</em></h1><p className="hero-description">Explore how people, resources, and public decisions shape a city over time. Build a world, run the simulation, and understand what changes.</p><div className="hero-actions"><button className="button button-primary" onClick={() => navigate('/dashboard')}>Explore the workspace <ArrowRight size={17} /></button><button className="button button-secondary" onClick={() => navigate('/create-world')}><Plus size={17} /> Create a city</button></div><div className="hero-note"><CircleCheck size={15} /> Start with a sample city or make one of your own</div></div>
        <div className="hero-visual"><div className="visual-card"><div className="visual-card-top"><div><span className="visual-kicker">CITY MODEL</span><h2>Spiti Vally</h2></div><span className="live-pill"><span className="online-dot" /> LIVE</span></div><div className="city-canvas"><NeuralCityCanvas /></div><div className="visual-card-bottom"><span><MapPin size={14} /> Spiti Valley</span><span>Step <b>{simTick.toLocaleString()}</b></span></div><button className="visual-play" aria-label="Open live simulation" onClick={() => navigate('/simulation')}><Play size={17} fill="currentColor" /></button></div><div className="floating-stat stat-residents"><span className="stat-icon"><Users size={17} /></span><span><small>Residents</small><b>12,480</b></span><span className="stat-change">+2.4%</span></div><div className="floating-stat stat-health"><span className="health-ring">86</span><span><small>City wellbeing</small><b>Healthy</b></span></div></div>
      </section>

      <section className="landing-capabilities"><div className="section-intro"><span className="eyebrow">ONE CONNECTED WORKSPACE</span><h2>From city design to clear insight.</h2></div><div className="capability-grid"><article className="capability-card"><span className="capability-icon"><Layers3 size={19} /></span><h3>Shape your city</h3><p>Set the population, resources, industries, and rules that define your world.</p><button onClick={() => navigate('/create-world')}>Build a city <ChevronRight size={15} /></button></article><article className="capability-card"><span className="capability-icon"><Activity size={19} /></span><h3>Watch it evolve</h3><p>Follow residents and city systems as the simulation moves forward.</p><button onClick={() => navigate('/simulation')}>View simulation <ChevronRight size={15} /></button></article><article className="capability-card"><span className="capability-icon"><Clock3 size={19} /></span><h3>Compare decisions</h3><p>Review events, explore alternate outcomes, and learn from each run.</p><button onClick={() => navigate('/analytics')}>Explore insights <ChevronRight size={15} /></button></article></div></section>
      <footer className="landing-footer"><div className="footer-brand"><Building2 size={16} /> MANNORA <span>City systems, clearly.</span></div><div className="footer-meta"><span><Database size={14} /> {connected ? 'Data connected' : 'Local preview'}</span><span><span className="online-dot" /> Simulation ready</span><button onClick={() => setSimTick((tick) => tick + 1)}>Advance sample <ArrowRight size={14} /></button></div></footer>
    </main>
  </div>;
}
