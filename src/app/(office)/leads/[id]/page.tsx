import { ArrowLeft, Globe, InstagramLogo, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftEditor } from "@/components/draft-editor";
import { LeadActions } from "@/components/lead-actions";
import { StatusBadge } from "@/components/status-badge";
import { getLead } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { lead } = await getLead(id);
  return { title: lead ? lead.company : "Lead", description: lead?.opportunity, openGraph: { images: [] }, twitter: { images: [] } };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead, mode } = await getLead(id);
  if (!lead) notFound();
  return (
    <div className="lead-detail-page">
      <Link href="/leads" className="back-link"><ArrowLeft />Back to leads</Link>
      <header className="lead-detail-hero"><div><div className="lead-title-line"><span className="detail-score">{lead.score}<small>{lead.score >= 80 ? "High priority" : "Potential"}</small></span><div><p>{lead.niche}</p><h1>{lead.company}</h1><span>{lead.city}, {lead.state}</span></div></div></div><StatusBadge status={lead.status} /></header>
      <LeadActions initialStatus={lead.status} leadId={lead.id} mode={mode} />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="detail-block reason-block"><p className="pixel-label">Best reason to approach now</p><h2>{lead.reason}</h2><p>{lead.opportunity}</p></section>
          <section className="detail-block"><div className="detail-block-heading"><div><h2>Why this is promising</h2><p>Evidence-based scoring from public information.</p></div></div><div className="score-reasons">{lead.scoreReasons.map((reason) => <div key={reason.label}><span><CheckMark />{reason.label}</span><strong>+{reason.points}</strong></div>)}</div></section>
          <DraftEditor english={lead.englishDraft} bm={lead.bmDraft} />
          <section className="detail-block"><h2>Activity</h2><div className="timeline"><div><i /><span><strong>Draft prepared</strong><small>Today, 8:43 AM</small></span></div><div><i /><span><strong>Lead discovered</strong><small>{lead.discoveredAt}</small></span></div></div></section>
        </div>
        <aside className="detail-aside">
          <section className="detail-block contact-block"><h2>Business details</h2><div><MapPin /><span><small>Address</small>{lead.address}</span></div><div><Phone /><span><small>Phone / WhatsApp</small>{lead.phone}</span></div>{lead.googleMapsUrl && <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer"><MapPin /><span><small>Google Maps</small>Open business profile</span></a>}{lead.website && <a href={lead.website} target="_blank" rel="noreferrer"><Globe /><span><small>Website</small>Open website</span></a>}{lead.social && <a href={lead.social} target="_blank" rel="noreferrer"><InstagramLogo /><span><small>Social</small>Open public profile</span></a>}<StatusBadge status={lead.websiteStatus} /></section>
          <section className="detail-block"><h2>Suggested website scope</h2><div className="scope-list">{lead.scope.map((item) => <span key={item}>{item}</span>)}</div></section>
        </aside>
      </div>
    </div>
  );
}

function CheckMark() { return <span className="check-mark" aria-hidden="true">✓</span>; }
