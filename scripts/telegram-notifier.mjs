const ENDPOINT = "https://api.telegram.org/bot";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

export function priorityLeadMessage(lead, appUrl = "") {
  const leadUrl = appUrl && lead.id ? `\n\n🔗 <a href="${escapeHtml(`${appUrl.replace(/\/$/, "")}/leads/${lead.id}`)}">Open lead in dashboard</a>` : "";
  return [
    "🚨 <b>NEW PRIORITY LEAD</b>",
    "━━━━━━━━━━━━━━━━━━",
    `🏢 <b>${escapeHtml(lead.business_name)}</b>`,
    `📍 ${escapeHtml(lead.city)}`,
    "",
    `⭐ <b>Fit score:</b> ${lead.score}/100`,
    `💡 <b>Opportunity:</b> ${escapeHtml(lead.opportunity_summary)}`,
    "",
    "Review the message before opening WhatsApp.",
  ].join("\n") + leadUrl;
}

export function priorityLeadKeyboard(lead, appUrl = "") {
  const phone = String(lead.whatsapp_number || lead.phone || "").replace(/\D/g, "");
  const englishDraft = String(lead.draft_en || `Hi ${lead.business_name},\n\nI am with NykStack. I noticed an opportunity to make it easier for customers to learn about your business and get in touch. Would you be open to seeing a quick example?`);
  const bmDraft = String(lead.draft_bm || `Hi ${lead.business_name},\n\nSaya Nik dari NykStack. Saya nampak peluang untuk mudahkan pelanggan faham bisnes ini dan hubungi team dengan lebih senang. Nak tengok contoh ringkas?`);
  const sourceUrls = Array.isArray(lead.source_urls) ? lead.source_urls : [];
  const mapsUrl = sourceUrls.find((url) => /^https:\/\/(?:www\.)?google\.[^/]+\/maps|^https:\/\/maps\.app\.goo\.gl\//.test(String(url))) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.business_name} ${lead.city || "Malaysia"}`)}`;
  const rows = phone.length >= 8
    ? [[
      { text: "WhatsApp · English", url: `https://wa.me/${phone}?text=${encodeURIComponent(englishDraft)}` },
      { text: "WhatsApp · BM", url: `https://wa.me/${phone}?text=${encodeURIComponent(bmDraft)}` },
    ], [{ text: "Open Google Maps", url: mapsUrl }]]
    : [[{ text: "Open Google Maps", url: mapsUrl }]];
  if (appUrl && lead.id) rows.push([{ text: "Open dashboard", url: `${appUrl.replace(/\/$/, "")}/leads/${lead.id}` }]);
  return { inline_keyboard: rows };
}

export async function sendTelegramMessage({ token, chatId, text, keyboard, fetchImpl = fetch }) {
  if (!token || token === "replace_me" || !chatId || chatId === "replace_me") throw new Error("Telegram token and chat ID are required for notifications.");
  const response = await fetchImpl(`${ENDPOINT}${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(keyboard ? { reply_markup: keyboard } : {}) }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.description || "Telegram notification failed.");
  return String(body.result.message_id);
}
