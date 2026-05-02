// SANS 10400-A Forms 1, 2, 3, 4 — print-to-PDF generators.
// Plus NHBRC inspection checklist + Mock-pass certificate.
// Works fully offline. Uses the browser's native "Print → Save as PDF".
// No third-party libraries.

window.NHBRC_FORMS = (function () {

  function escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function openPrintDocument(title, bodyHtml) {
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) { alert('Allow pop-ups to generate the document.'); return; }
    w.document.write(`<!doctype html><html><head>
      <meta charset="utf-8"/>
      <title>${escape(title)}</title>
      <style>
        @page { size: A4; margin: 18mm 16mm; }
        body { font: 11pt/1.4 -apple-system, system-ui, "Segoe UI", sans-serif; color: #111; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 18pt; margin: 0 0 4pt; color: #0b6e3f; }
        h2 { font-size: 13pt; margin: 16pt 0 6pt; border-bottom: 1.5pt solid #0b6e3f; padding-bottom: 3pt; color: #0b6e3f; }
        h3 { font-size: 11pt; margin: 10pt 0 4pt; }
        .meta { font-size: 9pt; color: #555; margin-bottom: 12pt; }
        .field { display: grid; grid-template-columns: 180px 1fr; gap: 8pt; margin: 4pt 0; }
        .field label { font-weight: 600; }
        .field .v { border-bottom: 0.5pt solid #999; min-height: 1em; padding: 1pt 4pt; }
        .signature { display: flex; justify-content: space-between; margin: 30pt 0 6pt; gap: 24pt; }
        .signature .sig { flex: 1; border-top: 0.5pt solid #000; padding-top: 4pt; font-size: 9pt; text-align: center; }
        ul { margin: 4pt 0 4pt 18pt; padding: 0; }
        li { margin: 2pt 0; }
        .footer { margin-top: 24pt; padding-top: 8pt; border-top: 0.5pt solid #ccc; font-size: 8pt; color: #777; text-align: center; }
        .check { display: grid; grid-template-columns: 24px 1fr 100px; gap: 6pt; padding: 4pt 0; border-bottom: 0.4pt dashed #ccc; }
        .check .box { width: 14pt; height: 14pt; border: 1pt solid #444; }
        .stamp { padding: 8pt; border: 1.5pt solid #0b6e3f; border-radius: 6pt; background: rgba(11,110,63,.05); margin-top: 14pt; font-size: 9pt; }
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

  function row(label, value) {
    return `<div class="field"><label>${escape(label)}</label><div class="v">${escape(value)}</div></div>`;
  }

  // ---------- SANS 10400-A Form 1: Owner's plan-application declaration ----------
  function form1(d) {
    const compTable = (d.competentPersons || []).map(c => `
      <tr><td>${escape(c.discipline||'')}</td><td>${escape(c.name||'')}</td><td>${escape(c.regNo||'')}</td><td>${escape(c.regBody||'')}</td><td>${escape(c.functionalRegs||'')}</td></tr>`).join('') ||
      '<tr><td colspan="5" style="text-align:center;color:#888">— add competent persons in the form —</td></tr>';
    const body = `
      <h1>FORM 1 — Application for plan approval</h1>
      <div class="meta">SANS 10400-A · NBR Reg A4 · Owner's declaration</div>
      <h2>Owner</h2>
      ${row('Owner full name', d.ownerName||'')}
      ${row('ID / company reg', d.ownerId||'')}
      ${row('Postal address', d.ownerAddress||'')}
      ${row('Contact number', d.ownerPhone||'')}
      ${row('Email', d.ownerEmail||'')}
      <h2>Building</h2>
      ${row('Erf / stand', d.erf||'')}
      ${row('Township / suburb', d.township||'')}
      ${row('Local authority', d.localAuthority||'')}
      ${row('Occupancy class (Reg A20)', d.occupancyClass||'')}
      ${row('Brief description', d.buildingDesc||'')}
      ${row('Estimated value (R)', d.value||'')}
      <h2>Builder</h2>
      ${row('Home builder name', d.builderName||'')}
      ${row('NHBRC reg number', d.nhbrcNo||'')}
      ${row('NHBRC enrolment ref', d.enrolmentRef||'')}
      <h2>Competent persons appointed (Reg A19)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <thead><tr style="background:#eef;border-bottom:1pt solid #0b6e3f">
          <th style="text-align:left;padding:4pt">Discipline</th>
          <th style="text-align:left;padding:4pt">Name</th>
          <th style="text-align:left;padding:4pt">Reg no</th>
          <th style="text-align:left;padding:4pt">Council</th>
          <th style="text-align:left;padding:4pt">Functional regs accepted</th>
        </tr></thead>
        <tbody style="vertical-align:top">${compTable}</tbody>
      </table>
      <div class="stamp">I, the undersigned, declare that the information given here is true and correct,
      that I am the legal owner (or duly authorised agent) of the property described above, and that
      construction will only commence after written approval has been granted by the local authority.
      Each competent person listed has accepted responsibility in writing on Form 2 for the
      regulations they are appointed to discharge.</div>
      <div class="signature">
        <div class="sig">Owner signature</div>
        <div class="sig">Date</div>
        <div class="sig">Place</div>
      </div>
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toISOString().slice(0,10)} · Reference document only — verify with your local authority before submission.</div>`;
    openPrintDocument('Form 1 — Application', body);
  }

  // ---------- Form 2: Owner's appointment of competent person ----------
  function form2(d) {
    const body = `
      <h1>FORM 2 — Appointment of competent person</h1>
      <div class="meta">SANS 10400-A · NBR Reg A19 · Owner's appointment</div>
      <h2>Project</h2>
      ${row('Erf / stand', d.erf||'')}
      ${row('Owner', d.ownerName||'')}
      ${row('Local authority', d.localAuthority||'')}
      <h2>Appointed competent person</h2>
      ${row('Full name', d.cpName||'')}
      ${row('Discipline (eng/arch/QS/geotech)', d.cpDiscipline||'')}
      ${row('Council registration', d.cpRegBody||'')}
      ${row('Reg number', d.cpRegNo||'')}
      ${row('Postal address', d.cpAddress||'')}
      ${row('Contact', d.cpContact||'')}
      <h2>Functional regulations accepted</h2>
      <p>${escape(d.regsAccepted||'(list which functional regs / Parts of SANS 10400 the appointee accepts responsibility for — e.g. B1, H1, K1, P1)')}</p>
      <div class="stamp">The competent person, by signing below, accepts the appointment and undertakes
      the design / inspection responsibilities under Reg A19 of the National Building Regulations,
      and agrees to certify compliance on Form 3 once the work is complete.</div>
      <div class="signature">
        <div class="sig">Owner signature</div>
        <div class="sig">Competent person signature</div>
        <div class="sig">Date</div>
      </div>
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toISOString().slice(0,10)} · Reference document only.</div>`;
    openPrintDocument('Form 2 — Appointment', body);
  }

  // ---------- Form 3: Competent person's certificate of compliance ----------
  function form3(d) {
    const body = `
      <h1>FORM 3 — Certificate of compliance</h1>
      <div class="meta">SANS 10400-A · NBR Reg A19 · Competent person's certification</div>
      <h2>Project</h2>
      ${row('Erf / stand', d.erf||'')}
      ${row('Owner', d.ownerName||'')}
      ${row('Local authority', d.localAuthority||'')}
      ${row('Approved plan no', d.planNo||'')}
      <h2>Competent person</h2>
      ${row('Full name', d.cpName||'')}
      ${row('Council', d.cpRegBody||'')}
      ${row('Reg number', d.cpRegNo||'')}
      ${row('Discipline', d.cpDiscipline||'')}
      <h2>Scope of certification</h2>
      <p>${escape(d.scope||'(describe which Parts / functional regulations of SANS 10400 are being certified — e.g. Part B structural design, Part H foundations, Part K walls)')}</p>
      <div class="stamp">I certify that the work falling within my scope of appointment has been
      designed and / or executed in accordance with the National Building Regulations and the
      relevant SANS 10400 parts, and that the work as built complies with the approved plans.
      Any deviations have been documented and resolved per Reg A19(8).</div>
      <h2>Limitations / qualifications</h2>
      <p>${escape(d.limits||'(none, or describe)')}</p>
      <div class="signature">
        <div class="sig">Competent person signature</div>
        <div class="sig">Date</div>
        <div class="sig">Stamp / seal</div>
      </div>
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toISOString().slice(0,10)} · Reference document only.</div>`;
    openPrintDocument('Form 3 — Compliance', body);
  }

  // ---------- Form 4: Notice of completion / occupation ----------
  function form4(d) {
    const body = `
      <h1>FORM 4 — Notice of completion</h1>
      <div class="meta">SANS 10400-A · NBR Reg A19 / A22 · Owner's completion notice</div>
      <h2>Project</h2>
      ${row('Erf / stand', d.erf||'')}
      ${row('Owner', d.ownerName||'')}
      ${row('Local authority', d.localAuthority||'')}
      ${row('Approved plan no', d.planNo||'')}
      ${row('Date construction started', d.startDate||'')}
      ${row('Date completed', d.completionDate||'')}
      <h2>Builder</h2>
      ${row('Home builder', d.builderName||'')}
      ${row('NHBRC reg', d.nhbrcNo||'')}
      <h2>Competent persons — Form 3 issued?</h2>
      <p>${escape(d.cpForm3List||'(list each competent person who issued a Form 3 — discipline, name, date)')}</p>
      <div class="stamp">I, the undersigned owner, give notice in terms of Reg A22 that construction
      of the building described above has been completed in accordance with the approved plans and
      the National Building Regulations. I request the local authority to issue an occupation
      certificate.</div>
      <div class="signature">
        <div class="sig">Owner signature</div>
        <div class="sig">Date</div>
        <div class="sig">Stamp received</div>
      </div>
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toISOString().slice(0,10)} · Reference document only.</div>`;
    openPrintDocument('Form 4 — Completion', body);
  }

  // ---------- Inspection checklist (per stage) ----------
  const INSPECTION_STAGES = {
    foundation: {
      title: 'Foundation inspection',
      reg: 'Part H · NHBRC HBM Vol 2',
      items: [
        'Site classification confirmed (Class 1, 2, H, D, P, C, R)',
        'Trench bottoms compacted, levelled, free of standing water',
        'Trench width meets empirical or designed value',
        'Trench depth ≥ 400 mm below natural ground level',
        'Reinforcement (if required) placed with correct cover (≥75 mm to earth)',
        'Concrete grade ≥ 15 MPa for empirical strip',
        'Concrete cube samples taken and labelled (3 per pour where required)',
        'Slump test recorded (50–100 mm typical for empirical)',
        'No setting-out errors vs approved plan',
        'Photo log timestamped and stored',
      ],
    },
    dpc: {
      title: 'DPC level inspection',
      reg: 'Part K KK16',
      items: [
        'DPC ≥ 150 mm above finished ground level on all walls',
        'DPC laps ≥ 150 mm at corners and junctions',
        'DPC continuous around piers / columns',
        'No mortar bridging across the DPC',
        'DPC type appropriate (250 micron LDPE typical)',
        'Above-DPC course bedded with FROGS UP for full mortar contact',
        'Photo log',
      ],
    },
    slab: {
      title: 'Floor slab inspection',
      reg: 'Part J',
      items: [
        'Subgrade compacted, blinded, levelled',
        'Hardcore depth correct, well-graded, compacted in lifts ≤ 200 mm',
        'DPM laid on hardcore, sealed at all penetrations',
        'Reinforcement Ref 193 mesh placed mid-slab with correct cover',
        'Slab thickness ≥ 100 mm (or per design)',
        'Movement / control joints positioned (≈ 6 m + re-entrant corners)',
        'FFL ≥ 150 mm above outside ground level',
        'Concrete grade and cube samples',
        'Photo log',
      ],
    },
    roof: {
      title: 'Roof timber inspection',
      reg: 'Part L',
      items: [
        'Stress-grade SAP / S5 / S7 confirmed',
        'Treatment H2 (interior) or H3 (exposed) confirmed',
        'Truss spacing matches design (typical 760-900 mm)',
        'Bracing (longitudinal + diagonal) in place',
        'Tie-down (cyclone clip / hoop iron) ≤ 1.2 m centres',
        'Wall plate continuous, fixed, level',
        'Underlay / sarking lapped ≥ 150 mm',
        'Batten centres correct for tile / sheet (320 mm for Marley double-Roman)',
        'No notching / drilling reducing rafter capacity',
        'Photo log',
      ],
    },
    drains: {
      title: 'Drainage inspection',
      reg: 'Part P / R',
      items: [
        '100 mm Ø foul drains laid at ≥ 1:60 fall',
        '150 mm Ø drains at ≥ 1:80 fall',
        'IEs at every junction / direction change',
        'Vent stack ≥ 75 mm Ø, terminating ≥ 600 mm above any opening within 3 m',
        'Trap seals ≥ 50 mm everywhere',
        'Stormwater separated from foul drainage',
        'Downpipes ≥ 75 mm Ø, ≥ 600 mm clear of foundations at outlet',
        'Erf graded so runoff does not discharge onto adjoining property',
        'Drain tested (water test or air test) — all junctions watertight',
        'Photo log',
      ],
    },
    completion: {
      title: 'Completion / pre-occupation inspection',
      reg: 'Part A · Form 4',
      items: [
        'All Form 3 compliance certificates received',
        'Local authority final inspection booked',
        'Occupation certificate applied for (Section 14)',
        'Smoke detectors fitted (one per bedroom + each storey)',
        'Pool barrier ≥ 1.2 m, gate self-closing self-latching',
        'Balustrades ≥ 1.0 m where drop > 1 m, no gap > 100 mm',
        'Hot-water demand ≥ 50 % from solar / heat pump (XA-1)',
        'Roof insulation R-value meets climate-zone target',
        'All glazing within 800 mm of FFL is safety glass',
        'Site cleaned per Reg F9',
        'NHBRC Happy Letter received (if applicable)',
        'Final photo log',
      ],
    },
  };

  function checklistView(stageKey, target, escapeHtml) {
    const stage = INSPECTION_STAGES[stageKey];
    if (!stage) return target.innerHTML = '<div class="empty">Pick a stage.</div>';
    const k = `nhbrc.checklist.${stageKey}`;
    let state;
    try { state = JSON.parse(localStorage.getItem(k) || '{}'); } catch { state = {}; }
    target.innerHTML = `
      <h3>${escapeHtml(stage.title)} <span class="meta-inline">${escapeHtml(stage.reg)}</span></h3>
      <div id="chk-list">${stage.items.map((it, i) => `
        <label class="check-row">
          <input type="checkbox" data-i="${i}" ${state[i]?'checked':''}>
          <span>${escapeHtml(it)}</span>
        </label>
      `).join('')}</div>
      <div class="actions"><button class="btn primary" id="chk-print">Generate signed checklist (PDF)</button>
      <button class="btn secondary" id="chk-clear">Clear</button></div>`;
    target.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => {
      const obj = {}; target.querySelectorAll('input[type=checkbox]').forEach(c => { if (c.checked) obj[c.dataset.i] = 1; });
      localStorage.setItem(k, JSON.stringify(obj));
    }));
    target.querySelector('#chk-clear').addEventListener('click', () => {
      target.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
      localStorage.removeItem(k);
    });
    target.querySelector('#chk-print').addEventListener('click', () => {
      const items = stage.items.map((it, i) => {
        const checked = !!target.querySelector(`input[data-i="${i}"]`).checked;
        return `<div class="check">
          <div class="box" style="${checked?'background:#0b6e3f':''}">${checked?'✓':''}</div>
          <div>${escape(it)}</div>
          <div style="border-bottom:0.5pt solid #999;font-size:8pt;color:#888">date / signature</div>
        </div>`;
      }).join('');
      const body = `
        <h1>${escape(stage.title)}</h1>
        <div class="meta">${escape(stage.reg)} · NHBRC Trainer · ${new Date().toISOString().slice(0,10)}</div>
        <div>${items}</div>
        <div class="signature" style="margin-top:24pt">
          <div class="sig">Inspector signature</div>
          <div class="sig">Builder signature</div>
          <div class="sig">Date</div>
        </div>
        <div class="footer">Generated by NHBRC Trainer · Reference document — record-keeping aid only.</div>`;
      openPrintDocument(stage.title, body);
    });
  }

  // ---------- Mock-pass certificate ----------
  function generateCertificate({ name, score, total, attemptDate }) {
    const pct = Math.round(score / total * 100);
    const stamp = new Date().toISOString().slice(0, 19).replace('T',' ');
    const ref = 'NHBRC-T-' + (Date.now().toString(36).toUpperCase());
    const body = `
      <div style="text-align:center;border:3pt solid #0b6e3f;padding:32pt 24pt;border-radius:8pt;background:#f8fbf6;">
        <div style="font-size:11pt;letter-spacing:.3em;color:#0b6e3f;margin-bottom:12pt">CERTIFICATE OF MOCK-TEST COMPLETION</div>
        <div style="font-size:36pt;color:#0b6e3f;font-weight:700;margin:8pt 0">NHBRC Trainer</div>
        <p>This is to certify that</p>
        <div style="font-size:24pt;font-weight:700;margin:14pt 0;border-bottom:1pt solid #888;padding-bottom:6pt;display:inline-block">${escape(name)}</div>
        <p>has completed the Mock NHBRC Test simulator and achieved a score of</p>
        <div style="font-size:42pt;color:${pct>=70?'#0b6e3f':'#c8513e'};font-weight:800;margin:6pt 0">${pct}%</div>
        <p>(${score} / ${total} questions correct)</p>
        <div style="margin-top:24pt;font-size:10pt">${pct>=70?'Pass mark achieved · ≥70% threshold':'Below 70% pass mark · keep drilling'}</div>
        <div style="display:flex;justify-content:space-between;margin-top:36pt;font-size:9pt">
          <span><strong>Attempt:</strong> ${escape(attemptDate||stamp)}</span>
          <span><strong>Reference:</strong> ${ref}</span>
        </div>
        <div style="margin-top:28pt;font-size:8pt;color:#777;line-height:1.5">
          Issued by NHBRC Trainer (independent study aid). This certifies completion of an in-app practice
          test only — it is NOT a credential issued by the NHBRC, SABS or any statutory council.
          For official NHBRC homebuilder competency assessments contact the NHBRC directly.
        </div>
      </div>`;
    openPrintDocument('Certificate — ' + name, body);
  }

  // ---------- Master inspection PDF — all 6 stages, project-scoped ----------
  function generateMasterChecklist({ projectName, erf, owner, builder, nhbrcNo, planNo, address }) {
    const stagesHtml = Object.entries(INSPECTION_STAGES).map(([key, stage]) => {
      const k = `nhbrc.checklist.${key}`;
      let state; try { state = JSON.parse(localStorage.getItem(k) || '{}'); } catch { state = {}; }
      const rows = stage.items.map((item, i) => `
        <div class="check">
          <div class="box" style="${state[i]?'background:#0b6e3f':''}">${state[i]?'✓':''}</div>
          <div>${escape(item)}</div>
          <div style="border-bottom:0.5pt solid #999;font-size:8pt;color:#888">date / signature</div>
        </div>`).join('');
      return `
        <h2 style="page-break-before:always">${escape(stage.title)}</h2>
        <div class="meta">${escape(stage.reg)}</div>
        <div>${rows}</div>
        <div class="signature" style="margin-top:18pt">
          <div class="sig">Inspector signature</div>
          <div class="sig">Builder signature</div>
          <div class="sig">Date</div>
        </div>
      `;
    }).join('');

    const body = `
      <div style="text-align:center;border:2pt solid #0b6e3f;padding:18pt 24pt;border-radius:6pt;background:#f8fbf6;margin-bottom:18pt">
        <div style="font-size:10pt;letter-spacing:.3em;color:#0b6e3f">PROJECT INSPECTION FILE</div>
        <h1 style="margin:8pt 0 0;font-size:22pt">${escape(projectName || 'Untitled project')}</h1>
      </div>
      <h2 style="margin-top:0">Project details</h2>
      ${row('Erf / stand', erf||'')}
      ${row('Owner', owner||'')}
      ${row('Site address', address||'')}
      ${row('Home builder', builder||'')}
      ${row('NHBRC reg no', nhbrcNo||'')}
      ${row('Approved plan no', planNo||'')}
      ${row('File generated', new Date().toLocaleString('en-ZA'))}
      <p class="meta" style="margin-top:14pt">This consolidated file covers all 6 NHBRC inspection stages.
      Print fresh per project; tick items on site; sign at the foot of each page; file with your project records.</p>
      ${stagesHtml}
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toISOString().slice(0,10)} · Reference document — record-keeping aid only.</div>`;
    openPrintDocument('Project inspection file — ' + (projectName || 'Untitled'), body);
  }

  return {
    form1, form2, form3, form4,
    checklistView, generateCertificate, generateMasterChecklist,
    INSPECTION_STAGES,
  };
})();
