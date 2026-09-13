"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import assets from "../../public/office/assets.json";
import { activityLabels, chairPosition, idleRoute, officeCamera, officeObjects, robotFrame, ROOM, sampleRoute, stations, workingRoute, type OfficeActivity, type OfficeObject, type RobotPose } from "@/lib/office-world";
import type { OfficeSnapshot } from "@/lib/office-state";
import type { ScanState } from "@/lib/types";

function OfficeObjectSprite({ object, location }: { object: OfficeObject; location: string }) {
  const asset = assets[object.asset as keyof typeof assets];
  const station = stations.find((station) => station.id === object.station);
  const style = { left: object.x, top: object.y, width: asset.width * (object.scale ?? 1), height: asset.height * (object.scale ?? 1), zIndex: 100 + object.depth * 10 };
  const sprite = <Image src={`/office/${object.asset}.png`} alt="" width={asset.width} height={asset.height} unoptimized draggable={false} />;
  return station ? <Link href={station.id === "map" ? `/leads?location=${encodeURIComponent(location)}` : station.href} className={`office-object object-${object.id}`} style={style} aria-label={`${station.name}: ${station.description}`} title={station.description} data-object={object.id}>{sprite}</Link> : <div className={`office-object object-${object.id}`} style={style} data-object={object.id} aria-hidden="true">{sprite}</div>;
}

export function OfficeScene({ state, job, location, task, taskDetail, onActivityChange }: { state: ScanState; job: OfficeSnapshot["job"]; location: string; task: string; taskDetail: string; onActivityChange: (activity: string) => void }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);
  const [follow, setFollow] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const activityRef = useRef<HTMLSpanElement>(null);
  const lastActivity = useRef("");
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const camera = useRef({ left: 0, top: 0, scale: 2 });
  const motion = useRef({ key: "", elapsed: 0, celebrate: false });

  useEffect(() => {
    const viewport = viewportRef.current, world = worldRef.current, robot = robotRef.current;
    if (!viewport || !world || !robot) return;
    const sprite = robot.firstElementChild as HTMLSpanElement;
    const chair = world.querySelector<HTMLElement>(".object-research-chair");
    const tray = world.querySelector<HTMLElement>(".object-inbox-tray");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionKey = `${job?.id ?? "preview"}:${state}`;
    if (motion.current.key !== motionKey) {
      motion.current = { key: motionKey, elapsed: 0, celebrate: false };
      if (state === "completed_with_leads" && job?.completed_at && Date.now() - Date.parse(job.completed_at) < 180000) {
        try {
          const key = `office-completion:${job.id}`;
          motion.current.celebrate = !sessionStorage.getItem(key);
          sessionStorage.setItem(key, "seen");
        } catch { /* A private browser can still show the static completed result. */ }
      }
    }
    let raf = 0, elapsed = motion.current.elapsed, last = 0, width = viewport.clientWidth, height = viewport.clientHeight;
    const celebrate = motion.current.celebrate;
    function render(time: number) {
      if (!viewport || !world || !robot) return;
      const still = paused || popoverOpen || reduced.matches;
      if (last && !document.hidden && !still) elapsed += Math.min(time - last, 80);
      motion.current.elapsed = elapsed;
      last = time;
      world.dataset.delivering = "false";
      let point = { x: 445, y: 235, pose: "idle" as RobotPose, activity: "idle" as OfficeActivity, progress: 0 };
      if (state === "failed") point.pose = "failed";
      else if (state === "completed_with_leads") {
        const progress = celebrate && !reduced.matches ? Math.min(elapsed / 2300, 1) : 1;
        point = { x: Math.round(381 + 118 * progress), y: Math.round(251 - 11 * progress), pose: progress < 1 ? "carrying" : "complete", activity: "idle", progress };
        world.dataset.delivering = String(celebrate && !still && elapsed > 2000 && elapsed < 3000);
      } else if (state === "running") point = sampleRoute(workingRoute, elapsed);
      else if (state === "idle") point = sampleRoute(idleRoute, elapsed);
      const seat = chairPosition(point);
      if (chair) {
        chair.style.transform = `translate(${seat.x - 365}px, ${seat.y - 209}px)`;
        chair.style.zIndex = String(seat.seated ? 102 + point.y * 10 : 2460);
      }
      if (tray) tray.style.transform = `translateY(${point.activity === "files" ? Math.round(Math.sin(point.progress * Math.PI) * 5) : 0}px)`;
      world.dataset.activity = point.activity;
      robot.dataset.seated = String(seat.seated);
      const activity = state === "running" && point.activity === "desk-work" ? "Working on the live scan" : state === "failed" ? "Waiting for your attention" : state.startsWith("completed") ? "Scan finished" : activityLabels[point.activity];
      if (lastActivity.current !== activity) {
        lastActivity.current = activity;
        onActivityChange(activity);
        if (activityRef.current) activityRef.current.textContent = activity;
      }
      robot.style.transform = `translate(${point.x - 16}px, ${point.y - (seat.seated ? 52 : 40)}px)`;
      robot.style.zIndex = String(100 + point.y * 10);
      robot.dataset.pose = point.pose;
      const frame = robotFrame(point.pose, reduced.matches ? 0 : elapsed);
      sprite.style.backgroundPosition = `${-frame.column * 32}px ${-frame.row * 40}px`;
      const nextCamera = officeCamera(width, height, point, zoom);
      if (follow || width >= 900 || camera.current.scale !== nextCamera.scale) camera.current = nextCamera;
      const { left, top, scale } = camera.current;
      world.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
      world.dataset.still = String(still);
      if (!document.hidden && !still) raf = requestAnimationFrame(render);
    }
    const restart = () => { cancelAnimationFrame(raf); last = 0; render(performance.now()); };
    const resize = new ResizeObserver(() => { width = viewport.clientWidth; height = viewport.clientHeight; restart(); });
    resize.observe(viewport);
    document.addEventListener("visibilitychange", restart);
    reduced.addEventListener("change", restart);
    restart();
    return () => { cancelAnimationFrame(raf); resize.disconnect(); document.removeEventListener("visibilitychange", restart); reduced.removeEventListener("change", restart); };
  }, [state, job?.id, job?.completed_at, paused, follow, zoom, popoverOpen, onActivityChange]);

  return (
    <section className="office-scene" aria-label="Interactive pixel office">
      <div className="office-scene-toolbar"><div><button onClick={() => setZoom(Math.max(.6, +(zoom - .2).toFixed(1)))} disabled={zoom <= .6} aria-label="Zoom out office">−</button><button onClick={() => { setZoom(1); setFollow(true); }} aria-label="Reset office camera">ROOM 01</button><button onClick={() => setZoom(Math.min(1.6, +(zoom + .2).toFixed(1)))} disabled={zoom >= 1.6} aria-label="Zoom in office">+</button><button onClick={() => setFollow(!follow)} className="office-camera-button" aria-pressed={follow}>{follow ? "Follow" : "Pan"}</button><button onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Resume office animation" : "Pause office animation"}>{paused ? "Play" : "Pause"}<span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span></button></div></div>
      <div className="office-viewport" ref={viewportRef}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch" || (event.target as HTMLElement).closest("a,button")) return;
          setFollow(false);
          drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: camera.current.left, top: camera.current.top };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = drag.current, viewport = viewportRef.current, world = worldRef.current;
          if (!start || !viewport || !world) return;
          const { scale } = camera.current;
          const left = ROOM.width * scale <= viewport.clientWidth ? (viewport.clientWidth - ROOM.width * scale) / 2 : Math.max(viewport.clientWidth - ROOM.width * scale, Math.min(0, start.left + event.clientX - start.x));
          const top = ROOM.height * scale <= viewport.clientHeight ? 0 : Math.max(viewport.clientHeight - ROOM.height * scale, Math.min(0, start.top + event.clientY - start.y));
          camera.current = { left, top, scale };
          world.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
        }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <div className="office-world" ref={worldRef} data-state={state} style={{ width: ROOM.width, height: ROOM.height }}>
          <div className="office-floor" aria-hidden="true" />
          <div className="office-wall office-wall-north" aria-hidden="true" />
          <div className="office-wall-west" aria-hidden="true" />
          <div className="office-wall-east" aria-hidden="true" />
          <div className="office-wall-south" aria-hidden="true" />
          {officeObjects.map((object) => <OfficeObjectSprite object={object} location={location} key={object.id} />)}
          <button ref={robotRef} className="office-robot" popoverTarget="niko-task" aria-haspopup="dialog" aria-label="Niko the robot: open current task"><span /><b className="robot-name">NIKO</b></button>
          <div className="office-effects" aria-hidden="true" style={{ transform: "translate(80px, 16px)" }}>
            <span className="office-effect effect-terminal" /><span className="office-effect effect-telegram" />
            <span className="office-effect effect-map-pin pin-one" /><span className="office-effect effect-map-pin pin-two" />
            <span className="office-effect effect-map-beam" /><span className="office-effect effect-inbox" />
            <span className="office-effect effect-warning" /><span className="office-effect effect-printout" />
          </div>
          {stations.map((station) => <Link key={station.id} href={station.id === "map" ? `/leads?location=${encodeURIComponent(location)}` : station.href} aria-label={station.name} className={`office-station-tag tag-${station.id}`} style={{ left: station.x, top: station.y }}><b>{station.number}</b><span>{station.name}</span><span className="station-open" aria-hidden="true">↗</span></Link>)}
        </div>
        <noscript><p className="office-static-note">Static office view. Use the station links below to navigate.</p></noscript>
      </div>
      <div id="niko-task" className="pixel-window robot-popover" popover="auto" role="dialog" aria-label="Niko's current task" onToggle={(event) => setPopoverOpen(event.newState === "open")}><header><h2>NIKO / AI WORKER</h2><button popoverTarget="niko-task" popoverTargetAction="hide" aria-label="Close robot status">×</button></header><strong>{task}</strong><p>{taskDetail}</p><p className="robot-routine"><small>{state === "running" ? "LIVE JOB" : "OFFICE ROUTINE"}</small><span ref={activityRef}>Settling in at the desk</span></p><Link href="/scans">View scan history ↗</Link></div>
      <details className="office-station-directory"><summary>Stations ↗</summary><nav aria-label="Office stations">{stations.map((station) => <Link key={station.id} href={station.id === "map" ? `/leads?location=${encodeURIComponent(location)}` : station.href}><span>{station.number}</span>{station.name}<b aria-hidden="true">↗</b></Link>)}</nav></details>
    </section>
  );
}
