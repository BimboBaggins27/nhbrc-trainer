// NHBRC Trainer — on-site QS / QC / site-engineer toolkit.
//
// All maths runs locally (no backend, no telemetry). Calibrated for SA
// stock-brick + SANS / Part-H norms + standard QS rules-of-thumb.
//
// Tools:
//   1. Bricks & mortar               (wall area + bond → bricks, cement, lime, sand)
//   2. Plaster                       (wall area × thickness → cement, sand)
//   3. Concrete mix (any element)    (volume + grade → cement, sand, stone, water)
//   4. Strip-footing recommender     (site class + wall + storeys → width × depth)
//   5. Reinforcement steel           (bar diameters + lengths × count → kg, tonnes)
//   6. Tiling + adhesive + grout     (area + tile size + joint → tiles, adhesive, grout)
//   7. Paint                         (area + coats + paint type → litres, tins)
//   8. Excavation volume + trucks    (LWD + soil bulk factor → m³ + truck loads)
//   9. Roofing                       (span + length + pitch → roof area, battens)
//  10. Beam reactions + lintel size  (span + UDL or point → Ra, Rb, M, quick lintel)
//  11. Concrete cube test stats      (cube list → mean, σ, characteristic fck)
//  12. Site classification helper    (slope/soil/water → site class + recommendation)
//  13. Unit converter                (mm/in, kg/lb, kPa/psf, °C/°F, m³/yd³)

window.NHBRC_CALCULATORS = (function () {

  // ---------- Constants ----------
  const CEMENT_BAG_KG = 50;

  // SA stock brick 222 × 106 × 73 mm with 10 mm joints
  const BRICKS_PER_M2 = { 'half': 52, 'one': 104, 'oneandhalf': 156 };
  const MORTAR_PER_M2 = { 'half': 0.025, 'one': 0.045, 'oneandhalf': 0.065 };
  // Class II mortar (1:1:6) per m³
  const MORTAR_MIX_II = { cement_kg: 280, lime_kg: 100, sand_m3: 1.5 };

  // Concrete by grade — per m³
  const CONCRETE_MIX = {
    '15': { cement_kg: 250, sand_m3: 0.6,  stone_m3: 0.6,  water_L: 150, wc: 0.65 },
    '20': { cement_kg: 320, sand_m3: 0.55, stone_m3: 0.55, water_L: 165, wc: 0.55 },
    '25': { cement_kg: 350, sand_m3: 0.5,  stone_m3: 0.5,  water_L: 180, wc: 0.50 },
    '30': { cement_kg: 400, sand_m3: 0.45, stone_m3: 0.45, water_L: 200, wc: 0.45 },
    '40': { cement_kg: 480, sand_m3: 0.42, stone_m3: 0.42, water_L: 220, wc: 0.40 },
  };

  // Plaster mix per m³
  const PLASTER_MIX = {
    '1:3': { cement_kg: 480, sand_m3: 1.05 }, // strong (high-traffic)
    '1:4': { cement_kg: 380, sand_m3: 1.10 },
    '1:5': { cement_kg: 320, sand_m3: 1.15 }, // typical external
    '1:6': { cement_kg: 270, sand_m3: 1.20 }, // typical internal
  };

  // Reinforcement bar mass kg/m (SA standard Y bars / mild Round)
  const BAR_MASS = {
    'Y8':  0.395, 'Y10': 0.617, 'Y12': 0.888, 'Y16': 1.578,
    'Y20': 2.466, 'Y25': 3.853, 'Y32': 6.313, 'Y40': 9.864,
    'R6':  0.222, 'R8':  0.395, 'R10': 0.617, 'R12': 0.888,
  };
  // Tension lap = ~40 × Ø for Grade 450
  function lapLength_mm(diaMm) { return Math.round(40 * diaMm); }

  // Paint coverage (m² per L per coat)
  const PAINT_COV = { pva: 7, enamel: 10, primer: 9, plaster_primer: 6, roof: 4 };

  // Bulking factor when soil is excavated (in-situ vol → loose vol)
  const SOIL_BULK = { sand: 1.15, gravel: 1.20, clay: 1.30, rock: 1.50, mixed: 1.25 };

  // Truck capacity (m³ — typical SA 6 m³ tipper)
  const TRUCK_M3 = 6;

  // Tile adhesive coverage rule of thumb (m² per 20 kg bag, 6 mm notched trowel)
  const TILE_ADHESIVE_PER_BAG_M2 = 5;
  // Grout per m² for typical 4 mm joint, 8 mm tile thickness ≈ 0.4 kg/m²
  const TILE_GROUT_KG_PER_M2_PER_MM_JOINT = 0.1; // multiply by joint mm

  // ---------- Helpers ----------
  function bagsCeil(kg) { return Math.ceil(kg / CEMENT_BAG_KG); }
  function pretty(n, places = 2) { return (+n).toFixed(places); }

  // ---------- Tool: Bricks + mortar ----------
  function calcBrickMortar({ length_m, height_m, wallType, wastePct = 5 }) {
    const area = length_m * height_m;
    const bpm2 = BRICKS_PER_M2[wallType], mpm2 = MORTAR_PER_M2[wallType];
    if (!bpm2) return { error: 'Pick a wall type.' };
    const bricks = Math.ceil(area * bpm2 * (1 + wastePct / 100));
    const mortar_m3 = +(area * mpm2).toFixed(3);
    const cement_kg = mortar_m3 * MORTAR_MIX_II.cement_kg;
    return {
      area_m2: +area.toFixed(2),
      bricks, mortar_m3,
      cement_bags: bagsCeil(cement_kg),
      cement_kg: +cement_kg.toFixed(0),
      lime_kg: +(mortar_m3 * MORTAR_MIX_II.lime_kg).toFixed(0),
      sand_m3: +(mortar_m3 * MORTAR_MIX_II.sand_m3).toFixed(2),
    };
  }

  // ---------- Tool: Plaster ----------
  function calcPlaster({ area_m2, thickness_mm, mix }) {
    const t_m = thickness_mm / 1000;
    const dryVol = area_m2 * t_m * 1.27; // dry-volume factor for shrinkage
    const m = PLASTER_MIX[mix];
    if (!m) return { error: 'Pick a mix ratio.' };
    return {
      plaster_m3: +dryVol.toFixed(3),
      cement_bags: bagsCeil(dryVol * m.cement_kg),
      cement_kg: +(dryVol * m.cement_kg).toFixed(0),
      sand_m3: +(dryVol * m.sand_m3).toFixed(2),
    };
  }

  // ---------- Tool: Concrete mix (any element) ----------
  function calcConcrete({ length_m, width_m, depth_m, mpa = '25', wastePct = 5 }) {
    const baseVol = length_m * width_m * depth_m;
    const vol = baseVol * (1 + wastePct / 100);
    const m = CONCRETE_MIX[String(mpa)];
    if (!m) return { error: 'Pick a strength.' };
    return {
      volume_m3: +vol.toFixed(3),
      cement_bags: bagsCeil(vol * m.cement_kg),
      cement_kg: +(vol * m.cement_kg).toFixed(0),
      sand_m3: +(vol * m.sand_m3).toFixed(2),
      stone_m3: +(vol * m.stone_m3).toFixed(2),
      water_L: +(vol * m.water_L).toFixed(0),
      wcRatio: m.wc,
    };
  }

  // ---------- Tool: Strip-footing recommender ----------
  function recommendedFootingWidth(siteClass, storeys, wallType) {
    if (['H','D','P','C','R','special'].includes(siteClass)) {
      return { rational: true, note: 'Special soil — empirical Part-H rules do not apply. Engineer-designed foundation required.' };
    }
    const single = (storeys <= 1);
    if (wallType === 'half')      return { width_mm: single ? 400 : 600, depth_mm: 200, note: 'Empirical Part-H, ordinary soil.' };
    if (wallType === 'one')       return { width_mm: single ? 600 : 750, depth_mm: 200, note: 'Empirical Part-H, ordinary soil.' };
    return                                { width_mm: single ? 750 : 900, depth_mm: 250, note: 'Empirical Part-H, ordinary soil.' };
  }

  // ---------- Tool: Reinforcement steel ----------
  function calcRebar(items) {
    // items: [{ size:'Y12', length_m:6, count:20 }, …]
    const rows = [];
    let total_kg = 0;
    for (const it of items) {
      const m = BAR_MASS[it.size];
      if (!m || !it.length_m || !it.count) continue;
      const dia = parseInt(String(it.size).replace(/\D+/g, ''), 10);
      const total_m = it.length_m * it.count;
      const kg = total_m * m;
      total_kg += kg;
      rows.push({
        size: it.size,
        bars: it.count,
        each_m: it.length_m,
        total_m: +total_m.toFixed(1),
        mass_per_m: m,
        kg: +kg.toFixed(1),
        lap_mm: lapLength_mm(dia),
      });
    }
    return { rows, total_kg: +total_kg.toFixed(1), tonnes: +(total_kg / 1000).toFixed(3) };
  }

  // ---------- Tool: Tiling ----------
  function calcTiling({ area_m2, tile_w_mm, tile_h_mm, joint_mm = 4, wastePct = 10 }) {
    if (!area_m2 || !tile_w_mm || !tile_h_mm) return { error: 'Fill in the dimensions.' };
    const tile_area_m2 = (tile_w_mm + joint_mm) * (tile_h_mm + joint_mm) / 1e6;
    const tilesPerM2 = 1 / tile_area_m2;
    const tiles = Math.ceil(area_m2 * tilesPerM2 * (1 + wastePct / 100));
    const adhesive_bags = Math.ceil(area_m2 / TILE_ADHESIVE_PER_BAG_M2);
    const grout_kg = +(area_m2 * TILE_GROUT_KG_PER_M2_PER_MM_JOINT * joint_mm).toFixed(1);
    return { area_m2, tilesPerM2: +tilesPerM2.toFixed(1), tiles, adhesive_bags, grout_kg };
  }

  // ---------- Tool: Paint ----------
  function calcPaint({ area_m2, coats, paintType }) {
    const cov = PAINT_COV[paintType] || PAINT_COV.pva;
    const litres = area_m2 * coats / cov;
    const tins5L = Math.ceil(litres / 5);
    const tins20L = Math.ceil(litres / 20);
    return { area_m2, coats, paintType, litres: +litres.toFixed(1), tins5L, tins20L };
  }

  // ---------- Tool: Excavation ----------
  function calcExcavation({ length_m, width_m, depth_m, soil = 'mixed' }) {
    const insitu = length_m * width_m * depth_m;
    const bulkFactor = SOIL_BULK[soil] || 1.25;
    const loose_m3 = insitu * bulkFactor;
    return {
      insitu_m3: +insitu.toFixed(2),
      bulkFactor,
      loose_m3: +loose_m3.toFixed(2),
      truckLoads: Math.ceil(loose_m3 / TRUCK_M3),
    };
  }

  // ---------- Tool: Roofing ----------
  function calcRoofing({ span_m, length_m, pitch_deg, tileType = 'concrete' }) {
    const pitchRad = pitch_deg * Math.PI / 180;
    const slopeLen = (span_m / 2) / Math.cos(pitchRad);
    const roofArea = 2 * slopeLen * length_m; // both slopes
    // Concrete tile coverage ≈ 10/m² (Marley double-Roman); slate ≈ 14/m²; metal sheet sold by length
    const tilePer = { 'concrete': 10, 'slate': 14 };
    const tiles = (tileType in tilePer) ? Math.ceil(roofArea * tilePer[tileType] * 1.05) : null;
    // Batten spacing typical 320 mm for concrete tile → battens per slope = slopeLen / 0.32
    const batten_m = (length_m * slopeLen) / 0.32 * 2; // approx total batten length (both slopes)
    return {
      slope_length_m: +slopeLen.toFixed(2),
      roof_area_m2: +roofArea.toFixed(1),
      tiles, batten_m: +batten_m.toFixed(0),
      ridge_m: +length_m.toFixed(1),
    };
  }

  // ---------- Tool: Beam reactions + lintel ----------
  function calcBeam({ span_m, udl_kNm = 0, point_kN = 0, point_pos_m = 0 }) {
    if (!span_m) return { error: 'Set the span.' };
    const W = udl_kNm * span_m;
    const Ra = (W / 2) + point_kN * (span_m - point_pos_m) / span_m;
    const Rb = (W / 2) + point_kN * point_pos_m / span_m;
    const M_udl = udl_kNm * span_m * span_m / 8;
    const M_point = point_kN * point_pos_m * (span_m - point_pos_m) / span_m;
    const Mmax = M_udl + M_point;
    // very rough lintel suggestion: precast inverted-T sized by span
    let lintel = '—';
    if (span_m <= 1.0) lintel = '102 × 73 mm precast / 1 × Y10 (lite)';
    else if (span_m <= 1.5) lintel = '102 × 73 mm precast / 2 × Y10';
    else if (span_m <= 2.0) lintel = '152 × 73 mm precast / 2 × Y10';
    else if (span_m <= 2.5) lintel = '152 × 110 mm precast / 2 × Y12';
    else if (span_m <= 3.5) lintel = '230 × 110 mm precast / 2 × Y12';
    else lintel = 'Engineer-designed lintel / RC beam';
    return {
      Ra_kN: +Ra.toFixed(2), Rb_kN: +Rb.toFixed(2),
      Mmax_kNm: +Mmax.toFixed(2),
      udl_total_kN: +W.toFixed(2),
      lintel,
    };
  }

  // ---------- Tool: Cube test stats ----------
  function calcCubeTest(values) {
    if (!values.length) return { error: 'Paste at least 3 cube strengths (MPa).' };
    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1);
    const sigma = Math.sqrt(variance);
    const fck = mean - 1.64 * sigma; // 5 % defective per SANS 10100 / Eurocode
    return {
      n, mean: +mean.toFixed(2), sigma: +sigma.toFixed(2),
      min: +Math.min(...values).toFixed(2),
      max: +Math.max(...values).toFixed(2),
      fck: +fck.toFixed(2),
      passing30: values.filter(v => v >= 30).length,
    };
  }

  // ---------- Tool: Site class ----------
  function assessSiteClass({ slope, soilType, waterTable, dolomite, krotovinas }) {
    if (dolomite === 'yes') return { siteClass: 'D', recommendation: 'DOLOMITE — Pr.Sci.Nat (SACNASP) geotech investigation compulsory. Engineered raft or piled foundation.' };
    if (krotovinas === 'yes' || soilType === 'collapsing') return { siteClass: 'C', recommendation: 'COLLAPSING SAND — engineer-designed foundation; pre-soaking + dynamic compaction may be needed.' };
    if (soilType === 'heaving' || soilType === 'clay') return { siteClass: 'H', recommendation: 'HEAVING CLAY — engineered stiffened raft or piles. Track active-zone depth.' };
    if (waterTable === 'high') return { siteClass: 'special', recommendation: 'HIGH WATER TABLE — drainage / dewatering plan + engineer review.' };
    if (slope === 'steep') return { siteClass: 'special', recommendation: 'STEEP SLOPE (>1:10) — stepped footings + retaining + drainage; engineer recommended.' };
    if (soilType === 'sand' || soilType === 'gravel') return { siteClass: 1, recommendation: 'CLASS 1 ordinary — empirical Part-H strip footing acceptable.' };
    if (soilType === 'silt' || soilType === 'mixed') return { siteClass: 2, recommendation: 'CLASS 2 ordinary — empirical Part-H strip footing acceptable; verify with hand auger.' };
    return { siteClass: 'unknown', recommendation: 'Need more info — at minimum hand-auger sample + slope check.' };
  }

  // ---------- Tool: Unit converter ----------
  function convertUnit(value, from, to) {
    const factors = {
      'mm':1, 'cm':10, 'm':1000, 'in':25.4, 'ft':304.8,
      'kg':1, 'g':0.001, 't':1000, 'lb':0.4536,
      'kPa':1, 'MPa':1000, 'psi':6.895, 'psf':0.04788,
      'L':1, 'm3':1000, 'gal_us':3.785, 'gal_uk':4.546,
    };
    if (!(from in factors) || !(to in factors)) return { error: 'unsupported unit pair' };
    const inBase = value * factors[from];
    return { value: +(inBase / factors[to]).toFixed(4), from, to };
  }

  // ---------- View ----------
  function field(label, html) {
    return `<label class="calc-field"><span>${label}</span>${html}</label>`;
  }

  const TOOLS = [
    { id:'brick',    label:'🧱 Bricks & mortar' },
    { id:'plaster',  label:'🧴 Plaster' },
    { id:'concrete', label:'🥌 Concrete mix' },
    { id:'strip',    label:'🏗 Strip footing' },
    { id:'rebar',    label:'🪵 Rebar' },
    { id:'tile',     label:'🟫 Tiling' },
    { id:'paint',    label:'🖌 Paint' },
    { id:'excav',    label:'🚜 Excavation' },
    { id:'roof',     label:'🏠 Roofing' },
    { id:'beam',     label:'📏 Beam / lintel' },
    { id:'cube',     label:'🧊 Cube test' },
    { id:'site',     label:'🌍 Site class' },
    { id:'units',    label:'🔁 Units' },
  ];

  function view(escapeHtml, container) {
    let active = 'brick';
    function render() {
      container.innerHTML = `
        <div class="hero" style="background:linear-gradient(135deg,#0e8a4f,#0b6e3f)">
          <h2>🛠 On-site toolkit</h2>
          <p>Quantities, mixes, structural sanity-checks, QC stats — built for the site office.</p>
        </div>
        <div class="filter-row" id="calcTabs">
          ${TOOLS.map(t => `<button class="chip-btn ${active===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div id="calcBody"></div>
        <p class="meta" style="margin-top:14px">Quick-decision tools — verify against your actual specification + the relevant SANS 10400 part. Not a substitute for an engineer's design where rational sign-off is required.</p>
      `;
      container.querySelectorAll('#calcTabs .chip-btn').forEach(b =>
        b.addEventListener('click', () => { active = b.dataset.tab; render(); }));
      const body = container.querySelector('#calcBody');
      const fn = ({
        brick: brickView, plaster: plasterView, concrete: concreteView,
        strip: stripView, rebar: rebarView, tile: tileView, paint: paintView,
        excav: excavView, roof: roofView, beam: beamView,
        cube: cubeView, site: siteView, units: unitsView,
      })[active] || brickView;
      fn(escapeHtml, body);
    }
    render();
  }

  // ----- Per-tool views -----

  function brickView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Wall length (m)', '<input id="bL" type="number" step="0.1" min="0" value="10">')}
        ${field('Wall height (m)', '<input id="bH" type="number" step="0.1" min="0" value="2.7">')}
        ${field('Wall type', '<select id="bT"><option value="half">Half-brick (106 mm)</option><option value="one" selected>One-brick (220 mm)</option><option value="oneandhalf">One-and-a-half (330 mm)</option></select>')}
        ${field('Waste %', '<input id="bW" type="number" step="1" min="0" value="5">')}
      </div><div id="bOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcBrickMortar({
        length_m:+body.querySelector('#bL').value, height_m:+body.querySelector('#bH').value,
        wallType:body.querySelector('#bT').value, wastePct:+body.querySelector('#bW').value
      });
      if (r.error) return body.querySelector('#bOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#bOut').innerHTML = `
        <div class="calc-row"><span>Wall area</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row hilite"><span>Bricks needed</span><strong>${r.bricks.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Mortar volume (1:1:6)</span><strong>${r.mortar_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags</strong></div>
        <div class="calc-row"><span>Lime</span><strong>${r.lime_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function plasterView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Area to plaster (m²)', '<input id="pA" type="number" step="1" min="0" value="60">')}
        ${field('Thickness (mm)', '<input id="pT" type="number" step="1" min="0" value="15">')}
        ${field('Mix ratio (cement : sand)', '<select id="pM"><option value="1:3">1 : 3 (strong)</option><option value="1:4">1 : 4</option><option value="1:5" selected>1 : 5 (typical external)</option><option value="1:6">1 : 6 (typical internal)</option></select>')}
      </div><div id="pOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcPlaster({
        area_m2:+body.querySelector('#pA').value,
        thickness_mm:+body.querySelector('#pT').value,
        mix:body.querySelector('#pM').value
      });
      if (r.error) return body.querySelector('#pOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#pOut').innerHTML = `
        <div class="calc-row hilite"><span>Plaster volume</span><strong>${r.plaster_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags · ${r.cement_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function concreteView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Length (m)', '<input id="cL" type="number" step="0.1" min="0" value="10">')}
        ${field('Width / breadth (m)', '<input id="cW" type="number" step="0.05" min="0" value="0.6">')}
        ${field('Depth / thickness (m)', '<input id="cD" type="number" step="0.05" min="0" value="0.2">')}
        ${field('Strength (MPa)', '<select id="cM"><option value="15">15 (mass strip — Part H)</option><option value="20">20</option><option value="25" selected>25 (typical slab/footing)</option><option value="30">30</option><option value="40">40 (high-strength)</option></select>')}
        ${field('Waste %', '<input id="cWa" type="number" step="1" min="0" value="5">')}
      </div><div id="cOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcConcrete({
        length_m:+body.querySelector('#cL').value,
        width_m:+body.querySelector('#cW').value,
        depth_m:+body.querySelector('#cD').value,
        mpa: body.querySelector('#cM').value,
        wastePct:+body.querySelector('#cWa').value,
      });
      if (r.error) return body.querySelector('#cOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#cOut').innerHTML = `
        <div class="calc-row hilite"><span>Concrete volume (incl. waste)</span><strong>${r.volume_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags · ${r.cement_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="calc-row"><span>Stone (19 mm)</span><strong>${r.stone_m3} m³</strong></div>
        <div class="calc-row"><span>Water (target)</span><strong>${r.water_L} L</strong></div>
        <div class="calc-row"><span>Max w/c ratio</span><strong>${r.wcRatio}</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function stripView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Site class', '<select id="sC"><option value="1">Class 1 (sandy)</option><option value="2" selected>Class 2 (silty / mixed)</option><option value="H">H — heaving clay (special)</option><option value="D">D — dolomite (special)</option><option value="C">C — collapsing (special)</option><option value="P">P — pinnacled (special)</option><option value="R">R — reactive (special)</option></select>')}
        ${field('Wall type', '<select id="sT"><option value="half">Half-brick</option><option value="one" selected>One-brick</option><option value="oneandhalf">One-and-a-half</option></select>')}
        ${field('Storeys', '<select id="sS"><option value="1">1</option><option value="2">2</option></select>')}
      </div><div id="sOut" class="calc-out"></div>`;
    const compute = () => {
      const r = recommendedFootingWidth(
        body.querySelector('#sC').value, +body.querySelector('#sS').value, body.querySelector('#sT').value);
      if (r.rational) {
        body.querySelector('#sOut').innerHTML = `<div class="callout warn"><strong>Engineer required.</strong> ${escapeHtml(r.note)}</div>`;
      } else {
        body.querySelector('#sOut').innerHTML = `
          <div class="calc-row hilite"><span>Strip-footing width</span><strong>${r.width_mm} mm</strong></div>
          <div class="calc-row"><span>Strip-footing depth</span><strong>${r.depth_mm} mm</strong></div>
          <div class="meta">${escapeHtml(r.note)}</div>`;
      }
    };
    body.querySelectorAll('select').forEach(el => el.addEventListener('change', compute));
    compute();
  }

  function rebarView(escapeHtml, body) {
    body.innerHTML = `
      <p class="meta">Bar list — add as many rows as you need.</p>
      <div id="rebarRows"></div>
      <div class="actions"><button class="btn secondary" id="rebarAdd" type="button">+ Add bar</button></div>
      <div id="rOut" class="calc-out"></div>`;
    const rowsEl = body.querySelector('#rebarRows');
    function rowHtml(idx, size = 'Y12', length = 6, count = 10) {
      const opts = Object.keys(BAR_MASS).map(s => `<option ${s===size?'selected':''}>${s}</option>`).join('');
      return `<div class="calc-form rebar-row" data-i="${idx}">
        ${field('Size', `<select class="rb-size">${opts}</select>`)}
        ${field('Length / bar (m)', `<input type="number" class="rb-len" step="0.1" min="0" value="${length}">`)}
        ${field('Count', `<input type="number" class="rb-cnt" step="1" min="0" value="${count}">`)}
        ${field(' ', `<button type="button" class="btn secondary rb-del">Remove</button>`)}
      </div>`;
    }
    let counter = 0;
    function addRow(size, length, count) { rowsEl.insertAdjacentHTML('beforeend', rowHtml(counter++, size, length, count)); wire(); compute(); }
    function wire() {
      rowsEl.querySelectorAll('.rb-del').forEach(b => b.onclick = () => { b.closest('.rebar-row').remove(); compute(); });
      rowsEl.querySelectorAll('input, select').forEach(el => el.oninput = compute);
    }
    function compute() {
      const items = [...rowsEl.querySelectorAll('.rebar-row')].map(r => ({
        size: r.querySelector('.rb-size').value,
        length_m: +r.querySelector('.rb-len').value,
        count: +r.querySelector('.rb-cnt').value,
      }));
      const r = calcRebar(items);
      const detail = r.rows.map(row =>
        `<div class="calc-row"><span>${row.bars} × ${row.size} @ ${row.each_m} m (lap ≈ ${row.lap_mm} mm)</span><strong>${row.kg} kg</strong></div>`).join('');
      body.querySelector('#rOut').innerHTML =
        (detail || '<div class="empty">Add a bar to compute.</div>') +
        `<div class="calc-row hilite"><span>Total mass</span><strong>${r.total_kg} kg · ${r.tonnes} t</strong></div>`;
    }
    body.querySelector('#rebarAdd').onclick = () => addRow();
    addRow('Y12', 6, 20);
    addRow('Y10', 12, 30);
  }

  function tileView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Area (m²)', '<input id="tA" type="number" step="0.5" min="0" value="20">')}
        ${field('Tile width (mm)', '<input id="tW" type="number" step="10" min="0" value="600">')}
        ${field('Tile height (mm)', '<input id="tH" type="number" step="10" min="0" value="600">')}
        ${field('Joint (mm)', '<input id="tJ" type="number" step="1" min="0" value="4">')}
        ${field('Waste %', '<input id="tWa" type="number" step="1" min="0" value="10">')}
      </div><div id="tOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcTiling({
        area_m2:+body.querySelector('#tA').value,
        tile_w_mm:+body.querySelector('#tW').value,
        tile_h_mm:+body.querySelector('#tH').value,
        joint_mm:+body.querySelector('#tJ').value,
        wastePct:+body.querySelector('#tWa').value,
      });
      if (r.error) return body.querySelector('#tOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#tOut').innerHTML = `
        <div class="calc-row"><span>Tiles per m²</span><strong>${r.tilesPerM2}</strong></div>
        <div class="calc-row hilite"><span>Tiles needed (incl. waste)</span><strong>${r.tiles.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Adhesive (20 kg)</span><strong>${r.adhesive_bags} bags</strong></div>
        <div class="calc-row"><span>Grout (~${TILE_GROUT_KG_PER_M2_PER_MM_JOINT} kg/m²/mm joint)</span><strong>${r.grout_kg} kg</strong></div>`;
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function paintView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Area (m²)', '<input id="pnA" type="number" step="1" min="0" value="100">')}
        ${field('Coats', '<input id="pnC" type="number" step="1" min="1" value="2">')}
        ${field('Type', '<select id="pnT"><option value="pva" selected>PVA (matte / sheen) — ~7 m²/L</option><option value="enamel">Enamel — ~10 m²/L</option><option value="primer">Primer — ~9 m²/L</option><option value="plaster_primer">Plaster primer — ~6 m²/L</option><option value="roof">Roof paint — ~4 m²/L</option></select>')}
      </div><div id="pnOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcPaint({
        area_m2:+body.querySelector('#pnA').value,
        coats:+body.querySelector('#pnC').value,
        paintType:body.querySelector('#pnT').value
      });
      body.querySelector('#pnOut').innerHTML = `
        <div class="calc-row hilite"><span>Paint required</span><strong>${r.litres} L</strong></div>
        <div class="calc-row"><span>5 L tins</span><strong>${r.tins5L}</strong></div>
        <div class="calc-row"><span>20 L tins</span><strong>${r.tins20L}</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function excavView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Length (m)', '<input id="xL" type="number" step="0.1" min="0" value="20">')}
        ${field('Width (m)', '<input id="xW" type="number" step="0.1" min="0" value="0.6">')}
        ${field('Depth (m)', '<input id="xD" type="number" step="0.1" min="0" value="0.6">')}
        ${field('Soil', '<select id="xS"><option value="sand">Sand (×1.15)</option><option value="gravel">Gravel (×1.20)</option><option value="mixed" selected>Mixed (×1.25)</option><option value="clay">Clay (×1.30)</option><option value="rock">Rock (×1.50)</option></select>')}
      </div><div id="xOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcExcavation({
        length_m:+body.querySelector('#xL').value,
        width_m:+body.querySelector('#xW').value,
        depth_m:+body.querySelector('#xD').value,
        soil:body.querySelector('#xS').value,
      });
      body.querySelector('#xOut').innerHTML = `
        <div class="calc-row"><span>In-situ volume</span><strong>${r.insitu_m3} m³</strong></div>
        <div class="calc-row"><span>Bulking factor</span><strong>×${r.bulkFactor}</strong></div>
        <div class="calc-row hilite"><span>Loose volume to cart</span><strong>${r.loose_m3} m³</strong></div>
        <div class="calc-row"><span>Truck loads (6 m³)</span><strong>${r.truckLoads}</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function roofView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Span / horizontal width (m)', '<input id="rSp" type="number" step="0.1" min="0" value="8">')}
        ${field('Length (m)', '<input id="rLn" type="number" step="0.1" min="0" value="12">')}
        ${field('Pitch (°)', '<input id="rPi" type="number" step="1" min="5" max="60" value="26">')}
        ${field('Cover material', '<select id="rTy"><option value="concrete" selected>Concrete tile (~10/m²)</option><option value="slate">Slate (~14/m²)</option><option value="sheet">Metal sheet (length-based)</option></select>')}
      </div><div id="rOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcRoofing({
        span_m:+body.querySelector('#rSp').value,
        length_m:+body.querySelector('#rLn').value,
        pitch_deg:+body.querySelector('#rPi').value,
        tileType:body.querySelector('#rTy').value
      });
      body.querySelector('#rOut').innerHTML = `
        <div class="calc-row"><span>Slope length (rafter)</span><strong>${r.slope_length_m} m</strong></div>
        <div class="calc-row hilite"><span>Roof area (both slopes)</span><strong>${r.roof_area_m2} m²</strong></div>
        ${r.tiles ? `<div class="calc-row"><span>Tiles needed (incl. 5% waste)</span><strong>${r.tiles.toLocaleString()}</strong></div>` : ''}
        <div class="calc-row"><span>Battens (≈ 320 mm centres)</span><strong>${r.batten_m} m</strong></div>
        <div class="calc-row"><span>Ridge length</span><strong>${r.ridge_m} m</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function beamView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Span (m)', '<input id="bsSp" type="number" step="0.1" min="0" value="3">')}
        ${field('UDL (kN/m)', '<input id="bsUd" type="number" step="0.1" min="0" value="5">')}
        ${field('Point load (kN)', '<input id="bsPt" type="number" step="0.1" min="0" value="0">')}
        ${field('Point position from A (m)', '<input id="bsPp" type="number" step="0.1" min="0" value="0">')}
      </div><div id="bsOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcBeam({
        span_m:+body.querySelector('#bsSp').value,
        udl_kNm:+body.querySelector('#bsUd').value,
        point_kN:+body.querySelector('#bsPt').value,
        point_pos_m:+body.querySelector('#bsPp').value,
      });
      if (r.error) return body.querySelector('#bsOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#bsOut').innerHTML = `
        <div class="calc-row"><span>Total UDL load</span><strong>${r.udl_total_kN} kN</strong></div>
        <div class="calc-row"><span>Reaction at A (Ra)</span><strong>${r.Ra_kN} kN</strong></div>
        <div class="calc-row"><span>Reaction at B (Rb)</span><strong>${r.Rb_kN} kN</strong></div>
        <div class="calc-row hilite"><span>Max bending moment</span><strong>${r.Mmax_kNm} kN·m</strong></div>
        <div class="calc-row"><span>Quick lintel suggestion</span><strong>${escapeHtml(r.lintel)}</strong></div>
        <div class="meta">Sanity-check only — engineer must size the actual member for ULS / SLS / deflection.</div>`;
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function cubeView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Cube strengths (MPa) — comma- or space-separated', '<input id="cuV" type="text" value="28.4 30.1 32.5 27.9 31.0 29.7 33.2 28.8">')}
        ${field('Specified strength fck (MPa)', '<input id="cuFck" type="number" step="1" min="0" value="25">')}
      </div><div id="cuOut" class="calc-out"></div>`;
    const compute = () => {
      const raw = body.querySelector('#cuV').value;
      const vals = raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
      const fckSpec = +body.querySelector('#cuFck').value;
      const r = calcCubeTest(vals);
      if (r.error) return body.querySelector('#cuOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      const pass = r.fck >= fckSpec;
      body.querySelector('#cuOut').innerHTML = `
        <div class="calc-row"><span>n</span><strong>${r.n}</strong></div>
        <div class="calc-row"><span>Mean (MPa)</span><strong>${r.mean}</strong></div>
        <div class="calc-row"><span>σ (std dev)</span><strong>${r.sigma}</strong></div>
        <div class="calc-row"><span>Min · Max</span><strong>${r.min} · ${r.max}</strong></div>
        <div class="calc-row hilite"><span>Characteristic fck (mean − 1.64σ)</span><strong>${r.fck} MPa</strong></div>
        <div class="callout ${pass?'':'warn'}">${pass ? '✅ PASS — characteristic strength meets specified fck of ' + fckSpec + ' MPa.' : '⚠️ FAIL — characteristic strength of ' + r.fck + ' MPa is below specified fck of ' + fckSpec + ' MPa. Investigate, retest, or downgrade element.'}</div>`;
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function siteView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Slope across erf', '<select id="cS"><option value="flat">Flat (≤ 1:50)</option><option value="moderate">Moderate (1:50 – 1:10)</option><option value="steep">Steep (> 1:10)</option></select>')}
        ${field('Soil at footing depth', '<select id="cT"><option value="sand">Sand / sandy gravel</option><option value="silt">Silt / silty clay</option><option value="mixed">Mixed loam</option><option value="clay">Clay</option><option value="heaving">Known heaving clay</option><option value="collapsing">Collapsing sand</option></select>')}
        ${field('Water table', '<select id="cW"><option value="low">Low (>2 m below)</option><option value="medium">Medium (1–2 m)</option><option value="high">High (<1 m)</option></select>')}
        ${field('Dolomite area?', '<select id="cD"><option value="no">No</option><option value="yes">Yes</option></select>')}
        ${field('Krotovinas / animal burrows visible?', '<select id="cK"><option value="no">No</option><option value="yes">Yes</option></select>')}
      </div><div id="cOut" class="calc-out"></div>`;
    const compute = () => {
      const r = assessSiteClass({
        slope: body.querySelector('#cS').value,
        soilType: body.querySelector('#cT').value,
        waterTable: body.querySelector('#cW').value,
        dolomite: body.querySelector('#cD').value,
        krotovinas: body.querySelector('#cK').value,
      });
      body.querySelector('#cOut').innerHTML = `
        <div class="calc-row hilite"><span>Site classification</span><strong>${escapeHtml(String(r.siteClass))}</strong></div>
        <div class="callout">${escapeHtml(r.recommendation)}</div>`;
    };
    body.querySelectorAll('select').forEach(el => el.addEventListener('change', compute));
    compute();
  }

  function unitsView(escapeHtml, body) {
    const opts = (group) => group.map(u => `<option value="${u}">${u}</option>`).join('');
    body.innerHTML = `
      <p class="meta">Pick a category, enter a value, see the conversion both ways.</p>
      <div class="calc-form">
        ${field('Category', '<select id="uG"><option value="length">Length</option><option value="mass">Mass</option><option value="pressure">Pressure</option><option value="volume">Volume</option></select>')}
        ${field('Value', '<input id="uV" type="number" step="any" value="100">')}
        ${field('From', `<select id="uF"></select>`)}
        ${field('To', `<select id="uT"></select>`)}
      </div><div id="uOut" class="calc-out"></div>`;
    const groups = {
      length:   ['mm','cm','m','in','ft'],
      mass:     ['kg','g','t','lb'],
      pressure: ['kPa','MPa','psi','psf'],
      volume:   ['L','m3','gal_us','gal_uk'],
    };
    function refresh() {
      const g = groups[body.querySelector('#uG').value];
      body.querySelector('#uF').innerHTML = opts(g);
      body.querySelector('#uT').innerHTML = opts(g);
      body.querySelector('#uF').selectedIndex = 0;
      body.querySelector('#uT').selectedIndex = Math.min(2, g.length - 1);
      compute();
    }
    function compute() {
      const v = +body.querySelector('#uV').value;
      const from = body.querySelector('#uF').value;
      const to = body.querySelector('#uT').value;
      const r = convertUnit(v, from, to);
      body.querySelector('#uOut').innerHTML = r.error
        ? `<div class="empty">${escapeHtml(r.error)}</div>`
        : `<div class="calc-row hilite"><span>${v} ${escapeHtml(from)} =</span><strong>${r.value} ${escapeHtml(to)}</strong></div>`;
    }
    body.querySelector('#uG').addEventListener('change', refresh);
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    refresh();
  }

  return {
    view,
    calcBrickMortar, calcPlaster, calcConcrete, recommendedFootingWidth,
    calcRebar, calcTiling, calcPaint, calcExcavation, calcRoofing,
    calcBeam, calcCubeTest, assessSiteClass, convertUnit,
  };
})();
