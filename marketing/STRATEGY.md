# Agent Readiness: free vs. paid, and how it signs clients

Principle: **free shows the problem, email unlocks the full diagnosis, money buys the fix.**

## Offer ladder

| Level | What they get | Where it lives |
|---|---|---|
| Free, anonymous | Score, category bars, top 3 issues with "why it hurts", assistant-by-assistant table, 1 live agent question | `/agent-readiness/optimizer` (public build) |
| Free with email | Every issue ranked by impact, 3 live agent questions total | Same page, unlocked by the email form; lead goes to `/api/lead` |
| Fix Report (DIY) | Exact fix + ready-to-paste code for each issue, up to 5 pages, prioritized checklist, listings checklist | Produced by staff with `internal/agent-readiness-optimizer-full.html` |
| Done for you | We make the fixes, re-test across the assistants, before-and-after report | Staff build + client site access |
| Monitoring (monthly) | Monthly re-check, assistant tests, llms.txt and listings kept current | Staff build; recurring |
| Redesign | Genesis / Momentum / Signature | Shown automatically when the checker finds the site's structure hides content from AI |

Prices: to be set. Rule of thumb against Genesis ($600): Fix Report well below it, Done for you near it, Monitoring a small monthly fee. Fix Report price is credited toward Done for you within 30 days (stated on checkout).

## Funnel

1. Traffic: flyer QR, LinkedIn/X/Instagram posts, Brvenik Brief articles that end with "check your own site".
2. Free check → bad score + "agent couldn't find your sign-up" result.
3. Email gate → lead email to the team with score, main action and issue list.
4. Follow-up (to set up in Resend or Zapier): day 0 report, day 3 before-and-after story, day 7 Fix Report offer with upgrade credit, day 30 automatic re-check.
5. Checkout (`/checkout?plan=audit`) or a 15-minute call for nonprofits and high scores.
6. Deliver → offer Monitoring → offer redesign when the structure is the problem.

## Rules that protect the paid product

- The public checker never contains the fix generators or per-issue fix text; the build script strips them and fails if any leak.
- The full tool (and the Claude-artifact PROMPT) is staff-only. Don't publish it.
- Live agent tests cost money: 1 anonymous, 3 with email, plus a Vercel Firewall rate limit on `/api/agent-test` and `/api/fetch-page`.
- Fix WebStudio's own homepage first: prospects will run the checker on it.

## Numbers to watch

Checks run → email rate (aim 20–30%) → paid report or call → Fix Report → Done for you upgrades → Monitoring retention.
