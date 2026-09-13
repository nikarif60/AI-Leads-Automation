# AI Lead Finder Dashboard

Phase 1 is a responsive personal command centre for Malaysian website lead research. The home page is a modular top-down pixel office with individual furniture sprites, a waypoint-animated robot and clickable workstations. Existing lead pages, owner login, Supabase schema and the bounded Google Places scan adapter remain in place.

No scheduled scan, WhatsApp sending, or deployment is activated by default. Google discovery and Telegram alerts run only during an explicitly enabled live scan.
Before Supabase is configured, the dashboard deliberately stays in a local demo-preview mode. Once the URL, publishable key and owner UUID are set, the login gate and live read layer activate; it then shows only the signed-in owner's RLS-protected data.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run build
npm run scan:check
npm run office:check
npm run workspace:check # browser check; local server must be running on port 3001
npm run scan:dry
```

### Pixel-office Command Centre

The expanded room measures 960 × 432 native pixels and reuses the original modular art for the extra workstation, furniture and meeting area. The desktop camera fits the entire room above a three-part pixel console; phones use a wider follow camera. Zoom controls, reset, pan and pause remain available.

Niko's idle routine now rolls the research chair in, sits and types desk notes, pushes the chair out, tidies the inbox tray, collects printer paper and visits the map, Telegram console and approval desk. The chair follows the same waypoint position as Niko, with depth ordering that places his head above the chair back. Printer paper, the file tray, keyboards, phone, plants and task lighting react to the routine. These are visibly labelled office activities; they do not create leads, send messages or claim a running scan. Real running jobs use the scanning route. Pause, reduced motion and hidden-tab handling stop the animations.

The `/` route opens directly into a `100dvh` modular pixel office, not an analytics dashboard. Compact navigation overlays the scene. Worker, priority inbox and mission HUD windows replace the old heading, metrics rail and lower dashboard sections. The mission progress compares today's contacted count with today's contacted count plus the current waiting queue; it is not scan progress or a made-up daily target.

The shared `(office)` layout keeps the room and robot mounted while Leads, lead details, Pipeline, Telegram, Scan History and Settings open in one native dialog. Every existing URL still works on a direct visit or refresh. Escape, the close button or clicking the backdrop returns to `/`; browser Back/Forward follows the URL. The modal uses native focus containment and a scrollable content area on phones. Login remains outside the office layout.

The visual direction uses the same charcoal surfaces, light text and violet accents on the office HUD and every work popup, with Montserrat, restrained motion and no gradients. Shared CSS palette values keep the scene and work windows consistent. Leads use an opportunity list with expandable filters; Pipeline uses grouped stages instead of a wide dashboard board. Existing data readers and safety controls are unchanged. `workspace:check` exercises read-only popup navigation, keyboard behavior, filters, theme consistency and mobile bounds via the agent-browser CLI; set `WORKSPACE_CHECK_URL` to check another local port.

The room is assembled from separate PNG assets and layout data, not a flattened background. Niko follows collision-checked waypoints, with a cropped follow/pan camera on phones, a pause control and reduced-motion support. Clicking Niko opens his current-task popover. The map opens leads filtered by the latest scan city (or a review lead's state in preview), the inbox opens new/high-priority actionable leads, Telegram opens notification activity, and the WhatsApp desk opens Draft Ready leads. The mobile inbox toggle and station directory keep destinations accessible outside the camera crop. `/scans` remains available, with `/scan-history` as an equivalent route.

Only a live, GitHub-linked `scan_jobs` record with `status = running` enables scan animation. Demo mode is explicitly idle. A countdown needs an actual future `scheduled_for` record and enabled scans; otherwise it says not scheduled. Completed and failed states use stored job results. The page refreshes live reads every 30 seconds; after 90 seconds without fresh data it stops claiming an active scan.

The workflow now runs the bounded Google Places adapter when explicitly enabled. It writes accurate job records and lifecycle transitions; Telegram remains notification-only and no outreach is sent. Supabase/GitHub end-to-end verification still needs configured credentials and an intentionally triggered run.

See [asset prompts and implementation notes](design/office/prompts.md). The local review server uses `npm run dev -- --port 3001` when port 3000 is occupied.

## 1. Supabase

1. Create a free project at [Supabase](https://supabase.com/dashboard).
2. In Authentication, create and confirm the single owner account. Copy its user UUID into `OWNER_USER_ID`.
3. Run `supabase/migrations/20260903025601_phase_1_schema.sql` in the SQL Editor, or link the CLI and push the migration.
4. Copy the project URL and publishable key into the two `NEXT_PUBLIC_SUPABASE_*` variables in `.env.local`.
5. Store the secret key only in server environments and GitHub Actions. Never expose it with a `NEXT_PUBLIC_` prefix.
6. Keep the Data API grants from the migration. In Supabase, confirm the `public` schema is exposed in the Data API; current projects may not expose new tables automatically, and RLS alone does not grant API access.

The schema enables RLS on every public table and restricts rows to `auth.uid() = owner_id`. The server-only secret key is reserved for the scheduled job.

### Owner login

After `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `OWNER_USER_ID` are set, the dashboard requires the owner to sign in at `/login`. The proxy refreshes the session and verifies the JWT claims on every protected request; a valid non-owner account is signed out and denied access. Never expose `SUPABASE_SECRET_KEY` with a `NEXT_PUBLIC_` prefix.

Without those three values, local development deliberately remains in setup-preview mode so the interface can still be reviewed. Do not deploy in that state.

## 2. Google Places

1. Create or select a Google Cloud project.
2. Enable **Places API (New)** and attach a billing account.
3. Create a server key in **APIs & Services > Credentials**.
4. Restrict the key to Places API and, where practical, to the server or workflow that will use it.
5. Add `GOOGLE_PLACES_API_KEY` to GitHub Actions secrets only.
6. Set Google Cloud budget alerts and daily quota limits before enabling scans.

Use official Places endpoints and permitted public sources. Do not scrape Google Maps pages. Every kept lead must have a Malaysian location.

## 3. Telegram

1. Message `@BotFather` in Telegram and create a bot.
2. Save the token as the GitHub Actions secret `TELEGRAM_BOT_TOKEN`.
3. Message the bot once, then obtain your chat ID using Telegram's `getUpdates` endpoint.
4. Save the ID as `TELEGRAM_CHAT_ID`.
5. Keep the score threshold at 75 or higher and the per-scan limit at 3 to 5.

Live scans alert only newly inserted leads scoring 75 or above, up to the per-scan limit. Every alert is recorded and the database prevents a second alert for the same lead. The owner must review any `wa.me` draft and press Send manually.

## 4. GitHub Actions

The workflow is defined in `.github/workflows/lead-scan.yml`. Its cron is offset to minute 17 every five hours to avoid the busiest top-of-hour window. Scheduled workflows use UTC and run from the default branch.

Add these repository secrets:

- `OWNER_USER_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `GOOGLE_PLACES_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Add these repository variables:

- `NEXT_PUBLIC_APP_URL`
- `MAX_ALERTS_PER_SCAN=5`
- `MAX_GOOGLE_REQUESTS_PER_SCAN=5`
- `DAILY_GOOGLE_REQUEST_LIMIT=25`
- `ENABLE_LEAD_SCANS=false`

Leave `ENABLE_LEAD_SCANS` false until the GitHub secrets are configured and you explicitly want scheduled scans. Dry runs never call Google; live mode is bounded by the per-scan and daily database quota guards.

## 5. Vercel

1. Import the repository into Vercel without deploying from this workspace.
2. Add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel project.
3. Add server-only variables only when a server route genuinely needs them. The GitHub Actions job should keep the provider and Telegram secrets.
4. Set the production URL as `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL`.
5. Deploy only after the Supabase migration and owner login are ready.

Vercel Hobby hosts the dashboard. GitHub Actions owns the five-hour schedule so the owner's MacBook can remain off.

## 6. AI outreach drafts

The Outreach workspace has a manual **Generate with AI** action. It calls an OpenAI-compatible `/chat/completions` endpoint from the server, saves the selected English or BM draft to the owner-only `leads` row, and records the activity. For new priority leads, the scan workflow also generates the English draft before it sends the Telegram alert, so its **Open WhatsApp** button opens with the AI text ready to review. It never sends WhatsApp messages.

Add these server-only values when you choose a provider:

```bash
AI_PROVIDER_API_KEY=replace_me_if_needed
AI_PROVIDER_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_PROVIDER_MODEL=gemini-3.1-flash-lite
```

Keep the key out of `NEXT_PUBLIC_*` variables and out of browser code. Without a key, the workspace keeps its local fallback draft and explains what setup is missing.

For GitHub Actions, add `AI_PROVIDER_API_KEY` as a repository secret, plus `AI_PROVIDER_BASE_URL` and `AI_PROVIDER_MODEL` as repository variables. If they are absent, Telegram alerts still arrive with a safe fallback draft.

## Phase 1 safety boundary

- Demo records are clearly labeled and WhatsApp is disabled for them.
- Active scan visuals require a live GitHub-linked running job. Decorative robot movement stays explicitly Idle and never fabricates scan progress or lead counts.
- The scheduled workflow is skipped unless the repository variable is explicitly enabled.
- Dry runs never call an external API. Live scans call Google Places only after a database quota reservation succeeds.
- No code in this repository automatically sends WhatsApp outreach.
- Owner login and route protection activate as soon as the Supabase URL, publishable key and owner UUID are configured.
- Once signed in, lead status changes and settings save through owner-only RLS policies; demo-preview controls stay disabled rather than pretending to persist.
