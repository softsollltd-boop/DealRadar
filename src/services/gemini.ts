import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { BusinessProfile, IntentTrigger, AgentLead, AppConfig, GhostwriterDraft, Dossier } from "../types";

class KeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.refreshKeys();
  }

  async refreshKeys() {
    try {
      const res = await fetch('/api/config');
      const config: AppConfig = await res.json();
      this.keys = config.geminiApiKeys.length > 0 ? config.geminiApiKeys : [process.env.GEMINI_API_KEY || ""];
    } catch (e) {
      this.keys = [process.env.GEMINI_API_KEY || ""];
    }
  }

  getNextKey(): string {
    if (this.keys.length === 0) return process.env.GEMINI_API_KEY || "";
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
}

const keyManager = new KeyManager();

async function callWithRetry<T>(fn: (apiKey: string) => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    const apiKey = keyManager.getNextKey();
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      return await fn(apiKey);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || '';
      const isRateLimit = errorMsg.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
      const isTransientError = errorMsg.includes('500') || errorMsg.includes('Rpc failed') || error?.code === 500 || error?.status === 'UNKNOWN';
      
      if (isRateLimit || isTransientError) {
        let delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        const retryMatch = errorMsg.match(/Please retry in (\d+\.?\d*)s/);
        
        if (retryMatch && retryMatch[1]) {
          delay = (parseFloat(retryMatch[1]) + 1) * 1000;
        } else if (isTransientError) {
          delay = Math.pow(2, i) * 1000 + Math.random() * 500;
        }
        
        console.warn(`Error hit. Retrying with next key in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Agent 1: The Strategist
export async function analyzeBusiness(profile: BusinessProfile, systemPrompt?: string): Promise<IntentTrigger[]> {
  const defaultPrompt = `You are a World-Class B2B Sales Strategist and Market Intelligence Expert. 
  Your goal is to architect a high-intent hunting strategy by identifying "Nuanced Triggers" that indicate a prospect is in a state of transition, urgent need, or strategic vulnerability.
  
  Business Info:
  - Company: ${profile.companyName}
  - Industry: ${profile.industry}
  - Website: ${profile.websiteUrl || 'Not provided'}
  - Offer: ${profile.offer}
  - ICP: ${profile.icp}
  - Product/Service: ${profile.productService}
  - Pricing: ${profile.pricing}
  
  STRATEGIC FRAMEWORK:
  Identify 10 "Nuanced Triggers". Rank them from 1 to 10 based on their expected conversion probability (1 being the highest potential). Look beyond generic growth; focus on these high-conversion categories:
  1. Technographic Vulnerability: Adoption of a competitor's tool that is currently facing public backlash, downtime, or price hikes. Or, adoption of a tool that is a "pre-requisite" for your service.
  2. Leadership "First 90 Days": New C-Suite or VP hires who have a history of using your type of solution in previous roles.
  3. Hyper-Growth Friction: Signals that a company is growing faster than its internal processes can handle (e.g., massive hiring in support/ops but not in tech).
  4. Regulatory/Compliance Pressure: New laws or industry standards that make your solution a "must-have" rather than a "nice-to-have".
  5. Competitive Displacement: A competitor's client just posted a negative review or is asking for alternatives on social media/forums.
  6. Strategic Pivot: A company just announced a shift in focus (e.g., "moving to Enterprise") where your solution is the missing piece.
  7. Event-Based Intent: Speaking slots at major conferences, hosting webinars on specific topics, or publishing whitepapers that align with your value prop.

  For each trigger, provide:
  1. Title: Compelling, specific, and action-oriented.
  2. Description: Exactly what Agent 2 should look for on the live web (be specific about the "signal").
  3. Reasoning: The deep psychological or business logic of why this indicates high intent for OUR specific offer.
  4. Keywords: 6-10 precise, advanced search operators and keywords (e.g., "site:linkedin.com/posts", "intitle:press release").
  5. Priority: 'High', 'Medium', or 'Low' based on expected conversion probability.
  6. MaxAgeDays: The "shelf-life" of this trigger in days. How long after the event is it still a valid "Intent"? (e.g., New VP hire: 90 days; Negative review: 7 days; Funding: 180 days). Be intelligent and realistic.
  7. Rank: A number from 1 to 10 (1 = Highest Priority/Potential).`;

  const prompt = systemPrompt || defaultPrompt;

  return await callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              maxAgeDays: { type: Type.INTEGER },
              rank: { type: Type.INTEGER },
            },
            required: ["id", "title", "description", "reasoning", "keywords", "priority", "maxAgeDays", "rank"],
          },
        },
      },
    });
    return JSON.parse(response.text || "[]");
  });
}

// Agent 2: The Hunter
export async function huntLeads(trigger: IntentTrigger, businessProfile: BusinessProfile, systemPrompt?: string): Promise<AgentLead[]> {
  const currentDate = "2026-03-05";
  const defaultPrompt = `You are a World-Class B2B Lead Hunter and Intelligence Analyst.
  Your goal is to find real-time, high-intent leads based on a specific "Intent Trigger".
  
  TODAY'S DATE: ${currentDate}
  
  Trigger to look for: ${trigger.title} - ${trigger.description}
  Search Keywords: ${trigger.keywords.join(', ')}
  Trigger Shelf-Life: ${trigger.maxAgeDays} days.
  
  Business we are selling for:
  - Company: ${businessProfile.companyName}
  - Industry: ${businessProfile.industry}
  - Product/Service: ${businessProfile.productService}
  - Offer: ${businessProfile.offer}
  - Ideal Customer Profile (ICP): ${businessProfile.icp}
  
  SEARCH STRATEGY:
  1. Identify the core event: Search for recent news, press releases, or social media posts (LinkedIn, Twitter) that match the trigger and keywords.
  2. Find the company: Identify the specific company involved in the event.
  3. Find the decision maker: Identify the key person (e.g., VP of Sales, CTO, Founder) who would be the decision maker for our offer.
  4. Verify recency: Ensure the event happened within the last ${trigger.maxAgeDays} days (relative to ${currentDate}).
  5. Verify ICP: Ensure the company size and industry match our ICP.
  
  CRITICAL INSTRUCTIONS:
  - NO HALLUCINATIONS: You must only return leads that you have actually found via the search tool. Do not make up names or companies.
  - RECENCY IS PARAMOUNT: Only find leads where the trigger event happened in the LAST ${trigger.maxAgeDays} DAYS. If an event is from 2024 or 2025, it is STALE and must be REJECTED.
  - GOOGLE SEARCH GROUNDING: Use the search tool to find CURRENT information. Append "2026" or "recent" to your internal search queries. Search for specific news sites, press releases, and LinkedIn posts.
  - AUTHENTICITY: You must be able to cite a specific source (URL). If you cannot find a source, do not include the lead.
  - ICP MATCH: Ensure the person's title and company size match the provided ICP.
  - TRIGGER SPECIFICITY: Instead of "Company X is growing", find "Company X just opened a new office in London" or "John Doe was just promoted to VP of Sales".
  - DOMAIN ACCURACY: Find the actual company domain (e.g., "stripe.com") to enable email discovery.
  - NO GENERIC LEADS: Do not include leads that are just "interested in [industry]". They must have a specific trigger event.
  
  Return a JSON array of objects with: 
  - name (The person's full name)
  - title (The person's current job title)
  - company (The company name)
  - companyDomain (The company's primary website domain, e.g., "google.com")
  - location (The person's or company's location)
  - linkedinUrl (The person's LinkedIn profile URL)
  - avatarUrl (A URL to the person's profile picture or company logo if found via search)
  - about (A brief summary of the person's professional background or current focus, max 3 sentences)
  - triggerEvent (Be extremely specific: what happened, when, and where. Include dates if possible)
  - personalizedHook (A high-impact, personalized opening line for an email or LinkedIn message. It must mention the specific trigger event and connect it to our offer in a non-salesy, value-first way. Max 2 sentences.)
  - reasoning (Why this specific event makes them a perfect fit for our offer RIGHT NOW. Connect the trigger to our offer.)
  - score (1-100, how well they fit the business profile)
  - confidenceScore (1-100, how certain you are this information is accurate and happened in the last ${trigger.maxAgeDays} days)
  - sourceCitations (Array of URLs where you found this specific information)`;

  const prompt = systemPrompt || defaultPrompt;

  return await callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              companyDomain: { type: Type.STRING },
              location: { type: Type.STRING },
              linkedinUrl: { type: Type.STRING },
              avatarUrl: { type: Type.STRING },
              about: { type: Type.STRING },
              triggerEvent: { type: Type.STRING },
              personalizedHook: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              score: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              sourceCitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "title", "company", "companyDomain", "location", "linkedinUrl", "triggerEvent", "reasoning", "score", "confidenceScore", "sourceCitations"],
          },
        },
      },
    });

    const leads = JSON.parse(response.text || "[]");
    return leads.map((l: any, index: number) => ({
      ...l,
      id: `agent-lead-${Date.now()}-${index}`,
      triggerPriority: trigger.priority,
      priorityScore: l.score || 0, // Initial priority is just the fit score
      status: 'new',
      createdAt: Date.now(),
    }));
  });
}

export async function findEmail(lead: { name: string; title: string; company: string; domain?: string; companyDomain?: string }): Promise<string | null> {
  const domain = lead.domain || lead.companyDomain;
  // 1. Try Hunter.io if available
  try {
    const intRes = await fetch('/api/integrations');
    const integrations = await intRes.json();
    
    if (integrations.hunterApiKey && domain) {
      const hunterUrl = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${lead.name.split(' ')[0]}&last_name=${lead.name.split(' ').slice(1).join(' ')}&api_key=${integrations.hunterApiKey}`;
      const response = await fetch(hunterUrl);
      const data = await response.json();
      if (data.data && data.data.email) {
        return data.data.email;
      }
    }
  } catch (e) {
    console.error("Hunter.io lookup failed", e);
  }

  // 2. Fallback to Gemini + Google Search
  const prompt = `Find the professional email address for ${lead.name}, ${lead.title} at ${lead.company}. 
  The company domain is likely ${domain || 'unknown'}.
  Search for public mentions, press releases, or common patterns (e.g. first.last@company.com). 
  Return ONLY the email address if found with high confidence, or "Not found".`;

  return await callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || "";
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  });
}

// Agent 3: The Ghostwriter
export async function generateDraft(lead: AgentLead, profile: BusinessProfile): Promise<GhostwriterDraft> {
  const prompt = `You are a World-Class Executive Ghostwriter. Your goal is to write high-converting, human-like outreach emails.
  
  STEP 1: ROLEPLAY AS THE PROSPECT
  Act as ${lead.name}, ${lead.title} at ${lead.company}. 
  Context: You just experienced this trigger event: "${lead.triggerEvent}".
  Analyze your current mindset, top 3 priorities, and top 3 concerns based on this event and your role.
  
  STEP 2: WRITE THE OUTREACH
  Now, as the Ghostwriter, use that insight to write 3 email variations from ${profile.companyName} that connect their offer to the prospect's priorities.
  
  Lead Info:
  - Name: ${lead.name}
  - Title: ${lead.title}
  - Company: ${lead.company}
  - Trigger: ${lead.triggerEvent}
  - Personalized Hook: ${lead.personalizedHook}
  
  Our Offer:
  - Company: ${profile.companyName}
  - Product: ${profile.productService}
  - Value Prop: ${profile.offer}
  
  EMAIL RULES:
  - No "I hope this finds you well".
  - No "My name is...".
  - Under 100 words.
  - Low-friction CTA (e.g., "Worth a brief chat?", "Should I send over a 2-min video?").
  - The tone must modulate automatically: Professional for C-Suite, Conversational for Managers, Punchy for Founders.
  
  Return a JSON object matching the GhostwriterDraft interface.`;

  return await callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prospectPerspective: {
              type: Type.OBJECT,
              properties: {
                priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
                concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
                mindset: { type: Type.STRING },
              },
              required: ["priorities", "concerns", "mindset"],
            },
            drafts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Professional", "Conversational", "Punchy"] },
                },
                required: ["subject", "body", "type"],
              },
            },
          },
          required: ["prospectPerspective", "drafts"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  });
}

// Agent 4: The Researcher (Deep Dossier)
export async function generateDossier(companyName: string, domain: string): Promise<Dossier> {
  const prompt = `You are a Senior Investment Analyst and Market Intelligence Expert.
  Your goal is to generate a "Deep Research Dossier" on the company: ${companyName} (${domain}).
  
  Use the search tool to find the most recent and relevant information.
  
  REQUIRED SECTIONS:
  1. Summary: A high-level overview of what they do, their market position, and recent trajectory.
  2. Key Executives: Find 3-5 top executives, their roles, and a brief bio/background.
  3. Recent News: Find 3-5 news items from the last 6 months. Include date, title, impact on the business, and source URL.
  4. Financial Performance: Summary of funding rounds, revenue (if public), or growth signals (hiring, expansion).
  5. Competitors: List 3-5 direct and indirect competitors.
  6. Tech Stack: Identify key technologies they use (e.g., CRM, Cloud, Marketing Automation).
  7. Strategic Priorities: Based on news and job postings, what are their top 3 strategic goals for the next 12 months?
  8. Pain Points: What are the likely challenges they are facing right now that our B2B solutions could solve?
  
  CRITICAL: 
  - Ground everything in search results. 
  - Cite sources where possible.
  - If information is not found, state "Information not publicly available".
  
  Return a JSON object matching the Dossier interface.`;

  return await callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyExecutives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  bio: { type: Type.STRING },
                },
                required: ["name", "role", "bio"],
              },
            },
            recentNews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  url: { type: Type.STRING },
                },
                required: ["date", "title", "impact", "url"],
              },
            },
            financialPerformance: { type: Type.STRING },
            competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategicPriorities: { type: Type.ARRAY, items: { type: Type.STRING } },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            updatedAt: { type: Type.STRING },
          },
          required: [
            "companyName", "summary", "keyExecutives", "recentNews", 
            "financialPerformance", "competitors", "techStack", 
            "strategicPriorities", "painPoints", "updatedAt"
          ],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  });
}

