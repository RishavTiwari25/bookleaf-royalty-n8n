# Assignment 2 build plan (internal)

Deadline: 7 Nov 2026 ~17:50 IST (5 days from 2 Nov email).

## Architecture
- Bubble (free plan) = app platform: DB, auth, author + admin portals, privacy rules.
- n8n = automation backend. Self-hosted: local for dev (`n8n`), deployed on Render
  (Docker, free tier) for the live submission → stable public webhook URL.
- AI = Gemini `gemini-3.5-flash-lite` (same key as Assignment 1), called from n8n
  via HTTP Request node; deterministic fallback email if AI fails.
- Bubble → n8n: API Connector POST, `x-bookleaf-secret` header, full author payload
  in the body (free plan has no Data API, so payload-in-webhook — justify in README).
- n8n → Bubble "callback": synchronous Respond-to-Webhook JSON; the same Bubble
  workflow writes the NotificationLog entry from the response (free plan has no
  backend workflows for async callbacks — justify in README).

## Bubble data types
- User (built-in) + `role` (Option set: Author, Admin) + `author` (Author).
  On signup, link User→Author by matching email.
- Author: author_id, name, email, phone, city, joined_date, slug? (10 rows)
- Book: book_id, title, isbn, genre, publication_date (date), status (text),
  mrp, royalty_per_copy, copies_sold, royalty_earned, royalty_paid,
  royalty_pending (numbers), last_payout_date (date), print_partner,
  available_on (text), author (Author). (18 rows)
- NotificationLog: author (Author), status (Success/Failed/Ignored), email_subject,
  email_body (long text), source (AI/FALLBACK), model, note, triggered_by (User).

## Data seeding
- CSVs ready in `data/authors.csv` + `data/books.csv` (upload in Data tab; if CSV
  upload is paid-only, enter via automated browser on a seed page / App Data "New entry").
- Author logins: register each author via the app signup page (Author@123),
  auto-link to Author record by email. Admin: admin@bookleaf.test / Admin@123,
  set role=Admin in App Data.

## Pages
1. index — login (+ signup for seeding), redirect by role.
2. author_dashboard — My Books RG (title/isbn/genre/status/pub date/MRP/platforms),
   per-book royalty block (sold, earned, paid, pending, last payout) + G/Y/R badge,
   consolidated totals.
3. admin_dashboard — authors RG with stats (books count, earned, pending);
   filters: city dropdown, payout status dropdown (fully paid/pending/overdue),
   name search; Bulk trigger button; NotificationLog RG.
4. admin_author — selected author detail (books + figures + payout info),
   "Generate & Send Royalty Summary" button, per-author log.

## Badge rule (both apps)
- NA: not published. GREEN: pending == 0. RED: pending > 0 AND (last payout > 90 days
  ago OR never paid AND published > 90 days ago). YELLOW: otherwise.

## Free-plan workarounds (document all of these)
- Bulk trigger loop: custom state list of eligible authors + index, "Do every 2 seconds
  when bulk_running" workflow fires the same single-author API call per index step.
- Idempotency: disable button while last call for that author < 60s (Bubble) AND
  n8n staticData dedupe (60s window).
- Error handling: API Connector error → "unhandled error" event → NotificationLog
  status=Failed + alert; n8n 401/timeout surfaces here too.

## Submission checklist
- [ ] Bubble app live URL + author + admin test logins
- [ ] Editor access: Settings → General → "Everyone can view" (free plan has no
      collaborators) + note in email; add collaborator email if they provide one & plan allows
- [ ] n8n workflow JSON export (this repo, workflow/) in submission
- [ ] Render n8n live + GEMINI_API_KEY + BOOKLEAF_WEBHOOK_SECRET env set
- [ ] README: schema + why, integration diagram, prompt strategy, error handling,
      learning-process narrative (Bubble new), AI-tools disclosure like Assignment 1
- [ ] 3–5 min screen recording: author portal → admin portal → trigger summary →
      n8n execution view
- [ ] Reply in Gmail thread before 7 Nov 17:50 IST
