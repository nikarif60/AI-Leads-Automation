import "server-only";
import { getDashboardData } from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/server";
import { getOwnerUserId, isSupabaseConfigured } from "@/lib/supabase/env";
import { malaysiaDayStart, type OfficeJob, type OfficeSnapshot } from "@/lib/office-state";

export async function getOfficeData() {
  const fetchedAt = Date.now();
  const dashboard = await getDashboardData();
  const reviewLeads = dashboard.leads.filter((lead) => ["New", "Qualified", "Draft Ready"].includes(lead.status)).sort((a, b) => b.score - a.score).slice(0, 3);
  const snapshot: OfficeSnapshot = {
    mode: dashboard.mode, fetchedAt, job: null, nextScanAt: null, lastScanAt: null, scansEnabled: false,
    metrics: { found: dashboard.commandCentre.today.newLeads, priority: dashboard.commandCentre.today.highPriority, approval: dashboard.commandCentre.today.waiting, contacted: dashboard.commandCentre.today.contacted, replied: dashboard.commandCentre.today.replied, outcomes: dashboard.commandCentre.today.wonLost },
  };
  if (!isSupabaseConfigured()) return { snapshot, reviewLeads };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== getOwnerUserId()) throw new Error("Owner sign-in is required.");
  const since = malaysiaDayStart(fetchedAt);
  const [jobs, next, settings, found, contacted, priority, approval] = await Promise.all([
    supabase.from("scan_jobs").select("id,status,github_run_id,started_at,completed_at,updated_at,phase,niche,cities,new_unique_leads,qualified_leads,leads_scanned,notifications_sent,last_error").neq("status", "idle").order("created_at", { ascending: false }).limit(30),
    supabase.from("scan_jobs").select("scheduled_for").eq("status", "idle").gt("scheduled_for", new Date(fetchedAt).toISOString()).order("scheduled_for").limit(1).maybeSingle(),
    supabase.from("app_settings").select("scan_enabled").eq("owner_id", user.id).maybeSingle(),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("discovered_at", since),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("contacted_at", since),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("score", 80).in("status", ["new", "qualified", "draft_ready"]),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "draft_ready"),
  ]);
  if ([jobs, next, settings, found, contacted, priority, approval].some((result) => result.error)) throw new Error("The Command Centre could not refresh its job data.");
  const verifiedJobs = (jobs.data as OfficeJob[]).filter((job) => job.github_run_id);
  snapshot.job = verifiedJobs.find((job) => job.status === "running") ?? verifiedJobs[0] ?? null;
  snapshot.lastScanAt = verifiedJobs.find((job) => job.completed_at)?.completed_at ?? null;
  snapshot.nextScanAt = next.data?.scheduled_for ?? null;
  snapshot.scansEnabled = settings.data?.scan_enabled === true;
  snapshot.metrics = { ...snapshot.metrics, found: found.count ?? 0, contacted: contacted.count ?? 0, priority: priority.count ?? 0, approval: approval.count ?? 0 };
  return { snapshot, reviewLeads };
}
