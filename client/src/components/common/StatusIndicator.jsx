import React from 'react';

/**
 * StatusIndicator - Technical status indicator for laboratory processes & entities.
 * 
 * @param {Object} props
 * @param {'operational'|'simulating'|'paused'|'degraded'|'error'|'idle'} [props.status='operational']
 * @param {string} [props.label]
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.pulse=true]
 * @param {string} [props.className]
 */
export default function StatusIndicator({
  status = 'operational',
  label,
  size = 'md',
  pulse = true,
  className = '',
}) {
  const statusStyles = {
    operational: {
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
      badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
      defaultLabel: 'OPERATIONAL',
    },
    simulating: {
      dot: 'bg-sky-400',
      ping: 'bg-sky-400',
      badge: 'bg-sky-950/40 text-sky-300 border-sky-800/40',
      defaultLabel: 'SIMULATING',
    },
    paused: {
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
      defaultLabel: 'PAUSED',
    },
    degraded: {
      dot: 'bg-amber-500',
      ping: 'bg-amber-500',
      badge: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
      defaultLabel: 'DEGRADED',
    },
    error: {
      dot: 'bg-rose-500',
      ping: 'bg-rose-500',
      badge: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
      defaultLabel: 'FAULT',
    },
    idle: {
      dot: 'bg-slate-400',
      ping: 'bg-slate-400',
      badge: 'bg-slate-900/60 text-slate-400 border-slate-800',
      defaultLabel: 'STANDBY',
    },
  };

  const current = statusStyles[status] || statusStyles.idle;
  const displayText = label !== undefined ? label : current.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider px-2 py-0.5 rounded border ${current.badge} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${current.ping}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}
        />
      </span>
      {displayText && <span className="font-semibold uppercase">{displayText}</span>}
    </span>
  );
}
