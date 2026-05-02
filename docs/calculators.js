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

  // ---------- New tool views ----------

  function stairsView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('Total rise (mm) — floor to floor', '<input id="stR" type="number" step="10" min="0" value="2700">')}
        ${field('Riser height target (mm)', '<input id="stRiser" type="number" step="5" min="100" max="220" value="175">')}
        ${field('Going (tread depth, mm)', '<input id="stGoing" type="number" step="5" min="200" max="350" value="250">')}
      </div><div id="stOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcStairs({
        totalRise_mm: +body.querySelector('#stR').value,
        riser_mm: +body.querySelector('#stRiser').value,
        going_mm: +body.querySelector('#stGoing').value,
      });
      if (r.error) return body.querySelector('#stOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#stOut').innerHTML = `
        <div class="calc-row hilite"><span>Risers / treads (going count)</span><strong>${r.risers} / ${r.goings}</strong></div>
        <div class="calc-row"><span>Actual riser (recalculated)</span><strong>${r.actualRiser_mm} mm</strong></div>
        <div class="calc-row"><span>Total run (horizontal)</span><strong>${r.totalRun_mm} mm</strong></div>
        <div class="calc-row"><span>Pitch angle</span><strong>${r.angle_deg}°</strong></div>
        <div class="calc-row"><span>2R + G ergonomics</span><strong>${r.ergonomic_2RG} mm ${r.ergonomicOK?'✅':'⚠️ outside 500–700'}</strong></div>
        <div class="calc-row"><span>Part M compliance</span><strong>${r.compliesPartM?'✅ riser ≤ 200, going ≥ 250':'⚠️ check riser / going'}</strong></div>`;
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
      </div><div id="dwOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcDrywall({
        wallArea_m2: +body.querySelector('#dwW').value,
        ceilingArea_m2: +body.querySelector('#dwC').value,
        boardSize: body.querySelector('#dwS').value,
        wastePct: +body.querySelector('#dwWa').value,
      });
      body.querySelector('#dwOut').innerHTML = `
        <div class="calc-row"><span>Total area</span><strong>${r.totalArea} m²</strong></div>
        <div class="calc-row hilite"><span>Boards needed</span><strong>${r.boards}</strong></div>
        <div class="calc-row"><span>Drywall screws (≈ 22/board)</span><strong>${r.screws.toLocaleString()}</strong></div>
        <div class="calc-row"><span>Joint compound</span><strong>${r.compound_kg} kg</strong></div>
        <div class="calc-row"><span>Joint tape</span><strong>${r.tape_m} m</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function insulView(escapeHtml, body) {
    body.innerHTML = `
      <div class="calc-form">
        ${field('SANS 10400-XA climate zone (1–6)', '<select id="inZ"><option value="1">1 — Cape coast</option><option value="2">2 — Coastal subtropical</option><option value="3" selected>3 — Highveld + Pretoria</option><option value="4">4 — Hot interior</option><option value="5">5 — Cold interior (Lesotho border)</option><option value="6">6 — Arid</option></select>')}
        ${field('Element', '<select id="inE"><option value="roof" selected>Roof</option><option value="ceiling">Ceiling</option><option value="wall_ext">External wall</option><option value="floor">Floor</option></select>')}
      </div><div id="inOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcInsulation({ zone: +body.querySelector('#inZ').value, element: body.querySelector('#inE').value });
      if (r.error) return body.querySelector('#inOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#inOut').innerHTML = `
        <div class="calc-row hilite"><span>Target R-value</span><strong>${r.targetR} m²K/W</strong></div>
        <div class="meta">Required insulation thickness for each common product:</div>
        ${r.products.map(p => `<div class="calc-row"><span>${escapeHtml(p.name)}</span><strong>${p.thickness_mm} mm</strong></div>`).join('')}`;
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
      </div><div id="piOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcPipeFlow({
        diameter_mm: +body.querySelector('#piD').value,
        slope_pct: +body.querySelector('#piS').value,
        n: +body.querySelector('#piN').value,
      });
      if (r.error) return body.querySelector('#piOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#piOut').innerHTML = `
        <div class="calc-row"><span>Slope as 1:N</span><strong>1 : ${r.slope_one_in}</strong></div>
        <div class="calc-row"><span>Pipe area (full bore)</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row"><span>Velocity</span><strong>${r.velocity_ms} m/s</strong></div>
        <div class="calc-row hilite"><span>Full-bore flow capacity</span><strong>${r.flow_Lps} L/s</strong></div>
        <div class="callout">${escapeHtml(r.capacity_note)}</div>
        <div class="meta">Manning's equation, full-bore. Real drains run partially full — capacity at 0.6–0.7 depth ≈ shown × 0.85.</div>`;
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
      </div><div id="coOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcColumn({
        shape: body.querySelector('#coS').value,
        width_m: +body.querySelector('#coW').value,
        depth_m: +body.querySelector('#coD').value,
        diameter_m: +body.querySelector('#coDia').value,
        height_m: +body.querySelector('#coH').value,
        count: +body.querySelector('#coN').value,
        mpa: body.querySelector('#coM').value,
      });
      if (r.error) return body.querySelector('#coOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#coOut').innerHTML = `
        <div class="calc-row"><span>Volume per column</span><strong>${r.eachVolume_m3} m³</strong></div>
        <div class="calc-row hilite"><span>Total volume (incl. 5% waste)</span><strong>${r.totalVolume_m3} m³</strong></div>
        <div class="calc-row"><span>Cement</span><strong>${r.cement_bags} × 50 kg bags</strong></div>
        <div class="calc-row"><span>Sand</span><strong>${r.sand_m3} m³</strong></div>
        <div class="calc-row"><span>Stone (19 mm)</span><strong>${r.stone_m3} m³</strong></div>
        <div class="calc-row"><span>Water (target)</span><strong>${r.water_L} L</strong></div>`;
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
      </div><div id="wpOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcWallpaper({
        wall_w_m: +body.querySelector('#wpW').value,
        wall_h_m: +body.querySelector('#wpH').value,
        roll_w_mm: +body.querySelector('#wpRW').value,
        roll_l_m: +body.querySelector('#wpRL').value,
        pattern_repeat_mm: +body.querySelector('#wpRep').value,
        wastePct: +body.querySelector('#wpWa').value,
      });
      if (r.error) return body.querySelector('#wpOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#wpOut').innerHTML = `
        <div class="calc-row"><span>Strips per roll</span><strong>${r.stripsPerRoll}</strong></div>
        <div class="calc-row"><span>Strips needed</span><strong>${r.stripsNeeded}</strong></div>
        <div class="calc-row hilite"><span>Rolls to buy</span><strong>${r.rolls}</strong></div>`;
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
      </div><div id="fmOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcFraming({
        wall_length_m: +body.querySelector('#fmL').value,
        wall_height_m: +body.querySelector('#fmH').value,
        stud_centres_mm: +body.querySelector('#fmC').value,
        plate_layers: +body.querySelector('#fmP').value,
      });
      if (r.error) return body.querySelector('#fmOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#fmOut').innerHTML = `
        <div class="calc-row hilite"><span>Studs</span><strong>${r.studs} × ${r.stud_length_m} m</strong></div>
        <div class="calc-row"><span>Plates (linear m)</span><strong>${r.plates_m} m</strong></div>
        <div class="calc-row"><span>Total framing timber</span><strong>${r.total_m} m</strong></div>`;
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
      </div><div id="dkOut" class="calc-out"></div>`;
    const compute = () => {
      const r = calcDeck({
        deck_w_m: +body.querySelector('#dkW').value,
        deck_l_m: +body.querySelector('#dkL').value,
        joist_centres_mm: +body.querySelector('#dkC').value,
        board_w_mm: +body.querySelector('#dkB').value,
        board_gap_mm: +body.querySelector('#dkG').value,
      });
      if (r.error) return body.querySelector('#dkOut').innerHTML = `<div class="empty">${escapeHtml(r.error)}</div>`;
      body.querySelector('#dkOut').innerHTML = `
        <div class="calc-row"><span>Deck area</span><strong>${r.area_m2} m²</strong></div>
        <div class="calc-row"><span>Joists</span><strong>${r.joists} (≈ ${r.joist_total_m} m total)</strong></div>
        <div class="calc-row hilite"><span>Decking boards across</span><strong>${r.decking_boards}</strong></div>
        <div class="calc-row"><span>Total decking length</span><strong>${r.decking_total_m} m</strong></div>`;
    };
    body.querySelectorAll('input, select').forEach(el => el.addEventListener('input', compute));
    compute();
  }

  return {
    view,
    calcBrickMortar, calcPlaster, calcConcrete, recommendedFootingWidth,
    calcRebar, calcTiling, calcPaint, calcExcavation, calcRoofing,
    calcBeam, calcCubeTest, assessSiteClass, convertUnit,
    calcStairs, calcDrywall, calcInsulation, calcPipeFlow,
    calcColumn, calcWallpaper, calcFraming, calcDeck,
  };
})();
