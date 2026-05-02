# Free auto-license delivery — paste-by-paste setup

End state after ~60 minutes of clicks:

```
buyer pays via Paystack Pay Page
        │
        ▼ webhook
   Cloudflare Worker (free tier)
        │
        ├─► generate licence + code
        ├─► store in Cloudflare KV (free)
        └─► email buyer the magic link + code via Resend (free 100/day)
                 │
                 ▼
          buyer either taps link OR pastes code → app unlocks
```

Total monthly cost at <1 000 sales/month: **R 0**.

You don't need a Pty Ltd, a business bank account, or a domain. Personal
ID + personal bank account is enough. Tax flows through your personal SARS
return (you're trading as a sole proprietor).

## What you need

Three free signups + 1 GitHub setting.

### 1) Paystack — accept the money

- Sign up at https://dashboard.paystack.com
- Choose **Individual** when asked about business type
- Use your SA ID + personal bank account
- They take ~24 hours to verify; **test mode works immediately**

Once verified:

- **Pay Pages → Create new**:
  - Title: `NHBRC Trainer — Lifetime`
  - Amount: `R 199.00` (founder pricing)
  - Description: `Lifetime access to NHBRC Trainer (independent SA building-regs study aid). 7-day refund.`
  - Success URL: `https://bimbobaggins27.github.io/nhbrc-trainer/?paystack=success`
- **Save** — copy the Pay Page URL (looks like `https://paystack.com/pay/abc123`)
- Paste this URL into `docs/app.js` → search `PAYSTACK_LINK` → replace

- **Settings → API Keys & Webhooks**:
  - Find the **Webhook URL** field
  - Paste: `https://nhbrc-payments.<your-cf-subdomain>.workers.dev/paystack/webhook`
    (you'll have this URL after step 2 below)
  - Save
- Note your **Secret Key** (starts `sk_test_…` or `sk_live_…`) — you'll paste it as a Worker secret in step 3

### 2) Cloudflare — host the Worker (free tier)

- Sign up at https://dash.cloudflare.com — free
- After signup, find your **Account ID** (right sidebar of any zone, or
  Workers & Pages → Account ID)
- **Generate an API token**:
  - https://dash.cloudflare.com/profile/api-tokens → Create Token
  - Use template **Edit Cloudflare Workers**
  - Account: your account
  - Click Continue → Create Token
  - Copy the token (you only see it once)

### 3) Resend — send the activation email (free tier 100/day)

- Sign up at https://resend.com — free
- **API Keys → Create API Key** → copy
- (Optional) verify a sending domain. To start, you can use the default
  `onboarding@resend.dev` from address — Resend allows it for the free tier.

### 4) Deploy the Worker

Two ways. Pick **A** for fastest, **B** for "just push and it deploys".

#### A. One-time local deploy (5 min)

```bash
# from repo root
cd payments
npm install -g wrangler
wrangler login                       # opens browser, authorise

# create the KV namespaces
wrangler kv namespace create LICENSES
wrangler kv namespace create TOKENS
# copy the IDs into wrangler.toml (you can also enable preview namespaces)

cp wrangler.toml.example wrangler.toml
# edit wrangler.toml — paste the two KV namespace IDs

# set secrets (one at a time, paste when prompted)
wrangler secret put PAYSTACK_SECRET     # the sk_test_… or sk_live_… from Paystack
wrangler secret put LICENSE_SIGNING_KEY # any 32+ random chars (1Password generator works)
wrangler secret put RESEND_API_KEY      # the re_… from Resend
wrangler secret put FROM_EMAIL          # 'NHBRC Trainer <onboarding@resend.dev>' (or your verified domain)

# deploy
wrangler deploy
```

You'll see a URL like `https://nhbrc-payments.<you>.workers.dev`.
Open it + `/healthz` to confirm it's live: should return `{"ok":true}`.

#### B. CI/CD via GitHub Actions (recommended after first manual deploy)

Once your Worker is deployed once, the included
`.github/workflows/deploy-worker.yml` will redeploy it on every push that
touches `payments/**`. To enable:

1. **Repo → Settings → Secrets and variables → Actions → Secrets**:
   - `CLOUDFLARE_API_TOKEN` = your token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID from step 2
2. **Repo → Settings → Secrets and variables → Actions → Variables**:
   - `WORKER_DEPLOY_ENABLED` = `true`

That's it. Now when you `git push` a change to `payments/`, GitHub Actions
deploys the new Worker version automatically.

### 5) Wire the URL into the frontend

Open `docs/license.js` → set `API_BASE` to your Worker URL:

```js
const API_BASE = 'https://nhbrc-payments.<you>.workers.dev';
```

Open `docs/chat.js` → set the same URL in `CHAT_API` (only matters if you
also enabled the Anthropic AI tutor with `wrangler secret put ANTHROPIC_API_KEY`).

Bump the asset version + commit + push:

```bash
# In docs/sw.js — bump VERSION + ASSET_VER
# In docs/index.html — bump every ?v=X.Y.Z (sed across the file)
git commit -am "wire backend"
git push
```

GitHub Pages rebuilds in ~30 seconds. Your app is now selling.

## Test the full flow before going live

1. Open https://dashboard.paystack.com → ensure **Test Mode** is on (top-right toggle)
2. Open the live app → **Unlock** → tap Buy
3. Use Paystack test card: `4084 0840 8408 4081`, any future date, any 3-digit CVV
4. Within ~10 seconds the activation email arrives
5. Tap the magic link, OR copy the licence code and paste into the Unlock form
6. Master Quiz unlocks, license stored in localStorage

## Going live

- In Paystack dashboard, switch from **Test mode** to **Live mode**
- Get your `sk_live_…` key
- `wrangler secret put PAYSTACK_SECRET` → paste the live key
- Update the Pay Page in live mode (test/live are separate dashboards)
- Update `PAYSTACK_LINK` in `docs/app.js` if the URL changed

You're live. R 0/month operating cost up to ~1 000 sales per month.

## Common errors

| Symptom | Cause | Fix |
|---|---|---|
| Webhook returns 400 "bad signature" | Mismatched secret | Re-set `PAYSTACK_SECRET` from Paystack Settings |
| Email never arrives | Resend rejecting from-address | Use `onboarding@resend.dev` until you verify a domain |
| Magic link returns 401 | Token expired (7-day window) | Use the paste code instead — codes don't expire |
| `wrangler deploy` says "no namespace" | Forgot the `wrangler kv namespace create` step | Run those, paste IDs into wrangler.toml |

## Cost ceiling

Cloudflare Workers free: 100 000 requests/day. Each sale ≈ 3 requests
(webhook + activate + maybe verify). You hit the limit at ~33 000 sales/day,
which is a problem you'd love to have.

Resend free: 100 emails/day. Each sale = 1 email. You can take 100 sales/day
before needing to upgrade ($20/month for 50 000 emails).

KV: 100 000 reads/day, 1 000 writes/day on free tier. Each sale = ~3 writes.
You hit the write limit at ~333 sales/day — also a great problem.
