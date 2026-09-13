import type { LeadStatus, ScanState, WebsiteStatus } from "@/lib/types";

const labels: Record<ScanState, string> = {
  idle: "Idle",
  running: "Live scan running",
  completed_with_leads: "Completed with leads",
  completed_no_leads: "Completed, no strong leads",
  failed: "Needs attention",
};

export function StatusBadge({ status }: { status: LeadStatus | ScanState | WebsiteStatus }) {
  const label = status in labels ? labels[status as ScanState] : status;
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}>{label}</span>;
}
