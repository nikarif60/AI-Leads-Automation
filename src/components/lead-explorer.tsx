"use client";

import { ArrowUpRight, FunnelSimple, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Lead } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { leadStatusFilters, matchesLeadFilters, type LeadFilters } from "@/lib/lead-filters";

const all = "All";

export function LeadExplorer({ leads, initialFilters, mode }: { leads: Lead[]; initialFilters: LeadFilters; mode: "demo" | "live" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialFilters.status);
  const [niche, setNiche] = useState(all);
  const [location, setLocation] = useState(initialFilters.location);
  const [score, setScore] = useState(initialFilters.score);
  const filtered = useMemo(() => leads.filter((lead) => {
    const matchesQuery = `${lead.company} ${lead.city} ${lead.niche}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (niche === all || lead.niche === niche) && matchesLeadFilters(lead, { status, location, score });
  }).sort((a, b) => b.score - a.score), [leads, location, niche, query, score, status]);
  const activeFilters = [status, niche, location, score].filter((value) => value !== all).length;
  const reset = () => { setQuery(""); setStatus(all); setNiche(all); setLocation(all); setScore(all); };

  return (
    <section aria-label="Lead library">
      <div className="lead-library-bar">
        <label className="search-field"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Search leads</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a company, city or niche" /></label>
        <span>{filtered.length} of {leads.length} {mode === "demo" ? "sample " : ""}leads · Highest fit first</span>
      </div>
      <details className="library-filters" open={Object.values(initialFilters).some((value) => value !== all)}>
        <summary><FunnelSimple />Refine your list {activeFilters > 0 && <span>· {activeFilters} active</span>}</summary>
        <div className="library-filter-fields">
          <label><span>Score</span><select value={score} onChange={(event) => setScore(event.target.value)}><option>All</option><option>80+</option><option>60-79</option><option>Below 60</option></select></label>
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{leadStatusFilters.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Niche</span><select value={niche} onChange={(event) => setNiche(event.target.value)}><option>All</option>{[...new Set(leads.map((lead) => lead.niche))].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>All</option>{[...new Set([initialFilters.location, ...leads.flatMap((lead) => [lead.state, lead.city])])].filter((value) => value !== all).map((value) => <option key={value}>{value}</option>)}</select></label>
          <button className="text-button" onClick={reset}><X />Reset</button>
        </div>
      </details>
      <div className="lead-library">
        {filtered.length ? filtered.map((lead) => <Link className="opportunity-row" key={lead.id} href={`/leads/${lead.id}`} scroll={false}>
          <span className="company-monogram" aria-hidden="true">{lead.company.slice(0, 1)}</span>
          <div className="opportunity-main"><header><h2>{lead.company}</h2><StatusBadge status={lead.status} /></header><p>{lead.opportunity}</p><footer><MapPin aria-hidden="true" />{lead.city}<span aria-hidden="true">·</span>{lead.niche}</footer></div>
          <div className="opportunity-rank"><div aria-label={`Fit score ${lead.score} out of 100`}><strong>{lead.score}</strong><small>/ 100</small></div><StatusBadge status={lead.websiteStatus} /></div>
          <ArrowUpRight aria-hidden="true" />
        </Link>) : <div className="empty-state"><MagnifyingGlass /><h2>No leads match this view</h2><p>Try a different search or clear your filters.</p><button className="secondary-button" onClick={reset}>Clear filters</button></div>}
      </div>
    </section>
  );
}
