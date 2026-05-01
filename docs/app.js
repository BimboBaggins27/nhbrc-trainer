(() => {
  const D = window.NHBRC_DATA;
  const L = window.NHBRC_LIBRARY || { articles: [], pdfs: [], byModule: {} };
  const articleById = Object.fromEntries((L.articles || []).map(a => [a.id, a]));
  const view = document.getElementById('view');
  const titleEl = document.getElementById('title');
  const backBtn = document.getElementById('backBtn');
  const installBtn = document.getElementById('installBtn');
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
        <div class="meta" style="margin-top:6px">${readMods} / ${totalMods} modules read</div>
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

    // Cited sources (auto-tagged from scraped corpus)
    const citedIds = (L.byModule && L.byModule[m.id]) || [];
    if (citedIds.length) {
      const cited = citedIds.map(id => articleById[id]).filter(Boolean).slice(0, 8);
      if (cited.length) {
        html += '<div class="section-title">Cited sources</div>';
        html += '<div class="cite-list">' + cited.map(a => `
          <a class="cite-card" data-action="open-article" data-id="${escapeHtml(a.id)}">
            <div class="cite-title">${escapeHtml(a.title)}</div>
            <div class="cite-meta">${escapeHtml((a.categories || []).slice(0,2).join(' · '))}</div>
          </a>`).join('') + '</div>';
        if (citedIds.length > cited.length) {
          html += `<div class="meta">+ ${citedIds.length - cited.length} more in the Library</div>`;
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
      <p>${L.articleCount} articles &amp; ${L.pdfCount} source PDFs — searchable, offline.</p>
    </div>
    <input type="search" class="search" id="libsearch" placeholder="Search ${L.articleCount} articles…" />
    <div class="filter-row" id="libfilters">
      <button class="chip-btn active" data-cat="">All</button>
      ${topCats.map(([c,n]) => `<button class="chip-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)} <span class="chip-num">${n}</span></button>`).join('')}
    </div>

    <div class="section-title">Source documents (PDF)</div>
    <div class="pdf-list">
      ${L.pdfs.map(p => `<a class="card pdf-card" href="${escapeHtml(p.file)}" target="_blank" rel="noopener">
        <div class="pdf-icon">📕</div>
        <div class="pdf-body">
          <div class="pdf-title">${escapeHtml(p.title)}</div>
          <div class="meta">${escapeHtml(p.description)}</div>
          <div class="meta">${p.sizeMb} MB · ${escapeHtml(p.source)}</div>
        </div>
      </a>`).join('')}
    </div>

    <div class="section-title">Articles</div>
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
          (a.summary || '').toLowerCase().includes(qq) ||
          (a.body || '').toLowerCase().includes(qq)
        );
      }
      if (!arts.length) {
        listEl.innerHTML = '<div class="empty">No matches.</div>';
        return;
      }
      listEl.innerHTML = arts.slice(0, 200).map(a => `
        <a class="card lib-card" data-action="open-article" data-id="${escapeHtml(a.id)}">
          <div class="lib-title">${escapeHtml(a.title)}</div>
          <div class="meta">${escapeHtml(a.summary || '')}</div>
          <div class="tag-row">${(a.categories||[]).slice(0,3).map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join('')}</div>
        </a>`).join('') +
        (arts.length > 200 ? `<div class="meta" style="text-align:center;margin:10px">Showing first 200 of ${arts.length} — narrow your search.</div>` : '');
      listEl.querySelectorAll('[data-action="open-article"]').forEach(el =>
        el.addEventListener('click', () => route.go('article', el.dataset.id)));
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
    const a = articleById[id];
    if (!a) return route.go('library');
    titleEl.textContent = a.title;
    backBtn.classList.remove('hidden');
    setActiveTab('library');

    let html = `<article class="lesson lib-article">
      <h2>${escapeHtml(a.title)}</h2>
      <div class="meta">
        ${(a.categories||[]).map(c => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')}
      </div>
      <div class="meta" style="margin-top:6px">
        <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" class="btn-link">↗ Original on sans10400.co.za</a>
      </div>
      <div class="md-body">${renderMarkdown(a.body || '')}</div>
      <div class="actions"><button class="btn secondary" data-action="back">Back</button></div>
    </article>`;
    view.innerHTML = html;
    view.querySelectorAll('[data-action="back"]').forEach(el =>
      el.addEventListener('click', () => route.back()));
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

  function viewQuizList() {
    titleEl.textContent = 'Quiz';
    backBtn.classList.add('hidden');
    setActiveTab('quiz');
    const progress = store.load();

    let html = `<div class="hero" style="background:linear-gradient(135deg,#7c4f00,#f5b800)">
      <h2>Test yourself</h2><p>Pick any topic and answer the questions.</p></div>
      <div class="section-title">Quizzes</div>`;
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
  }

  function viewQuiz(modId) {
    const q = D.quizzes.find(x => x.moduleId === modId);
    if (!q) return route.go('quizlist');
    const m = D.modules.find(x => x.id === modId);
    titleEl.textContent = 'Quiz: ' + (m?.title || q.title);
    backBtn.classList.remove('hidden');
    setActiveTab('quiz');

    // Shuffled question state
    const questions = q.questions.map((qq, i) => ({ ...qq, idx: i }));
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
    if (name === 'diagrams') return 'diagrams';
    return name;
  }

  function render() {
    const { name, payload } = route.current;
    window.scrollTo(0, 0);
    if (name === 'module') return viewModule(payload);
    if (name === 'about') return viewAbout();
    if (name === 'quiz') return payload ? viewQuiz(payload) : viewQuizList();
    if (name === 'quizlist') return viewQuizList();
    if (name === 'glossary') return viewGlossary();
    if (name === 'progress') return viewProgress();
    if (name === 'library') return viewLibrary();
    if (name === 'article') return viewArticle(payload);
    if (name === 'diagrams') return viewDiagrams();
    return viewHome();
  }

  // Tabs
  tabs.forEach(t => t.addEventListener('click', () => {
    const r = t.dataset.route;
    route.history = [];
    if (r === 'quiz') route.current = { name: 'quizlist', payload: null };
    else if (r === 'library') route.current = { name: 'library', payload: null };
    else if (r === 'diagrams') route.current = { name: 'diagrams', payload: null };
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
    else if (h === 'glossary') { route.current = { name: 'glossary', payload: null }; }
    else if (h === 'progress') { route.current = { name: 'progress', payload: null }; }
    else if (h === 'library') { route.current = { name: 'library', payload: null }; }
    else if (h === 'diagrams') { route.current = { name: 'diagrams', payload: null }; }
    else if (h.startsWith('m=')) { route.current = { name: 'module', payload: h.slice(2) }; }
    else if (h.startsWith('q=')) { route.current = { name: 'quiz', payload: h.slice(2) }; }
    else if (h.startsWith('a=')) { route.current = { name: 'article', payload: h.slice(2) }; }
  }
  applyHash();
  window.addEventListener('hashchange', () => { applyHash(); render(); });

  render();
})();
