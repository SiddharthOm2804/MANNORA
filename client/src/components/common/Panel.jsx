import React from 'react';

/**
 * Panel - Standard scientific laboratory panel container.
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Panel title
 * @param {string} [props.tag] - Technical code/tag (e.g., 'SYS.METRIC')
 * @param {string} [props.subtitle] - Explanatory caption
 * @param {React.ReactNode} [props.actions] - Right-hand controls/actions
 * @param {React.ReactNode} props.children - Panel body content
 * @param {React.ReactNode} [props.footer] - Optional footer
 * @param {boolean} [props.noPadding=false]
 * @param {string} [props.className]
 */
export default function Panel({
  title,
  tag,
  subtitle,
  actions,
  children,
  footer,
  noPadding = false,
  className = '',
}) {
  return (
    <div className={`lab-panel rounded-lg flex flex-col ${className}`}>
      {/* Panel Header */}
      {(title || actions || tag) && (
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {tag && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-400 border border-slate-700/50 uppercase">
                  {tag}
                </span>
              )}
              <h3 className="text-sm font-semibold tracking-wide text-white truncate">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 truncate font-mono text-[11px]">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Panel Body */}
      <div className={`flex-1 ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="px-4 py-2.5 bg-[#0a0d16] border-t border-slate-800/80 text-xs text-slate-400 rounded-b-lg shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
