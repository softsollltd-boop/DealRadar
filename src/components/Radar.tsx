import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'motion/react';
import { Search, Target, Zap, Shield, Globe, Activity, Cpu, Radio, User, TrendingUp, Crosshair, AlertTriangle, Info, Maximize2, BarChart3, Waves } from 'lucide-react';
import { AgentLead } from '../types';

interface RadarProps {
  leads?: AgentLead[];
}

interface Blip extends Partial<AgentLead> {
  id: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  type: 'lead' | 'intent' | 'signal';
  timestamp: number;
  isReal?: boolean;
  globalRank?: number;
  signalStrength: number;
}

interface LogEntry extends Partial<AgentLead> {
  logId: string;
  detectedAt: number;
  angle: number;
  confidenceScore: number;
}

export const Radar: React.FC<RadarProps> = ({ leads = [] }) => {
  const [blips, setBlips] = useState<Blip[]>([]);
  const [rotation, setRotation] = useState(0);
  const [detectedLeads, setDetectedLeads] = useState<Blip[]>([]);
  const [tacticalLog, setTacticalLog] = useState<LogEntry[]>([]);
  const [currentDetection, setCurrentDetection] = useState<Blip | null>(null);
  const [lockedTarget, setLockedTarget] = useState<Blip | null>(null);
  const [systemStatus, setSystemStatus] = useState<'IDLE' | 'SCANNING' | 'LOCKED'>('SCANNING');
  const [waveform, setWaveform] = useState<number[]>(new Array(40).fill(0));
  const lastRotationRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [tacticalLog]);

  // Map real leads to persistent blips with global ranking
  const realLeadBlips = useMemo(() => {
    const sortedLeads = [...leads].sort((a, b) => b.priorityScore - a.priorityScore);
    
    return sortedLeads.map((lead, index) => {
      const seed = lead.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (seed % 360);
      const distance = 20 + (seed % 70);
      
      const rad = (angle - 90) * (Math.PI / 180);
      const x = 50 + (distance / 2) * Math.cos(rad);
      const y = 50 + (distance / 2) * Math.sin(rad);

      return {
        ...lead,
        x,
        y,
        angle,
        distance,
        size: 4 + (lead.priorityScore / 20),
        type: 'lead' as const,
        timestamp: Date.now(),
        isReal: true,
        globalRank: index + 1,
        signalStrength: 70 + Math.random() * 30
      };
    });
  }, [leads]);

  // Auto-cycle current detection if no manual lock
  useEffect(() => {
    if (lockedTarget || detectedLeads.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentDetection(prev => {
        const currentIndex = detectedLeads.findIndex(l => l.id === prev?.id);
        const nextIndex = (currentIndex + 1) % detectedLeads.length;
        return detectedLeads[nextIndex];
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [detectedLeads, lockedTarget]);

  useAnimationFrame((time) => {
    const newRotation = (time / 35) % 360; 
    const prevRotation = lastRotationRef.current;
    setRotation(newRotation);

    realLeadBlips.forEach(blip => {
      const blipAngle = blip.angle;
      const sweepPassed = (prevRotation < blipAngle && newRotation >= blipAngle) || 
                        (prevRotation > newRotation && (blipAngle > prevRotation || blipAngle < newRotation));
      
      if (sweepPassed) {
        setDetectedLeads(prev => {
          if (prev.find(dl => dl.id === blip.id)) return prev;
          const newList = [blip as any, ...prev];
          if (!lockedTarget && !currentDetection) {
            setCurrentDetection(blip);
          }
          return newList;
        });

        setTacticalLog(prev => [
          ...prev.slice(-19),
          {
            ...blip,
            logId: `log-${Date.now()}-${blip.id}`,
            detectedAt: Date.now(),
            angle: blip.angle,
            confidenceScore: blip.confidenceScore
          }
        ]);

        setSystemStatus('LOCKED');
        setTimeout(() => setSystemStatus('SCANNING'), 2000);
      }
    });

    // Random ambient noise blips (interference)
    if (Math.random() > 0.96) {
      const angle = (newRotation + (Math.random() * 20 - 10) + 360) % 360;
      const distance = 10 + Math.random() * 85;
      const rad = (angle - 90) * (Math.PI / 180);
      const x = 50 + (distance / 2) * Math.cos(rad);
      const y = 50 + (distance / 2) * Math.sin(rad);

      const newBlip: Blip = {
        id: `noise-${Date.now()}`,
        x,
        y,
        angle,
        distance,
        size: Math.random() * 2 + 1,
        type: Math.random() > 0.7 ? 'intent' : 'signal',
        timestamp: Date.now(),
        signalStrength: Math.random() * 50
      };

      setBlips((prev) => [...prev.slice(-15), newBlip]);
    }

    lastRotationRef.current = newRotation;

    // Update Waveform
    if (Math.random() > 0.7) {
      setWaveform(prev => {
        const next = [...prev.slice(1)];
        const noise = Math.random() * 20;
        const signal = currentDetection ? 60 + Math.random() * 40 : 0;
        next.push(Math.max(noise, signal));
        return next;
      });
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlips(prev => prev.filter(b => now - b.timestamp < 4000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[380px] md:h-[420px] bg-[#000] rounded-[32px] p-3 border-[10px] border-[#1a1a1a] mb-8 group shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,255,65,0.05)] overflow-hidden">
      {/* Physical Bezel Inner Shadow */}
      <div className="absolute inset-0 pointer-events-none z-[70] rounded-[22px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-[1px] border-white/5" />
      
      {/* Glass Reflection & Smudge Effect */}
      <div className="absolute inset-0 pointer-events-none z-[60] opacity-15 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
      
      <div className="relative w-full h-full bg-[#010801] rounded-[20px] overflow-hidden">
        {/* CRT Screen Distortion & Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.12] mix-blend-overlay" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', 
               backgroundSize: '100% 4px, 4px 100%' 
             }} />
        
        {/* Screen Flicker Effect */}
        <motion.div 
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 0.15, repeat: Infinity }}
          className="absolute inset-0 bg-emerald-500/5 pointer-events-none z-40"
        />

      {/* Grid System */}
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #00ff41 1px, transparent 1px), linear-gradient(to right, #00ff41 1px, transparent 1px), linear-gradient(to bottom, #00ff41 1px, transparent 1px)',
             backgroundSize: '100% 100%, 60px 60px, 60px 60px' 
           }} />

      {/* Radar Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[20, 40, 60, 80, 100].map((size) => (
          <div 
            key={size}
            className="absolute border border-emerald-500/20 rounded-full"
            style={{ width: `${size}%`, height: `${size}%` }}
          >
            <span className="absolute top-1/2 left-0 -translate-y-1/2 text-[9px] font-mono text-emerald-500/40 ml-3">
              {size * 10}NM
            </span>
          </div>
        ))}
        
        {/* Bearing Markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <div 
            key={deg}
            className="absolute h-full w-[1px] bg-emerald-500/10"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-500/30">
              {deg.toString().padStart(3, '0')}
            </span>
          </div>
        ))}
      </div>

      {/* Rotating Sweep Line */}
      <div 
        className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
        style={{
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 255, 65, 0) 300deg, rgba(0, 255, 65, 0.05) 330deg, rgba(0, 255, 65, 0.2) 350deg, rgba(0, 255, 65, 0.5) 360deg)'
        }}
      >
        <div className="absolute top-0 left-1/2 w-[4px] h-1/2 bg-emerald-400 origin-bottom shadow-[0_0_30px_#00ff41]" />
      </div>

      {/* Lead Blips */}
      {realLeadBlips.map((blip) => {
        const angleDiff = (rotation - blip.angle + 360) % 360;
        const isNearSweep = angleDiff < 12;
        const opacity = Math.max(0.05, 1 - angleDiff / 270);
        const isLocked = lockedTarget?.id === blip.id;

        return (
          <motion.div
            key={blip.id}
            onClick={() => setLockedTarget(blip)}
            className={`absolute z-30 cursor-crosshair transition-transform hover:scale-150 ${isLocked ? 'z-40' : ''}`}
            style={{
              left: `${blip.x}%`,
              top: `${blip.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity,
            }}
          >
            {/* Phosphor Glow Effect */}
            <div 
              className={`rounded-full transition-all duration-300 ${isLocked ? 'animate-pulse' : ''}`}
              style={{
                width: blip.size,
                height: blip.size,
                backgroundColor: isLocked ? '#fff' : '#00ff41',
                boxShadow: isLocked ? '0 0 20px #fff, 0 0 40px #00ff41' : (isNearSweep ? '0 0 15px #00ff41, 0 0 30px #00ff41' : '0 0 5px #00ff41'),
              }}
            />
            
            {isLocked && (
              <div className="absolute inset-0 -m-4 border border-white/50 rounded-full animate-spin-slow" />
            )}
            
            {(isNearSweep || isLocked) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-6 top-0 flex flex-col gap-1 pointer-events-none"
              >
                <div className={`bg-emerald-950/95 border ${isLocked ? 'border-white' : 'border-emerald-500/50'} px-3 py-1.5 rounded-sm backdrop-blur-xl shadow-[0_0_25px_rgba(0,255,65,0.4)]`}>
                  <div className={`text-[10px] font-black uppercase tracking-tighter whitespace-nowrap flex items-center gap-2 ${isLocked ? 'text-white' : 'text-emerald-400'}`}>
                    {isLocked && <Target className="w-3 h-3 animate-pulse" />}
                    TRGT_{blip.id.slice(-4)} | {blip.name}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="h-1.5 w-16 bg-emerald-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${blip.confidenceScore}%` }}
                        className={`h-full ${isLocked ? 'bg-white' : 'bg-emerald-400'}`}
                      />
                    </div>
                    <span className={`text-[8px] font-mono font-bold ${isLocked ? 'text-white' : 'text-emerald-500'}`}>{blip.confidenceScore}% SNR</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Noise Blips */}
      <AnimatePresence>
        {blips.map((blip) => (
          <motion.div
            key={blip.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="absolute rounded-full z-10 bg-emerald-500/30"
            style={{
              left: `${blip.x}%`,
              top: `${blip.y}%`,
              width: blip.size,
              height: blip.size,
              boxShadow: '0 0 8px rgba(0, 255, 65, 0.2)',
            }}
          />
        ))}
      </AnimatePresence>
        {/* UI Overlays - Technical Readouts */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-40 font-mono">
          
          {/* Top Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#00ff41]" />
                <span className="text-[9px] font-black text-emerald-500 tracking-[0.3em]">TACTICAL_STATION_01</span>
              </div>
              <div className="text-xl font-black text-emerald-500 tracking-tighter flex items-center gap-3">
                DEAL_RADAR_MK_V
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-[9px] font-black rounded border border-emerald-500/40">PRO</span>
              </div>
              <div className="text-[8px] text-emerald-500/60 flex gap-4 mt-0.5">
                <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> 37.77° N</span>
                <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> 122.41° W</span>
              </div>
            </div>

            <div className="flex gap-6 text-right">
              <div className="space-y-0.5">
                <div className="text-[8px] text-emerald-500/40 uppercase font-bold">Freq</div>
                <div className="text-[11px] text-emerald-500 font-black tracking-widest">2.48 GHz</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] text-emerald-500/40 uppercase font-bold">Status</div>
                <div className="text-[11px] text-emerald-500 font-black tracking-widest">{systemStatus}</div>
              </div>
            </div>
          </div>

          {/* Center Crosshair Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="relative w-full h-full">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500" />
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-emerald-500" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] border border-emerald-500 rounded-full" />
              <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-emerald-500" />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-end">
            {/* Left: Detection Log & Waveform */}
            <div className="w-64 space-y-4">
              {/* Waveform Visualizer */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Signal Oscilloscope</span>
                  </div>
                </div>
                <div className="h-10 flex items-end gap-[1px]">
                  {waveform.map((val, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: `${val}%` }}
                      className={`flex-1 min-w-[2px] rounded-t-sm ${val > 50 ? 'bg-emerald-400' : 'bg-emerald-500/30'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[8px] font-black text-emerald-500/40 uppercase border-b border-emerald-500/20 pb-1 flex justify-between">
                  <span>Tactical Log</span>
                  <span>Az</span>
                  <span>SNR</span>
                </div>
                <div ref={logRef} className="space-y-1 max-h-[70px] overflow-y-auto scrollbar-hide scroll-smooth">
                  <AnimatePresence mode="popLayout">
                    {tacticalLog.map((entry) => (
                      <motion.div
                        key={entry.logId}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-[7px] text-emerald-500/80 font-mono font-bold border-l border-emerald-500/20 pl-1.5"
                      >
                        <span className="truncate w-32">[{new Date(entry.detectedAt).toLocaleTimeString([], {hour12: false})}] TARGET: {entry.name?.toUpperCase()}</span>
                        <span>{Math.round(entry.angle || 0)}°</span>
                        <span className="text-emerald-400">{entry.confidenceScore}dB</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: Status Panel */}
            <div className="flex flex-col items-end gap-4">
              {(currentDetection || lockedTarget) && (
                <motion.div 
                  key={(lockedTarget || currentDetection)?.id}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className={`bg-emerald-950/90 border ${lockedTarget ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'border-emerald-500 shadow-[0_0_20px_rgba(0,255,65,0.1)]'} p-4 rounded-xl backdrop-blur-3xl w-64 relative overflow-hidden`}
                >
                  {/* Scanning line inside the panel */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className={`absolute left-0 right-0 h-[1px] z-10 ${lockedTarget ? 'bg-white/30' : 'bg-emerald-400/20'}`}
                  />
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 animate-pulse ${lockedTarget ? 'text-white' : 'text-emerald-400'}`} />
                      <span className={`text-[10px] font-black tracking-[0.1em] ${lockedTarget ? 'text-white' : 'text-emerald-400'}`}>
                        {lockedTarget ? 'MANUAL_LOCK' : 'AUTO_ACQUISITION'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-[12px] font-black text-white truncate leading-none mb-1 uppercase">
                        {(lockedTarget || currentDetection)?.name}
                      </div>
                      <div className="text-[9px] text-emerald-400/80 truncate flex items-center gap-1.5 font-bold">
                        <Globe className="w-2.5 h-2.5" />
                        {(lockedTarget || currentDetection)?.company}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-500/20">
                      <div>
                        <div className="text-[7px] text-emerald-500/50 uppercase font-bold">Conf</div>
                        <div className="text-[11px] font-black text-emerald-400">{(lockedTarget || currentDetection)?.confidenceScore}%</div>
                      </div>
                      <div>
                        <div className="text-[7px] text-emerald-500/50 uppercase font-bold">Priority</div>
                        <div className={`text-[11px] font-black ${(lockedTarget || currentDetection)?.triggerPriority === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {(lockedTarget || currentDetection)?.triggerPriority}
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <div className="text-[7px] text-emerald-500/50 uppercase font-bold mb-1">Analysis</div>
                      <div className="text-[8px] text-emerald-400 leading-tight italic font-medium line-clamp-2">
                        "{(lockedTarget || currentDetection)?.reasoning}"
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Live</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                  <BarChart3 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Az: {Math.round(rotation).toString().padStart(3, '0')}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Accents - Screws */}
      <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-[#333] shadow-inner" />
      <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-[#333] shadow-inner" />
      <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full bg-[#333] shadow-inner" />
      <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-[#333] shadow-inner" />
    </div>
  );
};



