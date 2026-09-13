"use client";

import { Broadcast, GearSix, House, Kanban, MagnifyingGlass, PaperPlaneTilt, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";

const navigation = [
  { href: "/", label: "Office", shortLabel: "Home", icon: House },
  { href: "/leads", label: "Leads", shortLabel: "Leads", icon: MagnifyingGlass },
  { href: "/pipeline", label: "Pipeline", shortLabel: "Pipeline", icon: Kanban },
  { href: "/telegram", label: "Telegram", shortLabel: "Telegram", icon: PaperPlaneTilt },
  { href: "/scans", label: "Scan History", shortLabel: "Scans", icon: Broadcast },
  { href: "/settings", label: "Settings", shortLabel: "More", icon: GearSix },
];

export function BrandLockup() {
  return <span className="brand-lockup"><Image src="/nykstack-icon.webp" alt="" width={64} height={64} priority /><strong>NykStack</strong></span>;
}

export function AppShell({ children, office }: { children: ReactNode; office: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const isHome = pathname === "/";
  const active = (href: string) => href === "/" ? isHome : pathname.startsWith(href) || (href === "/scans" && pathname === "/scan-history");
  const current = navigation.find(({ href }) => href !== "/" && active(href));
  const close = () => router.push("/", { scroll: false });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!isHome && !dialog.matches(":modal")) {
      lastTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      // Enhance the SSR-visible window to a native modal after hydration.
      if (dialog.open) dialog.close();
      dialog.showModal();
    } else if (isHome) {
      dialog.close();
      if (lastTrigger.current?.isConnected) lastTrigger.current.focus({ preventScroll: true });
    }
  }, [isHome]);

  useEffect(() => {
    dialogRef.current?.querySelector(".workspace-content")?.scrollTo({ top: 0 });
    dialogRef.current?.querySelector(".workspace-tabs [aria-current]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <div className="app-shell office-shell modern-office">
      <header className="office-topbar">
        <Link href="/" aria-label="NykStack Lead Finder home"><BrandLockup /></Link>
        <nav aria-label="Office navigation">{navigation.map(({ href, label }) => <Link key={href} href={href} scroll={false} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}</nav>
        <details className="office-menu"><summary aria-label="Open workspace menu"><span>N</span></summary><div>{navigation.map(({ href, label }) => <Link key={href} href={href} scroll={false}>{label}</Link>)}<form action={signOut}><button type="submit">Sign out</button></form></div></details>
      </header>
      <main className="page-frame">{office}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.filter(({ href }) => href !== "/scans").map(({ href, shortLabel, icon: Icon }) => <Link key={href} href={href} scroll={false} className={active(href) ? "active" : ""}><Icon weight={active(href) ? "fill" : "regular"} /><span>{shortLabel}</span></Link>)}</nav>
      <dialog ref={dialogRef} data-active={!isHome} className="workspace-modal" aria-label={pathname.startsWith("/leads/") ? "Lead details workspace" : `${current?.label || "Office"} workspace`} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
        <header className="workspace-windowbar"><span className="workspace-brand"><Image src="/nykstack-icon.webp" alt="" width={22} height={22} />Workspace</span><span className="workspace-window-hint">Your office is right behind you</span><button className="workspace-close" onClick={close} aria-label="Close workspace and return to office"><X size={19} /><kbd>esc</kbd></button></header>
        <nav className="workspace-tabs" aria-label="Workspace pages">{navigation.filter(({ href }) => href !== "/").map(({ href, label, icon: Icon }) => <Link key={href} href={href} scroll={false} aria-current={active(href) ? "page" : undefined}><Icon size={17} /><span>{label}</span></Link>)}</nav>
        <div className="workspace-content">{!isHome && children}</div>
      </dialog>
    </div>
  );
}
