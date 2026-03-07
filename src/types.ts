export interface BusinessProfile {
  id: string;
  companyName: string;
  industry: string;
  websiteUrl: string;
  offer: string;
  icp: string;
  productService: string;
  pricing: string;
  updatedAt: number;
}

export interface IntentTrigger {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  keywords: string[];
  priority: 'High' | 'Medium' | 'Low';
  maxAgeDays: number;
  rank: number;
}

export interface AgentLead {
  id: string;
  name: string;
  title: string;
  company: string;
  companyDomain?: string;
  location: string;
  linkedinUrl: string;
  avatarUrl?: string;
  about?: string;
  email?: string;
  triggerEvent: string;
  triggerPriority?: 'High' | 'Medium' | 'Low';
  personalizedHook: string;
  reasoning: string;
  score: number;
  confidenceScore: number;
  priorityScore: number;
  sourceCitations: string[];
  status: 'new' | 'contacted' | 'replied' | 'booked' | 'rejected';
  notes?: string;
  createdAt: number;
}

export interface AppConfig {
  geminiApiKeys: string[];
  strategistSystemPrompt: string;
  hunterSystemPrompt: string;
}

export interface Integrations {
  smartleadApiKey: string;
  instantlyApiKey: string;
  hunterApiKey: string;
}

export interface Campaign {
  id: string | number;
  name: string;
  platform: 'smartlead' | 'instantly';
}

export interface GhostwriterDraft {
  prospectPerspective: {
    priorities: string[];
    concerns: string[];
    mindset: string;
  };
  drafts: {
    subject: string;
    body: string;
    type: 'Professional' | 'Conversational' | 'Punchy';
  }[];
}

export interface Dossier {
  companyName: string;
  summary: string;
  keyExecutives: {
    name: string;
    role: string;
    bio: string;
  }[];
  recentNews: {
    date: string;
    title: string;
    impact: string;
    url: string;
  }[];
  financialPerformance: string;
  competitors: string[];
  techStack: string[];
  strategicPriorities: string[];
  painPoints: string[];
  updatedAt: string;
}
