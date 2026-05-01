// NHBRC Trainer — AI tutor overlay (Claude via Cloudflare Worker proxy).
//
// The Anthropic API key NEVER touches the browser. All requests go to the
// Worker at `${CHAT_API}/chat`, which holds the key as a secret.
//
// Until the Worker is deployed, this stays in demo mode and shows a clear
// "wire up the backend" message instead of failing.

(function () {
  const CHAT_API = ''; // e.g. 'https://nhbrc-payments.<you>.workers.dev'
  const STORE_KEY = 'nhbrc.chat.v1';
  const MAX_TURNS = 20;

  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } }
  function save(arr) { localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(-MAX_TURNS))); }
  function clear() { localStorage.removeItem(STORE_KEY); }
  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Lightweight markdown for assistant replies: headings, bold, italics, lists, line breaks.
  function renderMd(s) {
    s = escapeHtml(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    s = s.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    s = s.replace(/^\- (.+)$/gm, '<li>$1</li>');
    s = s.replace(/(?:<li>.*<\/li>\s*)+/g, m => `<ul>${m}</ul>`);
    s = s.replace(/\n{2,}/g, '</p><p>');
    s = s.replace(/\n/g, '<br/>');
    return `<p>${s}</p>`;
  }

  function ensureUI() {
    if (document.getElementById('chatFab')) return;
    const fab = document.createElement('button');
    fab.id = 'chatFab';
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'Ask AI');
    fab.innerHTML = '<span class="chat-fab-icon">💬</span><span class="chat-fab-label">Ask AI</span>';
    document.body.appendChild(fab);

    const overlay = document.createElement('div');
    overlay.id = 'chatOverlay';
    overlay.className = 'chat-overlay hidden';
    overlay.innerHTML = `
      <div class="chat-panel" role="dialog" aria-label="AI tutor">
        <header class="chat-head">
          <span>🤖 AI Tutor</span>
          <button class="chat-close" aria-label="Close">×</button>
        </header>
        <div class="chat-thread" id="chatThread"></div>
        <div class="chat-suggest" id="chatSuggest">
          <button class="chip-btn" data-q="What is occupancy classification A20?">A20 occupancy?</button>
          <button class="chip-btn" data-q="What's the minimum ceiling height in a habitable room?">Min ceiling height?</button>
          <button class="chip-btn" data-q="When must the NHBRC enrol a home?">NHBRC enrolment?</button>
          <button class="chip-btn" data-q="Difference between Part B and Part H?">Part B vs Part H?</button>
        </div>
        <form class="chat-input" id="chatForm">
          <textarea id="chatText" rows="1" placeholder="Ask about SANS 10400, NHBRC, plans, foundations…" autocomplete="off"></textarea>
          <button type="submit" class="btn primary" id="chatSend">Send</button>
        </form>
        <div class="chat-foot">
          <button class="btn-link" id="chatClear">Clear conversation</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    fab.addEventListener('click', open);
    overlay.querySelector('.chat-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#chatForm').addEventListener('submit', onSubmit);
    overlay.querySelectorAll('#chatSuggest .chip-btn').forEach(b =>
      b.addEventListener('click', () => { document.getElementById('chatText').value = b.dataset.q; onSubmit(); }));
    document.getElementById('chatClear').addEventListener('click', () => {
      if (confirm('Clear this conversation?')) { clear(); renderThread(); }
    });
    document.getElementById('chatText').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); }
    });
  }

  function syncFab() {
    const fab = document.getElementById('chatFab');
    if (!fab) return;
    const authed = window.NHBRC_AUTH && window.NHBRC_AUTH.isAuthenticated();
    fab.classList.toggle('hidden', !authed);
  }

  function open() {
    const ov = document.getElementById('chatOverlay');
    ov.classList.remove('hidden');
    renderThread();
    setTimeout(() => document.getElementById('chatText').focus(), 50);
  }
  function close() { document.getElementById('chatOverlay').classList.add('hidden'); }

  function renderThread() {
    const thread = document.getElementById('chatThread');
    if (!thread) return;
    const turns = load();
    if (!turns.length) {
      thread.innerHTML = `<div class="chat-empty">
        <p>👋 Ask me anything about SANS 10400, NHBRC, building regs, plan submissions, foundations, fire, energy — pick a starter below or type your own.</p>
        ${CHAT_API ? '' : `<p class="meta">⚠️ Demo mode — answers are stubbed because no AI backend is wired. Deploy <code>payments/worker.js</code> and set <code>CHAT_API</code> in <code>chat.js</code> to enable real Claude responses.</p>`}
      </div>`;
      return;
    }
    thread.innerHTML = turns.map(t => `
      <div class="chat-msg chat-msg-${t.role}">
        <div class="chat-bubble">${t.role === 'assistant' ? renderMd(t.content) : escapeHtml(t.content)}</div>
      </div>`).join('') + (chatBusy ? `<div class="chat-msg chat-msg-assistant"><div class="chat-bubble chat-typing"><span></span><span></span><span></span></div></div>` : '');
    thread.scrollTop = thread.scrollHeight;
  }

  let chatBusy = false;

  async function ask(question) {
    const turns = load();
    turns.push({ role: 'user', content: question });
    save(turns);
    chatBusy = true;
    renderThread();

    const userId = window.NHBRC_AUTH?.currentUser?.()?.email
      || window.NHBRC_AUTH?.currentUser?.()?.username
      || 'anonymous';

    let assistantText = '';
    if (!CHAT_API) {
      // Demo / no-backend mode — explain the situation gracefully.
      assistantText = `**Demo mode — no AI backend wired.**

To enable real Claude answers:

1. Deploy the Cloudflare Worker per \`payments/README.md\`.
2. Set the \`ANTHROPIC_API_KEY\` secret with your Anthropic key.
3. Open \`docs/chat.js\` and set \`CHAT_API\` to your Worker URL.

In the meantime, the rest of the app — modules, glossary, master quiz, library — works fully offline.`;
    } else {
      try {
        const r = await fetch(`${CHAT_API}/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: load(), userId }),
        });
        const data = await r.json();
        if (!r.ok) {
          assistantText = `⚠️ ${data.error || 'AI error.'}${data.detail ? '\n\n' + data.detail : ''}`;
        } else {
          assistantText = data.message || '(no answer)';
        }
      } catch (e) {
        assistantText = `⚠️ Network error reaching the AI backend.\n\n${e.message || e}`;
      }
    }

    chatBusy = false;
    const next = load();
    next.push({ role: 'assistant', content: assistantText });
    save(next);
    renderThread();
  }

  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (chatBusy) return;
    const ta = document.getElementById('chatText');
    const q = (ta.value || '').trim();
    if (!q) return;
    ta.value = '';
    ask(q);
  }

  // Public API
  window.NHBRC_CHAT = { open, close, clear, hasBackend: !!CHAT_API };

  // Mount FAB once DOM is ready, then refresh visibility on auth changes.
  document.addEventListener('DOMContentLoaded', () => {
    ensureUI();
    syncFab();
    if (window.NHBRC_AUTH && window.NHBRC_AUTH.subscribe) window.NHBRC_AUTH.subscribe(syncFab);
  });
})();
