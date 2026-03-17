import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Search, Loader2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

const SCAN_MESSAGES = [
  "Scanning Market Signals...",
  "Intercepting Intent Data...",
  "Resolving Professional Identities...",
  "Analyzing Company Growth Patterns...",
  "Calculating Priority Scores...",
  "Finalizing Neural Pipeline..."
];

export const HuntingRadar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 0.2));
    }, 50);

    const msgInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % SCAN_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
    };
  }, []);

  return (
    <div className="relative w-full py-20 flex flex-col items-center justify-center bg-white/40 rounded-[3rem] overflow-hidden border border-line shadow-sm backdrop-blur-md">
      {/* Background Radar Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        {[100, 200, 300, 400, 500].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            className="absolute border border-accent/10 rounded-full"
            style={{ width: size, height: size }}
          />
        ))}
      </div>

      {/* Rotating Sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute w-full h-full max-w-[600px] max-h-[600px] pointer-events-none z-10"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255, 92, 0, 0) 300deg, rgba(255, 92, 0, 0.05) 330deg, rgba(255, 92, 0, 0.1) 360deg)'
        }}
      />

      <div className="relative z-20 flex flex-col items-center text-center w-full max-w-md px-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center border border-accent/10">
            <Target className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-accent/10 rounded-full blur-xl"
          />
        </div>

        <h3 className="text-3xl font-display font-black text-ink tracking-tight mb-2 uppercase">Agent 2: Hunting Leads</h3>
        
        <div className="w-full mt-6 mb-8">
          <ProgressBar progress={progress} label={SCAN_MESSAGES[statusIndex]} />
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-line rounded-full shadow-sm mb-12">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Active Neural Scan</span>
        </div>

        <div className="grid grid-cols-3 gap-8 opacity-80 w-full">
          <div className="flex flex-col items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Intent Intercept</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Identity Resolution</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Target className="w-5 h-5 text-accent-secondary" />
            <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Precision Targeting</span>
          </div>
        </div>
      </div>
    </div>
  );
};
