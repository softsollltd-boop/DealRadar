import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Target, Zap, Shield, Globe } from 'lucide-react';

interface Blip {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const Radar = () => {
  const [blips, setBlips] = useState<Blip[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newBlip: Blip = {
          id: Date.now(),
          x: Math.random() * 80 + 10, // 10% to 90%
          y: Math.random() * 80 + 10,
          size: Math.random() * 4 + 2,
          opacity: 1,
        };
        setBlips((prev) => [...prev.slice(-15), newBlip]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 md:h-80 bg-ink/5 rounded-[40px] overflow-hidden border border-line mb-12 group">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Radar Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[10%] aspect-square border border-ink/10 rounded-full" />
        <div className="w-[30%] aspect-square border border-ink/10 rounded-full" />
        <div className="w-[50%] aspect-square border border-ink/10 rounded-full" />
        <div className="w-[70%] aspect-square border border-ink/10 rounded-full" />
        <div className="w-[90%] aspect-square border border-ink/10 rounded-full" />
        
        {/* Crosshair */}
        <div className="absolute w-full h-[1px] bg-ink/5" />
        <div className="absolute h-full w-[1px] bg-ink/5" />
      </div>

      {/* Rotating Sweep */}
      <motion.div 
        className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,0,0,0.05) 350deg, rgba(0,0,0,0.1) 360deg)'
        }}
      />

      {/* Blips */}
      <AnimatePresence>
        {blips.map((blip) => (
          <motion.div
            key={blip.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute bg-accent rounded-full shadow-[0_0_10px_#FF5C00]"
            style={{
              left: `${blip.x}%`,
              top: `${blip.y}%`,
              width: blip.size,
              height: blip.size,
            }}
          />
        ))}
      </AnimatePresence>

      {/* UI Overlays */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live Intent Scan
            </div>
            <div className="text-2xl font-bold tracking-tight">Active Surveillance</div>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Signal Strength</div>
              <div className="text-sm font-mono font-medium">98.4%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Nodes Active</div>
              <div className="text-sm font-mono font-medium">1,242</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-ink/30" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Global Reach</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-ink/30" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Verified Only</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-sm border border-line rounded-full">
            <Search className="w-3 h-3 text-ink/40" />
            <span className="text-[10px] font-mono text-ink/60">SCANNING_WEB_GROUNDING_V3...</span>
          </div>
        </div>
      </div>

      {/* Scanning Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/20 to-transparent pointer-events-none" />
    </div>
  );
};
