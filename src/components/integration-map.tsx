import { Database, GoogleLogo, Robot, TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import type { ScanState } from "@/lib/types";

const statusCopy: Record<ScanState, string> = {
  idle: "Ready for the next scheduled scan",
  running: "Live scan running",
  completed_with_leads: "Qualified leads found",
  completed_no_leads: "Scan complete. No strong leads",
  failed: "Scan needs attention",
};

export function IntegrationMap({ status }: { status: ScanState }) {
  return (
    <section className="integration-panel" data-scan-state={status} aria-labelledby="integration-title">
      <header className="integration-heading">
        <div><h2 id="integration-title">How your lead system connects</h2><p>Idle animation shows the configured route. It does not mean a scan is running.</p></div>
        <span className={`scan-state state-${status}`}><i aria-hidden="true" />{statusCopy[status]}</span>
      </header>
      <div className="integration-map">
        <div className="integration-node node-google"><span><GoogleLogo weight="bold" /></span><div><small>Source</small><strong>Google Places</strong><p>Malaysian business data</p></div></div>
        <div className="flow-line flow-google-ai" aria-hidden="true"><i /><i /><i /></div>
        <div className="integration-node node-ai"><span><Robot weight="bold" /></span><div><small>Research</small><strong>NykStack AI</strong><p>Checks, scores and drafts</p></div></div>
        <div className="flow-line flow-ai-leads" aria-hidden="true"><i /><i /></div>
        <div className="integration-node node-leads"><span><Database weight="bold" /></span><div><small>Saved</small><strong>Qualified leads</strong><p>Deduplicated in Supabase</p></div></div>
        <div className="flow-line flow-leads-telegram" aria-hidden="true"><i /><i /></div>
        <div className="integration-node node-telegram"><span><TelegramLogo weight="bold" /></span><div><small>Review</small><strong>Telegram</strong><p>Manual outreach alert</p></div></div>
      </div>
    </section>
  );
}
