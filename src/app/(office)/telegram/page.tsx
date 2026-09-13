import { ArrowSquareOut, CheckCircle, PaperPlaneTilt, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getTelegramActivity } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Telegram Activity" };
export const dynamic = "force-dynamic";

export default async function TelegramPage() {
  const { mode, events } = await getTelegramActivity();
  const iconFor = { "Opened dashboard": ArrowSquareOut, "Opened WhatsApp": WhatsappLogo, Skipped: PaperPlaneTilt, "No action yet": PaperPlaneTilt };
  return <><div className="demo-notice"><span>{mode === "demo" ? "Demo data" : "Live data"}</span> Delivery and outreach actions are shown separately.</div><PageHeader title="Telegram Activity" description="See which alerts were delivered and what happened next." action={<button className="secondary-button">Needs action</button>} /><section className="activity-panel"><header><div><PaperPlaneTilt weight="fill" /><span><strong>{mode === "demo" ? "Morning scan" : "Telegram alerts"}</strong><small>{mode === "demo" ? "3 notifications delivered" : `${events.length} notification${events.length === 1 ? "" : "s"}`}</small></span></div>{mode === "demo" && <time>Today, 8:45 AM</time>}</header><div className="activity-list">{events.length ? events.map(({ lead, time, action }) => { const Icon = iconFor[action]; return <article key={`${lead.id}-${time}`}><span className="activity-icon"><Icon /></span><div><Link href={`/leads/${lead.id}`}>{lead.company}</Link><p>Score {lead.score} · {lead.city}</p></div><span className={`activity-action ${action === "No action yet" ? "pending" : ""}`}><CheckCircle />{action}</span><time>{time}</time></article>; }) : <p className="column-empty">No Telegram alerts yet.</p>}</div><footer>Telegram delivery does not mean a WhatsApp message was sent.</footer></section></>;
}
