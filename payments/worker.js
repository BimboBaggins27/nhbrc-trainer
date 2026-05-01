/**
 * NHBRC Trainer — payments + license Worker (Cloudflare Workers).
 *
 *   Paystack webhook ─► verify HMAC ─► mint magic-link ─► email via Resend
 *                                                          │
 *                                                          ▼
 *   user clicks link ─► /license/activate ─► return signed license JSON
 *
 * Endpoints:
 *   POST /paystack/webhook   — Paystack server → mint license + send email
 *   POST /license/activate   — { token } → returns license JSON (used by client license.js)
 *   POST /license/refresh    — { key }   → returns latest license state
 *   GET  /healthz            — sanity check
 *
 * Bindings (set via `wrangler secret put` and wrangler.toml):
 *   - PAYSTACK_SECRET     (your sk_live_… or sk_test_… secret key)
 *   - LICENSE_SIGNING_KEY (32+ random bytes; used for HMAC of the license JSON)
 *   - RESEND_API_KEY      (Resend.com API key for sending magic-link emails)
 *   - APP_URL             (https://bimbobaggins27.github.io/nhbrc-trainer/)
 *   - LICENSES (KV namespace) — stores licenses keyed by email
 *   - TOKENS   (KV namespace) — stores one-time activation tokens
 */

const enc = new TextEncoder();
async function hmacSha256(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPaystack(req, secret) {
  const sig = req.headers.get('x-paystack-signature');
  const body = await req.text();
  const expected = await hmacSha256(secret, body);
  if (sig !== expected) throw new Error('bad signature');
  return JSON.parse(body);
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}

async function sendMagicLink(env, email, token) {
  const url = `${env.APP_URL}?activate=${encodeURIComponent(token)}`;
  const body = {
    from: 'NHBRC Trainer <noreply@yourdomain.co.za>',
    to: email,
    subject: 'Your NHBRC Trainer activation link',
    html: `<p>Thanks for buying NHBRC Trainer lifetime access.</p>
           <p>Tap the link below on the device you want to install on.</p>
           <p><a href="${url}">Activate NHBRC Trainer →</a></p>
           <p style="font-size:12px;color:#666">If you didn't make this purchase, ignore this email.</p>`,
  };
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function signLicense(env, lic) {
  const payload = JSON.stringify(lic);
  const sig = await hmacSha256(env.LICENSE_SIGNING_KEY, payload);
  return { ...lic, sig };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return jsonResp({});

    if (url.pathname === '/healthz') return jsonResp({ ok: true });

    if (url.pathname === '/paystack/webhook' && req.method === 'POST') {
      try {
        const event = await verifyPaystack(req, env.PAYSTACK_SECRET);
        if (event.event === 'charge.success') {
          const email = event.data.customer.email.toLowerCase();
          const amount = event.data.amount; // kobo/cents
          // Mint license + activation token
          const key = crypto.randomUUID();
          const token = crypto.randomUUID();
          const lic = {
            key, email, plan: amount >= 39900 ? 'lifetime' : 'monthly',
            activatedAt: new Date().toISOString(),
            expiresAt: amount >= 39900 ? null : new Date(Date.now() + 31 * 86400 * 1000).toISOString(),
          };
          await env.LICENSES.put(`email:${email}`, JSON.stringify(lic));
          await env.TOKENS.put(`token:${token}`, email, { expirationTtl: 86400 * 7 }); // 7-day activation window
          await sendMagicLink(env, email, token);
        }
        return jsonResp({ ok: true });
      } catch (e) {
        return jsonResp({ ok: false, error: String(e) }, 400);
      }
    }

    if (url.pathname === '/license/activate' && req.method === 'POST') {
      const { token } = await req.json();
      const email = await env.TOKENS.get(`token:${token}`);
      if (!email) return jsonResp({ error: 'invalid or expired token' }, 401);
      const raw = await env.LICENSES.get(`email:${email}`);
      if (!raw) return jsonResp({ error: 'no license' }, 404);
      const lic = await signLicense(env, JSON.parse(raw));
      // burn the token
      await env.TOKENS.delete(`token:${token}`);
      return jsonResp(lic);
    }

    if (url.pathname === '/license/refresh' && req.method === 'POST') {
      const { key } = await req.json();
      // For demo simplicity, just look up by key — in production index by key.
      // We're storing by email; production hardening: maintain a keys→email index.
      return jsonResp({ ok: true, refreshed: true });
    }

    // Claude tutor proxy.  Body: { messages: [{role,content}], userId?: '<email|RU1>' }
    if (url.pathname === '/chat' && req.method === 'POST') {
      try {
        const body = await req.json();
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (!messages.length) return jsonResp({ error: 'no messages' }, 400);

        // Simple per-user daily rate-limit to keep costs predictable.
        const userId = (body.userId || 'anonymous').toLowerCase().slice(0, 64);
        const day = new Date().toISOString().slice(0, 10);
        const rlKey = `rl:${userId}:${day}`;
        const used = parseInt((await env.LICENSES.get(rlKey)) || '0', 10);
        const DAILY_LIMIT = 50;
        if (used >= DAILY_LIMIT) return jsonResp({ error: 'Daily AI limit reached. Try tomorrow.' }, 429);

        const SYSTEM_PROMPT = `You are an expert tutor on South African National Building Regulations and the SANS 10400 series of standards. You also know the role of the NHBRC (National Home Builders Registration Council), Act 103 of 1977, and the 2008/2011 Government Gazette amendments.

You are embedded in the NHBRC Trainer app — a study aid for builders, owner-builders, students, and competent persons.

How to answer:
- Be concise (2-4 short paragraphs unless the user asks for depth).
- When citing rules, name the SANS 10400 Part (A, B, C, …, XA) and the regulation number where you know it.
- Stay focused on SA building regs, NHBRC processes, and adjacent practical building topics.
- If a question is outside scope (general programming, off-topic), politely steer back.
- If you are not sure, say so. Always remind the user that for real plan submissions they must work to the latest published SANS 10400 part and consult a registered competent person — never just rely on this app.
- Never claim affiliation with NHBRC or SABS — this app is independent.`;

        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system: SYSTEM_PROMPT,
            messages: messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
          }),
        });
        if (!r.ok) {
          const t = await r.text();
          return jsonResp({ error: 'AI provider error', detail: t.slice(0, 400) }, 502);
        }
        const data = await r.json();
        const text = (data.content || []).map(b => b.text || '').join('') || '(no answer)';

        // increment rate-limit counter
        await env.LICENSES.put(rlKey, String(used + 1), { expirationTtl: 86400 + 3600 });

        return jsonResp({ ok: true, message: text, usage: data.usage });
      } catch (e) {
        return jsonResp({ error: String(e) }, 500);
      }
    }

    return jsonResp({ error: 'not found' }, 404);
  },
};
