import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal - High-fidelity scientific dialog modal.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {string} [props.tag]
 * @param {string} [props.description]
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  tag,
  description,
  children,
  footer,
  size = 'md',
}) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`relative w-full ${sizeClasses[size]} bg-[#0d101a] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-10`}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {tag && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-850 uppercase">
                      {tag}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-white tracking-wide">
                    {title}
                  </h3>
                </div>
                {description && (
                  <p className="text-xs text-slate-400 mt-1 font-mono text-[11px]">
                    {description}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="px-5 py-3.5 bg-[#090b12] border-t border-slate-800 flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
