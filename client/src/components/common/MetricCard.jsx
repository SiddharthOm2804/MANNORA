import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * MetricCard - Scientific telemetry metric card with sparkline visualization.
 * 
 * @param {Object} props
 * @param {string} props.label - Metric name
 * @param {string|number} props.value - Metric value
 * @param {string} [props.unit] - Unit designation (e.g., 'TPS', 'MW', 'c')
 * @param {number} [props.delta] - Percentage or numerical delta
 * @param {'up'|'down'|'neutral'} [props.trend] - Direction
 * @param {number[]} [props.sparkline] - Array of 6-12 numbers for mini trendline
 * @param {string} [props.subtitle] - Technical auxiliary note
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.code] - Telemetry code (e.g., 'SYS.ENG.01')
 */
export default function MetricCard({
  label,
  value,
  unit,
  delta,
  trend = 'neutral',
  sparkline = [40, 45, 42, 48, 52, 58, 55, 62],
  subtitle,
  icon,
  code,
  className = '',
}) {
  // Generate SVG path for sparkline
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline) || 1;
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = sparkline
    .map((val, i) => {
      const x = (i / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    trend === 'up' ? '#34d399' : trend === 'down' ? '#f43f5e' : '#38bdf8';

  return (
    <div
      className={`lab-panel p-4 rounded-lg relative overflow-hidden transition-all duration-200 hover:border-slate-700/80 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span className="uppercase tracking-wider text-[11px] font-mono">{label}</span>
          </div>
          {code && (
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{code}</div>
          )}
        </div>

        {/* Mini Technical Sparkline */}
        <div className="w-20 h-6 shrink-0 opacity-80">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono-data tracking-tight text-white">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-400 uppercase">{unit}</span>
        )}
      </div>

      {/* Footer / Delta & Subtitle */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {delta !== undefined ? (
          <div
            className={`inline-flex items-center gap-1 font-mono text-[11px] ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
          </div>
        ) : (
          <span />
        )}

        {subtitle && (
          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
