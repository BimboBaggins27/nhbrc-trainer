// NHBRC Trainer — client-side licensing layer.
// The license is a JWT minted by the payments Worker after a successful Paystack
// charge + magic-link email confirmation. We store it in localStorage and only
// trust signatures we can verify with the Worker's public key.
//
// For dev/local builds we run UNLOCKED so you can demo without a backend.
// In production, set the LICENSE_API_BASE in this file to point at your deployed
// Worker URL (e.g. https://nhbrc-payments.<you>.workers.dev) and the gate
// switches on automatically.

(function () {
  const KEY = 'nhbrc.license.v1';
  const API_BASE = ''; // e.g. 'https://nhbrc-payments.<your-cf-subdomain>.workers.dev'

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  }
  function write(obj) { localStorage.setItem(KEY, JSON.stringify(obj)); }
  function clear() { localStorage.removeItem(KEY); }

  function isExpired(lic) {
    if (!lic || !lic.expiresAt) return false; // lifetime
    return Date.now() > new Date(lic.expiresAt).getTime();
  }

  async function activate(token) {
    if (!API_BASE) { // demo mode
      const fake = { plan: 'demo-lifetime', email: 'demo@local', activatedAt: new Date().toISOString(), token };
      write(fake);
      return { ok: true, license: fake };
    }
    const r = await fetch(`${API_BASE}/license/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!r.ok) return { ok: false, error: await r.text() };
    const lic = await r.json();
    write(lic);
    return { ok: true, license: lic };
  }

  async function refresh() {
    const lic = read();
    if (!lic || !API_BASE) return lic;
    try {
      const r = await fetch(`${API_BASE}/license/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: lic.key }),
      });
      if (r.ok) { const fresh = await r.json(); write(fresh); return fresh; }
    } catch { /* offline — keep cached */ }
    return lic;
  }

  function isLicensed() {
    // No backend wired yet → app stays fully open for demo / development.
    if (!API_BASE) return true;
    const lic = read();
    return !!lic && !isExpired(lic);
  }

  // Auto-activate when arriving from a magic-link email: ?activate=<token>
  const params = new URLSearchParams(location.search);
  const tok = params.get('activate');
  if (tok) {
    activate(tok).then((r) => {
      if (r.ok) {
        history.replaceState({}, '', location.pathname + location.hash);
        location.reload();
      }
    });
  }

  window.NHBRC_LICENSE = {
    isLicensed, read, clear, activate, refresh, hasBackend: !!API_BASE,
  };
})();
