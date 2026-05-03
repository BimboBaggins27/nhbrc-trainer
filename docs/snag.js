// Snag report / progress photo tracker.
// Capture phone-camera photos via input[type=file capture=environment],
// compress JPEG client-side, store blob in IndexedDB, metadata in localStorage.
// Per-snag and project-wide PDF export. Works fully offline.

window.NHBRC_SNAG = (function () {
  const META_KEY = 'nhbrc.snag.meta.v1';
  const DB_NAME  = 'nhbrc-snag';
  const STORE    = 'photos';

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }
  function nowIso() { return new Date().toISOString(); }
  function escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // ---------- Metadata layer (localStorage) ----------
  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return { version: 1, snags: [] };
      return JSON.parse(raw);
    } catch (_) { return { version: 1, snags: [] }; }
  }
  function saveMeta(m) { localStorage.setItem(META_KEY, JSON.stringify(m)); }

  function listSnags(filter) {
    const m = loadMeta();
    let s = m.snags.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter?.status) s = s.filter(x => x.status === filter.status);
    if (filter?.project) s = s.filter(x => x.projectName === filter.project);
    return s;
  }
  function getSnag(id) {
    return loadMeta().snags.find(s => s.id === id) || null;
  }
  function saveSnag(snag) {
    const m = loadMeta();
    const i = m.snags.findIndex(s => s.id === snag.id);
    if (i >= 0) m.snags[i] = { ...m.snags[i], ...snag, updatedAt: nowIso() };
    else m.snags.push({ ...snag, createdAt: nowIso(), updatedAt: nowIso() });
    saveMeta(m);
    return snag;
  }
  function deleteSnag(id) {
    const m = loadMeta();
    const snag = m.snags.find(s => s.id === id);
    m.snags = m.snags.filter(s => s.id !== id);
    saveMeta(m);
    // Also clean up photos
    if (snag && snag.photoIds) {
      Promise.all(snag.photoIds.map(deletePhoto)).catch(() => {});
    }
  }
  function listProjects() {
    const m = loadMeta();
    return [...new Set(m.snags.map(s => s.projectName).filter(Boolean))].sort();
  }

  // ---------- Photo blob layer (IndexedDB) ----------
  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function putPhoto(id, blob, capturedAt) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ id, blob, capturedAt: capturedAt || nowIso() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  async function getPhoto(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function deletePhoto(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------- Image compression ----------
  // Resize to max 1200 px on the long side, JPEG quality 0.7 — typically 80–200 KB
  async function compressImage(file) {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1200;
    let { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close && bitmap.close();
    if (canvas.convertToBlob) {
      return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.72 });
    }
    return await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.72));
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  // ---------- View ----------
  function snagView(target) {
    let route = 'list';      // 'list' | 'edit'
    let editId = null;
    let projectFilter = '';
    let statusFilter = '';

    function renderList() {
      const projects = listProjects();
      const snags = listSnags({
        project: projectFilter || undefined,
        status:  statusFilter  || undefined,
      });
      const open    = snags.filter(s => s.status === 'open').length;
      const fixed   = snags.filter(s => s.status === 'fixed').length;
      const total   = snags.length;
      target.innerHTML = `
        <div class="hero" style="background:linear-gradient(135deg,#7a4a8a,#a06bb8);color:#fff;padding:16px 18px;border-radius:14px;margin:6px 0 12px">
          <h2 style="margin:0">📸 Snag report &amp; progress tracker</h2>
          <p style="margin:4px 0 0;opacity:.92;font-size:14px">Camera-capture site issues + progress photos. Compressed and stored on this device. Export per-snag or project-wide PDF.</p>
        </div>

        <div class="progress-stats" style="margin-bottom:10px">
          <div class="stat"><div class="num">${total}</div><div class="lbl">Total</div></div>
          <div class="stat"><div class="num" style="color:var(--danger)">${open}</div><div class="lbl">Open</div></div>
          <div class="stat"><div class="num" style="color:var(--good)">${fixed}</div><div class="lbl">Fixed</div></div>
        </div>

        <div class="actions" style="margin-bottom:12px">
          <button class="btn primary" id="snag-new">＋ New snag / photo</button>
          <button class="btn secondary" id="snag-export-all" ${total===0?'disabled':''}>📄 Export all (PDF)</button>
        </div>

        <div class="filter-row" style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap">
          <select id="snag-flt-prj" class="search" style="margin:0;width:auto;min-width:120px;flex:1">
            <option value="">All projects</option>
            ${projects.map(p => `<option ${p===projectFilter?'selected':''}>${escape(p)}</option>`).join('')}
          </select>
          <select id="snag-flt-st" class="search" style="margin:0;width:auto;min-width:110px">
            <option value="">All statuses</option>
            <option value="open"   ${statusFilter==='open'?'selected':''}>Open only</option>
            <option value="fixed"  ${statusFilter==='fixed'?'selected':''}>Fixed only</option>
            <option value="wontfix"${statusFilter==='wontfix'?'selected':''}>Won't fix</option>
          </select>
        </div>

        ${snags.length === 0 ? `
          <div class="empty">
            <p>📷 No snags yet.</p>
            <p style="font-size:13px">Tap <strong>New snag / photo</strong> to start. On a phone the camera opens directly.</p>
          </div>
        ` : `
          <div id="snag-list" style="display:grid;gap:8px"></div>
        `}
      `;

      target.querySelector('#snag-new').onclick = () => { editId = null; route = 'edit'; render(); };
      target.querySelector('#snag-export-all').onclick = exportAllPdf;
      target.querySelector('#snag-flt-prj').onchange = (e) => { projectFilter = e.target.value; render(); };
      target.querySelector('#snag-flt-st').onchange  = (e) => { statusFilter  = e.target.value; render(); };

      // Render snag rows with thumbnails (async — replace placeholders)
      const listEl = target.querySelector('#snag-list');
      if (listEl && snags.length) {
        snags.forEach(s => {
          const el = document.createElement('div');
          el.className = 'card';
          el.style.cursor = 'pointer';
          el.dataset.id = s.id;
          const sevColor = ({ low:'#888', medium:'#c87a00', high:'#c8513e' })[s.severity] || '#888';
          const stColor  = ({ open:'#c8513e', fixed:'var(--good)', wontfix:'#888' })[s.status]   || '#888';
          el.innerHTML = `
            <div style="display:flex;gap:10px;align-items:flex-start">
              <div class="thumb-wrap" style="width:64px;height:64px;flex-shrink:0;background:#222;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center">
                <span style="font-size:24px">📷</span>
              </div>
              <div style="flex:1;min-width:0">
                <h3 style="margin:0 0 2px;font-size:15px">${escape(s.title || '(untitled)')}</h3>
                <div class="meta" style="font-size:12px">
                  <span style="display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(0,0,0,.06);color:${sevColor};font-weight:700;font-size:10px;letter-spacing:.04em;text-transform:uppercase;margin-right:4px">${s.severity}</span>
                  <span style="display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(0,0,0,.06);color:${stColor};font-weight:700;font-size:10px;letter-spacing:.04em;text-transform:uppercase;margin-right:4px">${s.status}</span>
                  ${s.location ? `· ${escape(s.location)}` : ''}
                </div>
                <div class="meta" style="font-size:11px;color:var(--muted);margin-top:2px">
                  ${s.projectName ? escape(s.projectName) + ' · ' : ''}${s.createdAt.slice(0,10)} · ${(s.photoIds||[]).length} photo${(s.photoIds||[]).length===1?'':'s'}
                </div>
              </div>
              <div style="font-size:18px;color:var(--muted);align-self:center">›</div>
            </div>
          `;
          el.onclick = () => { editId = s.id; route = 'edit'; render(); };
          listEl.appendChild(el);

          // Async thumbnail load
          if ((s.photoIds||[]).length) {
            getPhoto(s.photoIds[0]).then(p => {
              if (!p) return;
              const url = URL.createObjectURL(p.blob);
              const wrap = el.querySelector('.thumb-wrap');
              wrap.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover">`;
            }).catch(() => {});
          }
        });
      }
    }

    function renderEdit() {
      const isNew = !editId;
      const s = isNew ? {
        id: uid('snag'),
        projectName: '', erf: '',
        title: '', location: '', description: '',
        severity: 'medium', status: 'open',
        photoIds: [],
      } : { ...getSnag(editId) };

      target.innerHTML = `
        <div class="actions" style="margin-bottom:8px">
          <button class="btn secondary" id="snag-back">← Back to list</button>
        </div>
        <h2 style="margin:6px 0 12px">${isNew ? 'New snag' : 'Edit snag'}</h2>

        <div class="calc-form">
          <label class="calc-field"><span>Title *</span><input id="s-title" type="text" value="${escape(s.title)}" placeholder="e.g. Cracked tile in master bathroom"></label>
          <label class="calc-field"><span>Project / site</span><input id="s-project" list="prjList" type="text" value="${escape(s.projectName)}" placeholder="Project name"></label>
          <datalist id="prjList">${listProjects().map(p => `<option>${escape(p)}</option>`).join('')}</datalist>
          <label class="calc-field"><span>Erf / stand</span><input id="s-erf" type="text" value="${escape(s.erf)}"></label>
          <label class="calc-field"><span>Location on site</span><input id="s-loc" type="text" value="${escape(s.location)}" placeholder="e.g. Master bathroom, NW corner"></label>
          <label class="calc-field"><span>Severity</span>
            <select id="s-sev">
              <option value="low"    ${s.severity==='low'   ?'selected':''}>Low — cosmetic / non-urgent</option>
              <option value="medium" ${s.severity==='medium'?'selected':''}>Medium — fix before next stage</option>
              <option value="high"   ${s.severity==='high'  ?'selected':''}>High — block work / safety risk</option>
            </select>
          </label>
          <label class="calc-field"><span>Status</span>
            <select id="s-st">
              <option value="open"    ${s.status==='open'   ?'selected':''}>Open</option>
              <option value="fixed"   ${s.status==='fixed'  ?'selected':''}>Fixed</option>
              <option value="wontfix" ${s.status==='wontfix'?'selected':''}>Won't fix</option>
            </select>
          </label>
          <label class="calc-field"><span>Description / notes</span><textarea id="s-desc" rows="4" placeholder="What's wrong? Who needs to fix it? Reference photos below.">${escape(s.description||'')}</textarea></label>
        </div>

        <div class="section-title" style="margin-top:14px">Photos (${(s.photoIds||[]).length})</div>

        <div class="actions" style="margin:6px 0">
          <input type="file" id="s-cam" accept="image/*" capture="environment" multiple style="display:none">
          <input type="file" id="s-pick" accept="image/*" multiple style="display:none">
          <button class="btn primary" id="s-cam-btn">📷 Take photo</button>
          <button class="btn secondary" id="s-pick-btn">🖼 Pick from gallery</button>
        </div>

        <div id="s-photos" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:14px"></div>

        <div class="actions" style="margin-top:14px">
          <button class="btn primary" id="s-save">${isNew?'Save snag':'Save changes'}</button>
          <button class="btn secondary" id="s-pdf" ${isNew?'disabled':''}>📄 Export this snag (PDF)</button>
          ${isNew ? '' : '<button class="btn danger" id="s-del">Delete</button>'}
        </div>
      `;

      target.querySelector('#snag-back').onclick = () => { route = 'list'; render(); };

      // Wire camera + gallery (both feed the same handler)
      const camInput  = target.querySelector('#s-cam');
      const pickInput = target.querySelector('#s-pick');
      target.querySelector('#s-cam-btn').onclick  = () => camInput.click();
      target.querySelector('#s-pick-btn').onclick = () => pickInput.click();
      camInput.onchange  = (e) => handleFiles([...e.target.files]);
      pickInput.onchange = (e) => handleFiles([...e.target.files]);

      async function handleFiles(files) {
        for (const f of files) {
          try {
            const blob = await compressImage(f);
            const photoId = uid('photo');
            await putPhoto(photoId, blob, nowIso());
            s.photoIds = (s.photoIds || []).concat(photoId);
            renderThumbs();
          } catch (err) {
            console.error('photo failed', err);
            alert('Failed to load photo: ' + (err && err.message || err));
          }
        }
      }

      const thumbsEl = target.querySelector('#s-photos');
      function renderThumbs() {
        thumbsEl.innerHTML = '';
        if (!s.photoIds || !s.photoIds.length) {
          thumbsEl.innerHTML = '<div class="empty" style="grid-column:1/-1;padding:18px;font-size:13px">No photos yet — tap 📷 Take photo to start.</div>';
          return;
        }
        s.photoIds.forEach((pid, idx) => {
          const tile = document.createElement('div');
          tile.style.cssText = 'position:relative;aspect-ratio:1/1;background:#222;border-radius:8px;overflow:hidden';
          tile.innerHTML = `
            <div class="ph-loading" style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:11px">loading…</div>
            <button type="button" data-rm="${idx}" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);color:#fff;border:0;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px">×</button>`;
          thumbsEl.appendChild(tile);
          getPhoto(pid).then(p => {
            if (!p) return;
            const url = URL.createObjectURL(p.blob);
            const ld = tile.querySelector('.ph-loading');
            if (ld) ld.remove();
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;cursor:zoom-in';
            img.onclick = () => window.open(url, '_blank');
            tile.insertBefore(img, tile.firstChild);
          });
        });
        thumbsEl.querySelectorAll('[data-rm]').forEach(btn => {
          btn.onclick = (ev) => {
            ev.stopPropagation();
            const i = +btn.dataset.rm;
            const pid = s.photoIds[i];
            s.photoIds.splice(i, 1);
            deletePhoto(pid).catch(() => {});
            renderThumbs();
          };
        });
      }
      renderThumbs();

      target.querySelector('#s-save').onclick = () => {
        const get = sel => target.querySelector(sel)?.value || '';
        const data = {
          ...s,
          title:       get('#s-title').trim(),
          projectName: get('#s-project').trim(),
          erf:         get('#s-erf').trim(),
          location:    get('#s-loc').trim(),
          severity:    get('#s-sev'),
          status:      get('#s-st'),
          description: get('#s-desc').trim(),
        };
        if (!data.title) { alert('Title is required.'); return; }
        // Set fixedAt timestamp if just transitioned to fixed
        if (data.status === 'fixed' && !s.fixedAt) data.fixedAt = nowIso();
        saveSnag(data);
        editId = data.id;
        route = 'list';
        render();
      };

      const delBtn = target.querySelector('#s-del');
      if (delBtn) delBtn.onclick = () => {
        if (confirm('Delete this snag and all its photos? Cannot be undone.')) {
          deleteSnag(s.id);
          editId = null;
          route = 'list';
          render();
        }
      };

      target.querySelector('#s-pdf').onclick = () => exportSingleSnagPdf(s);
    }

    function render() {
      if (route === 'edit') renderEdit();
      else renderList();
    }
    render();
  }

  // ---------- PDF export ----------

  async function exportSingleSnagPdf(snag) {
    // Resolve photo blobs → data URLs for embedding
    const photos = await Promise.all((snag.photoIds || []).map(async pid => {
      const p = await getPhoto(pid);
      if (!p) return null;
      return { id: pid, dataUrl: await blobToDataUrl(p.blob), capturedAt: p.capturedAt };
    }));
    const sevLabel = ({ low:'Low (cosmetic)', medium:'Medium (fix before next stage)', high:'High (blocking / safety)' })[snag.severity] || snag.severity;
    const stLabel = ({ open:'OPEN', fixed:'FIXED', wontfix:'WON\'T FIX' })[snag.status] || snag.status;
    const stColor = ({ open:'#c8513e', fixed:'#0b6e3f', wontfix:'#888' })[snag.status] || '#444';

    const photoBlocks = photos.filter(Boolean).map((ph, i) => `
      <div style="page-break-inside:avoid;margin:10pt 0">
        <div style="font-size:9pt;color:#777;margin-bottom:4pt">Photo ${i+1} · captured ${ph.capturedAt.slice(0,19).replace('T',' ')}</div>
        <img src="${ph.dataUrl}" style="max-width:100%;max-height:480pt;border:1pt solid #ccc;border-radius:4pt;display:block;margin:0 auto">
      </div>`).join('');

    openSnagPrint('Snag report — ' + (snag.title || 'untitled'), `
      ${snagLetterhead({
        docNo: 'SNAG · ' + snag.id.toUpperCase(),
        title: snag.title || 'Snag report',
        subtitle: snag.projectName ? snag.projectName + (snag.erf ? ' · Erf ' + snag.erf : '') : '',
        date: snag.createdAt.slice(0,10),
      })}
      <div style="display:flex;gap:8pt;margin:8pt 0 14pt">
        <div style="background:${stColor};color:#fff;padding:4pt 10pt;border-radius:4pt;font-weight:700;font-size:9pt;letter-spacing:.06em">${stLabel}</div>
        <div style="background:#eee;color:#333;padding:4pt 10pt;border-radius:4pt;font-size:9pt">Severity: <strong>${escape(sevLabel)}</strong></div>
      </div>
      <table class="data" style="margin-bottom:12pt">
        <tbody>
          <tr><th style="width:140pt">Project</th><td>${escape(snag.projectName||'—')}</td></tr>
          <tr><th>Erf / stand</th><td>${escape(snag.erf||'—')}</td></tr>
          <tr><th>Location on site</th><td>${escape(snag.location||'—')}</td></tr>
          <tr><th>Reported</th><td>${escape(snag.createdAt.slice(0,19).replace('T',' '))}</td></tr>
          <tr><th>Last updated</th><td>${escape((snag.updatedAt||snag.createdAt).slice(0,19).replace('T',' '))}</td></tr>
          ${snag.fixedAt ? `<tr><th>Fixed at</th><td>${escape(snag.fixedAt.slice(0,19).replace('T',' '))}</td></tr>` : ''}
        </tbody>
      </table>
      <h2>Description</h2>
      <p style="white-space:pre-wrap">${escape(snag.description || '(no description)')}</p>
      ${photos.length ? `<h2>Photos (${photos.length})</h2>${photoBlocks}` : ''}
      <h2>Sign-off</h2>
      <table class="signoff-matrix">
        <thead><tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr></thead>
        <tbody>
          <tr><td class="label">Reporter</td><td></td><td></td><td></td></tr>
          <tr><td class="label">Site agent / foreman</td><td></td><td></td><td></td></tr>
          <tr><td class="label">Subcontractor (if assigned)</td><td></td><td></td><td></td></tr>
          <tr><td class="label">Principal agent / inspector</td><td></td><td></td><td></td></tr>
        </tbody>
      </table>
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toLocaleString('en-ZA')} · Reference document.</div>
    `);
  }

  async function exportAllPdf() {
    const snags = listSnags();
    if (!snags.length) return;

    // Resolve all photo blobs concurrently
    const allPhotos = {};
    await Promise.all(snags.flatMap(s => (s.photoIds || []).map(async pid => {
      const p = await getPhoto(pid);
      if (p) allPhotos[pid] = await blobToDataUrl(p.blob);
    })));

    const projects = [...new Set(snags.map(s => s.projectName || '(unassigned)'))];
    const summaryRows = snags.map((s, i) => {
      const sevColor = ({ low:'#888', medium:'#c87a00', high:'#c8513e' })[s.severity] || '#888';
      const stColor  = ({ open:'#c8513e', fixed:'#0b6e3f', wontfix:'#888' })[s.status] || '#888';
      return `
        <tr>
          <td>${i+1}</td>
          <td>${escape(s.title)}</td>
          <td>${escape(s.projectName||'—')}</td>
          <td>${escape(s.location||'—')}</td>
          <td style="color:${sevColor};font-weight:700;text-transform:uppercase">${s.severity}</td>
          <td style="color:${stColor};font-weight:700;text-transform:uppercase">${s.status}</td>
          <td>${escape(s.createdAt.slice(0,10))}</td>
          <td style="text-align:center">${(s.photoIds||[]).length}</td>
        </tr>`;
    }).join('');

    const detail = snags.map(s => {
      const photos = (s.photoIds||[]).map(pid => allPhotos[pid]).filter(Boolean);
      const sevLabel = ({ low:'Low', medium:'Medium', high:'High' })[s.severity] || s.severity;
      const stColor = ({ open:'#c8513e', fixed:'#0b6e3f', wontfix:'#888' })[s.status] || '#444';
      return `
        <div style="page-break-before:always">
          <h2>${escape(s.title)}</h2>
          <div style="display:flex;gap:6pt;margin:4pt 0 8pt">
            <div style="background:${stColor};color:#fff;padding:3pt 8pt;border-radius:3pt;font-size:8.5pt;font-weight:700;text-transform:uppercase">${s.status}</div>
            <div style="background:#eee;color:#333;padding:3pt 8pt;border-radius:3pt;font-size:8.5pt">Severity: ${sevLabel}</div>
          </div>
          <table class="data" style="margin-bottom:8pt">
            <tbody>
              <tr><th style="width:120pt">Project</th><td>${escape(s.projectName||'—')}</td></tr>
              <tr><th>Erf / stand</th><td>${escape(s.erf||'—')}</td></tr>
              <tr><th>Location</th><td>${escape(s.location||'—')}</td></tr>
              <tr><th>Reported</th><td>${escape(s.createdAt.slice(0,19).replace('T',' '))}</td></tr>
              ${s.fixedAt ? `<tr><th>Fixed at</th><td>${escape(s.fixedAt.slice(0,19).replace('T',' '))}</td></tr>` : ''}
            </tbody>
          </table>
          <p style="white-space:pre-wrap">${escape(s.description || '(no description)')}</p>
          ${photos.map((url, i) => `
            <div style="page-break-inside:avoid;margin:6pt 0">
              <div style="font-size:8.5pt;color:#777;margin-bottom:3pt">Photo ${i+1}</div>
              <img src="${url}" style="max-width:100%;max-height:380pt;border:0.5pt solid #ccc;border-radius:3pt;display:block">
            </div>`).join('')}
        </div>`;
    }).join('');

    openSnagPrint('Snag list', `
      ${snagLetterhead({
        docNo: 'SNAG REPORT — CONSOLIDATED',
        title: 'Snag list',
        subtitle: 'All open and closed snags · ' + projects.join(', '),
        date: new Date().toISOString().slice(0,10),
      })}
      <h2>Summary</h2>
      <table class="data">
        <thead>
          <tr><th>#</th><th>Title</th><th>Project</th><th>Location</th><th>Sev</th><th>Status</th><th>Date</th><th>Photos</th></tr>
        </thead>
        <tbody>${summaryRows}</tbody>
      </table>
      <h2 style="margin-top:20pt">Detail</h2>
      ${detail}
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toLocaleString('en-ZA')} · ${snags.length} snag${snags.length===1?'':'s'}.</div>
    `);
  }

  function snagLetterhead({ docNo, title, subtitle, date }) {
    return `
      <div class="letterhead">
        <div class="left">
          <div class="doc-no">${escape(docNo || '')}</div>
          <h1>${escape(title)}</h1>
          ${subtitle ? `<div style="font-size:9pt;color:#666;margin-top:2pt">${escape(subtitle)}</div>` : ''}
        </div>
        <div class="right">
          <div><strong>Generated</strong>: ${escape(date)}</div>
          <div>NHBRC Trainer</div>
          <div style="margin-top:3pt">Reference document only</div>
        </div>
      </div>`;
  }

  function openSnagPrint(title, bodyHtml) {
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) { alert('Allow pop-ups to generate the PDF.'); return; }
    w.document.write(`<!doctype html><html><head>
      <meta charset="utf-8"/><title>${escape(title)}</title>
      <style>
        @page { size: A4; margin: 16mm 14mm; }
        body { font: 10.5pt/1.4 -apple-system, system-ui, "Segoe UI", sans-serif; color: #111; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 17pt; margin: 0 0 4pt; color: #0b6e3f; letter-spacing: -0.02em; }
        h2 { font-size: 12pt; margin: 14pt 0 5pt; border-bottom: 1.5pt solid #0b6e3f; padding-bottom: 3pt; color: #0b6e3f; text-transform: uppercase; letter-spacing: 0.04em; }
        .letterhead { display: grid; grid-template-columns: 1fr auto; gap: 12pt; align-items: end; padding: 12pt 0 10pt; border-bottom: 2pt solid #0b6e3f; margin-bottom: 14pt; }
        .letterhead .left .doc-no { font-size: 8.5pt; color: #888; letter-spacing: 0.15em; text-transform: uppercase; }
        .letterhead .right { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.45; }
        .letterhead .right strong { color: #111; }
        table.data { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6pt 0; }
        table.data th { background: #eef0ec; border: 0.5pt solid #cad6cd; padding: 4pt 6pt; text-align: left; font-size: 8.5pt; }
        table.data td { border: 0.5pt solid #cad6cd; padding: 4pt 6pt; }
        .signoff-matrix { width: 100%; border-collapse: collapse; margin-top: 12pt; font-size: 9pt; }
        .signoff-matrix th { background: rgba(11,110,63,.08); color: #0b6e3f; padding: 6pt 8pt; font-size: 8.5pt; text-align: left; border: 0.5pt solid #cad6cd; }
        .signoff-matrix td { border: 0.5pt solid #cad6cd; padding: 14pt 8pt 4pt; vertical-align: bottom; font-size: 8pt; color: #888; }
        .signoff-matrix td.label { background: #f8f9f7; font-weight: 600; color: #111; padding: 6pt 8pt; vertical-align: middle; }
        .footer { margin-top: 22pt; padding-top: 8pt; border-top: 0.5pt solid #ccc; font-size: 7.5pt; color: #777; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head><body>${bodyHtml}
      <div class="no-print" style="text-align:center;margin-top:20px;font-family:system-ui">
        <button onclick="window.print()" style="padding:10px 18px;font-size:14px;background:#0b6e3f;color:#fff;border:0;border-radius:6px;cursor:pointer;">Print / Save as PDF</button>
        <p style="font-size:11px;opacity:.6">Press Ctrl/Cmd+P → Destination: Save as PDF</p>
      </div>
    </body></html>`);
    w.document.close();
    w.focus();
  }

  return {
    snagView, listSnags, getSnag, saveSnag, deleteSnag,
    exportSingleSnagPdf, exportAllPdf,
  };
})();
