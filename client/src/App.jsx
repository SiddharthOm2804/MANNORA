import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import CreateWorld from './pages/CreateWorld';
import WorldDashboard from './pages/WorldDashboard';
import Simulation from './pages/Simulation';
import AgentExplorer from './pages/AgentExplorer';
import Analytics from './pages/Analytics';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Portal */}
        <Route path="/" element={<Landing />} />

        {/* Laboratory Product Interface Shell */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<WorldDashboard />} />
          <Route path="/create-world" element={<CreateWorld />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/agents" element={<AgentExplorer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
