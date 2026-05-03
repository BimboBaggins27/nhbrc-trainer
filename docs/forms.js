// SANS 10400-A statutory forms (Form 1, 2, 3, 4) +
// NHBRC stage inspection checklists +
// Supplier-specific QC checklists (AfriSam, Plascon, TAL, Marley, Aerolite) +
// Mock-test certificate.
//
// All items cite their source (HBM volume + section, SANS clause, or supplier TDS).
// Hold-points are flagged — work cannot proceed past a hold-point until signed.
// Multi-party sign-off matrix matches industry practice (contractor / PA / NHBRC / engineer).
// Print output uses the browser's native "Print → Save as PDF" — no third-party libraries.

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
        @page { size: A4; margin: 16mm 14mm; }
        body { font: 10.5pt/1.4 -apple-system, system-ui, "Segoe UI", sans-serif; color: #111; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 17pt; margin: 0 0 4pt; color: #0b6e3f; letter-spacing: -0.02em; }
        h2 { font-size: 12pt; margin: 14pt 0 5pt; border-bottom: 1.5pt solid #0b6e3f; padding-bottom: 3pt; color: #0b6e3f; text-transform: uppercase; letter-spacing: 0.04em; }
        h3 { font-size: 10.5pt; margin: 9pt 0 4pt; color: #444; }
        .meta { font-size: 8.5pt; color: #555; margin-bottom: 10pt; }
        .meta-inline { font-size: 8.5pt; color: #777; font-weight: 400; }
        .field { display: grid; grid-template-columns: 160px 1fr; gap: 6pt; margin: 3pt 0; }
        .field label { font-weight: 600; font-size: 9.5pt; }
        .field .v { border-bottom: 0.5pt solid #999; min-height: 1em; padding: 1pt 4pt; }
        .signature { display: flex; justify-content: space-between; margin: 24pt 0 6pt; gap: 16pt; }
        .signature .sig { flex: 1; border-top: 0.5pt solid #000; padding-top: 4pt; font-size: 8.5pt; text-align: center; }
        ul { margin: 4pt 0 4pt 18pt; padding: 0; }
        li { margin: 2pt 0; }
        .footer { margin-top: 22pt; padding-top: 8pt; border-top: 0.5pt solid #ccc; font-size: 7.5pt; color: #777; text-align: center; }
        .stamp { padding: 8pt; border: 1.5pt solid #0b6e3f; border-radius: 6pt; background: rgba(11,110,63,.05); margin-top: 12pt; font-size: 9pt; }

        /* Letterhead block */
        .letterhead {
          display: grid; grid-template-columns: 1fr auto; gap: 12pt; align-items: end;
          padding: 12pt 0 10pt; border-bottom: 2pt solid #0b6e3f; margin-bottom: 14pt;
        }
        .letterhead .left .doc-no { font-size: 8.5pt; color: #888; letter-spacing: 0.15em; text-transform: uppercase; }
        .letterhead .left h1 { margin: 4pt 0 0; }
        .letterhead .right { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.45; }
        .letterhead .right strong { color: #111; }

        /* Project meta strip */
        .proj-strip {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt;
          padding: 8pt 10pt; background: #f4f7f3; border: 0.5pt solid #d6e0d8;
          border-radius: 4pt; margin-bottom: 12pt; font-size: 9pt;
        }
        .proj-strip .lbl { font-size: 7.5pt; color: #777; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

        /* Source citations */
        .sources {
          background: #f8f9f7; border-left: 3pt solid #0b6e3f;
          padding: 8pt 10pt; margin: 6pt 0 12pt; font-size: 8.5pt;
        }
        .sources .label { font-weight: 700; color: #0b6e3f; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; }
        .sources ul { margin: 4pt 0 0 16pt; }
        .sources li { color: #444; }

        /* Checklist rows */
        .check-section { margin: 10pt 0; }
        .check-section .section-title {
          font-size: 9.5pt; font-weight: 700; color: #0b6e3f; letter-spacing: 0.04em;
          padding: 4pt 8pt; background: rgba(11,110,63,.07); border-radius: 3pt;
          text-transform: uppercase; margin: 6pt 0 4pt;
        }
        .check {
          display: grid; grid-template-columns: 18pt 1fr 95pt 80pt;
          gap: 6pt; padding: 4pt 6pt; border-bottom: 0.4pt dashed #ccc;
          font-size: 9.5pt; align-items: start;
        }
        .check .box { width: 12pt; height: 12pt; border: 1pt solid #444; margin-top: 1pt; }
        .check .ref { font-size: 7.5pt; color: #777; font-style: italic; }
        .check .sig-line { border-bottom: 0.5pt solid #999; font-size: 7pt; color: #aaa; padding-bottom: 1pt; }
        .check.hold { background: rgba(245,184,0,.10); border-left: 2pt solid #c87a00; padding-left: 6pt; }
        .check.hold .item-text::before { content: "🔒 HOLD POINT — "; color: #c87a00; font-weight: 700; font-size: 8pt; letter-spacing: 0.04em; }

        /* Sign-off matrix */
        .signoff-matrix {
          width: 100%; border-collapse: collapse; margin-top: 18pt; font-size: 9pt;
        }
        .signoff-matrix th {
          background: rgba(11,110,63,.08); color: #0b6e3f; padding: 6pt 8pt;
          font-size: 8.5pt; letter-spacing: 0.04em; text-transform: uppercase; text-align: left;
          border: 0.5pt solid #cad6cd;
        }
        .signoff-matrix td {
          border: 0.5pt solid #cad6cd; padding: 14pt 8pt 4pt; vertical-align: bottom;
          font-size: 8pt; color: #888;
        }
        .signoff-matrix td.label { background: #f8f9f7; font-weight: 600; color: #111; padding: 6pt 8pt; vertical-align: middle; }

        /* Tables */
        table.data { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6pt 0; }
        table.data th { background: #eef0ec; border: 0.5pt solid #cad6cd; padding: 4pt 6pt; text-align: left; font-size: 8.5pt; }
        table.data td { border: 0.5pt solid #cad6cd; padding: 4pt 6pt; }

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

  // Letterhead block reused across all generated documents
  function letterhead({ docNo, title, subtitle, projectName, erf, date }) {
    return `
      <div class="letterhead">
        <div class="left">
          <div class="doc-no">${escape(docNo || '')}</div>
          <h1>${escape(title)}</h1>
          ${subtitle ? `<div style="font-size:9pt;color:#666;margin-top:2pt">${escape(subtitle)}</div>` : ''}
        </div>
        <div class="right">
          <div><strong>Generated</strong>: ${escape(date || new Date().toLocaleDateString('en-ZA'))}</div>
          <div>NHBRC Trainer · v3.9.1</div>
          <div style="margin-top:3pt">Reference document only</div>
          <div>— verify with PA / engineer before use</div>
        </div>
      </div>
      ${projectName ? `
        <div class="proj-strip">
          <div><div class="lbl">Project</div>${escape(projectName)}</div>
          <div><div class="lbl">Erf / stand</div>${escape(erf || '—')}</div>
          <div><div class="lbl">Doc reference</div>${escape(docNo || '—')}</div>
        </div>` : ''}
    `;
  }

  // Source-citation block
  function sourceBlock(sources) {
    if (!sources || !sources.length) return '';
    return `
      <div class="sources">
        <div class="label">Source documents</div>
        <ul>${sources.map(s => `<li>${escape(s)}</li>`).join('')}</ul>
      </div>
    `;
  }

  // Standard 4-party sign-off matrix used on every QC / inspection sheet
  function signOffMatrix() {
    return `
      <table class="signoff-matrix">
        <thead>
          <tr>
            <th>Role</th><th>Name</th><th>Signature</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="label">Contractor / site agent</td><td></td><td></td><td></td></tr>
          <tr><td class="label">Principal agent (architect / PM)</td><td></td><td></td><td></td></tr>
          <tr><td class="label">NHBRC inspector</td><td></td><td></td><td></td></tr>
          <tr><td class="label">Engineer (where applicable)</td><td></td><td></td><td></td></tr>
        </tbody>
      </table>
    `;
  }

  // ===========================================================================
  // SANS 10400-A statutory forms (unchanged from v3.9.0 — modelled on real NBR
  // Reg A19 / A22 Forms 1, 2, 3, 4. These are statutory templates.)
  // ===========================================================================

  function form1(d) {
    const compTable = (d.competentPersons || []).map(c => `
      <tr><td>${escape(c.discipline||'')}</td><td>${escape(c.name||'')}</td><td>${escape(c.regNo||'')}</td><td>${escape(c.regBody||'')}</td><td>${escape(c.functionalRegs||'')}</td></tr>`).join('') ||
      '<tr><td colspan="5" style="text-align:center;color:#888">— add competent persons in the form —</td></tr>';
    const body = `
      ${letterhead({ docNo: 'SANS 10400-A · FORM 1', title: 'Application for plan approval', subtitle: 'Owner\'s declaration · NBR Reg A4', projectName: d.buildingDesc, erf: d.erf })}
      ${sourceBlock([
        'SANS 10400-A:2010 — General principles & requirements',
        'National Building Regulations · Reg A4 (plan submission) · Reg A19 (competent persons)',
      ])}
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
      <table class="data">
        <thead><tr>
          <th>Discipline</th><th>Name</th><th>Reg no</th><th>Council</th><th>Functional regs</th>
        </tr></thead>
        <tbody>${compTable}</tbody>
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
      </div>`;
    openPrintDocument('Form 1 — Plan application', body);
  }

  function form2(d) {
    const body = `
      ${letterhead({ docNo: 'SANS 10400-A · FORM 2', title: 'Appointment of competent person', subtitle: 'Owner\'s appointment · NBR Reg A19', erf: d.erf })}
      ${sourceBlock([
        'SANS 10400-A:2010 §4.10 (competent persons)',
        'NBR Reg A19 — duties & functional regulations accepted',
      ])}
      <h2>Project</h2>
      ${row('Erf / stand', d.erf||'')}
      ${row('Owner', d.ownerName||'')}
      ${row('Local authority', d.localAuthority||'')}
      <h2>Appointed competent person</h2>
      ${row('Full name', d.cpName||'')}
      ${row('Discipline', d.cpDiscipline||'')}
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
      </div>`;
    openPrintDocument('Form 2 — Appointment', body);
  }

  function form3(d) {
    const body = `
      ${letterhead({ docNo: 'SANS 10400-A · FORM 3', title: 'Certificate of compliance', subtitle: 'Competent person\'s certification · NBR Reg A19', erf: d.erf })}
      ${sourceBlock([
        'SANS 10400-A:2010 §4.10.4 (certification)',
        'NBR Reg A19(8) — non-compliance / deviations',
      ])}
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
      </div>`;
    openPrintDocument('Form 3 — Compliance', body);
  }

  function form4(d) {
    const body = `
      ${letterhead({ docNo: 'SANS 10400-A · FORM 4', title: 'Notice of completion', subtitle: 'Owner\'s completion notice · NBR Reg A22', erf: d.erf })}
      ${sourceBlock([
        'SANS 10400-A:2010 §4.13 (occupation)',
        'NBR Reg A22 — occupation certificates',
      ])}
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
      </div>`;
    openPrintDocument('Form 4 — Completion', body);
  }

  // ===========================================================================
  // NHBRC stage-inspection checklists.
  // Item schema: { text, ref, hold? } — hold-points cannot be passed without sign-off.
  // Sectioned where the workflow has pre / during / post stages.
  // Citations are drawn from the NHBRC Home Building Manual (HBM Vol 1–3),
  // SANS 10400 parts, and SANS 2001 construction-works specifications.
  // ===========================================================================

  const INSPECTION_STAGES = {
    foundation: {
      title: 'Stage 1 — Foundation inspection',
      reg: 'NHBRC HBM Vol 2 · SANS 10400-H · SANS 2001-CC1',
      sources: [
        'NHBRC Home Building Manual Vol 2: Foundation Construction (latest ed.)',
        'SANS 10400-H:2012 — Foundations (deemed-to-satisfy provisions)',
        'SANS 2001-CC1:2007 — Construction works: Concrete (structural)',
        'SANS 920:2011 — Steel bars for concrete reinforcement',
      ],
      sections: [
        { title: 'Pre-pour (HOLD)', items: [
          { text: 'Site classification confirmed against geotech report (Class 1, 2, H, D, P, C, R)', ref: 'HBM Vol 2 §2.1', hold: true },
          { text: 'Setting-out verified against approved plan — diagonals, offsets, levels', ref: 'HBM Vol 2 §3.2', hold: true },
          { text: 'Trench bottom compacted, levelled, free of standing water and loose material', ref: 'HBM Vol 2 §3.4.1' },
          { text: 'Trench width meets empirical Part-H table or designed value', ref: 'SANS 10400-H §4.4' },
          { text: 'Foundation depth ≥ 400 mm below natural ground level (NGL)', ref: 'SANS 10400-H §4.4.3' },
          { text: 'Reinforcement (where designed) — cover ≥ 75 mm to earth, laps ≥ 40Ø, ties at every crossing', ref: 'SANS 920 / HBM 3.5' },
          { text: 'Spacers / chairs in place — bars cannot displace during pour', ref: 'SANS 2001-CC1 §5.3' },
        ]},
        { title: 'During pour', items: [
          { text: 'Concrete delivery slip received and filed (mix design, batch time, plant)', ref: 'SANS 10100-2 §4.5' },
          { text: 'Slump test performed and recorded (target 50–100 mm for empirical)', ref: 'SANS 5862-1' },
          { text: 'Concrete cube samples taken — 3 cubes per pour or per 50 m³, whichever is less', ref: 'SANS 5861-3 / 5863' },
          { text: 'Mechanical vibration / consolidation observed throughout', ref: 'SANS 2001-CC1 §5.4' },
          { text: 'Continuous pour — no cold joints unless designed', ref: 'SANS 2001-CC1 §5.5' },
        ]},
        { title: 'Post-pour', items: [
          { text: 'Curing applied within 1 hour of finishing (wet hessian / curing compound)', ref: 'SANS 2001-CC1 §6.2' },
          { text: 'Curing maintained ≥ 7 days for OPC, ≥ 14 days where slow-strength', ref: 'SANS 2001-CC1 §6.3' },
          { text: 'Formwork strike only after specified strength reached', ref: 'SANS 2001-CC1 §6.5' },
          { text: 'Photo log timestamped and filed against project', ref: 'NHBRC HBM Vol 2 §3.7' },
        ]},
      ],
    },
    slab: {
      title: 'Stage 2 — Surface bed / suspended slab',
      reg: 'SANS 10400-J · SANS 10400-XA · SANS 2001-CC1',
      sources: [
        'SANS 10400-J:2012 — Floors (deemed-to-satisfy)',
        'SANS 10400-XA:2011 — Energy usage in buildings (FFL above outside ground)',
        'SANS 2001-CC1:2007 — Concrete works',
        'NHBRC HBM Vol 1 §6 — Floor slabs',
      ],
      sections: [
        { title: 'Sub-base preparation (HOLD)', items: [
          { text: 'Subgrade compacted to ≥ 90 % MOD AASHTO, blinded, levelled', ref: 'HBM Vol 1 §6.2.1', hold: true },
          { text: 'Hardcore (G5 or better) placed in lifts ≤ 200 mm, each lift compacted', ref: 'HBM Vol 1 §6.2.2' },
          { text: 'Hardcore total depth meets design (typical 100–150 mm)', ref: 'HBM Vol 1 §6.2.2' },
          { text: 'Damp-proof membrane (DPM) — 250 µm minimum, sealed at all penetrations & laps', ref: 'SANS 10400-J §4.4', hold: true },
          { text: 'DPM lapped ≥ 150 mm; taped at laps', ref: 'SANS 10400-J §4.4.2' },
        ]},
        { title: 'Reinforcement & pour', items: [
          { text: 'Mesh reinforcement (Ref 193 typical) placed mid-slab on chairs', ref: 'SANS 920' },
          { text: 'Cover ≥ 25 mm top, ≥ 50 mm bottom on DPM', ref: 'SANS 10400-J §4.5' },
          { text: 'Slab thickness ≥ 100 mm (or per design)', ref: 'SANS 10400-J §4.6' },
          { text: 'Movement / control joints positioned ≈ every 6 m + at re-entrant corners', ref: 'HBM Vol 1 §6.4' },
          { text: 'Concrete grade slip + cube samples (per Stage 1)', ref: 'SANS 10100-2' },
        ]},
        { title: 'Post-pour', items: [
          { text: 'FFL ≥ 150 mm above adjacent finished ground level', ref: 'SANS 10400-J §4.3', hold: true },
          { text: 'Curing applied within 1 hour, maintained ≥ 7 days', ref: 'SANS 2001-CC1 §6.2' },
          { text: 'Surface tolerance — 5 mm under 3 m straightedge', ref: 'SANS 2001-CC1 §5.7' },
          { text: 'Photo log filed', ref: 'HBM Vol 1 §6.5' },
        ]},
      ],
    },
    superstructure: {
      title: 'Stage 3 — Brickwork & DPC',
      reg: 'SANS 10400-K · SANS 10145 · SANS 2001-CM2',
      sources: [
        'SANS 10400-K:2011 — Walls',
        'SANS 10145:2002 — Concrete masonry units',
        'SANS 2001-CM2:2007 — Construction works: Masonry',
        'SANS 227:2007 — Burnt clay masonry units',
        'NHBRC HBM Vol 1 §7 — Walls',
      ],
      sections: [
        { title: 'DPC (HOLD)', items: [
          { text: 'DPC type and thickness — 250 µm LDPE or approved equivalent', ref: 'SANS 10400-K §4.10' },
          { text: 'DPC ≥ 150 mm above finished ground level (FGL) on all walls', ref: 'SANS 10400-K §4.10.2', hold: true },
          { text: 'DPC laps ≥ 150 mm at corners, junctions, end-stops', ref: 'SANS 10400-K §4.10.3' },
          { text: 'DPC continuous around piers and columns', ref: 'HBM Vol 1 §7.4.1' },
          { text: 'No mortar or debris bridging across the DPC', ref: 'HBM Vol 1 §7.4.1', hold: true },
          { text: 'Above-DPC course bedded full mortar contact (FROGS UP for stock brick)', ref: 'SANS 2001-CM2 §5.3.4' },
        ]},
        { title: 'Brickwork', items: [
          { text: 'Bricks comply with SANS 227 (clay) or SANS 1215 (concrete) — invoices filed', ref: 'SANS 10400-K §4.4' },
          { text: 'Mortar mix per SANS 2001-CM2 mortar class — Class II default for external load-bearing', ref: 'SANS 2001-CM2 Table 1' },
          { text: 'Mortar bed and perpend joints fully filled, 10 mm nominal', ref: 'SANS 2001-CM2 §5.3.5' },
          { text: 'Bond pattern correct (stretcher / English / Flemish per design)', ref: 'HBM Vol 1 §7.5' },
          { text: 'Verticality — wall plumb within 5 mm in 2 m height', ref: 'SANS 2001-CM2 §5.4' },
          { text: 'Wall ties / brick force at correct centres for cavity / collar-jointed', ref: 'SANS 10400-K §4.7' },
        ]},
        { title: 'Openings & lintels', items: [
          { text: 'Lintel bearing ≥ 150 mm each end on full bed of mortar', ref: 'SANS 10400-K §4.8' },
          { text: 'Lintel design from competent person where span > 1 200 mm or load > one storey', ref: 'SANS 10400-B' },
          { text: 'Window / door reveals plumb, square, sill cross-fall away from face', ref: 'HBM Vol 1 §7.7' },
        ]},
      ],
    },
    roof: {
      title: 'Stage 4 — Roof structure',
      reg: 'SANS 10400-L · SANS 10082 · SANS 10243 · NHBRC HBM Vol 3',
      sources: [
        'SANS 10400-L:2011 — Roofs',
        'SANS 10082:2008 — Timber buildings (structural use)',
        'SANS 10243:2014 — Engineered prefabricated timber roof trusses',
        'NHBRC Home Building Manual Vol 3: Roof Construction',
        'A1 (Rational design) certificate by competent person required',
      ],
      sections: [
        { title: 'Pre-cover (HOLD)', items: [
          { text: 'Engineered truss design certificate received from competent person (A1 cert)', ref: 'SANS 10243 §4', hold: true },
          { text: 'Truss-grade timber confirmed — SAP / S5 / S7 stamp visible', ref: 'SANS 10082 §3' },
          { text: 'Treatment level confirmed — H2 (interior) / H3 (exposed) / H4 (in-ground)', ref: 'SANS 1288' },
          { text: 'Wall plate continuous, level, fixed per design', ref: 'HBM Vol 3 §3.2' },
          { text: 'Truss spacing matches design (typical 760–900 mm)', ref: 'SANS 10243 §6' },
          { text: 'Bracing — longitudinal, diagonal, web — installed per layout', ref: 'SANS 10243 §7' },
          { text: 'Tie-down (cyclone clip / hoop iron) at ≤ 1.2 m centres on every truss', ref: 'HBM Vol 3 §4.5', hold: true },
          { text: 'No notching, drilling or cutting of structural members on site without engineer sign-off', ref: 'SANS 10243 §8.4', hold: true },
        ]},
        { title: 'Underlay & battens', items: [
          { text: 'Underlay / sarking lapped ≥ 150 mm horizontal, ≥ 100 mm vertical', ref: 'SANS 10400-L §4.6' },
          { text: 'Batten centres correct for cover material — verify TDS (tile or sheet)', ref: 'Mfr TDS' },
          { text: 'Batten fixings — 2 nails per truss intersection, galvanised', ref: 'SANS 10243 §7.5' },
        ]},
        { title: 'Cover material', items: [
          { text: 'Roof tile / sheet meets SABS / SANS standard for type', ref: 'SANS 542 / SANS 1399' },
          { text: 'Headlap and sidelap per manufacturer TDS', ref: 'Mfr TDS' },
          { text: 'Edge tiles / verge / hip / ridge bedded per detail', ref: 'Mfr TDS' },
          { text: 'Flashings — apron, valley, side — installed before tiling resumes past', ref: 'HBM Vol 3 §6' },
        ]},
      ],
    },
    drains: {
      title: 'Stage 5 — Drainage & plumbing',
      reg: 'SANS 10400-P · SANS 10400-Q · SANS 10400-R · SANS 10252-2',
      sources: [
        'SANS 10400-P:2010 — Drainage',
        'SANS 10400-Q:2010 — Non-water-borne sanitation',
        'SANS 10400-R:2011 — Stormwater disposal',
        'SANS 10252-2:1993 — Drainage installations',
        'SANS 791:2018 — uPVC sewer pipe',
      ],
      sections: [
        { title: 'Below-ground (HOLD)', items: [
          { text: 'Foul drains 100 mm Ø at gradient ≥ 1:60 (1.67 %)', ref: 'SANS 10400-P Table 1', hold: true },
          { text: 'Foul drains 150 mm Ø at gradient ≥ 1:80 (1.25 %)', ref: 'SANS 10400-P Table 1' },
          { text: 'IEs (inspection eyes) at every junction and direction change', ref: 'SANS 10400-P §4.5' },
          { text: 'Drains bedded on sand / fines, surrounded ≥ 150 mm above crown before backfill', ref: 'SANS 791 install' },
          { text: 'Stormwater fully separated from foul drainage', ref: 'SANS 10400-R §4.1', hold: true },
          { text: 'Drains tested before backfill — water test or air test, all junctions watertight', ref: 'SANS 10252-2 §6', hold: true },
        ]},
        { title: 'Above-ground / fittings', items: [
          { text: 'Vent stack ≥ 75 mm Ø, terminating ≥ 600 mm above any opening within 3 m', ref: 'SANS 10400-P §4.7' },
          { text: 'Trap seals ≥ 50 mm at every fixture', ref: 'SANS 10400-P §4.6' },
          { text: 'WC pan connector vertical drop ≤ 1.5 m', ref: 'SANS 10252-2 §5' },
          { text: 'Hot water installation — pressure relief valve + vacuum breaker', ref: 'SANS 10254' },
          { text: 'Hot-water demand ≥ 50 % from non-resistive (solar / heat-pump)', ref: 'SANS 10400-XA §4.5' },
        ]},
        { title: 'Stormwater', items: [
          { text: 'Downpipes ≥ 75 mm Ø, ≥ 600 mm clear of foundations at outlet', ref: 'SANS 10400-R §4.4' },
          { text: 'Erf graded so runoff does not discharge onto neighbouring property', ref: 'SANS 10400-R §4.1', hold: true },
          { text: 'Soakaways / attenuation per local authority requirement', ref: 'Local by-laws' },
        ]},
      ],
    },
    completion: {
      title: 'Stage 6 — Practical completion / handover',
      reg: 'SANS 10400-A · NBR Reg A22 · NHBRC §14',
      sources: [
        'SANS 10400-A:2010 — Form 4 (notice of completion)',
        'NBR Reg A22 — occupation certificates',
        'Housing Consumers Protection Measures Act, 1998 (NHBRC enrolment)',
        'NHBRC §14 — pre-handover inspection',
      ],
      sections: [
        { title: 'Compliance documents', items: [
          { text: 'Form 3 received from every appointed competent person', ref: 'NBR Reg A19', hold: true },
          { text: 'Electrical Certificate of Compliance issued by registered installer', ref: 'SANS 10142-1' },
          { text: 'Plumbing CoC issued — water + drainage + hot-water', ref: 'SANS 10252-1' },
          { text: 'Gas CoC where gas installed', ref: 'SANS 10087' },
          { text: 'Form 4 (owner\'s notice of completion) submitted to local authority', ref: 'NBR Reg A22', hold: true },
          { text: 'Occupation certificate issued by local authority', ref: 'NBR Reg A22', hold: true },
        ]},
        { title: 'Safety items', items: [
          { text: 'Smoke detectors fitted — one per bedroom + each storey', ref: 'SANS 10400-T §4.3' },
          { text: 'Pool barrier ≥ 1.2 m, gate self-closing self-latching ≥ 1.5 m', ref: 'SANS 10400-D §4.4' },
          { text: 'Balustrades ≥ 1.0 m where drop > 1 m, no opening > 100 mm', ref: 'SANS 10400-M §4.5' },
          { text: 'All glazing within 800 mm of FFL is safety glass (SABS marked)', ref: 'SANS 10400-N §4.6' },
        ]},
        { title: 'Energy & habitability', items: [
          { text: 'Roof insulation R-value meets climate-zone target (Zone 1–6 dependent)', ref: 'SANS 10400-XA Table 4', hold: true },
          { text: 'Hot-water demand ≥ 50 % from solar / heat pump verified', ref: 'SANS 10400-XA §4.5' },
          { text: 'Site cleaned of construction debris', ref: 'NBR Reg F9' },
          { text: 'NHBRC Happy Letter received (where applicable)', ref: 'NHBRC §14', hold: true },
        ]},
      ],
    },
  };

  // ===========================================================================
  // SUPPLIER QC CHECKLISTS
  // Each is modelled on the supplier's published technical documentation.
  // Cited at the top of every printout; product-specific where relevant.
  // ===========================================================================

  const SUPPLIER_CHECKLISTS = {
    afrisam_pour: {
      title: 'AfriSam concrete pour record',
      reg: 'AfriSam Concrete Practice Manual · SANS 2001-CC1 · SANS 5862',
      sources: [
        'AfriSam Concrete Practice Manual (latest ed.) — Chapters 4–6',
        'SANS 2001-CC1:2007 — Construction works: Concrete (structural)',
        'SANS 5862-1:2006 — Concrete tests: slump',
        'SANS 5861-3 / SANS 5863 — Cube sampling and strength',
      ],
      meta: ['Pour ID: ___________', 'Element: ___________', 'Mix design / grade: ___________', 'Volume (m³): ___________'],
      sections: [
        { title: 'Pre-pour (HOLD)', items: [
          { text: 'Mix design slip on file — w/c ratio, cement content, aggregate sizes', ref: 'AfriSam CPM §4.2', hold: true },
          { text: 'Reinforcement inspected — cover, laps, ties, chairs', ref: 'SANS 920 / CPM §5' },
          { text: 'Formwork tight, plumb, oiled, supports strapped', ref: 'AfriSam CPM §5.4' },
          { text: 'Pour route clear — pump position / chute / wheelbarrow path', ref: 'AfriSam CPM §6.1' },
          { text: 'Cube moulds prepared (oiled, labelled, on flat surface)', ref: 'SANS 5861-3' },
        ]},
        { title: 'On arrival', items: [
          { text: 'Delivery slip received — batch time, mix ID, water added', ref: 'AfriSam CPM §6.2', hold: true },
          { text: 'Concrete in mixer ≤ 2 hours from batch (4 hr max with retarder)', ref: 'SANS 2001-CC1 §5.2.4', hold: true },
          { text: 'Slump test — first load and every 50 m³ thereafter', ref: 'SANS 5862-1' },
          { text: 'Slump within target ± 25 mm of design', ref: 'AfriSam CPM §6.3' },
        ]},
        { title: 'During pour', items: [
          { text: 'Continuous pour — no cold joints unless designed and accepted', ref: 'SANS 2001-CC1 §5.5' },
          { text: 'Layer depth ≤ 500 mm before next layer placed', ref: 'AfriSam CPM §6.4' },
          { text: 'Mechanical vibrator used — withdrawn slowly, no over-vibration', ref: 'SANS 2001-CC1 §5.4' },
          { text: 'Cube samples taken — 3 cubes per pour or per 50 m³ (whichever lesser)', ref: 'SANS 5861-3' },
          { text: 'Cubes labelled with pour ID, date, element, slump', ref: 'AfriSam CPM §7' },
        ]},
        { title: 'Post-pour', items: [
          { text: 'Curing started within 1 hour of finish (wet hessian / curing compound)', ref: 'SANS 2001-CC1 §6.2', hold: true },
          { text: 'Curing maintained ≥ 7 days (OPC) or per design', ref: 'SANS 2001-CC1 §6.3' },
          { text: 'Cubes stored in water bath at 22–25 °C until lab dispatch', ref: 'SANS 5861-3 §6' },
          { text: 'Cubes dispatched to accredited lab within 24 hr', ref: 'SANS 5863' },
          { text: '7-day and 28-day strength results received and filed', ref: 'SANS 5863', hold: true },
        ]},
      ],
    },

    plascon_paint: {
      title: 'Plascon paint system specification & sign-off',
      reg: 'Plascon Specifier\'s Guide · SANS 10400-V · SANS 10183',
      sources: [
        'Plascon Specifier\'s Guide & Technical Data Sheets (plascon.co.za)',
        'SANS 10183:2014 — Painting of buildings',
        'SANS 10400-V:2010 — Space heating (does not paint, but referenced for finishes)',
      ],
      meta: ['Substrate: ___________', 'Plascon system: ___________', 'Total DFT target (µm): ___________', 'Sq.m: ___________'],
      sections: [
        { title: 'Substrate preparation (HOLD)', items: [
          { text: 'New plaster cured ≥ 28 days before first coat', ref: 'Plascon TDS §3', hold: true },
          { text: 'Surface clean, dry, sound, free of laitance / efflorescence', ref: 'SANS 10183 §6' },
          { text: 'Moisture meter reading < 12 % on plaster, < 18 % on timber', ref: 'Plascon TDS §3.2' },
          { text: 'pH of plaster < 10 before painting', ref: 'Plascon TDS §3.2' },
          { text: 'Cracks > 0.5 mm cut out and filled with crack filler', ref: 'SANS 10183 §6.4' },
          { text: 'Loose paint stripped, edges feathered', ref: 'SANS 10183 §6.5' },
        ]},
        { title: 'Priming coat', items: [
          { text: 'Plaster primer (Plaster Primer / Bonding Liquid) applied — coverage per TDS', ref: 'Plascon TDS' },
          { text: 'Galv steel — Plascon Galvanised Iron Primer (etch primer) applied to new galv', ref: 'Plascon GIP TDS', hold: true },
          { text: 'Timber — Plascon Universal Undercoat applied (white) before topcoats', ref: 'Plascon UU TDS' },
          { text: 'Wet-film thickness measured during application', ref: 'SANS 10183 §7.4' },
          { text: 'Recoat interval per TDS observed (typically 4–16 hr)', ref: 'Plascon TDS §6' },
        ]},
        { title: 'Topcoats', items: [
          { text: 'Specified Plascon product applied — batch numbers logged', ref: 'Plascon TDS' },
          { text: 'Number of coats per TDS — typical 2 coats for Wall & All / Cashmere / Velvaglo', ref: 'Plascon TDS §5' },
          { text: 'Coverage rate verified against TDS m²/L', ref: 'Plascon TDS §5' },
          { text: 'Application by brush / roller / spray as per TDS', ref: 'Plascon TDS §6' },
          { text: 'Ambient conditions — temp 10–30 °C, RH < 85 %', ref: 'SANS 10183 §7.2' },
          { text: 'No application during rain, dew, or to wet surfaces', ref: 'SANS 10183 §7.2' },
        ]},
        { title: 'Sign-off', items: [
          { text: 'DFT (dry film thickness) measured — meets specified system', ref: 'SANS 10183 §8', hold: true },
          { text: 'Final visual inspection — uniform colour, no holidays, drips, runs', ref: 'SANS 10183 §8.3' },
          { text: 'Plascon warranty card completed (where applicable)', ref: 'Plascon warranty terms' },
          { text: 'Photo record of finished work filed', ref: 'NHBRC HBM Vol 1' },
        ]},
      ],
    },

    tal_tile_bedding: {
      title: 'TAL tile bedding & grouting QC',
      reg: 'TAL Specifier\'s Guide · SANS 10107',
      sources: [
        'TAL Specifier\'s Guide & adhesive Technical Data Sheets (tal.co.za)',
        'SANS 10107:2018 — The design and installation of ceramic tiling',
      ],
      meta: ['Tile type: ___________', 'TAL adhesive: ___________', 'Grout: ___________', 'Area (m²): ___________'],
      sections: [
        { title: 'Substrate (HOLD)', items: [
          { text: 'Substrate cured ≥ 28 days (concrete) / ≥ 14 days (cement screed)', ref: 'SANS 10107 §6.3', hold: true },
          { text: 'Substrate flat — 3 mm under 2 m straightedge', ref: 'SANS 10107 §6.4' },
          { text: 'Substrate clean, dry, free of curing compounds / sealers', ref: 'TAL Spec §3' },
          { text: 'Movement joints provided at structural cracks, every 4–8 m, perimeter', ref: 'SANS 10107 §7.5', hold: true },
          { text: 'Wet areas — substrate tanked with TAL Sureproof / equivalent before bedding', ref: 'TAL Sureproof TDS' },
        ]},
        { title: 'Adhesive selection (HOLD)', items: [
          { text: 'Tile type matches adhesive class — porcelain needs C2TE flexible (Tradeset Plus)', ref: 'TAL Spec §4', hold: true },
          { text: 'Natural stone uses TAL Tradeset Plus White (non-staining)', ref: 'TAL Spec §4.3', hold: true },
          { text: 'Large-format (> 600 mm any side) uses TAL Megaset / Tradeset Plus + back-buttering', ref: 'TAL Megaset TDS' },
          { text: 'Pool / submerged uses TAL Tradeset Plus + TAL Bond admix', ref: 'TAL Bond TDS' },
        ]},
        { title: 'Application', items: [
          { text: 'Adhesive mixed per TDS — ribbed back of tile faces down', ref: 'TAL Spec §6' },
          { text: 'Notched trowel size matches tile — 6 mm wall / 10 mm floor / 12 mm large format', ref: 'SANS 10107 §8.4' },
          { text: 'Adhesive coverage on tile back ≥ 65 % wall, ≥ 90 % floor / wet areas', ref: 'SANS 10107 §8.5', hold: true },
          { text: 'Tiles laid within open time — no skin formed on adhesive', ref: 'TAL Spec §6.4' },
          { text: 'Joint width consistent — 3 mm wall, 5 mm floor minimum', ref: 'SANS 10107 §8.6' },
          { text: 'Tile coursing aligned with reference grid; lippage ≤ 1 mm', ref: 'SANS 10107 §8.7' },
        ]},
        { title: 'Grouting & sign-off', items: [
          { text: 'Adhesive cure ≥ 24 hr (standard) / 48 hr (flexible) before grouting', ref: 'TAL TDS §7' },
          { text: 'Joints clean, free of dust, depth ≥ 2/3 tile thickness', ref: 'SANS 10107 §9.2' },
          { text: 'TAL grout type matches joint width — sanded ≥ 3 mm, fine < 3 mm', ref: 'TAL Floorgrout / Wallgrout TDS' },
          { text: 'Grout finished off, surface cleaned within 30 min', ref: 'TAL Spec §8' },
          { text: 'Sealant (silicone) at perimeter, internal corners, change-of-plane', ref: 'SANS 10107 §10', hold: true },
          { text: 'Final clean — no haze, no adhesive residue', ref: 'TAL Spec §9' },
        ]},
      ],
    },

    marley_roof_tile: {
      title: 'Marley / Coverland roof tile installation QC',
      reg: 'Marley Roofing Technical Manual · SANS 542 · SANS 10400-L',
      sources: [
        'Marley Roofing Technical Manual & Tile-specific Fixing Specifications (marley.co.za)',
        'Coverland Tile Installation Manual',
        'SANS 542:2007 — Concrete roofing tiles',
        'SANS 10400-L:2011 — Roofs',
      ],
      meta: ['Tile profile: ___________', 'Pitch (°): ___________', 'Sq.m: ___________'],
      sections: [
        { title: 'Pre-install (HOLD)', items: [
          { text: 'Truss design A1 cert received and roof structure inspected (Stage 4)', ref: 'NHBRC HBM Vol 3', hold: true },
          { text: 'Tile profile matches design — Double Roman / Modern / Mendip / Ludlow Major', ref: 'Mfr TDS' },
          { text: 'Roof pitch within manufacturer minimum (typical 17.5° Double Roman, 22.5° Modern)', ref: 'Mfr TDS', hold: true },
          { text: 'Underlay laid — sarking lapped ≥ 150 mm horizontal, ≥ 100 mm vertical', ref: 'SANS 10400-L §4.6' },
          { text: 'Underlay drape between trusses ≤ 25 mm', ref: 'Mfr install §3' },
        ]},
        { title: 'Battens', items: [
          { text: '38 × 38 mm SAP battens minimum (or per design)', ref: 'SANS 10082' },
          { text: 'Batten centres correct for tile — typical 320 mm Double Roman, 343 mm Modern', ref: 'Mfr install §4', hold: true },
          { text: 'Each batten fixed with 2 × 75 mm galv nails per truss intersection', ref: 'Mfr install §4.3' },
          { text: 'No more than 1 batten joint over any truss; joints staggered between adjacent battens', ref: 'Mfr install §4.4' },
        ]},
        { title: 'Tiling', items: [
          { text: 'Headlap ≥ 75 mm (or per pitch — increase for pitches < 22.5°)', ref: 'Mfr install §5', hold: true },
          { text: 'Sidelap follows interlock — no broken interlock', ref: 'Mfr install §5.2' },
          { text: 'Edge / verge tiles fixed (one nail / clip every tile within 600 mm of edge)', ref: 'Mfr install §6' },
          { text: 'Eaves course double-fixed (nail + clip)', ref: 'Mfr install §6.1' },
          { text: 'Ridge / hip tiles bedded on 1:3 mortar OR dry-fixed system', ref: 'Mfr install §7' },
          { text: 'Mechanical fixing — wind zone determines % of tiles fixed (zone 1: every 5th, zone 4: every tile)', ref: 'SANS 10400-L Annex B', hold: true },
        ]},
        { title: 'Flashings & finish', items: [
          { text: 'Apron / step / valley flashings installed before tiling proceeds past', ref: 'SANS 10400-L §4.7' },
          { text: 'Flashings dressed minimum 75 mm onto tiles, 150 mm up walls', ref: 'Mfr install §8' },
          { text: 'No mortar pointing to tiles (cement-tile contact bridges water)', ref: 'Mfr install §8.4' },
          { text: 'Final inspection — no broken / chipped tiles, all clips engaged', ref: 'Mfr install §9' },
        ]},
      ],
    },

    aerolite_insulation: {
      title: 'Aerolite / Isover insulation install verification',
      reg: 'Aerolite Technical Bulletin · SANS 10400-XA · SANS 428',
      sources: [
        'Aerolite (Isover Saint-Gobain) Technical Bulletin & Installation Guide',
        'SANS 10400-XA:2011 — Energy usage in buildings',
        'SANS 428:2008 — Thermal insulation products',
        'SANS 10400-T:2020 — Fire protection (re combustibility class)',
      ],
      meta: ['Climate zone (1–6): ___________', 'Element: ___________', 'Target R-value: ___________ m²·K/W'],
      sections: [
        { title: 'Pre-install (HOLD)', items: [
          { text: 'Climate zone confirmed against SANS 10400-XA Table 4', ref: 'SANS 10400-XA Table 4', hold: true },
          { text: 'Target R-value calculated — ceiling, walls, floors per zone', ref: 'SANS 10400-XA Table 4' },
          { text: 'Selected product TDS confirms required R-value at chosen thickness', ref: 'Aerolite TDS', hold: true },
          { text: 'Combustibility class meets SANS 10400-T (Class A / B per element)', ref: 'SANS 10400-T' },
          { text: 'No moisture in roof void / wall cavity at install', ref: 'Aerolite §3' },
        ]},
        { title: 'Install', items: [
          { text: 'Aerolite blanket / batt thickness matches design (typical 135 mm = R3.7)', ref: 'Aerolite TDS' },
          { text: 'Batts butt-jointed tightly — no gaps, no compression', ref: 'Aerolite §4.2', hold: true },
          { text: 'Around recessed downlights — IC-rated trim or 50 mm clear space (combustibility)', ref: 'SANS 10400-T §4', hold: true },
          { text: 'Vapour barrier (where required) on warm side, sealed at penetrations', ref: 'Aerolite §4.5' },
          { text: 'No insulation crushing under ceiling cabling / pipes', ref: 'Aerolite §4.6' },
          { text: 'Walls — batts friction-fitted full cavity depth, no slumping', ref: 'Aerolite §5' },
        ]},
        { title: 'Sign-off', items: [
          { text: 'Coverage 100 % over heated envelope — no bare patches', ref: 'SANS 10400-XA §4.4', hold: true },
          { text: 'R-value calculation sheet attached (this sheet + TDS)', ref: 'SANS 10400-XA' },
          { text: 'Photo record before ceiling closed up', ref: 'NHBRC HBM Vol 1' },
        ]},
      ],
    },
  };

  // ===========================================================================
  // Checklist VIEW (in-app interactive) — used by Tools tab.
  // ===========================================================================

  function checklistView(stageKey, target, escapeHtml) {
    const stage = INSPECTION_STAGES[stageKey] || SUPPLIER_CHECKLISTS[stageKey];
    if (!stage) return target.innerHTML = '<div class="empty">Pick a checklist.</div>';
    const k = `nhbrc.checklist.${stageKey}`;
    let state;
    try { state = JSON.parse(localStorage.getItem(k) || '{}'); } catch { state = {}; }

    // Flatten sections into a single index space so checkbox state survives section restructure
    const allItems = [];
    stage.sections.forEach(sec => sec.items.forEach(it => allItems.push({ ...it, section: sec.title })));

    const sectionsHtml = stage.sections.map((sec, sectionIdx) => {
      let i = 0;
      // count items before this section
      for (let s = 0; s < sectionIdx; s++) i += stage.sections[s].items.length;
      return `
        <div class="section-block" style="margin-top:14px">
          <div class="section-title" style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--green-2);font-weight:700;padding:6px 10px;background:rgba(11,110,63,.07);border-radius:6px;margin-bottom:6px">${escapeHtml(sec.title)}</div>
          ${sec.items.map((it, j) => {
            const idx = i + j;
            const ref = it.ref ? `<span class="meta-inline" style="font-style:italic;color:var(--muted);font-size:11px;margin-left:6px">[${escapeHtml(it.ref)}]</span>` : '';
            const hold = it.hold ? `<span style="display:inline-block;font-size:9px;letter-spacing:.06em;background:rgba(245,184,0,.20);color:#c87a00;padding:1px 6px;border-radius:3px;font-weight:700;margin-right:6px">HOLD</span>` : '';
            return `
              <label class="check-row" style="display:flex;align-items:flex-start;gap:8px;padding:6px 4px;border-bottom:1px dashed var(--border)">
                <input type="checkbox" data-i="${idx}" ${state[idx]?'checked':''} style="margin-top:3px">
                <span style="flex:1">${hold}${escapeHtml(it.text)}${ref}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    }).join('');

    target.innerHTML = `
      <h3>${escapeHtml(stage.title)} <span class="meta-inline" style="font-weight:400;color:var(--muted);font-size:12px">${escapeHtml(stage.reg)}</span></h3>
      <div style="background:rgba(11,110,63,.06);border-left:3px solid var(--green-2);padding:8px 10px;font-size:12px;margin:8px 0;border-radius:4px">
        <strong style="color:var(--green-2);font-size:11px;text-transform:uppercase;letter-spacing:.06em">Sources</strong>
        <ul style="margin:4px 0 0 18px;padding:0;color:var(--muted)">
          ${(stage.sources||[]).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
      ${stage.meta ? `<div style="font-size:12px;margin:8px 0;color:var(--muted)">${stage.meta.map(m=>`<div>${escapeHtml(m)}</div>`).join('')}</div>` : ''}
      ${sectionsHtml}
      <div class="actions" style="margin-top:14px"><button class="btn primary" id="chk-print">Generate signed checklist (PDF)</button>
      <button class="btn secondary" id="chk-clear">Clear</button></div>`;

    target.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => {
      const obj = {}; target.querySelectorAll('input[type=checkbox]').forEach(c => { if (c.checked) obj[c.dataset.i] = 1; });
      localStorage.setItem(k, JSON.stringify(obj));
    }));
    target.querySelector('#chk-clear').addEventListener('click', () => {
      target.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
      localStorage.removeItem(k);
    });
    target.querySelector('#chk-print').addEventListener('click', () => printChecklist(stageKey, stage, state, target));
  }

  function printChecklist(stageKey, stage, state, target) {
    // Collect current checkbox state from the live DOM (in case user just ticked)
    target.querySelectorAll('input[type=checkbox]').forEach(c => {
      if (c.checked) state[c.dataset.i] = 1; else delete state[c.dataset.i];
    });

    let runningIdx = 0;
    const sectionsHtml = stage.sections.map(sec => {
      const rows = sec.items.map(it => {
        const idx = runningIdx++;
        const checked = !!state[idx];
        return `
          <div class="check ${it.hold?'hold':''}">
            <div class="box" style="${checked?'background:#0b6e3f;color:#fff;text-align:center;line-height:12pt;font-size:9pt':''}">${checked?'✓':''}</div>
            <div class="item-text">${escape(it.text)} ${it.ref?`<span class="ref">[${escape(it.ref)}]</span>`:''}</div>
            <div class="sig-line">date / sig</div>
            <div class="sig-line">notes</div>
          </div>`;
      }).join('');
      return `
        <div class="check-section">
          <div class="section-title">${escape(sec.title)}</div>
          <div class="check" style="background:#fafafa;font-size:8pt;color:#666;border-bottom:0.5pt solid #ccc">
            <div></div><div><strong>Item</strong></div><div><strong>Date / Sig</strong></div><div><strong>Notes</strong></div>
          </div>
          ${rows}
        </div>`;
    }).join('');

    const docNo = `QC · ${stageKey.toUpperCase()} · ${new Date().toISOString().slice(0,10)}`;
    const body = `
      ${letterhead({ docNo, title: stage.title, subtitle: stage.reg })}
      ${sourceBlock(stage.sources)}
      ${stage.meta ? `
        <div class="proj-strip">
          ${stage.meta.map(m => `<div>${escape(m)}</div>`).join('')}
        </div>` : ''}
      ${sectionsHtml}
      <h2 style="margin-top:20pt">Sign-off</h2>
      ${signOffMatrix()}
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toLocaleString('en-ZA')} · Reference document — not a statutory certificate.</div>`;
    openPrintDocument(stage.title, body);
  }

  // ===========================================================================
  // Mock-test certificate (kept — but tightened wording)
  // ===========================================================================
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

  // ===========================================================================
  // Master inspection PDF — all 6 NHBRC stages, project-scoped
  // ===========================================================================
  function generateMasterChecklist({ projectName, erf, owner, builder, nhbrcNo, planNo, address }) {
    const stagesHtml = Object.entries(INSPECTION_STAGES).map(([key, stage]) => {
      const k = `nhbrc.checklist.${key}`;
      let state; try { state = JSON.parse(localStorage.getItem(k) || '{}'); } catch { state = {}; }
      let runningIdx = 0;
      const sectionsHtml = stage.sections.map(sec => {
        const rows = sec.items.map(it => {
          const idx = runningIdx++;
          const checked = !!state[idx];
          return `
            <div class="check ${it.hold?'hold':''}">
              <div class="box" style="${checked?'background:#0b6e3f;color:#fff;text-align:center;line-height:12pt;font-size:9pt':''}">${checked?'✓':''}</div>
              <div class="item-text">${escape(it.text)} ${it.ref?`<span class="ref">[${escape(it.ref)}]</span>`:''}</div>
              <div class="sig-line">date / sig</div>
              <div class="sig-line">notes</div>
            </div>`;
        }).join('');
        return `<div class="check-section"><div class="section-title">${escape(sec.title)}</div>${rows}</div>`;
      }).join('');
      return `
        <h2 style="page-break-before:always">${escape(stage.title)}</h2>
        ${sourceBlock(stage.sources)}
        ${sectionsHtml}
        <h3 style="margin-top:14pt">Stage sign-off</h3>
        ${signOffMatrix()}
      `;
    }).join('');

    const body = `
      ${letterhead({ docNo: 'NHBRC PROJECT INSPECTION FILE', title: projectName || 'Untitled project', subtitle: 'Master inspection record — Stages 1–6' })}
      <h2 style="margin-top:0">Project details</h2>
      ${row('Erf / stand', erf||'')}
      ${row('Owner', owner||'')}
      ${row('Site address', address||'')}
      ${row('Home builder', builder||'')}
      ${row('NHBRC reg no', nhbrcNo||'')}
      ${row('Approved plan no', planNo||'')}
      ${row('File generated', new Date().toLocaleString('en-ZA'))}
      <p class="meta" style="margin-top:14pt">This consolidated file covers all 6 NHBRC inspection stages with citations to the
      Home Building Manual, SANS 10400 deemed-to-satisfy provisions, and SANS 2001 construction works
      specifications. Print fresh per project; tick items on site; sign at the foot of each stage.</p>
      ${stagesHtml}
      <div class="footer">Generated by NHBRC Trainer · ${new Date().toLocaleString('en-ZA')} · Reference document — record-keeping aid only.</div>`;
    openPrintDocument('Project inspection file — ' + (projectName || 'Untitled'), body);
  }

  return {
    form1, form2, form3, form4,
    checklistView, generateCertificate, generateMasterChecklist,
    INSPECTION_STAGES,
    SUPPLIER_CHECKLISTS,
  };
})();
