// NHBRC Trainer — practical on-site calculators.
// Self-contained: no backend, no analytics, all maths runs locally.
//
// Three tools — each grounded in SA stock-brick / SANS / Part-H norms:
//   1. Brick + mortar quantity (per wall area + bond type)
//   2. Strip-footing concrete + mix
//   3. Site-class quick assessor (decision tree)

window.NHBRC_CALCULATORS = (function () {

  // ---------- Constants (SA standard practice) ----------
  // Stock brick 222 × 106 × 73 mm, 10 mm joints
  // Bricks / m² of wall face by wall thickness
  const BRICKS_PER_M2 = {
    'half':   52,    // 106 mm half-brick wall
    'one':    104,   // 222 mm one-brick wall
    'oneandhalf': 156, // 332 mm wall
  };
  // Mortar volume m³ per m² of wall face (with 25% waste built in)
  const MORTAR_PER_M2 = {
    'half':   0.025,
    'one':    0.045,
    'oneandhalf': 0.065,
  };
  // Class II mortar (1:1:6 cement:lime:sand) per m³ of mortar
  const MORTAR_MIX_II = { cement_kg: 280, lime_kg: 100, sand_m3: 1.5 };
  const CEMENT_BAG_KG = 50;

  // Concrete strength → mix per m³ (cement:sand:stone by volume, water L)
  const CONCRETE_MIX = {
    '15': { cement_kg: 250, sand_m3: 0.6, stone_m3: 0.6, water_L: 150 }, // 1:4:4 ish
    '20': { cement_kg: 320, sand_m3: 0.55, stone_m3: 0.55, water_L: 165 },
    '25': { cement_kg: 350, sand_m3: 0.5,  stone_m3: 0.5,  water_L: 180 },
    '30': { cement_kg: 400, sand_m3: 0.45, stone_m3: 0.45, water_L: 200 },
  };

  // Empirical strip-footing widths for single-storey 220 mm load-bearing wall
  // on Class 1/2 ordinary soil (Part H deemed-to-satisfy guide).
  function recommendedFootingWidth(siteClass, storeys, wallType) {
    // Conservative defaults — engineer must sign off rational design for special soils.
    if (siteClass === 'special' || siteClass === 'H' || siteClass === 'D' ||
        siteClass === 'P' || siteClass === 'C' || siteClass === 'R') {
      return { rational: true, width_mm: null, depth_mm: null,
               note: 'Special soil — empirical Part-H rules do not apply. Engineer-designed foundation required.' };
    }
    const single = (storeys <= 1);
    if (wallType === 'half') {
      return { width_mm: single ? 400 : 600, depth_mm: 200, note: 'Empirical Part-H, ordinary soil (Class 1/2).' };
    }
    if (wallType === 'one') {
      return { width_mm: single ? 600 : 750, depth_mm: 200, note: 'Empirical Part-H, ordinary soil (Class 1/2).' };
    }
    return { width_mm: single ? 750 : 900, depth_mm: 250, note: 'Empirical Part-H, ordinary soil (Class 1/2).' };
  }

  // ---------- Calculator: brick + mortar ----------
  function calcBrickMortar({ length_m, height_m, wallType, wastePct = 5 }) {
    const area_m2 = length_m * height_m;
    const bpm2 = BRICKS_PER_M2[wallType];
    const mpm2 = MORTAR_PER_M2[wallType];
    if (!bpm2) return { error: 'Pick a wall type.' };

    const bricks = Math.ceil(area_m2 * bpm2 * (1 + wastePct / 100));
    const mortar_m3 = +(area_m2 * mpm2).toFixed(3);

    const cement_kg = mortar_m3 * MORTAR_MIX_II.cement_kg;
    const cement_bags = Math.ceil(cement_kg / CEMENT_BAG_KG);
    const lime_kg    = mortar_m3 * MORTAR_MIX_II.lime_kg;
    const sand_m3    = +(mortar_m3 * MORTAR_MIX_II.sand_m3).toFixed(2);

    return {
      area_m2: +area_m2.toFixed(2),
      bricks,
      mortar_m3,
      cement_bags,
      cement_kg: +cement_kg.toFixed(0),
      lime_kg: +lime_kg.toFixed(0),
      sand_m3,
    };
  }

  // ---------- Calculator: strip-footing concrete ----------
  function calcStripFooting({ wallLength_m, width_m, depth_m, mpa = '15' }) {
    const volume_m3 = +(wallLength_m * width_m * depth_m).toFixed(3);
    const mix = CONCRETE_MIX[mpa];
    if (!mix) return { error: 'Pick a strength.' };
    const cement_kg = volume_m3 * mix.cement_kg;
    return {
      volume_m3,
      cement_bags: Math.ceil(cement_kg / CEMENT_BAG_KG),
      cement_kg: +cement_kg.toFixed(0),
      sand_m3: +(volume_m3 * mix.sand_m3).toFixed(2),
      stone_m3: +(volume_m3 * mix.stone_m3).toFixed(2),
      water_L: +(volume_m3 * mix.water_L).toFixed(0),
    };
  }

  // ---------- Calculator: site-class quick assessor ----------
  function assessSiteClass({ slope, soilType, waterTable, dolomite, krotovinas }) {
    if (dolomite === 'yes') return { siteClass: 'D', recommendation: 'DOLOMITE — geotech investigation by Pr.Sci.Nat (SACNASP) compulsory. Engineer-designed raft or piled foundation.' };
    if (krotovinas === 'yes' || soilType === 'collapsing') return { siteClass: 'C', recommendation: 'COLLAPSING SAND — engineer-designed foundation, may need pre-soaking + dynamic compaction.' };
    if (soilType === 'heaving' || soilType === 'clay') return { siteClass: 'H', recommendation: 'HEAVING CLAY — engineered stiffened raft or piled foundation. Track active zone depth.' };
    if (waterTable === 'high') return { siteClass: 'special', recommendation: 'HIGH WATER TABLE — drainage / dewatering plan + engineer review needed.' };
    if (slope === 'steep') return { siteClass: 'special', recommendation: 'STEEP SLOPE (>1:10) — stepped footings + retaining design + drainage detail; engineer recommended.' };
    if (soilType === 'sand' || soilType === 'gravel') return { siteClass: 1, recommendation: 'CLASS 1 ordinary — empirical Part-H strip footing acceptable for single/double storey.' };
    if (soilType === 'silt' || soilType === 'mixed') return { siteClass: 2, recommendation: 'CLASS 2 ordinary — empirical Part-H strip footing acceptable, verify with hand auger.' };
    return { siteClass: 'unknown', recommendation: 'Need more info — at minimum a hand-auger sample and a slope check.' };
  }

  // ---------- View ----------
  function view(escapeHtml, container) {
    let active = 'brick';
    function render() {
      container.innerHTML = `
        <div class="hero" style="background:linear-gradient(135deg,#0e8a4f,#0b6e3f)">
          <h2>🛠 On-site calculators</h2>
          <p>Quick maths for foundations, brickwork and site classification — all SA standard practice.</p>
        </div>
        <div class="filter-row" id="calcTabs">
          <button class="chip-btn ${active==='brick'?'active':''}" data-tab="brick">🧱 Bricks &amp; mortar</button>
          <button class="chip-btn ${active==='strip'?'active':''}" data-tab="strip">🏗 Strip footing</button>
          <button class="chip-btn ${active==='site'?'active':''}" data-tab="site">🌍 Site class</button>
        </div>
        <div id="calcBody"></div>
        <p class="meta" style="margin-top:14px">Calculations are based on SA stock-brick dimensions + Part-H empirical mixes. Verify against the specific design and SANS 10400 part. Not a substitute for a structural engineer's sign-off on rational designs.</p>
      `;
      container.querySelectorAll('#calcTabs .chip-btn').forEach(b => b.addEventListener('click', () => { active = b.dataset.tab; render(); }));
      const body = container.querySelector('#calcBody');
      if (active === 'brick') brickView(escapeHtml, body);
      else if (active === 'strip') stripView(escapeHtml, body);
      else siteView(escapeHtml, body);
    }
    render();
  }

  function field(label, html) {
    return `<label class="calc-field"><span>${label}</span>${html}</label>`;
  }

  function brickView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Wall length (m)', '<input id="bL" type="number" step="0.1" min="0" value="10">')}
        ${field('Wall height (m)', '<input id="bH" type="number" step="0.1" min="0" value="2.7">')}
        ${field('Wall type', '<select id="bT"><option value="half">Half-brick (106 mm)</option><option value="one" selected>One-brick (220 mm)</option><option value="oneandhalf">One-and-a-half brick (330 mm)</option></select>')}
        ${field('Waste %', '<input id="bW" type="number" step="1" min="0" value="5">')}
      </div>
      <div id="bOut" class="calc-out"></div>
    `;
    const compute = () => {
      const r = calcBrickMortar({
        length_m: +body.querySelector('#bL').value,
        height_m: +body.querySelector('#bH').value,
        wallType: body.querySelector('#bT').value,
        wastePct: +body.querySelector('#bW').value,
      });
      if (r.error) { body.querySelector('#bOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`; return; }
      body.querySelector('#bOut').innerHTML = `
        <div class="calc-row"><span>Wall area</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row hilite"><span>Bricks needed</span><strong>${r.bricks.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Mortar volume (Class II 1:1:6)</span><strong>${r.mortar_m3} m³</strong></div>
        <div class="calc-row"><span>Cement (50 kg bags)</span><strong>${r.cement_bags} bags</strong></div>
        <div class="calc-row"><span>Lime</span><strong>${r.lime_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
      `;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function stripView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Total wall length on footing (m)', '<input id="sL" type="number" step="0.1" min="0" value="40">')}
        ${field('Footing width (m)', '<input id="sW" type="number" step="0.05" min="0" value="0.6">')}
        ${field('Footing depth (m)', '<input id="sD" type="number" step="0.05" min="0" value="0.2">')}
        ${field('Concrete strength (MPa)', '<select id="sM"><option value="15" selected>15 (empirical Part-H)</option><option value="20">20</option><option value="25">25</option><option value="30">30</option></select>')}
      </div>
      <div id="sOut" class="calc-out"></div>
    `;
    const compute = () => {
      const r = calcStripFooting({
        wallLength_m: +body.querySelector('#sL').value,
        width_m: +body.querySelector('#sW').value,
        depth_m: +body.querySelector('#sD').value,
        mpa: body.querySelector('#sM').value,
      });
      if (r.error) { body.querySelector('#sOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`; return; }
      body.querySelector('#sOut').innerHTML = `
        <div class="calc-row hilite"><span>Concrete volume</span><strong>${r.volume_m3} m³</strong></div>
        <div class="calc-row"><span>Cement (50 kg bags)</span><strong>${r.cement_bags} bags · ${r.cement_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="calc-row"><span>Stone (19 mm)</span><strong>${r.stone_m3} m³</strong></div>
        <div class="calc-row"><span>Water (approx.)</span><strong>${r.water_L} L</strong></div>
      `;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function siteView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Slope across erf', '<select id="cS"><option value="flat">Flat (≤ 1:50)</option><option value="moderate">Moderate (1:50 – 1:10)</option><option value="steep">Steep (> 1:10)</option></select>')}
        ${field('Soil type at footing depth', '<select id="cT"><option value="sand">Sand / sandy gravel</option><option value="silt">Silt / silty clay</option><option value="mixed">Mixed loam</option><option value="clay">Clay</option><option value="heaving">Known heaving clay</option><option value="collapsing">Collapsing sand</option></select>')}
        ${field('Water table', '<select id="cW"><option value="low">Low (> 2 m below footing)</option><option value="medium">Medium (1–2 m)</option><option value="high">High (within 1 m)</option></select>')}
        ${field('Dolomite area?', '<select id="cD"><option value="no">No</option><option value="yes">Yes</option></select>')}
        ${field('Animal burrows / krotovinas visible?', '<select id="cK"><option value="no">No</option><option value="yes">Yes</option></select>')}
      </div>
      <div id="cOut" class="calc-out"></div>
    `;
    const compute = () => {
      const r = assessSiteClass({
        slope: body.querySelector('#cS').value,
        soilType: body.querySelector('#cT').value,
        waterTable: body.querySelector('#cW').value,
        dolomite: body.querySelector('#cD').value,
        krotovinas: body.querySelector('#cK').value,
      });
      const cls = String(r.siteClass);
      body.querySelector('#cOut').innerHTML = `
        <div class="calc-row hilite"><span>Site classification</span><strong>${escapeHtml(cls)}</strong></div>
        <div class="callout">${escapeHtml(r.recommendation)}</div>
        <div class="meta" style="margin-top:6px">⚠️ This is a quick-decision tool. For Class H, D, P, R, C — geotechnical investigation by a competent person (Pr.Sci.Nat / SACNASP) is mandatory before any foundation design.</div>
      `;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('change', compute));
    compute();
  }

  return { view, calcBrickMortar, calcStripFooting, assessSiteClass, recommendedFootingWidth };
})();
