import type { Metadata } from "next";
import { OutreachWorkspace } from "@/components/outreach-workspace";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Outreach" };
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const { leads, mode } = await getDashboardData();
  const actionable = leads.filter((lead) => !["Contacted", "Replied", "Meeting", "Won", "Lost", "Skip", "Blacklist"].includes(lead.status)).sort((a, b) => b.score - a.score);
  return <OutreachWorkspace leads={actionable} mode={mode} />;
}
