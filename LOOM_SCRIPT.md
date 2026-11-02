# Loom script (3–5 min) — record at https://bookleaf-royalty-57873.bubbleapps.io/version-test

1. (0:00) "This is my Assignment 2 — the Author Royalty Dashboard on Bubble with an n8n
   automation backend." Log in as priya.sharma@email.com / Author@123.
2. (0:20) Author portal: scroll My Books — point out the per-book figures (copies sold,
   earned, paid, pending, last payout), the green/yellow/red payout badge, and the
   consolidated totals. "Priya can only see her own books — privacy rules enforce this."
3. (1:00) Log out, log in as admin@bookleaf.test / Admin@123.
4. (1:15) Admin dashboard: author list with per-author stats; use the name search and
   city filter; show the Notification Log at the bottom.
5. (1:45) Open an author (e.g. Meera Nair) → "Generate & Send Royalty Summary".
   While it runs: "this POSTs the author's royalty snapshot to a secured n8n webhook —
   shared-secret header — n8n computes the facts, calls Gemini, and returns the email."
6. (2:15) Show the generated email in the log entry (status Success, source AI).
   Click the button again quickly → show the duplicate-trigger gets Ignored.
7. (2:45) Switch to the n8n tab (bookleaf-royalty-n8n.onrender.com) → open the
   workflow → show the node layout (auth → validate → facts/prompt → Gemini with retry
   + error branch → fallback → respond), then the Executions list with the run.
8. (3:30) Back in Bubble admin: "Send Summaries To All Pending" → show log filling
   author by author (front-end loop, free-plan workaround).
9. (4:00) Wrap up: "Facts are computed in code, the AI only writes prose; if the AI
   fails the deterministic fallback keeps the flow alive; duplicates are deduped
   server-side; and Bubble logs every trigger with status and source."
