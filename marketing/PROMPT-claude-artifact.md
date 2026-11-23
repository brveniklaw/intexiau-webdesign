# Prompt for another Claude account (staff use only)

> Use this only with the staff build, `internal/agent-readiness-optimizer-full.html`, and keep the artifact private. It contains every fix and generator, which is the paid product. Don't share the link publicly.

Start a new chat in Claude (Cowork or claude.ai with artifacts turned on). Drag in `internal/agent-readiness-optimizer-full.html`, then paste everything between the lines below.

---

I'm attaching **agent-readiness-optimizer.html**, a finished single-file web app called the Agent Readiness Optimizer. It checks how well AI assistants (ChatGPT, Claude, Gemini, Copilot, Perplexity, Meta AI, Grok and Siri) can read a web page and lead a person to the site's main action, such as booking, applying, signing up or calling.

Please do the following:

1. **Read the whole file first.** Confirm it is one self-contained HTML page with inline CSS and JavaScript and no external scripts. It loads Google Fonts only.
2. **Publish it as an artifact exactly as written**, titled "Agent Readiness Optimizer". Don't rewrite or redesign it.
3. **Turn on the `sample` capability** for the artifact (declaration: `{"sample": {}}`). The "Test with a live agent" section calls `claude.use("sample")` to ask Claude to read the page the way an AI agent would. Without this capability, that section shows a message saying it's unavailable, and everything else still works.
4. **Give me the link**, and tell me in one or two sentences how to use it.

How the app works, so you can help me use it:

- **Site profile tab:** I describe the organization, its main action and link, phone, hours, places served, services and audience. Blank fields are skipped. It's saved in my browser.
- **Page HTML, robots.txt and llms.txt tabs:** I paste the page source (Ctrl+U), and optionally the site's /robots.txt and /llms.txt. Artifacts can't fetch other websites, so pasting is how it gets the content.
- **Agent readiness:** a score out of 100 across Path to action, Discovery, Structured data and Readability, with a fix for each issue.
- **Findable across AI platforms:** an assistant-by-assistant table based on each company's published crawler names. It also has a checklist of off-site steps and a place to record manual tests in each assistant.
- **Test with a live agent:** my own test questions, one per line. A line starting with "!" is a request the site can't help with; it passes only if the agent doesn't send that person to the main action.
- **Generated fixes:** an llms.txt draft, JSON-LD structured data, a plain-HTML "get started" section and robots.txt rules, built from the profile.

Crawler facts the app relies on (checked November 2026; recheck if it has been a while):

- **Search and answers:** OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot (Copilot), Meta-WebIndexer and Applebot.
- **Visiting pages for a person:** ChatGPT-User, Claude-User, Perplexity-User and Meta-ExternalFetcher.
- **Training only:** GPTBot, ClaudeBot, Meta-ExternalAgent, Applebot-Extended and CCBot.
- **Google-Extended** controls Gemini training *and* Gemini's grounded answers, so blocking it keeps a site out of the Gemini app.
- **Grok:** xAI publishes no crawler name, so only the catch-all `User-agent: *` rule can be checked.

---
