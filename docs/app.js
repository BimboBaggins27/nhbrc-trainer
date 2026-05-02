(() => {
  const D = window.NHBRC_DATA;
  const L = window.NHBRC_LIBRARY || { articles: [], pdfs: [], byModule: {} };
  const A = window.NHBRC_AUTH;
  const articleById = Object.fromEntries((L.articles || []).map(a => [a.id, a]));

  // Merge quiz-extra.js questions into D.quizzes once, at startup.
  // For modules without a base quiz entry, auto-create one so every module
  // shows up on the Quiz tab.
  (function mergeExtras() {
    const extra = window.NHBRC_QUIZ_EXTRA || {};
    for (const mid of Object.keys(extra)) {
      let q = D.quizzes.find(x => x.moduleId === mid);
      if (!q) {
        const m = D.modules.find(x => x.id === mid);
        q = { moduleId: mid, title: m ? m.title : mid, questions: [] };
        D.quizzes.push(q);
      }
      q.questions = q.questions.concat(extra[mid]);
    }
  })();

  // Single source of truth for module order — used by home, quiz list,
  // progress, and regulations. Follows SANS 10400 / NBR alphabet:
  //   Intro → Part A admin → Parts B → XA in standard order → workflow → warranty
  const MODULE_ORDER = [
    'intro', 'parts',
    'occupancy', 'plans', 'competent',
    'structural', 'dimensions',
    'publicsafety', 'demolition', 'siteops',
    'excavations', 'foundations', 'floors',
    'walls', 'roofs', 'stairs',
    'glazing', 'lightvent',
    'drainage', 'nonwater', 'stormwater',
    'disabled',
    'fire', 'refuse', 'spaceheat', 'fireinst',
    'energy',
    'process', 'warranty',
  ];
  const ORDER_INDEX = Object.fromEntries(MODULE_ORDER.map((id, i) => [id, i]));
  function moduleOrderKey(id) { return ORDER_INDEX[id] ?? 999; }
  // Sort the in-memory copies once at startup so every view sees the same order.
  D.modules.sort((a, b) => moduleOrderKey(a.id) - moduleOrderKey(b.id));
  D.quizzes.sort((a, b) => moduleOrderKey(a.moduleId) - moduleOrderKey(b.moduleId));

  // Shuffle answer options of a question while keeping `a` (correct index)
  // pointing at the right option afterwards.
  function shuffleOpts(qq) {
    const order = qq.opts.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      ...qq,
      opts: order.map(i => qq.opts[i]),
      a: order.indexOf(qq.a),
    };
  }
  const view = document.getElementById('view');
  const titleEl = document.getElementById('title');
  const backBtn = document.getElementById('backBtn');
  const installBtn = document.getElementById('installBtn');
  const accountBtn = document.getElementById('accountBtn');
  const tabs = document.querySelectorAll('.tab');
  const STORE_KEY = 'nhbrc.progress.v1';

  const store = {
    load() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
      catch { return {}; }
    },
    save(state) { localStorage.setItem(STORE_KEY, JSON.stringify(state)); },
    markRead(modId) {
      const s = this.load();
      s.read = s.read || {};
      s.read[modId] = Date.now();
      this.save(s);
    },
    saveQuiz(modId, score, total) {
      const s = this.load();
      s.quizzes = s.quizzes || {};
      const prev = s.quizzes[modId];
      if (!prev || score > prev.best) {
        s.quizzes[modId] = { best: score, total, last: Date.now() };
      } else {
        s.quizzes[modId].last = Date.now();
      }
      this.save(s);
    }
  };

  const route = {
    current: { name: 'home', payload: null },
    history: [],
    go(name, payload) {
      this.history.push(this.current);
      this.current = { name, payload };
      render();
    },
    back() {
      if (!this.history.length) { this.go('home'); return; }
      this.current = this.history.pop();
      render();
    }
  };

  // ---------- Views ----------

  function viewHome() {
    const progress = store.load();
    titleEl.textContent = D.meta.title;
    backBtn.classList.add('hidden');
    setActiveTab('home');

    const totalMods = D.modules.length;
    const readMods = Object.keys(progress.read || {}).length;
    const s = streakTick();
    // Resume — last-read module
    const lastReadId = Object.entries(progress.read || {}).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const lastRead = lastReadId ? D.modules.find(m => m.id === lastReadId) : null;
    const next = D.modules.find(m => !(progress.read || {})[m.id]) || D.modules[0];
    const continueMod = lastRead || next;
    const mockHist = loadMockHistory();
    const bestMock = mockHist.reduce((m, h) => Math.max(m, h.correct), 0);

    // Show one-time disclaimer modal if not seen yet
    if (!localStorage.getItem('nhbrc.welcomeSeen.v1')) showWelcomeModal();

    let html = `
      <div class="status-line">
        <span><strong>${readMods}</strong>/${totalMods} modules</span>
        <span class="dot">·</span>
        <span><strong>🔥 ${s.streak || 0}</strong> ${s.streak===1?'day':'days'}</span>
        <span class="dot">·</span>
        <span><strong>${bestMock}</strong>/50 best mock</span>
      </div>

      ${continueMod ? `<a class="qa-card primary" data-action="open-module" data-id="${continueMod.id}">
        <div class="qa-icon">▶</div>
        <div class="qa-text"><div class="qa-eyebrow">${lastRead ? 'Continue' : 'Start with'}</div><div class="qa-title">${continueMod.icon} ${escapeHtml(continueMod.title)}</div></div>
      </a>` : ''}

      <a class="big-tile" data-action="go-modules">
        <div class="bt-icon">📘</div>
        <div class="bt-text"><div class="bt-title">Modules</div><div class="bt-sub">${D.modules.length} study modules · Parts A → XA · ${readMods}/${totalMods} read</div></div>
        <div class="bt-chev">›</div>
      </a>
      <a class="big-tile" data-action="go-quizzes">
        <div class="bt-icon">❓</div>
        <div class="bt-text"><div class="bt-title">Quizzes</div><div class="bt-sub">Master Quiz · Mock NHBRC test · per-module quizzes</div></div>
        <div class="bt-chev">›</div>
      </a>
      <a class="big-tile" data-action="go-glossary">
        <div class="bt-icon">🔤</div>
        <div class="bt-text"><div class="bt-title">Glossary</div><div class="bt-sub">${(D.glossary || []).length} key terms — searchable</div></div>
        <div class="bt-chev">›</div>
      </a>
    `;
    view.innerHTML = html;

    view.querySelectorAll('[data-action="open-module"]').forEach(el =>
      el.addEventListener('click', () => route.go('module', el.dataset.id)));
    view.querySelectorAll('[data-action="go-modules"]').forEach(el =>
      el.addEventListener('click', () => route.go('modules-list')));
    view.querySelectorAll('[data-action="go-quizzes"]').forEach(el =>
      el.addEventListener('click', () => route.go('quizlist')));
    view.querySelectorAll('[data-action="go-glossary"]').forEach(el =>
      el.addEventListener('click', () => route.go('glossary')));
    return; // new tile layout complete — skip the legacy module loop below
    /* eslint-disable */ // legacy below kept temporarily for reference
    for (const m of D.modules) {
      const wasRead = (progress.read || {})[m.id];
      const quiz = (progress.quizzes || {})[m.id];
      html += `
        <a class="card" data-action="open-module" data-id="${m.id}">
          <h3><span style="font-size:22px">${m.icon}</span> ${escapeHtml(m.title)}
            ${wasRead ? '<span class="badge">Read</span>' : ''}
            ${quiz ? `<span class="badge gold">${quiz.best}/${quiz.total}</span>` : ''}
          </h3>
          <div class="meta">${escapeHtml(m.summary)}</div>
          <div class="tag-row"><span class="tag">${m.tag}</span></div>
        </a>
      `;
    }
    view.innerHTML = html;
    view.querySelectorAll('[data-action="open-module"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        route.go('module', el.dataset.id);
      });
    });
    view.querySelectorAll('[data-action="about"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        route.go('about');
      });
    });
    view.querySelectorAll('[data-action="legal"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        route.go('legal');
      });
    });
  }

  function viewAbout() {
    const a = D.about;
    titleEl.textContent = 'About this guide';
    backBtn.classList.remove('hidden');
    setActiveTab('home');

    let html = `<article class="lesson">
      <div class="hero" style="background:linear-gradient(135deg,#0b6e3f,#0e8a4f)">
        <h2 style="margin:0 0 4px">📖 Information &amp; sources</h2>
        <p style="margin:0; opacity:.95">Where every fact in this app comes from.</p>
      </div>
      <p style="margin-top:14px">${escapeHtml(a.intro)}</p>

      <h3>📄 The source PDF</h3>
      <div class="source-pdf-card">
        <div class="src-pdf-icon">📕</div>
        <div class="src-pdf-body">
          <div class="src-pdf-title">${escapeHtml(a.sourcePdf.title)}</div>
          <div class="src-pdf-meta">${escapeHtml(a.sourcePdf.publisher)}</div>
          <div class="src-pdf-meta">${escapeHtml(a.sourcePdf.edition)}</div>
          <div class="src-pdf-meta src-pdf-stats">${a.sourcePdf.pages} pages · ${a.sourcePdf.sizeMb} MB</div>
          <a href="${escapeHtml(a.sourcePdf.url)}" target="_blank" rel="noopener" class="btn-link">↗ Open original PDF</a>
        </div>
      </div>

      <h3>⚖️ Legal framework</h3>
      <ul class="law-list">
        ${a.laws.map(l => `<li><strong>${escapeHtml(l.name)}</strong><br><span class="meta">${escapeHtml(l.role)}</span></li>`).join('')}
      </ul>

      <h3>📚 What's covered in this app</h3>
      <ul>${a.coverage.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>

      <h3>🛠️ How the content was prepared</h3>
      <ol class="method">${a.methodology.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ol>

      <div class="callout warn"><strong>Disclaimer.</strong> ${escapeHtml(a.disclaimer)}</div>

      <div class="meta" style="margin-top:14px; text-align:center">App version ${escapeHtml(D.meta.version)}</div>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;

    view.innerHTML = html;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
  }

  function viewModule(id) {
    const m = D.modules.find(x => x.id === id);
    if (!m) return route.go('home');
    titleEl.textContent = m.title;
    backBtn.classList.remove('hidden');
    setActiveTab('home');
    store.markRead(m.id);

    let html = `<article class="lesson">
      <h2><span style="font-size:24px">${m.icon}</span> ${escapeHtml(m.title)}</h2>
      <div class="clause">${m.tag} · ${escapeHtml(m.summary)}</div>`;

    for (const s of m.sections) {
      if (s.h) html += `<h3>${escapeHtml(s.h)}</h3>`;
      if (s.p) html += `<p>${escapeHtml(s.p)}</p>`;
      if (s.list) {
        html += '<ul>' + s.list.map(li => `<li>${escapeHtml(li)}</li>`).join('') + '</ul>';
      }
      if (s.callout) {
        const cls = s.callout === 'warn' ? 'callout warn' : 'callout';
        html += `<div class="${cls}">${escapeHtml(s.text || '')}</div>`;
      }
      if (s.table) {
        html += '<table><thead><tr>' +
          s.table.head.map(h => `<th>${escapeHtml(h)}</th>`).join('') +
          '</tr></thead><tbody>' +
          s.table.rows.map(r => '<tr>' + r.map(c => `<td>${escapeHtml(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table>';
      }
      // SVG diagram (raw, trusted content from data.js)
      if (s.svg) {
        html += `<figure class="diagram-wrap">${s.svg}` +
          (s.caption ? `<figcaption>${escapeHtml(s.caption)}</figcaption>` : '') +
          `</figure>`;
      }
      // Plan colour swatches
      if (s.swatches) {
        const swatchSet = D.planColours[s.swatches];
        if (swatchSet) {
          html += '<div class="swatches">' +
            swatchSet.map(sw => `<div class="swatch"><span class="chip" style="background:${sw.color}"></span><span class="chip-label">${escapeHtml(sw.label)}</span></div>`).join('') +
            '</div>';
        }
        if (s.caption) html += `<div class="caption">${escapeHtml(s.caption)}</div>`;
      }
      // Occupancy chip grid
      if (s.chips === 'occupancy') {
        html += '<div class="occ-grid">' +
          D.occupancyChips.map(c =>
            `<div class="occ-chip occ-${c.group}${c.spotlight ? ' occ-spot' : ''}">
              <span class="occ-code">${escapeHtml(c.code)}</span>
              <span class="occ-label">${escapeHtml(c.label)}</span>
            </div>`
          ).join('') +
          '</div>';
        if (s.caption) html += `<div class="caption">${escapeHtml(s.caption)}</div>`;
      }
    }

    if (m.keyTerms && m.keyTerms.length) {
      html += '<div class="section-title">Key terms</div><div class="tag-row">' +
        m.keyTerms.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') +
        '</div>';
    }

    // Source regulation text (public-domain NBR 2008) — full clauses for this module
    const REGS = window.NHBRC_REGS || { byModule: {} };
    const moduleRegs = (REGS.byModule && REGS.byModule[m.id]) || [];
    if (moduleRegs.length) {
      html += `<div class="section-title">Source regulation text <span class="meta-inline">(${moduleRegs.length} clause${moduleRegs.length===1?'':'s'} from the NBR 2008 — public domain)</span></div>`;
      html += '<div class="reg-list">' + moduleRegs.map(r => `
        <details class="reg-item">
          <summary><span class="reg-ref">${escapeHtml(r.ref)}</span> ${escapeHtml(r.title)}</summary>
          <div class="reg-text">${escapeHtml(r.text)}</div>
        </details>`).join('') + '</div>';
      html += `<div class="meta">From: <em>${escapeHtml(REGS.source || '')}</em></div>`;
    }

    // Cited sources — link out to the original posts (no bundled body, no infringement)
    const citedIds = (L.byModule && L.byModule[m.id]) || [];
    if (citedIds.length) {
      const cited = citedIds.map(id => articleById[id]).filter(Boolean).slice(0, 8);
      if (cited.length) {
        html += '<div class="section-title">Further reading <span class="meta-inline">(opens external sources)</span></div>';
        html += '<div class="cite-list">' + cited.map(a => `
          <a class="cite-card" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
            <div class="cite-title">${escapeHtml(a.title)} <span class="ext-arrow">↗</span></div>
            <div class="cite-meta">${escapeHtml((a.categories || []).slice(0,2).join(' · '))} · sans10400.co.za</div>
          </a>`).join('') + '</div>';
        if (citedIds.length > cited.length) {
          html += `<div class="meta">+ ${citedIds.length - cited.length} more on the Library tab</div>`;
        }
      }
    }

    const quiz = D.quizzes.find(q => q.moduleId === m.id);
    html += `<div class="actions">`;
    if (quiz) html += `<button class="btn" data-action="quiz" data-id="${m.id}">Take the quiz</button>`;
    html += `<button class="btn secondary" data-action="back">Back to modules</button></div>`;
    html += '</article>';

    view.innerHTML = html;
    view.querySelectorAll('[data-action="quiz"]').forEach(el =>
      el.addEventListener('click', () => route.go('quiz', el.dataset.id)));
    view.querySelectorAll('[data-action="open-article"]').forEach(el =>
      el.addEventListener('click', () => route.go('article', el.dataset.id)));
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
  }

  // ---------- Library ----------

  function viewLibrary() {
    titleEl.textContent = 'Library';
    backBtn.classList.add('hidden');
    setActiveTab('library');

    const cats = {};
    for (const a of L.articles) {
      for (const c of (a.categories || [])) cats[c] = (cats[c] || 0) + 1;
    }
    const topCats = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0, 12);

    let html = `<div class="hero" style="background:linear-gradient(135deg,#1a8a4a,#0b6e3f)">
      <h2>📚 Library</h2>
      <p>Bundled legislation + curated outbound index.</p>
    </div>

    <div class="section-title">📕 Bundled — public-domain legislation</div>
    <div class="pdf-list">
      ${L.pdfs.map(p => `<a class="card pdf-card" href="${escapeHtml(p.file)}" target="_blank" rel="noopener">
        <div class="pdf-icon">📕</div>
        <div class="pdf-body">
          <div class="pdf-title">${escapeHtml(p.title)}</div>
          <div class="meta">${p.sizeMb} MB · ${escapeHtml(p.source)}</div>
        </div>
      </a>`).join('')}
    </div>

    <details class="lib-details">
      <summary>🔗 Buy / get from official source · ${(L.externalDocs || []).length}</summary>
      <div class="pdf-list" style="margin-top:8px">
        ${(L.externalDocs || []).map(d => `<a class="card pdf-card ext-card" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">
          <div class="pdf-icon">↗</div>
          <div class="pdf-body">
            <div class="pdf-title">${escapeHtml(d.title)}</div>
            <div class="meta">${escapeHtml(d.note)}</div>
          </div>
        </a>`).join('')}
      </div>
    </details>

    <details class="lib-details">
      <summary>🗞️ Curated articles · ${L.articleCount}</summary>
      <div style="margin-top:8px">
        <input type="search" class="search" id="libsearch" placeholder="Search by title or category…" />
        <div class="filter-row" id="libfilters">
          <button class="chip-btn active" data-cat="">All</button>
          ${topCats.slice(0, 8).map(([c,n]) => `<button class="chip-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)} <span class="chip-num">${n}</span></button>`).join('')}
        </div>
        <div id="liblist"></div>
      </div>
    </details>`;
    view.innerHTML = html;

    const listEl = document.getElementById('liblist');
    let activeCat = '';
    let q = '';

    function renderList() {
      let arts = L.articles;
      if (activeCat) arts = arts.filter(a => (a.categories||[]).includes(activeCat));
      if (q) {
        const qq = q.toLowerCase();
        arts = arts.filter(a =>
          a.title.toLowerCase().includes(qq) ||
          (a.categories || []).some(c => c.toLowerCase().includes(qq))
        );
      }
      if (!arts.length) {
        listEl.innerHTML = '<div class="empty">No matches.</div>';
        return;
      }
      listEl.innerHTML = arts.slice(0, 200).map(a => `
        <a class="card lib-card" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
          <div class="lib-title">${escapeHtml(a.title)} <span class="ext-arrow">↗</span></div>
          <div class="tag-row">${(a.categories||[]).slice(0,3).map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join('')}</div>
        </a>`).join('') +
        (arts.length > 200 ? `<div class="meta" style="text-align:center;margin:10px">Showing first 200 of ${arts.length} — narrow your search.</div>` : '');
    }

    document.getElementById('libsearch').addEventListener('input', (e) => {
      q = e.target.value.trim();
      renderList();
    });
    document.querySelectorAll('#libfilters .chip-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#libfilters .chip-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        activeCat = b.dataset.cat;
        renderList();
      });
    });
    renderList();
  }

  function viewArticle(id) {
    // Articles are no longer rendered in-app — they're hosted on the original site.
    const a = articleById[id];
    if (a && a.url) { window.open(a.url, '_blank', 'noopener'); }
    route.go('library');
  }

  // Tiny safe markdown renderer — handles headings, paragraphs, lists, tables, blockquote.
  function renderMarkdown(md) {
    const lines = md.split(/\r?\n/);
    let html = '';
    let i = 0;
    function flushParagraph(buf) {
      if (buf.length) { html += '<p>' + escapeHtml(buf.join(' ')) + '</p>'; }
    }
    while (i < lines.length) {
      const line = lines[i];
      // headings
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) { html += `<h${h[1].length}>${escapeHtml(h[2])}</h${h[1].length}>`; i++; continue; }
      // blank
      if (!line.trim()) { i++; continue; }
      // table — line starting with '|' followed by separator row
      if (line.startsWith('|') && i+1 < lines.length && /^\|[-: |]+\|$/.test(lines[i+1])) {
        const head = line.slice(1, -1).split('|').map(s=>s.trim());
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          rows.push(lines[i].slice(1,-1).split('|').map(s=>s.trim()));
          i++;
        }
        html += '<div class="table-wrap"><table><thead><tr>' +
          head.map(h => `<th>${escapeHtml(h)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows.map(r => '<tr>' + r.map(c => `<td>${escapeHtml(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>';
        continue;
      }
      // list
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*]\s+/, ''));
          i++;
        }
        html += '<ul>' + items.map(it => `<li>${escapeHtml(it)}</li>`).join('') + '</ul>';
        continue;
      }
      // blockquote
      if (line.startsWith('>')) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html += `<blockquote>${escapeHtml(buf.join(' '))}</blockquote>`;
        continue;
      }
      // image — ![alt](url) on its own line
      const im = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
      if (im) {
        const alt = escapeHtml(im[1]);
        const src = escapeHtml(im[2]);
        html += `<figure class="md-fig"><img loading="lazy" src="${src}" alt="${alt}"/>${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
        i++; continue;
      }
      // paragraph (run-on until blank)
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^[#>\-*|!]/.test(lines[i])) {
        buf.push(lines[i].trim());
        i++;
      }
      // Inline images inside paragraphs — keep as figure if pure image
      flushParagraph(buf);
    }
    return html;
  }

  // ---------- Diagrams (SANS PDF gallery) ----------

  function viewDiagrams() {
    titleEl.textContent = 'Diagrams';
    backBtn.classList.add('hidden');
    setActiveTab('diagrams');

    const list = (L.diagrams || []);
    let html = `<div class="hero" style="background:linear-gradient(135deg,#7c4f00,#f5b800)">
      <h2>📐 Diagrams</h2>
      <p>${list.length} figures extracted from the SANS 10400 source PDF.</p>
    </div>
    <input type="search" class="search" id="dsearch" placeholder="Filter by page or context…" />
    <div id="dgrid" class="diagram-grid"></div>`;
    view.innerHTML = html;

    const grid = document.getElementById('dgrid');
    function render(filter) {
      const f = (filter || '').toLowerCase();
      const arr = !f ? list : list.filter(d =>
        String(d.page).includes(f) ||
        (d.context || '').toLowerCase().includes(f) ||
        (d.label || '').toLowerCase().includes(f));
      if (!arr.length) { grid.innerHTML = '<div class="empty">No matches.</div>'; return; }
      grid.innerHTML = arr.slice(0, 240).map((d, i) => `
        <a class="diagram-card" data-i="${i}" data-src="${escapeHtml(d.file)}" data-page="${d.page}" data-ctx="${escapeHtml(d.context||'')}">
          <img loading="lazy" src="${escapeHtml(d.file)}" alt="SANS p.${d.page}"/>
          <div class="diag-meta">p.${d.page}</div>
        </a>`).join('') +
        (arr.length > 240 ? `<div class="meta" style="grid-column:1/-1;text-align:center">${arr.length} total — showing 240</div>` : '');
      grid.querySelectorAll('.diagram-card').forEach(el =>
        el.addEventListener('click', e => {
          e.preventDefault();
          openLightbox(el.dataset.src, `Page ${el.dataset.page} — ${el.dataset.ctx}`);
        }));
    }
    render('');
    document.getElementById('dsearch').addEventListener('input', e => render(e.target.value.trim()));
  }

  function openLightbox(src, caption) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<div class="lb-close" aria-label="Close">×</div>
      <img src="${escapeHtml(src)}" alt=""/>
      <div class="lb-caption">${escapeHtml(caption)}</div>`;
    document.body.appendChild(lb);
    const close = () => lb.remove();
    lb.addEventListener('click', close);
  }

  // ---------- Master Quiz pool, coverage, history ----------
  const MASTER_KEY = 'nhbrc.master.v1';
  const SEEN_KEY = 'nhbrc.master.seen.v1';
  const MASTER_SIZE = 25;
  function masterPool() {
    const pool = [];
    for (const q of D.quizzes) {
      const m = D.modules.find(x => x.id === q.moduleId);
      q.questions.forEach((qq, idx) => {
        pool.push({
          ...qq,
          qid: `${q.moduleId}#${idx}`,
          moduleId: q.moduleId,
          moduleTitle: m?.title || q.title,
          moduleIcon: m?.icon || '❓',
        });
      });
    }
    return pool;
  }
  function loadSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function saveSeen(set) { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); }
  function resetSeen() { localStorage.removeItem(SEEN_KEY); }

  // Pick MASTER_SIZE questions:
  //  - Stage 1: cover every module with at least one question (preferring unseen)
  //  - Stage 2: fill remaining slots from anywhere, preferring unseen across attempts
  //  - Cycle resets automatically once all questions have been seen
  function pickMasterQuestions(pool, n) {
    let seen = loadSeen();
    if (seen.size >= pool.length) { seen = new Set(); }  // new cycle
    const byMod = {};
    for (const q of pool) (byMod[q.moduleId] = byMod[q.moduleId] || []).push(q);
    const modules = shuffle(Object.keys(byMod));
    const picked = [];
    const usedIds = new Set();
    // Stage 1 — one per module
    for (const mid of modules) {
      if (picked.length >= n) break;
      const cands = byMod[mid].filter(q => !usedIds.has(q.qid));
      if (!cands.length) continue;
      const unseen = cands.filter(q => !seen.has(q.qid));
      const pickFrom = unseen.length ? unseen : cands;
      const q = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      picked.push(q); usedIds.add(q.qid);
    }
    // Stage 2 — fill remaining
    const remaining = pool.filter(q => !usedIds.has(q.qid));
    const unseenRem = remaining.filter(q => !seen.has(q.qid));
    const need = n - picked.length;
    const fillFrom = unseenRem.length >= need ? unseenRem : remaining;
    for (const q of shuffle(fillFrom)) {
      if (picked.length >= n) break;
      picked.push(q); usedIds.add(q.qid);
    }
    // Mark these as seen
    for (const q of picked) seen.add(q.qid);
    // If we just exhausted the pool, the next call will reset
    saveSeen(seen);
    return shuffle(picked);
  }
  function masterHistory() {
    try { return JSON.parse(localStorage.getItem(MASTER_KEY)) || []; }
    catch { return []; }
  }
  function masterSave(entry) {
    const h = masterHistory();
    h.unshift(entry);
    localStorage.setItem(MASTER_KEY, JSON.stringify(h.slice(0, 100)));
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function viewQuizList() {
    titleEl.textContent = 'Quiz';
    backBtn.classList.add('hidden');
    setActiveTab('quiz');
    const progress = store.load();
    const pool = masterPool();
    const hist = masterHistory();
    const best = hist.reduce((m, h) => h.correct > m ? h.correct : m, 0);
    const last = hist[0];

    const seen = loadSeen();
    const cyclePct = Math.min(100, Math.round(seen.size / pool.length * 100));

    let html = `<div class="hero" style="background:linear-gradient(135deg,#7c4f00,#f5b800)">
      <h2>Test yourself</h2><p>Pick any topic — or take the Master Quiz for a randomised mix.</p></div>

      <a class="card mock-card" data-action="mock">
        <h3>🎓 Mock NHBRC Test <span class="badge gold">50 q · 60 min</span></h3>
        <div class="meta">Exam-style: 50 random questions across every module, no answer feedback until the end, soft 60-minute timer. Pass mark 70%.</div>
        <div class="meta master-stats">${(loadMockHistory() || []).length ? `Attempts: <strong>${loadMockHistory().length}</strong> · Best: <strong>${Math.max(...loadMockHistory().map(h=>h.correct))}/50</strong>` : 'No attempts yet'}</div>
      </a>

      <a class="card master-card" data-action="master">
        <h3>🏆 Master Quiz <span class="badge gold">${MASTER_SIZE} random</span></h3>
        <div class="meta">${MASTER_SIZE} questions per attempt, picked to cover every module and avoid repeats until the whole pool of ${pool.length} is exhausted.</div>
        <div class="progressbar"><span style="width:${cyclePct}%"></span></div>
        <div class="meta">Cycle coverage: <strong>${seen.size}/${pool.length}</strong> seen this cycle</div>
        <div class="meta master-stats">
          ${hist.length ? `Attempts: <strong>${hist.length}</strong>` : 'No attempts yet'}
          ${best ? ` · Best: <strong>${best}/${MASTER_SIZE}</strong>` : ''}
          ${last ? ` · Last: <strong>${last.correct}/${last.total}</strong> on ${escapeHtml(fmtTime(last.at))}` : ''}
        </div>
        ${seen.size > 0 ? `<div class="meta" style="margin-top:6px"><a data-action="reset-cycle" class="btn-link">Reset cycle</a></div>` : ''}
      </a>

      ${hist.length ? `<div class="section-title">Master Quiz history</div>
        <div class="master-history">${hist.slice(0, 10).map(h => `
          <div class="hist-row">
            <span class="hist-pct ${h.correct/h.total>=.8?'good':h.correct/h.total>=.6?'ok':'bad'}">${Math.round(h.correct/h.total*100)}%</span>
            <span class="hist-score">${h.correct}/${h.total}</span>
            <span class="hist-date">${escapeHtml(fmtTime(h.at))}</span>
          </div>`).join('')}</div>` : ''}

      <div class="section-title">Quizzes by module</div>`;
    for (const q of D.quizzes) {
      const m = D.modules.find(x => x.id === q.moduleId);
      const r = (progress.quizzes || {})[q.moduleId];
      html += `<a class="card" data-action="quiz" data-id="${q.moduleId}">
        <h3><span style="font-size:22px">${m?.icon || '❓'}</span> ${escapeHtml(q.title)}
          ${r ? `<span class="badge gold">Best ${r.best}/${r.total}</span>` : ''}
        </h3>
        <div class="meta">${q.questions.length} questions · ${m?.tag || ''}</div>
      </a>`;
    }
    view.innerHTML = html;
    view.querySelectorAll('[data-action="quiz"]').forEach(el =>
      el.addEventListener('click', () => route.go('quiz', el.dataset.id)));
    view.querySelectorAll('[data-action="master"]').forEach(el =>
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="reset-cycle"]')) return;
        route.go('master', null);
      }));
    view.querySelectorAll('[data-action="mock"]').forEach(el =>
      el.addEventListener('click', () => route.go('mock', null)));
    view.querySelectorAll('[data-action="reset-cycle"]').forEach(el =>
      el.addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (confirm('Start a fresh cycle? Past score history will be kept.')) {
          resetSeen();
          render();
        }
      }));
  }

  // ---------- Mock NHBRC test (exam simulation) ----------
  const MOCK_KEY = 'nhbrc.mock.v1';
  const MOCK_SIZE = 50;
  const MOCK_DURATION_S = 60 * 60; // 60 min soft timer
  const MOCK_PASS = 0.70;
  function loadMockHistory() {
    try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]'); }
    catch { return []; }
  }
  function saveMockHistory(entry) {
    const h = loadMockHistory();
    h.unshift(entry);
    localStorage.setItem(MOCK_KEY, JSON.stringify(h.slice(0, 50)));
  }

  function viewMockTest() {
    if (window.NHBRC_LICENSE && !window.NHBRC_LICENSE.isLicensed()) {
      return viewUnlock('mock');
    }
    const pool = masterPool();
    const n = Math.min(MOCK_SIZE, pool.length);
    // Spread across modules: at least 1 from each module that has questions, then fill randomly.
    const byMod = {};
    for (const q of pool) (byMod[q.moduleId] = byMod[q.moduleId] || []).push(q);
    const mods = shuffle(Object.keys(byMod));
    const picked = [];
    const usedIds = new Set();
    for (const mid of mods) {
      if (picked.length >= n) break;
      const cands = byMod[mid].filter(q => !usedIds.has(q.qid));
      if (!cands.length) continue;
      const q = cands[Math.floor(Math.random() * cands.length)];
      picked.push(q); usedIds.add(q.qid);
    }
    const remaining = pool.filter(q => !usedIds.has(q.qid));
    for (const q of shuffle(remaining)) {
      if (picked.length >= n) break;
      picked.push(q); usedIds.add(q.qid);
    }
    const questions = shuffle(picked).map(shuffleOpts);

    titleEl.textContent = 'Mock NHBRC test';
    backBtn.classList.remove('hidden');
    setActiveTab('quiz');
    const startedAt = Date.now();
    const answers = new Array(questions.length).fill(null);
    let submitted = false;

    function buildHtml() {
      let html = `<div class="mock-meta">
        <span>📝 ${questions.length} questions</span>
        <span>⏱️ <span id="mockTimer">60:00</span></span>
        <span>🎯 Pass: ≥${Math.round(MOCK_PASS*100)}%</span>
      </div>
      <p class="meta">Mark each question, then tap Submit. You'll see the score and where you went wrong only at the end — that's the real exam experience.</p>`;
      questions.forEach((qq, qi) => {
        html += `<div class="quiz-q mock-q" data-q="${qi}">
          <p class="qstem"><span class="q-mod">${qq.moduleIcon} ${escapeHtml(qq.moduleTitle)}</span><br>${qi + 1}. ${escapeHtml(qq.q)}</p>
          ${qq.opts.map((opt, oi) => `<button class="quiz-opt" data-q="${qi}" data-opt="${oi}">${escapeHtml(opt)}</button>`).join('')}
        </div>`;
      });
      html += `<div id="mockSubmitWrap" class="actions">
        <button class="btn primary big" id="mockSubmit">Submit test</button>
        <button class="btn secondary" data-action="back">Abandon</button>
      </div>
      <div id="mockResult"></div>`;
      return html;
    }

    view.innerHTML = buildHtml();

    // Wire selection (no feedback yet)
    view.querySelectorAll('.mock-q .quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (submitted) return;
        const qi = +btn.dataset.q;
        const oi = +btn.dataset.opt;
        answers[qi] = oi;
        const block = view.querySelector(`.mock-q[data-q="${qi}"]`);
        block.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Soft timer — counts down but does not force-submit
    const timer = document.getElementById('mockTimer');
    const tickEnd = startedAt + MOCK_DURATION_S * 1000;
    const ti = setInterval(() => {
      if (submitted) { clearInterval(ti); return; }
      const remain = Math.max(0, Math.floor((tickEnd - Date.now()) / 1000));
      const m = String(Math.floor(remain / 60)).padStart(2, '0');
      const s = String(remain % 60).padStart(2, '0');
      timer.textContent = `${m}:${s}`;
      if (remain <= 0) { timer.style.color = '#ff9b87'; }
    }, 1000);

    function finalize() {
      submitted = true;
      let correct = 0;
      const wrongIds = [];
      answers.forEach((oi, qi) => {
        const qq = questions[qi];
        const block = view.querySelector(`.mock-q[data-q="${qi}"]`);
        const opts = block.querySelectorAll('.quiz-opt');
        opts.forEach((b, i) => {
          b.disabled = true;
          if (i === qq.a) b.classList.add('correct');
          if (oi === i && i !== qq.a) b.classList.add('wrong');
        });
        if (oi === qq.a) correct++;
        else wrongIds.push(qi);
        const ex = document.createElement('div');
        ex.className = 'quiz-explain';
        ex.textContent = (oi === qq.a ? '✔ ' : oi === null ? '— unanswered. ' : '✘ ') + qq.why;
        block.appendChild(ex);
      });
      const pct = Math.round(correct / questions.length * 100);
      const passed = pct >= Math.round(MOCK_PASS * 100);
      saveMockHistory({ at: Date.now(), correct, total: questions.length, durationS: Math.floor((Date.now() - startedAt) / 1000) });
      const result = document.getElementById('mockResult');
      const certBtn = passed ? `<button class="btn primary" id="genCert">📜 Download certificate (PDF)</button>` : '';
      result.innerHTML = `<div class="quiz-score ${passed ? 'pass' : 'fail'}">
        <p class="pct">${pct}%</p>
        <p class="lbl">${correct} / ${questions.length} · ${passed ? '🎉 Above the 70% pass mark' : '⚠️ Below the 70% pass mark — review the misses, then retake'}</p>
        <p class="meta">Saved to history.</p>
        <div class="actions" style="justify-content:center">${certBtn}</div>
      </div>`;
      const cb = document.getElementById('genCert');
      if (cb) cb.addEventListener('click', () => {
        const u = A && A.currentUser();
        const name = (u?.username || u?.email || 'Student');
        window.NHBRC_FORMS && window.NHBRC_FORMS.generateCertificate({
          name, score: correct, total: questions.length,
          attemptDate: new Date().toLocaleString('en-ZA'),
        });
      });
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('mockSubmit').addEventListener('click', () => {
      const unanswered = answers.filter(a => a === null).length;
      if (unanswered > 0 && !confirm(`${unanswered} unanswered. Submit anyway?`)) return;
      finalize();
    });
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => { if (submitted || confirm('Abandon test?')) route.back(); }));
  }

  function viewMasterQuiz() {
    if (window.NHBRC_LICENSE && !window.NHBRC_LICENSE.isLicensed()) {
      return viewUnlock('master');
    }
    const pool = masterPool();
    const n = Math.min(MASTER_SIZE, pool.length);
    const seenBefore = loadSeen().size;
    const questions = pickMasterQuestions(pool, n).map(shuffleOpts);
    const seenAfter = loadSeen().size;
    const cycleNote = seenAfter <= n
      ? 'Fresh cycle — every question is new.'
      : (seenAfter >= pool.length
          ? 'You\'ve now seen every question once. Next attempt starts a new cycle.'
          : `Coverage so far this cycle: ${seenAfter}/${pool.length} questions seen.`);
    const moduleSet = new Set(questions.map(q => q.moduleId));
    titleEl.textContent = 'Master Quiz';
    backBtn.classList.remove('hidden');
    setActiveTab('quiz');
    const startedAt = Date.now();

    let answered = 0, correct = 0;
    let html = `<div class="meta" style="margin-bottom:8px">🏆 ${n} random questions across ${moduleSet.size}/${Object.keys(D.quizzes.reduce((m,q)=>{m[q.moduleId]=1;return m;},{})).length} modules · ${escapeHtml(cycleNote)}</div>`;
    questions.forEach((qq, qi) => {
      html += `<div class="quiz-q" data-q="${qi}">
        <p class="qstem"><span class="q-mod">${qq.moduleIcon} ${escapeHtml(qq.moduleTitle)}</span><br>${qi + 1}. ${escapeHtml(qq.q)}</p>
        ${qq.opts.map((opt, oi) => `<button class="quiz-opt" data-q="${qi}" data-opt="${oi}">${escapeHtml(opt)}</button>`).join('')}
      </div>`;
    });
    html += `<div id="quizScore"></div>
      <div class="actions">
        <button class="btn" data-action="restart">Generate a new master quiz</button>
        <button class="btn secondary" data-action="back">Back</button>
      </div>`;
    view.innerHTML = html;

    view.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = +btn.dataset.q;
        const oi = +btn.dataset.opt;
        const qq = questions[qi];
        const block = view.querySelector(`.quiz-q[data-q="${qi}"]`);
        if (block.dataset.done) return;
        block.dataset.done = '1';
        answered++;
        const opts = block.querySelectorAll('.quiz-opt');
        opts.forEach((o, i) => {
          o.disabled = true;
          if (i === qq.a) o.classList.add('correct');
          if (i === oi && oi !== qq.a) o.classList.add('wrong');
        });
        if (oi === qq.a) correct++;
        const ex = document.createElement('div');
        ex.className = 'quiz-explain';
        ex.textContent = (oi === qq.a ? '✔ ' : '✘ ') + qq.why;
        block.appendChild(ex);
        if (answered === questions.length) {
          const pct = Math.round(correct / questions.length * 100);
          masterSave({ at: Date.now(), correct, total: questions.length, timeMs: Date.now() - startedAt });
          const lbl = pct >= 80 ? 'Excellent — solid grasp' : pct >= 60 ? 'Good — review the misses' : 'Worth another study round';
          const el = document.getElementById('quizScore');
          el.innerHTML = `<div class="quiz-score">
            <p class="pct">${pct}%</p>
            <p class="lbl">${correct} / ${questions.length} · ${lbl}</p>
            <p class="meta">Saved to your Master Quiz history.</p>
          </div>`;
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
    view.querySelectorAll('[data-action="restart"]').forEach(el =>
      el.addEventListener('click', () => { route.history = []; route.current = { name: 'master', payload: null }; render(); }));
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
  }

  function viewQuiz(modId) {
    const q = D.quizzes.find(x => x.moduleId === modId);
    if (!q) return route.go('quizlist');
    const m = D.modules.find(x => x.id === modId);
    titleEl.textContent = 'Quiz: ' + (m?.title || q.title);
    backBtn.classList.remove('hidden');
    setActiveTab('quiz');

    // Per-module 'seen' tracking — pick unseen first, reset cycle when exhausted.
    const SEEN_KEY = `nhbrc.quiz.seen.${modId}`;
    let seen = new Set();
    try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch {}
    const QUIZ_SIZE = Math.min(8, q.questions.length); // up to 8 per attempt
    if (seen.size >= q.questions.length) seen = new Set(); // new cycle
    const indexed = q.questions.map((qq, i) => ({ ...qq, qid: `${modId}#${i}` }));
    const unseen = indexed.filter(x => !seen.has(x.qid));
    const seenList = indexed.filter(x => seen.has(x.qid));
    const pool = (unseen.length >= QUIZ_SIZE ? unseen : unseen.concat(shuffle(seenList)));
    const picked = shuffle(pool).slice(0, QUIZ_SIZE);
    for (const x of picked) seen.add(x.qid);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));

    // Also shuffle each question's option order so position-memorisation doesn't help.
    const questions = picked.map((qq, i) => ({ ...shuffleOpts(qq), idx: i }));
    let answered = 0, correct = 0;

    let html = `<div class="meta" style="margin-bottom:8px">${questions.length} questions · pick the best answer</div>`;
    questions.forEach((qq, qi) => {
      html += `<div class="quiz-q" data-q="${qi}">
        <p class="qstem">${qi + 1}. ${escapeHtml(qq.q)}</p>
        ${qq.opts.map((opt, oi) => `<button class="quiz-opt" data-q="${qi}" data-opt="${oi}">${escapeHtml(opt)}</button>`).join('')}
      </div>`;
    });
    html += `<div id="quizScore"></div>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>`;
    view.innerHTML = html;

    view.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = +btn.dataset.q;
        const oi = +btn.dataset.opt;
        const qq = questions[qi];
        const block = view.querySelector(`.quiz-q[data-q="${qi}"]`);
        if (block.dataset.done) return;
        block.dataset.done = '1';
        answered++;
        const opts = block.querySelectorAll('.quiz-opt');
        opts.forEach((o, i) => {
          o.disabled = true;
          if (i === qq.a) o.classList.add('correct');
          if (i === oi && oi !== qq.a) o.classList.add('wrong');
        });
        if (oi === qq.a) correct++;
        const ex = document.createElement('div');
        ex.className = 'quiz-explain';
        ex.textContent = (oi === qq.a ? '✔ ' : '✘ ') + qq.why;
        block.appendChild(ex);

        if (answered === questions.length) finalize();
      });
    });

    function finalize() {
      const pct = Math.round(correct / questions.length * 100);
      store.saveQuiz(modId, correct, questions.length);
      const lbl = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good — review the misses' : 'Worth another study round';
      const el = document.getElementById('quizScore');
      el.innerHTML = `<div class="quiz-score">
        <p class="pct">${pct}%</p>
        <p class="lbl">${correct} / ${questions.length} · ${lbl}</p>
      </div>`;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
  }

  function viewGlossary() {
    titleEl.textContent = 'Glossary';
    backBtn.classList.add('hidden');
    setActiveTab('glossary');
    const items = D.glossary.slice().sort((a, b) => a.term.localeCompare(b.term));
    let html = `<input type="search" class="search" id="gsearch" placeholder="Search 26 key terms…" />`;
    html += '<div id="glist">' + renderGlossary(items, '') + '</div>';
    view.innerHTML = html;
    const input = document.getElementById('gsearch');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      document.getElementById('glist').innerHTML = renderGlossary(items, q);
    });
  }

  function renderGlossary(items, q) {
    const filt = q
      ? items.filter(it => it.term.toLowerCase().includes(q) || it.defn.toLowerCase().includes(q))
      : items;
    if (!filt.length) return '<div class="empty">No matches.</div>';
    return filt.map(it => `<div class="glossary-item">
      <div class="term">${escapeHtml(it.term)}</div>
      <div class="defn">${escapeHtml(it.defn)}</div>
    </div>`).join('');
  }

  function viewProgress() {
    titleEl.textContent = 'Progress';
    backBtn.classList.add('hidden');
    setActiveTab('progress');

    const p = store.load();
    const totalMods = D.modules.length;
    const readMods = Object.keys(p.read || {}).length;
    const quizzesTaken = Object.keys(p.quizzes || {}).length;
    let avgPct = 0;
    if (quizzesTaken) {
      const all = Object.values(p.quizzes);
      avgPct = Math.round(all.reduce((s, q) => s + q.best / q.total, 0) / all.length * 100);
    }

    let html = `<div class="hero">
      <h2>Your study record</h2>
      <p>Saved on this device. Clear at any time.</p>
    </div>
    <div class="progress-stats">
      <div class="stat"><div class="num">${readMods}/${totalMods}</div><div class="lbl">Modules read</div></div>
      <div class="stat"><div class="num">${quizzesTaken}</div><div class="lbl">Quizzes taken</div></div>
      <div class="stat"><div class="num">${avgPct}%</div><div class="lbl">Average best</div></div>
    </div>
    <div class="section-title">Quiz best scores</div>`;

    if (!quizzesTaken) {
      html += '<div class="empty">Take a quiz to see your scores here.</div>';
    } else {
      for (const m of D.modules) {
        const r = (p.quizzes || {})[m.id];
        if (!r) continue;
        const pct = Math.round(r.best / r.total * 100);
        html += `<a class="card" data-action="quiz" data-id="${m.id}">
          <h3><span style="font-size:22px">${m.icon}</span> ${escapeHtml(m.title)}
            <span class="badge gold">${r.best}/${r.total}</span></h3>
          <div class="progressbar"><span style="width:${pct}%"></span></div>
        </a>`;
      }
    }

    html += `<div class="actions" style="margin-top:18px">
      <button class="btn danger" data-action="reset">Reset progress</button>
    </div>`;

    view.innerHTML = html;
    view.querySelectorAll('[data-action="quiz"]').forEach(el =>
      el.addEventListener('click', () => route.go('quiz', el.dataset.id)));
    view.querySelectorAll('[data-action="reset"]').forEach(el =>
      el.addEventListener('click', () => {
        if (confirm('Clear all reading and quiz progress on this device?')) {
          localStorage.removeItem(STORE_KEY);
          render();
        }
      }));
  }

  // ---------- Welcome modal (shown once) ----------
  function showWelcomeModal() {
    const m = document.createElement('div');
    m.className = 'modal-backdrop';
    m.innerHTML = `<div class="modal">
      <h2>👋 Welcome to NHBRC Trainer</h2>
      <p>This is an <strong>independent study aid</strong> — not affiliated with NHBRC or SABS.
      The official SANS 10400 standards (paid, from SABS) and the NHBRC Home Building Manual must
      be obtained from their publishers and consulted before any plan submission.</p>
      <p class="meta">You only see this once — full Terms &amp; Privacy live in the <strong>Me</strong> tab.</p>
      <div class="actions"><button class="btn primary big" id="welcomeOk">Got it</button></div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('#welcomeOk').addEventListener('click', () => {
      localStorage.setItem('nhbrc.welcomeSeen.v1', '1');
      m.remove();
    });
  }

  // ---------- Quiz list renderer (used by Learn → Quizzes sub-section) ----------
  function renderQuizList(target) {
    const progress = store.load();
    const pool = masterPool();
    const hist = masterHistory();
    const best = hist.reduce((m, h) => h.correct > m ? h.correct : m, 0);
    const last = hist[0];
    const seen = loadSeen();
    const cyclePct = Math.min(100, Math.round(seen.size / Math.max(1, pool.length) * 100));

    let html = `
      <a class="card mock-card" data-action="mock">
        <h3>🎓 Mock NHBRC Test <span class="badge gold">50 q · 60 min</span></h3>
        <div class="meta">Exam-style: 50 random questions across every module, no answer feedback until the end. 70% pass mark.</div>
        <div class="meta master-stats">${(loadMockHistory() || []).length ? `Attempts: <strong>${loadMockHistory().length}</strong> · Best: <strong>${Math.max(...loadMockHistory().map(h=>h.correct))}/50</strong>` : 'No attempts yet'}</div>
      </a>

      <a class="card master-card" data-action="master">
        <h3>🏆 Master Quiz <span class="badge gold">${MASTER_SIZE} random</span></h3>
        <div class="meta">${MASTER_SIZE} questions per attempt, prefers unseen until the pool of ${pool.length} is exhausted.</div>
        <div class="progressbar"><span style="width:${cyclePct}%"></span></div>
        <div class="meta">Cycle coverage: <strong>${seen.size}/${pool.length}</strong> seen this cycle</div>
        <div class="meta master-stats">
          ${hist.length ? `Attempts: <strong>${hist.length}</strong>` : 'No attempts yet'}
          ${best ? ` · Best: <strong>${best}/${MASTER_SIZE}</strong>` : ''}
          ${last ? ` · Last: <strong>${last.correct}/${last.total}</strong>` : ''}
        </div>
      </a>

      <div class="section-title">Quizzes by module</div>`;
    for (const q of D.quizzes) {
      const m = D.modules.find(x => x.id === q.moduleId);
      const r = (progress.quizzes || {})[q.moduleId];
      html += `<a class="card" data-action="quiz" data-id="${q.moduleId}">
        <h3><span style="font-size:22px">${m?.icon || '❓'}</span> ${escapeHtml(q.title || (m?.title || q.moduleId))}
          ${r ? `<span class="badge gold">Best ${r.best}/${r.total}</span>` : ''}
        </h3>
        <div class="meta">${q.questions.length} questions${m?.tag ? ' · ' + m.tag : ''}</div>
      </a>`;
    }
    target.innerHTML = html;
    target.querySelectorAll('[data-action="quiz"]').forEach(el =>
      el.addEventListener('click', () => route.go('quiz', el.dataset.id)));
    target.querySelectorAll('[data-action="master"]').forEach(el =>
      el.addEventListener('click', () => route.go('master', null)));
    target.querySelectorAll('[data-action="mock"]').forEach(el =>
      el.addEventListener('click', () => route.go('mock', null)));
  }

  // ---------- Glossary renderer ----------
  function renderGlossaryList(target) {
    const items = D.glossary.slice().sort((a, b) => a.term.localeCompare(b.term));
    target.innerHTML = `<input type="search" class="search" id="gsearch" placeholder="Search ${items.length} key terms…" />
      <div id="glist">${renderGlossary(items, '')}</div>`;
    const input = target.querySelector('#gsearch');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      target.querySelector('#glist').innerHTML = renderGlossary(items, q);
    });
  }

  // ---------- Me / Account hub ----------
  function viewMe() {
    titleEl.textContent = 'Me';
    backBtn.classList.add('hidden');
    setActiveTab('me');
    const u = A && A.currentUser();
    const p = store.load();
    const totalMods = D.modules.length;
    const readMods = Object.keys(p.read || {}).length;
    const quizzesTaken = Object.keys(p.quizzes || {}).length;
    const allQuizzes = Object.values(p.quizzes || {});
    const avgPct = quizzesTaken
      ? Math.round(allQuizzes.reduce((s, q) => s + q.best / q.total, 0) / quizzesTaken * 100)
      : 0;
    const s = streakState();
    const mockHist = loadMockHistory();
    const masterHist = masterHistory();

    view.innerHTML = `
      <div class="me-hero">
        <div class="me-avatar">${(u?.username || u?.email || '?').charAt(0).toUpperCase()}</div>
        <div>
          <div class="me-name">${escapeHtml(u?.username || u?.email || 'Guest')}</div>
          <div class="meta">${escapeHtml(u?.role || 'user')} · since ${u?.createdAt ? escapeHtml(u.createdAt.slice(0,10)) : '—'}</div>
        </div>
      </div>

      <div class="progress-stats">
        <div class="stat"><div class="num">${readMods}/${totalMods}</div><div class="lbl">Modules read</div></div>
        <div class="stat"><div class="num">${quizzesTaken}</div><div class="lbl">Quizzes taken</div></div>
        <div class="stat"><div class="num">${avgPct}%</div><div class="lbl">Avg quiz best</div></div>
        <div class="stat"><div class="num">🔥 ${s.streak || 0}</div><div class="lbl">Day streak (best ${s.best || 0})</div></div>
      </div>

      ${mockHist.length ? `
        <div class="section-title">Mock NHBRC test history</div>
        <div class="master-history">
          ${mockHist.slice(0, 5).map(h => `<div class="hist-row">
            <span class="hist-pct ${h.correct/h.total>=.7?'good':h.correct/h.total>=.5?'ok':'bad'}">${Math.round(h.correct/h.total*100)}%</span>
            <span class="hist-score">${h.correct}/${h.total}</span>
            <span class="hist-date">${escapeHtml(fmtTime(h.at))}</span>
          </div>`).join('')}
        </div>` : ''}

      ${masterHist.length ? `
        <div class="section-title">Master Quiz history</div>
        <div class="master-history">
          ${masterHist.slice(0, 5).map(h => `<div class="hist-row">
            <span class="hist-pct ${h.correct/h.total>=.8?'good':h.correct/h.total>=.6?'ok':'bad'}">${Math.round(h.correct/h.total*100)}%</span>
            <span class="hist-score">${h.correct}/${h.total}</span>
            <span class="hist-date">${escapeHtml(fmtTime(h.at))}</span>
          </div>`).join('')}
        </div>` : ''}

      <div class="section-title">Account</div>
      ${A && A.isMaster() ? '<a class="card me-link" data-action="admin">👑 Admin panel <span class="source-chev">›</span></a>' : ''}
      <a class="card me-link" data-action="about">ℹ️ About this guide <span class="source-chev">›</span></a>
      <a class="card me-link" data-action="legal">📜 Terms &amp; sources <span class="source-chev">›</span></a>
      <a class="card me-link" data-action="privacy">🔒 Privacy policy <span class="source-chev">›</span></a>
      <a class="card me-link" data-action="reset">🧹 Reset progress &amp; quiz history</a>
      <a class="card me-link" data-action="hard-refresh">🔄 Force refresh — clear cache + reload</a>
      <a class="card me-link" data-action="logout">🚪 Log out</a>
    `;
    view.querySelectorAll('[data-action="admin"]').forEach(el => el.addEventListener('click', () => route.go('admin')));
    view.querySelectorAll('[data-action="about"]').forEach(el => el.addEventListener('click', () => route.go('about')));
    view.querySelectorAll('[data-action="legal"]').forEach(el => el.addEventListener('click', () => route.go('legal')));
    view.querySelectorAll('[data-action="privacy"]').forEach(el => el.addEventListener('click', () => route.go('privacy')));
    view.querySelectorAll('[data-action="logout"]').forEach(el => el.addEventListener('click', () => {
      if (confirm('Log out?')) { A.logout(); route.history = []; route.current = { name: 'landing', payload: null }; render(); }
    }));
    view.querySelectorAll('[data-action="reset"]').forEach(el => el.addEventListener('click', () => {
      if (confirm('Clear all reading + quiz progress on this device? Your account is kept.')) {
        ['nhbrc.progress.v1','nhbrc.master.v1','nhbrc.master.seen.v1','nhbrc.mock.v1','nhbrc.streak.v1','nhbrc.chat.v1']
          .concat(Object.keys(localStorage).filter(k => k.startsWith('nhbrc.quiz.seen.')))
          .forEach(k => localStorage.removeItem(k));
        render();
      }
    }));
    view.querySelectorAll('[data-action="hard-refresh"]').forEach(el => el.addEventListener('click', async () => {
      if (!confirm('Clear all caches + service worker, then reload? Your account stays.')) return;
      try {
        if ('serviceWorker' in navigator) {
          const rs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(rs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const ks = await caches.keys();
          await Promise.all(ks.map(k => caches.delete(k)));
        }
      } catch {}
      location.href = location.origin + location.pathname + '?cb=' + Date.now();
    }));
  }

  // ---------- Daily streak ----------
  // Tracks consecutive days where the user opened the app — purely on-device.
  const STREAK_KEY = 'nhbrc.streak.v1';
  function streakState() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}'); }
    catch { return {}; }
  }
  function streakTick() {
    const today = new Date().toISOString().slice(0, 10);
    const s = streakState();
    if (s.lastDay === today) return s; // already counted
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.streak = (s.lastDay === yesterday) ? (s.streak || 0) + 1 : 1;
    s.best = Math.max(s.best || 0, s.streak);
    s.lastDay = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
    return s;
  }
  // Tick on first authenticated render
  if (A && A.isAuthenticated()) streakTick();

  // ---------- Modules-list sub-page ----------
  function viewModulesList() {
    titleEl.textContent = 'Modules';
    backBtn.classList.remove('hidden');
    setActiveTab('home');
    const progress = store.load();
    let h = `<p class="meta">${D.modules.length} study modules — every Part of SANS 10400 from A through XA, plus workflow + warranty.</p>`;
    for (const m of D.modules) {
      const wasRead = (progress.read || {})[m.id];
      const quiz = (progress.quizzes || {})[m.id];
      h += `
        <a class="card" data-action="open-module" data-id="${m.id}">
          <h3><span style="font-size:22px">${m.icon}</span> ${escapeHtml(m.title)}
            ${wasRead ? '<span class="badge">Read</span>' : ''}
            ${quiz ? `<span class="badge gold">${quiz.best}/${quiz.total}</span>` : ''}
          </h3>
          <div class="meta">${escapeHtml(m.summary)}</div>
          <div class="tag-row"><span class="tag">${m.tag}</span></div>
        </a>`;
    }
    view.innerHTML = h;
    view.querySelectorAll('[data-action="open-module"]').forEach(el =>
      el.addEventListener('click', () => route.go('module', el.dataset.id)));
  }

  // ---------- Tools (calculators / forms / checklists) ----------
  function viewTools() {
    titleEl.textContent = 'On-site tools';
    backBtn.classList.add('hidden');
    setActiveTab('tools');

    let active = (route.current.payload?.section) || 'calc';
    function render() {
      view.innerHTML = `
        <div class="filter-row" style="margin-bottom:10px">
          <button class="chip-btn ${active==='calc'?'active':''}" data-s="calc">🧮 Calculators</button>
          <button class="chip-btn ${active==='forms'?'active':''}" data-s="forms">📄 Forms (1–4)</button>
          <button class="chip-btn ${active==='checks'?'active':''}" data-s="checks">✅ Inspection checklists</button>
        </div>
        <div id="toolsBody"></div>`;
      view.querySelectorAll('.chip-btn').forEach(b => b.addEventListener('click', () => { active = b.dataset.s; render(); }));
      const body = view.querySelector('#toolsBody');
      if (active === 'calc')   return window.NHBRC_CALCULATORS && window.NHBRC_CALCULATORS.view(escapeHtml, body);
      if (active === 'forms')  return formsView(body);
      if (active === 'checks') return checklistsView(body);
    }
    render();
  }

  function formsView(body) {
    body.innerHTML = `
      <p class="meta">Generate ready-to-print Forms 1–4 (SANS 10400-A) with your project details. Native browser <em>Save as PDF</em> — no external tools, no upload.</p>
      <div class="qa-card" data-form="1"><div class="qa-icon">📄</div><div class="qa-text"><div class="qa-eyebrow">Form 1</div><div class="qa-title">Application for plan approval (Reg A4)</div></div></div>
      <div class="qa-card" data-form="2"><div class="qa-icon">📄</div><div class="qa-text"><div class="qa-eyebrow">Form 2</div><div class="qa-title">Appointment of competent person (Reg A19)</div></div></div>
      <div class="qa-card" data-form="3"><div class="qa-icon">📄</div><div class="qa-text"><div class="qa-eyebrow">Form 3</div><div class="qa-title">Certificate of compliance (Reg A19)</div></div></div>
      <div class="qa-card" data-form="4"><div class="qa-icon">📄</div><div class="qa-text"><div class="qa-eyebrow">Form 4</div><div class="qa-title">Notice of completion (Reg A22)</div></div></div>
      <div id="formEditor"></div>`;
    body.querySelectorAll('[data-form]').forEach(el => el.addEventListener('click', () => openFormEditor(el.dataset.form, body.querySelector('#formEditor'))));
  }

  function openFormEditor(n, target) {
    const F = window.NHBRC_FORMS;
    const fields = ({
      '1': [
        ['ownerName','Owner full name'],['ownerId','Owner ID / company reg'],['ownerAddress','Postal address'],['ownerPhone','Contact'],['ownerEmail','Email'],
        ['erf','Erf / stand'],['township','Township / suburb'],['localAuthority','Local authority'],['occupancyClass','Occupancy class (Reg A20)'],['buildingDesc','Building description'],['value','Estimated value (R)'],
        ['builderName','Home builder name'],['nhbrcNo','NHBRC reg no'],['enrolmentRef','Enrolment ref'],
      ],
      '2': [
        ['erf','Erf / stand'],['ownerName','Owner'],['localAuthority','Local authority'],
        ['cpName','CP full name'],['cpDiscipline','Discipline'],['cpRegBody','Council'],['cpRegNo','Reg no'],['cpAddress','Address'],['cpContact','Contact'],['regsAccepted','Regs accepted (e.g. B1, H1, K1)'],
      ],
      '3': [
        ['erf','Erf / stand'],['ownerName','Owner'],['localAuthority','Local authority'],['planNo','Approved plan no'],
        ['cpName','CP full name'],['cpRegBody','Council'],['cpRegNo','Reg no'],['cpDiscipline','Discipline'],
        ['scope','Scope of certification'],['limits','Limitations / qualifications'],
      ],
      '4': [
        ['erf','Erf / stand'],['ownerName','Owner'],['localAuthority','Local authority'],['planNo','Approved plan no'],
        ['startDate','Start date'],['completionDate','Completion date'],
        ['builderName','Home builder'],['nhbrcNo','NHBRC reg'],
        ['cpForm3List','CPs who issued Form 3 (list)'],
      ],
    })[n];
    if (!fields) { target.innerHTML = '<div class="empty">Unknown form.</div>'; return; }
    target.innerHTML = `<h3 style="margin-top:14px">Form ${n} — fill in</h3>
      <div class="calc-form">
        ${fields.map(([k,l]) => `<label class="calc-field"><span>${escapeHtml(l)}</span><input id="f-${k}" type="text" /></label>`).join('')}
      </div>
      <div class="actions"><button class="btn primary big" id="genForm">Generate PDF</button></div>`;
    target.querySelector('#genForm').addEventListener('click', () => {
      const data = {};
      for (const [k] of fields) data[k] = target.querySelector('#f-' + k).value;
      F['form' + n](data);
    });
  }

  function checklistsView(body) {
    const stages = window.NHBRC_FORMS?.INSPECTION_STAGES || {};
    let active = 'foundation';
    function render() {
      body.innerHTML = `
        <p class="meta">Tick off each item per stage. Generate one PDF per stage, OR fill all stages then export the combined Project Inspection File at the bottom.</p>
        <div class="filter-row">
          ${Object.entries(stages).map(([k, s]) => `<button class="chip-btn ${active===k?'active':''}" data-k="${k}">${escapeHtml(s.title)}</button>`).join('')}
        </div>
        <div id="chkBody"></div>

        <details class="lib-details" style="margin-top:14px">
          <summary>📋 Combined Project Inspection File — all 6 stages, one PDF</summary>
          <div style="margin-top:8px">
            <p class="meta">Fills the heading on the cover page. Each stage prints on its own page with the ticks you've entered above. One file per project; print fresh for each new project.</p>
            <div class="calc-form">
              <label class="calc-field"><span>Project name</span><input id="prjName" type="text" placeholder="e.g. 12 Acacia Lane"/></label>
              <label class="calc-field"><span>Erf / stand</span><input id="prjErf" type="text"/></label>
              <label class="calc-field"><span>Owner</span><input id="prjOwner" type="text"/></label>
              <label class="calc-field"><span>Site address</span><input id="prjAddress" type="text"/></label>
              <label class="calc-field"><span>Home builder</span><input id="prjBuilder" type="text"/></label>
              <label class="calc-field"><span>NHBRC reg no</span><input id="prjNhbrc" type="text"/></label>
              <label class="calc-field"><span>Approved plan no</span><input id="prjPlan" type="text"/></label>
            </div>
            <div class="actions"><button class="btn primary big" id="prjGen">📄 Generate Combined Project File (PDF)</button></div>
          </div>
        </details>`;
      body.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { active = b.dataset.k; render(); }));
      body.querySelector('#prjGen').addEventListener('click', () => {
        window.NHBRC_FORMS.generateMasterChecklist({
          projectName: body.querySelector('#prjName').value,
          erf: body.querySelector('#prjErf').value,
          owner: body.querySelector('#prjOwner').value,
          address: body.querySelector('#prjAddress').value,
          builder: body.querySelector('#prjBuilder').value,
          nhbrcNo: body.querySelector('#prjNhbrc').value,
          planNo: body.querySelector('#prjPlan').value,
        });
      });
      window.NHBRC_FORMS.checklistView(active, body.querySelector('#chkBody'), escapeHtml);
    }
    render();
  }

  // ---------- Privacy Policy (POPIA-aware draft) ----------
  function viewPrivacy() {
    titleEl.textContent = 'Privacy policy';
    backBtn.classList.remove('hidden');
    setActiveTab('home');
    view.innerHTML = `<article class="lesson legal-page">
      <h2>🔒 Privacy policy</h2>
      <p class="meta">Effective ${escapeHtml(new Date().toISOString().slice(0,10))} · NHBRC Trainer · POPIA-aware draft</p>

      <h3>Who we are</h3>
      <p>NHBRC Trainer is operated by an independent author based in South Africa.
      For privacy queries, contact via <a href="https://github.com/BimboBaggins27/nhbrc-trainer/issues" target="_blank" rel="noopener">github.com/BimboBaggins27/nhbrc-trainer/issues</a>.</p>

      <h3>What we collect</h3>
      <p>By default, this app collects <strong>nothing on a server</strong>. All study
      progress, quiz scores, accounts and chat history are stored on your device using
      browser localStorage. We do not run analytics, advertising trackers or third-party
      cookies.</p>
      <p>If you create an account, we hash your password client-side (PBKDF2-SHA256,
      250 000 iterations) before saving. Plaintext passwords never leave your device.</p>
      <p>If, in future, you purchase a paid licence, we will collect:</p>
      <ul>
        <li>Your email address (to deliver your activation link)</li>
        <li>Your purchase reference (Paystack handles your card details directly — we never see them)</li>
        <li>A licence key tied to your email</li>
      </ul>
      <p>That data is only used to validate your access and contact you about substantive
      service or content updates. It is not sold or shared.</p>

      <h3>How long we keep it</h3>
      <ul>
        <li>On-device data: until you clear your browser storage or uninstall the PWA.</li>
        <li>Account / licence records (when paid backend is enabled): for as long as your
        licence is active, plus 5 years for tax / consumer-protection records (Consumer
        Protection Act, s55).</li>
      </ul>

      <h3>Your POPIA rights</h3>
      <p>Under the Protection of Personal Information Act, 2013, you have the right to:</p>
      <ul>
        <li>Confirm whether we hold any personal information about you;</li>
        <li>Request a copy of that information;</li>
        <li>Request correction or deletion;</li>
        <li>Object to processing;</li>
        <li>Lodge a complaint with the Information Regulator
          (<a href="https://inforegulator.org.za" target="_blank" rel="noopener">inforegulator.org.za</a>).</li>
      </ul>
      <p>Email any of these requests to the contact above; we'll respond within 30 days.</p>

      <h3>Children</h3>
      <p>This service is not directed at people under 18. If you believe we have
      collected information about a minor without parental consent, contact us and we
      will delete it.</p>

      <h3>Cross-border transfer</h3>
      <p>If you choose to enable the AI tutor backend, your questions are sent to
      Anthropic's API (US-hosted). Anthropic's privacy policy applies to that step.
      No personally identifying information is required to use the tutor; we send only
      the question text plus a hashed user ID for rate-limiting.</p>

      <h3>Cookies</h3>
      <p>The app does not set any HTTP cookies. localStorage entries are device-local
      and never transmitted.</p>

      <h3>Updates to this policy</h3>
      <p>If this policy changes substantively, we'll note the new effective date at the
      top and surface a one-time banner inside the app. Continued use after the change
      is your acceptance.</p>

      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el => el.addEventListener('click', () => route.back()));
  }

  // ---------- Landing & auth ----------

  function viewLanding() {
    titleEl.textContent = 'NHBRC Trainer';
    backBtn.classList.add('hidden');
    document.body.classList.add('no-tabs');
    view.innerHTML = `
      <section class="gate">
        <div class="gate-flag" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="80" height="80">
            <polygon points="32,4 60,28 60,60 4,60 4,28" fill="#fff"/>
            <polygon points="32,12 50,28 50,52 14,52 14,28" fill="#0b6e3f"/>
            <rect x="26" y="38" width="12" height="14" fill="#fff"/>
          </svg>
        </div>
        <h1 class="gate-title">NHBRC Trainer</h1>
        <p class="gate-sub">Sign in or create an account to continue.</p>
        <div class="gate-cta">
          <button class="btn primary big" data-action="login">Log in</button>
          <button class="btn secondary big" data-action="signup">Create account</button>
        </div>
        <p class="meta gate-foot"><a data-action="legal">Terms, Privacy & Sources →</a></p>
      </section>`;
    view.querySelectorAll('[data-action="signup"]').forEach(el => el.addEventListener('click', () => route.go('signup')));
    view.querySelectorAll('[data-action="login"]').forEach(el => el.addEventListener('click', () => route.go('login')));
    view.querySelectorAll('[data-action="legal"]').forEach(el => el.addEventListener('click', () => route.go('legal')));
  }

  function viewSignup() {
    titleEl.textContent = 'Create account';
    backBtn.classList.remove('hidden');
    document.body.classList.add('no-tabs');
    view.innerHTML = `<article class="auth-card">
      <h2>Create your account</h2>
      <p class="meta">Email + password. We'll send a 6-digit code to verify it's you.</p>
      <form id="signupForm" class="auth-form">
        <label>Email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"/></label>
        <label>Password<input type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters"/></label>
        <div id="signupErr" class="auth-err"></div>
        <button class="btn primary big" type="submit">Send verification code</button>
      </form>
      <p class="meta">Already have an account? <a data-action="login">Log in →</a></p>
    </article>`;
    const form = document.getElementById('signupForm');
    const err = document.getElementById('signupErr');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const fd = new FormData(form);
      const email = fd.get('email');
      const password = fd.get('password');
      const r = await A.signup(email, password);
      if (!r.ok) { err.textContent = r.error || 'Signup failed.'; return; }
      // Local-mode dev shortcut: pass the freshly-minted code on to the verify view
      route.go('verify', { email, devCode: r.code || null });
    });
    view.querySelectorAll('[data-action="login"]').forEach(el => el.addEventListener('click', () => route.go('login')));
  }

  function viewVerify(payload) {
    const email = (payload && payload.email) || '';
    const devCode = payload && payload.devCode;
    titleEl.textContent = 'Verify email';
    backBtn.classList.remove('hidden');
    document.body.classList.add('no-tabs');
    view.innerHTML = `<article class="auth-card">
      <h2>Verify your email</h2>
      <p class="meta">Enter the 6-digit code we sent to <strong>${escapeHtml(email)}</strong>.</p>
      ${devCode ? `<div class="callout warn"><strong>Dev mode</strong> — no email backend wired yet, so your code is shown here:<br/><span class="dev-code">${escapeHtml(devCode)}</span></div>` : ''}
      <form id="verifyForm" class="auth-form">
        <label>6-digit code<input name="code" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" placeholder="123456"/></label>
        <div id="verifyErr" class="auth-err"></div>
        <button class="btn primary big" type="submit">Verify & sign in</button>
      </form>
      <p class="meta">Wrong email? <a data-action="signup">Start over →</a></p>
    </article>`;
    const form = document.getElementById('verifyForm');
    const err = document.getElementById('verifyErr');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const code = new FormData(form).get('code');
      const r = await A.verify(email, code);
      if (!r.ok) { err.textContent = r.error || 'Verification failed.'; return; }
      document.body.classList.remove('no-tabs');
      route.history = [];
      route.go('home');
    });
    view.querySelectorAll('[data-action="signup"]').forEach(el => el.addEventListener('click', () => route.go('signup')));
  }

  function viewLogin() {
    titleEl.textContent = 'Log in';
    backBtn.classList.remove('hidden');
    document.body.classList.add('no-tabs');
    view.innerHTML = `<article class="auth-card">
      <h2>Welcome back</h2>
      <form id="loginForm" class="auth-form">
        <label>Email or username<input name="id" required autocomplete="username" placeholder="you@example.com or RU1"/></label>
        <label>Password<input type="password" name="password" required autocomplete="current-password" placeholder="Your password"/></label>
        <div id="loginErr" class="auth-err"></div>
        <button class="btn primary big" type="submit">Log in</button>
      </form>
      <p class="meta">No account yet? <a data-action="signup">Create one →</a></p>
    </article>`;
    const form = document.getElementById('loginForm');
    const err = document.getElementById('loginErr');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const fd = new FormData(form);
      const r = await A.login(fd.get('id'), fd.get('password'));
      if (!r.ok) { err.textContent = r.error || 'Login failed.'; return; }
      document.body.classList.remove('no-tabs');
      route.history = [];
      route.go('home');
    });
    view.querySelectorAll('[data-action="signup"]').forEach(el => el.addEventListener('click', () => route.go('signup')));
  }

  function viewAdmin() {
    if (!A || !A.isMaster()) { route.go('home'); return; }
    titleEl.textContent = 'Admin';
    backBtn.classList.remove('hidden');
    setActiveTab('home');
    const users = A.listUsers();
    view.innerHTML = `<article class="lesson legal-page">
      <h2>👑 Master admin</h2>
      <p class="meta">Logged in as the master account (${escapeHtml(A.currentUser().username || '')}).
      You have unrestricted access — paywall and verification are bypassed.</p>
      <h3>User accounts on this device (${users.length})</h3>
      <div class="admin-list">
        ${users.map(u => `<div class="admin-row">
          <div><strong>${escapeHtml(u.username || u.email)}</strong>${u.role === 'master' ? ' <span class="badge gold">MASTER</span>' : ''}</div>
          <div class="meta">${escapeHtml(u.email || '—')} · ${u.verified ? 'verified' : 'unverified'} · ${escapeHtml(u.createdAt || '')}</div>
        </div>`).join('') || '<div class="empty">No accounts yet.</div>'}
      </div>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el => el.addEventListener('click', () => route.back()));
  }

  // ---------- Helpers ----------

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setActiveTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.route === mapTab(name)));
  }
  function mapTab(name) {
    if (name === 'module') return 'home';
    if (name === 'quizlist') return 'quiz';
    if (name === 'article') return 'library';
    if (name === 'master') return 'quiz';
    if (name === 'mock') return 'quiz';
    if (name === 'tools') return 'tools';
    if (name === 'privacy') return 'me';
    if (name === 'me') return 'me';
    if (name === 'about') return 'me';
    if (name === 'legal') return 'me';
    if (name === 'admin') return 'me';
    if (name === 'progress') return 'me';
    if (name === 'glossary') return 'home';
    if (name === 'quizlist') return 'home';
    if (name === 'quiz') return 'home';
    if (name === 'master') return 'home';
    if (name === 'mock') return 'home';
    if (name === 'modules-list') return 'home';
    return name;
  }

  function render() {
    const { name, payload } = route.current;
    window.scrollTo(0, 0);
    // Auth gate — if not signed in and not on a public route, show landing.
    const PUBLIC_ROUTES = new Set(['landing', 'login', 'signup', 'verify', 'legal']);
    if (A && !A.isAuthenticated() && !PUBLIC_ROUTES.has(name)) {
      return viewLanding();
    }
    if (name === 'landing') return viewLanding();
    if (name === 'login')   return viewLogin();
    if (name === 'signup')  return viewSignup();
    if (name === 'verify')  return viewVerify(payload);
    if (name === 'admin')   return viewAdmin();
    if (name === 'module') return viewModule(payload);
    if (name === 'about') return viewAbout();
    if (name === 'quiz') return payload ? viewQuiz(payload) : viewQuizList();
    if (name === 'quizlist') return viewQuizList();
    if (name === 'glossary') return viewGlossary();
    if (name === 'progress') return viewProgress();
    if (name === 'library') return viewLibrary();
    if (name === 'article') return viewArticle(payload);
    if (name === 'master') return viewMasterQuiz();
    if (name === 'mock')   return viewMockTest();
    if (name === 'tools')  return viewTools();
    if (name === 'privacy')return viewPrivacy();
    if (name === 'me')     return viewMe();
    if (name === 'modules-list') return viewModulesList();
    if (name === 'legal') return viewLegal();
    if (name === 'unlock') return viewUnlock(payload || 'general');
    return viewHome();
  }

  function viewUnlock(context) {
    titleEl.textContent = 'Unlock full access';
    backBtn.classList.remove('hidden');
    setActiveTab(context === 'master' ? 'quiz' : 'home');
    const PAYSTACK_LINK = 'https://paystack.shop/pay/f2qzss5120';
    view.innerHTML = `<article class="lesson legal-page">
      <div class="hero" style="background:linear-gradient(135deg,#7c4f00,#f5b800)">
        <h2>🔓 Unlock the full trainer</h2>
        <p>You're paying for the <strong>service</strong> — the curation, the calculators, the quiz engine, the offline-installable app. The underlying regulations are public; the experience is what's built.</p>
      </div>
      <ul class="feature-list">
        <li>🎓 29 study modules covering every Part of SANS 10400 (A → XA)</li>
        <li>🧠 250+ quiz questions · Master Quiz · 50-q Mock NHBRC Test simulator</li>
        <li>🛠 13 on-site calculators (bricks, concrete, rebar, beams, cube tests…)</li>
        <li>📚 Curated library of free SA legislation, offline + searchable</li>
        <li>🤖 Local AI tutor (TF-IDF over the trainer's own corpus)</li>
        <li>📱 Installable PWA — fully offline once installed</li>
        <li>🔄 Updates included — content watch runs weekly</li>
      </ul>
      <div class="price-row">
        <div class="price"><span class="price-amount">R 199</span><span class="price-meta">founder lifetime · first 50 only</span></div>
        <a class="btn primary big" href="${PAYSTACK_LINK}" target="_blank" rel="noopener">Buy lifetime — R 199</a>
      </div>
      <p class="meta" style="margin-top:6px">🚀 <strong>Founder pricing</strong>: R 199 once for the first 50 buyers (then R 399). One payment, all features, all future updates.</p>
      <p class="meta" style="margin-top:14px">After payment you'll get an email with two ways to unlock — a one-tap activation link, and a 14-character licence code below in case you need to type it.</p>

      <h3 style="margin-top:22px">Already paid? Paste your licence code</h3>
      <form id="actForm" class="auth-form" style="margin-top:8px">
        <label>Licence code<input id="actCode" type="text" autocomplete="off" placeholder="NHBRC-2026-XXXX-XXXX" /></label>
        <div id="actErr" class="auth-err"></div>
        <button class="btn primary" type="submit">Unlock</button>
      </form>
      <p class="meta" style="margin-top:8px">7-day refund window if you're not satisfied. Email refund requests via the Terms page.</p>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
    const form = document.getElementById('actForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('actCode').value;
        const err = document.getElementById('actErr');
        err.textContent = '';
        const r = await window.NHBRC_LICENSE.verifyCode(code);
        if (r.ok) {
          err.style.color = '#6fdc9a';
          err.textContent = '✅ Unlocked. Reloading…';
          setTimeout(() => location.reload(), 800);
        } else {
          err.style.color = '#ff9b87';
          err.textContent = r.error || 'Activation failed.';
        }
      });
    }
  }

  function viewLegal() {
    titleEl.textContent = 'Terms, Privacy & Sources';
    backBtn.classList.remove('hidden');
    setActiveTab('home');
    view.innerHTML = `<article class="lesson legal-page">
      <h2>📜 Terms, Privacy & Sources</h2>
      <p class="meta">Effective ${escapeHtml(new Date().toISOString().slice(0,10))} · NHBRC Trainer v2.0</p>

      <h3>What this app is</h3>
      <p>NHBRC Trainer is an <strong>independent study aid</strong> for South African
      National Building Regulations and the role of the NHBRC. It is built and operated
      by an independent author and is <strong>not affiliated with, endorsed by, or
      a substitute for</strong> the South African Bureau of Standards (SABS) or the
      National Home Builders Registration Council (NHBRC).</p>

      <h3>What you are paying for</h3>
      <p>If you purchased lifetime or subscription access, you are paying for the
      <strong>service</strong>: the curated study modules, quizzes, master quiz with
      coverage tracking, glossary, search, offline PWA delivery, and the curated index
      of public sources. You are <strong>not</strong> purchasing the underlying
      regulations, standards, or third-party articles — those remain the property of
      their respective publishers and are linked, not redistributed, by this app.</p>

      <h3>Sources & licensing</h3>
      <ul>
        <li><strong>Original content (© the author of this app)</strong> — module text,
        all quiz questions and explanations, glossary definitions, the master-quiz
        coverage system, and the trainer UX. All rights reserved.</li>
        <li><strong>South African legislation (public domain)</strong> — Act 103 of
        1977 and the National Building Regulations are SA government legislation.
        The PDFs bundled in the Library tab are official copies hosted by Cape Town,
        Msunduzi, NRCS, the DTIC, and Law Explorer; they are reproducible without
        licence under SA copyright law.</li>
        <li><strong>SANS 10400 standards</strong> — the per-part standards (A through
        XA) are <strong>copyright SABS</strong>. They are not bundled. Purchase from
        the <a href="https://store.sabs.co.za/" target="_blank" rel="noopener">SABS
        Webstore</a>.</li>
        <li><strong>NHBRC Home Building Manual & Code of Conduct</strong> —
        copyright NHBRC. They are not bundled. Obtain from
        <a href="https://www.nhbrc.org.za/publications/" target="_blank" rel="noopener">nhbrc.org.za/publications</a>
        or your local NHBRC branch.</li>
        <li><strong>sans10400.co.za articles</strong> — copyright the original blog
        author. The Library tab provides a curated index with outbound links; the
        article text and images are not bundled.</li>
      </ul>

      <h3>What this app does NOT replace (read this)</h3>
      <p>This trainer is an <strong>orientation and study aid</strong>. To pass the actual
      NHBRC homebuilder competency assessment, you also need:</p>
      <ul>
        <li>The <strong>NHBRC Home Building Manual</strong> itself — purchased from NHBRC,
        contains the prescriptive tables (foundation widths by site class × wall load,
        reinforcement schedules, plumbing layouts) which are NHBRC copyright and cannot
        legally be bundled here.</li>
        <li>The <strong>current per-part SANS 10400 standards</strong> (A through XA) — sold
        by SABS. The 1990 base + 2008/2011 amendments bundled here give the regulatory
        framework, not the per-Part technical detail.</li>
        <li><strong>Practical, supervised site experience</strong> — calculating brick and
        mortar quantities, recognising soil classes in the field, sequencing inspections,
        running a competent-person interface — these need real builds, not flashcards.</li>
      </ul>
      <p>If anyone tells you they have a "complete NHBRC Q&amp;A bank that guarantees a pass",
      be sceptical. The actual exam content is not public. The most reliable strategy is
      this app + the official manuals + supervised experience.</p>

      <h3>No legal or professional advice</h3>
      <p>The content in this app is <strong>educational only</strong>. It is not legal,
      engineering, or architectural advice. SANS 10400 has been progressively superseded
      part-by-part since 2010 — for any actual plan submission you must work to the
      <strong>currently published</strong> SANS 10400 Part for the topic, the current
      NHBRC Home Building Manual, and the requirements of your local authority. Always
      consult a registered competent person.</p>

      <h3>Liability</h3>
      <p>The app is provided "as is", without any warranty of accuracy, completeness,
      or fitness for any particular purpose. To the maximum extent permitted by SA law,
      the author accepts no liability for any loss, damage, or cost arising from use of
      the app, including any reliance on its content for plan submissions, contracts,
      or compliance decisions.</p>

      <h3>Privacy</h3>
      <p>This app stores study progress and quiz history <strong>only on your own
      device</strong>, in your browser's localStorage. Nothing is sent to a server.
      Reading a module, taking a quiz, or recording your name (if asked in a future
      version) does not generate any network request beyond loading the app's own
      static files. There is no analytics, no advertising, and no third-party tracker.</p>
      <p>If you purchased access, your email and licence-key payload are stored only as
      needed to validate that licence; the payment processor (Paystack) handles your
      card details directly and the app never sees them.</p>

      <h3>Refunds</h3>
      <p>Lifetime purchases are refundable within <strong>7 days of purchase</strong>
      if you have not consumed substantial content (rule of thumb: fewer than 25%
      of modules opened). Email the contact address with your purchase reference;
      processed within 5 business days back to your original payment method via
      Paystack. The 7-day cooling-off mirrors s44 of the Consumer Protection Act
      where applicable.</p>
      <p>Subscription users can cancel at any time; the current period runs to its
      end and no future charge is made.</p>

      <h3>Governing law &amp; dispute resolution</h3>
      <p>These Terms are governed by the laws of the Republic of South Africa. The
      parties consent to the non-exclusive jurisdiction of the High Court (Gauteng
      Division). Before litigation, both parties agree to attempt good-faith resolution
      via written correspondence within 30 days of dispute notice. Where the matter
      involves consumer rights, the National Consumer Commission and tribunal procedures
      under the Consumer Protection Act, 2008 apply.</p>

      <h3>Privacy</h3>
      <p>See the separate <a data-action="privacy">Privacy policy</a> for full details on
      what data is collected, how it is stored, and your POPIA rights.</p>

      <h3>Contact</h3>
      <p>Issues, factual corrections, or commercial enquiries: please open an issue at
      <a href="https://github.com/BimboBaggins27/nhbrc-trainer/issues" target="_blank" rel="noopener">github.com/BimboBaggins27/nhbrc-trainer</a>
      or use the contact email shown at the point of sale.</p>

      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
    view.querySelectorAll('[data-action="privacy"]').forEach(el =>
      el.addEventListener('click', (e) => { e.preventDefault(); route.go('privacy'); }));
  }

  // Account button — logout + admin shortcut
  function refreshChrome() {
    if (A && A.isAuthenticated()) {
      accountBtn.classList.remove('hidden');
      document.body.classList.remove('no-tabs');
    } else {
      accountBtn.classList.add('hidden');
      document.body.classList.add('no-tabs');
    }
  }
  accountBtn.addEventListener('click', () => {
    if (!A || !A.isAuthenticated()) return;
    // Admin + Account etc. live in the Me tab; the 👤 button is just a quick
    // log-out trigger — no string typing.
    if (confirm('Log out?')) {
      A.logout();
      route.history = [];
      route.current = { name: 'landing', payload: null };
      render();
    }
  });
  if (A) A.subscribe(refreshChrome);
  refreshChrome();

  // Tabs
  tabs.forEach(t => t.addEventListener('click', () => {
    const r = t.dataset.route;
    route.history = [];
    if (r === 'quiz') route.current = { name: 'quizlist', payload: null };
    else if (r === 'library') route.current = { name: 'library', payload: null };
    else if (r === 'tools')   route.current = { name: 'tools', payload: null };
    else if (r === 'me')      route.current = { name: 'me', payload: null };
    else route.current = { name: r, payload: null };
    render();
  }));
  backBtn.addEventListener('click', () => route.back());

  // PWA install
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));

  // Deep-linking via hash: #about, #m=<moduleId>, #q=<moduleId>, #glossary, #progress
  function applyHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return;
    if (h === 'about') { route.current = { name: 'about', payload: null }; }
    else if (h === 'legal' || h === 'terms' || h === 'privacy') { route.current = { name: 'legal', payload: null }; }
    else if (h === 'glossary') { route.current = { name: 'glossary', payload: null }; }
    else if (h === 'progress') { route.current = { name: 'progress', payload: null }; }
    else if (h === 'library') { route.current = { name: 'library', payload: null }; }
    else if (h === 'master') { route.current = { name: 'master', payload: null }; }
    else if (h.startsWith('m=')) { route.current = { name: 'module', payload: h.slice(2) }; }
    else if (h.startsWith('q=')) { route.current = { name: 'quiz', payload: h.slice(2) }; }
    else if (h.startsWith('a=')) { route.current = { name: 'article', payload: h.slice(2) }; }
  }
  applyHash();
  window.addEventListener('hashchange', () => { applyHash(); render(); });

  render();
})();
