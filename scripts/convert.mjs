// Converts bookleaf_sample_data.json into Bubble-importable CSVs + per-author n8n test payloads.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = process.argv[2];
if (!src) { console.error('usage: node convert.mjs <path-to-bookleaf_sample_data.json>'); process.exit(1); }
const data = JSON.parse(readFileSync(resolve(src), 'utf8'));

const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const row = (arr) => arr.map(esc).join(',');

const authorCols = ['author_id','name','email','phone','city','joined_date'];
const bookCols = ['book_id','title','isbn','genre','publication_date','status','mrp','author_royalty_per_copy','total_copies_sold','total_royalty_earned','royalty_paid','royalty_pending','last_royalty_payout_date','print_partner','available_on','author_id','author_email','author_name'];

const authors = [], books = [];
for (const a of data.authors) {
  authors.push(row(authorCols.map(c => a[c])));
  for (const b of a.books ?? []) {
    books.push(row([
      b.book_id, b.title, b.isbn, b.genre, b.publication_date, b.status, b.mrp,
      b.author_royalty_per_copy, b.total_copies_sold ?? 0, b.total_royalty_earned ?? 0,
      b.royalty_paid ?? 0, b.royalty_pending ?? 0, b.last_royalty_payout_date,
      b.print_partner, (b.available_on ?? []).join(' ; '), a.author_id, a.email, a.name,
    ]));
  }
}
mkdirSync(resolve(root, 'data'), { recursive: true });
writeFileSync(resolve(root, 'data/authors.csv'), [row(authorCols), ...authors].join('\n'));
writeFileSync(resolve(root, 'data/books.csv'), [row(bookCols), ...books].join('\n'));

// Per-author payload exactly as the Bubble app will POST it to the n8n webhook.
mkdirSync(resolve(root, 'data/payloads'), { recursive: true });
for (const a of data.authors) {
  const payload = {
    author_id: a.author_id,
    author_name: a.name,
    author_email: a.email,
    city: a.city,
    books: (a.books ?? []).map(b => ({
      title: b.title, status: b.status, publication_date: b.publication_date,
      copies_sold: b.total_copies_sold ?? 0, royalty_earned: b.total_royalty_earned ?? 0,
      royalty_paid: b.royalty_paid ?? 0, royalty_pending: b.royalty_pending ?? 0,
      last_payout_date: b.last_royalty_payout_date,
    })),
  };
  writeFileSync(resolve(root, `data/payloads/${a.author_id}.json`), JSON.stringify(payload, null, 2));
}
console.log(`authors: ${authors.length}, books: ${books.length}`);
// Summary stats to sanity-check against the brief (10 authors / 18 books)
const totalPending = data.authors.flatMap(a=>a.books??[]).reduce((s,b)=>s+(b.royalty_pending??0),0);
console.log('total pending across all books:', totalPending);
const statuses = [...new Set(data.authors.flatMap(a=>a.books??[]).map(b=>b.status))];
console.log('book statuses:', statuses.join(' | '));
const neverPaid = data.authors.filter(a=>(a.books??[]).some(b=>(b.royalty_pending??0)>0 && !b.last_royalty_payout_date)).map(a=>a.author_id);
console.log('authors with pending & never paid:', neverPaid.join(','));
