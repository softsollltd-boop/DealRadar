import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Brain, Target, Zap, Loader2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface PremiumLoaderProps {
  message?: string;
  subMessage?: string;
  type?: 'initial' | 'analysis' | 'hunting';
}

const STATUS_MESSAGES = {
  initial: [
    "Initializing Neural Logistics...",
    "Synchronizing Market Data...",
    "Calibrating Agent Parameters...",
    "Establishing Secure Connection...",
    "Loading Intelligence Framework..."
  ],
  analysis: [
    "Agent 1: Analyzing Business DNA...",
    "Extracting Value Propositions...",
    "Mapping Competitive Landscapes...",
    "Identifying Intent Triggers...",
    "Synthesizing Strategic Insights..."
  ],
  hunting: [
    "Agent 2: Deploying Market Sensors...",
    "Intercepting Intent Signals...",
    "Resolving Professional Identities...",
    "Calculating Lead Priority Scores...",
    "Finalizing Opportunity Pipeline..."
  ]
};

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  message, 
  subMessage, 
  type = 'initial' 
}) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const messages = STATUS_MESSAGES[type];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const step = Math.random() * 5;
        return Math.min(prev + step, 99);
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % messages.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [messages.length]);

  const Icon = type === 'initial' ? Rocket : type === 'analysis' ? Brain : Target;

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-gradient-to-br from-accent to-accent-secondary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-accent/40 relative z-10"
          >
            <Icon className="text-white w-10 h-10" />
          </motion.div>
          
          {/* Orbiting Particles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-4 border border-accent/10 rounded-[2.5rem]"
            />
          ))}
        </div>

        {/* Text Content */}
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-display font-black tracking-tighter text-ink uppercase">
            {message || "DEALRADAR"}
          </h2>
          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]"
              >
                {messages[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full space-y-6">
          <ProgressBar progress={progress} />
          
          <div className="flex justify-center gap-8 opacity-40">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <Brain className="w-4 h-4 text-accent animate-pulse" />
          </div>
        </div>

        {subMessage && (
          <p className="mt-12 text-[10px] font-medium text-muted uppercase tracking-widest max-w-[240px] text-center leading-relaxed opacity-60">
            {subMessage}
          </p>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-8 bg-gradient-to-b from-accent/0 to-accent/20" />
        <span className="text-[8px] font-black tracking-[0.4em] text-slate-300 uppercase">Neural Logistics v4.0</span>
      </div>
    </div>
  );
};
