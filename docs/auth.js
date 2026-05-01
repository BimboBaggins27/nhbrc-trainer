// NHBRC Trainer — auth + user accounts.
//
// Two modes:
//   1. Local mode (default) — accounts stored in localStorage on this device.
//      6-digit verification code is shown directly in the UI (dev / no-backend).
//   2. Backend mode — when AUTH_API is set to a Cloudflare Worker URL, signup
//      and verification go through the server and a real email is sent.
//
// Passwords are hashed client-side with PBKDF2-SHA256 (250k iters) before
// being stored, so even the local mode never keeps plaintext.
//
// Public API on window.NHBRC_AUTH:
//   signup(email, password)   → { ok, code? } (code returned in local mode)
//   verify(email, code)       → { ok }
//   login(email, password)    → { ok, user? }
//   logout()
//   currentUser()             → { email, name, verified, createdAt } | null
//   isAuthenticated()         → bool
//   subscribe(fn)             → unsubscribe — fn called on auth state change

(function () {
  const USERS_KEY = 'nhbrc.users.v1';
  const SESSION_KEY = 'nhbrc.session.v1';
  const PENDING_KEY = 'nhbrc.pending.v1';
  const AUTH_API = ''; // e.g. 'https://nhbrc-payments.<you>.workers.dev'
  // Master account — auto-seeded on first run. Has 'master' role: bypasses
  // the paywall, sees the user list, can grant comp licenses.
  const MASTER_USERNAME = 'RU1';
  const MASTER_PASSWORD = 'RU1';
  const subs = new Set();

  function load(k, def) {
    try { return JSON.parse(localStorage.getItem(k)) ?? def; }
    catch { return def; }
  }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function del(k) { localStorage.removeItem(k); }
  function notify() { for (const fn of subs) try { fn(); } catch {} }

  async function hashPassword(pw, saltHex) {
    const enc = new TextEncoder();
    const salt = saltHex
      ? Uint8Array.from(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
      : crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      baseKey, 256,
    );
    const hex = (b) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    return { salt: [...salt].map(x => x.toString(16).padStart(2, '0')).join(''), hash: hex(bits) };
  }

  function code6() {
    const buf = new Uint32Array(1); crypto.getRandomValues(buf);
    return String(buf[0] % 1000000).padStart(6, '0');
  }

  function validEmail(e) { return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
  function normalizeId(s) { return (s || '').trim().toLowerCase(); }
  function isMasterId(s) {
    return normalizeId(s) === MASTER_USERNAME.toLowerCase();
  }

  // Auto-seed master user on first run (idempotent — only runs if missing).
  async function seedMaster() {
    const users = load(USERS_KEY, {});
    const k = MASTER_USERNAME.toLowerCase();
    if (users[k]) return;
    const { salt, hash } = await hashPassword(MASTER_PASSWORD);
    users[k] = {
      id: k, username: MASTER_USERNAME, email: null,
      salt, hash, verified: true, role: 'master',
      createdAt: new Date().toISOString(),
    };
    save(USERS_KEY, users);
  }
  // Fire-and-forget; await-safe everywhere because it's idempotent.
  seedMaster();

  // ---------- public API ----------

  async function signup(email, password) {
    email = (email || '').trim().toLowerCase();
    if (!validEmail(email)) return { ok: false, error: 'Enter a valid email.' };
    if (isMasterId(email)) return { ok: false, error: 'That username is reserved.' };
    if (!password || password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };

    if (AUTH_API) {
      const r = await fetch(`${AUTH_API}/auth/signup`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      return { ok: r.ok, ...j };
    }

    const users = load(USERS_KEY, {});
    if (users[email] && users[email].verified) {
      return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    }
    const { salt, hash } = await hashPassword(password);
    const code = code6();
    const pending = load(PENDING_KEY, {});
    pending[email] = { salt, hash, code, expiresAt: Date.now() + 30 * 60 * 1000 };
    save(PENDING_KEY, pending);
    return { ok: true, code, devMode: true };
  }

  async function verify(email, code) {
    email = (email || '').trim().toLowerCase();
    code = (code || '').replace(/\s+/g, '');
    if (AUTH_API) {
      const r = await fetch(`${AUTH_API}/auth/verify`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const j = await r.json();
      if (r.ok) {
        save(SESSION_KEY, j.user || { email, verified: true, createdAt: new Date().toISOString() });
        notify();
      }
      return { ok: r.ok, ...j };
    }
    const pending = load(PENDING_KEY, {});
    const p = pending[email];
    if (!p) return { ok: false, error: 'No pending signup for this email — sign up again.' };
    if (Date.now() > p.expiresAt) {
      delete pending[email]; save(PENDING_KEY, pending);
      return { ok: false, error: 'Verification code expired — sign up again.' };
    }
    if (p.code !== code) return { ok: false, error: 'Wrong code. Try again.' };
    const users = load(USERS_KEY, {});
    users[email] = {
      email, salt: p.salt, hash: p.hash, verified: true,
      createdAt: new Date().toISOString(),
    };
    save(USERS_KEY, users);
    delete pending[email]; save(PENDING_KEY, pending);
    save(SESSION_KEY, { email, verified: true, createdAt: users[email].createdAt });
    notify();
    return { ok: true };
  }

  async function login(emailOrUsername, password) {
    const id = normalizeId(emailOrUsername);
    if (!id) return { ok: false, error: 'Enter your email or username.' };
    // Permit either an email OR the master username.
    if (!validEmail(id) && !isMasterId(id)) {
      return { ok: false, error: 'Use a valid email (or your username).' };
    }
    if (AUTH_API && !isMasterId(id)) {
      const r = await fetch(`${AUTH_API}/auth/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (r.ok) { save(SESSION_KEY, j.user); notify(); }
      return { ok: r.ok, ...j };
    }
    // For master, ensure the seed has run before lookup
    if (isMasterId(id)) await seedMaster();
    const users = load(USERS_KEY, {});
    const u = users[id];
    if (!u) return { ok: false, error: 'No account found.' };
    const { hash } = await hashPassword(password, u.salt);
    if (hash !== u.hash) return { ok: false, error: 'Wrong password.' };
    const session = {
      id: u.id || id,
      username: u.username || null,
      email: u.email || null,
      role: u.role || 'user',
      verified: !!u.verified,
      createdAt: u.createdAt,
      lastLoginAt: new Date().toISOString(),
    };
    save(SESSION_KEY, session);
    notify();
    return { ok: true, user: session };
  }

  function isMaster() {
    const u = currentUser();
    return !!(u && u.role === 'master');
  }
  function listUsers() {
    const u = currentUser();
    if (!u || u.role !== 'master') return [];
    const users = load(USERS_KEY, {});
    return Object.values(users).map(x => ({
      id: x.id || x.email,
      username: x.username || null,
      email: x.email || null,
      role: x.role || 'user',
      verified: !!x.verified,
      createdAt: x.createdAt,
    }));
  }

  function logout() {
    del(SESSION_KEY);
    notify();
  }

  function currentUser() {
    return load(SESSION_KEY, null);
  }

  function isAuthenticated() {
    const u = currentUser();
    return !!(u && u.verified);
  }

  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

  function userCount() {
    return Object.keys(load(USERS_KEY, {})).length;
  }

  window.NHBRC_AUTH = {
    signup, verify, login, logout, currentUser, isAuthenticated,
    isMaster, listUsers,
    subscribe, userCount,
    hasBackend: !!AUTH_API,
  };
})();
