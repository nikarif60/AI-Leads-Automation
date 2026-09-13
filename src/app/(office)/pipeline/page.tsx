import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/dashboard-data";
import type { LeadStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";
const columns: LeadStatus[] = ["New", "Qualified", "Draft Ready", "Contacted", "Replied", "Meeting", "Won", "Lost"];

export default async function PipelinePage() {
  const { leads, mode } = await getDashboardData();
  return <><div className="demo-notice"><span>{mode === "demo" ? "Demo data" : "Live data"}</span> Skip and blacklist stay outside your active pipeline.</div><PageHeader title="Pipeline" description="One conversation at a time. Follow each opportunity from discovery to outcome." /><div className="pipeline-flow" aria-label="Lead pipeline">{columns.map((column) => {
    const items = leads.filter((lead) => lead.status === column);
    return <section className="pipeline-stage" key={column}><header><i aria-hidden="true" /><h2>{column}</h2><span>{items.length}</span></header><div className="pipeline-items">{items.length ? items.map((lead) => <Link href={`/leads/${lead.id}`} scroll={false} className="pipeline-item" key={lead.id}><div><strong>{lead.company}</strong><small>{lead.niche} · {column === "Draft Ready" ? "Review your message" : column === "Qualified" ? "Prepare an approach" : "Review opportunity"}</small></div><span>{lead.score}</span><ArrowRight /></Link>) : <p className="column-empty">Nothing here yet</p>}</div></section>;
  })}</div></>;
}
