// POST { url } -> { url, status, html, robots, llms }
// Lets the Agent Readiness Optimizer fetch a page the way a non-JavaScript agent sees it.
import { safeFetch } from './_lib/safe-fetch.js';

const hits = new Map(); // best-effort per-instance limit; add a Vercel Firewall rate-limit rule for real protection
function limited(ip) {
  const now = Date.now(), win = 60_000, max = 10;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many checks. Wait a minute and try again.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  let raw = String(body?.url || '').trim();
  if (!raw) return res.status(400).json({ error: 'Enter a page URL.' });
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  try {
    const page = await safeFetch(raw);
    if (!/html|xml|text\/plain/i.test(page.type) && page.text.slice(0, 200).indexOf('<') === -1) {
      return res.status(422).json({ error: 'That URL did not return a web page.' });
    }
    const origin = new URL(page.url).origin;
    const side = async (path) => {
      try {
        const r = await safeFetch(origin + path, { maxBytes: 200_000, timeoutMs: 5000 });
        return r.status === 200 && !/^\s*</.test(r.text) ? r.text : '';
      } catch { return ''; }
    };
    const [robots, llms] = await Promise.all([side('/robots.txt'), side('/llms.txt')]);
    return res.status(200).json({ url: page.url, status: page.status, truncated: page.truncated, html: page.text, robots, llms });
  } catch (err) {
    return res.status(422).json({ error: err?.name === 'AbortError' ? 'The site took too long to respond.' : (err?.message || 'Could not fetch that page.') });
  }
}
