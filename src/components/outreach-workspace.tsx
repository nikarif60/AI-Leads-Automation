"use client";

import { ArrowSquareOut, Check, ClipboardText, CopySimple, FloppyDisk, Globe, MapPin, Phone, Sparkle, WhatsappLogo } from "@phosphor-icons/react";
import { startTransition, useActionState, useMemo, useState, useTransition } from "react";
import { generateLeadDraft, recordWhatsAppOpened, saveLeadDraft, updateLeadStatus, type MutationState } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import type { Lead } from "@/lib/types";

const initialState: MutationState = { error: "", notice: "" };

export function OutreachWorkspace({ leads, mode }: { leads: Lead[]; mode: "demo" | "live" }) {
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? "");
  const lead = useMemo(() => leads.find((item) => item.id === selectedId) ?? leads[0], [leads, selectedId]);
  if (!lead) return <section className="outreach-empty"><ClipboardText weight="duotone" /><h1>Nothing ready to approach</h1><p>When a qualified lead is ready, it will appear here for a manual review.</p></section>;
  return <OutreachDesk key={lead.id} lead={lead} leads={leads} mode={mode} selectedId={selectedId} onSelect={setSelectedId} />;
}

function OutreachDesk({ lead, leads, mode, selectedId, onSelect }: { lead: Lead; leads: Lead[]; mode: "demo" | "live"; selectedId: string; onSelect: (id: string) => void }) {
  const [language, setLanguage] = useState<"English" | "BM">("English");
  const [drafts, setDrafts] = useState(() => initialDrafts(lead));
  const [copied, setCopied] = useState(false);
  const [draftState, draftAction, savingDraft] = useActionState(saveLeadDraft.bind(null, lead.id), initialState);
  const [generateState, setGenerateState] = useState<MutationState>(initialState);
  const [generating, startGenerating] = useTransition();
  const [statusState, statusAction, savingStatus] = useActionState(updateLeadStatus.bind(null, lead.id), initialState);
  const message = drafts[language];
  const whatsappNumber = (lead.whatsapp || lead.phone).replace(/\D/g, "");
  const canOpenWhatsApp = mode === "live" && whatsappNumber.length >= 8;
  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const openWhatsApp = () => startTransition(() => { void recordWhatsAppOpened(lead.id); });
  const generate = () => { const formData = new FormData(); formData.set("language", language); startGenerating(() => { generateLeadDraft(lead.id, initialState, formData).then((result) => { setGenerateState(result); if (result.draft && result.language) setDrafts((current) => ({ ...current, [result.language as "English" | "BM"]: result.draft as string })); }).catch(() => setGenerateState({ error: "The AI provider could not be reached. Your existing draft is unchanged.", notice: "" })); }); };
  return <section className="outreach-workspace" aria-label="Manual outreach workspace">
    <header className="outreach-heading"><div><span>Manual outreach</span><h1>Prepare one message properly.</h1><p>Review the claim, then hand off to WhatsApp. Nothing sends without you.</p></div><div className="outreach-count"><strong>{leads.length}</strong><span>ready to review</span></div></header>
    <div className="outreach-layout">
      <aside className="outreach-queue" aria-label="Leads ready for outreach"><header><strong>Queue</strong><span>Highest fit first</span></header><div>{leads.map((item) => <button type="button" key={item.id} onClick={() => onSelect(item.id)} className={item.id === selectedId ? "selected" : ""}><span className="outreach-monogram">{item.company.slice(0, 1)}</span><span><strong>{item.company}</strong><small>{item.city} · {item.niche}</small></span><b>{item.score}</b></button>)}</div></aside>
      <form className="outreach-compose" action={draftAction}>
        <input type="hidden" name="language" value={language} />
        <header><div><span className="pixel-label">Message for</span><h2>{lead.company}</h2></div><div className="outreach-language" role="tablist" aria-label="Message language"><button type="button" className={language === "English" ? "active" : ""} onClick={() => setLanguage("English")}>English</button><button type="button" className={language === "BM" ? "active" : ""} onClick={() => setLanguage("BM")}>BM</button></div></header>
        <div className="outreach-reason"><Sparkle weight="fill" /><p><strong>Angle:</strong> {lead.reason}</p></div>
        <label className="outreach-editor"><span>Message</span><textarea name="draft" value={message} onChange={(event) => setDrafts((current) => ({ ...current, [language]: event.target.value }))} /></label>
        <footer><div className="outreach-feedback">{draftState.error && <span role="alert">{draftState.error}</span>}{draftState.notice && <span role="status">{draftState.notice}</span>}{generateState.error && <span role="alert">{generateState.error}</span>}{generateState.notice && <span role="status">{generateState.notice}</span>}</div><button className="secondary-button" type="button" onClick={copy}><CopySimple />{copied ? "Copied" : "Copy"}</button><button className="secondary-button" type="button" onClick={generate} disabled={mode === "demo" || generating}><Sparkle />{generating ? "Generating..." : "Generate with AI"}</button><button className="primary-button" type="submit" disabled={mode === "demo" || savingDraft}><FloppyDisk />{savingDraft ? "Saving..." : "Save draft"}</button></footer>
      </form>
      <aside className="outreach-brief"><header><span className="pixel-label">Before you send</span><StatusBadge status={statusState.status ?? lead.status} /></header><h2>Keep it personal.</h2><p>{lead.opportunity}</p><dl><div><MapPin /><dt>Location</dt><dd>{lead.city}, {lead.state}</dd></div><div><Phone /><dt>WhatsApp</dt><dd>{lead.whatsapp || lead.phone || "Not listed"}</dd></div></dl>{lead.googleMapsUrl && <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer"><MapPin />Open Google Maps <ArrowSquareOut /></a>}{lead.website && <a href={lead.website} target="_blank" rel="noreferrer"><Globe />Open website <ArrowSquareOut /></a>}<div className="outreach-scope"><span>Suggested scope</span>{lead.scope.map((item) => <small key={item}>{item}</small>)}</div><div className="outreach-send"><a className="whatsapp-button" href={canOpenWhatsApp ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : undefined} target="_blank" rel="noreferrer" aria-disabled={!canOpenWhatsApp} onClick={canOpenWhatsApp ? openWhatsApp : undefined}><WhatsappLogo weight="fill" />Open WhatsApp</a><form action={statusAction}><button className="secondary-button" name="action" value="contacted" disabled={mode === "demo" || savingStatus}><Check />{savingStatus ? "Saving..." : "Mark contacted"}</button></form>{statusState.error && <p className="outreach-error" role="alert">{statusState.error}</p>}{statusState.notice && <p className="outreach-notice" role="status">{statusState.notice}</p>}<small>Opening WhatsApp only prepares the message. You decide whether to send it.</small></div></aside>
    </div>
  </section>;
}

function initialDrafts(lead: Lead) {
  const scope = lead.scope.slice(0, 2).join(" and ") || "a clearer website and enquiry flow";
  return {
    English: lead.englishDraft || `Hi ${lead.company},\n\nI am with NykStack. A quick research note: ${lead.reason}\n\nI think a focused website with ${scope} could make it easier for customers to understand your offer and get in touch. Would you be open to seeing a quick example?\n\nThank you.`,
    BM: lead.bmDraft || `Hi ${lead.company},\n\nSaya dari NykStack. Untuk rujukan: ${lead.reason}\n\nSaya rasa website yang jelas dengan ${scope} boleh bantu pelanggan faham servis anda dan hubungi anda dengan lebih mudah. Adakah anda terbuka untuk lihat contoh ringkas?\n\nTerima kasih.`,
  };
}
