import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Zap, Brain, Globe, Shield, ArrowRight, 
  CheckCircle2, Search, Mail, Linkedin, Rocket,
  ChevronDown, Play, Star, Users, BarChart3,
  Cpu, Activity, Layers, Sparkles, X
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showDemoModal, setShowDemoModal] = React.useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  const slamInVariants = {
    hidden: { scale: 1.5, opacity: 0, filter: 'blur(20px)' },
    visible: {
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent/10 font-sans overflow-x-hidden">
      {/* Navigation - Ultra Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line bg-bg/80 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/20 group-hover:rotate-[15deg] transition-transform duration-700">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black tracking-tighter text-gradient leading-none">DEALRADAR</span>
              <span className="text-[8px] font-black tracking-[0.4em] text-accent uppercase mt-1">Neural Logistics</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-ink/40">
            <a href="#intelligence" className="hover:text-accent transition-colors">Intelligence</a>
            <a href="#squad" className="hover:text-accent transition-colors">The Squad</a>
            <a href="#infrastructure" className="hover:text-accent transition-colors">Infrastructure</a>
          </div>

          <button 
            onClick={onStart}
            className="px-10 py-4 bg-ink text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-accent transition-all hover:shadow-2xl hover:shadow-accent/30 active:scale-95"
          >
            Launch Platform
          </button>
        </div>
      </nav>

      {/* Hero Section - Editorial / Magazine Style */}
      <section className="relative pt-40 md:pt-64 pb-32 md:pb-48 px-4 md:px-8 overflow-hidden">
        {/* Motion Graphic Background - Showcasing UI Vibe */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/40 to-bg z-10" />
          <div className="absolute inset-0 bg-ink/20 z-[5]" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-40 scale-105"
          >
            <source src="https://cdn.pixabay.com/video/2022/01/18/104523-666355836_large.mp4" type="video/mp4" />
          </video>
          {/* Animated Grid Overlay */}
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-accent/5 border border-accent/10 text-accent text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-8 md:mb-12"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 fill-current" />
              Autonomous Sales Execution v4.2
            </motion.div>

            <motion.h1 
              variants={slamInVariants}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-[160px] font-display font-black tracking-tighter mb-8 md:mb-12 leading-[0.9] md:leading-[0.8] text-ink"
            >
              STOP <span className="text-accent">HUNTING.</span> <br />
              <span className="opacity-20">START CLOSING.</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-2xl lg:text-3xl text-muted max-w-4xl mx-auto mb-12 md:mb-20 leading-relaxed font-medium tracking-tight px-4"
            >
              DealRadar deploys a squad of autonomous AI agents that scan the live web for high-intent triggers, find decision-makers, and write hyper-personalized outreach—all in real-time.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-2xl px-4"
            >
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 md:px-16 py-5 md:py-8 bg-accent text-white font-black text-base md:text-lg rounded-2xl md:rounded-3xl hover:bg-accent-secondary transition-all flex items-center justify-center gap-4 group shadow-[0_32px_64px_-12px_rgba(255,92,0,0.3)] hover:-translate-y-2"
              >
                Launch Neural Squad
                <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-3 transition-transform duration-500" />
              </button>
              <button 
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto px-8 md:px-16 py-5 md:py-8 bg-white text-ink font-black text-base md:text-lg rounded-2xl md:rounded-3xl hover:bg-slate-50 transition-all border border-line flex items-center justify-center gap-4 shadow-sm"
              >
                <Play className="w-5 h-5 md:w-7 md:h-7 fill-current text-accent" />
                Watch Demo
              </button>
            </motion.div>

            {/* Simulated UI Action - Discovery Feed */}
            <motion.div 
              variants={itemVariants}
              className="mt-20 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl hidden md:block"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Neural Discovery Feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent">Live Scanning</span>
                </div>
              </div>
              <div className="p-6 space-y-4 font-mono text-[10px] md:text-xs">
                {[
                  { time: "09:42:11", action: "TRIGGER DETECTED", details: "Series B Funding - TechFlow Inc.", status: "text-accent" },
                  { time: "09:42:15", action: "LEAD IDENTIFIED", details: "Sarah Chen, Head of Growth", status: "text-emerald-400" },
                  { time: "09:42:18", action: "GHOSTWRITING", details: "Hyper-personalized outreach generated", status: "text-blue-400" },
                  { time: "09:42:22", action: "OUTREACH DEPLOYED", details: "Sent via LinkedIn Autonomous Node", status: "text-white/60" }
                ].map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2 + (i * 0.5) }}
                    className="flex items-start gap-4"
                  >
                    <span className="text-white/20 shrink-0">[{log.time}]</span>
                    <span className={`font-bold shrink-0 ${log.status}`}>{log.action}</span>
                    <span className="text-white/40 truncate">→ {log.details}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Floating Stats - Brutalist / Technical */}
          <motion.div 
            variants={itemVariants}
            className="mt-24 md:mt-48 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 border-t border-line pt-12 md:pt-24"
          >
            {[
              { label: "Active Agents", value: "2,400+", icon: <Cpu className="w-5 h-5" /> },
              { label: "Daily Signals", value: "1.2M", icon: <Activity className="w-5 h-5" /> },
              { label: "Avg. Response", value: "14.2%", icon: <Users className="w-5 h-5" /> },
              { label: "ROI Multiple", value: "12x", icon: <BarChart3 className="w-5 h-5" /> }
            ].map((stat, i) => (
              <div key={i} className="group cursor-default p-4 md:p-0">
                <div className="flex items-center gap-3 text-accent mb-2 md:mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                  {stat.icon}
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">{stat.label}</span>
                </div>
                <div className="text-4xl md:text-6xl font-display font-black text-ink tracking-tighter group-hover:text-accent transition-colors duration-500">{stat.value}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof - Ultra Minimal / High-End */}
      <section className="py-32 border-y border-line bg-white/40 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-xs">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30 leading-relaxed">INTEGRATED WITH GLOBAL SALES INFRASTRUCTURE</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-20 grayscale hover:grayscale-0 transition-all duration-1000">
              <span className="text-4xl font-display font-black tracking-tighter">STRIPE</span>
              <span className="text-4xl font-display font-black tracking-tighter">VERCEL</span>
              <span className="text-4xl font-display font-black tracking-tighter">LINEAR</span>
              <span className="text-4xl font-display font-black tracking-tighter">NOTION</span>
              <span className="text-4xl font-display font-black tracking-tighter">FRAMER</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid / Creative Tool Aesthetic */}
      <section id="intelligence" className="py-32 md:py-64 px-4 md:px-8 bg-grid relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-32 items-end mb-24 md:mb-48">
            <div className="space-y-8 md:space-y-12">
              <div className="text-accent font-black text-[10px] uppercase tracking-[0.4em]">Autonomous Intelligence</div>
              <h2 className="text-5xl md:text-7xl lg:text-9xl font-display font-black tracking-tighter text-ink leading-[0.9] md:leading-[0.85]">Built for the <br />Modern Hunter.</h2>
            </div>
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl text-muted leading-relaxed font-medium tracking-tight">Traditional databases are dead. DealRadar uses live web intelligence to find opportunities before your competitors even know they exist.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <Brain className="w-8 h-8 md:w-10 md:h-10" />,
                title: "Autonomous Strategy",
                desc: "Our Strategist agent analyzes your business to find 10+ nuanced triggers that indicate a high probability of conversion.",
                color: "bg-accent/5 text-accent"
              },
              {
                icon: <Globe className="w-8 h-8 md:w-10 md:h-10" />,
                title: "Live Web Intelligence",
                desc: "The Hunter agent scans news, PR, and social signals in real-time to find prospects experiencing your target triggers.",
                color: "bg-emerald-500/5 text-emerald-500"
              },
              {
                icon: <Mail className="w-8 h-8 md:w-10 md:h-10" />,
                title: "Ghostwritten Outreach",
                desc: "Our Ghostwriter agent role-plays as your prospect to write hyper-personalized emails that actually get replies.",
                color: "bg-blue-500/5 text-blue-500"
              }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -20 }}
                className="p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] bg-white border border-line hover:shadow-[0_64px_128px_-24px_rgba(6,78,59,0.08)] transition-all duration-700 group"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl ${feat.color} flex items-center justify-center mb-8 md:mb-12 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-700`}>
                  {feat.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 md:mb-8 text-ink">{feat.title}</h3>
                <p className="text-lg md:text-xl text-muted leading-relaxed font-medium tracking-tight">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Immersive / Hardware Aesthetic */}
      <section id="squad" className="py-32 md:py-64 px-4 md:px-8 bg-ink relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_var(--color-accent)_0%,_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_#10B981_0%,_transparent_50%)]" />
        </div>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-48">
            <div className="flex-1 space-y-12 md:space-y-20">
              <div>
                <div className="text-accent font-black text-[10px] uppercase tracking-[0.4em] mb-8 md:mb-12">The Neural Squad</div>
                <h2 className="text-5xl md:text-7xl lg:text-[120px] font-display font-black tracking-tighter mb-8 md:mb-16 leading-[0.9] md:leading-[0.8] text-white">Meet Your <br />Digital <br />Executioners.</h2>
              </div>
              
              <div className="space-y-10 md:space-y-16">
                {[
                  {
                    step: "01",
                    title: "The Strategist",
                    desc: "Architects high-intent hunting grounds based on your unique offer."
                  },
                  {
                    step: "02",
                    title: "The Hunter",
                    desc: "Scours the live web for real-time signals and decision-makers."
                  },
                  {
                    step: "03",
                    title: "The Ghostwriter",
                    desc: "Crafts personalized, psychological-driven outreach that converts."
                  }
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 md:gap-12 group">
                    <span className="text-3xl md:text-5xl font-display font-black text-accent/20 group-hover:text-accent transition-colors duration-700">{step.step}</span>
                    <div className="space-y-2 md:space-y-4">
                      <h4 className="text-2xl md:text-3xl font-display font-bold text-white">{step.title}</h4>
                      <p className="text-white/40 text-lg md:text-xl font-medium leading-relaxed tracking-tight max-w-md">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="aspect-square bg-[#0A0A0A] rounded-[2.5rem] md:rounded-[4rem] border border-white/5 p-8 md:p-20 relative overflow-hidden shadow-[0_128px_256px_-64px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-grid opacity-5" />
                {/* Agent Visualization - High End Motion */}
                <div className="relative h-full flex flex-col items-center justify-center gap-12 md:gap-24">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0],
                      boxShadow: [
                        '0 0 0px rgba(255,92,0,0)',
                        '0 0 80px rgba(255,92,0,0.2)',
                        '0 0 0px rgba(255,92,0,0)'
                      ]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[2.5rem] bg-accent/10 border border-accent/30 flex items-center justify-center relative z-10"
                  >
                    <Brain className="w-12 h-12 md:w-20 md:h-20 text-accent" />
                  </motion.div>
                  
                  <div className="flex gap-12 md:gap-24">
                    <motion.div 
                      animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
                      transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                      className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
                    >
                      <Search className="w-6 h-6 md:w-10 md:h-10 text-emerald-400" />
                    </motion.div>
                    <motion.div 
                      animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                      className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center"
                    >
                      <Mail className="w-6 h-6 md:w-10 md:h-10 text-blue-400" />
                    </motion.div>
                  </div>

                  {/* Connecting Lines */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg className="w-full h-full">
                      <motion.line 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        x1="50%" y1="35%" x2="35%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="12 12" 
                      />
                      <motion.line 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        x1="50%" y1="35%" x2="65%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="12 12" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Oversized Typographic */}
      <section className="py-40 md:py-80 px-4 md:px-8 text-center bg-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full md:w-[1200px] h-full md:h-[1200px] bg-accent/5 blur-[100px] md:blur-[200px] rounded-full -z-10" />
        <div className="max-w-[1400px] mx-auto">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[180px] font-display font-black tracking-tighter mb-12 md:mb-20 leading-[0.9] md:leading-[0.8] text-ink"
          >
            READY TO <br />
            <span className="text-accent">AUTOMATE?</span>
          </motion.h2>
          
          <p className="text-xl md:text-3xl text-muted mb-12 md:mb-24 max-w-3xl mx-auto font-medium tracking-tight leading-relaxed px-4">Join 500+ high-growth teams using DealRadar to scale their outbound without the headcount.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-2xl mx-auto px-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-12 md:px-24 py-6 md:py-10 bg-ink text-white text-xl md:text-2xl font-black rounded-2xl md:rounded-[2.5rem] hover:bg-accent transition-all hover:scale-105 active:scale-95 shadow-[0_48px_96px_-24px_rgba(6,78,59,0.2)]"
            >
              Start Free Neural Trial
            </button>
            
            <button 
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto px-12 md:px-24 py-6 md:py-10 bg-white text-ink text-xl md:text-2xl font-black rounded-2xl md:rounded-[2.5rem] hover:bg-slate-50 transition-all border border-line flex items-center justify-center gap-4 shadow-sm"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 fill-current text-accent" />
              Watch Demo
            </button>
          </div>
          
          <div className="mt-12 md:mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">
            <span>No Credit Card</span>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-accent" />
            <span>14-Day Full Access</span>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Neural Support</span>
          </div>
        </div>
      </section>

      {/* Footer - High End Minimal */}
      <footer className="py-32 px-8 border-t border-line bg-white">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-32">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-xl shadow-accent/20">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-display font-black tracking-tighter text-ink">DEALRADAR</span>
            </div>
            <p className="text-muted max-w-xs font-medium leading-relaxed">The world's first neural logistics architecture for autonomous sales execution.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-24">
            <div className="space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Platform</h5>
              <ul className="space-y-4 text-sm font-bold text-ink/60">
                <li><a href="#" className="hover:text-accent transition-colors">Intelligence</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">The Squad</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Infrastructure</a></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Company</h5>
              <ul className="space-y-4 text-sm font-bold text-ink/60">
                <li><a href="#" className="hover:text-accent transition-colors">About</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Legal</h5>
              <ul className="space-y-4 text-sm font-bold text-ink/60">
                <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto mt-32 pt-16 border-t border-line flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">© 2026 DealRadar AI. Neural Logistics Architecture.</p>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-ink/40">
            <a href="#" className="hover:text-accent transition-colors">Twitter</a>
            <a href="#" className="hover:text-accent transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-accent transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-ink/90 backdrop-blur-xl"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,92,0,0.2)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <iframe 
                src="https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1" 
                title="DealRadar Demo"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
