import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Play, 
  Users, 
  BarChart3, 
  GitBranch, 
  Settings, 
  PlusCircle, 
  Cpu, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  Globe
} from 'lucide-react';

/**
 * Sidebar - Left scientific navigation dock with collapsible state.
 */
export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();

  const navItems = [
    {
      to: '/dashboard',
      label: 'World Dashboard',
      shortLabel: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      tag: '01',
    },
    {
      to: '/simulation',
      label: 'Simulation Engine',
      shortLabel: 'Simulation',
      icon: <Play className="w-4 h-4 shrink-0" />,
      tag: '02',
    },
    {
      to: '/agents',
      label: 'Agent Explorer',
      shortLabel: 'Agents',
      icon: <Users className="w-4 h-4 shrink-0" />,
      tag: '03',
    },
    {
      to: '/analytics',
      label: 'Analytics & Telemetry',
      shortLabel: 'Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      tag: '04',
    },
    {
      to: '/timeline',
      label: 'Temporal Timeline',
      shortLabel: 'Timeline',
      icon: <GitBranch className="w-4 h-4 shrink-0" />,
      tag: '05',
    },
    {
      to: '/settings',
      label: 'Laboratory Settings',
      shortLabel: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      tag: '06',
    },
  ];

  return (
    <aside
      className={`border-r border-[#1a2233] bg-[#090b12] flex flex-col justify-between transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top: Laboratory Branding */}
      <div>
        <div className="h-14 border-b border-[#1a2233] px-4 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-violet-600 p-[1px] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0a0d17] rounded-[7px] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              </div>
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-mono text-sm font-bold tracking-wider text-white flex items-center gap-1.5">
                  NEURAL CITY
                </span>
                <span className="text-[10px] font-mono text-cyan-400 block tracking-widest">
                  LAB CONSOLE
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 hidden lg:block transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Section: Main Navigation Links */}
        <nav className="p-2 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-mono text-slate-400 tracking-wider font-semibold">
              LABORATORY MODULES
            </div>
          )}

          {navItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition-all group ${
                  isActive
                    ? 'bg-[#121726] text-cyan-300 font-semibold border border-cyan-800/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e121d] border border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span
                  className={
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.tag}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: World Creation & Portal Link */}
      <div className="p-3 border-t border-[#1a2233] space-y-2">
        <NavLink
          to="/create-world"
          title={isCollapsed ? 'Initialize World Matrix' : undefined}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          {!isCollapsed && (
            <span className="truncate font-medium">New Simulation</span>
          )}
        </NavLink>

        {!isCollapsed && (
          <div className="px-2 pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ENGINE v0.2</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              READY
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
