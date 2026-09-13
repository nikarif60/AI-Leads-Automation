import { createClient } from "@supabase/supabase-js";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress", "places.shortFormattedAddress",
  "places.nationalPhoneNumber", "places.internationalPhoneNumber", "places.websiteUri",
  "places.googleMapsUri", "places.types", "places.addressComponents",
].join(",");

function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function normalise(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function component(place, type) {
  return (place.addressComponents ?? []).find((item) => item.types?.includes(type))?.longText ?? "";
}

export function placeToLead(place, { niche, city }) {
  const businessName = clean(place.displayName?.text);
  const address = clean(place.formattedAddress);
  const website = clean(place.websiteUri);
  const phone = clean(place.internationalPhoneNumber || place.nationalPhoneNumber);
  const social = /facebook|instagram|tiktok|linkedin\.com/i.test(website) ? [website] : [];
  const websiteStatus = !website ? "no_website" : social.length ? "social_only" : "good_website";
  const score = Math.min(100, 40 + (!website ? 25 : social.length ? 10 : 0) + (phone ? 10 : 0) + (social.length ? 10 : 0));
  const resolvedCity = component(place, "locality") || city;
  const state = component(place, "administrative_area_level_1") || "Malaysia";
  return {
    google_place_id: clean(place.id),
    normalized_name: normalise(businessName),
    normalized_address: normalise(address),
    business_name: businessName,
    niche, city: resolvedCity, state, country_code: "MY", address, phone,
    normalized_phone: phone ? phone.replace(/[^0-9+]/g, "") : null,
    whatsapp_number: phone ? phone.replace(/[^0-9]/g, "").replace(/^0/, "60") : null,
    website_domain: website ? (() => { try { return new URL(website).hostname.replace(/^www\./, ""); } catch { return null; } })() : null,
    website_url: website || null, website_status: websiteStatus, score,
    status: "new",
    opportunity_summary: !website ? "No official website listed; create a clear enquiry path for this business." : "Improve the website journey so more local enquiries convert.",
    research_summary: `${websiteStatus === "no_website" ? "No official website was listed" : "A website was listed"} for this ${niche.replace(/_/g, " ")} in ${resolvedCity}. Review before approaching.`,
    social_urls: social, suggested_scope: ["Mobile-first service page", "Enquiry form", "Local SEO basics"],
    source_urls: [clean(place.googleMapsUri)].filter(Boolean), evidence: [{ source: "Google Places API", place_id: clean(place.id) }],
  };
}

export async function reserveRequest(supabase, ownerId, dailyLimit) {
  const { data, error } = await supabase.rpc("reserve_google_places_requests", {
    p_owner_id: ownerId, p_units: 1, p_daily_limit: dailyLimit,
  });
  if (error) throw new Error(`Quota reservation failed: ${error.message}`);
  if (data !== true) throw new Error("Google Places daily quota reached; scan stopped before another request.");
}

export async function searchPlaces({ apiKey, textQuery, supabase, ownerId, dailyLimit, fetchImpl = fetch }) {
  await reserveRequest(supabase, ownerId, dailyLimit);
  const response = await fetchImpl(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
    body: JSON.stringify({ textQuery, languageCode: "en", regionCode: "MY", pageSize: 5 }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Google Places ${response.status}: ${clean(body.error?.message) || "request failed"}`);
  return Array.isArray(body.places) ? body.places : [];
}

export function getAdminClient(env = process.env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY.startsWith("LEAVE_EMPTY")) {
    throw new Error("Live scan requires NEXT_PUBLIC_SUPABASE_URL and a server-only SUPABASE_SECRET_KEY.");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function requiredLiveEnv(env = process.env) {
  for (const name of ["GOOGLE_PLACES_API_KEY", "OWNER_USER_ID"]) {
    if (!clean(env[name]) || env[name] === "replace_me") throw new Error(`Live scan requires ${name}.`);
  }
}

export { FIELD_MASK };
