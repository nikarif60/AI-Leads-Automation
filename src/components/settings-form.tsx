"use client";

import { Check, FloppyDisk } from "@phosphor-icons/react";
import { useActionState } from "react";
import { saveSettings, type MutationState } from "@/app/actions";
import { locations, niches, type AppSettings } from "@/lib/settings";

const initialState: MutationState = { error: "", notice: "" };

export function SettingsForm({ initialSettings, mode }: { initialSettings: AppSettings; mode: "demo" | "live" }) {
  const [state, formAction, pending] = useActionState(saveSettings, initialState);
  const unavailable = mode === "demo" || pending;
  return (
    <form className="settings-grid" action={formAction}>
      <section className="settings-card"><h2>Search target</h2><p>Rotate one niche through a small location batch each run.</p><label className="locked-field"><input type="checkbox" checked disabled /><span><strong>Malaysia only</strong><small>Locked for every scan</small></span></label><fieldset><legend>Active niches</legend>{niches.map(([value, label]) => <label className="check-row" key={value}><input name="niches" type="checkbox" value={value} defaultChecked={initialSettings.activeNiches.includes(value)} disabled={unavailable} /><span>{label}</span></label>)}</fieldset><fieldset><legend>Location batches</legend>{locations.map((location) => <label className="check-row" key={location}><input name="locations" type="checkbox" value={location} defaultChecked={initialSettings.activeLocationBatches.includes(location)} disabled={unavailable} /><span>{location}</span></label>)}</fieldset></section>
      <section className="settings-card"><h2>Scoring and alerts</h2><p>Scores estimate fit. They do not claim a business has budget.</p><label className="input-row"><span>Keep lead at</span><input name="minimumLeadScore" type="number" defaultValue={initialSettings.minimumLeadScore} min={0} max={100} disabled={unavailable} /></label><label className="input-row"><span>Telegram threshold</span><input name="telegramThreshold" type="number" defaultValue={initialSettings.telegramThreshold} min={0} max={100} disabled={unavailable} /></label><label className="input-row"><span>Max alerts per scan</span><input name="maxAlertsPerScan" type="number" defaultValue={initialSettings.maxAlertsPerScan} min={1} max={5} disabled={unavailable} /></label><label className="input-row"><span>Daily spend limit (USD)</span><input name="dailySpendLimitUsd" type="number" defaultValue={initialSettings.dailySpendLimitUsd} min={0} step="0.1" disabled={unavailable} /></label></section>
      <section className="settings-card"><h2>Schedule</h2><p>The repository workflow is prepared but disabled by default.</p><label className="locked-field paused"><input type="checkbox" disabled /><span><strong>Automatic scans paused</strong><small>Enable the repository variable after setup</small></span></label><label className="input-row"><span>Cadence</span><input value="Every 3 hours" readOnly /></label><label className="input-row"><span>Daily digest</span><input name="dailyDigestTime" type="time" defaultValue={initialSettings.dailyDigestTime} disabled={unavailable} /></label></section>
      <section className="settings-card"><h2>Outreach safety</h2><p>Every message stays manual. No cold WhatsApp message is sent automatically.</p><label className="input-row"><span>Cooldown days</span><input name="cooldownDays" type="number" defaultValue={initialSettings.cooldownDays} min={30} disabled={unavailable} /></label><label className="input-row"><span>Preferred draft</span><select name="preferredLanguage" defaultValue={initialSettings.preferredLanguage} disabled={unavailable}><option value="auto">Auto</option><option value="en">English</option><option value="bm">Bahasa Melayu</option></select></label><label className="stack-field"><span>Default signature</span><textarea name="outreachSignature" defaultValue={initialSettings.outreachSignature} disabled={unavailable} /></label></section>
      <div className="settings-save"><button className="primary-button" disabled={unavailable}>{pending ? <Check /> : <FloppyDisk />}{pending ? "Saving..." : "Save settings"}</button><p role={state.error ? "alert" : "status"}>{mode === "demo" ? "Connect Supabase to persist settings." : state.error || state.notice || "Changes save to your owner-only Supabase data."}</p></div>
    </form>
  );
}
