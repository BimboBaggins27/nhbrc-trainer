// NHBRC Trainer — local search-based AI tutor.
//
// Zero backend, zero API cost, zero data leaving the device.
// Builds a TF-IDF-ish index over the app's content (modules, glossary,
// quiz explanations, library article titles) and answers user questions
// by ranking relevant snippets and citing their source.

(function () {
  const STORE_KEY = 'nhbrc.chat.v1';
  const MAX_TURNS = 20;
  const STOPWORDS = new Set('a an and are as at be but by can do does for from has have how i if in is it its me my no not of on or our should so that the their there they this to was we what when where which who why will with you your'.split(' '));

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
        <p>👋 Ask anything about the trainer's content — modules, glossary, quiz explanations, legal framework, library.</p>
        <p class="meta">Local search: no API, no internet needed, nothing leaves your device. Pick a starter or type your own.</p>
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

  // ---------- Local search index ----------
  let CORPUS = null;       // [{id, type, title, body, source, link, tokens, tf}]
  let DF = null;           // term -> doc count
  let TOTAL_DOCS = 0;

  function tokenize(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter(t => t && t.length > 1 && !STOPWORDS.has(t));
  }

  function buildIndex() {
    if (CORPUS) return;
    CORPUS = [];

    const D = window.NHBRC_DATA;
    if (D) {
      // Modules — index each section as its own doc
      for (const m of (D.modules || [])) {
        const title = `${m.icon || ''} ${m.title}`.trim();
        for (const [si, s] of (m.sections || []).entries()) {
          const parts = [s.h, s.p, (s.list || []).join('. '), s.text, s.caption].filter(Boolean);
          const body = parts.join(' ');
          if (!body || body.length < 20) continue;
          CORPUS.push({
            id: `mod:${m.id}:${si}`,
            type: 'module',
            title: `${title}${s.h ? ' — ' + s.h : ''}`,
            body,
            source: m.tag ? `Module · ${m.tag}` : 'Module',
            link: { route: 'module', payload: m.id },
          });
        }
      }
      // Glossary
      for (const t of (D.glossary || [])) {
        CORPUS.push({
          id: `gl:${t.term}`,
          type: 'glossary',
          title: t.term,
          body: t.defn,
          source: 'Glossary',
          link: { route: 'glossary', payload: null },
        });
      }
      // Quiz explanations — best source of one-line factual answers
      for (const q of (D.quizzes || [])) {
        const m = (D.modules || []).find(x => x.id === q.moduleId);
        for (const [qi, qq] of q.questions.entries()) {
          CORPUS.push({
            id: `qz:${q.moduleId}:${qi}`,
            type: 'quiz',
            title: qq.q,
            body: `${qq.q} ${qq.why} Correct answer: ${qq.opts[qq.a]}.`,
            source: m ? `Quiz · ${m.title}` : 'Quiz',
            link: { route: 'quiz', payload: q.moduleId },
          });
        }
      }
      // About — laws + methodology
      for (const law of ((D.about || {}).laws || [])) {
        CORPUS.push({
          id: `law:${law.name}`,
          type: 'law',
          title: law.name,
          body: `${law.name}. ${law.role}`,
          source: 'Legal framework',
          link: { route: 'about', payload: null },
        });
      }
    }
    // Public-domain NBR clauses — full text per regulation
    const R = window.NHBRC_REGS || { byModule: {} };
    for (const mid of Object.keys(R.byModule || {})) {
      for (const r of R.byModule[mid]) {
        CORPUS.push({
          id: `reg:${r.ref}`,
          type: 'regulation',
          title: `${r.ref} — ${r.title}`,
          body: r.text,
          source: 'NBR 2008 (public domain)',
          link: { route: 'module', payload: mid },
        });
      }
    }

    // Library articles — title + category only (we don't bundle the body)
    const L = window.NHBRC_LIBRARY || {};
    for (const a of (L.articles || [])) {
      CORPUS.push({
        id: `art:${a.id}`,
        type: 'article',
        title: a.title,
        body: `${a.title}. ${(a.categories || []).join(', ')}`,
        source: 'sans10400.co.za',
        link: { external: a.url },
      });
    }
    // External buy/get links
    for (const d of (L.externalDocs || [])) {
      CORPUS.push({
        id: `ext:${d.title}`,
        type: 'external',
        title: d.title,
        body: `${d.title}. ${d.note} Publisher: ${d.publisher}.`,
        source: d.publisher,
        link: { external: d.url },
      });
    }

    // Tokenise + tf
    DF = {};
    for (const d of CORPUS) {
      const tokens = tokenize(d.title + ' ' + d.body);
      const tf = {};
      for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
      d.tokens = tokens; d.tf = tf;
      for (const t of new Set(tokens)) DF[t] = (DF[t] || 0) + 1;
    }
    TOTAL_DOCS = CORPUS.length;
  }

  function search(query, k = 5) {
    buildIndex();
    const qts = tokenize(query);
    if (!qts.length) return [];
    const titleBoost = (d, t) => (d.title.toLowerCase().includes(t) ? 4 : 0);
    const exactPhraseBoost = (d) => (d.title.toLowerCase().includes(query.toLowerCase().trim()) ? 25 :
                                      d.body.toLowerCase().includes(query.toLowerCase().trim()) ? 8 : 0);
    const typeBoost = { regulation: 1.15, module: 1.0, quiz: 0.95, glossary: 1.05, law: 0.85, article: 0.6, external: 0.5 };

    const scored = [];
    for (const d of CORPUS) {
      let s = 0;
      for (const t of qts) {
        const tf = d.tf[t] || 0;
        if (!tf) continue;
        const idf = Math.log((TOTAL_DOCS + 1) / ((DF[t] || 0) + 1)) + 1;
        s += (Math.log(1 + tf) + titleBoost(d, t)) * idf;
      }
      s += exactPhraseBoost(d);
      s *= (typeBoost[d.type] || 1);
      if (s > 0) scored.push({ d, s });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, k);
  }

  function snippet(doc, query, max = 240) {
    const body = doc.body || '';
    const ql = query.toLowerCase();
    let i = body.toLowerCase().indexOf(ql);
    if (i < 0) {
      // fall back to first matching term
      for (const t of tokenize(query)) {
        const j = body.toLowerCase().indexOf(t);
        if (j >= 0) { i = j; break; }
      }
    }
    if (i < 0) i = 0;
    const start = Math.max(0, i - 60);
    const end = Math.min(body.length, start + max);
    let s = body.slice(start, end).trim();
    if (start > 0) s = '… ' + s;
    if (end < body.length) s = s + ' …';
    return s;
  }

  function answer(query) {
    const hits = search(query, 5);
    if (!hits.length) {
      return `I couldn't find anything matching **${escapeHtml(query)}** in the trainer's content.

Try rephrasing — the search looks at module text, glossary, quiz explanations, the legal-framework list, and the curated article index. For anything beyond that, the official sources are linked from the **Library** tab (SABS, NHBRC, ARC).`;
    }
    const top = hits[0];
    const others = hits.slice(1);
    const intro = `**Closest match: ${escapeHtml(top.d.title)}** _(${escapeHtml(top.d.source)})_

${escapeHtml(snippet(top.d, query))}`;
    let related = '';
    if (others.length) {
      related = `\n\n**Other relevant content:**\n\n` +
        others.map(h => `- **${escapeHtml(h.d.title)}** _(${escapeHtml(h.d.source)})_ — ${escapeHtml(snippet(h.d, query, 140))}`).join('\n');
    }
    const reminder = `\n\n_Reminder: study aid only. For real plan submissions, work to the latest published SANS 10400 part and the NHBRC Home Building Manual._`;
    return intro + related + reminder;
  }

  async function ask(question) {
    const turns = load();
    turns.push({ role: 'user', content: question });
    save(turns);
    chatBusy = true;
    renderThread();

    // 60ms cosmetic delay so the typing dots are visible
    await new Promise(r => setTimeout(r, 200));
    const text = answer(question);

    chatBusy = false;
    const next = load();
    next.push({ role: 'assistant', content: text });
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
  window.NHBRC_CHAT = { open, close, clear, search, answer };

  // Mount FAB once DOM is ready, then refresh visibility on auth changes.
  document.addEventListener('DOMContentLoaded', () => {
    ensureUI();
    syncFab();
    if (window.NHBRC_AUTH && window.NHBRC_AUTH.subscribe) window.NHBRC_AUTH.subscribe(syncFab);
  });
})();
