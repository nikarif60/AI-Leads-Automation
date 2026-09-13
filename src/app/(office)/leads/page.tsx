import type { Metadata } from "next";
import { LeadExplorer } from "@/components/lead-explorer";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/dashboard-data";
import { parseLeadFilters } from "@/lib/lead-filters";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { leads, mode } = await getDashboardData();
  const initialFilters = parseLeadFilters(await searchParams);
  return <><div className="demo-notice"><span>{mode === "demo" ? "Demo data" : "Live data"}</span> Filters and detail views are fully interactive.</div><PageHeader title="Leads" description="Review the strongest Malaysian website opportunities first." /><LeadExplorer key={JSON.stringify(initialFilters)} leads={leads} initialFilters={initialFilters} mode={mode} /></>;
}
