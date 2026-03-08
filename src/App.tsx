import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Linkedin, Mail, UserPlus, Trash2, Loader2, 
  CheckCircle2, ExternalLink, Filter, Download, CheckSquare, 
  Square, Zap, Settings, Briefcase, Target, Rocket, Plus,
  Globe, User, DollarSign, Calendar, ChevronRight, AlertCircle,
  RefreshCw, Brain, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessProfile, IntentTrigger, AgentLead, AppConfig, Integrations, Campaign, GhostwriterDraft, Dossier } from './types';
import { analyzeBusiness, huntLeads, findEmail, generateDraft, generateDossier } from './services/gemini';
import { HuntingRadar } from './components/HuntingRadar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'business' | 'triggers' | 'settings'>('dashboard');
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [triggers, setTriggers] = useState<IntentTrigger[]>([]);
  const [leads, setLeads] = useState<AgentLead[]>([]);
  const [filterStatus, setFilterStatus] = useState<AgentLead['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'priority'>('priority');
  const [config, setConfig] = useState<AppConfig>({ geminiApiKeys: [], strategistSystemPrompt: '', hunterSystemPrompt: '' });
  const [integrations, setIntegrations] = useState<Integrations>({ smartleadApiKey: '', instantlyApiKey: '', hunterApiKey: '' });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLeadForDraft, setSelectedLeadForDraft] = useState<AgentLead | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<GhostwriterDraft | null>(null);
  const [generatedDrafts, setGeneratedDrafts] = useState<Record<string, GhostwriterDraft>>({});
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedLeadForDossier, setSelectedLeadForDossier] = useState<AgentLead | null>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [currentDossier, setCurrentDossier] = useState<Dossier | null>(null);
  const [showDossierModal, setShowDossierModal] = useState(false);

  const handleGenerateDossier = async (lead: AgentLead) => {
    setIsGeneratingDossier(true);
    setSelectedLeadForDossier(lead);
    try {
      // Check if we already have a dossier
      const cachedRes = await fetch(`/api/dossiers/${lead.companyDomain}`);
      const cachedData = await cachedRes.json();
      
      if (cachedData) {
        setCurrentDossier(cachedData);
        setShowDossierModal(true);
        return;
      }

      const dossier = await generateDossier(lead.company, lead.companyDomain || '');
      
      // Save to DB
      await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dossier,
          companyDomain: lead.companyDomain,
          companyName: lead.company
        })
      });

      setCurrentDossier(dossier);
      setShowDossierModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate dossier");
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  const handleGenerateDraft = async (lead: AgentLead) => {
    setIsGeneratingDraft(true);
    setSelectedLeadForDraft(lead);
    try {
      const res = await fetch('/api/business');
      const bizData = await res.json();
      const biz = {
        id: bizData.id,
        companyName: bizData.company_name,
        industry: bizData.industry,
        websiteUrl: bizData.website_url,
        offer: bizData.offer,
        icp: bizData.icp,
        productService: bizData.product_service,
        pricing: bizData.pricing,
        updatedAt: new Date(bizData.updated_at).getTime()
      };
      
      const result = await generateDraft(lead, biz);
      setCurrentDraft(result);
      setGeneratedDrafts(prev => ({ ...prev, [lead.id]: result }));
      setShowDraftModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate draft");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const calculatePriorityScore = (lead: Partial<AgentLead>) => {
    let score = lead.score || 0;
    
    // Trigger Priority Multiplier
    if (lead.triggerPriority === 'High') score += 50;
    if (lead.triggerPriority === 'Medium') score += 25;
    
    if (lead.status === 'contacted') score += 10;
    if (lead.status === 'replied') score += 50;
    if (lead.status === 'booked') score += 100;
    if (lead.status === 'rejected') score -= 200;
    if (lead.email) score += 20;
    if (lead.notes && lead.notes.length > 10) score += 10;
    if (lead.confidenceScore) {
      score += (lead.confidenceScore / 5); // Add up to 20 points for 100% confidence
    }
    return score;
  };
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHunting, setIsHunting] = useState<string | null>(null); // triggerId
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [bizRes, trigRes, leadRes, confRes, intRes, campRes] = await Promise.all([
        fetch('/api/business'),
        fetch('/api/triggers'),
        fetch('/api/leads'),
        fetch('/api/config'),
        fetch('/api/integrations'),
        fetch('/api/integrations/campaigns')
      ]);
      
      const bizData = await bizRes.json();
      const biz = bizData ? {
        id: bizData.id,
        companyName: bizData.company_name,
        industry: bizData.industry,
        websiteUrl: bizData.website_url,
        offer: bizData.offer,
        icp: bizData.icp,
        productService: bizData.product_service,
        pricing: bizData.pricing,
        updatedAt: new Date(bizData.updated_at).getTime()
      } : null;
      
      const trigs = await trigRes.json();
      const lds = await leadRes.json();
      const conf = await confRes.json();
      const ints = await intRes.json();
      const camps = await campRes.json();

      setBusiness(biz);
      setTriggers(trigs);
      setLeads(lds.map((l: any) => {
        const baseLead = {
          id: l.id,
          name: l.name,
          title: l.title,
          company: l.company,
          companyDomain: l.company_domain,
          location: l.location,
          linkedinUrl: l.linkedin_url,
          avatarUrl: l.avatar_url,
          about: l.about,
          email: l.email,
          triggerEvent: l.trigger_event,
          triggerPriority: l.trigger_priority,
          personalizedHook: l.personalized_hook,
          reasoning: l.reasoning,
          score: l.score,
          confidenceScore: l.confidence_score || 0,
          sourceCitations: JSON.parse(l.source_citations || '[]'),
          status: l.status,
          notes: l.notes,
          createdAt: new Date(l.created_at).getTime()
        };
        return {
          ...baseLead,
          priorityScore: calculatePriorityScore(baseLead as any)
        };
      }));
      setConfig(conf);
      setIntegrations(ints);
      setCampaigns(camps);
      
      if (!biz) setActiveTab('business');
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get('company_name'),
      industry: formData.get('industry'),
      website_url: formData.get('website_url'),
      offer: formData.get('offer'),
      icp: formData.get('icp'),
      product_service: formData.get('product_service'),
      pricing: formData.get('pricing'),
    };

    try {
      await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchInitialData();
      setActiveTab('dashboard');
    } catch (e) {
      setError("Failed to save business profile");
    }
  };

  const handleAnalyzeBusiness = async () => {
    if (!business) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const newTriggers = await analyzeBusiness(business, config.strategistSystemPrompt);
      const sortedTriggers = [...newTriggers].sort((a, b) => (a.rank || 0) - (b.rank || 0));
      await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggers: sortedTriggers })
      });
      setTriggers(sortedTriggers);
      setActiveTab('triggers');
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHuntLeads = async (trigger: IntentTrigger) => {
    if (!business) return;
    setIsHunting(trigger.id);
    setError(null);
    try {
      const newLeads = await huntLeads(trigger, business, config.hunterSystemPrompt);
      for (const lead of newLeads) {
        // Automatically try to find email
        let email = lead.email;
        if (!email) {
          try {
            email = await findEmail({ 
              name: lead.name, 
              title: lead.title, 
              company: lead.company, 
              domain: lead.companyDomain 
            }) || undefined;
          } catch (e) {
            console.error("Email finding failed for", lead.name, e);
          }
        }

        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lead,
            email,
            linkedin_url: lead.linkedinUrl,
            avatar_url: lead.avatarUrl,
            about: lead.about,
            company_domain: lead.companyDomain,
            trigger_event: lead.triggerEvent,
            trigger_priority: lead.triggerPriority,
            personalized_hook: lead.personalizedHook,
            priority_score: calculatePriorityScore({ ...lead, email })
          })
        });
      }
      fetchInitialData();
      setActiveTab('dashboard');
    } catch (e: any) {
      setError(e.message || "Hunting failed");
    } finally {
      setIsHunting(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keys = (formData.get('keys') as string).split('\n').filter(k => k.trim());
    const newConfig = {
      geminiApiKeys: keys,
      strategistSystemPrompt: formData.get('strategist_prompt') as string,
      hunterSystemPrompt: formData.get('hunter_prompt') as string,
    };

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      setConfig(newConfig);
      setError(null);
    } catch (e) {
      setError("Failed to save config");
    }
  };

  const handleSaveIntegrations = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      smartleadApiKey: formData.get('smartlead_api_key') as string,
      instantlyApiKey: formData.get('instantly_api_key') as string,
      hunterApiKey: formData.get('hunter_api_key') as string,
    };

    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIntegrations(payload);
      setError(null);
    } catch (e) {
      setError("Failed to save integrations");
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<AgentLead>) => {
    try {
      const currentLead = leads.find(l => l.id === id);
      if (!currentLead) return;

      const updatedLead = { ...currentLead, ...updates };
      const newPriorityScore = calculatePriorityScore(updatedLead);
      
      const finalUpdates = { ...updates, priority_score: newPriorityScore };

      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdates)
      });
      
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, priorityScore: newPriorityScore } : l));
    } catch (e) {
      setError("Failed to update lead");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      setError("Failed to delete lead");
    }
  };

  const handleDownloadCSV = () => {
    const filtered = leads.filter(l => {
      const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    const headers = ['Name', 'Title', 'Company', 'Location', 'Email', 'LinkedIn', 'Trigger', 'Score', 'Status', 'Notes'];
    const rows = filtered.map(l => [
      l.name, l.title, l.company, l.location, l.email || '', l.linkedinUrl, l.triggerEvent, l.score, l.status, l.notes || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(String).map(s => `"${s.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg selection:bg-accent/20 bg-grid">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass px-6 py-4 transition-all duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-secondary rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-xl shadow-accent/20">
              <Rocket className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-tighter text-gradient">DEALRADAR</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Neural Logistics Architecture</p>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Briefcase className="w-4 h-4" />} label="Pipeline" />
            <NavButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={<Globe className="w-4 h-4" />} label="Strategy" />
            <NavButton active={activeTab === 'triggers'} onClick={() => setActiveTab('triggers')} icon={<Target className="w-4 h-4" />} label="Intents" />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="Engine" />
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-slate-100"
            >
              <div className="flex flex-col p-4 gap-2">
                <MobileNavButton 
                  active={activeTab === 'dashboard'} 
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
                  icon={<Briefcase className="w-5 h-5" />} 
                  label="Dashboard" 
                />
                <MobileNavButton 
                  active={activeTab === 'business'} 
                  onClick={() => { setActiveTab('business'); setIsMobileMenuOpen(false); }} 
                  icon={<Globe className="w-5 h-5" />} 
                  label="Business Profile" 
                />
                <MobileNavButton 
                  active={activeTab === 'triggers'} 
                  onClick={() => { setActiveTab('triggers'); setIsMobileMenuOpen(false); }} 
                  icon={<Target className="w-5 h-5" />} 
                  label="Intent Triggers" 
                />
                <MobileNavButton 
                  active={activeTab === 'settings'} 
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
                  icon={<Settings className="w-5 h-5" />} 
                  label="Settings" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              className="space-y-12"
            >
              <AnimatePresence>
                {isHunting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <HuntingRadar />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                  <h2 className="text-5xl font-display font-black tracking-tight text-ink">Intelligence Pipeline</h2>
                  <p className="text-muted mt-3 text-lg max-w-xl leading-relaxed">
                    Autonomous agents are currently monitoring <span className="text-accent font-bold">{leads.length}</span> high-intent opportunities across your target markets.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleDownloadCSV} className="btn-secondary !px-5 !py-2.5 !text-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button onClick={fetchInitialData} className="p-3 hover:bg-white rounded-xl transition-all text-ink border border-line bg-white/50">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveTab('triggers')} className="btn-primary !px-6 !py-3">
                    <Zap className="w-4 h-4 fill-current" />
                    Launch Hunter
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-line shadow-sm">
                <div className="relative w-full lg:w-[540px]">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, company, or role..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-premium pl-14"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Sort</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-bold text-sm outline-none cursor-pointer hover:text-accent transition-all text-slate-700"
                    >
                      <option value="priority">Priority Score</option>
                      <option value="score">AI Fit Score</option>
                      <option value="date">Date Added</option>
                    </select>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden lg:block" />
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {(['all', 'new', 'contacted', 'replied', 'booked', 'rejected'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          filterStatus === status 
                            ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {leads
                  .filter(l => {
                    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
                    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          l.title.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesStatus && matchesSearch;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
                    if (sortBy === 'score') return b.score - a.score;
                    return b.createdAt - a.createdAt;
                  })
                  .length > 0 ? (
                  leads
                    .filter(l => {
                      const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
                      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            l.title.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesStatus && matchesSearch;
                    })
                    .sort((a, b) => {
                      if (sortBy === 'score') return b.score - a.score;
                      return b.createdAt - a.createdAt;
                    })
                    .map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        campaigns={campaigns}
                        onUpdate={(updates) => handleUpdateLead(lead.id, updates)}
                        onDelete={() => handleDeleteLead(lead.id)}
                        onGenerateDraft={() => handleGenerateDraft(lead)}
                        isGeneratingDraft={isGeneratingDraft && selectedLeadForDraft?.id === lead.id}
                        onGenerateDossier={() => handleGenerateDossier(lead)}
                        isGeneratingDossier={isGeneratingDossier && selectedLeadForDossier?.id === lead.id}
                        hasDraft={!!generatedDrafts[lead.id]}
                        onViewDraft={() => {
                          setCurrentDraft(generatedDrafts[lead.id]);
                          setShowDraftModal(true);
                        }}
                      />
                    ))
                ) : (
                  <div className="col-span-full py-32 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Search className="text-slate-300 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No leads found yet</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Go to the Intents tab to start Agent 2 hunting for your business.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'business' && (
            <motion.div key="business" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-display font-black mb-3 text-gradient">Business Intelligence</h2>
                <p className="text-muted">Agent 1 requires a deep understanding of your value proposition to identify high-conversion intent triggers.</p>
              </div>

              <form onSubmit={handleSaveBusiness} className="glass-card p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Company Name" name="company_name" defaultValue={business?.companyName} placeholder="Your Company Name" icon={<Briefcase className="w-4 h-4" />} />
                  <Input label="Industry" name="industry" defaultValue={business?.industry} placeholder="e.g. SaaS, Fintech" icon={<Target className="w-4 h-4" />} />
                </div>
                <Input label="Website URL" name="website_url" defaultValue={business?.websiteUrl} placeholder="https://yourcompany.com" icon={<Globe className="w-4 h-4" />} />
                <TextArea label="Core Offer" name="offer" defaultValue={business?.offer} placeholder="What is the primary transformation you provide?" />
                <TextArea label="Ideal Customer Profile" name="icp" defaultValue={business?.icp} placeholder="Who are your highest-value prospects?" />
                <TextArea label="Solution Details" name="product_service" defaultValue={business?.productService} placeholder="Describe your product or service in detail..." />
                <Input label="Pricing Model" name="pricing" defaultValue={business?.pricing} placeholder="e.g. $5k/mo or $50k project" icon={<DollarSign className="w-4 h-4" />} />
                
                <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <button type="submit" className="w-full btn-secondary !py-4">
                    Save Profile
                  </button>
                  {business && (
                    <button 
                      type="button"
                      onClick={handleAnalyzeBusiness}
                      disabled={isAnalyzing}
                      className="w-full btn-primary !py-4 flex items-center justify-center gap-3"
                    >
                      {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                      Run Agent 1 Analysis
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'triggers' && (
            <motion.div key="triggers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-display font-black text-gradient">Intent Triggers</h2>
                  <p className="text-muted mt-2 max-w-md">Agent 1's strategic framework for identifying high-value outreach opportunities.</p>
                </div>
                <button 
                  onClick={handleAnalyzeBusiness}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-accent/5 text-accent rounded-xl text-xs hover:bg-accent/10 transition-all flex items-center gap-2 font-bold"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Refresh Strategy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {triggers.length > 0 ? (
                  triggers.map((trigger) => (
                    <div key={trigger.id} className="glass-card p-10 flex flex-col group">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:text-accent transition-colors duration-500 relative border border-line">
                            <Target className="w-6 h-6" />
                            {trigger.rank && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                                {trigger.rank}
                              </div>
                            )}
                          </div>
                          {trigger.priority && (
                            <div className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-bold ${
                              trigger.priority === 'High' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                              trigger.priority === 'Medium' ? 'bg-orange-50 text-orange-500 border border-orange-100' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {trigger.priority} Priority
                            </div>
                          )}
                          {trigger.maxAgeDays && (
                            <div className="px-3 py-1 rounded-full text-xs bg-slate-50 text-slate-500 border border-slate-100 whitespace-nowrap font-medium">
                              {trigger.maxAgeDays}D Shelf Life
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleHuntLeads(trigger)}
                          disabled={isHunting === trigger.id}
                          className="btn-primary !px-4 !py-2 !text-xs !rounded-xl flex items-center gap-2"
                        >
                          {isHunting === trigger.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Hunt Leads
                        </button>
                      </div>
                      <h3 className="text-2xl font-display font-bold mb-3 text-ink">{trigger.title}</h3>
                      <p className="text-muted text-sm mb-6 flex-grow">{trigger.description}</p>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
                          <p className="text-xs font-bold text-emerald-700/60 mb-2 uppercase tracking-wider">Agent Reasoning</p>
                          <p className="text-xs text-emerald-900 italic">"{trigger.reasoning}"</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trigger.keywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-line rounded-full text-xs text-slate-500 font-medium">#{kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-40 text-center glass-card border-dashed">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-line">
                      <Brain className="text-slate-200 w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-ink">Strategic Void</h3>
                    <p className="text-muted max-w-xs mx-auto mt-3 leading-relaxed">Agent 1 requires your business profile to architect a high-intent hunting strategy.</p>
                    <button 
                      onClick={handleAnalyzeBusiness}
                      disabled={isAnalyzing}
                      className="mt-10 btn-primary mx-auto flex items-center gap-3"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      Generate Strategy
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-display font-black mb-3 text-gradient">Engine Configuration</h2>
                <p className="text-muted">Fine-tune the autonomous agents and manage your delivery infrastructure.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Core Config */}
                <div className="space-y-12">
                  <form onSubmit={handleSaveConfig} className="glass-card p-10 space-y-10">
                    <h3 className="text-2xl font-display font-bold flex items-center gap-3 text-ink">
                      <Brain className="w-6 h-6 text-accent" />
                      AI Intelligence
                    </h3>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-ink/70 ml-1">Gemini API Keys</label>
                      <textarea 
                        name="keys"
                        defaultValue={config.geminiApiKeys.join('\n')}
                        className="input-premium h-40 font-mono text-xs py-4"
                        placeholder="Enter one key per line..."
                      />
                      <p className="text-xs text-ink/60 mt-1 ml-1">The engine automatically rotates keys to ensure maximum throughput.</p>
                    </div>

                    <TextArea label="Agent 1: Strategist Prompt" name="strategist_prompt" defaultValue={config.strategistSystemPrompt} placeholder="Custom instructions for strategic analysis..." />
                    <TextArea label="Agent 2: Hunter Prompt" name="hunter_prompt" defaultValue={config.hunterSystemPrompt} placeholder="Custom instructions for lead discovery..." />

                    <button type="submit" className="w-full btn-primary">
                      Save Configuration
                    </button>
                  </form>
                </div>

                {/* Integrations */}
                <form onSubmit={handleSaveIntegrations} className="glass-card p-10 space-y-10">
                  <h3 className="text-2xl font-display font-bold flex items-center gap-3 text-ink">
                    <Zap className="w-6 h-6 text-accent" />
                    Delivery Systems
                  </h3>
                  
                  <div className="space-y-8">
                    <div className="p-8 bg-white/50 border border-line rounded-[2rem] space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-accent/20">
                          <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-ink">Smartlead.ai</h4>
                          <p className="text-xs text-accent font-bold mt-0.5 uppercase tracking-widest">Infrastructure</p>
                        </div>
                      </div>
                      <Input 
                        label="API Key" 
                        name="smartlead_api_key" 
                        defaultValue={integrations.smartleadApiKey} 
                        placeholder="Enter API Key" 
                        icon={<Mail className="w-4 h-4" />} 
                      />
                    </div>

                    <div className="p-8 bg-white/50 border border-line rounded-[2rem] space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-secondary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-accent-secondary/20">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-ink">Instantly.ai</h4>
                          <p className="text-xs text-accent-secondary font-bold mt-1 uppercase tracking-widest">Infrastructure</p>
                        </div>
                      </div>
                      <Input 
                        label="API Key" 
                        name="instantly_api_key" 
                        defaultValue={integrations.instantlyApiKey} 
                        placeholder="Enter API Key" 
                        icon={<Mail className="w-4 h-4" />} 
                      />
                    </div>

                    <div className="p-8 bg-white/50 border border-line rounded-[2rem] space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                          <Search className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-ink">Hunter.io</h4>
                          <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-widest">Intelligence</p>
                        </div>
                      </div>
                      <Input 
                        label="API Key" 
                        name="hunter_api_key" 
                        defaultValue={integrations.hunterApiKey} 
                        placeholder="Enter API Key" 
                        icon={<Mail className="w-4 h-4" />} 
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full btn-primary">
                    Save Integrations
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Ghostwriter Modal */}
      <AnimatePresence>
        {showDraftModal && currentDraft && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ink/20 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-line overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-line flex items-center justify-between bg-bg/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-secondary rounded-2xl flex items-center justify-center text-white">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-gradient">Agent 3: Ghostwriter</h3>
                    <p className="text-xs font-bold text-accent mt-1 uppercase tracking-widest">Context-Aware Outreach Engine</p>
                  </div>
                </div>
                <button onClick={() => setShowDraftModal(false)} className="p-2 hover:bg-accent/10 rounded-xl transition-colors text-accent">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Prospect Perspective Sidebar */}
                  <div className="lg:col-span-1 space-y-8">
                    <div className="p-6 bg-accent/5 rounded-xl border border-accent/20">
                      <p className="text-xs font-bold text-accent mb-3 flex items-center gap-2">
                        <User className="w-3 h-3" /> Prospect Mindset
                      </p>
                      <p className="text-sm text-ink/90 italic leading-relaxed">
                        "{currentDraft.prospectPerspective.mindset}"
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-3">Top Priorities</p>
                        <ul className="space-y-2">
                          {currentDraft.prospectPerspective.priorities.map((p, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-ink/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-3">Core Concerns</p>
                        <ul className="space-y-2">
                          {currentDraft.prospectPerspective.concerns.map((c, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-ink/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Drafts Main Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <p className="text-xs font-bold text-ink/70">Generated Variations</p>
                    <div className="space-y-6">
                      {currentDraft.drafts.map((d, i) => (
                        <div key={i} className="group relative p-6 bg-white border border-slate-100 rounded-xl hover:border-accent/30 transition-all shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                d.type === 'Professional' ? 'bg-accent-soft text-accent' :
                                d.type === 'Conversational' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-orange-50 text-orange-600'
                              }`}>
                                {d.type}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variation {i + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`);
                                  alert("Draft copied to clipboard!");
                                }}
                                className="p-2 hover:bg-accent/10 text-slate-400 hover:text-accent rounded-lg transition-all"
                                title="Copy to Clipboard"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject Line</p>
                              <p className="text-sm font-bold text-slate-900">{d.subject}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message Body</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{d.body}</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                            <button 
                              onClick={() => {
                                // Close modal and trigger push menu on the lead card
                                setShowDraftModal(false);
                                setActiveTab('dashboard');
                                // We'll need to scroll to the lead or just show a success message
                                alert("Draft selected. Use the 'Deploy' button on the lead card to send this to your campaign.");
                              }}
                              className="btn-primary !py-2.5 !px-5 !text-[10px] !rounded-lg"
                            >
                              Select This Variation
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500 italic">Drafts are automatically modulated based on the prospect's seniority and context.</p>
                <button 
                  onClick={() => setShowDraftModal(false)}
                  className="btn-secondary !py-3 !px-8"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deep Research Dossier Modal */}
      <AnimatePresence>
        {showDossierModal && currentDossier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ink/20 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-line overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-line flex items-center justify-between bg-bg/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-gradient">Deep Research Dossier</h3>
                    <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">{currentDossier.companyName} • Updated {new Date(currentDossier.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setShowDossierModal(false)} className="p-2 hover:bg-emerald-50 rounded-xl transition-colors text-emerald-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Summary & Executives */}
                  <div className="lg:col-span-4 space-y-10">
                    <div>
                      <p className="text-xs font-bold text-ink/70 mb-4">Company Summary</p>
                      <p className="text-sm text-ink/90 leading-relaxed">{currentDossier.summary}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-ink/70 mb-6">Key Executives</p>
                      <div className="space-y-6">
                        {currentDossier.keyExecutives.map((exec, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 bg-ink/5 rounded-xl flex items-center justify-center text-ink/50 flex-shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-ink">{exec.name}</p>
                              <p className="text-xs font-bold text-accent mt-0.5">{exec.role}</p>
                              <p className="text-xs text-ink/80 mt-2 leading-relaxed">{exec.bio}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-ink/70 mb-4">Tech Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {currentDossier.techStack.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-ink/5 rounded-full text-xs font-medium text-ink/70">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: News, Priorities, Pain Points */}
                  <div className="lg:col-span-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-6">Strategic Priorities</p>
                        <ul className="space-y-4">
                          {currentDossier.strategicPriorities.map((p, i) => (
                            <li key={i} className="flex items-start gap-4">
                              <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <Target className="w-3 h-3" />
                              </div>
                              <p className="text-sm text-ink/90 leading-relaxed">{p}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-6">Likely Pain Points</p>
                        <ul className="space-y-4">
                          {currentDossier.painPoints.map((p, i) => (
                            <li key={i} className="flex items-start gap-4">
                              <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0">
                                <AlertCircle className="w-3 h-3" />
                              </div>
                              <p className="text-sm text-ink/90 leading-relaxed">{p}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-ink/70 mb-6">Recent News & Events</p>
                      <div className="space-y-6">
                        {currentDossier.recentNews.map((news, i) => (
                          <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:border-accent/30 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-slate-400">{news.date}</span>
                              <a href={news.url} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs font-bold flex items-center gap-1">
                                Source <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-2">{news.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{news.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-4">Financial Performance</p>
                        <p className="text-sm text-ink/90 leading-relaxed">{currentDossier.financialPerformance}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink/70 mb-4">Direct Competitors</p>
                        <div className="flex flex-wrap gap-2">
                          {currentDossier.competitors.map((comp, i) => (
                            <span key={i} className="px-3 py-1 bg-accent/5 rounded-full text-xs font-bold text-accent">{comp}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500 italic">Deep Research Dossiers are generated using real-time market intelligence and search grounding.</p>
                <button 
                  onClick={() => setShowDossierModal(false)}
                  className="btn-secondary !py-3 !px-8"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${active ? 'bg-white shadow-md text-accent border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: `w-3.5 h-3.5 ${active ? 'text-accent' : 'text-slate-400'}` })}
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-xl text-base font-medium transition-all ${active ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Input({ label, name, placeholder, icon, defaultValue }: { label: string, name: string, placeholder: string, icon: React.ReactNode, defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>
        <input 
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="input-premium pl-12"
        />
      </div>
    </div>
  );
}

function TextArea({ label, name, placeholder, defaultValue }: { label: string, name: string, placeholder: string, defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <textarea 
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input-premium h-32 py-4 leading-relaxed"
      />
    </div>
  );
}


const LeadCard: React.FC<{ 
  lead: AgentLead, 
  campaigns: Campaign[],
  onUpdate: (updates: Partial<AgentLead>) => void,
  onDelete: () => void,
  onGenerateDraft: () => void,
  isGeneratingDraft: boolean,
  onGenerateDossier: () => void,
  isGeneratingDossier: boolean,
  hasDraft?: boolean,
  onViewDraft?: () => void
}> = ({ lead, campaigns, onUpdate, onDelete, onGenerateDraft, isGeneratingDraft, onGenerateDossier, isGeneratingDossier, hasDraft, onViewDraft }) => {
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showPushMenu, setShowPushMenu] = useState(false);
  const [email, setEmail] = useState(lead.email);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');

  const handleFindEmail = async () => {
    setIsFindingEmail(true);
    try {
      const found = await findEmail(lead);
      if (found) {
        setEmail(found);
        onUpdate({ email: found });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFindingEmail(false);
    }
  };

  const handlePush = async (campaign: Campaign) => {
    if (!email) {
      alert("Please find the email address before pushing to a campaign.");
      return;
    }
    setIsPushing(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: campaign.platform, campaignId: campaign.id })
      });
      if (res.ok) {
        onUpdate({ status: 'contacted' });
        setShowPushMenu(false);
      } else {
        const err = await res.json();
        alert(`Push failed: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Push failed due to a network error.");
    } finally {
      setIsPushing(false);
    }
  };

  const statusColors = {
    new: 'bg-slate-300',
    contacted: 'bg-blue-400',
    replied: 'bg-emerald-500',
    booked: 'bg-emerald-600',
    rejected: 'bg-rose-500'
  };

  const getPriorityLevel = (score: number) => {
    if (score > 150) return { label: 'Urgent', color: 'bg-rose-500 text-white' };
    if (score > 100) return { label: 'High', color: 'bg-amber-500 text-white' };
    if (score > 50) return { label: 'Medium', color: 'bg-blue-500 text-white' };
    return { label: 'Low', color: 'bg-slate-800 text-slate-400' };
  };

  const priority = getPriorityLevel(lead.priorityScore);

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="glass-card overflow-hidden flex flex-col h-full group"
    >
      {/* Card Header with Avatar */}
      <div className="relative h-32 bg-white/40 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,var(--color-accent),transparent_70%)] animate-pulse" />
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button 
            onClick={onGenerateDossier}
            disabled={isGeneratingDossier}
            className="w-10 h-10 bg-white/80 backdrop-blur-md border border-line text-emerald-600 hover:bg-white rounded-xl flex items-center justify-center transition-all shadow-sm"
            title="Deep Research Dossier"
          >
            {isGeneratingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
          <button 
            onClick={onDelete}
            className="w-10 h-10 bg-white/80 backdrop-blur-md border border-line text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all shadow-sm"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 -mt-12 relative z-10 flex-grow flex flex-col">
        <div className="flex items-end justify-between mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
              {lead.avatarUrl ? (
                <img 
                  src={lead.avatarUrl} 
                  alt={lead.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-slate-200" />
              )}
            </div>
            <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full ${statusColors[lead.status]} border-4 border-white shadow-sm`} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {hasDraft && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Draft Ready
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${priority.color}`}>
                {priority.label}
              </span>
              <span className="px-3 py-1 bg-ink text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                FIT: {lead.score}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${lead.confidenceScore > 80 ? 'bg-emerald-500' : lead.confidenceScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence {lead.confidenceScore}%</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-display font-black tracking-tight text-ink truncate">{lead.name}</h3>
            <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-accent transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm font-bold text-accent uppercase tracking-wide">{lead.title}</p>
          <div className="flex items-center gap-2 mt-2 text-muted">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{lead.company}</span>
            {lead.location && (
              <>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{lead.location}</span>
              </>
            )}
          </div>
        </div>

        {lead.about && (
          <div className="mb-8">
            <p className="text-xs text-muted leading-relaxed line-clamp-2 italic">
              "{lead.about}"
            </p>
          </div>
        )}

        <div className="space-y-6 flex-grow">
          {/* Intelligence Section */}
          <div className="p-6 bg-white/50 rounded-2xl border border-line space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-accent fill-accent" /> Intent Trigger
                </span>
                <span className="text-[10px] font-bold text-slate-400">LIVE SIGNAL</span>
              </div>
              <p className="text-xs font-bold text-ink leading-relaxed">
                {lead.triggerEvent}
              </p>
            </div>

            <div className="pt-4 border-t border-line">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                <Rocket className="w-3 h-3 text-accent" /> Personalized Hook
              </span>
              <p className="text-xs font-bold text-ink leading-relaxed italic">
                "{lead.personalizedHook}"
              </p>
            </div>

            <div className="pt-4 border-t border-line">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                <Brain className="w-3 h-3 text-emerald-500" /> Agent Reasoning
              </span>
              <p className="text-xs text-muted leading-relaxed">
                {lead.reasoning}
              </p>
            </div>
          </div>

          {/* CRM Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Notes</span>
              <button 
                onClick={() => {
                  if (isEditingNotes) onUpdate({ notes });
                  setIsEditingNotes(!isEditingNotes);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-secondary transition-colors"
              >
                {isEditingNotes ? 'Save' : 'Edit'}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-premium h-24 py-3 text-xs !bg-white"
                placeholder="Add strategic notes..."
              />
            ) : (
              <p className="text-xs text-muted italic min-h-[3em]">
                {lead.notes || "No strategic notes documented."}
              </p>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 pt-8 border-t border-line space-y-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={hasDraft ? onViewDraft : onGenerateDraft}
              disabled={isGeneratingDraft}
              className={`group relative flex-1 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg overflow-hidden ${
                hasDraft ? 'bg-gradient-to-br from-accent to-accent-secondary shadow-accent/20' : 'bg-ink hover:bg-ink/90 shadow-ink/20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-3 z-10 text-white">
                {isGeneratingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className={`w-4 h-4 ${hasDraft ? 'text-white' : 'text-accent'}`} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isGeneratingDraft ? 'Ghostwriting...' : hasDraft ? 'View Full Outreach' : 'Generate Full Outreach'}
                </span>
              </div>
            </button>
            
            {email ? (
              <div className="flex items-center justify-between bg-white rounded-xl px-4 h-12 border border-line min-w-[140px]">
                <span className="text-[10px] font-mono font-bold text-ink truncate mr-2">{email}</span>
                <button onClick={() => {
                  navigator.clipboard.writeText(email);
                  alert("Email copied!");
                }} className="text-[10px] font-black text-accent hover:text-accent-secondary transition-colors">COPY</button>
              </div>
            ) : (
              <button 
                onClick={handleFindEmail}
                disabled={isFindingEmail}
                className="w-12 h-12 btn-secondary !p-0 !bg-white !border-line hover:!bg-slate-50 flex items-center justify-center"
                title="Find Intelligence"
              >
                {isFindingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowPushMenu(!showPushMenu)}
              disabled={isPushing || lead.status === 'contacted'}
              className={`w-full btn-primary !py-4 !text-xs shadow-xl shadow-accent/10 ${
                lead.status === 'contacted' ? 'opacity-50 cursor-default' : ''
              }`}
            >
              {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {lead.status === 'contacted' ? 'DEPLOYED TO CAMPAIGN' : 'DEPLOY TO CAMPAIGN'}
            </button>

            <AnimatePresence>
              {showPushMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-4 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Deployment Target</span>
                    <button onClick={() => setShowPushMenu(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-hide">
                    {campaigns.length > 0 ? (
                      campaigns.map((camp) => (
                        <button
                          key={`${camp.platform}-${camp.id}`}
                          onClick={() => handlePush(camp)}
                          className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-all flex items-center justify-between group border-b border-slate-100 last:border-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">{camp.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{camp.platform}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
                        </button>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Campaigns</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

