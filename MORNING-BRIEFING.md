# 🌅 Morning briefing — what shipped overnight

> Written 2 May 2026 ~03:00 SAST. Coffee first, then read this.

## TL;DR

Shipped **v3.0.0** — the platform pivot. App reframed as an **engine that
sells the service**, with content as a swappable tenant. Same code now
positioned to be re-licensed for any SA cert prep. UI cut to 4 clean tabs.
Live at https://bimbobaggins27.github.io/nhbrc-trainer/.

I told you straight: I can't keep coding while you sleep — I'm a session,
not a daemon. The only thing genuinely running on its own is the
regulations-watch GitHub Action (next fire: Mon 06:00 UTC). What I did do
is one focused 90-minute session before signing off, packed with the
highest-leverage changes.

## What changed in v3.0.0

### 1. Tenant model — the platform pivot
- New `docs/tenant.js` exposes `window.TRAINER_TENANT` — a manifest with
  brand, pricing, marketing copy, content refs, disclaimers.
- The engine's job is to render that manifest. Swap the tenant + content
  files and the same app powers SACAP / ECSA / SAIQS / CIDB / FET prep.
- Read `PLATFORM.md` (new) — that's the architecture story you sell to
  a B2B buyer or licensee.

### 2. 4-tab IA — clean, hub-based
| Tab | What's in it |
|---|---|
| 🎓 Learn | Status strip + quick actions (Continue / Mock / Master) + chip-switcher between **Modules · Quizzes · Glossary** |
| 🛠 Tools | 13 calculators (unchanged from v2.12) |
| 📚 Library | Bundled legislation + external buy-pages + curated articles |
| 👤 Me | Avatar + 4-stat dashboard + Mock + Master history + account links (About / Terms / Privacy / Admin / Reset / Logout) |

No more permanent disclaimer banner — replaced with a **one-time welcome
modal** that explains the app is independent and points to the Me tab for
full Terms.

### 3. Unlock copy reframed
"You're paying for the **service** — the curation, the calculators, the
quiz engine. The regulations are public." — explicit on the Unlock page
now, matches the platform pivot.

### 4. PLATFORM.md
A real document selling the engine to a future B2B buyer. Includes:
- Tenant model architecture diagram
- "How to fork for a new cert" 8-step guide
- Saleable-asset breakdown (B2C / B2B SaaS / white-label / acquisition)
- Engineering principles (offline-first, privacy-first, cite-not-reproduce)
- Roadmap to "engine 1.0"

## What's at v3.0.0 that wasn't yesterday

- Live at https://bimbobaggins27.github.io/nhbrc-trainer/
- Tabs: 4 (down from 6)
- Welcome modal: shown once, then `nhbrc.welcomeSeen.v1` set
- Status strip on home: `modules · streak · best mock`
- Quick actions: Continue last module, Mock test, Master Quiz
- Me hub: full progress dashboard + 5 history rows for both Mock + Master
- Tenant scaffold: `docs/tenant.js` (new)
- Asset versions: all stamped `?v=3.0.0`
- SW: `nhbrc-v3.0.0`

## Your morning checklist (10 minutes total)

### 🔴 Still on you (security, will not get easier)
- [ ] **Rotate the GitHub PAT** at https://github.com/settings/tokens.
      The token `gho_h0wZKKrM…` has been in this transcript since yesterday.
- [ ] **Enable 2FA on GitHub** at https://github.com/settings/security.
      Save recovery codes offline.

### 🟡 30-day plan — next concrete steps
- [ ] **CIPC Pty Ltd registration** at https://eservices.cipc.co.za
      (R175, 30 minutes). Suggested name: `RU1 Training (Pty) Ltd`.
- [ ] **Lawyer review** of the Terms + Privacy in `docs/app.js`
      (search for `viewLegal` and `viewPrivacy`). Budget R3 000–R5 000.
- [ ] **Paystack signup** at https://dashboard.paystack.com — free,
      24 hours to verify.
- [ ] **Cloudflare account** at https://dash.cloudflare.com — free.
- [ ] **Resend signup** at https://resend.com — free 100 emails/day.

### 🟢 14-day study plan (priority — test 15 May)
- [ ] Today: scan the HBM cover-to-cover with Adobe Scan
- [ ] Sun: orient — read once with no notes
- [ ] Mon-Fri: paste 1 module/day of HBM facts → I'll write quiz questions
       in your own words → commit
- [ ] Next Sat-Sun: Master Quiz × 4 + Mock × 2, target 75%+
- [ ] Mon-Thu next week: drill weak modules
- [ ] Fri 14: light review only, sleep early
- [ ] Sat 15: TEST DAY 🎓

## Bigger picture — where you are vs the 30-day plan

```
Day  0 (Fri)  ✅ Pty/Auth/Paystack scaffolds, 4-tab UI, calculators
Day  1 (Sat)  ✅ v3.0 platform pivot, tenant model, PLATFORM.md
Day  2 (Sun)  ⏳ Scan HBM, orient
Day  3-7      ⏳ Module-per-day HBM → quiz questions
Day  8-9      ⏳ Master / Mock drill
Day 10-13     ⏳ Targeted weak-area drill
Day 14 (Fri)  ⏳ Light review, sleep
Day 15 (Sat)  🎓 NHBRC TEST
Day 16-30     💰 Founder launch + first B2B pitches
```

## Things to think about today (not urgent)

1. **Tenant proof-of-concept** — once you've passed the test, fork the repo,
   rebrand for "SACAP Architect Prep", swap the data files, and ship to a
   sample audience. That's the platform sale story made visible.

2. **First B2B email template** — let me draft this with you next session.
   Target: 20 NHBRC training providers. Pitch: white-label our engine for
   their content at R30k/year.

3. **Affiliate links** — 2 hours of work, immediate revenue. Add Library
   "buy from SABS" / "buy from Builders Warehouse" links with affiliate IDs.

4. **PDF certificate generator** — when a user scores 80%+ on Mock 3× in a
   row, generate a verifiable PDF with QR + timestamp. That's the social-
   proof / referral driver.

## What you'll see when you open the app

1. Locked gate (unchanged) — Log in / Create account.
2. Log in as `RU1` / your override password (the override is still
   live — see `auth.js` `OVERRIDE_HASH_HEX`).
3. **Welcome modal once** — tap *Got it*.
4. **Clean home** — status strip, 3 quick-action cards, **Modules /
   Quizzes / Glossary** chip switcher, then the 29-module grid.
5. **4 tabs** at the bottom: Learn / Tools / Library / Me.
6. **Me tab** — your stats, Mock + Master history, account links, all in
   one place.

## What I will NOT pretend

- I cannot keep coding while you sleep.
- The only autonomous thing running is the regs-watch GitHub Action
  (Monday 06:00 UTC weekly).
- The next development session is up to you to start.

Sleep well. Hit the test on the 15th. The business follows. 🚀

— Craft Agent
