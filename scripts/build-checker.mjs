// Builds the two editions of the Agent Readiness Optimizer from one source.
//   node scripts/build-checker.mjs
// Needs acorn: `npm i --no-save acorn` (or set ACORN=/path/to/acorn).
//
// public -> agent-readiness/optimizer.html               (deployed; free checker)
// full   -> internal/agent-readiness-optimizer-full.html (not deployed; staff tool)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require(process.env.ACORN || 'acorn');

const SRC = 'src/agent-readiness/optimizer.src.html';
const src = readFileSync(SRC, 'utf8');
const banner = (ed) => `<!-- BUILT FILE (${ed} edition) from ${SRC}. Edit the source and rebuild. -->\n`;

function stripFixArgs(js) {
  // Remove the 6th argument (the fix text) from every add(...) call.
  const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' });
  const cuts = [];
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'add' && n.arguments.length >= 6) {
      cuts.push([n.arguments[4].end, n.arguments[n.arguments.length - 1].end]);
    }
    for (const k in n) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v);
    }
  })(ast);
  cuts.sort((a, b) => b[0] - a[0]).forEach(([a, b]) => { js = js.slice(0, a) + js.slice(b); });
  return { js, count: cuts.length };
}

function buildPublic(html) {
  let out = html.replace(/<!--PAID-->[\s\S]*?<!--\/PAID-->/g, '');
  out = out.replace(/\/\*PAID\*\/[\s\S]*?\/\*\/PAID\*\//g, '');
  out = out.replace('const EDITION = "full"; /* the build sets "public" */', 'const EDITION = "public";');
  let total = 0;
  out = out.replace(/(<script>)([\s\S]*?)(<\/script>)/g, (m, a, js, b) => { const r = stripFixArgs(js); total += r.count; return a + r.js + b; });
  out = out.replace(/<!--\n  SOURCE FILE[\s\S]*?-->\n/, '');
  // Safety net: none of the paid generators may survive.
  for (const marker of ['fx-llms', 'fx-jsonld', 'fx-robots', 'fx-block', 'User-agent: OAI-SearchBot', 'What the audit can\'t see', 'Fix: "+']) {
    if (out.includes(marker) && marker !== 'Fix: "+') throw new Error('Paid content leaked into public build: ' + marker);
  }
  return { out: banner('public') + out, total };
}

function buildFull(html) {
  const out = html.replace(/<!--PAID-->|<!--\/PAID-->|\/\*PAID\*\/|\/\*\/PAID\*\//g, '').replace(/<!--\n  SOURCE FILE[\s\S]*?-->\n/, '');
  return banner('full, staff only') + out.replace('<title>', '<meta name="robots" content="noindex,nofollow">\n<title>');
}

const pub = buildPublic(src);
writeFileSync('agent-readiness/optimizer.html', pub.out);
mkdirSync('internal', { recursive: true });
writeFileSync('internal/agent-readiness-optimizer-full.html', buildFull(src));
console.log(`public: stripped ${pub.total} fix hints; full: written`);
