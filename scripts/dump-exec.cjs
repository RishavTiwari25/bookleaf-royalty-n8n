// Dumps the latest n8n execution + per-node results for debugging.
const sqlite3 = require('C:/Users/risha/AppData/Roaming/npm/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('C:/Users/risha/.n8n/database.sqlite', sqlite3.OPEN_READONLY);
db.all(
  "SELECT e.id, e.status, e.mode, e.startedAt, e.stoppedAt, d.data FROM execution_entity e LEFT JOIN execution_data d ON d.executionId = e.id ORDER BY e.id DESC LIMIT 1",
  (err, rows) => {
    if (err) { console.error('ERR', err.message); process.exit(1); }
    if (!rows.length) { console.log('NO EXECUTIONS'); process.exit(0); }
    const r = rows[0];
    console.log('exec', r.id, r.status, r.mode, r.startedAt, '->', r.stoppedAt);
    try {
      // execution data is a JSON string using n8n's "flattened" pointer format; print raw head
      const raw = r.data || '';
      console.log('data length:', raw.length);
      // find node names + error messages in the raw string
      const errIdx = raw.indexOf('errorMessage') >= 0 ? raw.indexOf('errorMessage') : raw.indexOf('"message"');
      for (const m of raw.matchAll(/"(Webhook — Royalty Summary|Auth & Validate|Authorized\?|Respond 401|Royalty Facts & Prompt|Duplicate\?|Respond — Duplicate|Gemini — Generate Summary|Parse AI Response|AI Failed — Fallback|Respond — Summary)"/g)) {
        console.log('node present:', m[1]);
      }
      const em = raw.match(/"message":"([^"]{0,300})"/g);
      if (em) console.log('messages:', em.slice(0, 10).join('\n'));
      const es = raw.match(/"error"[^}]{0,400}/g);
      if (es) console.log('errors:', es.slice(0, 5).join('\n---\n').slice(0, 1500));
    } catch (e) { console.error('parse fail', e.message); }
    process.exit(0);
  }
);
