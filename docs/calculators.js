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

  // ---------- BoQ store ----------
  const BOQ_KEY = 'nhbrc.boq.v1';
  function loadBoQ() {
    try {
      const s = JSON.parse(localStorage.getItem(BOQ_KEY) || 'null');
      if (s && s.projects) return s;
    } catch {}
    return { current: 'default', projects: { default: { name: 'Default project', items: [] } } };
  }
  function saveBoQ(s) { localStorage.setItem(BOQ_KEY, JSON.stringify(s)); }
  function addToBoQ(entry) {
    const s = loadBoQ();
    const p = s.projects[s.current];
    p.items.unshift({ id: Date.now() + Math.random().toString(36).slice(2,6), at: new Date().toISOString(), ...entry });
    saveBoQ(s);
    return s;
  }
  function flashSaved(btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ Added';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1400);
  }
  function boqButton(label, calc, inputs, outputs) {
    return `<button class="btn boq-btn" data-boq='${JSON.stringify({label,calc,inputs,outputs}).replace(/'/g,"&#39;")}'>+ Add to BoQ</button>`;
  }
  function wireBoqButtons(scope) {
    scope.querySelectorAll('.boq-btn').forEach(b => {
      b.addEventListener('click', () => {
        try {
          const data = JSON.parse(b.dataset.boq.replace(/&#39;/g,"'"));
          addToBoQ(data);
          flashSaved(b);
        } catch (e) { console.error(e); }
      });
    });
  }

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

  // ---------- Tool: Stairs geometry ----------
  function calcStairs({ totalRise_mm, riser_mm = 175, going_mm = 250 }) {
    if (!totalRise_mm) return { error: 'Set total rise.' };
    const risers = Math.ceil(totalRise_mm / riser_mm);
    const actualRiser = +(totalRise_mm / risers).toFixed(1);
    const goings = risers - 1;
    const totalRun = goings * going_mm;
    const slope = +Math.atan(actualRiser / going_mm * Math.PI / 180 * 180 / Math.PI).toFixed(1); // approximate
    const angle = +(Math.atan2(actualRiser, going_mm) * 180 / Math.PI).toFixed(1);
    const ergo = (2 * actualRiser + going_mm); // 500-700 ideal
    return {
      risers, actualRiser_mm: actualRiser, goings,
      totalRun_mm: totalRun,
      angle_deg: angle,
      ergonomic_2RG: +ergo.toFixed(0),
      ergonomicOK: ergo >= 500 && ergo <= 700,
      compliesPartM: actualRiser <= 200 && going_mm >= 250,
    };
  }

  // ---------- Tool: Drywall (gypsum board) ----------
  function calcDrywall({ wallArea_m2, ceilingArea_m2 = 0, boardSize = '1.2x2.4', wastePct = 10 }) {
    const totalArea = wallArea_m2 + ceilingArea_m2;
    const sizes = { '1.2x2.4': 2.88, '1.2x3.0': 3.6, '0.9x2.4': 2.16 };
    const boardArea = sizes[boardSize] || 2.88;
    const boards = Math.ceil(totalArea / boardArea * (1 + wastePct / 100));
    // Screws ~25 per board for ceiling, ~20 for wall
    const screws = boards * 22;
    // Joint compound ~1 kg per m² for taping + 2 coats
    const compound_kg = +(totalArea * 1).toFixed(1);
    // Tape: ~3 m of joint per m² (rough)
    const tape_m = Math.ceil(totalArea * 3);
    return { totalArea, boards, screws, compound_kg, tape_m, boardSize };
  }

  // ---------- Tool: Insulation R-value selector ----------
  function calcInsulation({ zone = 3, element = 'roof' }) {
    // Target R-values per SANS 10400-XA (typical residential)
    const targets = {
      roof:      { 1: 3.7, 2: 3.7, 3: 3.7, 4: 3.7, 5: 3.7, 6: 3.5 },
      ceiling:   { 1: 3.0, 2: 3.0, 3: 3.0, 4: 3.0, 5: 3.0, 6: 2.8 },
      wall_ext:  { 1: 1.9, 2: 1.9, 3: 1.9, 4: 1.9, 5: 1.9, 6: 1.6 },
      floor:     { 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0 },
    };
    const R = targets[element]?.[zone];
    if (!R) return { error: 'Pick zone (1-6) and element.' };
    // Common materials' thermal conductivity λ (W/m·K) → thickness mm = R × λ × 1000
    const products = [
      { name: 'Fibreglass batt (Aerolite, Isover) λ=0.040', lambda: 0.040 },
      { name: 'Mineral wool λ=0.038', lambda: 0.038 },
      { name: 'Polyester batt (THINKPINK) λ=0.044', lambda: 0.044 },
      { name: 'EPS rigid foam λ=0.038', lambda: 0.038 },
      { name: 'Polyurethane spray foam λ=0.024', lambda: 0.024 },
      { name: 'Cellulose loose-fill λ=0.040', lambda: 0.040 },
    ].map(p => ({ ...p, thickness_mm: Math.ceil(R * p.lambda * 1000) }));
    return { zone, element, targetR: R, products };
  }

  // ---------- Tool: Pipe flow / drainage capacity (Manning's) ----------
  function calcPipeFlow({ diameter_mm, slope_pct = 1, n = 0.013 }) {
    if (!diameter_mm || !slope_pct) return { error: 'Set diameter + slope.' };
    const d = diameter_mm / 1000;            // m
    const A = Math.PI * (d / 2) ** 2;        // full-pipe area, m²
    const P = Math.PI * d;                   // wetted perimeter (full bore)
    const Rh = A / P;                        // hydraulic radius
    const S = slope_pct / 100;
    const V = (1 / n) * Math.pow(Rh, 2 / 3) * Math.sqrt(S);  // m/s
    const Q = V * A;                         // m³/s
    return {
      area_m2: +A.toFixed(4),
      velocity_ms: +V.toFixed(2),
      flow_Lps: +(Q * 1000).toFixed(1),
      slope_one_in: +(100 / slope_pct).toFixed(0),
      capacity_note: V >= 0.6 ? '✅ Self-cleansing (≥ 0.6 m/s)' : '⚠️ Below self-cleansing velocity — risk of solids settling',
    };
  }

  // ---------- Tool: Column / round-pier volume ----------
  function calcColumn({ shape = 'square', width_m = 0.3, depth_m = 0.3, diameter_m = 0.3, height_m = 3, count = 1, mpa = '25' }) {
    const each = shape === 'circle'
      ? Math.PI * (diameter_m / 2) ** 2 * height_m
      : width_m * depth_m * height_m;
    const total = each * count * 1.05; // 5% waste
    const m = CONCRETE_MIX[String(mpa)];
    if (!m) return { error: 'Pick a strength.' };
    return {
      eachVolume_m3: +each.toFixed(3),
      totalVolume_m3: +total.toFixed(3),
      cement_bags: bagsCeil(total * m.cement_kg),
      sand_m3: +(total * m.sand_m3).toFixed(2),
      stone_m3: +(total * m.stone_m3).toFixed(2),
      water_L: +(total * m.water_L).toFixed(0),
    };
  }

  // ---------- Tool: Wallpaper / cladding rolls ----------
  function calcWallpaper({ wall_w_m, wall_h_m, roll_w_mm = 530, roll_l_m = 10, pattern_repeat_mm = 0, wastePct = 10 }) {
    if (!wall_w_m || !wall_h_m) return { error: 'Set wall dimensions.' };
    const stripsPerRoll = Math.floor((roll_l_m * 1000) / (wall_h_m * 1000 + pattern_repeat_mm));
    const stripsNeeded = Math.ceil((wall_w_m * 1000) / roll_w_mm);
    const rolls = Math.ceil(stripsNeeded / stripsPerRoll * (1 + wastePct / 100));
    return { stripsPerRoll, stripsNeeded, rolls };
  }

  // ---------- Tool: Lumber / framing ----------
  function calcFraming({ wall_length_m, wall_height_m = 2.7, stud_centres_mm = 600, plate_layers = 2 }) {
    if (!wall_length_m) return { error: 'Set wall length.' };
    const studs = Math.ceil(wall_length_m * 1000 / stud_centres_mm) + 1; // + end stud
    const plates_m = wall_length_m * plate_layers + wall_length_m; // top + bottom + double-top
    const studLen = wall_height_m;
    const total_m = studs * studLen + plates_m;
    return {
      studs, stud_length_m: +studLen.toFixed(2),
      plates_m: +plates_m.toFixed(1),
      total_m: +total_m.toFixed(1),
    };
  }

  // ---------- Tool: Deck / floor joist sizing ----------
  function calcDeck({ deck_w_m, deck_l_m, joist_centres_mm = 400, board_w_mm = 140, board_gap_mm = 5 }) {
    if (!deck_w_m || !deck_l_m) return { error: 'Set deck dimensions.' };
    const area = deck_w_m * deck_l_m;
    const joistCount = Math.ceil((deck_w_m * 1000) / joist_centres_mm) + 1;
    const joistLen_m = deck_l_m;
    const boardsAcross = Math.ceil((deck_w_m * 1000) / (board_w_mm + board_gap_mm));
    const boardLen_m = deck_l_m;
    return {
      area_m2: +area.toFixed(2),
      joists: joistCount,
      joist_total_m: +(joistCount * joistLen_m).toFixed(1),
      decking_boards: boardsAcross,
      decking_total_m: +(boardsAcross * boardLen_m).toFixed(1),
    };
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

  const TOOL_GROUPS = [
    { group: 'Materials',   tools: [
      { id:'brick',    label:'🧱 Bricks & mortar' },
      { id:'plaster',  label:'🧴 Plaster' },
      { id:'concrete', label:'🥌 Concrete mix' },
      { id:'column',   label:'🏛 Columns / piers' },
      { id:'tile',     label:'🟫 Tiling' },
      { id:'drywall',  label:'🧱 Drywall' },
      { id:'paint',    label:'🖌 Paint' },
      { id:'wallpaper',label:'🎨 Wallpaper' },
      { id:'roof',     label:'🏠 Roofing' },
    ]},
    { group: 'Structural',  tools: [
      { id:'strip',    label:'🏗 Strip footing' },
      { id:'rebar',    label:'🪵 Rebar' },
      { id:'beam',     label:'📏 Beam / lintel' },
      { id:'framing',  label:'🪚 Framing' },
      { id:'deck',     label:'🛠 Deck / joists' },
      { id:'stairs',   label:'🪜 Stairs geometry' },
    ]},
    { group: 'Building services', tools: [
      { id:'pipe',     label:'🚰 Pipe flow' },
      { id:'insul',    label:'❄ Insulation R-value' },
    ]},
    { group: 'Earthworks & QC', tools: [
      { id:'excav',    label:'🚜 Excavation' },
      { id:'cube',     label:'🧊 Cube test' },
      { id:'site',     label:'🌍 Site class' },
    ]},
    { group: 'Lookup',      tools: [
      { id:'units',    label:'🔁 Units' },
    ]},
  ];

  function view(escapeHtml, container) {
    let active = 'brick';
    function render() {
      container.innerHTML = `
        <div class="hero" style="background:linear-gradient(135deg,#0e8a4f,#0b6e3f)">
          <h2>🛠 On-site toolkit</h2>
          <p>${TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0)} calculators · grouped for the site office.</p>
        </div>
        ${TOOL_GROUPS.map(g => `
          <div class="tool-group-label">${g.group}</div>
          <div class="filter-row tool-group">
            ${g.tools.map(t => `<button class="chip-btn ${active===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')}
          </div>`).join('')}
        <div id="calcBody"></div>
        <p class="meta" style="margin-top:14px">Quick-decision tools — verify against your actual specification + the relevant SANS 10400 part. Not a substitute for an engineer's design where rational sign-off is required.</p>
      `;
      container.querySelectorAll('.chip-btn').forEach(b =>
        b.addEventListener('click', () => { active = b.dataset.tab; render(); container.querySelector('#calcBody').scrollIntoView({behavior:'smooth',block:'start'}); }));
      const body = container.querySelector('#calcBody');
      const fn = ({
        brick: brickView, plaster: plasterView, concrete: concreteView,
        strip: stripView, rebar: rebarView, tile: tileView, paint: paintView,
        excav: excavView, roof: roofView, beam: beamView,
        cube: cubeView, site: siteView, units: unitsView,
        stairs: stairsView, drywall: drywallView, insul: insulView,
        pipe: pipeView, column: columnView, wallpaper: wallpaperView,
        framing: framingView, deck: deckView,
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
      </div>
      <div id="bDia"></div>
      <div id="bOut" class="calc-out"></div>`;
    const wallThicknessFor = (t) => ({ half: 106, one: 220, oneandhalf: 332 })[t] || 220;
    const compute = () => {
      const length_m = +body.querySelector('#bL').value;
      const height_m = +body.querySelector('#bH').value;
      const wallType = body.querySelector('#bT').value;
      const r = calcBrickMortar({ length_m, height_m, wallType, wastePct: +body.querySelector('#bW').value });
      if (r.error) return body.querySelector('#bOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // Live 3-D wall preview (length × height × wall-thickness)
      const t_mm = wallThicknessFor(wallType);
      body.querySelector('#bDia').innerHTML = drawIsoBox({
        length_mm: length_m * 1000,
        height_mm: height_m * 1000,
        depth_mm: t_mm,
        pattern: 'brick',
        title: `${length_m} m × ${height_m} m × ${t_mm} mm wall (${r.bricks.toLocaleString()} bricks)`,
        frontColor: '#b87a5a', topColor: '#d49a76', sideColor: '#7a4f33',
      });
      body.querySelector('#bOut').innerHTML = `
        <div class="calc-row"><span>Wall area</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row hilite"><span>Bricks needed</span><strong>${r.bricks.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Mortar volume (1:1:6)</span><strong>${r.mortar_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags</strong></div>
        <div class="calc-row"><span>Lime</span><strong>${r.lime_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="actions">${boqButton(
          `Wall ${length_m}×${height_m}m (${({half:'half-brick',one:'one-brick',oneandhalf:'1½-brick'})[wallType]})`,
          'Bricks & mortar',
          { length_m, height_m, wallType, t_mm },
          { bricks: r.bricks, mortar_m3: r.mortar_m3, cement_bags: r.cement_bags, lime_kg: r.lime_kg, sand_m3: r.sand_m3 }
        )}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="pDia"></div>
      <div id="pOut" class="calc-out"></div>`;
    const compute = () => {
      const area_m2 = +body.querySelector('#pA').value;
      const thickness_mm = +body.querySelector('#pT').value;
      const r = calcPlaster({ area_m2, thickness_mm, mix: body.querySelector('#pM').value });
      if (r.error) return body.querySelector('#pOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // Show as 3-D layer: assume a square-ish wall, depth = plaster thickness.
      const side_m = Math.sqrt(area_m2 || 1);
      body.querySelector('#pDia').innerHTML = drawIsoBox({
        length_mm: side_m * 1000, height_mm: side_m * 1000,
        depth_mm: Math.max(8, thickness_mm * 6), // exaggerate so thickness is visible
        title: `Plaster layer ≈ ${side_m.toFixed(1)} × ${side_m.toFixed(1)} m × ${thickness_mm} mm`,
        frontColor: '#e0d8c4', topColor: '#f0e8d0', sideColor: '#a89870',
        sideLabel: thickness_mm + ' mm thick',
      });
      body.querySelector('#pOut').innerHTML = `
        <div class="calc-row hilite"><span>Plaster volume</span><strong>${r.plaster_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags · ${r.cement_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="actions">${boqButton(`Plaster ${area_m2} m² × ${thickness_mm} mm`, 'Plaster',
          { area_m2, thickness_mm, mix: body.querySelector('#pM').value },
          { plaster_m3: r.plaster_m3, cement_bags: r.cement_bags, sand_m3: r.sand_m3 })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="cDia"></div>
      <div id="cOut" class="calc-out"></div>`;
    const compute = () => {
      const length_m = +body.querySelector('#cL').value;
      const width_m = +body.querySelector('#cW').value;
      const depth_m = +body.querySelector('#cD').value;
      const r = calcConcrete({ length_m, width_m, depth_m, mpa: body.querySelector('#cM').value, wastePct:+body.querySelector('#cWa').value });
      if (r.error) return body.querySelector('#cOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#cDia').innerHTML = drawIsoBox({
        length_mm: length_m * 1000,
        height_mm: depth_m * 1000,    // visualise as a slab — depth becomes the "height" of the box
        depth_mm: width_m * 1000,
        title: `${length_m} × ${width_m} × ${depth_m} m · ${r.volume_m3} m³ of ${body.querySelector('#cM').value} MPa concrete`,
        frontColor: '#a8a8a4', topColor: '#c4c4c0', sideColor: '#7a7a76',
      });
      body.querySelector('#cOut').innerHTML = `
        <div class="calc-row hilite"><span>Concrete volume (incl. waste)</span><strong>${r.volume_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags · ${r.cement_kg} kg</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="calc-row"><span>Stone (19 mm)</span><strong>${r.stone_m3} m³</strong></div>
        <div class="calc-row"><span>Water (target)</span><strong>${r.water_L} L</strong></div>
        <div class="calc-row"><span>Max w/c ratio</span><strong>${r.wcRatio}</strong></div>
        <div class="meta cite">Source: SANS 10100-1 mix proportions · NBR Reg H1 strength minima</div>
        <div class="actions">${boqButton(`Concrete ${length_m}×${width_m}×${depth_m} m @ ${body.querySelector('#cM').value} MPa`, 'Concrete',
          { length_m, width_m, depth_m, mpa: body.querySelector('#cM').value },
          { volume_m3: r.volume_m3, cement_bags: r.cement_bags, sand_m3: r.sand_m3, stone_m3: r.stone_m3, water_L: r.water_L })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="sDia"></div>
      <div id="sOut" class="calc-out"></div>`;
    const compute = () => {
      const r = recommendedFootingWidth(
        body.querySelector('#sC').value, +body.querySelector('#sS').value, body.querySelector('#sT').value);
      if (r.rational) {
        body.querySelector('#sDia').innerHTML = '';
        body.querySelector('#sOut').innerHTML = `<div class="callout warn"><strong>Engineer required.</strong> ${escapeHtml(r.note)}</div>`;
      } else {
        body.querySelector('#sDia').innerHTML = drawStrip({ width_m: r.width_mm/1000, depth_m: r.depth_mm/1000, mpa: 15 });
        body.querySelector('#sOut').innerHTML = `
          <div class="calc-row hilite"><span>Strip-footing width</span><strong>${r.width_mm} mm</strong></div>
          <div class="calc-row"><span>Strip-footing depth</span><strong>${r.depth_mm} mm</strong></div>
          <div class="meta">${escapeHtml(r.note)}</div>
          <div class="meta cite">Source: SANS 10400-H empirical Part-H · NBR Reg H1</div>
          <div class="actions">${boqButton(`Strip footing ${r.width_mm}×${r.depth_mm} mm`, 'Strip footing',
            { siteClass: body.querySelector('#sC').value, wallType: body.querySelector('#sT').value, storeys: +body.querySelector('#sS').value },
            { width_mm: r.width_mm, depth_mm: r.depth_mm })}</div>`;
        wireBoqButtons(body);
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
      <div id="rDia"></div>
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
      // Diagram: stacked horizontal bars, length-scaled
      const W = 460, BH = 240;
      const maxLen = Math.max(1, ...r.rows.map(x => x.each_m));
      let bars = '';
      let yy = 24;
      for (const row of r.rows) {
        const dia = parseInt(String(row.size).replace(/\D+/g, ''), 10);
        const px = (row.each_m / maxLen) * (W - 140);
        const thick = Math.max(3, dia * 0.6);
        bars += `<rect x="120" y="${yy}" width="${px}" height="${thick}" fill="#7a7a76" stroke="#444"/>
          <text x="6" y="${yy + thick/2 + 4}" font-size="11" fill="${C.accent}" font-weight="600">${row.size}</text>
          <text x="60" y="${yy + thick/2 + 4}" font-size="10" fill="${C.muted}">×${row.bars}</text>
          <text x="${120 + px + 6}" y="${yy + thick/2 + 4}" font-size="10" fill="${C.muted}">${row.each_m}m · ${row.kg}kg</text>`;
        yy += thick + 14;
        if (yy > BH - 10) break;
      }
      body.querySelector('#rDia').innerHTML = svgWrap(`
        ${bars}
        <text x="${W-10}" y="${BH-6}" font-size="10" text-anchor="end" fill="${C.muted}">${r.total_kg} kg · ${r.tonnes} t total</text>`, W, BH);
      const detail = r.rows.map(row =>
        `<div class="calc-row"><span>${row.bars} × ${row.size} @ ${row.each_m} m (lap ≈ ${row.lap_mm} mm)</span><strong>${row.kg} kg</strong></div>`).join('');
      body.querySelector('#rOut').innerHTML =
        (detail || '<div class="empty">Add a bar to compute.</div>') +
        `<div class="calc-row hilite"><span>Total mass</span><strong>${r.total_kg} kg · ${r.tonnes} t</strong></div>
         <div class="meta cite">Source: SANS 920 reinforcing bars · 40Ø lap rule for Grade 450</div>
         <div class="actions">${boqButton(`Rebar bundle (${items.length} sizes)`, 'Rebar', { items },
            { total_kg: r.total_kg, tonnes: r.tonnes })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="tDia"></div>
      <div id="tOut" class="calc-out"></div>`;
    const compute = () => {
      const area_m2 = +body.querySelector('#tA').value;
      const r = calcTiling({
        area_m2,
        tile_w_mm:+body.querySelector('#tW').value,
        tile_h_mm:+body.querySelector('#tH').value,
        joint_mm:+body.querySelector('#tJ').value,
        wastePct:+body.querySelector('#tWa').value,
      });
      if (r.error) return body.querySelector('#tOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      const side_m = Math.sqrt(area_m2 || 1);
      body.querySelector('#tDia').innerHTML = drawIsoBox({
        length_mm: side_m * 1000, height_mm: side_m * 1000, depth_mm: 80,
        pattern: 'tile',
        title: `Tiled surface ≈ ${side_m.toFixed(1)} × ${side_m.toFixed(1)} m`,
        frontColor: '#dde6ea', topColor: '#eef2f4', sideColor: '#888',
      });
      body.querySelector('#tOut').innerHTML = `
        <div class="calc-row"><span>Tiles per m²</span><strong>${r.tilesPerM2}</strong></div>
        <div class="calc-row hilite"><span>Tiles needed (incl. waste)</span><strong>${r.tiles.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Adhesive (20 kg)</span><strong>${r.adhesive_bags} bags</strong></div>
        <div class="calc-row"><span>Grout (~${TILE_GROUT_KG_PER_M2_PER_MM_JOINT} kg/m²/mm joint)</span><strong>${r.grout_kg} kg</strong></div>
        <div class="meta cite">Source: SANS 10107 ceramic tiling rules of thumb</div>
        <div class="actions">${boqButton(`Tiling ${area_m2} m² (${body.querySelector('#tW').value}×${body.querySelector('#tH').value} mm)`, 'Tiling',
          { area_m2, tile_w_mm:+body.querySelector('#tW').value, tile_h_mm:+body.querySelector('#tH').value, joint_mm:+body.querySelector('#tJ').value },
          { tiles: r.tiles, adhesive_bags: r.adhesive_bags, grout_kg: r.grout_kg })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="pnDia"></div>
      <div id="pnOut" class="calc-out"></div>`;
    const compute = () => {
      const area_m2 = +body.querySelector('#pnA').value;
      const coats = +body.querySelector('#pnC').value;
      const type = body.querySelector('#pnT').value;
      const r = calcPaint({ area_m2, coats, paintType: type });
      // Visualise: tins lined up, count = tins5L
      const W = 460, H = 200;
      let tins = '';
      const n = Math.min(r.tins5L, 18);
      const colors = { pva:'#f5c4d3', enamel:'#cfd8d4', primer:'#d4cab2', plaster_primer:'#e0d8c4', roof:'#a05030' };
      const c = colors[type] || '#6fdc9a';
      for (let i = 0; i < n; i++) {
        const x = 30 + i * 24;
        tins += `<rect x="${x}" y="${H/2 - 30}" width="18" height="50" fill="${c}" stroke="rgba(0,0,0,.4)"/>
          <rect x="${x-1}" y="${H/2 - 36}" width="20" height="6" fill="${c}" stroke="rgba(0,0,0,.4)"/>`;
      }
      const wallW = 120, wallH = 70;
      body.querySelector('#pnDia').innerHTML = svgWrap(`
        <rect x="${W - wallW - 30}" y="${H/2 - wallH/2}" width="${wallW}" height="${wallH}" fill="${c}" opacity="0.55" stroke="${c}" stroke-width="2"/>
        <text x="${W - wallW - 30 + wallW/2}" y="${H/2 + 4}" font-size="11" text-anchor="middle" fill="rgba(0,0,0,.7)" font-weight="700">${area_m2} m²</text>
        ${tins}
        <text x="30" y="${H/2 + 40}" font-size="10" fill="${C.muted}">${r.tins5L} × 5 L tin${r.tins5L>1?'s':''}${n < r.tins5L ? ' (showing first '+n+')' : ''}</text>
        <text x="${W/2}" y="20" font-size="11" text-anchor="middle" fill="${C.accent}">${coats} coat${coats>1?'s':''} · ${r.litres} L total</text>
      `, W, H);
      body.querySelector('#pnOut').innerHTML = `
        <div class="calc-row hilite"><span>Paint required</span><strong>${r.litres} L</strong></div>
        <div class="calc-row"><span>5 L tins</span><strong>${r.tins5L}</strong></div>
        <div class="calc-row"><span>20 L tins</span><strong>${r.tins20L}</strong></div>
        <div class="meta cite">Source: typical SA paint coverage rates (manufacturer data sheets)</div>
        <div class="actions">${boqButton(`Paint ${area_m2} m² × ${coats} coats (${type})`, 'Paint',
          { area_m2, coats, type }, { litres: r.litres, tins5L: r.tins5L })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="xDia"></div>
      <div id="xOut" class="calc-out"></div>`;
    const compute = () => {
      const length_m = +body.querySelector('#xL').value;
      const width_m = +body.querySelector('#xW').value;
      const depth_m = +body.querySelector('#xD').value;
      const soil = body.querySelector('#xS').value;
      const r = calcExcavation({ length_m, width_m, depth_m, soil });
      body.querySelector('#xDia').innerHTML = drawExcav({ length_m, width_m, depth_m, soil });
      body.querySelector('#xOut').innerHTML = `
        <div class="calc-row"><span>In-situ volume</span><strong>${r.insitu_m3} m³</strong></div>
        <div class="calc-row"><span>Bulking factor</span><strong>×${r.bulkFactor}</strong></div>
        <div class="calc-row hilite"><span>Loose volume to cart</span><strong>${r.loose_m3} m³</strong></div>
        <div class="calc-row"><span>Truck loads (6 m³)</span><strong>${r.truckLoads}</strong></div>
        <div class="meta cite">Source: NBR Reg G2 deemed-to-satisfy + standard SA bulking factors</div>
        <div class="actions">${boqButton(`Excavation ${length_m}×${width_m}×${depth_m} m (${soil})`, 'Excavation',
          { length_m, width_m, depth_m, soil }, { insitu_m3: r.insitu_m3, loose_m3: r.loose_m3, truckLoads: r.truckLoads })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="rDia"></div>
      <div id="rOut" class="calc-out"></div>`;
    const compute = () => {
      const span_m = +body.querySelector('#rSp').value;
      const length_m = +body.querySelector('#rLn').value;
      const pitch_deg = +body.querySelector('#rPi').value;
      const tileType = body.querySelector('#rTy').value;
      const r = calcRoofing({ span_m, length_m, pitch_deg, tileType });
      body.querySelector('#rDia').innerHTML = drawRoof({ span_m, pitch_deg });
      body.querySelector('#rOut').innerHTML = `
        <div class="calc-row"><span>Slope length (rafter)</span><strong>${r.slope_length_m} m</strong></div>
        <div class="calc-row hilite"><span>Roof area (both slopes)</span><strong>${r.roof_area_m2} m²</strong></div>
        ${r.tiles ? `<div class="calc-row"><span>Tiles needed (incl. 5% waste)</span><strong>${r.tiles.toLocaleString()}</strong></div>` : ''}
        <div class="calc-row"><span>Battens (≈ 320 mm centres)</span><strong>${r.batten_m} m</strong></div>
        <div class="calc-row"><span>Ridge length</span><strong>${r.ridge_m} m</strong></div>
        <div class="meta cite">Source: SANS 10400-L · concrete-tile minimum 17° pitch</div>
        <div class="actions">${boqButton(`Roof ${span_m}×${length_m} m @ ${pitch_deg}° (${tileType})`, 'Roofing',
          { span_m, length_m, pitch_deg, tileType }, { roof_area_m2: r.roof_area_m2, tiles: r.tiles, batten_m: r.batten_m, ridge_m: r.ridge_m })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="bsDia"></div>
      <div id="bsOut" class="calc-out"></div>`;
    const compute = () => {
      const span_m = +body.querySelector('#bsSp').value;
      const udl_kNm = +body.querySelector('#bsUd').value;
      const point_kN = +body.querySelector('#bsPt').value;
      const point_pos_m = +body.querySelector('#bsPp').value;
      const r = calcBeam({ span_m, udl_kNm, point_kN, point_pos_m });
      if (r.error) return body.querySelector('#bsOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#bsDia').innerHTML = drawBeam({ span_m, udl_kNm, point_kN, point_pos_m, Ra: r.Ra_kN, Rb: r.Rb_kN, Mmax: r.Mmax_kNm });
      body.querySelector('#bsOut').innerHTML = `
        <div class="calc-row"><span>Total UDL load</span><strong>${r.udl_total_kN} kN</strong></div>
        <div class="calc-row"><span>Reaction at A (Ra)</span><strong>${r.Ra_kN} kN</strong></div>
        <div class="calc-row"><span>Reaction at B (Rb)</span><strong>${r.Rb_kN} kN</strong></div>
        <div class="calc-row hilite"><span>Max bending moment</span><strong>${r.Mmax_kNm} kN·m</strong></div>
        <div class="calc-row"><span>Quick lintel suggestion</span><strong>${escapeHtml(r.lintel)}</strong></div>
        <div class="meta cite">Source: simply-supported beam statics + standard precast lintel sizes (SANS 10400-B sanity-check only — engineer-designed for ULS/SLS)</div>
        <div class="actions">${boqButton(`Beam ${span_m} m · ${udl_kNm} kN/m UDL`, 'Beam / lintel',
          { span_m, udl_kNm, point_kN, point_pos_m }, { Ra_kN: r.Ra_kN, Rb_kN: r.Rb_kN, Mmax_kNm: r.Mmax_kNm, lintel: r.lintel })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function cubeView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Cube strengths (MPa) — comma- or space-separated', '<input id="cuV" type="text" value="28.4 30.1 32.5 27.9 31.0 29.7 33.2 28.8">')}
        ${field('Specified strength fck (MPa)', '<input id="cuFck" type="number" step="1" min="0" value="25">')}
      </div>
      <div id="cuDia"></div>
      <div id="cuOut" class="calc-out"></div>`;
    const compute = () => {
      const raw = body.querySelector('#cuV').value;
      const vals = raw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
      const fckSpec = +body.querySelector('#cuFck').value;
      const r = calcCubeTest(vals);
      if (r.error) return body.querySelector('#cuOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      const pass = r.fck >= fckSpec;
      // Bar chart of cubes
      const W = 460, H = 200, padX = 30, padY = 16;
      const max = Math.max(...vals, fckSpec) * 1.1;
      const bw = (W - padX*2) / vals.length;
      let bars = '';
      vals.forEach((v, i) => {
        const h = (v / max) * (H - padY*2 - 30);
        const x = padX + i * bw;
        const y = H - padY - 20 - h;
        const c = v >= fckSpec ? '#6fdc9a' : '#ff9b87';
        bars += `<rect x="${x+2}" y="${y}" width="${bw-4}" height="${h}" fill="${c}" opacity="0.85"/>
                 <text x="${x + bw/2}" y="${y - 3}" font-size="9" text-anchor="middle" fill="${C.muted}">${v.toFixed(0)}</text>
                 <text x="${x + bw/2}" y="${H - padY - 6}" font-size="9" text-anchor="middle" fill="${C.muted}">#${i+1}</text>`;
      });
      // fck threshold + mean lines
      const yFck = H - padY - 20 - (fckSpec / max) * (H - padY*2 - 30);
      const yMean = H - padY - 20 - (r.mean / max) * (H - padY*2 - 30);
      bars += `<line x1="${padX}" y1="${yFck}" x2="${W - padX}" y2="${yFck}" stroke="${C.warn}" stroke-width="1" stroke-dasharray="4 3"/>
               <text x="${W - padX - 4}" y="${yFck - 3}" font-size="10" text-anchor="end" fill="${C.warn}">fck spec ${fckSpec}</text>
               <line x1="${padX}" y1="${yMean}" x2="${W - padX}" y2="${yMean}" stroke="${C.accent}" stroke-width="1"/>
               <text x="${padX + 4}" y="${yMean - 3}" font-size="10" fill="${C.accent}">mean ${r.mean}</text>`;
      body.querySelector('#cuDia').innerHTML = svgWrap(bars, W, H);
      body.querySelector('#cuOut').innerHTML = `
        <div class="calc-row"><span>n</span><strong>${r.n}</strong></div>
        <div class="calc-row"><span>Mean (MPa)</span><strong>${r.mean}</strong></div>
        <div class="calc-row"><span>σ (std dev)</span><strong>${r.sigma}</strong></div>
        <div class="calc-row"><span>Min · Max</span><strong>${r.min} · ${r.max}</strong></div>
        <div class="calc-row hilite"><span>Characteristic fck (mean − 1.64σ)</span><strong>${r.fck} MPa</strong></div>
        <div class="callout ${pass?'':'warn'}">${pass ? '✅ PASS — characteristic strength meets specified fck of ' + fckSpec + ' MPa.' : '⚠️ FAIL — characteristic strength of ' + r.fck + ' MPa is below specified fck of ' + fckSpec + ' MPa. Investigate, retest, or downgrade element.'}</div>
        <div class="meta cite">Source: SANS 10100-1 / Eurocode 2 — characteristic strength = mean − 1.64σ (5% defective)</div>
        <div class="actions">${boqButton(`Cube test n=${r.n}`, 'Cube test', { values: vals, fckSpec }, { mean: r.mean, sigma: r.sigma, fck: r.fck, pass })}</div>`;
      wireBoqButtons(body);
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
      </div>
      <div id="cDia"></div>
      <div id="cOut" class="calc-out"></div>`;
    const compute = () => {
      const r = assessSiteClass({
        slope: body.querySelector('#cS').value,
        soilType: body.querySelector('#cT').value,
        waterTable: body.querySelector('#cW').value,
        dolomite: body.querySelector('#cD').value,
        krotovinas: body.querySelector('#cK').value,
      });
      // Soil profile cartoon
      const W = 460, H = 200;
      const colors = { sand:'#e0c890', silt:'#b8a070', mixed:'#a08060', clay:'#8a5a3a', heaving:'#6a3818', collapsing:'#dab070', gravel:'#a89878' };
      const c = colors[body.querySelector('#cT').value] || '#a08060';
      const slopeAngle = body.querySelector('#cS').value === 'steep' ? 22 : (body.querySelector('#cS').value === 'moderate' ? 8 : 0);
      const wt = body.querySelector('#cW').value;
      const wtY = wt === 'high' ? 110 : (wt === 'medium' ? 145 : 175);
      const dolo = body.querySelector('#cD').value === 'yes';
      body.querySelector('#cDia').innerHTML = svgWrap(`
        <polygon points="0,${50 + slopeAngle*2} ${W},${50 - slopeAngle*2} ${W},${H} 0,${H}" fill="${c}"/>
        <line x1="0" y1="${wtY}" x2="${W}" y2="${wtY}" stroke="#2a6cb5" stroke-width="2" stroke-dasharray="6 3"/>
        <text x="${W - 8}" y="${wtY - 4}" font-size="10" text-anchor="end" fill="#2a6cb5">water table</text>
        ${dolo ? `<ellipse cx="120" cy="${H - 30}" rx="40" ry="14" fill="#000" opacity=".5"/>
                  <text x="120" y="${H - 28}" font-size="10" text-anchor="middle" fill="#fff">cavity</text>
                  <ellipse cx="280" cy="${H - 50}" rx="30" ry="10" fill="#000" opacity=".5"/>` : ''}
        <text x="20" y="${48 + slopeAngle*2}" font-size="11" fill="${C.accent}">NGL</text>
        <text x="${W/2}" y="20" font-size="12" text-anchor="middle" fill="${C.accent}" font-weight="700">Site Class ${escapeHtml(String(r.siteClass))}</text>
      `, W, H);
      body.querySelector('#cOut').innerHTML = `
        <div class="calc-row hilite"><span>Site classification</span><strong>${escapeHtml(String(r.siteClass))}</strong></div>
        <div class="callout">${escapeHtml(r.recommendation)}</div>
        <div class="meta cite">Source: NHBRC HBM site classification scheme · NBR Reg F3 geotech</div>
        <div class="actions">${boqButton(`Site assessment — Class ${r.siteClass}`, 'Site class',
          { slope: body.querySelector('#cS').value, soil: body.querySelector('#cT').value, water: wt, dolomite: body.querySelector('#cD').value },
          { siteClass: r.siteClass, recommendation: r.recommendation })}</div>`;
      wireBoqButtons(body);
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

  // ---------- Live diagram renderers (SVG, inline, no deps) ----------
  function svgWrap(content, w = 400, h = 240) {
    // Shared <defs> — patterns + gradients reused across diagrams
    const defs = `
      <defs>
        <pattern id="hatchSoil" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
        </pattern>
        <pattern id="hatchConcrete" patternUnits="userSpaceOnUse" width="6" height="6">
          <circle cx="3" cy="3" r="0.6" fill="rgba(0,0,0,.35)"/>
          <circle cx="0" cy="0" r="0.5" fill="rgba(0,0,0,.25)"/>
        </pattern>
        <pattern id="hatchSteel" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,.4)" stroke-width="0.6"/>
        </pattern>
        <pattern id="hatchInsul" patternUnits="userSpaceOnUse" width="14" height="6">
          <path d="M0,3 q3.5,-3 7,0 t7,0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="0.8"/>
        </pattern>
        <linearGradient id="gradFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,.1)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,.1)"/>
        </linearGradient>
        <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,.18)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,.0)"/>
        </linearGradient>
        <marker id="arrowAcc" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L6,3 z" fill="${C.accent}"/>
        </marker>
      </defs>`;
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:520px;display:block;margin:8px auto;background:#0c1a13;border:1px solid rgba(255,255,255,.08);border-radius:10px">${defs}${content}</svg>`;
  }
  // Diagram palette — match brand (pink) + realistic material colours.
  // Strong-contrast accent for dimensions / labels: pink. Realistic fills
  // for materials. All chosen to read clearly on the dark canvas (#0c1a13).
  const C = {
    fill: '#cfd8d4',          // concrete / generic surface
    soil: '#7a4f2b',          // earth fill
    accent: '#f5c4d3',        // brand pink — labels, dimensions
    accentDark: '#d97a99',    // brand pink darker
    warn: '#f5d56a',          // yellow (force / warning)
    red: '#ff9b87',           // red-coral (fail / wrong)
    ink: '#e8eee9',           // body text on dark
    muted: '#aab0ad',         // dim labels
    dim: 'rgba(255,255,255,.18)',
  };

  function drawStairs({ rise_mm, going_mm, risers }) {
    // Engineering side-elevation: concrete-hatched stair body, treads/risers,
    // handrail at 1000 mm, pitch line, FFL labels, going/rise dim arrows.
    const W = 460, H = 280;
    const padL = 50, padR = 60, padT = 40, padB = 50;
    const totalRun = (risers - 1) * going_mm;
    const totalRise = risers * rise_mm;
    const scale = Math.min((W - padL - padR) / Math.max(totalRun, 1), (H - padT - padB) / Math.max(totalRise, 1));
    const ox = padL, oy = H - padB;
    // Stair body polygon (concrete waist)
    let body = `M ${ox} ${oy} `;
    for (let i = 0; i < risers; i++) {
      const x = ox + i * going_mm * scale;
      const y = oy - (i + 1) * rise_mm * scale;
      body += `L ${x} ${y - (i ? 0 : 0)} L ${x + going_mm * scale} ${y} `;
    }
    body += `L ${ox + totalRun * scale + going_mm * scale} ${oy} Z`;
    // Tread/riser strokes
    let treads = '';
    for (let i = 0; i < risers; i++) {
      const x = ox + i * going_mm * scale;
      const y = oy - (i + 1) * rise_mm * scale;
      treads += `<line x1="${x}" y1="${y}" x2="${x + going_mm*scale}" y2="${y}" stroke="#222" stroke-width="1"/>`;
      treads += `<line x1="${x}" y1="${y}" x2="${x}" y2="${oy - i*rise_mm*scale}" stroke="#222" stroke-width="1"/>`;
    }
    const slopeX = ox + totalRun * scale + going_mm * scale, slopeY = oy - totalRise * scale;
    const angle = Math.atan2(totalRise, totalRun) * 180 / Math.PI;
    // Handrail @ 1000 mm above pitch line
    const railOff = 1000 * scale;
    const dx = (slopeX - ox), dy = (slopeY - oy);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // perpendicular up
    const r1x = ox + nx * railOff, r1y = oy + ny * railOff;
    const r2x = slopeX + nx * railOff, r2y = slopeY + ny * railOff;
    return svgWrap(`
      <!-- FFL lines -->
      <line x1="0" y1="${oy}" x2="${ox + 8}" y2="${oy}" stroke="${C.muted}" stroke-width="1"/>
      <line x1="${slopeX - 8}" y1="${slopeY}" x2="${W}" y2="${slopeY}" stroke="${C.muted}" stroke-width="1"/>
      <text x="6" y="${oy - 4}" font-size="10" fill="${C.muted}">FFL lower</text>
      <text x="${W - 6}" y="${slopeY - 4}" font-size="10" text-anchor="end" fill="${C.muted}">FFL upper</text>
      <!-- stair concrete body -->
      <path d="${body}" fill="#a8a8a4" stroke="#222" stroke-width="1.2"/>
      <path d="${body}" fill="url(#hatchConcrete)"/>
      ${treads}
      <!-- pitch line -->
      <line x1="${ox}" y1="${oy}" x2="${slopeX}" y2="${slopeY}" stroke="${C.red}" stroke-width="1.4" stroke-dasharray="5 3"/>
      <!-- handrail -->
      <line x1="${r1x}" y1="${r1y}" x2="${r2x}" y2="${r2y}" stroke="${C.accent}" stroke-width="2"/>
      <line x1="${ox}" y1="${oy}" x2="${r1x}" y2="${r1y}" stroke="${C.accent}" stroke-width="1.5"/>
      <line x1="${slopeX}" y1="${slopeY}" x2="${r2x}" y2="${r2y}" stroke="${C.accent}" stroke-width="1.5"/>
      <text x="${(r1x + r2x)/2}" y="${(r1y + r2y)/2 - 6}" font-size="10" text-anchor="middle" fill="${C.accent}">handrail @ 1000 mm</text>
      <!-- pitch angle -->
      <text x="${(ox + slopeX)/2 + 4}" y="${(oy + slopeY)/2 - 8}" font-size="11" fill="${C.red}" font-weight="700">${angle.toFixed(1)}°</text>
      <!-- total rise dim (right side) -->
      <line x1="${slopeX + 22}" y1="${oy}" x2="${slopeX + 22}" y2="${slopeY}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${slopeX + 28}" y="${(oy + slopeY)/2}" font-size="10" fill="${C.accent}" font-weight="700">${totalRise} mm</text>
      <!-- total run dim (below) -->
      <line x1="${ox}" y1="${oy + 26}" x2="${slopeX}" y2="${oy + 26}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${(ox + slopeX)/2}" y="${oy + 40}" font-size="10" text-anchor="middle" fill="${C.accent}" font-weight="700">run ${totalRun} mm</text>
      <!-- single going/rise call-out -->
      <text x="${ox + going_mm*scale*0.5}" y="${oy - rise_mm*scale*0.5}" font-size="9" text-anchor="middle" fill="${C.warn}">${going_mm}×${rise_mm}</text>
      <text x="${W - 6}" y="${H - 6}" font-size="10" text-anchor="end" fill="${C.muted}">${risers} risers</text>
    `, W, H);
  }

  function drawStrip({ width_m, depth_m, mpa }) {
    // Engineering cross-section: ground line, hatched soil, brick wall above
    // (with course lines), reinforced footing, dimension arrows.
    const W = 460, H = 280;
    const gnd = 90;
    const wmm = width_m * 1000, dmm = depth_m * 1000;
    const pxScale = Math.min(280 / wmm, 110 / Math.max(dmm, 200));
    const wpx = wmm * pxScale, dpx = dmm * pxScale;
    const cx = W / 2;
    const ftop = gnd + 60;          // 60 px below NGL → buried footing
    const fleft = cx - wpx/2;
    const wallW = 220 * pxScale * 1.5;  // visually exaggerated for clarity
    const wallH = 70;
    // Brick course lines
    let courses = '';
    const courseH = 12;
    for (let y = gnd - wallH; y < gnd; y += courseH) {
      courses += `<line x1="${cx - wallW/2}" y1="${y}" x2="${cx + wallW/2}" y2="${y}" stroke="rgba(0,0,0,.35)" stroke-width="0.5"/>`;
    }
    return svgWrap(`
      <!-- sky -->
      <rect x="0" y="0" width="${W}" height="${gnd}" fill="rgba(255,255,255,.02)"/>
      <!-- soil mass -->
      <rect x="0" y="${gnd}" width="${W}" height="${H - gnd}" fill="#7a4f2b"/>
      <rect x="0" y="${gnd}" width="${W}" height="${H - gnd}" fill="url(#hatchSoil)"/>
      <!-- ground line -->
      <line x1="0" y1="${gnd}" x2="${W}" y2="${gnd}" stroke="#222" stroke-width="1.5"/>
      <text x="6" y="${gnd - 6}" font-size="10" fill="${C.muted}">NGL — natural ground level</text>
      <!-- masonry wall above -->
      <rect x="${cx - wallW/2}" y="${gnd - wallH}" width="${wallW}" height="${wallH}" fill="#b87a5a" stroke="#5a3a17" stroke-width="0.8"/>
      ${courses}
      <text x="${cx}" y="${gnd - wallH - 6}" font-size="10" text-anchor="middle" fill="${C.muted}">220 mm load-bearing wall</text>
      <!-- DPC line -->
      <line x1="${cx - wallW/2 - 4}" y1="${gnd - 5}" x2="${cx + wallW/2 + 4}" y2="${gnd - 5}" stroke="#1a8a4a" stroke-width="2"/>
      <text x="${cx + wallW/2 + 8}" y="${gnd - 1}" font-size="9" fill="#6fdc9a">DPC</text>
      <!-- mass-strip footing — concrete fill + dotted pattern -->
      <rect x="${fleft}" y="${ftop}" width="${wpx}" height="${dpx}" fill="#a8a8a4" stroke="#222" stroke-width="1"/>
      <rect x="${fleft}" y="${ftop}" width="${wpx}" height="${dpx}" fill="url(#hatchConcrete)"/>
      <text x="${cx}" y="${ftop + dpx/2 + 4}" font-size="11" text-anchor="middle" fill="#222" font-weight="700">${mpa} MPa</text>
      <!-- width dim -->
      <line x1="${fleft}" y1="${ftop + dpx + 16}" x2="${fleft + wpx}" y2="${ftop + dpx + 16}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${cx}" y="${ftop + dpx + 30}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">${wmm} mm wide</text>
      <!-- depth dim -->
      <line x1="${fleft + wpx + 18}" y1="${ftop}" x2="${fleft + wpx + 18}" y2="${ftop + dpx}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${fleft + wpx + 24}" y="${ftop + dpx/2 + 4}" font-size="11" fill="${C.accent}" font-weight="700">${dmm} mm</text>
      <!-- depth-below-NGL note -->
      <line x1="${cx - wallW/2 - 30}" y1="${gnd}" x2="${cx - wallW/2 - 30}" y2="${ftop + dpx}" stroke="${C.warn}" stroke-width="0.8" stroke-dasharray="3 3"/>
      <text x="${cx - wallW/2 - 36}" y="${(gnd + ftop)/2}" font-size="10" text-anchor="end" fill="${C.warn}">≥ 400 mm</text>
      <text x="${cx - wallW/2 - 36}" y="${(gnd + ftop)/2 + 12}" font-size="9" text-anchor="end" fill="${C.warn}">below NGL</text>
    `, W, H);
  }

  function drawBeam({ span_m, udl_kNm, point_kN, point_pos_m, Ra, Rb, Mmax }) {
    // Engineering schematic: hatched-steel beam, UDL arrows, point load,
    // pinned/roller supports, reactions, BMD curve below.
    const W = 460, H = 280;
    const padX = 60;
    const beamY = 110;
    const bx0 = padX, bx1 = W - padX, bw = bx1 - bx0;
    const xAt = (m) => bx0 + (m / span_m) * bw;
    let udlArr = '';
    if (udl_kNm > 0) {
      for (let i = 0; i <= 10; i++) {
        const x = bx0 + (i / 10) * bw;
        udlArr += `<line x1="${x}" y1="${beamY - 36}" x2="${x}" y2="${beamY - 6}" stroke="${C.warn}" stroke-width="1.5" marker-end="url(#arrowWarn)"/>`;
      }
      udlArr += `<line x1="${bx0}" y1="${beamY - 36}" x2="${bx1}" y2="${beamY - 36}" stroke="${C.warn}" stroke-width="1"/>`;
      udlArr += `<text x="${(bx0+bx1)/2}" y="${beamY - 42}" font-size="11" text-anchor="middle" fill="${C.warn}" font-weight="600">UDL ${udl_kNm} kN/m</text>`;
    }
    let pt = '';
    if (point_kN > 0) {
      const px = xAt(point_pos_m);
      pt = `<line x1="${px}" y1="${beamY - 60}" x2="${px}" y2="${beamY - 6}" stroke="${C.red}" stroke-width="2.5" marker-end="url(#arrowRed)"/>
            <text x="${px + 6}" y="${beamY - 48}" font-size="11" fill="${C.red}" font-weight="700">${point_kN} kN</text>`;
    }
    let bmd = '';
    if (Mmax > 0) {
      const yScale = 60 / Mmax;
      let path = `M ${bx0} ${beamY + 80}`;
      for (let i = 0; i <= 40; i++) {
        const m = (i / 40) * span_m;
        const Mu = udl_kNm * m * (span_m - m) / 2;
        const Mp = (m <= point_pos_m) ? point_kN * m * (span_m - point_pos_m) / span_m
                                       : point_kN * point_pos_m * (span_m - m) / span_m;
        const M = Mu + Mp;
        const x = xAt(m);
        const y = beamY + 80 + M * yScale;
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      bmd = `<line x1="${bx0}" y1="${beamY + 80}" x2="${bx1}" y2="${beamY + 80}" stroke="${C.dim}" stroke-width="0.8"/>
             <path d="${path} L ${bx1} ${beamY + 80} Z" fill="${C.accent}" opacity="0.30" stroke="${C.accent}" stroke-width="1.5"/>
             <text x="${(bx0+bx1)/2}" y="${beamY + 80 + Mmax * yScale + 16}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">M_max = ${Mmax.toFixed(2)} kN·m</text>
             <text x="${bx1 + 6}" y="${beamY + 80 + 4}" font-size="9" fill="${C.muted}">BMD</text>`;
    }
    return svgWrap(`
      <defs>
        <marker id="arrowWarn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="${C.warn}"/></marker>
        <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="${C.red}"/></marker>
      </defs>
      ${udlArr}${pt}
      <!-- beam -->
      <rect x="${bx0}" y="${beamY - 6}" width="${bw}" height="12" fill="#7a8a8a" stroke="#222"/>
      <rect x="${bx0}" y="${beamY - 6}" width="${bw}" height="12" fill="url(#hatchSteel)"/>
      <!-- pinned support (left) -->
      <polygon points="${bx0 - 10},${beamY + 18} ${bx0 + 10},${beamY + 18} ${bx0},${beamY + 6}" fill="#444" stroke="#222"/>
      <line x1="${bx0 - 14}" y1="${beamY + 22}" x2="${bx0 + 14}" y2="${beamY + 22}" stroke="#444" stroke-width="2"/>
      <!-- roller support (right) -->
      <polygon points="${bx1 - 10},${beamY + 14} ${bx1 + 10},${beamY + 14} ${bx1},${beamY + 6}" fill="#444" stroke="#222"/>
      <circle cx="${bx1 - 5}" cy="${beamY + 17}" r="3" fill="#444"/>
      <circle cx="${bx1 + 5}" cy="${beamY + 17}" r="3" fill="#444"/>
      <line x1="${bx1 - 14}" y1="${beamY + 22}" x2="${bx1 + 14}" y2="${beamY + 22}" stroke="#444" stroke-width="2"/>
      <!-- reactions -->
      <line x1="${bx0}" y1="${beamY + 30}" x2="${bx0}" y2="${beamY + 56}" stroke="${C.accent}" stroke-width="2" marker-start="url(#arrowAcc)"/>
      <line x1="${bx1}" y1="${beamY + 30}" x2="${bx1}" y2="${beamY + 56}" stroke="${C.accent}" stroke-width="2" marker-start="url(#arrowAcc)"/>
      <text x="${bx0}" y="${beamY + 70}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">Ra ${Ra.toFixed(1)} kN</text>
      <text x="${bx1}" y="${beamY + 70}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">Rb ${Rb.toFixed(1)} kN</text>
      <!-- span dim -->
      <line x1="${bx0}" y1="${beamY - 80}" x2="${bx1}" y2="${beamY - 80}" stroke="${C.muted}" stroke-width="0.8" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${(bx0+bx1)/2}" y="${beamY - 86}" font-size="11" text-anchor="middle" fill="${C.muted}">span ${span_m} m</text>
      ${bmd}
    `, W, H);
  }

  function drawRoof({ span_m, pitch_deg }) {
    // Engineering truss section: rafters, ridge, ceiling tie, king post,
    // web members, wall plates, dimensions, pitch indicator.
    const W = 460, H = 280, padX = 60;
    const apexX = W / 2;
    const baseY = H - 70;
    const half = (W - 2*padX) / 2;
    const pitchRad = pitch_deg * Math.PI / 180;
    const rise = Math.min(half * Math.tan(pitchRad), H - 110);
    const apexY = baseY - rise;
    const slope_m = Math.sqrt((span_m/2)**2 + Math.pow((span_m/2) * Math.tan(pitchRad), 2));
    // Web members (fink-style): from quarter points up to rafters
    const lq = padX + half/2, rq = W - padX - half/2;
    const lqY = baseY, rqY = baseY;
    // Mid-rafter points
    const lmX = (padX + apexX)/2, lmY = (baseY + apexY)/2;
    const rmX = (apexX + W - padX)/2, rmY = (apexY + baseY)/2;
    return svgWrap(`
      <!-- wall plates (top of masonry) -->
      <rect x="${padX - 18}" y="${baseY}" width="36" height="14" fill="#b87a5a" stroke="#222"/>
      <rect x="${W - padX - 18}" y="${baseY}" width="36" height="14" fill="#b87a5a" stroke="#222"/>
      <text x="${padX}" y="${baseY + 26}" font-size="9" text-anchor="middle" fill="${C.muted}">wall plate</text>
      <text x="${W - padX}" y="${baseY + 26}" font-size="9" text-anchor="middle" fill="${C.muted}">wall plate</text>
      <!-- triangle envelope (timber colour fill) -->
      <polygon points="${padX},${baseY} ${apexX},${apexY} ${W-padX},${baseY}" fill="#c89a5a" opacity="0.30" stroke="none"/>
      <!-- ceiling tie (bottom chord) -->
      <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}" stroke="#7a4a20" stroke-width="6"/>
      <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}" stroke="#3a2010" stroke-width="1"/>
      <!-- rafters (top chords) -->
      <line x1="${padX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="#7a4a20" stroke-width="6"/>
      <line x1="${apexX}" y1="${apexY}" x2="${W - padX}" y2="${baseY}" stroke="#7a4a20" stroke-width="6"/>
      <line x1="${padX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="#3a2010" stroke-width="1"/>
      <line x1="${apexX}" y1="${apexY}" x2="${W - padX}" y2="${baseY}" stroke="#3a2010" stroke-width="1"/>
      <!-- king post -->
      <line x1="${apexX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="#7a4a20" stroke-width="5"/>
      <!-- web members -->
      <line x1="${lq}" y1="${lqY}" x2="${lmX}" y2="${lmY}" stroke="#7a4a20" stroke-width="4"/>
      <line x1="${rq}" y1="${rqY}" x2="${rmX}" y2="${rmY}" stroke="#7a4a20" stroke-width="4"/>
      <!-- ridge marker -->
      <circle cx="${apexX}" cy="${apexY}" r="4" fill="${C.accent}" stroke="#222"/>
      <text x="${apexX + 8}" y="${apexY + 4}" font-size="10" fill="${C.accent}">ridge</text>
      <!-- pitch arc -->
      <path d="M ${padX + 38} ${baseY} A 38 38 0 0 0 ${padX + 38 * Math.cos(pitchRad)} ${baseY - 38 * Math.sin(pitchRad)}" fill="none" stroke="${C.warn}" stroke-width="1.4"/>
      <text x="${padX + 46}" y="${baseY - 8}" font-size="11" fill="${C.warn}" font-weight="700">${pitch_deg}°</text>
      <!-- slope dim (along left rafter) -->
      <text x="${(padX + apexX)/2 - 6}" y="${(baseY + apexY)/2 - 6}" font-size="10" text-anchor="end" fill="${C.accent}" font-weight="600">slope ${slope_m.toFixed(2)} m</text>
      <!-- span dim arrow below -->
      <line x1="${padX}" y1="${baseY + 44}" x2="${W - padX}" y2="${baseY + 44}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${apexX}" y="${baseY + 58}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">span ${span_m} m</text>
      <!-- rise dim (right) -->
      <line x1="${W - padX + 24}" y1="${apexY}" x2="${W - padX + 24}" y2="${baseY}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${W - padX + 30}" y="${(apexY + baseY)/2 + 4}" font-size="10" fill="${C.accent}" font-weight="700">rise ${((span_m/2) * Math.tan(pitchRad)).toFixed(2)} m</text>
    `, W, H);
  }

  function drawExcav({ length_m, width_m, depth_m, soil }) {
    // Engineering-style cross-section: ground line, hatched soil, sloped trench
    // walls, properly-shaped spoil mound, worker silhouette for scale.
    const W = 460, H = 280;
    const skyH = 70;                    // sky / ambient zone above ground
    const gnd = skyH;                   // ground line y
    const cx = W / 2 - 40;               // trench centre offset left to leave room for spoil
    // Pixel dimensions
    const widthPx = Math.max(60, Math.min(160, width_m * 50));
    const depthPx = Math.max(50, Math.min(150, depth_m * 60));
    const slopeOff = soil === 'rock' ? 4 : soil === 'clay' ? 16 : soil === 'gravel' ? 22 : 28;
    // Trench corner points
    const x1 = cx - widthPx/2, x2 = cx + widthPx/2;
    const y0 = gnd, y1 = gnd + depthPx;
    const xb1 = x1 + slopeOff, xb2 = x2 - slopeOff;
    // Soil hatch pattern
    const soilColors = { sand: '#d8b070', gravel: '#a89878', mixed: '#8a6c4a', clay: '#6a4828', rock: '#7a7570', heaving: '#5a3818', collapsing: '#c8a060' };
    const fill = soilColors[soil] || '#8a6c4a';
    // Spoil mound — proper trapezoidal heap with rounded crown
    const spoilX = x2 + 30;
    const spoilBase = Math.min(120, widthPx * 1.4);
    const spoilH = Math.max(20, depthPx * 0.55);
    // Worker silhouette — 1.8 m scale reference
    const worker = `
      <g transform="translate(${x2 + 14}, ${gnd - 50}) scale(0.6)" opacity="0.7">
        <circle cx="0" cy="0" r="6" fill="${C.ink}"/>
        <line x1="0" y1="6" x2="0" y2="32" stroke="${C.ink}" stroke-width="3"/>
        <line x1="0" y1="14" x2="-9" y2="22" stroke="${C.ink}" stroke-width="2"/>
        <line x1="0" y1="14" x2="9" y2="22" stroke="${C.ink}" stroke-width="2"/>
        <line x1="0" y1="32" x2="-7" y2="48" stroke="${C.ink}" stroke-width="3"/>
        <line x1="0" y1="32" x2="7" y2="48" stroke="${C.ink}" stroke-width="3"/>
      </g>
      <text x="${x2 + 22}" y="${gnd - 40}" font-size="9" fill="${C.muted}">~1.8 m</text>
    `;
    return svgWrap(`
      <defs>
        <pattern id="soilHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0,0,0,.20)" stroke-width="1.2"/>
        </pattern>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a3050" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#1a3050" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- sky / ambient -->
      <rect x="0" y="0" width="${W}" height="${gnd}" fill="url(#skyGrad)"/>
      <!-- soil mass -->
      <rect x="0" y="${gnd}" width="${W}" height="${H - gnd}" fill="${fill}"/>
      <rect x="0" y="${gnd}" width="${W}" height="${H - gnd}" fill="url(#soilHatch)"/>
      <!-- ground line -->
      <line x1="0" y1="${gnd}" x2="${W}" y2="${gnd}" stroke="#222" stroke-width="1.5"/>
      <text x="6" y="${gnd - 5}" font-size="10" fill="${C.muted}">Natural ground level (NGL)</text>
      <!-- trench (cut-out from soil) -->
      <polygon points="${x1},${y0} ${xb1},${y1} ${xb2},${y1} ${x2},${y0}" fill="#0c1a13" stroke="#222" stroke-width="1"/>
      <!-- slope angle indicator -->
      <text x="${(x1 + xb1)/2 - 4}" y="${(y0 + y1)/2}" font-size="9" fill="${C.warn}" font-weight="600">slope</text>
      <!-- dimension lines -->
      <!-- width (top of trench) -->
      <line x1="${x1}" y1="${y0 - 16}" x2="${x2}" y2="${y0 - 16}" stroke="${C.accent}" stroke-width="1"/>
      <line x1="${x1}" y1="${y0 - 20}" x2="${x1}" y2="${y0 - 12}" stroke="${C.accent}"/>
      <line x1="${x2}" y1="${y0 - 20}" x2="${x2}" y2="${y0 - 12}" stroke="${C.accent}"/>
      <text x="${cx}" y="${y0 - 22}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">${width_m} m</text>
      <!-- depth -->
      <line x1="${x2 + 24}" y1="${y0}" x2="${x2 + 24}" y2="${y1}" stroke="${C.accent}" stroke-width="1"/>
      <line x1="${x2 + 20}" y1="${y0}" x2="${x2 + 28}" y2="${y0}" stroke="${C.accent}"/>
      <line x1="${x2 + 20}" y1="${y1}" x2="${x2 + 28}" y2="${y1}" stroke="${C.accent}"/>
      <text x="${x2 + 32}" y="${(y0 + y1)/2 + 4}" font-size="11" fill="${C.accent}" font-weight="700">${depth_m} m</text>
      <!-- length annotation -->
      <text x="${cx}" y="${y1 + 18}" font-size="10" text-anchor="middle" fill="${C.muted}">trench × ${length_m} m long (into page)</text>
      <!-- spoil mound — proper heap shape -->
      <path d="M ${spoilX - spoilBase/2} ${gnd}
               Q ${spoilX - spoilBase/4} ${gnd - spoilH * 1.2}
                 ${spoilX} ${gnd - spoilH}
               Q ${spoilX + spoilBase/4} ${gnd - spoilH * 1.2}
                 ${spoilX + spoilBase/2} ${gnd} Z"
            fill="${fill}" stroke="rgba(0,0,0,.4)" stroke-width="0.8"/>
      <path d="M ${spoilX - spoilBase/2} ${gnd}
               Q ${spoilX - spoilBase/4} ${gnd - spoilH * 1.2}
                 ${spoilX} ${gnd - spoilH}
               Q ${spoilX + spoilBase/4} ${gnd - spoilH * 1.2}
                 ${spoilX + spoilBase/2} ${gnd} Z"
            fill="url(#soilHatch)"/>
      <text x="${spoilX}" y="${gnd - spoilH - 6}" font-size="11" text-anchor="middle" fill="${C.muted}">spoil heap</text>
      ${worker}
      <text x="${W - 6}" y="${H - 6}" font-size="10" text-anchor="end" fill="${C.warn}" font-weight="600">soil: ${soil}</text>
    `, W, H);
  }

  function drawPipe({ diameter_mm, slope_pct, velocity_ms, full }) {
    // Two-panel: cross-section (left circle with water level) + side
    // elevation (right) showing pipe in trench with slope and flow arrow.
    const W = 460, H = 280;
    // ---- cross-section (left) ----
    const cx = 105, cy = 130;
    const r = Math.min(60, Math.max(28, diameter_mm * 0.18));
    const fillFrac = full ? 1.0 : 0.7;
    const waterTop = cy + r - 2 * r * fillFrac;
    // ---- side elevation (right) ----
    const sx0 = 215, sx1 = W - 30, sy0 = 100;
    const slopeRise = (sx1 - sx0) * slope_pct / 100;
    const sy1 = sy0 + slopeRise;
    const pipeT = Math.max(10, r * 0.6);  // visible bore on side view
    return svgWrap(`
      <!-- ===== cross-section ===== -->
      <text x="${cx}" y="40" font-size="11" text-anchor="middle" fill="${C.muted}" font-weight="600">SECTION A–A</text>
      <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#a8a8a4" stroke="#222"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="url(#hatchConcrete)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0c1a13" stroke="#222"/>
      <clipPath id="pipefill"><rect x="${cx-r}" y="${waterTop}" width="${2*r}" height="${2*r}"/></clipPath>
      <circle cx="${cx}" cy="${cy}" r="${r - 0.5}" fill="#2a6cb5" opacity="0.7" clip-path="url(#pipefill)"/>
      <line x1="${cx-r-2}" y1="${waterTop}" x2="${cx+r+2}" y2="${waterTop}" stroke="#6fb8ff" stroke-width="1" stroke-dasharray="3 2"/>
      <text x="${cx + r + 8}" y="${waterTop + 3}" font-size="9" fill="#6fb8ff">${full ? 'full' : 'flow lvl'}</text>
      <!-- diameter dim -->
      <line x1="${cx - r}" y1="${cy + r + 22}" x2="${cx + r}" y2="${cy + r + 22}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>
      <text x="${cx}" y="${cy + r + 36}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">Ø ${diameter_mm} mm</text>
      <!-- ===== side elevation ===== -->
      <text x="${(sx0+sx1)/2}" y="40" font-size="11" text-anchor="middle" fill="${C.muted}" font-weight="600">ELEVATION</text>
      <!-- ground line -->
      <line x1="${sx0 - 5}" y1="60" x2="${sx1 + 5}" y2="60" stroke="#222" stroke-width="1.2"/>
      <text x="${sx0}" y="56" font-size="9" fill="${C.muted}">NGL</text>
      <!-- soil mass -->
      <rect x="${sx0 - 5}" y="60" width="${sx1 - sx0 + 10}" height="${H - 60 - 30}" fill="#7a4f2b" opacity="0.6"/>
      <rect x="${sx0 - 5}" y="60" width="${sx1 - sx0 + 10}" height="${H - 60 - 30}" fill="url(#hatchSoil)"/>
      <!-- pipe (sloping) -->
      <line x1="${sx0}" y1="${sy0 - pipeT/2}" x2="${sx1}" y2="${sy1 - pipeT/2}" stroke="#222" stroke-width="1"/>
      <line x1="${sx0}" y1="${sy0 + pipeT/2}" x2="${sx1}" y2="${sy1 + pipeT/2}" stroke="#222" stroke-width="1"/>
      <polygon points="${sx0},${sy0-pipeT/2} ${sx1},${sy1-pipeT/2} ${sx1},${sy1+pipeT/2} ${sx0},${sy0+pipeT/2}" fill="#a8a8a4"/>
      <polygon points="${sx0},${sy0-pipeT/2} ${sx1},${sy1-pipeT/2} ${sx1},${sy1+pipeT/2} ${sx0},${sy0+pipeT/2}" fill="url(#hatchConcrete)" opacity="0.6"/>
      <!-- flow arrow inside pipe -->
      <line x1="${sx0 + 14}" y1="${sy0}" x2="${sx1 - 14}" y2="${sy1}" stroke="#6fb8ff" stroke-width="2" marker-end="url(#arrowAcc)"/>
      <text x="${(sx0+sx1)/2}" y="${(sy0+sy1)/2 - 8}" font-size="10" text-anchor="middle" fill="#6fb8ff" font-weight="600">flow</text>
      <!-- horizontal reference -->
      <line x1="${sx0}" y1="${sy0}" x2="${sx1}" y2="${sy0}" stroke="${C.muted}" stroke-width="0.6" stroke-dasharray="3 3"/>
      <!-- slope angle indicator -->
      <path d="M ${sx0 + 38} ${sy0} A 38 38 0 0 1 ${sx0 + 38} ${sy0 + 0.001}" fill="none" stroke="${C.warn}"/>
      <text x="${sx0 + 50}" y="${sy0 + 12}" font-size="11" fill="${C.warn}" font-weight="700">${slope_pct}%</text>
      <!-- velocity callout -->
      <text x="${sx1}" y="${H - 12}" font-size="10" text-anchor="end" fill="${C.accent}" font-weight="600">v = ${velocity_ms.toFixed(2)} m/s</text>
    `, W, H);
  }

  function drawInsulation({ thickness_mm, R, productName }) {
    // Wall buildup section: external plaster, brick, cavity, insulation,
    // inner brick, internal plaster — labelled with thicknesses, with
    // outside/inside arrows and dimension chain.
    const W = 460, H = 280;
    const top = 40, bot = H - 60;
    let x = 40;
    const layers = [
      { w: 12, fill: '#d8c4a0', hatch: null,             label: 'plaster',  sub: '12 mm' },
      { w: 28, fill: '#b87a5a', hatch: null,             label: 'brick',    sub: '110 mm' },
      { w: 18, fill: '#0c1a13', hatch: null,             label: 'cavity',   sub: '50 mm' },
      { w: Math.min(170, Math.max(30, thickness_mm * 0.7)), fill: '#f5d56a', hatch: 'url(#hatchInsul)', label: 'insulation', sub: thickness_mm + ' mm' },
      { w: 28, fill: '#b87a5a', hatch: null,             label: 'brick',    sub: '110 mm' },
      { w: 12, fill: '#e8d8b8', hatch: null,             label: 'plaster',  sub: '12 mm' },
    ];
    let parts = '';
    let dimChain = '';
    let labels = '';
    for (const L of layers) {
      parts += `<rect x="${x}" y="${top}" width="${L.w}" height="${bot - top}" fill="${L.fill}" stroke="#222" stroke-width="0.5"/>`;
      if (L.hatch) parts += `<rect x="${x}" y="${top}" width="${L.w}" height="${bot - top}" fill="${L.hatch}"/>`;
      // dim ticks
      dimChain += `<line x1="${x}" y1="${bot + 12}" x2="${x}" y2="${bot + 26}" stroke="${C.muted}" stroke-width="0.6"/>`;
      // rotated label inside layer
      if (L.w >= 14) {
        labels += `<text x="${x + L.w/2}" y="${(top+bot)/2}" font-size="10" text-anchor="middle" fill="#111" font-weight="600" transform="rotate(-90 ${x + L.w/2} ${(top+bot)/2})">${L.label}</text>`;
        labels += `<text x="${x + L.w/2}" y="${(top+bot)/2 + 14}" font-size="8" text-anchor="middle" fill="#111" transform="rotate(-90 ${x + L.w/2} ${(top+bot)/2 + 14})">${L.sub}</text>`;
      }
      x += L.w;
    }
    const xEnd = x;
    dimChain += `<line x1="${xEnd}" y1="${bot + 12}" x2="${xEnd}" y2="${bot + 26}" stroke="${C.muted}" stroke-width="0.6"/>`;
    dimChain += `<line x1="40" y1="${bot + 20}" x2="${xEnd}" y2="${bot + 20}" stroke="${C.accent}" stroke-width="1" marker-start="url(#arrowAcc)" marker-end="url(#arrowAcc)"/>`;
    return svgWrap(`
      ${parts}
      ${labels}
      ${dimChain}
      <!-- outside / inside arrows -->
      <text x="40" y="${top - 10}" font-size="10" fill="${C.muted}">← outside</text>
      <text x="${xEnd}" y="${top - 10}" font-size="10" text-anchor="end" fill="${C.muted}">inside →</text>
      <!-- temperature gradient indicator -->
      <line x1="40" y1="${top + 6}" x2="${xEnd}" y2="${top + 6}" stroke="url(#hatchSteel)" stroke-width="0" />
      <line x1="40" y1="${top - 4}" x2="${xEnd}" y2="${top - 4}" stroke="${C.muted}" stroke-width="0.5" stroke-dasharray="2 3"/>
      <!-- product / R-value callout -->
      <rect x="${xEnd + 14}" y="${top + 30}" width="120" height="60" rx="6" fill="rgba(0,0,0,.4)" stroke="${C.accent}" stroke-width="1"/>
      <text x="${xEnd + 74}" y="${top + 50}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">R = ${R}</text>
      <text x="${xEnd + 74}" y="${top + 68}" font-size="9" text-anchor="middle" fill="${C.muted}">m²·K/W</text>
      <text x="${xEnd + 74}" y="${top + 84}" font-size="9" text-anchor="middle" fill="${C.fill}">${productName}</text>
      <!-- total thickness -->
      <text x="${(40 + xEnd)/2}" y="${bot + 40}" font-size="11" text-anchor="middle" fill="${C.accent}" font-weight="700">total ${(xEnd - 40)} px buildup</text>
    `, W, H);
  }

  // ---------- Isometric 3-D box renderer ----------
  // Draws a length × height × depth rectangular volume in true isometric
  // projection (30° angles), with optional pattern overlay on the front face
  // (for brick courses, tile grid, panel lines, …).
  function drawIsoBox({
    length_mm, height_mm, depth_mm,
    pattern = null,        // 'brick' | 'tile' | 'concrete' | 'wood' | null
    frontLabel = '', topLabel = '', sideLabel = '',
    frontColor = '#c0a070', topColor = '#d8c4a0', sideColor = '#8a7350',
    title = '',
  }) {
    const W = 460, H = 280;
    const a = 30 * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    // Independent per-axis scale so thin walls / long slabs stay readable.
    // Each axis gets a sensible visual share of the canvas, with floors so
    // very small dimensions don't disappear.
    const maxL = length_mm, maxH = height_mm, maxD = depth_mm;
    const Lpx = Math.max(60, Math.min(280, maxL * 0.04));     // 60..280 px
    const Hpx = Math.max(50, Math.min(160, maxH * 0.045));    // 50..160 px
    const Dpx = Math.max(28, Math.min(110, maxD * 0.18));     // 28..110 px (depth always ≥28 so wall thickness is visible)
    const L = Lpx, Hgt = Hpx, D = Dpx;
    // Origin: bottom-front-left corner of the front face
    const ox = 60, oy = H - 30 - D * sin;
    // Front face corners
    const fbl = [ox, oy], fbr = [ox + L * cos, oy - L * sin];
    const ftl = [fbl[0], fbl[1] - Hgt], ftr = [fbr[0], fbr[1] - Hgt];
    // Back-top-right (push back along depth axis)
    const btr = [ftr[0] + D * cos, ftr[1] - D * sin];
    const btl = [ftl[0] + D * cos, ftl[1] - D * sin];
    const bbr = [fbr[0] + D * cos, fbr[1] - D * sin];
    const poly = (pts, fill, stroke = 'rgba(0,0,0,.4)') =>
      `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`;
    // Pattern overlay on the front face
    let patternOverlay = '';
    if (pattern === 'brick') {
      // Stretcher bond — horizontal courses + half-offset perp joints
      const courseH = Math.max(6, Math.min(14, Hgt / 12)); // visual brick course
      const brickW = courseH * 2.5; // ratio matches stock brick-ish
      let lines = '';
      const courses = Math.ceil(Hgt / courseH) + 1;
      for (let i = 0; i <= courses; i++) {
        const t = i / courses;
        const y0 = fbl[1] - Hgt * t, x0 = fbl[0] + 0;
        const y1 = fbr[1] - Hgt * t, x1 = fbr[0];
        lines += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="rgba(0,0,0,.35)" stroke-width="0.6"/>`;
      }
      // Vertical (perp) joints — offset every other row
      const ux = (fbr[0] - fbl[0]) / Hgt * courseH;   // dx per course along slanted edge
      const uy = (fbr[1] - fbl[1]) / Hgt * courseH;
      const cosL = (fbr[0] - fbl[0]) / Math.hypot(fbr[0] - fbl[0], fbr[1] - fbl[1]);
      const sinL = (fbr[1] - fbl[1]) / Math.hypot(fbr[0] - fbl[0], fbr[1] - fbl[1]);
      for (let row = 0; row < courses; row++) {
        const yA = fbl[1] - row * courseH, xA = fbl[0];
        const yB = fbl[1] - (row + 1) * courseH, xB = fbl[0];
        const offset = (row % 2) * brickW / 2;
        const numBricks = Math.ceil(L / brickW) + 1;
        for (let b = 0; b < numBricks; b++) {
          const dist = b * brickW + offset;
          const px = xA + dist * cosL, py = yA + dist * sinL;
          const px2 = xB + dist * cosL, py2 = yB + dist * sinL;
          lines += `<line x1="${px}" y1="${py}" x2="${px2}" y2="${py2}" stroke="rgba(0,0,0,.35)" stroke-width="0.6"/>`;
        }
      }
      patternOverlay = lines;
    } else if (pattern === 'tile') {
      // Square tile grid
      const tileSize = Math.max(8, Math.min(20, Hgt / 8));
      let g = '';
      for (let y = 0; y <= Hgt + tileSize; y += tileSize) {
        const t = y / Hgt;
        g += `<line x1="${fbl[0]}" y1="${fbl[1] - y}" x2="${fbr[0]}" y2="${fbr[1] - y}" stroke="rgba(0,0,0,.3)" stroke-width="0.5"/>`;
      }
      const cosL = (fbr[0] - fbl[0]) / L, sinL = (fbr[1] - fbl[1]) / L;
      for (let x = 0; x <= L + tileSize; x += tileSize) {
        g += `<line x1="${fbl[0] + x*cosL}" y1="${fbl[1] + x*sinL}" x2="${ftl[0] + x*cosL}" y2="${ftl[1] + x*sinL}" stroke="rgba(0,0,0,.3)" stroke-width="0.5"/>`;
      }
      patternOverlay = g;
    }
    // Dimension lines
    const dim = (x1, y1, x2, y2, text, color = C.accent) => `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>
      <line x1="${x1-3}" y1="${y1-3}" x2="${x1+3}" y2="${y1+3}" stroke="${color}"/>
      <line x1="${x2-3}" y1="${y2-3}" x2="${x2+3}" y2="${y2+3}" stroke="${color}"/>
      <text x="${(x1+x2)/2}" y="${(y1+y2)/2 - 4}" font-size="10" text-anchor="middle" fill="${color}" font-weight="600">${text}</text>`;
    // Title — wrapped to 2 lines if long, never clipped
    const titleSvg = title ? `
      <foreignObject x="0" y="2" width="${W}" height="32">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font:11px system-ui,sans-serif;color:${C.muted};text-align:center;line-height:1.3;padding:0 8px">${title}</div>
      </foreignObject>` : '';
    return svgWrap(`
      ${titleSvg}
      ${poly([fbl, ftl, btl, [bbr[0], bbr[1] - Hgt]], topColor)}
      <polygon points="${[fbl, ftl, btl, [bbr[0], bbr[1] - Hgt]].map(p=>p.join(',')).join(' ')}" fill="url(#gradTop)"/>
      ${poly([fbr, ftr, [bbr[0], bbr[1] - Hgt], bbr], sideColor)}
      ${poly([fbl, fbr, ftr, ftl], frontColor)}
      <polygon points="${[fbl, fbr, ftr, ftl].map(p=>p.join(',')).join(' ')}" fill="url(#gradFront)"/>
      ${patternOverlay}
      ${frontLabel ? `<text x="${(fbl[0]+ftr[0])/2}" y="${(fbl[1]+ftr[1])/2}" font-size="11" text-anchor="middle" fill="rgba(0,0,0,.7)" font-weight="700">${frontLabel}</text>` : ''}
      ${dim(fbl[0], fbl[1] + 18, fbr[0], fbr[1] + 18, length_mm + ' mm')}
      ${dim(fbr[0] + 14, ftr[1], fbr[0] + 14, fbr[1], height_mm + ' mm')}
      ${dim(bbr[0] - 2, bbr[1] - Hgt - 18, fbr[0] + 6, ftr[1] - 18, depth_mm + ' mm', C.warn)}
    `, W, H);
  }

  function stairsView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Total rise (mm) — floor to floor', '<input id="stR" type="number" step="10" min="0" value="2700">')}
        ${field('Riser height target (mm)', '<input id="stRiser" type="number" step="5" min="100" max="220" value="175">')}
        ${field('Going (tread depth, mm)', '<input id="stGoing" type="number" step="5" min="200" max="350" value="250">')}
      </div>
      <div id="stDia"></div>
      <div id="stOut" class="calc-out"></div>`;
    const compute = () => {
      const totalRise_mm = +body.querySelector('#stR').value;
      const riser_mm = +body.querySelector('#stRiser').value;
      const going_mm = +body.querySelector('#stGoing').value;
      const r = calcStairs({ totalRise_mm, riser_mm, going_mm });
      if (r.error) return body.querySelector('#stOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#stDia').innerHTML = drawStairs({ rise_mm: r.actualRiser_mm, going_mm, risers: r.risers });
      body.querySelector('#stOut').innerHTML = `
        <div class="calc-row hilite"><span>Risers / treads (going count)</span><strong>${r.risers} / ${r.goings}</strong></div>
        <div class="calc-row"><span>Actual riser (recalculated)</span><strong>${r.actualRiser_mm} mm</strong></div>
        <div class="calc-row"><span>Total run (horizontal)</span><strong>${r.totalRun_mm} mm</strong></div>
        <div class="calc-row"><span>Pitch angle</span><strong>${r.angle_deg}°</strong></div>
        <div class="calc-row"><span>2R + G ergonomics</span><strong>${r.ergonomic_2RG} mm ${r.ergonomicOK?'✅':'⚠️ outside 500–700'}</strong></div>
        <div class="calc-row"><span>Part M compliance</span><strong>${r.compliesPartM?'✅ riser ≤ 200, going ≥ 250':'⚠️ check riser / going'}</strong></div>
        <div class="meta cite">Source: SANS 10400-M domestic stair geometry</div>
        <div class="actions">${boqButton(`Stairs ${r.risers} risers`, 'Stairs', { totalRise_mm, riser_mm, going_mm }, { risers: r.risers, actualRiser_mm: r.actualRiser_mm, totalRun_mm: r.totalRun_mm, angle_deg: r.angle_deg })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function drywallView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Wall area (m²)', '<input id="dwW" type="number" step="1" min="0" value="60">')}
        ${field('Ceiling area (m²) — optional', '<input id="dwC" type="number" step="1" min="0" value="20">')}
        ${field('Board size', '<select id="dwS"><option value="1.2x2.4" selected>1200 × 2400 mm (2.88 m²)</option><option value="1.2x3.0">1200 × 3000 mm (3.6 m²)</option><option value="0.9x2.4">900 × 2400 mm (2.16 m²)</option></select>')}
        ${field('Waste %', '<input id="dwWa" type="number" step="1" min="0" value="10">')}
      </div>
      <div id="dwDia"></div>
      <div id="dwOut" class="calc-out"></div>`;
    const compute = () => {
      const wallArea_m2 = +body.querySelector('#dwW').value;
      const ceilingArea_m2 = +body.querySelector('#dwC').value;
      const boardSize = body.querySelector('#dwS').value;
      const r = calcDrywall({ wallArea_m2, ceilingArea_m2, boardSize, wastePct: +body.querySelector('#dwWa').value });
      const sideM = Math.sqrt(r.totalArea || 1);
      body.querySelector('#dwDia').innerHTML = drawIsoBox({
        length_mm: sideM*1000, height_mm: sideM*1000, depth_mm: 13,
        title: `Drywall ≈ ${r.totalArea} m² · ${r.boards} boards`,
        frontColor: '#e8e0d0', topColor: '#f4ecdc', sideColor: '#a89868',
      });
      body.querySelector('#dwOut').innerHTML = `
        <div class="calc-row"><span>Total area</span><strong>${r.totalArea} m²</strong></div>
        <div class="calc-row hilite"><span>Boards needed</span><strong>${r.boards}</strong></div>
        <div class="calc-row"><span>Drywall screws (≈ 22/board)</span><strong>${r.screws.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Joint compound</span><strong>${r.compound_kg} kg</strong></div>
        <div class="calc-row"><span>Joint tape</span><strong>${r.tape_m} m</strong></div>
        <div class="meta cite">Source: standard SA gypsum-board sizes (1.2×2.4 m typical) · ~22 screws/board</div>
        <div class="actions">${boqButton(`Drywall ${r.totalArea} m²`, 'Drywall', { wallArea_m2, ceilingArea_m2, boardSize }, { boards: r.boards, screws: r.screws, compound_kg: r.compound_kg, tape_m: r.tape_m })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function insulView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('SANS 10400-XA climate zone (1–6)', '<select id="inZ"><option value="1">1 — Cape coast</option><option value="2">2 — Coastal subtropical</option><option value="3" selected>3 — Highveld + Pretoria</option><option value="4">4 — Hot interior</option><option value="5">5 — Cold interior (Lesotho border)</option><option value="6">6 — Arid</option></select>')}
        ${field('Element', '<select id="inE"><option value="roof" selected>Roof</option><option value="ceiling">Ceiling</option><option value="wall_ext">External wall</option><option value="floor">Floor</option></select>')}
      </div>
      <div id="inDia"></div>
      <div id="inOut" class="calc-out"></div>`;
    const compute = () => {
      const zone = +body.querySelector('#inZ').value;
      const element = body.querySelector('#inE').value;
      const r = calcInsulation({ zone, element });
      if (r.error) return body.querySelector('#inOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      const top = r.products[0];
      body.querySelector('#inDia').innerHTML = drawInsulation({ thickness_mm: top.thickness_mm, R: r.targetR, productName: top.name });
      body.querySelector('#inOut').innerHTML = `
        <div class="calc-row hilite"><span>Target R-value</span><strong>${r.targetR} m²K/W</strong></div>
        <div class="meta">Required insulation thickness for each common product:</div>
        ${r.products.map(p => `<div class="calc-row"><span>${escapeHtml(p.name)}</span><strong>${p.thickness_mm} mm</strong></div>`).join('')}
        <div class="meta cite">Source: SANS 10400-XA climate-zone R-value targets · product λ-values from SA manufacturer data sheets</div>
        <div class="actions">${boqButton(`Insulation Zone ${zone} ${element} R=${r.targetR}`, 'Insulation', { zone, element }, { targetR: r.targetR, top: top.name + ' ' + top.thickness_mm + ' mm' })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('select').forEach(el => el.addEventListener('change', compute));
    compute();
  }

  function pipeView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Pipe diameter (mm)', '<input id="piD" type="number" step="10" min="50" value="100">')}
        ${field('Slope (%) — e.g. 1.0 for 1:100', '<input id="piS" type="number" step="0.1" min="0.1" value="1.67">')}
        ${field('Manning n (smooth PVC ≈ 0.011, concrete ≈ 0.013)', '<input id="piN" type="number" step="0.001" min="0.005" value="0.013">')}
      </div>
      <div id="piDia"></div>
      <div id="piOut" class="calc-out"></div>`;
    const compute = () => {
      const diameter_mm = +body.querySelector('#piD').value;
      const slope_pct = +body.querySelector('#piS').value;
      const n = +body.querySelector('#piN').value;
      const r = calcPipeFlow({ diameter_mm, slope_pct, n });
      if (r.error) return body.querySelector('#piOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#piDia').innerHTML = drawPipe({ diameter_mm, slope_pct, velocity_ms: r.velocity_ms, full: false });
      body.querySelector('#piOut').innerHTML = `
        <div class="calc-row"><span>Slope as 1:N</span><strong>1 : ${r.slope_one_in}</strong></div>
        <div class="calc-row"><span>Pipe area (full bore)</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row"><span>Velocity</span><strong>${r.velocity_ms} m/s</strong></div>
        <div class="calc-row hilite"><span>Full-bore flow capacity</span><strong>${r.flow_Lps} L/s</strong></div>
        <div class="callout">${escapeHtml(r.capacity_note)}</div>
        <div class="meta cite">Source: Manning's equation · SANS 10400-P drainage gradients (1:60 for 100 mm Ø foul)</div>
        <div class="actions">${boqButton(`Pipe Ø${diameter_mm} mm @ ${slope_pct}%`, 'Pipe flow', { diameter_mm, slope_pct, n }, { velocity_ms: r.velocity_ms, flow_Lps: r.flow_Lps })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function columnView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Shape', '<select id="coS"><option value="square" selected>Square / rectangular</option><option value="circle">Round / circular</option></select>')}
        ${field('Width (m) — square only', '<input id="coW" type="number" step="0.05" min="0" value="0.3">')}
        ${field('Depth (m) — square only', '<input id="coD" type="number" step="0.05" min="0" value="0.3">')}
        ${field('Diameter (m) — round only', '<input id="coDia" type="number" step="0.05" min="0" value="0.3">')}
        ${field('Height (m)', '<input id="coH" type="number" step="0.1" min="0" value="3">')}
        ${field('Count', '<input id="coN" type="number" step="1" min="1" value="4">')}
        ${field('Concrete grade', '<select id="coM"><option value="20">20 MPa</option><option value="25" selected>25 MPa</option><option value="30">30 MPa</option><option value="40">40 MPa</option></select>')}
      </div>
      <div id="coDia"></div>
      <div id="coOut" class="calc-out"></div>`;
    const compute = () => {
      const shape = body.querySelector('#coS').value;
      const width_m = +body.querySelector('#coW').value;
      const depth_m = +body.querySelector('#coD').value;
      const diameter_m = +body.querySelector('#coDia').value;
      const height_m = +body.querySelector('#coH').value;
      const count = +body.querySelector('#coN').value;
      const r = calcColumn({ shape, width_m, depth_m, diameter_m, height_m, count, mpa: body.querySelector('#coM').value });
      if (r.error) return body.querySelector('#coOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // 3D iso of one column (square or round)
      const w_mm = (shape === 'circle' ? diameter_m : width_m) * 1000;
      const d_mm = (shape === 'circle' ? diameter_m : depth_m) * 1000;
      const titlePart = shape === 'circle' ? `Ø ${(diameter_m*1000)|0} mm` : `${(width_m*1000)|0} × ${(depth_m*1000)|0} mm`;
      body.querySelector('#coDia').innerHTML = drawIsoBox({
        length_mm: w_mm, height_mm: height_m * 1000, depth_mm: d_mm,
        title: `${count} × column · ${titlePart} × ${(height_m*1000)|0} mm tall · total ${r.totalVolume_m3} m³`,
        frontColor: '#a8a8a4', topColor: '#c4c4c0', sideColor: '#7a7a76',
      });
      body.querySelector('#coOut').innerHTML = `
        <div class="calc-row"><span>Volume per column</span><strong>${r.eachVolume_m3} m³</strong></div>
        <div class="calc-row hilite"><span>Total volume (incl. 5% waste)</span><strong>${r.totalVolume_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="calc-row"><span>Stone (19 mm)</span><strong>${r.stone_m3} m³</strong></div>
        <div class="calc-row"><span>Water (target)</span><strong>${r.water_L} L</strong></div>
        <div class="meta cite">Source: SANS 10100 column volume × concrete grade mix</div>
        <div class="actions">${boqButton(`${count} × column · ${titlePart} × ${(height_m*1000)|0} mm`, 'Columns',
          { shape, width_m, depth_m, diameter_m, height_m, count }, { totalVolume_m3: r.totalVolume_m3, cement_bags: r.cement_bags, sand_m3: r.sand_m3, stone_m3: r.stone_m3 })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function wallpaperView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Wall width (m)', '<input id="wpW" type="number" step="0.1" min="0" value="6">')}
        ${field('Wall height (m)', '<input id="wpH" type="number" step="0.1" min="0" value="2.7">')}
        ${field('Roll width (mm)', '<input id="wpRW" type="number" step="10" min="100" value="530">')}
        ${field('Roll length (m)', '<input id="wpRL" type="number" step="0.5" min="1" value="10">')}
        ${field('Pattern repeat (mm) — 0 = plain', '<input id="wpRep" type="number" step="10" min="0" value="0">')}
        ${field('Waste %', '<input id="wpWa" type="number" step="1" min="0" value="10">')}
      </div>
      <div id="wpDia"></div>
      <div id="wpOut" class="calc-out"></div>`;
    const compute = () => {
      const wall_w_m = +body.querySelector('#wpW').value;
      const wall_h_m = +body.querySelector('#wpH').value;
      const roll_w_mm = +body.querySelector('#wpRW').value;
      const r = calcWallpaper({
        wall_w_m, wall_h_m, roll_w_mm,
        roll_l_m: +body.querySelector('#wpRL').value,
        pattern_repeat_mm: +body.querySelector('#wpRep').value,
        wastePct: +body.querySelector('#wpWa').value,
      });
      if (r.error) return body.querySelector('#wpOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // Visual: wall with vertical strips
      const W=460, H=200;
      const wpx = Math.min(380, wall_w_m * 60), hpx = Math.min(140, wall_h_m * 50);
      const strips = r.stripsNeeded;
      const stripPx = wpx / strips;
      let bars = '';
      for (let i = 0; i < strips; i++) {
        const x = (W - wpx)/2 + i * stripPx;
        const fill = i % 2 === 0 ? '#d97a99' : '#e0a0b8';
        bars += `<rect x="${x}" y="${(H-hpx)/2}" width="${Math.max(2, stripPx-1)}" height="${hpx}" fill="${fill}" stroke="rgba(0,0,0,.2)"/>`;
      }
      body.querySelector('#wpDia').innerHTML = svgWrap(`
        <rect x="${(W-wpx)/2}" y="${(H-hpx)/2}" width="${wpx}" height="${hpx}" fill="${C.fill}"/>
        ${bars}
        <text x="${W/2}" y="${(H-hpx)/2 - 6}" font-size="11" text-anchor="middle" fill="${C.muted}">${wall_w_m} × ${wall_h_m} m wall · ${strips} strips · ${r.rolls} rolls</text>
      `, W, H);
      body.querySelector('#wpOut').innerHTML = `
        <div class="calc-row"><span>Strips per roll</span><strong>${r.stripsPerRoll}</strong></div>
        <div class="calc-row"><span>Strips needed</span><strong>${r.stripsNeeded}</strong></div>
        <div class="calc-row hilite"><span>Rolls to buy</span><strong>${r.rolls}</strong></div>
        <div class="meta cite">Source: standard wallpaper roll (530 mm × 10 m typical)</div>
        <div class="actions">${boqButton(`Wallpaper ${wall_w_m}×${wall_h_m} m`, 'Wallpaper', { wall_w_m, wall_h_m, roll_w_mm }, { rolls: r.rolls, strips: r.stripsNeeded })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function framingView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Wall length (m)', '<input id="fmL" type="number" step="0.1" min="0" value="6">')}
        ${field('Wall height (m)', '<input id="fmH" type="number" step="0.1" min="0" value="2.7">')}
        ${field('Stud centres (mm)', '<select id="fmC"><option value="400">400</option><option value="600" selected>600</option></select>')}
        ${field('Plate layers (top + bottom + double-top)', '<select id="fmP"><option value="2">2 (single top + bottom)</option><option value="3" selected>3 (double-top + bottom)</option></select>')}
      </div>
      <div id="fmDia"></div>
      <div id="fmOut" class="calc-out"></div>`;
    const compute = () => {
      const wall_length_m = +body.querySelector('#fmL').value;
      const wall_height_m = +body.querySelector('#fmH').value;
      const stud_centres_mm = +body.querySelector('#fmC').value;
      const r = calcFraming({ wall_length_m, wall_height_m, stud_centres_mm, plate_layers: +body.querySelector('#fmP').value });
      if (r.error) return body.querySelector('#fmOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // Visual — front-elevation studs
      const W = 460, H = 200;
      const wpx = Math.min(420, wall_length_m * 50), hpx = Math.min(160, wall_height_m * 50);
      const x0 = (W - wpx)/2, y0 = (H - hpx)/2;
      let studs = '';
      const studGap = wpx / (r.studs - 1);
      for (let i = 0; i < r.studs; i++) studs += `<line x1="${x0 + i*studGap}" y1="${y0}" x2="${x0 + i*studGap}" y2="${y0 + hpx}" stroke="#9a7050" stroke-width="3"/>`;
      body.querySelector('#fmDia').innerHTML = svgWrap(`
        <rect x="${x0}" y="${y0}" width="${wpx}" height="6" fill="#7a5238"/>
        <rect x="${x0}" y="${y0 + hpx - 6}" width="${wpx}" height="6" fill="#7a5238"/>
        ${studs}
        <text x="${W/2}" y="${y0 - 6}" font-size="11" text-anchor="middle" fill="${C.muted}">${r.studs} studs @ ${stud_centres_mm} mm centres · ${r.total_m} m total</text>
      `, W, H);
      body.querySelector('#fmOut').innerHTML = `
        <div class="calc-row hilite"><span>Studs</span><strong>${r.studs} × ${r.stud_length_m} m</strong></div>
        <div class="calc-row"><span>Plates (linear m)</span><strong>${r.plates_m} m</strong></div>
        <div class="calc-row"><span>Total framing timber</span><strong>${r.total_m} m</strong></div>
        <div class="meta cite">Source: SANS 10400-K timber-frame walls · stud centres typically 400 / 600 mm</div>
        <div class="actions">${boqButton(`Framing ${wall_length_m}×${wall_height_m} m`, 'Framing', { wall_length_m, wall_height_m, stud_centres_mm }, { studs: r.studs, plates_m: r.plates_m, total_m: r.total_m })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function deckView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Deck width (m)', '<input id="dkW" type="number" step="0.1" min="0" value="3">')}
        ${field('Deck length (m)', '<input id="dkL" type="number" step="0.1" min="0" value="5">')}
        ${field('Joist centres (mm)', '<select id="dkC"><option value="300">300</option><option value="400" selected>400</option><option value="500">500</option></select>')}
        ${field('Decking-board width (mm)', '<input id="dkB" type="number" step="5" min="80" value="140">')}
        ${field('Board gap (mm)', '<input id="dkG" type="number" step="1" min="0" value="5">')}
      </div>
      <div id="dkDia"></div>
      <div id="dkOut" class="calc-out"></div>`;
    const compute = () => {
      const deck_w_m = +body.querySelector('#dkW').value;
      const deck_l_m = +body.querySelector('#dkL').value;
      const joist_centres_mm = +body.querySelector('#dkC').value;
      const board_w_mm = +body.querySelector('#dkB').value;
      const r = calcDeck({ deck_w_m, deck_l_m, joist_centres_mm, board_w_mm, board_gap_mm: +body.querySelector('#dkG').value });
      if (r.error) return body.querySelector('#dkOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      // 3D iso deck
      body.querySelector('#dkDia').innerHTML = drawIsoBox({
        length_mm: deck_l_m * 1000, height_mm: 60, depth_mm: deck_w_m * 1000,
        pattern: null,
        title: `${deck_w_m} × ${deck_l_m} m deck · ${r.decking_boards} boards across`,
        frontColor: '#a07050', topColor: '#c89870', sideColor: '#704830',
      });
      body.querySelector('#dkOut').innerHTML = `
        <div class="calc-row"><span>Deck area</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row"><span>Joists</span><strong>${r.joists} (≈ ${r.joist_total_m} m total)</strong></div>
        <div class="calc-row hilite"><span>Decking boards across</span><strong>${r.decking_boards}</strong></div>
        <div class="calc-row"><span>Total decking length</span><strong>${r.decking_total_m} m</strong></div>
        <div class="meta cite">Source: SANS 10400-J floor loadings + standard deck-board layout</div>
        <div class="actions">${boqButton(`Deck ${deck_w_m}×${deck_l_m} m`, 'Deck', { deck_w_m, deck_l_m, joist_centres_mm, board_w_mm }, { joists: r.joists, joist_total_m: r.joist_total_m, decking_boards: r.decking_boards, decking_total_m: r.decking_total_m })}</div>`;
      wireBoqButtons(body);
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  // ---------- BoQ view ----------
  function boqView(escapeHtml, container) {
    function aggregate(items) {
      const totals = {};
      for (const it of items) {
        const o = it.outputs || {};
        for (const k of Object.keys(o)) {
          if (typeof o[k] === 'number') totals[k] = (totals[k] || 0) + o[k];
        }
      }
      return totals;
    }
    function r() {
      const s = loadBoQ();
      const projects = Object.entries(s.projects);
      const cur = s.projects[s.current];
      const totals = aggregate(cur.items);
      container.innerHTML = `
        <div class="hero" style="background:linear-gradient(135deg,#3a8a5a,#6aaa7a);color:#fff">
          <h2>📋 Bill of Quantities</h2>
          <p>${cur.items.length} item${cur.items.length===1?'':'s'} in <strong>${escapeHtml(cur.name)}</strong></p>
        </div>

        ${cur.items.length === 0 ? `
        <div class="callout" style="background:rgba(58,138,90,.10);border-color:rgba(58,138,90,.45)">
          <strong>How does the BoQ work?</strong>
          <ol style="margin:6px 0 0 18px;padding:0;font-size:13px">
            <li>Pick a calculator (Bricks, Concrete, Rebar…) and enter your numbers.</li>
            <li>At the bottom of the result, tap <strong>+ Add to BoQ</strong>.</li>
            <li>Come back here. Items list at the top, auto-totals below.</li>
            <li>Run multiple projects — the dropdown switches between them. <strong>+ New</strong> creates a project, <strong>Rename</strong> renames the current one.</li>
            <li>Tap <strong>📄 Export BoQ as PDF</strong> for a printable bill.</li>
          </ol>
        </div>` : ''}

        <div class="calc-form" style="grid-template-columns:1fr auto auto auto">
          <label class="calc-field"><span>Project</span>
            <select id="boqProj">${projects.map(([id,p]) => `<option value="${escapeHtml(id)}" ${id===s.current?'selected':''}>${escapeHtml(p.name)} (${p.items.length})</option>`).join('')}</select>
          </label>
          <button class="btn secondary" id="boqRename">Rename</button>
          <button class="btn secondary" id="boqNew">+ New</button>
          <button class="btn secondary" id="boqDel">Delete</button>
        </div>

        ${cur.items.length === 0 ? '<div class="empty">No items yet — your saved calculations will appear here.</div>' : `
        <div class="boq-list">
          ${cur.items.map(it => `
            <div class="boq-item" data-id="${it.id}">
              <div class="boq-meta">
                <strong>${escapeHtml(it.label)}</strong>
                <span class="boq-cat">${escapeHtml(it.calc)}</span>
              </div>
              <div class="boq-out">${Object.entries(it.outputs||{}).slice(0,4).map(([k,v]) => `<span><em>${escapeHtml(k)}</em> ${typeof v==='number'?(+v).toLocaleString():escapeHtml(String(v))}</span>`).join('')}</div>
              <button class="btn-link boq-rm" data-id="${it.id}">remove</button>
            </div>`).join('')}
        </div>

        <div class="section-title">Totals (sum of numeric outputs)</div>
        <div class="calc-out">
          ${Object.entries(totals).map(([k,v]) => `<div class="calc-row"><span>${escapeHtml(k)}</span><strong>${(+v).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></div>`).join('') || '<div class="empty">No numeric outputs yet.</div>'}
        </div>

        <div class="actions"><button class="btn primary" id="boqPdf">📄 Export BoQ as PDF</button>
        <button class="btn secondary" id="boqClear">🧹 Clear all items</button></div>
        `}
      `;
      container.querySelector('#boqProj')?.addEventListener('change', e => {
        const s2 = loadBoQ(); s2.current = e.target.value; saveBoQ(s2); r();
      });
      container.querySelector('#boqNew')?.addEventListener('click', () => {
        const name = prompt('Name the new project (e.g. "12 Acacia Lane"):');
        if (!name) return;
        const s2 = loadBoQ();
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,32) + '-' + Date.now().toString(36).slice(-3);
        s2.projects[id] = { name, items: [] }; s2.current = id; saveBoQ(s2); r();
      });
      container.querySelector('#boqRename')?.addEventListener('click', () => {
        const s2 = loadBoQ();
        const name = prompt('Rename project:', s2.projects[s2.current].name);
        if (!name) return;
        s2.projects[s2.current].name = name; saveBoQ(s2); r();
      });
      container.querySelector('#boqDel')?.addEventListener('click', () => {
        const s2 = loadBoQ();
        if (Object.keys(s2.projects).length <= 1) { alert('Cannot delete the only project.'); return; }
        if (!confirm('Delete this project + all its items?')) return;
        delete s2.projects[s2.current];
        s2.current = Object.keys(s2.projects)[0];
        saveBoQ(s2); r();
      });
      container.querySelector('#boqClear')?.addEventListener('click', () => {
        if (!confirm('Clear all items in this project?')) return;
        const s2 = loadBoQ(); s2.projects[s2.current].items = []; saveBoQ(s2); r();
      });
      container.querySelectorAll('.boq-rm').forEach(b => b.addEventListener('click', () => {
        const s2 = loadBoQ();
        s2.projects[s2.current].items = s2.projects[s2.current].items.filter(x => String(x.id) !== b.dataset.id);
        saveBoQ(s2); r();
      }));
      container.querySelector('#boqPdf')?.addEventListener('click', () => {
        const s2 = loadBoQ(); const cur2 = s2.projects[s2.current];
        const tot = aggregate(cur2.items);
        const w = window.open('', '_blank', 'width=820,height=900');
        if (!w) return alert('Allow pop-ups to export.');
        const escP = (x) => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const tableRows = cur2.items.map((it,i) => `<tr><td>${i+1}</td><td>${escP(it.calc)}</td><td>${escP(it.label)}</td><td>${Object.entries(it.outputs||{}).map(([k,v])=>`${escP(k)}: <strong>${escP(typeof v==='number'?(+v).toLocaleString():v)}</strong>`).join('<br>')}</td></tr>`).join('');
        const totalRows = Object.entries(tot).map(([k,v]) => `<tr><td>${escP(k)}</td><td><strong>${(+v).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></td></tr>`).join('');
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>BoQ — ${escP(cur2.name)}</title>
          <style>@page{size:A4;margin:18mm 16mm}body{font:11pt/1.4 system-ui,sans-serif;color:#111;max-width:720px;margin:0 auto}
          h1{color:#0b6e3f;font-size:18pt;margin:0 0 8pt}h2{font-size:13pt;border-bottom:1.5pt solid #0b6e3f;padding-bottom:3pt;color:#0b6e3f}
          table{width:100%;border-collapse:collapse;font-size:10pt;margin:6pt 0 14pt}th,td{border:0.4pt solid #888;padding:4pt;text-align:left;vertical-align:top}
          th{background:#eef}
          .footer{margin-top:24pt;font-size:8pt;color:#777;text-align:center}</style></head><body>
          <h1>Bill of Quantities — ${escP(cur2.name)}</h1>
          <p>Generated ${new Date().toLocaleString('en-ZA')} · ${cur2.items.length} item${cur2.items.length===1?'':'s'}</p>
          <h2>Items</h2>
          <table><thead><tr><th>#</th><th>Tool</th><th>Description</th><th>Outputs</th></tr></thead><tbody>${tableRows || '<tr><td colspan=4>No items</td></tr>'}</tbody></table>
          <h2>Totals (sum of numeric outputs across items)</h2>
          <table><thead><tr><th>Quantity</th><th>Total</th></tr></thead><tbody>${totalRows || '<tr><td colspan=2>—</td></tr>'}</tbody></table>
          <div class="footer">Generated by NHBRC Trainer · Reference document — verify with your QS / engineer before procurement.</div>
          <div style="text-align:center;margin-top:20px;font-family:system-ui" class="no-print"><button onclick="window.print()" style="padding:10px 18px;font-size:14px;background:#0b6e3f;color:#fff;border:0;border-radius:6px;cursor:pointer">Print / Save as PDF</button></div>
          <style>@media print{.no-print{display:none}}</style></body></html>`);
        w.document.close();
      });
    }
    r();
  }

  return {
    view, boqView,
    calcBrickMortar, calcPlaster, calcConcrete, recommendedFootingWidth,
    calcRebar, calcTiling, calcPaint, calcExcavation, calcRoofing,
    calcBeam, calcCubeTest, assessSiteClass, convertUnit,
    calcStairs, calcDrywall, calcInsulation, calcPipeFlow,
    calcColumn, calcWallpaper, calcFraming, calcDeck,
    loadBoQ, saveBoQ, addToBoQ,
  };
})();
