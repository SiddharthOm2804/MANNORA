import React from 'react';
import { Database, Plus, Search } from 'lucide-react';

/**
 * EmptyState - Scientific empty state representation.
 * 
 * @param {Object} props
 * @param {string} props.title - Heading
 * @param {string} props.description - Detailed description
 * @param {string} [props.code='NO_DATA_STREAM'] - Technical error/status code
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.actionLabel] - Button label
 * @param {Function} [props.onAction] - Button click handler
 */
export default function EmptyState({
  title = 'NO ACTIVE TELEMETRY FOUND',
  description = 'No simulation records or agent entities match the specified query parameters.',
  code = 'NULL_STREAM_00',
  icon,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`lab-panel p-8 rounded-lg flex flex-col items-center justify-center text-center space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
        {icon || <Search className="w-6 h-6 text-slate-400" />}
      </div>

      <div className="space-y-1.5 max-w-md">
        <div className="text-[10px] font-mono text-cyan-400 tracking-wider">
          [{code}]
        </div>
        <h4 className="text-sm font-semibold tracking-wide text-white">
          {title}
        </h4>
        <p className="text-xs text-slate-400 font-mono text-[11px] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs transition-colors shadow-sm shadow-cyan-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
