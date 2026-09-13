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

export async function generateOutreachDraft({ lead, language, apiKey, baseUrl, model, fetchImpl = fetch }: DraftOptions) {
  if (!apiKey || apiKey === "replace_me_if_needed" || !baseUrl || !model) return "";
  const websiteObservation = lead.website_status === "no_website"
    ? "No official website link was found on the scanned listing. This is not proof that the business has no website."
    : `Website status recorded by the scan: ${lead.website_status || "not available"}.`;
  const prompt = `Write one concise ${language === "BM" ? "Bahasa Melayu" : "English"} WhatsApp outreach draft for NykStack. Use only these facts and do not invent claims. Mention the business name, one specific research reason, and one useful website improvement. End with a low-pressure question. No subject line, no markdown, maximum 110 words.\n\nTruthfulness rule: Never say the business has no website, no official website, an outdated website, or any other absolute website claim. When no link was found, say only that you could not find an official website link on the listing reviewed (BM: \"saya tidak menjumpai pautan website rasmi pada listing yang saya semak\"). Keep this as an observation, not a conclusion.\n\nBusiness: ${lead.business_name}\nNiche: ${lead.niche || "not available"}\nLocation: ${lead.city || "not available"}, ${lead.state || "not available"}\nWebsite observation: ${websiteObservation}\nResearch reason: ${lead.research_summary || "not available"}\nOpportunity: ${lead.opportunity_summary || "not available"}\nSuggested scope: ${Array.isArray(lead.suggested_scope) ? lead.suggested_scope.join(", ") : "website improvements"}`;
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.4, max_tokens: 220, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as { choices?: { message?: { content?: unknown } }[] };
  const draft = typeof body.choices?.[0]?.message?.content === "string" ? body.choices[0].message.content.trim() : "";
  return response.ok && draft ? draft : "";
}
