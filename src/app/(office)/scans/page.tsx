import { ArrowClockwise, CheckCircle, MapPin, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Scan History" };
export const dynamic = "force-dynamic";

export default async function ScansPage() {
  const { scans, mode } = await getDashboardData();
  return <><div className="demo-notice"><span>{mode === "demo" ? "Demo data" : "Live data"}</span> The scheduled workflow remains disabled until setup is complete.</div><PageHeader title="Scan History" description="Verify each scheduled run without reading raw logs." action={<button className="secondary-button"><ArrowClockwise />Run dry check</button>} /><div className="scan-timeline">{scans.map((scan) => <article className={`scan-card ${scan.status === "failed" ? "failed" : ""}`} key={scan.id}><span className="scan-icon">{scan.status === "failed" ? <WarningCircle /> : <CheckCircle />}</span><div className="scan-card-main"><header><div><StatusBadge status={scan.status} /><h2>{scan.niche}</h2></div><time>{scan.startedAt}</time></header><p className="scan-locations"><MapPin />{scan.cities.join(", ")}</p><div className="scan-stats"><span><strong>{scan.scanned}</strong> scanned</span><span><strong>{scan.newLeads}</strong> new</span><span><strong>{scan.qualified}</strong> qualified</span><span><strong>{scan.notifications}</strong> alerts</span></div>{scan.error && <div className="error-summary"><strong>The research terminal needs attention.</strong><p>{scan.error} Your saved leads are safe.</p><button className="text-button">View technical details</button></div>}</div></article>)}</div></>;
}
