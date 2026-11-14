import React from 'react';
import { Search, RefreshCw, ChevronDown, MapPin } from 'lucide-react';
import StatusIndicator from '../common/StatusIndicator';
import { useLocation } from 'react-router-dom';

const titles = { '/dashboard': 'City overview', '/simulation': 'Live simulation', '/agents': 'Residents', '/analytics': 'City insights', '/government': 'Governance', '/timeline': 'Timeline', '/experiment-lab': 'Experiments', '/settings': 'Settings', '/create-world': 'Create a city' };

export default function Navbar({ healthData, onOpenCommandBar, onRefreshHealth, isHealthLoading }) {
  const location = useLocation();
  const isDbConnected = healthData?.database?.isConnected === true;
  const isServerRunning = healthData?.server?.status === 'running';
  return <header className="app-topbar">
    <div className="topbar-context"><div className="topbar-title">{titles[location.pathname] || 'Workspace'}</div><div className="city-picker"><MapPin size={15} /><span>Spiti Vally</span><ChevronDown size={14} /></div></div>
    <div className="topbar-actions">
      <button onClick={onOpenCommandBar} className="topbar-search"><Search size={16} /><span>Search anything</span><kbd>⌘ K</kbd></button>
      <div className="topbar-status"><StatusIndicator status={isDbConnected ? 'operational' : isServerRunning ? 'degraded' : 'error'} label={isDbConnected ? 'Connected' : isServerRunning ? 'Database offline' : 'Offline'} size="sm" /></div>
      <button onClick={onRefreshHealth} disabled={isHealthLoading} aria-label="Refresh system status" className="icon-button"><RefreshCw size={16} className={isHealthLoading ? 'animate-spin' : ''} /></button>
      <div className="avatar">M</div>
    </div>
  </header>;
}
