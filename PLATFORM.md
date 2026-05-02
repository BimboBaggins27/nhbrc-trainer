# Trainer Engine — platform documentation

> **What we sell:** the engine. **What it processes:** is the customer's content.
>
> NHBRC Trainer is the first tenant. The same engine is built to power any
> South African (or international) certification-prep / compliance-learning
> product, with the customer providing the content layer.

## What the engine actually is

A self-contained, offline-first Progressive Web App that wraps any cert-prep
content with a uniform experience:

- **Auth + accounts** — email + 6-digit verify, PBKDF2-SHA256 password hashing,
  per-device localStorage isolation. Master account with override admin login.
- **Module reader** — sectioned content, SVG illustrations, source-text drill-down.
- **Quiz engine** — per-module + master + mock-exam modes, with Fisher-Yates
  shuffling, per-module seen-tracking, option-order randomisation, persistent
  history.
- **Calculator framework** — 13 built-in QS / engineering tools, all exposed as
  JS helpers so future automations can call them programmatically.
- **Local search** — TF-IDF over the content corpus, with type-weighted ranking.
  Zero backend.
- **Library curation layer** — bundled public-domain references + outbound links
  to authoritative paid sources (no copyright redistribution).
- **Streaks + progress** — daily streaks, mock-test history, certificate
  generation hook (post-launch).
- **PWA delivery** — installable, fully offline, versioned service worker,
  asset-stamped cache busting.
- **POPIA / CPA-aware Terms + Privacy** — drafted to SA legal context.
- **Regulations watcher** — GitHub Actions cron monitoring 7 SA building-reg
  sources weekly; opens a tracking issue on diff.

## Tenant model

A **tenant** is a swappable content + branding manifest. The engine doesn't
know what topic it's teaching — that's all in the tenant.

```
┌────────────────────────────────────────────────────┐
│  Engine (content-agnostic, ~3.5 k LoC)             │
│   index.html · app.js · styles.css · sw.js         │
│   auth.js · license.js · chat.js · calculators.js  │
└────────────────────────────────────────────────────┘
                       ↑
         loads tenant manifest:
                       ↓
┌────────────────────────────────────────────────────┐
│  Tenant (content + branding)                       │
│   tenant.js     — manifest (name, brand, pricing)  │
│   data.js       — modules, glossary                │
│   quiz-extra.js — additional questions             │
│   regulations.js — source clauses                  │
│   library.js    — references + outbound links      │
│   library/pdfs/ — bundled public-domain documents  │
└────────────────────────────────────────────────────┘
```

To create a new tenant ("SACAP Trainer", "SAIQS Trainer", "Plumbers Cert
Prep"):

1. Fork this repo.
2. Replace `docs/tenant.js` with new branding + pricing.
3. Replace `docs/data.js` with the new domain's modules / glossary / quizzes.
4. Replace `docs/regulations.js` with the new domain's source clauses.
5. Replace `docs/library.js` + `docs/library/pdfs/` with the new domain's
   reference set.
6. Replace `docs/quiz-extra.js` with additional questions.
7. Bump `VERSION` + `ASSET_VER` in `docs/sw.js` and the `?v=` stamps in
   `docs/index.html`.
8. Deploy to GitHub Pages / Cloudflare Pages / Netlify.

The engine code never changes. The brand, content, pricing, and disclaimers
all flow from the tenant manifest.

## Why this is the saleable asset

| Layer | Who owns it |
|---|---|
| **The engine** (auth, quiz, calculators, search, PWA, build, watcher) | **Yours — saleable / licensable** |
| The NHBRC tenant content | Curation of public-domain regs (compilation copyright is yours) + transformative summaries (yours) |
| The actual SANS 10400 standards / HBM | SABS / NHBRC — paywalled, **not redistributed** |

You sell:
- **B2C** — direct license to test-takers (R 399 lifetime / R 59 mo)
- **B2B SaaS** — annual licence to training providers per seat (R 6 k–R 30 k/yr)
- **B2B white-label** — sell the engine to a training provider that supplies
  their own content (one-time R 50 k–R 250 k licensing fee + ongoing support)
- **Acquisition optionality** — SABS, NHBRC, a large SA training player, or a
  property-tech acquirer can buy out the engine + the customer base

## Engine commitments (what stays stable across tenants)

- Same 4-tab IA: Learn · Tools · Library · Me
- Same auth + account model
- Same quiz mechanics (random / coverage-aware / shuffled options)
- Same offline-first PWA architecture
- Same POPIA-aware Terms + Privacy framework
- Same regulations-watch automation pattern
- Same accessibility / mobile-first UX

## Customisable per tenant

- Brand colours (`tenant.brand.primary`, `accent`)
- App name + tag-line (`tenant.name`, `marketing.headline`)
- Domain icon
- Pricing tiers + currency
- Paystack pay-page URL (or alternate processor)
- Module / quiz / glossary content
- Disclaimer language
- Legal jurisdiction + governing-law clause

## Engineering principles

1. **Content-agnostic engine** — no hard-coded mention of SANS, NHBRC, or
   foundations in `app.js`. (Currently nearly there; clean-room refactor
   on the next major.)
2. **Offline-first** — every feature must work without a network round-trip.
   Backend (`payments/worker.js`) is optional and only adds payments + AI
   tutor + magic-link email.
3. **Privacy-first** — no analytics, no third-party trackers. localStorage by
   default; backend storage scoped to the bare minimum.
4. **Cite, don't reproduce** — protected source content stays at the publisher.
   We bundle public-domain primary sources only.
5. **Versioned assets, evictable cache** — every file is `?v=X.Y.Z`-stamped,
   service worker bumps version on every release, old caches evicted on
   `activate`.
6. **Test in production with the master account** — the override admin login
   (`tenant.id` master username) lets you verify changes on any device
   without churning real user data.

## Roadmap to "engine 1.0"

- [x] 4-tab IA
- [x] Tenant manifest skeleton (`tenant.js`)
- [x] Cache-bust versioning across HTML + SW
- [x] CSP + referrer hardening
- [x] Regulations watcher (CI)
- [ ] Move all NHBRC-specific strings out of `app.js` into the tenant manifest
- [ ] Per-tenant build script (`tools/build-tenant.js TENANT_ID`)
- [ ] Multi-tenant checkout (tenant-specific Paystack pay-page)
- [ ] Backend deployment guide (`payments/README.md` already covers it)
- [ ] White-label deployment template repo

## What B2B / acquisition buyers actually get

| Asset | Where it lives |
|---|---|
| Engine source code | This repo, MIT-license-able |
| 13 calculators + quiz engine + search + PWA shell | `docs/*.js` |
| GitHub Actions content watcher | `.github/workflows/` |
| Cloudflare Worker payments + AI proxy | `payments/` |
| Tenant scaffold | `docs/tenant.js`, `MAINTENANCE.md`, `PLATFORM.md` |
| Existing NHBRC content corpus (~310 quiz questions, 29 modules, 82 reg clauses) | `docs/data.js`, `docs/quiz-extra.js`, `docs/regulations.js`, `docs/library.js` |
| Customer base from B2C launch | Your Paystack ledger |

The engine is the moat. The content is the wedge. The tenant manifest is what
makes it a platform.
