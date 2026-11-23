// Fetches a public web page for the Agent Readiness Optimizer, with SSRF guards:
// http/https only, default ports only, every hop's host must resolve to public IPs,
// manual redirects (max 3), size cap and timeout.
import dns from 'node:dns/promises';
import net from 'node:net';

const UA = 'IntexiaU-AgentReadiness/1.0 (+https://webstudio.intexiau.com/agent-readiness)';
const MAX_BYTES = 1_500_000;

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224 || (a === 198 && (b === 18 || b === 19));
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('ff');
}

async function assertPublic(u) {
  if (!/^https?:$/.test(u.protocol)) throw new Error('Only http and https URLs can be checked.');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Only standard web ports can be checked.');
  if (u.username || u.password) throw new Error('URLs with credentials are not allowed.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error('That address is not public.');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('That address is not public.');
}

export async function safeFetch(rawUrl, { maxBytes = MAX_BYTES, timeoutMs = 8000 } = {}) {
  let u;
  try { u = new URL(rawUrl); } catch { throw new Error('That is not a valid URL.'); }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= 3; hop++) {
      await assertPublic(u);
      const res = await fetch(u, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5' } });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        u = new URL(res.headers.get('location'), u);
        continue;
      }
      const reader = res.body?.getReader();
      const chunks = []; let size = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > maxBytes) { ctrl.abort(); break; }
          chunks.push(value);
        }
      }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
      return { status: res.status, url: u.href, type: res.headers.get('content-type') || '', text, truncated: size > maxBytes };
    }
    throw new Error('Too many redirects.');
  } finally {
    clearTimeout(timer);
  }
}
