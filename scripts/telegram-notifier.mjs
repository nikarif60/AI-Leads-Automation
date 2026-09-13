const ENDPOINT = "https://api.telegram.org/bot";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

export function priorityLeadMessage(lead, appUrl = "") {
  const leadUrl = appUrl && lead.id ? `\n<a href="${escapeHtml(`${appUrl.replace(/\/$/, "")}/leads/${lead.id}`)}">Open in dashboard</a>` : "";
  return `<b>New priority lead · ${lead.score}/100</b>\n<b>${escapeHtml(lead.business_name)}</b> · ${escapeHtml(lead.city)}\n${escapeHtml(lead.opportunity_summary)}${leadUrl}`;
}

export async function sendTelegramMessage({ token, chatId, text, fetchImpl = fetch }) {
  if (!token || token === "replace_me" || !chatId || chatId === "replace_me") throw new Error("Telegram token and chat ID are required for notifications.");
  const response = await fetchImpl(`${ENDPOINT}${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.description || "Telegram notification failed.");
  return String(body.result.message_id);
}
