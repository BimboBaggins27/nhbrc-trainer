# NHBRC Trainer — payments backend

Cloudflare Worker that turns Paystack charges into license keys and emails the
user a magic-link activation URL. The PWA at `docs/license.js` posts the token
back here to validate.

## Deploy in 30 minutes

1. **Sign up** at:
   - [Cloudflare Workers](https://dash.cloudflare.com/) (free tier covers this)
   - [Paystack](https://dashboard.paystack.com/) (instant for SA cards; takes a fee per txn)
   - [Resend](https://resend.com/) (free tier: 100 magic-link emails/day)

2. **Install Wrangler** locally:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Create the KV namespaces:**
   ```bash
   cd payments
   wrangler kv:namespace create LICENSES
   wrangler kv:namespace create TOKENS
   ```
   Copy the two `id = "..."` lines into your `wrangler.toml`.

4. **Configure** — copy the example and edit:
   ```bash
   cp wrangler.toml.example wrangler.toml
   # paste the KV IDs and update APP_URL if not using GitHub Pages
   ```

5. **Set secrets:**
   ```bash
   wrangler secret put PAYSTACK_SECRET     # sk_live_... or sk_test_...
   wrangler secret put LICENSE_SIGNING_KEY # any 32+ char random string
   wrangler secret put RESEND_API_KEY      # re_...
   ```

6. **Deploy:**
   ```bash
   wrangler deploy
   ```
   You'll get a URL like `https://nhbrc-payments.<you>.workers.dev`.

7. **Wire the URL into the app:**
   - Open `docs/license.js`
   - Set `const API_BASE = 'https://nhbrc-payments.<you>.workers.dev'`
   - Commit + push → GitHub Pages picks it up

8. **Configure Paystack:**
   - Create a Paystack Hosted Checkout page (Dashboard → Pay Pages)
   - Set the price to **R 399** (set as 39900 in `worker.js` for amount in cents)
   - Add a webhook on the Paystack dashboard pointing to:
     `https://nhbrc-payments.<you>.workers.dev/paystack/webhook`
   - Copy the Pay Page URL into `docs/app.js` `PAYSTACK_LINK` constant

9. **Test end-to-end** with a Paystack **test card** before going live:
   - Use `4084 0840 8408 4081` (Paystack test Visa)
   - You should receive a magic-link email within ~10 s
   - Tap it on your phone → app should reload with `?activate=` param → license stored → Master Quiz unlocks

## What this gives you

- A working SA-card checkout
- Secure license issuance (HMAC-signed, stored client-side in localStorage)
- Magic-link email flow (no passwords, no signup form)
- Free tier covers ~100 paying users/day comfortably; scales linearly

## What it deliberately doesn't do

- No subscriptions/recurring billing — explicit one-off lifetime model
- No anti-piracy beyond signature check — the Master Quiz is gated on the
  client; a determined user can edit localStorage. That's fine for this audience
  and price point. If piracy becomes a real problem, add a server-side
  validation endpoint and rate-limit by license key.
- No refund automation — manual via Paystack dashboard

## Going live checklist

- [ ] Switch Paystack from test mode to live mode (new `sk_live_...` secret)
- [ ] Update `from:` email in `worker.js` to a verified domain in Resend
- [ ] Add a Privacy Policy + Terms link to your Paystack page (already in app at `/#legal`)
- [ ] Set up a custom domain (Cloudflare Pages → connect to GitHub → CNAME your domain)
- [ ] First 50 buyers at R 199 founder pricing — change `PAYSTACK_LINK` to a discounted Pay Page
