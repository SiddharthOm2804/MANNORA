import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandBar from '../common/CommandBar';
import { getHealth } from '../../services/api';

/**
 * AppLayout - Scientific product layout shell.
 */
export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  // Poll system health
  const refreshHealth = async () => {
    setIsHealthLoading(true);
    const res = await getHealth();
    if (res.success) {
      setHealthData(res.data);
    }
    setIsHealthLoading(false);
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080a11] text-slate-100 flex flex-row overflow-hidden font-sans">
      {/* Collapsible Laboratory Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Laboratory Surface */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Laboratory Telemetry Navbar */}
        <Navbar
          healthData={healthData}
          onOpenCommandBar={() => setIsCommandBarOpen(true)}
          onRefreshHealth={refreshHealth}
          isHealthLoading={isHealthLoading}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-dots-bg">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Bar (⌘K) */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
      />
    </div>
  );
}
