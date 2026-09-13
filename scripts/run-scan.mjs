import assert from "node:assert/strict";
import { getAdminClient, placeToLead, requiredLiveEnv, searchPlaces } from "./google-places-adapter.mjs";
import { priorityLeadKeyboard, priorityLeadMessage, sendTelegramMessage } from "./telegram-notifier.mjs";
import { fallbackOutreachDraft, generateOutreachDraft } from "../src/lib/outreach-draft.ts";

const niches = ["corporate_services", "renovation_interior", "property_homestay", "salon_barber", "automotive", "cafe_restaurant"];
const locationBatches = [
  ["Kuala Lumpur", "Shah Alam"],
  ["Johor Bahru", "Skudai"],
  ["George Town", "Bukit Mertajam"],
  ["Melaka", "Seremban", "Ipoh", "Alor Setar"],
  ["Kuantan", "Kota Bharu", "Kuala Terengganu"],
  ["Kota Kinabalu", "Kuching"],
];

export function selectRotation(date = new Date()) {
  const slot = Math.floor(date.getTime() / 18_000_000);
  return { niche: niches[slot % niches.length], cities: locationBatches[slot % locationBatches.length] };
}

export function notificationLimit(value = "5") {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 5)) : 5;
}

export function googleRequestLimits(perScan = "5", perDay = "25") {
  const scan = Number.parseInt(perScan, 10);
  const day = Number.parseInt(perDay, 10);
  if (!Number.isInteger(scan) || scan < 1 || scan > 5) throw new Error("MAX_GOOGLE_REQUESTS_PER_SCAN must be between 1 and 5.");
  if (!Number.isInteger(day) || day < scan || day > 25) throw new Error("DAILY_GOOGLE_REQUEST_LIMIT must be between the per-scan limit and 25.");
  return { perScan: scan, perDay: day };
}

async function selfCheck() {
  const first = selectRotation(new Date("2026-09-03T00:00:00Z"));
  const next = selectRotation(new Date("2026-09-03T05:00:00Z"));
  assert.equal(first.cities.length > 0, true);
  assert.notEqual(first.niche, next.niche);
  assert.equal(notificationLimit("99"), 5);
  assert.equal(notificationLimit("0"), 1);
  assert.deepEqual(googleRequestLimits("5", "25"), { perScan: 5, perDay: 25 });
  assert.throws(() => googleRequestLimits("6", "25"));
  assert.throws(() => googleRequestLimits("5", "26"));
  assert.match(priorityLeadMessage({ id: "lead-1", business_name: "Demo & Co", city: "Kuala Lumpur", score: 80, opportunity_summary: "<strong>Opportunity</strong>" }, "https://app.example"), /Demo &amp; Co/);
  const keyboard = priorityLeadKeyboard({ id: "lead-1", business_name: "Demo Co", city: "Kuala Lumpur", whatsapp_number: "60123456789" }, "https://app.example");
  assert.match(keyboard.inline_keyboard[0][0].url, /^https:\/\/wa\.me\/60123456789\?text=/);
  assert.match(keyboard.inline_keyboard[0][1].url, /^https:\/\/wa\.me\/60123456789\?text=/);
  assert.match(keyboard.inline_keyboard[1][0].url, /^https:\/\/www\.google\.com\/maps\/search/);
  const secondKeyboard = priorityLeadKeyboard({ id: "lead-2", business_name: "Another Co", niche: "automotive", city: "Johor Bahru", website_status: "social_only", suggested_scope: ["Service menu"], whatsapp_number: "60123456789" }, "https://app.example");
  assert.notEqual(keyboard.inline_keyboard[0][0].url, secondKeyboard.inline_keyboard[0][0].url);
  assert.match(decodeURIComponent(secondKeyboard.inline_keyboard[0][1].url), /Another Co/);
  assert.match(fallbackOutreachDraft({ business_name: "Another Co", niche: "automotive", city: "Johor Bahru", website_status: "social_only", suggested_scope: ["Service menu"] }, "BM"), /media sosial/);
  const lead = placeToLead({ id: "places/x", displayName: { text: "Demo Co" }, formattedAddress: "Kuala Lumpur, Malaysia", internationalPhoneNumber: "+60123456789", types: [] }, { niche: "corporate_services", city: "Kuala Lumpur" });
  assert.equal(lead.country_code, "MY");
  assert.equal(lead.website_status, "no_website");
  const draft = await generateOutreachDraft({
    lead: { business_name: "Demo Co", website_status: "no_website" }, language: "English", apiKey: "test", baseUrl: "https://ai.example", model: "test",
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "I could not find an official website link on the listing I reviewed." } }] })),
  });
  assert.match(draft, /could not find an official website link/i);
  const prompts = [];
  await generateOutreachDraft({
    lead: { business_name: "Another Co", niche: "automotive", city: "Johor Bahru", website_status: "social_only", research_summary: "The listing points to social media.", suggested_scope: ["Service menu"] }, language: "BM", apiKey: "test", baseUrl: "https://ai.example", model: "test",
    fetchImpl: async (_url, init) => { prompts.push(JSON.parse(String(init?.body)).messages[0].content); return new Response(JSON.stringify({ choices: [{ message: { content: "Hi Another Co" } }] })); },
  });
  assert.match(prompts[0], /Another Co/);
  assert.match(prompts[0], /The listing points to social media/);
  const aiKeyboard = priorityLeadKeyboard({ id: "lead-1", business_name: "Demo Co", city: "Kuala Lumpur", whatsapp_number: "60123456789", draft_en: draft, draft_bm: "Saya tidak menjumpai pautan website rasmi." }, "https://app.example");
  assert.match(aiKeyboard.inline_keyboard[0][0].url, /could%20not%20find%20an%20official%20website%20link/i);
  assert.match(aiKeyboard.inline_keyboard[0][1].url, /Saya%20tidak%20menjumpai/i);
  console.log("Scan planner self-check passed.");
}

if (process.argv.includes("--self-check")) {
  await selfCheck();
  process.exit(0);
}

const dryRun = process.argv.includes("--dry-run") || process.env.ENABLE_LIVE_SCANS !== "true";
const googleRequestLimitsForRun = googleRequestLimits(
  process.env.MAX_GOOGLE_REQUESTS_PER_SCAN ?? "5",
  process.env.DAILY_GOOGLE_REQUEST_LIMIT ?? "25",
);
const plan = {
  mode: dryRun ? "dry_run" : "live",
  country: "MY",
  ...selectRotation(),
  notificationLimit: notificationLimit(process.env.MAX_ALERTS_PER_SCAN),
  googleRequestLimits: googleRequestLimitsForRun,
  githubRunId: process.env.GITHUB_RUN_ID ?? null,
};

console.log(JSON.stringify({ event: "scan_planned", ...plan }, null, 2));
if (!dryRun) {
  requiredLiveEnv();
  const supabase = getAdminClient();
  const job = await supabase.from("scan_jobs").insert({ owner_id: process.env.OWNER_USER_ID, status: "running", niche: plan.niche, cities: plan.cities, github_run_id: plan.githubRunId }).select("id").single();
  if (job.error) throw new Error(`Could not create scan job: ${job.error.message}`);
  try {
    const leads = [];
    for (const city of plan.cities.slice(0, plan.googleRequestLimits.perScan)) {
      const places = await searchPlaces({ apiKey: process.env.GOOGLE_PLACES_API_KEY, textQuery: `${plan.niche.replace(/_/g, " ")} in ${city}, Malaysia`, supabase, ownerId: process.env.OWNER_USER_ID, dailyLimit: plan.googleRequestLimits.perDay });
      leads.push(...places.map((place) => ({ ...placeToLead(place, { niche: plan.niche, city }), owner_id: process.env.OWNER_USER_ID })));
    }
    const uniqueLeads = [...new Map(leads.filter((lead) => lead.google_place_id && lead.business_name && lead.address).map((lead) => [lead.google_place_id, lead])).values()];
    let newLeadsCount = 0;
    let insertedLeads = [];
    if (uniqueLeads.length) {
      const existing = await supabase.from("leads").select("google_place_id,normalized_phone,website_domain,normalized_name,normalized_address").eq("owner_id", process.env.OWNER_USER_ID);
      if (existing.error) throw new Error(`Could not check existing leads: ${existing.error.message}`);
      const seen = new Set((existing.data ?? []).flatMap((lead) => [lead.google_place_id, lead.normalized_phone, lead.website_domain, `${lead.normalized_name}|${lead.normalized_address}`].filter(Boolean)));
      const freshLeads = uniqueLeads.filter((lead) => {
        const keys = [lead.google_place_id, lead.normalized_phone, lead.website_domain, `${lead.normalized_name}|${lead.normalized_address}`].filter(Boolean);
        if (keys.some((key) => seen.has(key))) return false;
        keys.forEach((key) => seen.add(key));
        return true;
      });
      newLeadsCount = freshLeads.length;
      const result = freshLeads.length ? await supabase.from("leads").insert(freshLeads).select("id,business_name,niche,city,state,website_status,research_summary,score,opportunity_summary,suggested_scope,whatsapp_number,phone,draft_en,draft_bm,source_urls") : { data: [], error: null };
      if (result.error) throw new Error(`Could not save leads: ${result.error.message}`);
      insertedLeads = result.data ?? [];
    }
    let notificationsSent = 0;
    const priorityLeads = insertedLeads.filter((lead) => lead.score >= 75).sort((a, b) => b.score - a.score).slice(0, plan.notificationLimit);
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      for (const lead of priorityLeads) {
        const queued = await supabase.from("telegram_notifications").insert({ owner_id: process.env.OWNER_USER_ID, lead_id: lead.id, scan_job_id: job.data.id }).select("id").single();
        if (queued.error) throw new Error(`Could not queue Telegram notification: ${queued.error.message}`);
        try {
          let aiDraftEn = "";
          let aiDraftBm = "";
          try {
            aiDraftEn = await generateOutreachDraft({ lead, language: "English", apiKey: process.env.AI_PROVIDER_API_KEY, baseUrl: process.env.AI_PROVIDER_BASE_URL, model: process.env.AI_PROVIDER_MODEL });
            aiDraftBm = await generateOutreachDraft({ lead, language: "BM", apiKey: process.env.AI_PROVIDER_API_KEY, baseUrl: process.env.AI_PROVIDER_BASE_URL, model: process.env.AI_PROVIDER_MODEL });
            const drafts = { ...(aiDraftEn ? { draft_en: aiDraftEn } : {}), ...(aiDraftBm ? { draft_bm: aiDraftBm } : {}) };
            if (Object.keys(drafts).length) await supabase.from("leads").update(drafts).eq("id", lead.id);
          } catch {
            // Keep the Telegram alert useful even when the optional AI provider is unavailable.
          }
          const telegramLead = { ...lead, ...(aiDraftEn ? { draft_en: aiDraftEn } : {}), ...(aiDraftBm ? { draft_bm: aiDraftBm } : {}) };
          const telegramMessageId = await sendTelegramMessage({ token: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID, text: priorityLeadMessage(telegramLead, process.env.NEXT_PUBLIC_APP_URL), keyboard: priorityLeadKeyboard(telegramLead, process.env.NEXT_PUBLIC_APP_URL) });
          const delivered = await supabase.from("telegram_notifications").update({ delivery_status: "sent", telegram_message_id: telegramMessageId, sent_at: new Date().toISOString() }).eq("id", queued.data.id);
          if (delivered.error) throw new Error(`Could not record Telegram delivery: ${delivered.error.message}`);
          notificationsSent += 1;
        } catch (error) {
          await supabase.from("telegram_notifications").update({ delivery_status: "failed", last_error: error instanceof Error ? error.message : String(error) }).eq("id", queued.data.id);
        }
      }
    }
    const status = newLeadsCount ? "completed_with_leads" : "completed_no_leads";
    const update = await supabase.from("scan_jobs").update({ status, completed_at: new Date().toISOString(), leads_scanned: leads.length, new_unique_leads: newLeadsCount, qualified_leads: uniqueLeads.filter((lead) => lead.score >= 40).length, notifications_sent: notificationsSent }).eq("id", job.data.id);
    if (update.error) throw new Error(`Could not complete scan job: ${update.error.message}`);
    console.log(JSON.stringify({ event: "scan_completed", status, scanned: leads.length, newLeads: newLeadsCount, notificationsSent }, null, 2));
  } catch (error) {
    await supabase.from("scan_jobs").update({ status: "failed", completed_at: new Date().toISOString(), last_error: error instanceof Error ? error.message : String(error) }).eq("id", job.data.id);
    throw error;
  }
} else {
console.log("Dry run complete. No API request, database write, Telegram alert or outreach message was sent.");
}
