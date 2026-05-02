# Launch checklist — paste-ready actions for the 30-day plan

Each item below is a thing only you can do (account creation, signing,
ID verification). I've drafted the language / steps so it's a copy-paste
exercise, not a research project.

## Day 1 — security hygiene (10 minutes)

### 🔴 Rotate the leaked GitHub PAT
1. Open https://github.com/settings/tokens
2. Find the token starting `gho_h0wZKKrM…`
3. Click **Delete** → confirm.

### 🟠 Enable 2FA
1. Open https://github.com/settings/security
2. **Enable two-factor authentication** → choose Authenticator app (Aegis,
   Google Authenticator, Authy, 1Password)
3. Scan the QR with the app. Save the 6-digit code prompt confirms.
4. **Save recovery codes** — print + store in safe, OR keep in a password
   manager. Lose these and a phone-loss = locked out.

## Day 1-2 — Pty Ltd registration (CIPC, R175, ~30 min)

### Step-by-step
1. Open https://eservices.cipc.co.za
2. Sign up as a new customer if needed (use your personal email + ID number).
3. **Customer Code** is generated — save it.
4. Top up your CIPC account with ~R175 (EFT, takes 1–2 days, OR R200 to
   cover any overage).
5. Go to **Companies → New Registration → Private Company (Pty) Ltd**.
6. Fields:
   - **Proposed name** — try `RU1 Training (Pty) Ltd`. Have 2 backup names.
   - **SIC code** — `8550` (Educational support services) or `8230`
     (Activities of business and employers' membership organisations).
   - **Director** — yourself, ID number, address, contact.
   - **Auditor** — leave blank (small Pty Ltd doesn't need one).
   - **Registered address** — your physical address.
   - **Year-end** — pick Feb (matches SARS tax year).
7. Submit + pay R175. Approval is usually 1–3 days.
8. Once approved you receive: registration number (eg. `2026/123456/07`),
   tax reference (auto-registered with SARS), CK / CoR documents (PDF).

## Day 2-3 — bank + tax setup

### SARS — already done automatically
CIPC auto-registers you with SARS. Within 21 days SARS sends a tax
reference number. Note it in your password manager.

### Open a business bank account
- **TymeBank Business** — fastest, no monthly fee, online onboarding (~30 min)
- **Capitec Business Bundle** — R75/mo, branch visit needed
- **FNB First Business Zero** — free for first year, online

Bring: company registration certificate (CoR 14.3 from CIPC), your ID,
proof of address, share certificate. Most banks have a "new business"
flow that walks you through it.

## Day 4-5 — Paystack signup (free, ~24 hrs verification)

1. Open https://dashboard.paystack.com — sign up with company email.
2. Enter your Pty Ltd details + business bank account.
3. Upload: CoR 14.3, director ID copy, bank confirmation letter.
4. Wait 24 hrs for verification. Test mode works immediately.
5. Once verified → **Pay Pages** → Create new:
   - Name: "NHBRC Trainer Lifetime"
   - Price: R 199.00 (or R 399 once founder window closes)
   - Description: "Lifetime access to NHBRC Trainer (independent SA building-regs study aid)"
   - Success URL: `https://bimbobaggins27.github.io/nhbrc-trainer/?activate=PENDING`
6. **Copy the Pay Page URL** (looks like `https://paystack.com/pay/abc123`).
7. Send me that URL — I'll paste it into the app's `PAYSTACK_LINK`.

## Day 4-5 — Cloudflare + Resend

### Cloudflare
1. Sign up at https://dash.cloudflare.com — free
2. Install Wrangler CLI: `npm i -g wrangler`
3. `wrangler login` — opens a browser, authorises Wrangler

### Resend
1. Sign up at https://resend.com — free tier 100 emails/day
2. Add a sending domain (or use the default `*.resend.dev` to start)
3. Generate API key, save securely

## Day 5 — deploy the payments + AI Worker
Follow `payments/README.md`:

```bash
cd payments
cp wrangler.toml.example wrangler.toml
wrangler kv:namespace create LICENSES
wrangler kv:namespace create TOKENS
# paste IDs into wrangler.toml
wrangler secret put PAYSTACK_SECRET     # sk_live_... when verified
wrangler secret put LICENSE_SIGNING_KEY # any 32+ char random
wrangler secret put RESEND_API_KEY      # re_...
wrangler secret put ANTHROPIC_API_KEY   # if you want AI tutor (paid)
wrangler deploy
```

You'll get a URL like `https://nhbrc-payments.<you>.workers.dev`. Then:
1. Edit `docs/license.js` — set `API_BASE` to your Worker URL
2. Set Paystack webhook URL to `<your-worker-url>/paystack/webhook`
3. Push to git → GitHub Pages auto-deploys

## Day 7-10 — lawyer review

### What to send the lawyer
Email to a SA-qualified attorney (LegalWise / Lexico / a corporate-comm
firm). Brief:

> Subject: Review of Terms + Privacy Policy for SA-based educational SaaS
>
> Hi [Name],
>
> I'm launching an independent online study aid for South African
> homebuilders (NHBRC competency assessment prep). I've drafted the Terms
> of Service and POPIA-aware Privacy Policy myself; I'd like a 1-hour
> review to flag anything missing or risky before I open paid signup.
>
> The drafts are at:
> https://github.com/BimboBaggins27/nhbrc-trainer/blob/main/docs/app.js
> (search for `viewLegal` and `viewPrivacy` — about 200 lines total).
>
> Specifically I want eyes on:
> - Refund clause (CPA s44 7-day cooling-off) — sufficient?
> - Limitation of liability — is "max = price paid" enforceable in SA?
> - POPIA compliance — anything missing for a no-server, localStorage-only model?
> - Disclaimer of educational scope — strong enough to defend "study aid not
>   legal advice" if a user claims my app caused their plan rejection?
>
> Budget R3 000–R5 000. Turnaround: ideally 5 business days.
> Thanks!

## Day 14-21 — first 50 founder sales

### Channels
1. **WhatsApp groups** — find SA construction / NHBRC builder / owner-builder groups
2. **LinkedIn DMs** — targeted at SA construction professionals
3. **Facebook groups** — owner-builder / DIY / construction in SA
4. **Local construction merchants** — leave a flyer at Cashbuild / Builders Warehouse with a QR

### Founder pitch (200 words)

> 🏗 New: NHBRC Trainer — a study app for the NHBRC homebuilder
> competency test, built by a working construction professional.
>
> What's inside:
> ✅ 29 modules across every Part of SANS 10400 (A → XA)
> ✅ 250+ quiz questions + a 50-question Mock NHBRC Test
> ✅ 13 on-site calculators (bricks, concrete, rebar, beams, cube tests…)
> ✅ Forms 1/2/3/4 generators + inspection checklists
> ✅ Bundled SA legislation, fully offline once installed
>
> First 50 buyers: **R 199 lifetime** (R 399 thereafter).
> 7-day refund. PWA installs to your phone home screen.
>
> Try it free → https://bimbobaggins27.github.io/nhbrc-trainer/
> RU1 / RU1 to log in.

## Day 21+ — first B2B pitch

Keep going through `B2B-OUTREACH.md`.
