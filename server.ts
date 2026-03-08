import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PERSISTENT STORAGE ---
// On platforms like Railway/Render, we use a /data volume to persist the SQLite file.
const DB_DIR = process.env.DATABASE_URL ? path.dirname(process.env.DATABASE_URL) : (process.env.NODE_ENV === 'production' ? '/data' : '.');
const DB_PATH = process.env.DATABASE_URL || path.join(DB_DIR, "leads.db");

// Ensure data directory exists in production if using /data
if (process.env.NODE_ENV === 'production' && DB_DIR === '/data') {
  import('fs').then(fs => {
    if (!fs.existsSync(DB_DIR)) {
      try { fs.mkdirSync(DB_DIR, { recursive: true }); } catch (e) { console.error("Could not create /data dir", e); }
    }
  });
}

const db = new Database(DB_PATH);

// --- ENTERPRISE REPOSITORY PATTERN ---
// This layer abstracts the database. To scale to PostgreSQL/MySQL, 
// you only need to replace this class implementation.
class LeadRepository {
  constructor(private db: Database.Database) {}

  getAll() {
    return this.db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
  }

  update(id: string, updates: any) {
    const validFields = ['status', 'notes', 'email', 'priority_score', 'trigger_priority'];
    const fieldsToUpdate = Object.keys(updates).filter(k => validFields.includes(k));
    if (fieldsToUpdate.length === 0) return;

    const setClause = fieldsToUpdate.map(k => `${k} = ?`).join(", ");
    const values = fieldsToUpdate.map(k => updates[k]);
    return this.db.prepare(`UPDATE leads SET ${setClause} WHERE id = ?`).run(...values, id);
  }

  delete(id: string) {
    return this.db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  }

  upsert(lead: any) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO leads (id, name, title, company, company_domain, location, linkedin_url, email, trigger_event, trigger_priority, personalized_hook, reasoning, score, confidence_score, priority_score, source_citations, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      lead.id, lead.name, lead.title, lead.company, lead.company_domain || lead.companyDomain, lead.location, 
      lead.linkedin_url, lead.email, lead.trigger_event, lead.trigger_priority || lead.triggerPriority, lead.personalized_hook, lead.reasoning, 
      lead.score, lead.confidenceScore || 0, lead.priorityScore || 0, JSON.stringify(lead.sourceCitations || []),
      lead.status || "new", lead.notes || null
    );
  }
}

const leadRepo = new LeadRepository(db);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    title TEXT,
    company TEXT,
    company_domain TEXT,
    location TEXT,
    linkedin_url TEXT,
    email TEXT,
    trigger_event TEXT,
    trigger_priority TEXT,
    personalized_hook TEXT,
    reasoning TEXT,
    score INTEGER,
    confidence_score INTEGER,
    priority_score INTEGER,
    source_citations TEXT,
    status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS business_profile (
    id TEXT PRIMARY KEY,
    company_name TEXT,
    industry TEXT,
    website_url TEXT,
    offer TEXT,
    icp TEXT,
    product_service TEXT,
    pricing TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intent_triggers (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    reasoning TEXT,
    keywords TEXT,
    priority TEXT,
    max_age_days INTEGER DEFAULT 30,
    rank INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS app_config (
    id TEXT PRIMARY KEY,
    gemini_api_keys TEXT,
    strategist_system_prompt TEXT,
    hunter_system_prompt TEXT
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    smartlead_api_key TEXT,
    instantly_api_key TEXT,
    hunter_api_key TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dossiers (
    company_domain TEXT PRIMARY KEY,
    company_name TEXT,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add missing columns to 'leads' table if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(leads)").all() as any[];
const columns = tableInfo.map(c => c.name);

if (!columns.includes('trigger_event')) {
  db.exec("ALTER TABLE leads ADD COLUMN trigger_event TEXT");
}
if (!columns.includes('personalized_hook')) {
  db.exec("ALTER TABLE leads ADD COLUMN personalized_hook TEXT");
}
if (!columns.includes('reasoning')) {
  db.exec("ALTER TABLE leads ADD COLUMN reasoning TEXT");
}
if (!columns.includes('notes')) {
  db.exec("ALTER TABLE leads ADD COLUMN notes TEXT");
}
if (!columns.includes('confidence_score')) {
  db.exec("ALTER TABLE leads ADD COLUMN confidence_score INTEGER DEFAULT 0");
}
if (!columns.includes('source_citations')) {
  db.exec("ALTER TABLE leads ADD COLUMN source_citations TEXT");
}
if (!columns.includes('priority_score')) {
  db.exec("ALTER TABLE leads ADD COLUMN priority_score INTEGER DEFAULT 0");
}
if (!columns.includes('trigger_priority')) {
  db.exec("ALTER TABLE leads ADD COLUMN trigger_priority TEXT");
}
if (!columns.includes('company_domain')) {
  db.exec("ALTER TABLE leads ADD COLUMN company_domain TEXT");
}

// Migration: Add missing columns to 'business_profile' table if they don't exist
const bizTableInfo = db.prepare("PRAGMA table_info(business_profile)").all() as any[];
const bizColumns = bizTableInfo.map(c => c.name);

if (!bizColumns.includes('company_name')) {
  db.exec("ALTER TABLE business_profile ADD COLUMN company_name TEXT");
}
if (!bizColumns.includes('industry')) {
  db.exec("ALTER TABLE business_profile ADD COLUMN industry TEXT");
}

// Migration: Add hunter_api_key to 'integrations' table if it doesn't exist
const intTableInfo = db.prepare("PRAGMA table_info(integrations)").all() as any[];
const intColumns = intTableInfo.map(c => c.name);
if (!intColumns.includes('hunter_api_key')) {
  db.exec("ALTER TABLE integrations ADD COLUMN hunter_api_key TEXT");
}

// Migration: Add missing columns to 'intent_triggers' table if they don't exist
const triggerTableInfo = db.prepare("PRAGMA table_info(intent_triggers)").all() as any[];
const triggerColumns = triggerTableInfo.map(c => c.name);

if (!triggerColumns.includes('priority')) {
  db.exec("ALTER TABLE intent_triggers ADD COLUMN priority TEXT");
}
if (!triggerColumns.includes('max_age_days')) {
  db.exec("ALTER TABLE intent_triggers ADD COLUMN max_age_days INTEGER DEFAULT 30");
}
if (!triggerColumns.includes('rank')) {
  db.exec("ALTER TABLE intent_triggers ADD COLUMN rank INTEGER DEFAULT 0");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes - Config
  app.get("/api/config", (req, res) => {
    const config = db.prepare("SELECT * FROM app_config LIMIT 1").get() as any;
    if (!config) {
      return res.json({ geminiApiKeys: [], strategistSystemPrompt: "", hunterSystemPrompt: "" });
    }
    res.json({
      geminiApiKeys: JSON.parse(config.gemini_api_keys || "[]"),
      strategistSystemPrompt: config.strategist_system_prompt,
      hunterSystemPrompt: config.hunter_system_prompt
    });
  });

  app.post("/api/config", (req, res) => {
    const { geminiApiKeys, strategistSystemPrompt, hunterSystemPrompt } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO app_config (id, gemini_api_keys, strategist_system_prompt, hunter_system_prompt)
      VALUES ('main', ?, ?, ?)
    `);
    stmt.run(JSON.stringify(geminiApiKeys), strategistSystemPrompt, hunterSystemPrompt);
    res.json({ success: true });
  });

  // API Routes - Integrations
  app.get("/api/integrations", (req, res) => {
    const integrations = db.prepare("SELECT * FROM integrations LIMIT 1").get() as any;
    if (!integrations) {
      return res.json({ smartleadApiKey: "", instantlyApiKey: "", hunterApiKey: "" });
    }
    res.json({
      smartleadApiKey: integrations.smartlead_api_key,
      instantlyApiKey: integrations.instantly_api_key,
      hunterApiKey: integrations.hunter_api_key
    });
  });

  app.post("/api/integrations", (req, res) => {
    const { smartleadApiKey, instantlyApiKey, hunterApiKey } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO integrations (id, smartlead_api_key, instantly_api_key, hunter_api_key, updated_at)
      VALUES ('main', ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(smartleadApiKey, instantlyApiKey, hunterApiKey);
    res.json({ success: true });
  });

  // API Routes - Delivery Engine
  app.get("/api/integrations/campaigns", async (req, res) => {
    const integrations = db.prepare("SELECT * FROM integrations LIMIT 1").get() as any;
    if (!integrations) return res.json([]);

    const campaigns: any[] = [];

    // Fetch Smartlead Campaigns
    if (integrations.smartlead_api_key) {
      try {
        const response = await axios.get(`https://app.smartlead.ai/api/v1/campaigns?api_key=${integrations.smartlead_api_key}`);
        if (Array.isArray(response.data)) {
          response.data.forEach((c: any) => {
            campaigns.push({ id: c.id, name: c.name, platform: 'smartlead' });
          });
        }
      } catch (e) {
        console.error("Smartlead campaigns fetch failed", e);
      }
    }

    // Fetch Instantly Campaigns
    if (integrations.instantly_api_key) {
      try {
        const response = await axios.get(`https://api.instantly.ai/1/campaign/list`, {
          headers: { 'Authorization': `Bearer ${integrations.instantly_api_key}` }
        });
        if (Array.isArray(response.data)) {
          response.data.forEach((c: any) => {
            campaigns.push({ id: c.id, name: c.name, platform: 'instantly' });
          });
        }
      } catch (e) {
        console.error("Instantly campaigns fetch failed", e);
      }
    }

    res.json(campaigns);
  });

  app.post("/api/leads/:id/push", async (req, res) => {
    const { platform, campaignId } = req.body;
    const leadId = req.params.id;

    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId) as any;
    const integrations = db.prepare("SELECT * FROM integrations LIMIT 1").get() as any;

    if (!lead || !integrations) return res.status(404).json({ error: "Lead or integrations not found" });

    try {
      if (platform === 'smartlead') {
        await axios.post(`https://app.smartlead.ai/api/v1/campaign/${campaignId}/leads?api_key=${integrations.smartlead_api_key}`, {
          first_name: lead.name.split(' ')[0],
          last_name: lead.name.split(' ').slice(1).join(' '),
          email: lead.email,
          company_name: lead.company,
          linkedin_url: lead.linkedin_url,
          custom_fields: {
            trigger_event: lead.trigger_event,
            ai_reasoning: lead.reasoning,
            priority_score: lead.priority_score
          }
        });
      } else if (platform === 'instantly') {
        await axios.post(`https://api.instantly.ai/1/lead/add`, {
          api_key: integrations.instantly_api_key,
          campaign_id: campaignId,
          skip_if_in_any_campaign: true,
          leads: [{
            email: lead.email,
            first_name: lead.name.split(' ')[0],
            last_name: lead.name.split(' ').slice(1).join(' '),
            company: lead.company,
            custom_variables: {
              trigger_event: lead.trigger_event,
              ai_reasoning: lead.reasoning,
              priority_score: lead.priority_score
            }
          }]
        });
      }

      // Update lead status
      db.prepare("UPDATE leads SET status = 'contacted' WHERE id = ?").run(leadId);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Push failed", e.response?.data || e.message);
      res.status(500).json({ error: e.response?.data || "Push failed" });
    }
  });

  // API Routes - Business Profile
  app.get("/api/business", (req, res) => {
    const profile = db.prepare("SELECT * FROM business_profile LIMIT 1").get();
    res.json(profile || null);
  });

  app.post("/api/business", (req, res) => {
    const { company_name, industry, website_url, offer, icp, product_service, pricing } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO business_profile (id, company_name, industry, website_url, offer, icp, product_service, pricing, updated_at)
      VALUES ('main', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(company_name, industry, website_url, offer, icp, product_service, pricing);
    res.json({ success: true });
  });

  // API Routes - Intent Triggers
  app.get("/api/triggers", (req, res) => {
    const triggers = db.prepare("SELECT * FROM intent_triggers ORDER BY rank ASC").all();
    res.json(triggers.map((t: any) => ({ 
      ...t, 
      keywords: JSON.parse(t.keywords || "[]"),
      maxAgeDays: t.max_age_days,
      rank: t.rank
    })));
  });

  app.post("/api/triggers", (req, res) => {
    const { triggers } = req.body; // Array of triggers
    db.prepare("DELETE FROM intent_triggers").run();
    const stmt = db.prepare(`
      INSERT INTO intent_triggers (id, title, description, reasoning, keywords, priority, max_age_days, rank)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of triggers) {
      stmt.run(t.id, t.title, t.description, t.reasoning, JSON.stringify(t.keywords), t.priority, t.maxAgeDays || 30, t.rank || 0);
    }
    res.json({ success: true });
  });

  // API Routes - Leads
  app.get("/api/leads", (req, res) => {
    res.json(leadRepo.getAll());
  });

  app.patch("/api/leads/:id", (req, res) => {
    leadRepo.update(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete("/api/leads/:id", (req, res) => {
    leadRepo.delete(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/leads", (req, res) => {
    leadRepo.upsert(req.body);
    res.json({ success: true });
  });

  // API Routes - Dossiers
  app.get("/api/dossiers/:domain", (req, res) => {
    const dossier = db.prepare("SELECT * FROM dossiers WHERE company_domain = ?").get(req.params.domain) as any;
    if (!dossier) return res.json(null);
    res.json({
      ...JSON.parse(dossier.data),
      updatedAt: dossier.updated_at
    });
  });

  app.post("/api/dossiers", (req, res) => {
    const { companyDomain, companyName, ...data } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO dossiers (company_domain, company_name, data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(companyDomain, companyName, JSON.stringify(data));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // When bundled, __dirname is 'dist', so we serve from '.'
    const staticPath = path.join(__dirname);
    app.use(express.static(staticPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // --- GRACEFUL SHUTDOWN ---
  // Essential for Enterprise: Ensures DB connections close properly 
  // and no data is corrupted during a server restart.
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      db.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      db.close();
      process.exit(0);
    });
  });
}

startServer();
