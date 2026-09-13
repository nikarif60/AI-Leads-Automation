import type { Lead } from "./types";

export const leadStatusFilters = ["New", "Qualified", "Draft Ready", "Contacted", "Replied", "Meeting", "Won", "Lost", "Skip", "Blacklist", "Awaiting approach", "New / high priority"];
export type LeadFilters = { status: string; score: string; location: string };

export function parseLeadFilters(params: Record<string, string | string[] | undefined>): LeadFilters {
  const status = typeof params.status === "string" && leadStatusFilters.includes(params.status) ? params.status : "All";
  const score = typeof params.score === "string" && ["80+", "60-79", "Below 60"].includes(params.score) ? params.score : "All";
  const location = typeof params.location === "string" && params.location.trim().length <= 100 ? params.location.trim() || "All" : "All";
  return { status, score, location };
}

export function matchesLeadFilters(lead: Lead, { status, score, location }: LeadFilters) {
  const actionable = ["New", "Qualified", "Draft Ready"].includes(lead.status);
  const matchesStatus = status === "All" || (status === "Awaiting approach" ? actionable : status === "New / high priority" ? actionable && (lead.status === "New" || lead.score >= 80) : lead.status === status);
  const matchesScore = score === "All" || (score === "80+" ? lead.score >= 80 : score === "60-79" ? lead.score >= 60 && lead.score < 80 : lead.score < 60);
  return matchesStatus && matchesScore && (location === "All" || lead.state === location || lead.city === location);
}
