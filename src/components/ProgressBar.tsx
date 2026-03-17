import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  className = "", 
  color = "bg-accent" 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{label}</span>
          <span className="text-[10px] font-bold text-accent tracking-widest">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className={`h-full ${color} shadow-[0_0_10px_rgba(255,92,0,0.3)]`}
        />
      </div>
    </div>
  );
};
