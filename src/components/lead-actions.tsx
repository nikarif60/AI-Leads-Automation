"use client";

import { BookmarkSimple, Check, Prohibit, WhatsappLogo } from "@phosphor-icons/react";
import { useActionState } from "react";
import { updateLeadStatus, type MutationState } from "@/app/actions";
import type { LeadStatus } from "@/lib/types";

const initialState: MutationState = { error: "", notice: "" };

export function LeadActions({ initialStatus, leadId, mode }: { initialStatus: LeadStatus; leadId: string; mode: "demo" | "live" }) {
  const [state, formAction, pending] = useActionState(updateLeadStatus.bind(null, leadId), initialState);
  const unavailable = mode === "demo" || pending;
  const status = state.status ?? initialStatus;
  return (
    <form className="lead-actions-wrap" action={formAction}>
      <div className="action-status"><span>Current status</span><strong>{status}</strong>{state.notice && <small role="status">{state.notice}</small>}{state.error && <small role="alert">{state.error}</small>}</div>
      <div className="lead-actions">
        <button className="whatsapp-button" type="button" disabled title="Manual WhatsApp handoff is not enabled in Phase 1"><WhatsappLogo weight="fill" />Open WhatsApp</button>
        <button className="secondary-button" name="action" value="contacted" disabled={unavailable}><Check />{pending ? "Saving..." : "Mark contacted"}</button>
        <button className="secondary-button" name="action" value="save" disabled={unavailable}><BookmarkSimple />Save for later</button>
        <button className="text-button danger" name="action" value="skip" disabled={unavailable}><Prohibit />Skip 90 days</button>
        <button className="text-button danger" name="action" value="blacklist" disabled={unavailable} onClick={(event) => { if (!window.confirm("Blacklist this lead? It will stay excluded from the active pipeline.")) event.preventDefault(); }}>Blacklist</button>
      </div>
      <p className="action-note">{mode === "demo" ? "Connect Supabase to save lead actions. WhatsApp remains disabled by design." : "Changes are saved to your owner-only Supabase data. WhatsApp remains manual."}</p>
    </form>
  );
}
