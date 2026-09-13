"use client";

import { Check, CopySimple, PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";

export function DraftEditor({ english, bm }: { english: string; bm: string }) {
  const [language, setLanguage] = useState<"English" | "BM">("English");
  const [drafts, setDrafts] = useState({ English: english, BM: bm });
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(drafts[language]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="detail-block draft-block">
      <div className="detail-block-heading"><div><h2>Personalised draft</h2><p>Review every claim before opening WhatsApp.</p></div><div className="language-tabs" role="tablist" aria-label="Draft language"><button className={language === "English" ? "active" : ""} onClick={() => setLanguage("English")}>English</button><button className={language === "BM" ? "active" : ""} onClick={() => setLanguage("BM")}>BM</button></div></div>
      <label className="draft-field"><span><PencilSimple />Editable message</span><textarea value={drafts[language]} onChange={(event) => setDrafts({ ...drafts, [language]: event.target.value })} /></label>
      <button className="secondary-button" onClick={copy}>{copied ? <Check /> : <CopySimple />}{copied ? "Copied" : "Copy draft"}</button>
    </section>
  );
}
