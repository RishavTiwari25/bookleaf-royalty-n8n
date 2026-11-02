# BookLeaf — Author Royalty Dashboard & Automated Notification System

**Assignment 2 of 2 — Full-Stack Developer position**
Stack: **Bubble.io** (app platform) + **n8n** (automation backend) + **Gemini** (AI summaries)

- Bubble app (live): `<BUBBLE_APP_URL>` — test logins below
- Bubble editor: `<BUBBLE_EDITOR_URL>` (view access enabled)
- n8n instance: `<N8N_URL>` (self-hosted on Render, Docker)
- n8n workflow export: [`workflow/bookleaf-royalty-summary.json`](workflow/bookleaf-royalty-summary.json)
- Screen recording: `<LOOM_URL>`

**Test logins**
| Role | Email | Password |
|---|---|---|
| Author | priya.sharma@email.com | Author@123 |
| Admin | admin@bookleaf.test | Admin@123 |

---

## 1. Architecture overview

```
 Bubble app (UI, DB, auth, privacy rules)
   │  admin clicks "Generate & Send Royalty Summary"
   │  POST /webhook/royalty-summary
   │  headers: x-bookleaf-secret            body: author + books payload (JSON)
   ▼
 n8n (self-hosted, Docker on Render)
   1. Webhook  → 2. Auth & Validate → 3. Royalty Facts & Prompt (+60s dedupe)
   → 4. Gemini generateContent (retry ×2, error branch)
   → 5a. Parse AI response ─┐
   → 5b. Fallback email  ───┤→ 6. Respond to Webhook (JSON)
   ▼
 Bubble workflow (same action's result)
   → creates NotificationLog entry (Success / Failed, source AI/FALLBACK, body, timestamp)
   → shows the generated email to the admin
```

### Why payload-in-webhook rather than the Bubble Data API
The brief allows either. I send the author's complete royalty data in the webhook body because:
1. **Plan constraints** — the Bubble Data API and backend (API) workflows are paid-plan
   features; the assignment states the free plan is sufficient, so the integration is
   designed to work fully within it.
2. **Fewer round-trips and one source of truth** — the Bubble workflow that triggers the
   webhook already has the author and their books in scope; shipping that snapshot avoids
   a second authenticated API hop, a second failure mode, and any admin-key exposure of
   the whole database to n8n. n8n only ever sees the one author being summarised.
3. **Trade-off acknowledged** — on a paid plan with many books per author, I would switch
   to sending only `author_id` and have n8n query the Data API (payload size and staleness
   stop being theoretical). The n8n workflow is structured so only the first two nodes
   would change.

### Why a synchronous response rather than an async callback
n8n finishes in a few seconds (one Gemini call), so the workflow responds synchronously
via a **Respond to Webhook** node; the Bubble action that made the call writes the
NotificationLog row from the response in the same workflow. An async callback into Bubble
would require a backend workflow endpoint (paid plan). The status-update step of the brief
is still fully satisfied: every trigger ends as a logged Success / Failed / Ignored row
with a timestamp, and failures (401, timeout, n8n down) are caught by Bubble's error
event and logged as Failed.

## 2. Bubble database schema

*(final schema with screenshots in the submission; summary:)*

- **User** (built-in auth) — `role` (Option set: Author / Admin), `author` (→ Author).
  On signup the account auto-links to the Author record with the same email.
- **Author** — author_id, name, email, phone, city, joined_date. 10 records.
- **Book** — book_id, title, isbn, genre, publication_date, status, mrp,
  royalty_per_copy, copies_sold, royalty_earned, royalty_paid, royalty_pending,
  last_payout_date, print_partner, available_on, **author (→ Author)**. 18 records.
- **NotificationLog** — author (→ Author), status (Success/Failed/Ignored), email_subject,
  email_body, source (AI/FALLBACK), model, note, triggered_by (→ User), created date.

Royalty aggregates live on **Book** (mirroring the dataset, which carries per-book
cumulative figures rather than individual payout transactions). A separate
`RoyaltyPayment` ledger would be the right call the day BookLeaf records individual
payouts; for this dataset it would mean inventing transaction rows that don't exist.

**Privacy rules:** Authors see only Books/Author records whose email matches theirs;
Admins see everything; NotificationLog is admin-only. Verified by logging in as two
different authors.

**Royalty status badge** (same rule in Bubble conditionals and in n8n):
- **Green** — pending = 0.
- **Yellow** — pending > 0, within the normal cycle.
- **Red** — pending > 0 and (last payout > 90 days ago, or no payout ever and published
  > 90 days ago).
- Books in production show a neutral "—" (no royalty data yet).

## 3. The n8n workflow

`workflow/bookleaf-royalty-summary.json` — import directly, or see the live instance.

| Node | Purpose |
|---|---|
| Webhook | `POST /webhook/royalty-summary`, responds via Respond node |
| Auth & Validate | Compares `x-bookleaf-secret` header to env secret; validates payload shape → 401 JSON on failure |
| Royalty Facts & Prompt | Normalises numbers, computes badges, totals, **next payout date from the KB's quarterly cycle + 45-day window**, ₹1,000 minimum-payout rollover, never-paid and in-production flags; builds the AI prompt **and a deterministic fallback email**; 60-second per-author dedupe via workflow static data |
| Gemini — Generate Summary | `generateContent` on `gemini-3.5-flash-lite`, 30 s timeout, retry ×2, error branch (never crashes the run) |
| Parse AI Response | Extracts the email; empty/malformed output falls back to the template |
| AI Failed — Fallback | Serves the deterministic email with `note` explaining the AI error |
| Respond — Summary | JSON: status, subject, body, source (AI/FALLBACK), model, generated_at |

### Prompt strategy
Same philosophy as my Assignment 1 submission:
- **Facts-grounded** — n8n computes every number, date and badge *in code* and hands the
  model a `AUTHOR FACTS` block; the prompt forbids inventing figures. The model writes
  prose, never arithmetic. The expected payout date is computed from the KB rule
  (quarters end Mar 31 / Jun 30 / Sep 30 / Dec 31, paid within 45 days), not guessed.
- **KB-grounded** — the system prompt embeds the Assignment 1 Knowledge Base royalty
  section and tone rules (empathetic, specific, own faults plainly, clear next step).
- **Edge cases prompted explicitly** — never-paid authors get an honest acknowledgement;
  sub-₹1,000 balances get the rollover explanation; in-production books get a brief
  status update; fully-paid authors get a positive acknowledgement.
- **Cheap** — one call per author, ~1k input tokens, `temperature 0.3`,
  `maxOutputTokens 1024`; ~$0.0004 per summary at Haiku/Flash-class pricing.

### Error handling
- **n8n:** AI failure → retry ×2 → error branch → fallback email + `note` (run never
  breaks silently; execution log shows the red node). Invalid/missing secret → 401.
  Malformed payload → 401 with field errors. Duplicate trigger within 60 s → `Ignored`.
- **Bubble:** the trigger button shows a loading state; API errors (timeout, 401, n8n
  cold start) hit the workflow's error event → NotificationLog row with status
  **Failed** + alert to the admin. No infinite spinners.
- **Idempotency:** double-click protection in Bubble *and* server-side 60 s dedupe in
  n8n (workflow static data), so even two racing clients produce one summary.

## 4. Deployment

- n8n self-hosted with Docker on Render (`Dockerfile` + `render.yaml`): the container
  imports and activates the workflow JSON on every boot, so the ephemeral free-tier
  filesystem is harmless; secrets (`GEMINI_API_KEY`, `BOOKLEAF_WEBHOOK_SECRET`) are env
  vars. Note: the free instance sleeps when idle; the first trigger after a quiet period
  takes ~60–90 s to wake (Bubble surfaces this as a Failed log row; retrying succeeds —
  the screen recording shows the warm path).
- Bubble app on Bubble's free hosting (`version-test`).

## 5. Learning process (Bubble was new to me)

*(filled in with the honest build notes — what I tried, what didn't work, workarounds:
bulk trigger loop on the free plan, CSV import quirks, privacy-rule testing, etc.)*

## 6. AI tools disclosure

As in Assignment 1, I used AI coding assistance during development; the architecture,
Bubble workflows and n8n design decisions are mine and I can walk through every node
and workflow in detail.
