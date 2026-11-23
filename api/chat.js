// Server-side proxy for the pricing-page chatbot demo. Keeps the API key off the client.
// Required Vercel env var: ANTHROPIC_API_KEY. Optional: CHAT_MODEL.

const SYSTEM = `You are a friendly, concise demo chatbot embedded on IntexiaUWebDesign's pricing page (webstudio.intexiau.com), showcasing the custom AI chatbot included with the Momentum and Signature plans. Answer in 2-3 sentences, using only this package info:

GENESIS (starting at $600): Fully custom design (zero templates), up to 5 pages, mobile & desktop optimized, built-in contact & lead capture, basic SEO setup, custom 4K CGI visuals.

MOMENTUM (starting at $2,000, most popular): Everything in Genesis, up to 10 pages, plus custom animations & interactions, booking/product listings, a custom AI chatbot trained on the client's business, and 4K CGI visuals.

SIGNATURE (starting at $10,000): Everything in Momentum, unlimited pages, plus an immersive scroll/animated experience, a fully interactive 3D web experience, and priority support during the build.

Clients with an existing site can also choose a prioritized fix report and make the changes themselves instead of a redesign.

If asked which plan fits, ask about goals and budget and recommend accordingly. Final pricing is confirmed after a review of the client's needs; never promise discounts, timelines, or guarantees. Point people to "Start a Project" to get going. Politely decline topics unrelated to websites or IntexiaUWebDesign.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  const messages = msgs.slice(-12)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  // The API requires the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return res.status(400).json({ error: 'empty' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.CHAT_MODEL || 'claude-haiku-5-5', max_tokens: 300, system: SYSTEM, messages }),
    });
    if (!r.ok) { console.error('[chat]', r.status, await r.text()); return res.status(502).json({ error: 'upstream' }); }
    const data = await r.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[chat] failed', err);
    return res.status(502).json({ error: 'upstream' });
  }
}
