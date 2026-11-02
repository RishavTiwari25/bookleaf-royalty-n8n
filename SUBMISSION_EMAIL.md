# Draft reply in the BookLeaf Gmail thread (send before 7 Nov 17:50 IST)

Subject: (reply in thread) — Assignment 2 submission — Rishav Tiwari

Hi Saloni,

Please find my Assignment 2 submission — the Author Royalty Dashboard & Automated
Notification System on Bubble + n8n:

- Live Bubble app: https://bookleaf-royalty-57873.bubbleapps.io/version-test
  - Author login: priya.sharma@email.com / Author@123 (any dataset author works, same password)
  - Admin login: admin@bookleaf.test / Admin@123
- Bubble editor (view access enabled): https://bubble.io/page?id=bookleaf-royalty-57873
- n8n instance (self-hosted, Docker on Render): https://bookleaf-royalty-n8n.onrender.com
- n8n workflow JSON export + Dockerfile + README:
  https://github.com/RishavTiwari25/bookleaf-royalty-n8n  <- make public OR attach zip before sending
- Documentation (README): same repo — schema design, Bubble↔n8n integration, prompt
  strategy, error handling, and my Bubble learning notes.
- Screen recording (3–5 min): <LOOM_URL>

Notes:
- The n8n webhook is secured with a shared-secret header; the AI summary uses
  Gemini with a deterministic fallback so the flow never breaks silently; duplicate
  triggers within 60 s are ignored server-side.
- Both services are on free tiers: the first request after idle can take ~60–90 s
  while Render wakes the n8n instance (the recording shows the warm path).
- As in Assignment 1, I used AI coding assistance during development; the
  architecture and every Bubble workflow / n8n node are mine and I'm happy to walk
  through them in the founder conversation.

Best regards,
Rishav Tiwari

## Checklist before sending
- [ ] Make GitHub repo public (or attach workflow JSON + README as files)
- [ ] Set Bubble Settings > General > Application rights: Everyone can view
- [ ] GEMINI_API_KEY set on Render (user pastes) + live test Success source=AI
- [ ] All 10 author accounts + admin registered, roles set
- [ ] Loom recorded + link filled
- [ ] Live end-to-end test: admin login -> trigger summary -> log row Success
