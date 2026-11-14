import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, Building2, ChevronLeft, FlaskConical, GitBranch, LayoutDashboard, Landmark, Plus, Settings, Users } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/simulation', label: 'Live simulation', icon: Activity },
  { to: '/agents', label: 'Residents', icon: Users },
  { to: '/analytics', label: 'City insights', icon: BarChart3 },
  { to: '/government', label: 'Governance', icon: Landmark },
  { to: '/timeline', label: 'Timeline', icon: GitBranch },
  { to: '/experiment-lab', label: 'Experiments', icon: FlaskConical },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  return (
    <aside className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <NavLink to="/" className="brand-lockup" aria-label="Mannora home">
          <span className="brand-mark"><Building2 size={19} /></span>
          {!isCollapsed && <span><strong>MANNORA</strong><small>City systems, clearly.</small></span>}
        </NavLink>
        <button className="sidebar-toggle" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}><ChevronLeft size={16} /></button>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} title={isCollapsed ? label : undefined} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{!isCollapsed && label}</span>
        </NavLink>)}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} title={isCollapsed ? 'Settings' : undefined}><Settings size={18} strokeWidth={1.8} />{!isCollapsed && <span>Settings</span>}</NavLink>
        <NavLink to="/create-world" className="create-city-link"><Plus size={18} />{!isCollapsed && <span>Create a city</span>}</NavLink>
        {!isCollapsed && <div className="sidebar-footnote"><span className="online-dot" /> All systems operational</div>}
      </div>
    </aside>
  );
}
