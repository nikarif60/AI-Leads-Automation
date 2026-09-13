type OutreachLeadFacts = {
  business_name: string;
  niche?: string | null;
  city?: string | null;
  state?: string | null;
  website_status?: string | null;
  research_summary?: string | null;
  opportunity_summary?: string | null;
  suggested_scope?: string[] | null;
};

type DraftOptions = {
  lead: OutreachLeadFacts;
  language: "English" | "BM";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

function text(value: string | null | undefined, fallback: string) { return value?.trim() || fallback; }
function title(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function choice(value: string) { return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3; }

export function fallbackOutreachDraft(lead: OutreachLeadFacts, language: "English" | "BM") {
  const business = text(lead.business_name, "there");
  const niche = title(text(lead.niche, "local service"));
  const location = lead.city?.trim() ? ` in ${lead.city.trim()}` : "";
  const scope = (lead.suggested_scope ?? []).slice(0, 2).join(language === "BM" ? " dan " : " and ") || (language === "BM" ? "halaman servis yang jelas dan pertanyaan WhatsApp" : "a clearer service page and WhatsApp enquiry flow");
  const websiteFinding = lead.website_status === "no_website"
    ? language === "BM" ? "saya tidak menjumpai pautan website rasmi pada listing yang saya semak" : "I could not find an official website link on the listing I reviewed"
    : lead.website_status === "social_only"
      ? language === "BM" ? "kebanyakan maklumat yang saya jumpa datang daripada pautan media sosial" : "most of the information I found points to social media"
      : language === "BM" ? "saya nampak ruang untuk jadikan maklumat servis dan pertanyaan lebih jelas" : "I noticed there may be room to make services and enquiries easier to find";
  const variants = language === "BM"
    ? [
      `Hi ${business},\n\nSaya Nik dari NykStack. Masa saya semak listing ${niche}${location}, ${websiteFinding}.\n\nDengan ${scope}, pelanggan mungkin lebih mudah faham servis dan terus hubungi team. Nak saya share contoh ringkas yang sesuai untuk ${business}?`,
      `Hi ${business},\n\nSaya terjumpa listing ${niche} ini${location} semasa buat research. ${websiteFinding.charAt(0).toUpperCase()}${websiteFinding.slice(1)}.\n\nSaya rasa ${scope} boleh bantu jadikan langkah enquiry lebih senang. Kalau okay, saya boleh tunjuk satu idea ringkas.`,
      `Hi ${business},\n\nSaya Nik dari NykStack. Saya sedang semak bisnes ${niche}${location} dan ${websiteFinding}.\n\nMungkin ${scope} boleh bagi pelanggan jalan yang lebih jelas untuk tengok servis dan WhatsApp team. Berminat nak tengok contoh?`,
    ]
    : [
      `Hi ${business},\n\nI’m Nik from NykStack. While reviewing ${niche} businesses${location}, ${websiteFinding}.\n\nA focused ${scope} could make it easier for customers to understand the service and reach your team. Would you be open to a quick example for ${business}?`,
      `Hi ${business},\n\nI came across your ${niche} listing${location} while doing some research. ${websiteFinding.charAt(0).toUpperCase()}${websiteFinding.slice(1)}.\n\nI think ${scope} could make the enquiry journey clearer. Happy to share one simple idea if useful.`,
      `Hi ${business},\n\nI’m Nik from NykStack. I was looking into ${niche} businesses${location} and ${websiteFinding}.\n\nThere may be a practical opportunity to use ${scope} so customers can find what they need and message the team sooner. Want me to send a short example?`,
    ];
  return variants[choice(business)];
}

export async function generateOutreachDraft({ lead, language, apiKey, baseUrl, model, fetchImpl = fetch }: DraftOptions) {
  if (!apiKey || apiKey === "replace_me_if_needed" || !baseUrl || !model) return "";
  const websiteObservation = lead.website_status === "no_website"
    ? "No official website link was found on the scanned listing. This is not proof that the business has no website."
    : `Website status recorded by the scan: ${lead.website_status || "not available"}.`;
  const tone = language === "BM"
    ? "Use casual, polite Malaysian WhatsApp Malay. Sound like a real person, not a company brochure. Start with Hi, use saya, and refer to the business by name or team. Never use anda, pihak anda, tuan/puan, encik, yang dihormati, or stiff formal phrases. Keep sentences short and natural; light Manglish is okay."
    : "Use warm, casual Malaysian WhatsApp English. Sound like a real person, not a sales brochure. Start with Hi, use I naturally, short sentences, contractions, and no corporate jargon or stiff phrases like Dear Sir/Madam or kindly.";
  const prompt = `Write one friendly ${language === "BM" ? "Bahasa Melayu" : "English"} WhatsApp outreach draft for NykStack. ${tone} Use only these facts and do not invent claims. Personalisation is mandatory: name the business, use the specific research reason, and connect one useful website improvement to that exact finding. Do not use stock lines about a generic opportunity. End with a low-pressure question. No subject line, no markdown, maximum 90 words.\n\nTruthfulness rule: Never say the business has no website, no official website, an outdated website, or any other absolute website claim. When no link was found, say only that you could not find an official website link on the listing reviewed (BM: \"saya tidak menjumpai pautan website rasmi pada listing yang saya semak\"). Keep this as an observation, not a conclusion.\n\nBusiness: ${lead.business_name}\nNiche: ${lead.niche || "not available"}\nLocation: ${lead.city || "not available"}, ${lead.state || "not available"}\nWebsite observation: ${websiteObservation}\nResearch reason: ${lead.research_summary || "not available"}\nOpportunity: ${lead.opportunity_summary || "not available"}\nSuggested scope: ${Array.isArray(lead.suggested_scope) ? lead.suggested_scope.join(", ") : "website improvements"}`;
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.6, max_tokens: 220, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as { choices?: { message?: { content?: unknown } }[] };
  const draft = typeof body.choices?.[0]?.message?.content === "string" ? body.choices[0].message.content.trim() : "";
  return response.ok && draft ? draft : "";
}
