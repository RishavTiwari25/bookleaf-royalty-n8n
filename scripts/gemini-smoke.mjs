// Direct Gemini smoke test using the same facts-block style the n8n workflow builds.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8').split(/\r?\n/).filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const payload = JSON.parse(readFileSync(resolve(root, 'data/payloads/' + (process.argv[2] || 'AUTH003') + '.json'), 'utf8'));

const INR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const facts = [
  `Author: ${payload.author_name} (${payload.city})`,
  'PUBLISHED BOOKS:',
  ...payload.books.filter((b) => b.status.startsWith('Published')).map((b) =>
    `- "${b.title}": ${b.copies_sold} copies sold; earned ${INR(b.royalty_earned)}; paid ${INR(b.royalty_paid)}; pending ${INR(b.royalty_pending)}; last payout ${b.last_payout_date || 'none yet'}`),
  ...(payload.books.some((b) => !b.status.startsWith('Published'))
    ? ['BOOKS IN PRODUCTION:', ...payload.books.filter((b) => !b.status.startsWith('Published')).map((b) => `- "${b.title}": ${b.status}`)]
    : []),
  'NEXT PAYOUT: pending amounts are expected by 14 November 2026 (quarterly cycle, 45-day window).',
  'NOTE: this author has earned royalties but has never received a payout yet; acknowledge this plainly.',
].join('\n');

const system = 'You write royalty summary emails from the BookLeaf author support team. Open with "Hi <first name>,". Use only the exact numbers in AUTHOR FACTS; never invent figures. Explain the quarterly payout cycle (quarters end Mar 31/Jun 30/Sep 30/Dec 31, paid within 45 days) when something is pending. Plain text, under 250 words. Finish with exactly:\nWarm regards,\nBookLeaf Author Support';

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: `AUTHOR FACTS:\n${facts}\n\nWrite the royalty summary email now.` }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  }),
});
const j = await res.json();
if (!res.ok) { console.error('HTTP', res.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
console.log('MODEL OK:', model);
console.log('---');
console.log(j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? JSON.stringify(j).slice(0, 400));
