"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OfficeScene } from "@/components/office-scene";
import { countdown, officeStatus, timeAgo, type OfficeSnapshot } from "@/lib/office-state";
import type { Lead } from "@/lib/types";

export function CommandCentre({ snapshot, reviewLeads }: { snapshot: OfficeSnapshot; reviewLeads: Lead[] }) {
  const [now, setNow] = useState(snapshot.fetchedAt);
  const [hudVisible, setHudVisible] = useState(true);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [routine, setRoutine] = useState("Rolling the chair to the desk");
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    const refresh = () => { if (!document.hidden && snapshot.mode === "live") router.refresh(); };
    const poll = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); clearInterval(poll); document.removeEventListener("visibilitychange", refresh); };
  }, [router, snapshot.mode]);
  const status = officeStatus(snapshot, now);
  const job = snapshot.job;
  const demo = snapshot.mode === "demo";
  const priorityLeads = reviewLeads.filter((lead) => lead.score >= 80).slice(0, 3);
  const location = job?.cities[0] || reviewLeads[0]?.state || "Kuala Lumpur";
  const { found, approval, contacted, replied } = snapshot.metrics;
  const next = countdown(snapshot.scansEnabled ? snapshot.nextScanAt : null, now);
  const stateLabel = status.state === "running" ? "Scanning" : status.state === "failed" ? "Needs attention" : status.state.startsWith("completed") ? "Completed" : status.title === "Status unavailable" ? "Unavailable" : "Idle";
  return (
    <div className="command-centre game-office" data-hud={hudVisible} data-state={status.state}>
      <h1 className="sr-only">Pixel Office Command Centre</h1>
      <OfficeScene state={status.state} job={job} location={location} task={status.title} taskDetail={status.detail} onActivityChange={setRoutine} />
      <div className="office-hud-controls">
        <span className="office-mode"><i aria-hidden="true" />{demo ? "DEMO OFFICE" : "MALAYSIA HQ"} <span> / </span> {stateLabel.toUpperCase()}</span>
        <button onClick={() => setHudVisible(!hudVisible)} aria-pressed={hudVisible}>{hudVisible ? "Hide HUD" : "Show HUD"}</button>
        <button className="office-inbox-toggle" onClick={() => { setInboxOpen(!inboxOpen); setHudVisible(true); }} aria-expanded={inboxOpen} aria-controls="priority-inbox">Inbox <b>{priorityLeads.length}</b></button>
      </div>
      <div className="office-hud-dock" hidden={!hudVisible}>
      <aside className="pixel-window worker-hud" aria-label="AI worker status">
        <header><h2>01 / AI WORKER</h2><span>NIKO</span></header>
        <div className="worker-character" aria-hidden="true"><span /></div>
        <div className="worker-readout" role="status" aria-live="polite"><i aria-hidden="true" /><strong>{stateLabel}</strong><span>NIKO / AI-01</span></div>
        <p className="worker-task">{status.title}</p>
        <dl className="worker-timing">
          <div><dt>Last scan</dt><dd>{timeAgo(snapshot.lastScanAt, now)}</dd></div>
          <div><dt>Next scan</dt><dd>{next.replace("next scan ", "")}</dd></div>
        </dl>
        <div className="worker-terminal" aria-label="Worker terminal">
          <p className="routine-label">{status.state === "running" ? "LIVE JOB" : "OFFICE ROUTINE · NO ACTIVE SCAN"}</p>
          <p><span>&gt;</span> {routine}<i className="terminal-cursor" aria-hidden="true" /></p>
        </div>
        <Link className="hud-text-link" href="/scans">Open scan log <span aria-hidden="true">↗</span></Link>
      </aside>
      <aside id="priority-inbox" className="pixel-window inbox-hud" data-open={inboxOpen} aria-label="Priority inbox">
        <header><h2>03 / PRIORITY INBOX</h2><span>{String(priorityLeads.length).padStart(2, "0")}</span><button className="inbox-close" aria-label="Close priority inbox" onClick={() => setInboxOpen(false)}>×</button></header>
        <p className="inbox-caption">{demo ? "SAMPLE LEADS" : "READY TO REVIEW"} <span>SCORE 80+</span></p>
        {priorityLeads.map((lead) => <Link className="hud-lead" href={`/leads/${lead.id}`} key={lead.id}><span className="hud-score">{lead.score}</span><span><strong>{lead.company}</strong><small title={lead.reason}>{lead.reason}</small></span><span className="hud-lead-arrow" aria-hidden="true">↗</span></Link>)}
        {!priorityLeads.length && <p className="inbox-empty">All clear. High-priority leads will land here.</p>}
        <Link className="hud-button" href="/leads?status=Awaiting%20approach&score=80%2B">View Leads <span aria-hidden="true">↗</span></Link>
      </aside>
      <section className="pixel-window mission-hud" aria-label="Today's mission">
        <header><h2>02 / TODAY&apos;S MISSION</h2><span>{demo ? "SAMPLE DATA" : "MY TIME"}</span></header>
        <div className="mission-body">
          <div className="mission-counts"><div><strong>{String(found).padStart(2, "0")}</strong><span>Leads found</span></div><div><strong>{String(approval).padStart(2, "0")}</strong><span>To approach</span></div><div><strong>{String(contacted).padStart(2, "0")}</strong><span>Contacted</span></div><div><strong>{String(replied).padStart(2, "0")}</strong><span>Replied</span></div></div>
          <div className="mission-progress"><div><span>APPROACH QUEUE</span><span>{contacted} contacted today · {approval} waiting</span></div><progress value={contacted} max={Math.max(1, contacted + approval)} aria-label="Contacted today compared with contacted today plus leads currently awaiting approach" /></div>
        </div>
      </section>
      </div>
      <p className="office-play-hint">YOUR OFFICE, AT A GLANCE <span>·</span> Select a station to open its workspace</p>
    </div>
  );
}
