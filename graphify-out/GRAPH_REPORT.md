# Graph Report - /Users/nikarif/Documents/Side Project/AI Leads  (2026-09-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 156 nodes · 194 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- mock-data.ts
- compilerOptions
- pipeline/page.tsx
- devDependencies
- dependencies
- package.json
- include
- [id]/page.tsx
- layout.tsx
- run-scan.mjs
- settings/page.tsx
- getSupabasePublicEnv
- eslint.config.mjs
- next.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 7 edges
3. `include` - 7 edges
4. `PageHeader()` - 6 edges
5. `leads` - 6 edges
6. `StatusBadge()` - 5 edges
7. `getSupabasePublicEnv()` - 5 edges
8. `LeadStatus` - 4 edges
9. `lib` - 4 edges
10. `selfCheck()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `createClient()` --calls--> `getSupabasePublicEnv()`  [EXTRACTED]
  src/lib/supabase/client.ts → src/lib/supabase/env.ts
- `createClient()` --calls--> `getSupabasePublicEnv()`  [EXTRACTED]
  src/lib/supabase/server.ts → src/lib/supabase/env.ts

## Import Cycles
- None detected.

## Communities (18 total, 3 thin omitted)

### Community 0 - "mock-data.ts"
Cohesion: 0.16
Nodes (12): metadata, IntegrationMap(), statusCopy, MetricCard(), labels, StatusBadge(), commandCentre, scans (+4 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 2 - "pipeline/page.tsx"
Cohesion: 0.18
Nodes (8): metadata, columns, metadata, metadata, LeadExplorer(), PageHeader(), leads, LeadStatus

### Community 3 - "devDependencies"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @types/node, @types/react, @types/react-dom (+5 more)

### Community 4 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @phosphor-icons/react, react, react-dom, @supabase/ssr, @supabase/supabase-js (+5 more)

### Community 5 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, name, private, scripts, build, dev, lint (+4 more)

### Community 6 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 8 - "layout.tsx"
Cohesion: 0.29
Nodes (4): metadata, montserrat, AppShell(), navigation

### Community 9 - "run-scan.mjs"
Cohesion: 0.38
Nodes (6): locationBatches, niches, notificationLimit(), plan, selectRotation(), selfCheck()

### Community 10 - "settings/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, niches, places, SettingsForm()

### Community 11 - "getSupabasePublicEnv"
Cohesion: 0.48
Nodes (3): createClient(), getSupabasePublicEnv(), createClient()

## Knowledge Gaps
- **64 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._