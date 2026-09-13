import { commandCentre as demoCommandCentre, leads as demoLeads, scans as demoScans } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { defaultSettings, type AppSettings } from "@/lib/settings";
import type { Lead, LeadStatus, ScanJob, ScanState, WebsiteStatus } from "@/lib/types";

type DataMode = "demo" | "live";
type DashboardData = { mode: DataMode; leads: Lead[]; scans: ScanJob[]; commandCentre: { status: ScanState; nextScan: string; lastScan: string; today: typeof demoCommandCentre.today } };
export type TelegramActivity = { lead: Lead; time: string; action: "Opened dashboard" | "Opened WhatsApp" | "Skipped" | "No action yet" };
type DbLead = Record<string, unknown>;
type DbScan = Record<string, unknown>;

const leadStatuses: Record<string, LeadStatus> = {
  new: "New", qualified: "Qualified", draft_ready: "Draft Ready", contacted: "Contacted",
  replied: "Replied", meeting: "Meeting", won: "Won", lost: "Lost", skip: "Skip", blacklist: "Blacklist",
};
const websiteStatuses: Record<string, WebsiteStatus> = {
  no_website: "No website", social_only: "Social only", outdated: "Outdated", good_website: "Good website",
};

function text(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function date(value: unknown) {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-MY", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kuala_Lumpur" }).format(parsed);
}
function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function mapLead(row: DbLead, scoreReasons: { label: string; points: number }[] = []): Lead {
  const social = strings(row.social_urls)[0];
  const googleMapsUrl = strings(row.source_urls).find((url) => /^https:\/\/(?:www\.)?google\.[^/]+\/maps|^https:\/\/maps\.app\.goo\.gl\//.test(url));
  return {
    id: text(row.id), company: text(row.business_name), niche: text(row.niche), city: text(row.city), state: text(row.state),
    score: Number(row.score) || 0, websiteStatus: websiteStatuses[text(row.website_status)] ?? "No website",
    opportunity: text(row.opportunity_summary), reason: text(row.research_summary), status: leadStatuses[text(row.status)] ?? "New",
    phone: text(row.phone, "Not listed"), whatsapp: text(row.whatsapp_number), address: text(row.address), website: text(row.website_url) || undefined,
    social, googleMapsUrl, lastSeen: date(row.last_seen_at), discoveredAt: date(row.discovered_at), englishDraft: text(row.draft_en), bmDraft: text(row.draft_bm),
    scope: strings(row.suggested_scope), scoreReasons,
  };
}

function mapScan(row: DbScan): ScanJob {
  const status = text(row.status) as ScanState;
  return {
    id: text(row.id), status, startedAt: date(row.started_at ?? row.created_at), completedAt: row.completed_at ? date(row.completed_at) : undefined,
    niche: text(row.niche), cities: strings(row.cities), scanned: Number(row.leads_scanned) || 0, newLeads: Number(row.new_unique_leads) || 0,
    qualified: Number(row.qualified_leads) || 0, notifications: Number(row.notifications_sent) || 0, error: text(row.last_error) || undefined,
  };
}

function buildCommandCentre(leads: Lead[], scans: ScanJob[]) {
  const latest = scans[0];
  return {
    status: scans.find((scan) => scan.status === "running")?.status ?? "idle",
    nextScan: "Scheduled by GitHub Actions", lastScan: latest?.startedAt ?? "No scans yet",
    today: {
      newLeads: leads.filter((lead) => lead.status === "New").length,
      highPriority: leads.filter((lead) => lead.score >= 80).length,
      waiting: leads.filter((lead) => lead.status === "Draft Ready").length,
      contacted: leads.filter((lead) => lead.status === "Contacted").length,
      replied: leads.filter((lead) => lead.status === "Replied").length,
      wonLost: leads.filter((lead) => lead.status === "Won" || lead.status === "Lost").length,
    },
  };
}

async function liveDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const [{ data: leadRows, error: leadsError }, { data: scanRows, error: scansError }] = await Promise.all([
    supabase.from("leads").select("*").order("last_seen_at", { ascending: false }),
    supabase.from("scan_jobs").select("*").order("created_at", { ascending: false }),
  ]);
  if (leadsError) throw new Error(`Could not load leads: ${leadsError.message}`);
  if (scansError) throw new Error(`Could not load scan history: ${scansError.message}`);
  const rows = (leadRows ?? []) as DbLead[];
  const ids = rows.map((row) => text(row.id)).filter(Boolean);
  const reasonsByLead = new Map<string, { label: string; points: number }[]>();
  if (ids.length) {
    const { data, error } = await supabase.from("lead_score_reasons").select("lead_id, signal, points").in("lead_id", ids);
    if (error) throw new Error(`Could not load lead scores: ${error.message}`);
    for (const row of (data ?? []) as DbLead[]) {
      const leadId = text(row.lead_id);
      reasonsByLead.set(leadId, [...(reasonsByLead.get(leadId) ?? []), { label: label(text(row.signal)), points: Number(row.points) || 0 }]);
    }
  }
  const leads = rows.map((row) => mapLead(row, reasonsByLead.get(text(row.id))));
  const scans = ((scanRows ?? []) as DbScan[]).map(mapScan);
  return { mode: "live", leads, scans, commandCentre: buildCommandCentre(leads, scans) };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return { mode: "demo", leads: demoLeads, scans: demoScans, commandCentre: demoCommandCentre };
  return liveDashboardData();
}

export async function getLead(id: string) {
  const data = await getDashboardData();
  return { ...data, lead: data.leads.find((lead) => lead.id === id) };
}

export async function getTelegramActivity() {
  const data = await getDashboardData();
  if (data.mode === "demo") return {
    ...data,
    events: [
      { lead: data.leads[0], time: "Today, 8:45 AM", action: "Opened dashboard" },
      { lead: data.leads[1], time: "Today, 8:45 AM", action: "No action yet" },
      { lead: data.leads[2], time: "Today, 8:45 AM", action: "Opened WhatsApp" },
    ] as TelegramActivity[],
  };
  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("telegram_notifications").select("lead_id, owner_action, action_at, sent_at, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load Telegram activity: ${error.message}`);
  const leadsById = new Map(data.leads.map((lead) => [lead.id, lead]));
  const actions = { dashboard_opened: "Opened dashboard", whatsapp_opened: "Opened WhatsApp", skipped: "Skipped", none: "No action yet" } as const;
  const events = ((rows ?? []) as DbLead[]).flatMap((row) => {
    const lead = leadsById.get(text(row.lead_id));
    return lead ? [{ lead, time: date(row.action_at ?? row.sent_at ?? row.created_at), action: actions[text(row.owner_action) as keyof typeof actions] ?? "No action yet" }] : [];
  });
  return { ...data, events };
}

export async function getSettingsData(): Promise<{ mode: DataMode; settings: AppSettings }> {
  if (!isSupabaseConfigured()) return { mode: "demo", settings: defaultSettings };
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  if (!data) return { mode: "live", settings: defaultSettings };
  const row = data as DbLead;
  return {
    mode: "live",
    settings: {
      activeNiches: strings(row.active_niches), activeLocationBatches: strings(row.active_location_batches),
      minimumLeadScore: Number(row.minimum_lead_score) || defaultSettings.minimumLeadScore,
      telegramThreshold: Number(row.telegram_threshold) || defaultSettings.telegramThreshold,
      maxAlertsPerScan: Number(row.max_alerts_per_scan) || defaultSettings.maxAlertsPerScan,
      dailySpendLimitUsd: Number(row.daily_spend_limit_usd) || 0,
      dailyDigestTime: text(row.daily_digest_time, defaultSettings.dailyDigestTime),
      cooldownDays: Number(row.cooldown_days) || defaultSettings.cooldownDays,
      preferredLanguage: ["auto", "en", "bm"].includes(text(row.preferred_language)) ? text(row.preferred_language) as AppSettings["preferredLanguage"] : "auto",
      outreachSignature: text(row.outreach_signature),
    },
  };
}
