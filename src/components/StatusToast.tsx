import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StatusToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const StatusToast: React.FC<StatusToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[110] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <div className={`
              flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl
              ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
                toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 
                'bg-ink/90 border-slate-700 text-white'}
            `}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
              
              <p className="text-sm font-bold tracking-tight pr-4">{toast.message}</p>
              
              <button 
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
