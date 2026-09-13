"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerUserId, isSupabaseConfigured } from "@/lib/supabase/env";
import { generateOutreachDraft } from "@/lib/outreach-draft";
import { defaultSettings, locations, niches } from "@/lib/settings";
import type { LeadStatus } from "@/lib/types";

export type MutationState = { error: string; notice: string; status?: LeadStatus; draft?: string; language?: "English" | "BM" };

async function ownerClient() {
  const ownerId = getOwnerUserId();
  if (!isSupabaseConfigured() || !ownerId) return { error: "Finish Supabase setup before saving changes." } as const;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || user?.id !== ownerId) return { error: "Your session is no longer authorised. Sign in again." } as const;
  return { supabase, ownerId } as const;
}

const leadUpdates: Record<string, { status: LeadStatus; dbStatus: string }> = {
  contacted: { status: "Contacted", dbStatus: "contacted" },
  save: { status: "Qualified", dbStatus: "qualified" },
  skip: { status: "Skip", dbStatus: "skip" },
  blacklist: { status: "Blacklist", dbStatus: "blacklist" },
};

export async function updateLeadStatus(leadId: string, _: MutationState, formData: FormData): Promise<MutationState> {
  const update = leadUpdates[String(formData.get("action") ?? "")];
  if (!update || !/^[0-9a-f-]{36}$/i.test(leadId)) return { error: "That lead action is not valid.", notice: "" };
  const client = await ownerClient();
  if ("error" in client) return { error: client.error ?? "Your session is no longer authorised. Sign in again.", notice: "" };
  const { data: savedSettings, error: settingsError } = await client.supabase.from("app_settings").select("cooldown_days").maybeSingle();
  if (settingsError) return { error: "Could not verify your outreach safety settings.", notice: "" };
  const savedCooldownDays = Number(savedSettings?.cooldown_days);
  const cooldownDays = savedCooldownDays >= 30 ? savedCooldownDays : defaultSettings.cooldownDays;
  const cooldownUntil = new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000).toISOString();
  const patch = update.dbStatus === "contacted" ? { status: update.dbStatus, contacted_at: new Date().toISOString(), cooldown_until: cooldownUntil } : update.dbStatus === "skip" ? { status: update.dbStatus, cooldown_until: cooldownUntil } : { status: update.dbStatus };
  const { data: changedLead, error } = await client.supabase.from("leads").update(patch).eq("id", leadId).select("id").maybeSingle();
  if (error || !changedLead) return { error: "Could not save this lead. Try again.", notice: "" };
  const eventType = update.dbStatus === "contacted" ? "contacted" : "status_changed";
  const { error: activityError } = await client.supabase.from("lead_activities").insert({ owner_id: client.ownerId, lead_id: leadId, event_type: eventType, note: `Status changed to ${update.status}.` });
  if (activityError) return { error: "Lead updated, but the activity note could not be saved.", notice: "" };
  ["/", "/leads", "/pipeline", `/leads/${leadId}`].forEach((path) => revalidatePath(path));
  return { error: "", notice: `Saved as ${update.status}.`, status: update.status };
}

export async function saveLeadDraft(leadId: string, _: MutationState, formData: FormData): Promise<MutationState> {
  const language = String(formData.get("language") ?? "");
  const draft = String(formData.get("draft") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(leadId) || !["English", "BM"].includes(language) || draft.length < 3 || draft.length > 3000) {
    return { error: "Write a message between 3 and 3,000 characters.", notice: "" };
  }
  const client = await ownerClient();
  if ("error" in client) return { error: client.error ?? "Your session is no longer authorised. Sign in again.", notice: "" };
  const field = language === "English" ? "draft_en" : "draft_bm";
  const { data: updatedLead, error } = await client.supabase.from("leads").update({ [field]: draft }).eq("id", leadId).select("id").maybeSingle();
  if (error || !updatedLead) return { error: "Could not save your draft. Try again.", notice: "" };
  await client.supabase.from("lead_activities").insert({ owner_id: client.ownerId, lead_id: leadId, event_type: "follow_up", note: `${language} outreach draft saved.` });
  revalidatePath("/outreach");
  revalidatePath(`/leads/${leadId}`);
  return { error: "", notice: "Draft saved." };
}

export async function generateLeadDraft(leadId: string, _: MutationState, formData: FormData): Promise<MutationState> {
  const language = String(formData.get("language") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(leadId) || !["English", "BM"].includes(language)) return { error: "That draft request is not valid.", notice: "" };
  const client = await ownerClient();
  if ("error" in client) return { error: client.error ?? "Your session is no longer authorised. Sign in again.", notice: "" };
  const { data: lead, error: leadError } = await client.supabase.from("leads").select("business_name,niche,city,state,website_status,research_summary,opportunity_summary,suggested_scope").eq("id", leadId).maybeSingle();
  if (leadError || !lead) return { error: "Could not load this lead for drafting.", notice: "" };
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey || apiKey === "replace_me_if_needed") return { error: "AI generation is not configured yet. Add AI_PROVIDER_API_KEY on the server.", notice: "" };
  let draft = "";
  try {
    draft = await generateOutreachDraft({ lead, language: language as "English" | "BM", apiKey, baseUrl: process.env.AI_PROVIDER_BASE_URL, model: process.env.AI_PROVIDER_MODEL });
  } catch {
    return { error: "The AI provider could not be reached. Your existing draft is unchanged.", notice: "" };
  }
  if (!draft) return { error: "The AI provider returned no draft. Your existing draft is unchanged.", notice: "" };
  const field = language === "English" ? "draft_en" : "draft_bm";
  const { data: updatedLead, error } = await client.supabase.from("leads").update({ [field]: draft }).eq("id", leadId).select("id").maybeSingle();
  if (error || !updatedLead) return { error: "Draft generated but could not be saved. Copy it before leaving this page.", notice: "", draft, language: language as "English" | "BM" };
  await client.supabase.from("lead_activities").insert({ owner_id: client.ownerId, lead_id: leadId, event_type: "follow_up", note: `${language} AI outreach draft generated.` });
  revalidatePath("/outreach");
  revalidatePath(`/leads/${leadId}`);
  return { error: "", notice: "AI draft generated and saved.", draft, language: language as "English" | "BM" };
}

export async function recordWhatsAppOpened(leadId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return;
  const client = await ownerClient();
  if ("error" in client) return;
  await client.supabase.from("lead_activities").insert({ owner_id: client.ownerId, lead_id: leadId, event_type: "whatsapp_opened", note: "WhatsApp handoff opened manually." });
  await client.supabase.from("telegram_notifications").update({ owner_action: "whatsapp_opened", action_at: new Date().toISOString() }).eq("lead_id", leadId);
}

function numberValue(value: FormDataEntryValue | null, minimum: number, maximum: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export async function saveSettings(_: MutationState, formData: FormData): Promise<MutationState> {
  const client = await ownerClient();
  if ("error" in client) return { error: client.error ?? "Your session is no longer authorised. Sign in again.", notice: "" };
  const activeNiches = formData.getAll("niches").map(String).filter((item) => niches.some(([value]) => value === item));
  const activeLocationBatches = formData.getAll("locations").map(String).filter((item) => locations.includes(item));
  if (!activeNiches.length || !activeLocationBatches.length) return { error: "Select at least one niche and location batch.", notice: "" };
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "auto");
  const dailyDigestTime = String(formData.get("dailyDigestTime") ?? defaultSettings.dailyDigestTime);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dailyDigestTime) || !["auto", "en", "bm"].includes(preferredLanguage)) return { error: "One of the settings is not valid.", notice: "" };
  const { error } = await client.supabase.from("app_settings").upsert({
    owner_id: client.ownerId, active_niches: activeNiches, active_location_batches: activeLocationBatches,
    minimum_lead_score: numberValue(formData.get("minimumLeadScore"), 0, 100, defaultSettings.minimumLeadScore),
    telegram_threshold: numberValue(formData.get("telegramThreshold"), 0, 100, defaultSettings.telegramThreshold),
    max_alerts_per_scan: numberValue(formData.get("maxAlertsPerScan"), 1, 5, defaultSettings.maxAlertsPerScan),
    daily_spend_limit_usd: numberValue(formData.get("dailySpendLimitUsd"), 0, 100000, 0),
    daily_digest_time: dailyDigestTime, cooldown_days: numberValue(formData.get("cooldownDays"), 30, 3650, defaultSettings.cooldownDays),
    preferred_language: preferredLanguage, outreach_signature: String(formData.get("outreachSignature") ?? "").trim().slice(0, 1000),
  }, { onConflict: "owner_id" });
  if (error) return { error: "Could not save settings. Try again.", notice: "" };
  revalidatePath("/settings");
  return { error: "", notice: "Settings saved." };
}
