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

    let html = `
      <div class="hero hero-flag">
        <div class="hero-content">
          <h2>${D.meta.title}</h2>
          <p>${D.meta.subtitle}</p>
        </div>
        <div class="hero-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <polygon points="32,4 60,28 60,60 4,60 4,28" fill="#fff" opacity=".95"/>
            <polygon points="32,12 50,28 50,52 14,52 14,28" fill="#0b6e3f"/>
            <rect x="26" y="38" width="12" height="14" fill="#fff"/>
            <circle cx="32" cy="50" r="1.5" fill="#0b6e3f"/>
          </svg>
        </div>
      </div>
      <a class="card warn-banner" data-action="legal">
        <div class="warn-icon">⚠️</div>
        <div class="warn-text">
          <strong>Independent study aid — not affiliated with NHBRC or SABS.</strong>
          This trainer is a learning service. The official SANS 10400 standards (SABS, paid)
          and NHBRC Home Building Manual must be obtained from their publishers and consulted
          before any plan submission. Tap for Terms, Privacy & Sources →
        </div>
      </a>
      <a class="card source-card" data-action="about">
        <div class="source-row">
          <div class="source-icon">ℹ️</div>
          <div class="source-text">
            <div class="source-title">About this guide</div>
            <div class="source-sub">${escapeHtml(D.meta.sourceLabel)}</div>
          </div>
          <div class="source-chev">›</div>
        </div>
        <div class="progressbar"><span style="width:${(readMods/totalMods*100).toFixed(0)}%"></span></div>
        <div class="meta" style="margin-top:6px">${readMods} / ${totalMods} modules read · ${(L.pdfs||[]).length} reference PDFs in Library</div>
      </a>
      <div class="section-title">Modules</div>
    `;

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
      <p>Curated index — bundled public-domain legislation + links out to authoritative sources.</p>
    </div>

    <div class="section-title">📕 Bundled (public-domain legislation)</div>
    <div class="pdf-list">
      ${L.pdfs.map(p => `<a class="card pdf-card" href="${escapeHtml(p.file)}" target="_blank" rel="noopener">
        <div class="pdf-icon">📕</div>
        <div class="pdf-body">
          <div class="pdf-title">${escapeHtml(p.title)}</div>
          <div class="meta">${escapeHtml(p.description)}</div>
          <div class="meta">${p.sizeMb} MB · ${escapeHtml(p.source)} · public domain</div>
        </div>
      </a>`).join('')}
    </div>

    <div class="section-title">🔗 Buy / get from official source</div>
    <div class="pdf-list">
      ${(L.externalDocs || []).map(d => `<a class="card pdf-card ext-card" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">
        <div class="pdf-icon">↗</div>
        <div class="pdf-body">
          <div class="pdf-title">${escapeHtml(d.title)}</div>
          <div class="meta">${escapeHtml(d.note)}</div>
          <div class="meta">Publisher: ${escapeHtml(d.publisher)}</div>
        </div>
      </a>`).join('')}
    </div>

    <div class="section-title">🗞️ Curated articles <span class="meta-inline">(${L.articleCount} — open on sans10400.co.za)</span></div>
    <input type="search" class="search" id="libsearch" placeholder="Search by title or category…" />
    <div class="filter-row" id="libfilters">
      <button class="chip-btn active" data-cat="">All</button>
      ${topCats.map(([c,n]) => `<button class="chip-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)} <span class="chip-num">${n}</span></button>`).join('')}
    </div>
    <div class="meta" style="margin:6px 0 4px">${escapeHtml(L.articlesNote || '')}</div>
    <div id="liblist"></div>`;
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
        // ignore clicks that bubble up from the inner reset link
        if (e.target.closest('[data-action="reset-cycle"]')) return;
        route.go('master', null);
      }));
    view.querySelectorAll('[data-action="reset-cycle"]').forEach(el =>
      el.addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (confirm('Start a fresh cycle? Past score history will be kept.')) {
          resetSeen();
          render();
        }
      }));
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
    if (name === 'legal') return viewLegal();
    if (name === 'unlock') return viewUnlock(payload || 'general');
    return viewHome();
  }

  function viewUnlock(context) {
    titleEl.textContent = 'Unlock full access';
    backBtn.classList.remove('hidden');
    setActiveTab(context === 'master' ? 'quiz' : 'home');
    const PAYSTACK_LINK = 'https://paystack.com/pay/nhbrc-trainer-lifetime'; // placeholder — replace with your real Paystack page slug
    view.innerHTML = `<article class="lesson legal-page">
      <div class="hero" style="background:linear-gradient(135deg,#7c4f00,#f5b800)">
        <h2>🔓 Unlock the Master Quiz & all premium features</h2>
        <p>Lifetime access. One payment. Updates included.</p>
      </div>
      <ul class="feature-list">
        <li>✅ All 17 study modules</li>
        <li>✅ All 56 per-module quiz questions</li>
        <li>🏆 Master Quiz with smart coverage tracking</li>
        <li>📚 Library + curated outbound index</li>
        <li>📜 Bundled public-domain SA legislation PDFs</li>
        <li>📱 Installable PWA — works offline once installed</li>
      </ul>
      <div class="price-row">
        <div class="price"><span class="price-amount">R 399</span><span class="price-meta">once · lifetime</span></div>
        <a class="btn primary big" href="${PAYSTACK_LINK}" target="_blank" rel="noopener">Buy lifetime — R 399</a>
      </div>
      <p class="meta" style="margin-top:14px">After payment you'll receive an email with a one-tap activation link.
      Tap it on the same device you want to use the app on.</p>
      <p class="meta">Already paid? Open your activation email and tap the unlock link again.</p>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
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
      <p>Lifetime purchases are refundable within 7 days of purchase if you have not
      consumed substantial content. Email refund requests to the address listed on the
      site checkout page.</p>

      <h3>Contact</h3>
      <p>Issues, factual corrections, or commercial enquiries: please open an issue at
      <a href="https://github.com/BimboBaggins27/nhbrc-trainer/issues" target="_blank" rel="noopener">github.com/BimboBaggins27/nhbrc-trainer</a>
      or use the contact email shown at the point of sale.</p>

      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
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
    const u = A.currentUser();
    const isMaster = A.isMaster();
    const choice = prompt(
      `Signed in as ${u.username || u.email} (${u.role || 'user'}).\n\n` +
      (isMaster ? 'Type "admin" to open the admin panel, "logout" to sign out, or close.' : 'Type "logout" to sign out, or close.'),
      ''
    );
    if (!choice) return;
    const c = choice.trim().toLowerCase();
    if (c === 'logout') { A.logout(); route.history = []; route.current = { name: 'landing', payload: null }; render(); }
    else if (c === 'admin' && isMaster) { route.go('admin'); }
  });
  if (A) A.subscribe(refreshChrome);
  refreshChrome();

  // Tabs
  tabs.forEach(t => t.addEventListener('click', () => {
    const r = t.dataset.route;
    route.history = [];
    if (r === 'quiz') route.current = { name: 'quizlist', payload: null };
    else if (r === 'library') route.current = { name: 'library', payload: null };
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
