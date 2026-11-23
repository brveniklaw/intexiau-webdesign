// Receives project / fix-report requests and emails them via Resend.
// Required Vercel env vars: RESEND_API_KEY, LEAD_TO_EMAIL
// Optional: LEAD_FROM_EMAIL (default "WebStudio <onboarding@resend.dev>" until intexiau.com is verified in Resend)

const MAX = 4000;
const clean = (v) => String(v ?? '').slice(0, MAX).trim();
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) { try { return JSON.parse(raw || '{}'); } catch { return {}; } }
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  const body = await readBody(req);
  // Honeypot: bots fill hidden fields. Pretend success.
  if (clean(body.company_fax)) return res.status(200).json({ ok: true });

  const fields = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'company_fax') continue;
    const val = clean(Array.isArray(v) ? v.join(', ') : v);
    if (val) fields[clean(k).slice(0, 60)] = val;
  }
  const email = fields.email || '';
  if (!fields.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Name and a valid email are required.' });
  }

  const source = fields.source || 'start-a-project';
  const kind = source === 'checkout'
    ? `${fields.path === 'diy' ? 'Fix report' : 'Done for you'} (${fields.plan || 'no tier'})${fields.readinessScore ? `, score ${fields.readinessScore}` : ''}`
    : source === 'checker' ? `Free checker, score ${fields.score || '?'}` : 'Start a Project';
  const subject = `New WebStudio lead — ${kind} — ${fields.name}`;

  // Always log so a lead is never lost even if email is misconfigured.
  console.log('[lead]', JSON.stringify({ at: new Date().toISOString(), ...fields }));

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  if (!key || !to) {
    console.error('[lead] RESEND_API_KEY or LEAD_TO_EMAIL not set; lead only logged.');
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  const rows = Object.entries(fields).map(([k, v]) =>
    `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${esc(k)}</td><td style="padding:6px 12px;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || 'WebStudio <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject,
        html: `<h2 style="font-family:sans-serif">${esc(subject)}</h2><table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${rows}</table>`,
        text: Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n'),
      }),
    });
    if (!r.ok) {
      console.error('[lead] Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] send failed', err);
    return res.status(502).json({ ok: false });
  }
}
