import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Terminal, 
  LayoutDashboard, 
  Play, 
  Users, 
  BarChart3, 
  GitBranch, 
  Settings, 
  PlusCircle, 
  ArrowRight,
  Globe,
  Database
} from 'lucide-react';

/**
 * CommandBar - Global keyboard-driven Command Palette (⌘K / Ctrl+K).
 */
export default function CommandBar({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands = [
    {
      category: 'NAVIGATION',
      items: [
        {
          id: 'nav-dashboard',
          title: 'World Dashboard',
          description: 'Primary civilization vitals & laboratory overview',
          icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
          action: () => navigate('/dashboard'),
        },
        {
          id: 'nav-simulation',
          title: 'Simulation Viewport',
          description: 'Spatial matrix grid & real-time telemetry HUD',
          icon: <Play className="w-4 h-4 text-sky-400" />,
          action: () => navigate('/simulation'),
        },
        {
          id: 'nav-agents',
          title: 'Agent Explorer',
          description: 'Cognitive agent registry, memory stream & dossiers',
          icon: <Users className="w-4 h-4 text-violet-400" />,
          action: () => navigate('/agents'),
        },
        {
          id: 'nav-analytics',
          title: 'Macroeconomic Analytics',
          description: 'Demographics, wealth velocity & entropy curves',
          icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
          action: () => navigate('/analytics'),
        },
        {
          id: 'nav-timeline',
          title: 'Temporal Timeline',
          description: 'Branching historical graph & rollback checkpoints',
          icon: <GitBranch className="w-4 h-4 text-amber-400" />,
          action: () => navigate('/timeline'),
        },
        {
          id: 'nav-settings',
          title: 'Laboratory Settings',
          description: 'Engine tick rates, PRNG seed & renderer configuration',
          icon: <Settings className="w-4 h-4 text-slate-400" />,
          action: () => navigate('/settings'),
        },
      ],
    },
    {
      category: 'LABORATORY ACTIONS',
      items: [
        {
          id: 'act-create',
          title: 'Initialize New Civilization Matrix',
          description: 'Deploy new seed, topology & agent populations',
          icon: <PlusCircle className="w-4 h-4 text-cyan-400" />,
          action: () => navigate('/create-world'),
        },
        {
          id: 'act-landing',
          title: 'Return to Laboratory Portal',
          description: 'Overview of engine architecture and specs',
          icon: <Globe className="w-4 h-4 text-slate-400" />,
          action: () => navigate('/'),
        },
      ],
    },
  ];

  // Filter items based on search query
  const filteredCategories = commands
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const flatItems = filteredCategories.flatMap((c) => c.items);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Reset index on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.12 }}
            className="relative w-full max-w-xl bg-[#0d101a] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or jump to laboratory page..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                ESC
              </span>
            </div>

            {/* Command List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {flatItems.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-400">
                  NO COMMANDS MATCHING &ldquo;{query}&rdquo;
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-mono text-slate-400 tracking-wider font-semibold">
                      {category.category}
                    </div>

                    {category.items.map((item) => {
                      const itemGlobalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                      const isSelected = itemGlobalIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                          className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-slate-800/80 text-white border border-slate-700/60'
                              : 'text-slate-300 hover:bg-slate-900/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="p-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-medium tracking-wide truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer with Keyboard Hints */}
            <div className="px-4 py-2 bg-[#090b12] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Exit</span>
              </div>
              <span className="text-cyan-400/80">NEURAL CITY CONSOLE</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
