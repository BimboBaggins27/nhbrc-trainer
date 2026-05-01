# Security policy

## Reporting a vulnerability

If you believe you have found a security issue in NHBRC Trainer, please **do
not open a public GitHub issue**. Instead, report it privately:

- GitHub Security Advisory: https://github.com/BimboBaggins27/nhbrc-trainer/security/advisories/new
- Or open a regular Issue with the title `Security — please contact me` and we'll
  exchange details over a private channel.

We aim to acknowledge within **3 business days** and to issue a fix within
**14 days** for critical issues.

## Scope

In scope:

- The static PWA hosted from this repo at https://bimbobaggins27.github.io/nhbrc-trainer/
- The Cloudflare Worker scaffold at `payments/worker.js` (when deployed)
- Auth + license logic in `docs/auth.js` and `docs/license.js`
- Content Security Policy configuration in `docs/index.html`

Out of scope:

- Third-party services (GitHub Pages, Anthropic API, Paystack, Resend) — please
  report directly to those vendors
- Vulnerabilities that require physical access to a user's device
- Social-engineering attacks not specific to the app

## What we have done

- HTTPS enforced via GitHub Pages (`https_enforced: true`)
- CSP meta tag restricting script / style / connect sources
- No HTTP cookies; per-device localStorage only
- Passwords hashed client-side with PBKDF2-SHA256, 250 000 iterations
- No third-party trackers, analytics or advertising scripts
- Service Worker scope limited to the app's own origin
- Master role granted at signup time, not from a hardcoded credential
- All secrets (Paystack, Anthropic, Resend) live as Cloudflare Worker secrets,
  never in the client bundle

## Things to disclose to us

- XSS / CSP bypass
- Auth or session-handling weaknesses
- Service-worker cache poisoning
- Any way to escalate from a normal user to the `master` role
- Any data leak through the AI tutor proxy
- Vulnerabilities introduced by dependencies (we have very few — `peter-evans/*`
  GitHub Actions are the main third-party code)

Thank you for helping keep this project safe.
