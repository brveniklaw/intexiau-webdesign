# Agent Readiness Kit (webstudio.intexiau.com)

| Where | What it is |
|---|---|
| `/agent-readiness` (`agent-readiness/index.html`) | Product page for the Agent Readiness Audit. Brand matches the rest of the site. |
| `/agent-readiness/optimizer` (`agent-readiness/optimizer.html`) | The free checker. Still one self-contained file; also works when opened directly or published as a Claude artifact (see `PROMPT-claude-artifact.md`). |
| `/api/fetch-page` | Lets the checker fetch a page, its robots.txt and llms.txt by URL (public addresses only, size and time limits). |
| `/api/agent-test` | Runs the "Test with a live agent" step on the site. Needs `ANTHROPIC_API_KEY`. |
| `/checkout?plan=audit` | Audit request with the two paths: fix report (DIY) or done for you. Prefills the site and score from the checker. |
| `/llms.txt`, `robots.txt` | WebStudio's own AI guide and crawler rules, built with the checker's generated fixes. |
| `marketing/flyer.pdf`, `flyer-source.html` | Letter flyer, IntexiaU colors, logo, QR code to the free checker. Fonts are embedded, so it prints the same anywhere. |
| `marketing/launch-email.md`, `social-posts.md` | Copy, with the free checker as the first step. |
| `marketing/stats-and-sources.md` | Every statistic, rechecked Nov 23, 2026. |

## Before launch

- Set `ANTHROPIC_API_KEY` (shared with the pricing chatbot) and add a Vercel Firewall rate-limit rule for `/api/fetch-page` and `/api/agent-test`. The in-code limits are per server instance only.
- Pick a price for the audit, or keep "Quoted after review".
- The fictional "41 / 100" sample report stays labeled as an example.
