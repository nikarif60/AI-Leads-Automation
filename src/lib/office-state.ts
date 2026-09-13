import type { ScanState } from "./types";

export type OfficeJob = {
  id: string;
  status: ScanState;
  github_run_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
  phase: string | null;
  niche: string;
  cities: string[];
  new_unique_leads: number;
  qualified_leads: number;
  leads_scanned: number;
  notifications_sent: number;
  last_error: string | null;
};

export type OfficeSnapshot = {
  mode: "demo" | "live";
  fetchedAt: number;
  job: OfficeJob | null;
  nextScanAt: string | null;
  lastScanAt: string | null;
  scansEnabled: boolean;
  metrics: { found: number; priority: number; approval: number; contacted: number; replied: number; outcomes: number };
};

export function countdown(nextScanAt: string | null, now: number) {
  if (!nextScanAt || !Number.isFinite(Date.parse(nextScanAt))) return "next scan not scheduled";
  const minutes = Math.ceil((Date.parse(nextScanAt) - now) / 60000);
  if (minutes <= 0) return "waiting for the next scan";
  return `next scan in ${minutes >= 60 ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60}m`;
}

export function officeStatus(snapshot: OfficeSnapshot, now: number): { state: ScanState; title: string; detail: string } {
  const { job, mode, fetchedAt, scansEnabled, nextScanAt } = snapshot;
  if (mode === "live" && now - fetchedAt > 90000) return { state: "idle", title: "Status unavailable", detail: "Reconnecting to your office. Last received data is shown below." };
  // Demo records and unlinked jobs never activate the live scanning animation.
  if (mode === "demo" || !job?.github_run_id) return { state: "idle", title: `Idle · ${countdown(mode === "live" && scansEnabled ? nextScanAt : null, now)}`, detail: mode === "demo" ? "Demo workspace · Niko is on an office round. Connect your scan workflow to put him to work." : "The office is ready. No verified scan has been received yet." };
  if (job.status === "running") return { state: "running", title: "Live Scan Running", detail: job.phase ? `${job.phase.replaceAll("_", " ")} · ${job.cities.join(", ")}` : `Researching ${job.cities.join(", ") || "Malaysia"}.` };
  if (job.status === "failed") return { state: "failed", title: "Scan needs attention", detail: job.last_error || "The research terminal needs attention. View scan history for details." };
  if (job.status === "completed_with_leads") return { state: "completed_with_leads", title: `${job.new_unique_leads} new lead${job.new_unique_leads === 1 ? "" : "s"} found`, detail: `${job.qualified_leads} qualified · ${job.notifications_sent} Telegram alerts · ${scansEnabled ? countdown(nextScanAt, now) : "scans paused"}` };
  if (job.status === "completed_no_leads") return { state: "completed_no_leads", title: "Scan complete · no high-priority leads", detail: "Nothing worth interrupting you for. Your next opportunity is still out there." };
  return { state: "idle", title: `Idle · ${countdown(scansEnabled ? nextScanAt : null, now)}`, detail: "Niko is on an office round. No scan is running." };
}

export function malaysiaDayStart(now: number) {
  return new Date(`${new Date(now + 8 * 3600000).toISOString().slice(0, 10)}T00:00:00+08:00`).toISOString();
}

export function timeAgo(timestamp: string | null, now: number) {
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return "No completed scan yet";
  const minutes = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 60000));
  return minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m ago` : `${Math.floor(minutes / 1440)}d ago`;
}
