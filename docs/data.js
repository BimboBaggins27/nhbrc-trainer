// NHBRC Trainer — content distilled from SANS 10400 (SABS 0400-1990) and the
// National Building Regulations & Building Standards Act 103 of 1977,
// including the 30 May 2008 amendments (Government Gazette No. 31084, R.574).
// Source PDF: sans10400.co.za/wp-content/uploads/2012/12/SANS10400A.pdf
// This is study material, not a legal substitute. Always consult the latest SANS / local authority.

window.NHBRC_DATA = {
  meta: {
    title: "NHBRC Trainer",
    subtitle: "SA Building Regulations — SANS 10400 study guide",
    sourceLabel: "Based on SANS 10400 / SABS 0400-1990 + 2008 NBR amendments",
    version: "1.1.0"
  },

  about: {
    intro: "This study guide distills the South African National Building Regulations and the rules every NHBRC home builder must know, into 17 short, mobile-friendly modules.",
    sourcePdf: {
      title: "SANS 10400 — The Application of the National Building Regulations",
      publisher: "South African Bureau of Standards (SABS)",
      url: "http://sans10400.co.za/wp-content/uploads/2012/12/SANS10400A.pdf",
      pages: 253,
      sizeMb: 18,
      edition: "First Revision, 1990 (SABS 0400-1990) — incorporating the 30 May 2008 amendments published in Government Gazette No. 31084 (Notice R.574)"
    },
    laws: [
      { name: "National Building Regulations and Building Standards Act 103 of 1977", role: "The Act under which the NBR are promulgated." },
      { name: "Government Gazette No. 31084, R.574 (30 May 2008)", role: "Major amendments: definitions, AZ.4, A19, structural responsibility." },
      { name: "Housing Consumers Protection Measures Act 95 of 1998", role: "Establishes the NHBRC and the home-builder warranty scheme." },
      { name: "SANS 10400 (per-part editions, 2010 onwards)", role: "Modern split of the standard — Part A, B, C... published separately." },
      { name: "SANS 10400-XA (2011)", role: "Energy usage in buildings — added after the 1990 base edition." }
    ],
    coverage: [
      "All 23 lettered Parts of SANS 10400 (A through W) at a working level",
      "All 29 occupancy classifications (A1 to J4)",
      "The full plan-submission and competent-person workflow",
      "NHBRC enrolment, inspection schedule and warranty cover"
    ],
    disclaimer: "This is study material. The 1990 edition has been progressively superseded since 2010 by per-part SANS 10400 publications. For real plan submissions, work to the current published Part and the NHBRC Home Building Manual.",
    methodology: [
      "PDF downloaded from sans10400.co.za and parsed page-by-page with PyMuPDF.",
      "253 pages of regulatory text mapped to 17 study modules.",
      "Definitions cross-referenced against the 2008 Gazette amendments.",
      "Occupancy table reproduced from Reg A21 (2008 substitution).",
      "Quiz answers verified against clause text and deemed-to-satisfy rules."
    ]
  },

  planColours: {
    materials: [
      { label: "New masonry", color: "#c8513e" },
      { label: "New concrete", color: "#1a8a4a" },
      { label: "New iron / steel", color: "#2a6cb5" },
      { label: "New wood", color: "#f5c44a" },
      { label: "New glass", color: "#1d1d1d" },
      { label: "Existing materials", color: "#9aa6a0" }
    ],
    drainage: [
      { label: "Drains & soil pipes", color: "#7a4f2b" },
      { label: "Waste pipes", color: "#1a8a4a" },
      { label: "Soil & combined vents", color: "#c8513e" },
      { label: "Waste vents", color: "#2a6cb5" },
      { label: "Industrial effluent", color: "#e08a1c" },
      { label: "Existing drains", color: "#1d1d1d" }
    ]
  },

  occupancyChips: [
    { code: "A1", label: "Entertainment", group: "A" },
    { code: "A2", label: "Theatrical / indoor sport", group: "A" },
    { code: "A3", label: "Places of instruction", group: "A" },
    { code: "A4", label: "Worship", group: "A" },
    { code: "A5", label: "Outdoor sport", group: "A" },
    { code: "B1", label: "High-risk service", group: "B" },
    { code: "B2", label: "Moderate service", group: "B" },
    { code: "B3", label: "Low-risk service", group: "B" },
    { code: "C1", label: "Exhibition hall", group: "C" },
    { code: "C2", label: "Museum", group: "C" },
    { code: "D1", label: "High-risk industrial", group: "D" },
    { code: "D2", label: "Moderate industrial", group: "D" },
    { code: "D3", label: "Low-risk industrial", group: "D" },
    { code: "D4", label: "Plant room", group: "D" },
    { code: "E1", label: "Detention", group: "E" },
    { code: "E2", label: "Hospital", group: "E" },
    { code: "E3", label: "Institutional residential", group: "E" },
    { code: "E4", label: "Health care", group: "E" },
    { code: "F1", label: "Large shop", group: "F" },
    { code: "F2", label: "Small shop", group: "F" },
    { code: "F3", label: "Wholesale store", group: "F" },
    { code: "G1", label: "Offices", group: "G" },
    { code: "H1", label: "Hotel", group: "H" },
    { code: "H2", label: "Dormitory", group: "H" },
    { code: "H3", label: "Domestic residence", group: "H" },
    { code: "H4", label: "Detached dwelling — typical NHBRC home", group: "H", spotlight: true },
    { code: "H5", label: "Hospitality / guest house", group: "H" },
    { code: "J1", label: "High-risk storage", group: "J" },
    { code: "J2", label: "Moderate storage", group: "J" },
    { code: "J3", label: "Low-risk storage", group: "J" },
    { code: "J4", label: "Parking garage", group: "J" }
  ],

  modules: [
    {
      id: "intro",
      icon: "🇿🇦",
      tag: "Foundation",
      title: "What is the NHBRC and SANS 10400?",
      summary: "Who regulates home-building in South Africa, and how the rule book is structured.",
      sections: [
        { h: "The NHBRC", p: "The National Home Builders Registration Council (NHBRC) is the statutory regulator for the South African home-building industry, established under the Housing Consumers Protection Measures Act 95 of 1998. Its mandate is to protect housing consumers and regulate home builders." },
        { h: "What the NHBRC does", list: [
          "Registers home builders (you cannot legally build a new home for sale without registration).",
          "Enrols every new home with the NHBRC before construction starts; this provides a 5-year structural defects warranty.",
          "Inspects homes during construction at key stages.",
          "Operates the Warranty Fund that pays out for major structural defects when a builder fails to rectify.",
          "Trains and assesses home builders against the NHBRC Home Building Manual."
        ]},
        { h: "How NHBRC links to SANS 10400", p: "The NHBRC Home Building Manual references SANS 10400 throughout. SANS 10400 — 'The Application of the National Building Regulations' — gives the deemed-to-satisfy rules that show how to comply with the National Building Regulations promulgated under Act 103 of 1977." },
        { h: "Two ways to comply", list: [
          "Prescriptive route: follow the deemed-to-satisfy rules in SANS 10400 exactly. The local authority may not refuse plans that comply.",
          "Performance / rational route: a competent person submits a rational design or rational assessment showing equivalent or better performance than SANS 10400 (Reg AZ.4)."
        ]},
        { h: "Structure of SANS 10400", p: "The standard is split into Parts A–XA. Part A is Administration (plans, occupancy, competent persons). Parts B–W cover technical subjects. Each part has functional regulations and deemed-to-satisfy rules." }
      ],
      keyTerms: ["NHBRC", "SANS 10400", "deemed-to-satisfy", "rational design", "competent person", "Act 103 of 1977"]
    },

    {
      id: "parts",
      icon: "📚",
      tag: "Foundation",
      title: "Parts A–W at a glance",
      summary: "What each Part of SANS 10400 covers — your map of the entire regulation.",
      sections: [
        { svg: `<svg viewBox="0 0 360 230" class="diagram" role="img" aria-label="Building section with each SANS 10400 Part labelled where it applies">
  <rect x="0" y="0" width="360" height="200" fill="rgba(126,180,212,0.12)"/>
  <polygon points="60,90 180,30 300,90" fill="#c8513e" stroke="#3a1a13" stroke-width="1.4"/>
  <rect x="80" y="90" width="200" height="110" fill="#f1dca7" stroke="#7a634a" stroke-width="1.2"/>
  <line x1="80" y1="140" x2="280" y2="140" stroke="#7a634a" stroke-width="0.8"/>
  <rect x="100" y="105" width="32" height="22" fill="#7fb6e6" stroke="#234" stroke-width="0.8"/>
  <rect x="230" y="105" width="32" height="22" fill="#7fb6e6" stroke="#234" stroke-width="0.8"/>
  <rect x="100" y="155" width="32" height="22" fill="#7fb6e6" stroke="#234" stroke-width="0.8"/>
  <rect x="167" y="160" width="26" height="40" fill="#7c5a3a" stroke="#3a2613" stroke-width="0.8"/>
  <path d="M210,200 L225,188 L225,175 L240,162 L240,148 L255,138" stroke="#0b6e3f" stroke-width="2" fill="none"/>
  <rect x="70" y="200" width="220" height="14" fill="#cbd2d8" stroke="#5a6b62" stroke-width="1.2"/>
  <rect x="0" y="214" width="360" height="16" fill="#a98a6c" opacity="0.45"/>
  <line x1="0" y1="214" x2="360" y2="214" stroke="#7c5a3a"/>
  <line x1="180" y1="214" x2="180" y2="225" stroke="#7a4f2b" stroke-width="3"/>
  <line x1="180" y1="225" x2="350" y2="225" stroke="#7a4f2b" stroke-width="3"/>
  <line x1="60" y1="92" x2="42" y2="214" stroke="#2a6cb5" stroke-width="2.2"/>
  <g font-family="-apple-system,Segoe UI,sans-serif">
    <text x="180" y="70" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">L · Roofs</text>
    <text x="320" y="48" font-size="11" font-weight="700" fill="#c03434">T</text><text x="320" y="60" font-size="8" fill="currentColor">Fire</text>
    <text x="116" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="#0b6e3f">N · Glazing</text>
    <text x="246" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="#0b6e3f">O · Light/vent</text>
    <text x="295" y="135" font-size="11" font-weight="700" fill="#0b6e3f">K</text><text x="295" y="147" font-size="8" fill="currentColor">Walls</text>
    <text x="148" y="155" font-size="10" font-weight="700" fill="#0b6e3f">C · Dimensions</text>
    <text x="252" y="170" font-size="11" font-weight="700" fill="#0b6e3f">M</text><text x="252" y="182" font-size="8" fill="currentColor">Stairs</text>
    <text x="116" y="195" font-size="10" font-weight="700" fill="#0b6e3f">J · Floors</text>
    <text x="200" y="212" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">H · Foundations</text>
    <text x="295" y="223" font-size="11" font-weight="700" fill="#7a4f2b">P</text><text x="307" y="223" font-size="8" fill="currentColor">Drainage</text>
    <text x="20" y="170" font-size="11" font-weight="700" fill="#2a6cb5">R</text><text x="20" y="182" font-size="8" fill="currentColor">Stormwater</text>
    <text x="170" y="190" font-size="10" font-weight="700" fill="#0b6e3f">D</text>
    <text x="20" y="225" font-size="9" fill="currentColor">G · Excavations</text><text x="125" y="225" font-size="9" fill="currentColor">F · Site ops</text>
  </g>
</svg>`, caption: "A typical home — and where each Part of SANS 10400 sets the rules." },
        { h: "Administration & framework", table: {
          head: ["Part", "Subject"],
          rows: [
            ["A", "Administration — plans, applications, classification, competent persons"],
            ["B", "Structural design — loads, materials, design responsibility"],
            ["C", "Dimensions — minimum room sizes and heights"],
            ["D", "Public safety — changes in level, ramps, swimming pools"]
          ]
        }},
        { h: "Site & sub-structure", table: {
          head: ["Part", "Subject"],
          rows: [
            ["E", "Demolition work"],
            ["F", "Site operations — protection of public, soil, sanitation on site"],
            ["G", "Excavations — stability, foundations excavations"],
            ["H", "Foundations — empirical rules and soil classes"],
            ["J", "Floors — floor construction and damp-proofing"]
          ]
        }},
        { h: "Super-structure", table: {
          head: ["Part", "Subject"],
          rows: [
            ["K", "Walls — strength, water penetration, fire, masonry rules"],
            ["L", "Roofs — fire, waterproofing, structural roof components"],
            ["M", "Stairways — dimensions, fire, prevention against falling"],
            ["N", "Glazing — type, fixing, safety glazing"]
          ]
        }},
        { h: "Services", table: {
          head: ["Part", "Subject"],
          rows: [
            ["O", "Lighting & ventilation — natural and artificial"],
            ["P", "Drainage — sanitary fixtures, discharge pipes, drains"],
            ["Q", "Non-water-borne sanitary disposal"],
            ["R", "Stormwater disposal"],
            ["S", "Facilities for persons with disabilities"]
          ]
        }},
        { h: "Fire & utilities", table: {
          head: ["Part", "Subject"],
          rows: [
            ["T", "Fire protection — escape routes, fire resistance, equipment"],
            ["U", "Refuse disposal"],
            ["V", "Space heating — flues, chimneys, hearths"],
            ["W", "Fire installation — water supply for firefighting"],
            ["XA", "Energy usage in buildings (added 2011, post this PDF edition)"]
          ]
        }},
        { h: "Tip", callout: "warn", text: "When the local authority asks 'in what part of SANS 10400 is this dealt with?' — the lettered prefix on a clause (e.g. KK5) tells you. Capital letter = Part, double letter = deemed-to-satisfy section." }
      ]
    },

    {
      id: "occupancy",
      icon: "🏛️",
      tag: "Part A",
      title: "Occupancy classification (Reg A20)",
      summary: "Every building is classified by use. The class drives fire, structural and population rules.",
      sections: [
        { chips: "occupancy", caption: "Tap a class to remember it. The H4 chip — your typical NHBRC home — is highlighted." },
        { h: "Why classification matters", p: "Population (A21), fire stability (Part T), means of escape, sanitary fixture provision (Part P), and disabled facilities (Part S) are all driven by the building's occupancy class. A wrong class means wrong design." },
        { h: "All 29 occupancy classes", table: {
          head: ["Code", "Occupancy", "Examples"],
          rows: [
            ["A1", "Entertainment & public assembly", "Cinemas, concert halls, dance halls"],
            ["A2", "Theatrical & indoor sport", "Theatres, indoor stadia"],
            ["A3", "Places of instruction", "Schools, universities, training centres"],
            ["A4", "Worship", "Churches, mosques, temples"],
            ["A5", "Outdoor sport", "Stadia, pavilions"],
            ["B1", "High risk commercial service", "Dry cleaners using flammable solvents"],
            ["B2", "Moderate risk commercial service", "Workshops, repair shops"],
            ["B3", "Low risk commercial service", "Hairdressers, laundromats"],
            ["C1", "Exhibition hall", "Exhibition centres"],
            ["C2", "Museum", "Art galleries, museums"],
            ["D1", "High risk industrial", "Refineries, paint manufacture"],
            ["D2", "Moderate risk industrial", "Light manufacturing"],
            ["D3", "Low risk industrial", "Assembly of finished goods"],
            ["D4", "Plant room", "Boiler rooms, switch rooms"],
            ["E1", "Places of detention", "Prisons, holding cells"],
            ["E2", "Hospital", "Hospitals, clinics with beds"],
            ["E3", "Other institutional (residential)", "Old age homes, frail care"],
            ["E4", "Health care", "Day clinics (added 2008 amendment)"],
            ["F1", "Large shop", "Shopping centres, hypermarkets"],
            ["F2", "Small shop", "Spazas, corner shops"],
            ["F3", "Wholesalers' store", "Cash & carry"],
            ["G1", "Offices", "Office buildings"],
            ["H1", "Hotel", "Hotels, lodges, B&Bs > 3 paying guests"],
            ["H2", "Dormitory", "Hostels, boarding houses"],
            ["H3", "Domestic residence", "Flats, townhouses, terrace houses"],
            ["H4", "Detached dwelling house", "Free-standing single house — typical NHBRC home"],
            ["H5", "Hospitality", "Backpackers, guest houses (2008 amendment)"],
            ["J1", "High risk storage", "Storage of flammable liquids"],
            ["J2", "Moderate risk storage", "Furniture warehouse"],
            ["J3", "Low risk storage", "Steel, masonry storage"],
            ["J4", "Parking garage", "Parking buildings"]
          ]
        }},
        { h: "NHBRC focus", callout: "ok", text: "Most NHBRC inspections focus on H3 and H4 — the homes ordinary South Africans live in. But a registered home builder may also work on H1, H2 and H5 if scoped." },
        { h: "Mixed occupancies", p: "Where a building has more than one use, every part is classified separately and the most onerous fire and escape rules apply at the boundary between them (Part T)." }
      ],
      keyTerms: ["occupancy class", "H4", "H3", "A20", "A21"]
    },

    {
      id: "plans",
      icon: "📐",
      tag: "Part A",
      title: "Plans, applications & approvals (A1–A11)",
      summary: "What you must submit to the local authority before you may break ground.",
      sections: [
        { swatches: "materials", caption: "Materials — Reg A5(6) plan colours. One copy of your drawings must be coloured this way for the local authority." },
        { h: "Application (A1)", p: "Designing, planning and supervising the erection of any building is subject to registration under the Architectural Profession Act, Engineering Profession Act, Natural Scientific Professions Act, or Surveyors' Act. You may not submit plans you are not legally entitled to sign." },
        { h: "Plans and particulars (A2)", list: [
          "A site plan locating the building on the erf with boundaries, levels and existing structures.",
          "A layout drawing showing rooms, dimensions, doors, windows and use of every room.",
          "A drainage layout — sanitary fixtures, drains, vents, manholes, discharge points.",
          "A roof plan and section through the building.",
          "Specifications for materials and finishes.",
          "A fire-protection plan where required.",
          "Certificates contemplated in the regulations (Agrément, NHBRC enrolment, etc.).",
          "(2008) A declaration in Form 1 by a registered competent person stating how each functional regulation is satisfied."
        ]},
        { h: "Application forms, scales (A5)", list: [
          "Site plans: 1:500 normally, 1:250 on small erven (2008 amendment).",
          "Floor plans, sections, elevations: 1:100 typically; details up to 1:20.",
          "Lettering: not less than 2.5 mm high (2008).",
          "Plans must be on durable material acceptable to the local authority (paper, polyester film, or digital medium accepted by council)."
        ]},
        { h: "Colour conventions (A5(6))", table: {
          head: ["Material", "Colour"],
          rows: [
            ["New masonry", "Red"],
            ["New concrete", "Green"],
            ["New iron / steel", "Blue"],
            ["New wood", "Yellow"],
            ["New glass", "Black"],
            ["Existing materials", "Grey"]
          ]
        }},
        { h: "Drainage colours", swatches: "drainage" },
        { h: "Notice of intention to build (A22)", p: "Owner must give the local authority at least 24 hours' notice before commencing erection or demolition. Further notices are required at foundation excavation, foundation concrete, dpc level, super-structure, drainage testing and final completion." },
        { h: "Pointing out boundary beacons (A11)", p: "Where the local authority requires it, the owner must arrange for a registered land surveyor to point out boundary beacons before construction starts. Building over a boundary is a costly mistake the NHBRC will not warrant against." }
      ],
      keyTerms: ["site plan", "Form 1", "Form 2", "scale", "boundary beacon"]
    },

    {
      id: "competent",
      icon: "👷",
      tag: "Part A",
      title: "Competent persons & responsibility (A19, B4)",
      summary: "Who may sign off design, inspection and assessment — and what happens if they walk off site.",
      sections: [
        { h: "Definition (2008 amendment)", p: "A 'competent person' is someone qualified by virtue of education, training, experience and contextual knowledge to make a determination regarding the performance of a building or part thereof in relation to a functional regulation, or to undertake duties assigned in terms of the regulations." },
        { h: "When you must appoint one (A19)", list: [
          "When a rational design or rational assessment is required (Reg AZ.4(1)(b)(ii)).",
          "When a geotechnical investigation is required under Reg F3 (unstable soil — including dolomite land).",
          "For structural systems on multi-storey buildings.",
          "For artificial ventilation, fire protection, drainage and stormwater systems requiring rational design.",
          "When extending an existing building that will carry new structural loads (Reg A1(3))."
        ]},
        { h: "Owner's duties", list: [
          "Appoint and retain in writing the competent person; make their duties explicit.",
          "Notify the local authority within one month of any change of competent person (Reg A2(2)).",
          "Where the competent person can no longer fulfil duties, appoint another approved competent person to take over both designed work and remaining work."
        ]},
        { h: "Forms (Annex 1)", list: [
          "Form 1: owner's declaration listing competent persons and how each functional regulation will be met.",
          "Form 2: each competent person's declaration of competence and acceptance of duties.",
          "Form 3: designer's confirmation that a sub-system has been designed and inspected (used by the lead competent person to sign off integrated systems)."
        ]},
        { h: "B4 — design responsibility for structures", p: "For structures, the appointed competent person under Part B takes overall responsibility for structural adequacy. Where parts are designed by others, the lead person ensures component designs co-ordinate so the building as a whole is structurally adequate, but is not responsible for the detailed design done by other registered persons." },
        { h: "Local authority refusal (Reg A19(9)(c))", list: [
          "May refuse a competent person who supplies false information on Form 2.",
          "Or who is not an employee of the owner and lacks professional indemnity insurance.",
          "Or who is not registered with ECSA, SACAP, SACNASP or another relevant council.",
          "Or who is judged inadequately qualified or experienced. Decision is appealable to the Review Board."
        ]}
      ],
      keyTerms: ["competent person", "Form 1", "Form 2", "Form 3", "rational design", "rational assessment"]
    },

    {
      id: "structural",
      icon: "🏗️",
      tag: "Part B",
      title: "Structural design (Part B)",
      summary: "Loads, materials and how a building must stand up under all foreseeable actions.",
      sections: [
        { h: "Functional regulation B1", p: "Any building or structural element shall be designed to provide strength, stability, serviceability and durability under all actions which can reasonably be expected to occur (2008 amendment introduced 'actions' — concentrated or distributed mechanical forces and imposed deformations)." },
        { h: "Design routes", list: [
          "Deemed-to-satisfy: empirical masonry rules in Part K, foundation tables in Part H, timber rules referencing SANS 10082 / SANS 10163 / SANS 10162.",
          "Rational design by a registered Pr.Eng or Pr.Tech.Eng using SANS 10160 (loadings) and the relevant material design code."
        ]},
        { h: "Materials (B3)", list: [
          "Materials must be suitable for the purpose for which they are used.",
          "Timber must be treated against termite, wood-borer and fungal decay per SANS 10005, and bear an SANAS-accredited certification mark (2008).",
          "Non-standard products must hold a current Agrément South Africa certificate."
        ]},
        { h: "Designer's responsibility (BB4)", p: "Where rational design is used, the engineer signs Form 2, declares competence, and accepts responsibility for inspecting the structural work to confirm execution matches the design intent. 'Inspection' (2008 definition) does not mean day-to-day supervision — it means general inspection at intervals adequate to confirm design assumptions are valid." },
        { h: "Soil and dolomite (linked to F3)", callout: "warn", text: "Dolomite land needs a geotechnical site investigation by a competent person registered with SACNASP. Foundation rules in Part H DO NOT apply to dolomite land. The NHBRC has additional rules for dolomite under its Home Building Manual." }
      ],
      keyTerms: ["actions", "loads", "Pr.Eng", "Agrément", "SANS 10160"]
    },

    {
      id: "dimensions",
      icon: "📏",
      tag: "Part C",
      title: "Dimensions (Part C)",
      summary: "Minimum sizes and heights for habitable rooms.",
      sections: [
        { h: "Plan dimensions (CC2)", p: "No habitable room may have a horizontal plan dimension less than 2.0 m. A floor area below the minimum cannot count towards required floor area." },
        { h: "Minimum floor areas (CC4)", table: {
          head: ["Room", "Minimum area"],
          rows: [
            ["Habitable room (other than first room of a dwelling)", "6 m²"],
            ["First habitable room of a dwelling unit", "Not specified — but with kitchen and ablution must support living"],
            ["Bathroom (with WC and basin)", "1.8 m²"],
            ["Separate WC compartment", "1.4 m²"],
            ["Shower room", "1.4 m²"],
            ["Kitchen", "4 m² (when separate)"]
          ]
        }},
        { h: "Room heights (CC3)", table: {
          head: ["Room", "Minimum height"],
          rows: [
            ["Habitable rooms", "2.4 m floor to ceiling"],
            ["Kitchen / scullery / laundry / bathroom / WC", "2.1 m"],
            ["Passage / entrance hall / landing", "2.1 m"],
            ["Garage", "2.1 m"],
            ["Under sloping ceiling — ⅔ of room must be ≥ 2.4 m", "Min 1.5 m at lowest point counted as floor"]
          ]
        }},
        { h: "NHBRC tip", callout: "ok", text: "If a designer brings you a 2.2 m bedroom 'because it's a starter house', that is non-compliant for an H4 dwelling. Push back — the local authority will reject the plans." }
      ],
      keyTerms: ["habitable room", "ceiling height", "floor area"]
    },

    {
      id: "foundations",
      icon: "🪨",
      tag: "Part H",
      title: "Foundations (Part H) and soil (G, F3)",
      summary: "How to size strip foundations using empirical rules — and when you must use an engineer.",
      sections: [
        { svg: `<svg viewBox="0 0 360 220" class="diagram" role="img" aria-label="Strip foundation cross section">
  <defs>
    <pattern id="soil" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M0,6 L6,0" stroke="#7c5a3a" stroke-width="0.5"/></pattern>
    <marker id="ar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker>
    <marker id="al" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M8,0 L0,4 L8,8 z" fill="currentColor"/></marker>
  </defs>
  <rect x="0" y="140" width="360" height="80" fill="url(#soil)" opacity="0.7"/>
  <line x1="0" y1="140" x2="360" y2="140" stroke="#7c5a3a" stroke-width="1.5"/>
  <rect x="100" y="115" width="160" height="30" fill="#cbd2d8" stroke="#5a6b62" stroke-width="1.2"/>
  <rect x="155" y="20" width="50" height="95" fill="#c8513e" stroke="#3a1a13" stroke-width="1"/>
  <line x1="100" y1="40" x2="260" y2="40" stroke="#0b6e3f" stroke-width="3.5"/>
  <line x1="0" y1="70" x2="100" y2="70" stroke="#5a6b62" stroke-dasharray="4 2"/>
  <line x1="260" y1="70" x2="360" y2="70" stroke="#5a6b62" stroke-dasharray="4 2"/>
  <text x="180" y="14" text-anchor="middle" fill="currentColor" font-size="11" font-weight="600">Brick wall (Part K)</text>
  <text x="180" y="135" text-anchor="middle" fill="currentColor" font-size="10">Mass concrete strip · ≥ 15 MPa</text>
  <text x="50" y="60" fill="currentColor" font-size="10">Ground level</text>
  <text x="265" y="50" fill="#0b6e3f" font-size="10" font-weight="700">DPC ≥ 150 mm</text>
  <line x1="100" y1="170" x2="260" y2="170" stroke="currentColor" marker-start="url(#al)" marker-end="url(#ar)"/>
  <text x="180" y="188" text-anchor="middle" fill="currentColor" font-size="10">Width per soil class (Part H)</text>
  <line x1="270" y1="115" x2="270" y2="145" stroke="currentColor" marker-start="url(#al)" marker-end="url(#ar)"/>
  <text x="278" y="135" fill="currentColor" font-size="9">≥ 200 mm</text>
  <line x1="155" y1="115" x2="100" y2="115" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 2"/>
  <text x="105" y="112" fill="currentColor" font-size="9">≥ 100 mm projection each side</text>
</svg>`, caption: "Empirical strip foundation — Part H. Width depends on soil class (1 gravel, 2 sand, 3 clay)." },
        { h: "When empirical rules may be used (HH2)", list: [
          "Single dwelling H4 or domestic outbuilding.",
          "Up to two storeys.",
          "Soil class 1 to 3 (NHBRC site-class C, S or H but not C2/H2/H3 collapsing or expansive without engineer).",
          "Wall heights and openings within the building limitations of K (KK2).",
          "Floor loadings ≤ 2.0 kN/m²."
        ]},
        { h: "Strip foundation widths (typical empirical)", table: {
          head: ["Wall thickness", "Soil class 1 (gravel)", "Soil class 2 (sand)", "Soil class 3 (clay)"],
          rows: [
            ["106 mm half-brick", "400 mm × 200 mm", "500 mm × 200 mm", "600 mm × 200 mm"],
            ["220 mm one-brick", "500 mm × 200 mm", "600 mm × 200 mm", "700 mm × 200 mm"],
            ["340 mm 1½-brick", "600 mm × 220 mm", "700 mm × 220 mm", "800 mm × 220 mm"]
          ]
        }},
        { h: "Concrete in foundations", list: [
          "Minimum 15 MPa concrete in mass strip foundations.",
          "Concrete must extend at least 100 mm beyond each face of wall.",
          "Foundation must be on undisturbed soil or properly compacted backfill.",
          "Step foundations: each step ≤ 500 mm high; horizontal lap of step ≥ 2× height."
        ]},
        { h: "Unstable soil (F3)", callout: "warn", text: "On dolomitic, collapsing, heaving or compressible soil, empirical rules do NOT apply. The owner must appoint a competent person (geotechnical and structural) to do a rational design. The NHBRC site classification (C, P, S, H, D) determines the engineering required." },
        { h: "Excavations (Part G)", list: [
          "Sides of excavations > 1.5 m deep must be sloped, shored or stepped.",
          "Spoil heaps and stored material kept ≥ 1 m from the edge.",
          "Where adjoining structures could be undermined, the owner must protect against subsidence."
        ]}
      ],
      keyTerms: ["strip foundation", "soil class", "dolomite", "site class", "NHBRC"]
    },

    {
      id: "walls",
      icon: "🧱",
      tag: "Part K",
      title: "Walls (Part K)",
      summary: "Empirical masonry rules — thickness, bonding, openings, dpc and water penetration.",
      sections: [
        { svg: `<svg viewBox="0 0 360 220" class="diagram" role="img" aria-label="Cavity wall section">
  <defs>
    <pattern id="brk" patternUnits="userSpaceOnUse" width="20" height="10"><rect width="20" height="10" fill="#c8513e"/><line x1="0" y1="0" x2="20" y2="0" stroke="#3a1a13" stroke-width="0.6"/><line x1="0" y1="5" x2="10" y2="5" stroke="#3a1a13" stroke-width="0.4"/><line x1="10" y1="5" x2="20" y2="5" stroke="#3a1a13" stroke-width="0.4"/><line x1="10" y1="0" x2="10" y2="5" stroke="#3a1a13" stroke-width="0.4"/></pattern>
  </defs>
  <rect x="60" y="20" width="40" height="160" fill="url(#brk)"/>
  <rect x="130" y="20" width="40" height="160" fill="url(#brk)"/>
  <rect x="100" y="20" width="30" height="160" fill="rgba(126,180,212,0.18)"/>
  <line x1="80" y1="60" x2="150" y2="60" stroke="#7c5a3a" stroke-width="2"/>
  <line x1="80" y1="100" x2="150" y2="100" stroke="#7c5a3a" stroke-width="2"/>
  <line x1="80" y1="140" x2="150" y2="140" stroke="#7c5a3a" stroke-width="2"/>
  <line x1="60" y1="160" x2="170" y2="160" stroke="#0b6e3f" stroke-width="3.5"/>
  <circle cx="115" cy="170" r="2" fill="#3a1a13"/>
  <line x1="110" y1="170" x2="120" y2="170" stroke="#3a1a13" stroke-width="0.8"/>
  <rect x="55" y="180" width="120" height="14" fill="#cbd2d8" stroke="#5a6b62" stroke-width="1"/>
  <rect x="0" y="194" width="360" height="26" fill="#a98a6c" opacity="0.4"/>
  <line x1="0" y1="194" x2="360" y2="194" stroke="#7c5a3a"/>
  <text x="190" y="44" font-size="11" font-weight="700" fill="currentColor">Outer leaf — 106 mm</text>
  <text x="190" y="64" font-size="11" font-weight="700" fill="currentColor">Wall ties at 4 / m²</text>
  <text x="190" y="80" font-size="9" fill="currentColor">max 900 mm horiz × 450 mm vert</text>
  <text x="190" y="108" font-size="11" font-weight="700" fill="currentColor">50 mm cavity</text>
  <text x="190" y="148" font-size="11" font-weight="700" fill="currentColor">Inner leaf — 106 mm</text>
  <text x="190" y="172" font-size="11" font-weight="700" fill="#0b6e3f">DPC ≥ 150 mm above ground</text>
  <text x="125" y="187" font-size="9" fill="currentColor" text-anchor="middle">Weep hole</text>
  <text x="35" y="220" font-size="9" fill="currentColor">Ground</text>
</svg>`, caption: "Cavity wall — outer leaf, cavity, inner leaf, ties and DPC. The standard South African residential build-up." },
        { h: "When empirical rules apply (KK2)", list: [
          "Maximum 2 storeys for a 220 mm wall, 1 storey for 106 mm wall.",
          "Floor-to-ceiling height ≤ 2.7 m.",
          "Wind zone 1, 2 or 3 (no extreme wind areas without rational design).",
          "Plan dimensions and openings within tabulated limits."
        ]},
        { h: "Wall thickness (KK5)", table: {
          head: ["Wall location", "Min thickness"],
          rows: [
            ["External load-bearing wall, single storey", "106 mm masonry, but cavity wall preferred"],
            ["External load-bearing wall, double storey lower", "220 mm masonry or 280 mm cavity"],
            ["Internal load-bearing", "106 mm with reinforcement at openings"],
            ["Non-load-bearing partition", "90 mm"]
          ]
        }},
        { h: "Mortar and masonry units", list: [
          "Mortar Class II (1:1:6 cement:lime:sand) for normal walls; Class I (1:¼:3) below dpc and for parapets.",
          "Bricks must comply with SANS 227 (clay) or SANS 1215 (concrete).",
          "Bond: stretcher bond with overlap ≥ ¼ of unit length.",
          "Wall ties in cavity walls: 4 per m² of wall, max 900 mm horizontal × 450 mm vertical spacing."
        ]},
        { h: "Damp-proof course (KK16)", list: [
          "DPC required at least 150 mm above finished ground level on all external and internal walls.",
          "Material must be impervious — bituminous, polymer, copper, or engineering-brick course.",
          "Cavity weep-holes max 1.2 m apart and at every interruption to cavity (lintel, dpc).",
          "Vertical dpc beside reveals where cavity is bridged."
        ]},
        { h: "Openings (KK5)", list: [
          "Lintels: minimum 150 mm bearing each side.",
          "Above-opening masonry: at least 600 mm of wall above the lintel for empirical rules to apply.",
          "Total length of openings ≤ ⅓ of wall length on any storey.",
          "Piers between openings ≥ 600 mm wide."
        ]},
        { h: "Water penetration (KK15)", p: "External walls deemed to satisfy K2 if they comply with the masonry, dpc, weep-hole, and surface-finish rules. Plaster: external 15 mm minimum in two coats; internal 12 mm. Where rain-penetration test (Annex KK17) is required, walls are subjected to 100 Pa pressure differential and water sprayed at 1.4 ℓ/min/m² for 2 h with no penetration to inside face." }
      ],
      keyTerms: ["dpc", "cavity wall", "stretcher bond", "weep-hole", "lintel"]
    },

    {
      id: "roofs",
      icon: "🏠",
      tag: "Part L",
      title: "Roofs (Part L)",
      summary: "Roof timber, trusses, anchorage, fire and waterproofing.",
      sections: [
        { h: "L1 — General requirement", p: "Roofs shall be designed and constructed to safely sustain any actions, transfer them to the supporting structure, resist water penetration and not present a fire risk." },
        { h: "Empirical rules (LL2)", list: [
          "Pitched timber roofs to span tables in SANS 10082 (timber roof construction).",
          "Roof pitch and spans within tabulated limits — beyond which a competent person must do a rational design.",
          "Engineered timber trusses must be designed by a competent person and stamped on each truss.",
          "Battens, purlins and rafters: stress-grade SAP or SA Pine, treated H2 minimum (interior protected) or H3 (exposed)."
        ]},
        { h: "Roof anchorage (LL3 + KK14)", list: [
          "All roof structures must be tied down to the masonry walls to resist wind uplift.",
          "Hoop-iron, galvanised wire or proprietary cyclone clips, built into the wall at least 4 courses below the wall plate.",
          "Spacing maximum 1.2 m centres — closer in coastal Wind Zones 3 & 4."
        ]},
        { h: "Fire performance (LL4 + Table 5)", p: "Roof assemblies serving multi-storey buildings or near boundaries must have fire-resistance ratings in Part T. Domestic H4 roofs do not need fire rating except where a boundary safety distance demands it." },
        { h: "Waterproofing (LL5)", list: [
          "Concrete flat roofs: 4 mm torch-on bitumen membrane minimum, with 150 mm upturns at parapets.",
          "Tiled roofs: 17° minimum pitch for concrete tiles, 26° for slate, with sarking/underlay on rafters.",
          "Sheet metal roofs (IBR, corrugated): 5° minimum pitch with 200 mm end-laps and 1.5-rib side-laps."
        ]},
        { h: "NHBRC inspection points", callout: "ok", text: "The NHBRC inspector usually views the roof at 'wall plate level' — before tiling — to check timber grade, trusses, anchorage and bracing. Get this right or the home cannot be enrolled." }
      ],
      keyTerms: ["truss", "wall plate", "anchorage", "wind zone", "underlay"]
    },

    {
      id: "drainage",
      icon: "🚰",
      tag: "Part P",
      title: "Drainage (Part P)",
      summary: "Sanitary fixtures, traps, vents, drains and discharge — the rules of plumbing.",
      sections: [
        { svg: `<svg viewBox="0 0 320 220" class="diagram" role="img" aria-label="P-trap with water seal">
  <defs>
    <marker id="ar2" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker>
    <marker id="al2" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M8,0 L0,4 L8,8 z" fill="currentColor"/></marker>
  </defs>
  <rect x="40" y="10" width="100" height="60" fill="#e8eef0" stroke="#5a6b62" stroke-width="1.5" rx="6"/>
  <text x="90" y="44" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Wash basin</text>
  <path d="M85 70 L85 110 Q85 135 110 135 L150 135 Q175 135 175 110 L175 95"
        fill="none" stroke="#5a6b62" stroke-width="14" stroke-linecap="round"/>
  <path d="M85 70 L85 110 Q85 135 110 135 L150 135 Q175 135 175 110 L175 95"
        fill="none" stroke="#cbd2d8" stroke-width="10" stroke-linecap="round"/>
  <path d="M88 110 Q88 130 110 130 L150 130 Q172 130 172 110 L172 100"
        fill="none" stroke="#7fb6e6" stroke-width="6" opacity="0.85"/>
  <line x1="200" y1="105" x2="200" y2="135" stroke="currentColor" marker-start="url(#al2)" marker-end="url(#ar2)"/>
  <text x="206" y="124" font-size="10" font-weight="700" fill="#2a6cb5">≥ 50 mm seal</text>
  <text x="206" y="138" font-size="8" fill="currentColor">75 mm if back-inlet</text>
  <line x1="175" y1="80" x2="270" y2="80" stroke="#5a6b62" stroke-width="14" stroke-linecap="round"/>
  <line x1="175" y1="80" x2="270" y2="80" stroke="#cbd2d8" stroke-width="10" stroke-linecap="round"/>
  <text x="225" y="68" text-anchor="middle" font-size="10" fill="currentColor">To stack / drain</text>
  <text x="265" y="100" font-size="8" fill="currentColor">↗ vent</text>
  <text x="40" y="200" font-size="11" fill="currentColor">P-trap — keeps sewer gas out of the building.</text>
  <text x="40" y="214" font-size="11" fill="currentColor">Every fixture must have one.</text>
</svg>`, caption: "P-trap. The water seal is the building's nose-plug against the sewer." },
        { h: "Compulsory drainage (P1)", p: "Every building containing sanitary fixtures must be connected to the local authority sewer where one is reasonably accessible. Otherwise non-water-borne disposal under Part Q (conservancy tank, septic tank or French drain) applies." },
        { h: "Sanitary fixture provision (PP14)", table: {
          head: ["Occupancy", "Minimum fixtures (per dwelling)"],
          rows: [
            ["H4 dwelling", "1 WC, 1 wash hand basin, 1 bath or shower, 1 kitchen sink"],
            ["H1 hotel guest room", "1 WC, 1 basin, 1 bath/shower per room"],
            ["A3 school (per 30 learners)", "1 WC, 1 urinal (boys), 1 basin"],
            ["G1 office (per 25 staff)", "1 WC, 1 basin"]
          ]
        }},
        { h: "Pipe sizing (PP18, PP19)", list: [
          "Discharge pipe from a wash basin: 32 mm, max 1.7 m to trap.",
          "Discharge pipe from a bath / shower / sink: 40 mm.",
          "Discharge pipe from a WC: 100 mm to drain.",
          "Drain serving up to 10 fixture units: 100 mm at 1:60 minimum fall."
        ]},
        { h: "Traps and vents (PP21, PP22)", list: [
          "Every fixture must have a water-seal trap. Seal depth: 50 mm minimum (75 mm where it serves a back-inlet gully).",
          "All drains must be ventilated to atmosphere by a vent pipe extending 1.5 m above any opening within 5 m horizontally.",
          "Anti-siphon vent pipes prevent loss of water seal on long branches; max distance trap-to-vent depends on diameter."
        ]},
        { h: "Drain testing (PP26)", list: [
          "Drains must be water-tested before backfilling: stopper inserted, 1.5 m head of water for 30 min, no detectable loss.",
          "Air test alternative: 38 mm water-gauge pressure, must not drop below 25 mm in 5 min.",
          "Discharge pipes tested with smoke or water similarly."
        ]},
        { h: "Common error", callout: "warn", text: "Connecting a kitchen waste directly to a soil stack with no trap, or sharing a vent between two WCs, are very common NHBRC inspection failures. Always run kitchens to a gully, not to a soil pipe." }
      ],
      keyTerms: ["trap", "vent pipe", "fixture unit", "fall", "gully"]
    },

    {
      id: "fire",
      icon: "🔥",
      tag: "Part T",
      title: "Fire protection (Part T) — overview",
      summary: "Escape routes, fire resistance, fire equipment and how class drives it all.",
      sections: [
        { h: "Functional regulation T1", p: "Buildings shall be designed and constructed so that any outbreak of fire will be detected, contained, extinguished or escaped from before it endangers life or causes excessive property loss." },
        { h: "Five pillars of fire safety", list: [
          "Compartmentation: separate occupancies and tenancies with fire-rated walls (TT5–TT8).",
          "Stability: structural elements stable for the time tabulated by class & storeys (TT6, Table 5).",
          "Escape: at least one escape route from every point ≤ travel distance limits (TT19–TT26).",
          "Detection & alarm: required for most non-domestic buildings (TT37).",
          "Suppression: hose reels, hydrants, sprinklers, extinguishers (TT38–TT43)."
        ]},
        { h: "Stability times for H4 dwelling house (Table 5)", table: {
          head: ["Storeys", "Stability (minutes)"],
          rows: [
            ["Single storey H4", "30 min"],
            ["Double storey H4", "30 min"],
            ["3–10 storey H4", "60 min"],
            ["Basement", "120 min"]
          ]
        }},
        { h: "Escape route width (TT24)", list: [
          "Escape route width = 0.5 m per 100 persons of the population it serves.",
          "Minimum width 1.1 m (or 0.9 m for routes serving ≤ 50 persons).",
          "Stairways minimum 1.1 m wide, max 16 risers per flight."
        ]},
        { h: "Travel distance (TT19)", table: {
          head: ["Class", "Single direction", "Two directions"],
          rows: [
            ["A1, A2, A3, A4", "20 m", "45 m"],
            ["B, C, F, G", "30 m", "45 m"],
            ["D (industrial)", "30 m", "45 m"],
            ["E1, E2", "20 m", "35 m"],
            ["H1, H2", "20 m", "40 m"],
            ["H3, H4", "20 m", "Not applicable"]
          ]
        }},
        { h: "Domestic-scale fire", callout: "ok", text: "An H4 detached dwelling generally needs a 30-minute structural fire stability and only one means of escape. There is no requirement for a fire detection system in a normal home — but a hose reel or 9 kg dry-powder extinguisher near the kitchen is sensible." }
      ],
      keyTerms: ["compartment", "stability time", "travel distance", "escape route", "Table 5"]
    },

    {
      id: "lightvent",
      icon: "💡",
      tag: "Part O",
      title: "Lighting & ventilation (Part O)",
      summary: "Natural daylight and airflow rules for habitable rooms.",
      sections: [
        { h: "Natural lighting (OO2)", p: "Every habitable room must have a window with clear glazed area not less than 10% of the room's floor area." },
        { h: "Natural ventilation (OO4)", p: "Openable area of windows / louvres / doors not less than 5% of the floor area of the room. Where bathroom or WC has no opening, mechanical extraction at 6 air-changes per hour is required." },
        { h: "Zone of space (OO3)", p: "The window must face a zone of space at least 1.5 m wide, unobstructed by parts of the same building, allowing daylight in. Light from a court only counts where the court complies with size rules." },
        { h: "Kitchens", p: "A kitchen counts as a habitable room and must have natural lighting and ventilation; a fixed extractor over the stove does not substitute for an opening window unless the kitchen is artificially ventilated to OO7." },
        { h: "Artificial ventilation (O3–O6, OO7)", list: [
          "Designed by a competent person where natural ventilation is not used.",
          "Tested on completion against design air-flow rates and noise levels.",
          "Backup power required for fire-protective systems (smoke extraction)."
        ]}
      ],
      keyTerms: ["habitable room", "10% rule", "5% rule", "zone of space"]
    },

    {
      id: "stairs",
      icon: "🪜",
      tag: "Part M",
      title: "Stairways (Part M)",
      summary: "Risers, treads, balustrades and landings — preventing falls.",
      sections: [
        { svg: `<svg viewBox="0 0 360 220" class="diagram" role="img" aria-label="Stair geometry showing riser, tread and 2R+G">
  <defs>
    <marker id="ar3" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker>
    <marker id="al3" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M8,0 L0,4 L8,8 z" fill="currentColor"/></marker>
  </defs>
  <path d="M30,180 L70,180 L70,160 L110,160 L110,140 L150,140 L150,120 L190,120 L190,100 L230,100 L230,80 L270,80 L270,60 L310,60 L310,180 L30,180 z"
        fill="#f1dca7" stroke="#7a634a" stroke-width="1.4"/>
  <line x1="70" y1="180" x2="270" y2="80" stroke="#0b6e3f" stroke-width="2.5" stroke-dasharray="4 3"/>
  <text x="160" y="105" font-size="10" font-weight="700" fill="#0b6e3f" transform="rotate(-26 160 105)">pitch line</text>
  <line x1="125" y1="160" x2="125" y2="140" stroke="currentColor" marker-start="url(#al3)" marker-end="url(#ar3)"/>
  <text x="132" y="153" font-size="11" font-weight="700" fill="currentColor">R</text>
  <text x="132" y="166" font-size="8" fill="currentColor">100–200 mm</text>
  <line x1="110" y1="135" x2="150" y2="135" stroke="currentColor" marker-start="url(#al3)" marker-end="url(#ar3)"/>
  <text x="126" y="130" font-size="11" font-weight="700" fill="currentColor">G</text>
  <text x="116" y="148" font-size="8" fill="currentColor">≥ 250 mm</text>
  <rect x="270" y="14" width="6" height="46" fill="#5a6b62"/>
  <line x1="266" y1="58" x2="280" y2="58" stroke="#5a6b62" stroke-width="3"/>
  <line x1="270" y1="14" x2="270" y2="60" stroke="currentColor" marker-start="url(#al3)" marker-end="url(#ar3)"/>
  <text x="290" y="40" font-size="10" font-weight="700" fill="currentColor">≥ 1.0 m</text>
  <text x="290" y="54" font-size="8" fill="currentColor">balustrade</text>
  <text x="40" y="210" font-size="13" font-weight="700" fill="#0b6e3f">2R + G = 550–700 mm</text>
</svg>`, caption: "The 2R + G rule. Comfortable to walk, hard to trip on. Below 550 or above 700 → fail." },
        { h: "Dimensional rules (MM2)", table: {
          head: ["Element", "Domestic (H3, H4)", "Other occupancies"],
          rows: [
            ["Riser height", "100–200 mm", "150–185 mm"],
            ["Tread (going)", "≥ 250 mm", "≥ 250 mm"],
            ["2R + G", "550–700 mm", "550–700 mm"],
            ["Width of stair", "≥ 750 mm", "≥ 1.1 m"],
            ["Headroom", "≥ 2.0 m", "≥ 2.0 m"],
            ["Landing every", "16 risers", "16 risers"]
          ]
        }},
        { h: "Balustrades (MM3)", list: [
          "Required wherever there is a fall of more than 1.0 m.",
          "Height ≥ 1.0 m above pitch line of stair, ≥ 1.0 m above any landing or balcony floor.",
          "Openings: must not allow a 100 mm sphere to pass through (anti-climb requirement).",
          "Capable of resisting horizontal load of 0.7 kN/m on a top rail."
        ]},
        { h: "Fire requirements (MM4)", p: "Stairways serving as emergency routes must comply with Part T — non-combustible construction, fire-rated enclosing walls, self-closing doors, ventilation or pressurisation in tall buildings." }
      ],
      keyTerms: ["riser", "tread", "balustrade", "headroom", "2R+G"]
    },

    {
      id: "energy",
      icon: "⚡",
      tag: "Part XA",
      title: "Energy usage (Part XA)",
      summary: "Added in 2011 — thermal envelope, hot water heating, orientation. Not in this PDF but you must know it.",
      sections: [
        { h: "Why XA exists", p: "Part XA was added to SANS 10400 in November 2011 (after the edition this PDF is based on). It became compulsory for all new buildings to demonstrate energy efficiency." },
        { h: "Routes to comply", list: [
          "Prescriptive — comply with SANS 10400-XA and the deemed-to-satisfy minimum R-values for roofs, walls and floors.",
          "Theoretical — show via SANS 10400-XA computer modelling that the building meets a benchmark.",
          "Reference building — show new building uses no more energy than a reference building of same size and class."
        ]},
        { h: "Key requirements", list: [
          "Roof / ceiling: minimum total R-value of 3.7 (Climate Zones 1, 2, 4, 6) up to 3.7 — typically 135 mm thermal blanket above ceiling.",
          "External walls: R-value depending on mass — masonry usually meets minimums without insulation, lightweight walls need insulation.",
          "At least 50% (volume) of hot water by means other than electric resistance — usually solar geyser or heat pump.",
          "Fenestration limited to 15% of net floor area unless thermal-modelled."
        ]},
        { h: "NHBRC integration", callout: "warn", text: "Local authorities now require an XA compliance form (rational assessment) signed by a competent person in addition to the standard plans. NHBRC enrolment requires evidence of XA compliance." }
      ],
      keyTerms: ["XA", "R-value", "thermal envelope", "fenestration", "solar geyser"]
    },

    {
      id: "process",
      icon: "✅",
      tag: "Workflow",
      title: "End-to-end build approval workflow",
      summary: "From sketch to occupation certificate — every step you must hit.",
      sections: [
        { h: "1 · Buy the erf", p: "Confirm zoning and town-planning conditions before plans. Check title deed restrictions, servitudes, building lines." },
        { h: "2 · Appoint the design team", list: [
          "Architect (SACAP) for plans.",
          "Engineer (ECSA) for structures, drainage, geotech if non-standard.",
          "NHBRC-registered home builder if owner is not building him/herself."
        ]},
        { h: "3 · Concept & town-planning", p: "Submit conceptual plans for any necessary rezoning, consent uses, or relaxation of building lines. This is separate from the building plan submission." },
        { h: "4 · Building plans (Reg A2)", list: [
          "Site plan, layout, section, elevations, drainage layout, roof plan.",
          "Structural details and engineer's certificate.",
          "Form 1 — owner's declaration with all competent persons listed.",
          "Form 2 — each competent person's declaration.",
          "NHBRC enrolment certificate for new H3/H4 homes."
        ]},
        { h: "5 · NHBRC enrolment", callout: "warn", text: "By law, every new home built for a paying owner MUST be enrolled with the NHBRC at least 15 days before construction starts. The enrolment fee is a percentage of the home value and funds the 5-year warranty." },
        { h: "6 · Local authority approval", p: "Plans approved typically in 30 working days for buildings < 500 m², 60 days for larger. The Building Control Officer (Reg A16) must be a registered architect or engineer." },
        { h: "7 · Notice to commence (A22)", p: "At least 24 hours before starting any excavation. Then statutory notices at: foundation excavation; foundation concrete; dpc; superstructure; drains test; final completion." },
        { h: "8 · Construction inspections", list: [
          "Local authority inspections at each statutory notice.",
          "NHBRC inspections at minimum: foundation, super-structure, roof, plumbing/drainage, final.",
          "Engineer inspections per Form 2 commitments — issue inspection reports."
        ]},
        { h: "9 · Occupation Certificate (A25)", list: [
          "Owner submits Form 4 application.",
          "Must include final certificates from every competent person on Form 2.",
          "Local authority issues OC — without it the building may not be occupied."
        ]},
        { h: "10 · NHBRC Happy Letter & 5-year warranty", p: "After NHBRC's final inspection passes, the homeowner receives a certificate confirming enrolment. Warranty covers: 3 months for non-compliance with NHBRC technical specs, 12 months for roof leaks, 5 years for major structural defects." }
      ],
      keyTerms: ["enrolment", "occupation certificate", "Form 4", "Happy Letter", "warranty"]
    },

    {
      id: "warranty",
      icon: "🛡️",
      tag: "NHBRC",
      title: "NHBRC Warranty Scheme",
      summary: "What is and isn't covered, time limits, and how to claim.",
      sections: [
        { h: "Coverage by period", table: {
          head: ["Period from occupation", "What is covered"],
          rows: [
            ["3 months", "Non-compliance with NHBRC standards (technical defects)"],
            ["12 months", "Roof leaks caused by workmanship defects"],
            ["5 years", "Major structural defects in foundation, walls, roof structure"]
          ]
        }},
        { h: "Major structural defect — definition", p: "A defect that causes, or is likely to cause, the building to be unsafe, structurally unsound, or unfit for its intended purpose. Subsidence, foundation failure, cracking due to inadequate design — these qualify." },
        { h: "Excluded", list: [
          "Normal wear and tear or weathering.",
          "Damage caused by the owner's actions, alterations or lack of maintenance.",
          "Settlement cracking within agreed tolerances.",
          "Snagging items the builder has already addressed.",
          "Defects in fixtures supplied by the owner."
        ]},
        { h: "Claim process", list: [
          "Owner notifies the home builder in writing within the warranty period.",
          "If builder fails to remedy, owner lodges complaint with NHBRC.",
          "NHBRC inspects, mediates, and may instruct rectification.",
          "If builder still fails (or is liquidated), the NHBRC Warranty Fund pays for repairs up to the cover limit — currently set per home in the regulations."
        ]},
        { h: "Builder consequences", list: [
          "Repeated complaints can lead to NHBRC suspending or de-registering the builder.",
          "Disciplinary tribunal under the Housing Consumers Protection Measures Act.",
          "NHBRC may publish warnings to the public."
        ]}
      ],
      keyTerms: ["warranty", "structural defect", "Warranty Fund", "Happy Letter", "de-registration"]
    },

    // ---------- Additional Part-specific modules (D, F, J, N, Q, S, U, V, W) ----------
    {
      id: "demolition", icon: "💥", title: "Demolition (Part E)",
      summary: "Safely taking down a structure — notice, hoarding, dust control, services disconnection.",
      tag: "Part E",
      sections: [
        { h: "Scope of Part E" },
        { p: "Demolition is treated as 'building work' under the Act — plans, notice and competent-person sign-off all apply. The objective is preventing collapse, debris hazards and damage to adjoining property." },
        { h: "Pre-demolition checklist (E1, E2)" },
        { list: [
          "Disconnect electricity, gas, water and sewer — written confirmation from each utility.",
          "Survey and protect adjoining structures (party walls especially).",
          "Hoarding ≥ 2.0 m on the public side; warning signs.",
          "Asbestos / hazardous-material survey + safe-disposal plan (DOL Asbestos Regs).",
          "Notice of intention — at least 24 hours per Reg A22."
        ]},
        { svg: `<svg viewBox="0 0 320 180" width="100%" style="max-width:340px"><defs><pattern id="hatch1" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M 0 6 L 6 0" stroke="#888" stroke-width="0.8"/></pattern></defs><rect x="40" y="40" width="100" height="120" fill="url(#hatch1)" stroke="#0b6e3f" stroke-width="2"/><text x="90" y="105" font-size="11" text-anchor="middle" fill="#0b6e3f" font-weight="700">EXISTING</text><text x="90" y="120" font-size="9" text-anchor="middle" fill="#0b6e3f">to be demolished</text><rect x="160" y="40" width="100" height="120" fill="none" stroke="#888" stroke-dasharray="4 3"/><text x="210" y="100" font-size="10" text-anchor="middle" fill="#666">Adjoining</text><text x="210" y="115" font-size="10" text-anchor="middle" fill="#666">protect!</text><rect x="20" y="160" width="280" height="6" fill="#7c4f00"/><text x="160" y="175" font-size="9" text-anchor="middle" fill="#7c4f00">Hoarding ≥ 2.0 m on public boundary</text></svg>`, caption: "Hoarding + party-wall protection plan." },
        { h: "On-site execution" },
        { list: [
          "Top-down sequence — do not under-mine load paths.",
          "Wet-down dust at source, especially in built-up areas.",
          "Daily clearance of debris from public way.",
          "Final site cleaning per Reg F9."
        ]}
      ],
      keyTerms: ["demolition", "hoarding", "asbestos survey", "Reg E", "DOL"]
    },
    {
      id: "excavations", icon: "⛏️", title: "Excavations (Part G)",
      summary: "Open trenches, basements and bulk earthworks — keeping people, services and adjoining property safe.",
      tag: "Part G",
      sections: [
        { h: "General stability requirement (G1)" },
        { p: "Where any excavation is carried out, the owner must take adequate precautionary measures to maintain the safety and stability of any property or service that could be impaired." },
        { h: "Deemed-to-satisfy detail (G2)" },
        { list: [
          "Sides of excavations > 1.5 m deep must be sloped, shored, or stepped — never left vertical and unsupported.",
          "Spoil heaps and stored material kept ≥ 1.0 m clear of the edge.",
          "Where adjoining structures could be undermined, owner must protect them against subsidence.",
          "Open trenches on or near a public road: barricade + lighting at night."
        ]},
        { svg: `<svg viewBox="0 0 320 200" width="100%" style="max-width:360px"><rect x="0" y="20" width="320" height="80" fill="#d8c08a"/><polygon points="80,100 120,180 200,180 240,100" fill="#fff" stroke="#0b6e3f" stroke-width="2"/><text x="160" y="160" font-size="11" text-anchor="middle" fill="#0b6e3f" font-weight="700">EXCAVATION</text><line x1="120" y1="180" x2="80" y2="100" stroke="#c8513e" stroke-width="2"/><line x1="200" y1="180" x2="240" y2="100" stroke="#c8513e" stroke-width="2"/><text x="64" y="140" font-size="9" fill="#c8513e">slope</text><text x="60" y="100" font-size="9" fill="#0b6e3f">≥ 1 m</text><line x1="40" y1="100" x2="80" y2="100" stroke="#0b6e3f" stroke-width="1" stroke-dasharray="3 2"/><circle cx="30" cy="80" r="6" fill="#7c4f00"/><circle cx="20" cy="84" r="5" fill="#7c4f00"/><circle cx="40" cy="84" r="5" fill="#7c4f00"/><text x="30" y="70" font-size="8" text-anchor="middle" fill="#7c4f00">spoil</text><text x="160" y="195" font-size="9" text-anchor="middle" fill="#666">Sides sloped or shored, spoil set back ≥ 1 m</text></svg>`, caption: "Excavation deemed-to-satisfy." },
        { h: "Geotechnical investigation" },
        { p: "Required (and certified by a competent person, typically Pr.Sci.Nat / SACNASP) on dolomitic land, suspect compressible / collapsing / heaving sites, and any deep / multi-level basement." }
      ],
      keyTerms: ["G1", "G2", "shoring", "1.5 m", "spoil setback", "SACNASP"]
    },
    {
      id: "stormwater", icon: "🌧️", title: "Stormwater disposal (Part R)",
      summary: "Roof gutters, downpipes, surface channels — preventing water damage and erosion.",
      tag: "Part R",
      sections: [
        { h: "General requirement (R1)" },
        { p: "Stormwater from any roof or paved area must be disposed of in a manner that does not endanger health, damage the building, the adjoining land, or the public way." },
        { h: "Roof drainage detail" },
        { list: [
          "Gutters sized for the catchment area × design rainfall (≈ 65 mm/hr in most SA).",
          "≥ 1 downpipe per 12 m of gutter; downpipe Ø ≥ 75 mm for domestic.",
          "Discharge to a soakaway, channel or municipal stormwater system — not into the sewer.",
          "Downpipe outlets to drain at least 600 mm clear of foundations."
        ]},
        { svg: `<svg viewBox="0 0 320 200" width="100%" style="max-width:360px"><polygon points="40,80 160,30 280,80 280,90 40,90" fill="#7c4f00" stroke="#5a3a17" stroke-width="1"/><rect x="40" y="90" width="240" height="80" fill="#e8e0c8" stroke="#666"/><rect x="36" y="80" width="248" height="6" fill="#888"/><text x="160" y="78" font-size="8" text-anchor="middle" fill="#fff">gutter</text><rect x="56" y="86" width="6" height="84" fill="#2a6cb5"/><rect x="262" y="86" width="6" height="84" fill="#2a6cb5"/><line x1="59" y1="170" x2="59" y2="185" stroke="#2a6cb5" stroke-width="3" marker-end="url(#arr)"/><line x1="265" y1="170" x2="265" y2="185" stroke="#2a6cb5" stroke-width="3"/><circle cx="59" cy="190" r="3" fill="#2a6cb5"/><circle cx="265" cy="190" r="3" fill="#2a6cb5"/><text x="160" y="195" font-size="9" text-anchor="middle" fill="#666">≥75 mm Ø downpipes, ≥1 per 12 m gutter, discharge ≥600 mm from foundation</text></svg>`, caption: "Roof drainage layout." },
        { h: "Erf-level stormwater" },
        { list: [
          "Driveways, paving and hardscape must be graded so runoff does not flow onto adjoining property.",
          "Surface channels ≥ 75 mm deep; covered grates where they cross pedestrian routes.",
          "Soakaway sized per impervious area + soil permeability (sandy: small; clay: large or piped to street).",
          "Where the local authority operates a stormwater main, connection is mandatory."
        ]}
      ],
      keyTerms: ["soakaway", "downpipe", "65 mm/hr", "Reg R", "erf grading"]
    },
    {
      id: "publicsafety", icon: "🚧", title: "Public safety (Part D)",
      summary: "Boundary walls, swimming pools, fences, falls — protecting occupants and the public.",
      tag: "Part D",
      sections: [
        { h: "Scope of Part D" },
        { p: "Part D covers anything a building owner must do to keep the public — including children — safe in and around the property: pool fences, boundary-wall safety, balcony guards, falls onto adjoining land." },
        { svg: `<svg viewBox="0 0 320 180" width="100%" style="max-width:340px"><rect x="40" y="80" width="240" height="80" fill="#7ec8e3" stroke="#1a8a4a" stroke-width="2"/><text x="160" y="125" font-size="14" text-anchor="middle" fill="#fff" font-weight="700">POOL</text><line x1="20" y1="40" x2="20" y2="170" stroke="#0b6e3f" stroke-width="3"/><line x1="300" y1="40" x2="300" y2="170" stroke="#0b6e3f" stroke-width="3"/><line x1="20" y1="40" x2="140" y2="40" stroke="#0b6e3f" stroke-width="3"/><line x1="180" y1="40" x2="300" y2="40" stroke="#0b6e3f" stroke-width="3"/><rect x="140" y="40" width="40" height="55" fill="#fff" stroke="#0b6e3f" stroke-width="2"/><circle cx="172" cy="60" r="3" fill="#f5b800"/><text x="160" y="32" font-size="9" text-anchor="middle" fill="#0b6e3f">self-closing self-latching gate</text><text x="10" y="105" font-size="8" fill="#0b6e3f">≥1.2 m</text><line x1="305" y1="40" x2="315" y2="40" stroke="#0b6e3f"/><line x1="305" y1="170" x2="315" y2="170" stroke="#0b6e3f"/></svg>`, caption: "D4 swimming-pool barrier." },
        { h: "Swimming pools (D4)" },
        { list: [
          "All swimming pools must be enclosed by a wall / fence ≥ 1.2 m high.",
          "Self-closing, self-latching gates with the latch ≥ 1.2 m above ground (out of a child's reach).",
          "No openings in the barrier > 100 mm sphere.",
          "Pump and water-treatment installation must comply with SANS 10134."
        ]},
        { h: "Falls / balustrades (cross-ref Part M)" },
        { p: "Wherever a level change > 1 m exists (balconies, mezzanines, retaining walls accessible to people), a balustrade ≥ 1.0 m high with no gap > 100 mm Ø is required." },
        { h: "Excavations & site hoarding" },
        { p: "Open excavations on or near a public road must be fenced and lit at night. Hoardings on the public side ≥ 2.0 m high." }
      ],
      keyTerms: ["pool fence", "self-closing gate", "fall protection", "balustrade"]
    },
    {
      id: "siteops", icon: "🏗️", title: "Site operations (Part F)",
      summary: "Site fencing, sanitary, builder's sheds, waste, dust, public protection during construction.",
      tag: "Part F",
      sections: [
        { h: "Builder's site requirements (F1–F11)" },
        { list: [
          "F4 — Site fencing / hoarding adequate to protect the public.",
          "F8 — Waste material on site to be controlled and removed.",
          "F9 — Cleaning of site at completion.",
          "F10 — Builder's sheds: location, durability, sanitation provisions.",
          "F11 — Sanitary facilities for builders on site (1 WC per 30 workers as a guide)."
        ]},
        { h: "Geotechnical investigation (F3)" },
        { p: "Where required by the local authority (e.g. dolomite, problem soils), an investigation must be done and certified by a competent person — typically a Pr.Sci.Nat (SACNASP)." },
        { h: "Site protection of adjoining property" },
        { p: "F2 — owner is responsible for ensuring construction operations do not endanger or damage adjoining property or services." }
      ],
      keyTerms: ["hoarding", "site fencing", "site sanitary", "geotech", "dolomite"]
    },
    {
      id: "floors", icon: "📐", title: "Floors (Part J)",
      summary: "Floor strength, surface finish, mezzanines and suspended slabs.",
      tag: "Part J",
      sections: [
        { h: "Floor strength (J1)" },
        { p: "Every floor must safely support the loads imposed by the occupancy, plus all dead, live and imposed (action) loads per SANS 10160. Domestic floors ≈ 1.5 kPa imposed; storage / industrial much higher." },
        { svg: `<svg viewBox="0 0 320 200" width="100%" style="max-width:360px"><rect x="20" y="120" width="280" height="40" fill="#9aa6a0"/><text x="160" y="146" font-size="10" text-anchor="middle" fill="#fff">Compacted subgrade</text><rect x="20" y="100" width="280" height="20" fill="#c8c0a0"/><text x="160" y="114" font-size="9" text-anchor="middle" fill="#5a4a17">Hardcore + blinding</text><line x1="20" y1="100" x2="300" y2="100" stroke="#2a6cb5" stroke-width="2" stroke-dasharray="3 2"/><text x="306" y="103" font-size="8" fill="#2a6cb5">DPM</text><rect x="20" y="70" width="280" height="30" fill="#cfd8d4" stroke="#666"/><text x="160" y="88" font-size="10" text-anchor="middle" fill="#222">Concrete slab ≥100 mm + Ref 193 mesh</text><line x1="20" y1="50" x2="300" y2="50" stroke="#0b6e3f" stroke-width="2"/><text x="160" y="46" font-size="9" text-anchor="middle" fill="#0b6e3f">Finished Floor Level (FFL) ≥150 mm above outside ground</text><line x1="305" y1="50" x2="315" y2="50" stroke="#0b6e3f"/><line x1="305" y1="170" x2="315" y2="170" stroke="#0b6e3f"/></svg>`, caption: "Domestic ground-bearing slab (typical)." },
        { h: "Ground-bearing concrete slab (typical detail)" },
        { list: [
          "≥ 100 mm slab on a compacted, blinded, DPM-protected hardcore bed.",
          "Reinforcing mesh Ref 193 typical for domestic.",
          "Movement / control joints at ≈ 6 m and at re-entrant corners.",
          "No fall greater than is needed for drainage; finished floor level ≥ 150 mm above outside ground."
        ]},
        { h: "Suspended floors and mezzanines (J2-J4)" },
        { p: "Suspended slabs and mezzanines must have a rational structural design — no empirical option in Part H/J. Surface finish must suit the use (slip-resistance in wet areas, hard-wearing in service rooms)." }
      ],
      keyTerms: ["Ref 193 mesh", "DPM", "movement joint", "FFL"]
    },
    {
      id: "glazing", icon: "🪟", title: "Glazing (Part N)",
      summary: "Where safety glass is required, sizing rules, low-level glazing risks.",
      tag: "Part N",
      sections: [
        { svg: `<svg viewBox="0 0 320 200" width="100%" style="max-width:360px"><rect x="40" y="20" width="240" height="160" fill="#cfd8d4" stroke="#666" stroke-width="1"/><line x1="40" y1="100" x2="280" y2="100" stroke="#c8513e" stroke-width="2" stroke-dasharray="4 3"/><rect x="40" y="100" width="240" height="80" fill="rgba(200,81,62,.12)"/><text x="295" y="103" font-size="9" fill="#c8513e">800 mm</text><text x="160" y="142" font-size="11" text-anchor="middle" fill="#c8513e" font-weight="700">SAFETY GLASS REQUIRED</text><text x="160" y="158" font-size="9" text-anchor="middle" fill="#c8513e">(toughened or laminated)</text><line x1="40" y1="180" x2="40" y2="195" stroke="#0b6e3f"/><line x1="280" y1="180" x2="280" y2="195" stroke="#0b6e3f"/><line x1="40" y1="188" x2="280" y2="188" stroke="#0b6e3f"/><text x="160" y="180" font-size="9" text-anchor="middle" fill="#0b6e3f">Floor</text></svg>`, caption: "Within 800 mm of FFL — safety glass mandatory." },
        { h: "When safety glass is required (Part N + SANS 10400-N / SANS 10137)" },
        { list: [
          "All glazing within 800 mm of finished floor level (full-height windows, sidelights).",
          "All glazing in / next to doors (within 500 mm of the door edge, up to 1.5 m high).",
          "Wet-area glazing — bath / shower screens.",
          "Bathroom mirrors over hand-basins.",
          "Any pane > 1 m² in human-impact zones."
        ]},
        { h: "Types of safety glass" },
        { p: "Toughened (heat-strengthened, breaks into small dice) or laminated (PVB interlayer holds shards) — both acceptable for human-impact safety glazing." },
        { h: "Wind-load sizing" },
        { p: "Glass thickness selected per SANS 10137 wind-load tables — depends on pane size, shape, support condition, and the wind zone (1-4)." }
      ],
      keyTerms: ["safety glass", "toughened", "laminated", "SANS 10137"]
    },
    {
      id: "nonwater", icon: "🚽", title: "Non-water-borne sanitary (Part Q)",
      summary: "Pit latrines, ventilated improved pits (VIPs), dry sanitation systems where waterborne is impractical.",
      tag: "Part Q",
      sections: [
        { h: "When Part Q applies" },
        { p: "Where a waterborne sewer system is unavailable or impractical (rural / informal settlements), the building may use a non-water-borne sanitary system that meets Part Q." },
        { h: "Acceptable systems" },
        { list: [
          "Ventilated Improved Pit latrine (VIP) — vent pipe fitted with a fly-screen, ≥ 50 mm Ø.",
          "Pour-flush + on-site digester (e.g. septic + soakaway) per SANS 10252.",
          "Composting / urine-diverting dry toilet, where permitted by the local authority."
        ]},
        { h: "Siting & separation" },
        { p: "Pit / digester at least 30 m from any borehole or water source; downhill of any habitable structure; vent rises 500 mm above the highest point of the surrounding roof." },
        { h: "Owner duty" },
        { p: "Q1 — owner must maintain the system in a sanitary, hygienic condition. Local authority can require a connection to waterborne sewer once it becomes available." }
      ],
      keyTerms: ["VIP", "septic", "soakaway", "SANS 10252"]
    },
    {
      id: "disabled", icon: "♿", title: "Facilities for disabled persons (Part S)",
      summary: "Accessibility — ramps, doors, sanitary facilities, signage. Designs to SANS 10400-S.",
      tag: "Part S",
      sections: [
        { svg: `<svg viewBox="0 0 320 160" width="100%" style="max-width:340px"><rect x="20" y="120" width="280" height="14" fill="#7c4f00"/><polygon points="60,120 220,30 280,30 280,120" fill="#cfd8d4" stroke="#0b6e3f" stroke-width="2"/><line x1="60" y1="120" x2="220" y2="30" stroke="#c8513e" stroke-width="2"/><text x="135" y="80" font-size="11" fill="#c8513e" font-weight="700">1 : 12 max</text><line x1="60" y1="140" x2="220" y2="140" stroke="#0b6e3f"/><line x1="60" y1="138" x2="60" y2="142"/><line x1="220" y1="138" x2="220" y2="142"/><text x="140" y="155" font-size="10" text-anchor="middle" fill="#0b6e3f">Run (max 9 m before landing)</text><line x1="232" y1="40" x2="270" y2="40" stroke="#0b6e3f" stroke-width="2"/><text x="251" y="53" font-size="9" text-anchor="middle" fill="#0b6e3f">Landing 1.2 m</text><line x1="225" y1="20" x2="225" y2="70" stroke="#888"/><circle cx="225" cy="20" r="4" fill="#222"/><text x="225" y="14" font-size="8" text-anchor="middle" fill="#222">handrail 900</text></svg>`, caption: "Accessibility ramp 1:12 max + intermediate landing." },
        { h: "When Part S applies" },
        { p: "Public buildings (A1–A5, B, C, D, E, F, G occupancies) and any building open to the public must comply. Single dwellings (H4) are exempt unless the local authority specifies." },
        { h: "Ramps & approaches" },
        { list: [
          "Max gradient 1:12 for ramps, with intermediate landings every 9 m.",
          "Min ramp width 1.1 m (1.5 m where two wheelchairs may pass).",
          "Slip-resistant surface, raised edges or kerbs ≥ 75 mm.",
          "Handrail at 900 mm both sides; intermediate rail at 700 mm."
        ]},
        { h: "Doors and circulation" },
        { p: "Min door clear opening 800 mm; lever handles 800-1100 mm above floor; threshold ≤ 12 mm; turning circle 1.5 m at key decision points." },
        { h: "Sanitary facilities" },
        { list: [
          "≥ 1 accessible WC per public sanitary suite (1.5 × 2.2 m clear).",
          "WC pan rim 480 mm AFFL, grab rails 800 mm AFFL.",
          "Wash basin reachable from seated position; mirror low-mounted."
        ]},
        { h: "Signage & wayfinding" },
        { p: "International accessibility symbol; tactile signage at lift call buttons; visual + audible fire warning systems." }
      ],
      keyTerms: ["1:12 ramp", "800 mm door", "accessible WC", "SANS 10400-S"]
    },
    {
      id: "refuse", icon: "🗑️", title: "Refuse disposal (Part U)",
      summary: "Refuse rooms, chutes, on-site storage, separation from food / habitable areas.",
      tag: "Part U",
      sections: [
        { h: "Refuse storage rooms (U1)" },
        { list: [
          "Refuse storage room must be separately ventilated, with a wash-down water point and floor drain.",
          "Walls and floor finished in impervious, washable material (typically face-tiled or epoxy painted).",
          "Located so refuse can be removed without crossing kitchen or food-prep areas.",
          "Sized for the building's expected daily generation × collection interval."
        ]},
        { h: "Multi-storey refuse chutes" },
        { p: "Min Ø 450 mm (commonly 600 mm), smoke-tight inspection / charging hoppers per floor, terminating in a refuse room with a 60-min FR door (cross-ref Part T)." },
        { h: "Single dwellings" },
        { p: "Single houses: no formal refuse room — but a designated, screened bin storage location away from the front entry and at least 1 m from any window opening." }
      ],
      keyTerms: ["refuse chute", "FR door", "wash-down"]
    },
    {
      id: "spaceheat", icon: "🔥", title: "Space heating (Part V)",
      summary: "Fireplaces, chimneys, flues, hearths — combustion appliance safety.",
      tag: "Part V",
      sections: [
        { svg: `<svg viewBox="0 0 320 220" width="100%" style="max-width:340px"><polygon points="80,170 240,170 220,90 100,90" fill="#7c4f00" stroke="#5a3a17"/><rect x="130" y="130" width="60" height="40" fill="#222"/><polygon points="135,130 145,110 175,110 185,130" fill="#f5b800"/><rect x="60" y="170" width="200" height="14" fill="#cfd8d4" stroke="#666"/><text x="160" y="194" font-size="9" text-anchor="middle" fill="#0b6e3f">Hearth ≥300 mm in front, ≥150 mm each side, ≥125 mm thick</text><rect x="155" y="20" width="30" height="70" fill="#888" stroke="#444"/><text x="195" y="40" font-size="9" fill="#0b6e3f">Flue Ø ≥200 mm</text><text x="195" y="55" font-size="9" fill="#0b6e3f">+1 m above any roof</text><text x="195" y="70" font-size="9" fill="#0b6e3f">within 3 m</text><line x1="0" y1="85" x2="320" y2="85" stroke="#0b6e3f" stroke-dasharray="3 3"/><text x="10" y="80" font-size="8" fill="#0b6e3f">roof</text></svg>`, caption: "Hearth + flue clearance (Part V)." },
        { h: "Hearth (V1)" },
        { list: [
          "Non-combustible hearth ≥ 300 mm in front of the fireplace opening and ≥ 150 mm each side.",
          "Hearth thickness ≥ 125 mm for solid-fuel; can be reduced to 50 mm for closed gas appliance hearths.",
          "Hearth supported on non-combustible material — concrete or brick."
        ]},
        { h: "Chimney / flue" },
        { list: [
          "Min 200 mm flue Ø for solid fuel; manufacturer's spec for closed appliances.",
          "Chimney extends ≥ 1 m above the highest point of any roof within 3 m horizontally — and ≥ 600 mm above the ridge.",
          "Single-skin metal flue requires ≥ 50 mm clearance to combustible materials; double-skin reduces this to 25 mm."
        ]},
        { h: "Combustible separation" },
        { p: "Mantle / surround / framing must be at least 150 mm clear of the firebox opening; floor joists must not enter the chimney breast." }
      ],
      keyTerms: ["hearth", "flue", "chimney", "double-skin"]
    },
    {
      id: "fireinst", icon: "🚒", title: "Fire installations (Part W)",
      summary: "Water mains, hydrants, hose reels, sprinkler systems, fire pumps for buildings.",
      tag: "Part W",
      sections: [
        { h: "When Part W applies" },
        { p: "Buildings exceeding scale thresholds in Part T (most occupancies > 250 m² floor area, all multi-storey, public assembly) must have a Part-W fire installation." },
        { h: "Hose reels (W3)" },
        { list: [
          "Reach: every point on each storey within 30 m of a hose reel nozzle.",
          "Hose ≥ 30 m × 19 mm Ø with a control nozzle.",
          "Pressure ≥ 300 kPa at nozzle, flow ≥ 0.5 L/s."
        ]},
        { h: "Fire hydrants" },
        { p: "Fed off the same wet riser; spaced so any fire-resisting compartment is reachable within 30 m of a hydrant; flow rate ≥ 25 L/s at 300 kPa pressure." },
        { h: "Sprinklers (W6, where required)" },
        { p: "Designed to SANS 10287 / SANS 10400-W — coverage based on hazard class (light, ordinary, high). Wet pipe most common; dry pipe for unheated spaces." }
      ],
      keyTerms: ["hose reel", "hydrant", "wet riser", "SANS 10287", "sprinkler"]
    }
  ],

  glossary: [
    { term: "Acceptable / adequate / satisfactory", defn: "Capable of fulfilling the intended function; fit for the intended purpose. (Reg A1, 2008 amendment)" },
    { term: "Action", defn: "An assembly of concentrated or distributed mechanical forces acting on a building, or a cause of imposed deformation. Replaces the word 'load' as the design quantity since 2008." },
    { term: "Agrément certificate", defn: "A certificate issued by Agrément South Africa confirming fitness-for-purpose of a non-standardised product, material, component or design." },
    { term: "Approved competent person", defn: "A competent person whose appointment by the owner has been accepted by the local authority on Form 2." },
    { term: "Building Control Officer (BCO)", defn: "An official of the local authority responsible for administering the Act. Must be a registered architect, engineer or technologist trained at an accredited institution. (Reg A16)" },
    { term: "Competent person", defn: "Person qualified by education, training, experience and contextual knowledge to make determinations about building performance against a functional regulation. (2008 amendment)" },
    { term: "Contaminated land", defn: "Land that, due to substances within or under it, presents an unacceptable risk to occupants of buildings on the site. (2008)" },
    { term: "Deemed-to-satisfy provision", defn: "A non-mandatory requirement; complying with it ensures compliance with the corresponding functional regulation." },
    { term: "Dolomite land", defn: "Land underlain by dolomite or limestone rock at less than 60 m (limestone or controlled-water dolomite) or 100 m (uncontrolled-water dolomite)." },
    { term: "Fire installation", defn: "A water installation specifically intended for firefighting — hose reels, hydrants, sprinklers (Part W)." },
    { term: "Fire resistance", defn: "Ability of a building element to satisfy criteria of stability, integrity and insulation when tested per SANS 10177-2." },
    { term: "Functional regulation", defn: "A regulation written in qualitative terms — what must be achieved — without specifying methods, dimensions or materials." },
    { term: "Geotechnical site investigation", defn: "Process of evaluating the geotechnical character of a site, may include geology, hydrogeology, drilling, in-situ testing, sampling and laboratory analysis." },
    { term: "Habitable room", defn: "A room used as a living, sleeping, study or other primary occupancy purpose. Excludes WCs, storerooms, garages." },
    { term: "Inspection", defn: "General inspection by a competent person at intervals adequate to confirm design assumptions are valid and work matches the design — but excluding day-to-day supervision. (2008)" },
    { term: "Load", defn: "The value of a force corresponding to an action. (Updated 2008)" },
    { term: "Local authority", defn: "The municipality having jurisdiction over the site under the Local Government: Municipal Structures Act." },
    { term: "Minor building work", defn: "Defined work — small additions, free-standing walls ≤ 1.8 m, etc. — that may be exempted from full regulatory requirements." },
    { term: "NHBRC", defn: "National Home Builders Registration Council — statutory body under the Housing Consumers Protection Measures Act 95 of 1998." },
    { term: "Occupancy", defn: "The use to which a room, storey or building is put. Each is classified A1–J4 under Reg A20." },
    { term: "Persons with disabilities", defn: "Persons who have long-term physical, mental, intellectual or sensory impairments which in interaction with various barriers may hinder their full and effective participation in society on an equal basis with others. (2008)" },
    { term: "Prescriptive regulation", defn: "A regulation that describes in detail the operation, dimensions, materials and methods to be used." },
    { term: "Rational assessment", defn: "Assessment by a competent person of a solution's adequacy through reasoning, calculation, accepted analytical principles, deductions, research, testing and experience." },
    { term: "Rational design", defn: "Design by a competent person involving reasoning and calculation, possibly based on a standard or other suitable document." },
    { term: "Suitable", defn: "Capable of fulfilling the intended function; fit for purpose. (2008)" },
    { term: "Trained plumber", defn: "Plumber who has received the prescribed training, including those who have obtained a National Certificate in Construction Plumbing, NQF level 3. (2008)" }
  ],

  quizzes: [
    {
      moduleId: "intro",
      title: "What is NHBRC?",
      questions: [
        { q: "Under which Act is the NHBRC established?", opts: ["National Building Regulations and Building Standards Act 103 of 1977", "Housing Consumers Protection Measures Act 95 of 1998", "Construction Industry Development Board Act 38 of 2000", "Architectural Profession Act 44 of 2000"], a: 1, why: "The NHBRC is a creature of the Housing Consumers Protection Measures Act 95 of 1998. The 1977 Act governs building regulations themselves." },
        { q: "What is the NHBRC's primary protection period for major structural defects?", opts: ["1 year", "3 years", "5 years", "10 years"], a: 2, why: "5 years for major structural defects, 12 months for roof leaks, 3 months for non-compliance with the technical manual." },
        { q: "Which TWO routes does Reg AZ.4 give for satisfying functional regulations?", opts: ["Prescriptive only", "Deemed-to-satisfy OR rational design / assessment", "Local authority guesswork", "NHBRC self-certification only"], a: 1, why: "Reg AZ.4(1)(b)(i) and (ii) — comply with the relevant SANS 10400 part, OR demonstrate equivalent / superior performance via rational design or assessment by a competent person." },
        { q: "Before any new home is built for a housing consumer, the home must be:", opts: ["Painted by the NHBRC", "Enrolled with the NHBRC at least 15 days before construction", "Inspected by SABS", "Listed at the Deeds Office"], a: 1, why: "Enrolment is statutory under the Housing Consumers Protection Measures Act and triggers the warranty cover." }
      ]
    },
    {
      moduleId: "occupancy",
      title: "Occupancy classifications",
      questions: [
        { q: "A free-standing single-family house is classified as:", opts: ["H1", "H2", "H3", "H4"], a: 3, why: "H4 = Detached dwelling house. H3 is a domestic residence in flats / townhouses." },
        { q: "Which class is a primary school?", opts: ["A1 entertainment", "A3 places of instruction", "E2 hospital", "G1 offices"], a: 1, why: "A3 covers all places of instruction — schools, universities and training centres." },
        { q: "Population of an A4 (worship) building, where there are no fixed seats:", opts: ["1 person per 10 m²", "1 person per m²", "2 persons per bedroom", "16 persons per dwelling"], a: 1, why: "Reg A21 Table 2: A1, A2, A4 and A5 — number of fixed seats, OR 1 person per m² where there are no fixed seats." },
        { q: "A boiler room belongs to occupancy class:", opts: ["B1", "D4", "J4", "G1"], a: 1, why: "D4 = Plant room. Includes boiler rooms, switch rooms, machinery spaces." },
        { q: "Which class has a population of '16 persons per dwelling unit, max 4 per room'?", opts: ["H1 hotel", "H4 detached dwelling", "H5 hospitality", "G1 office"], a: 2, why: "H5 (hospitality / guest house added 2008): 16 persons per dwelling, max 4 per room." }
      ]
    },
    {
      moduleId: "plans",
      title: "Plans & approvals",
      questions: [
        { q: "What is the standard scale for a site plan after the 2008 amendment?", opts: ["1:100", "1:200", "1:250", "1:500"], a: 3, why: "Site plans are normally 1:500. The 2008 amendment changed an alternative for small erven from 1:300 to 1:250 — but 1:500 remains standard." },
        { q: "What colour is used on plans for new masonry?", opts: ["Red", "Green", "Blue", "Yellow"], a: 0, why: "Reg A5(6): new masonry is red, new concrete is green, new iron/steel is blue, new wood is yellow, new glass is black." },
        { q: "How many hours' notice must the owner give before commencing erection?", opts: ["48 hours", "24 hours", "12 hours", "1 week"], a: 1, why: "Reg A22 — at least 24 hours notice of intention to commence erection or demolition." },
        { q: "What colour represents soil and combined vents on a drainage plan?", opts: ["Brown", "Green", "Red", "Blue"], a: 2, why: "Brown = drains and soil pipes; green = waste pipes; RED = soil and combined vents; blue = waste vents." },
        { q: "Which form is the owner's declaration that lists each competent person and how each functional regulation will be met?", opts: ["Form 1", "Form 2", "Form 3", "Form 4"], a: 0, why: "Form 1 (in SANS 10400-A) is the owner's plans-application declaration. Form 2 is the competent person's own declaration." }
      ]
    },
    {
      moduleId: "competent",
      title: "Competent persons",
      questions: [
        { q: "Per Reg A19(9)(c), a local authority MAY refuse a competent person who:", opts: ["Is registered with ECSA", "Holds professional indemnity insurance", "Is not registered with ECSA, SACAP or SACNASP", "Has 5 years experience"], a: 2, why: "Acceptance can be refused where the person is not professionally registered with ECSA, SACAP, SACNASP or another relevant council." },
        { q: "If an appointed competent person resigns mid-project, the owner must:", opts: ["Stop construction permanently", "Carry on without one", "Appoint another approved competent person to take over both done and remaining work", "Wait 6 months for council to choose"], a: 2, why: "Reg A19(2): the owner must appoint and retain another approved competent person to take over both designed and remaining work." },
        { q: "The 2008 definition of 'inspection' EXCLUDES:", opts: ["General inspection at appropriate intervals", "Verification of design assumptions", "Day-to-day inspection and detailed supervision", "Inspection by a competent person"], a: 2, why: "'Inspection' in the regulations is general — not day-to-day. Day-to-day supervision is the contractor's site management." },
        { q: "Who countersigns sub-system designs and Form 3 confirmations?", opts: ["The local Building Inspector", "The owner", "The NHBRC", "The lead approved competent person"], a: 3, why: "Reg A19(8): the lead approved competent person verifies that all sub-designs co-ordinate and counter-signs them before submission." }
      ]
    },
    {
      moduleId: "structural",
      title: "Structural & foundations",
      questions: [
        { q: "Under Part B, an Pr.Eng's design must be based on which loading code?", opts: ["SANS 10100", "SANS 10160", "SANS 10162", "SANS 10005"], a: 1, why: "SANS 10160 covers basis of structural design and actions (loads). 10100 is concrete, 10162 is steel, 10005 is timber preservation." },
        { q: "Empirical foundation rules (Part H) DO apply to:", opts: ["Dolomite land", "A double-storey detached dwelling on stable Class 2 sand", "Heaving clay site class H2", "All buildings up to 5 storeys"], a: 1, why: "Empirical rules apply to up to two storey single dwellings on classified stable soils. Dolomite, heaving clay and tall buildings need rational design." },
        { q: "Minimum concrete strength for mass strip foundations:", opts: ["10 MPa", "15 MPa", "25 MPa", "40 MPa"], a: 1, why: "15 MPa is the empirical minimum for plain mass-strip foundations under Part H." },
        { q: "On dolomite land, who must do the geotechnical investigation?", opts: ["The home owner", "Any builder", "A competent person registered with SACNASP", "The local authority's BCO"], a: 2, why: "Reg F3 + 2008 definition: a geotechnical site investigation is by a competent person — typically registered with the South African Council for Natural Scientific Professions." }
      ]
    },
    {
      moduleId: "dimensions",
      title: "Dimensions",
      questions: [
        { q: "Minimum ceiling height for a habitable room (e.g. bedroom):", opts: ["2.1 m", "2.4 m", "2.6 m", "2.7 m"], a: 1, why: "CC3: habitable rooms are 2.4 m minimum floor to ceiling. Bathrooms, kitchens and passages are 2.1 m." },
        { q: "Minimum plan dimension of a habitable room:", opts: ["1.5 m", "1.8 m", "2.0 m", "2.4 m"], a: 2, why: "CC2: no habitable room may have a horizontal dimension less than 2.0 m." },
        { q: "Minimum area of a separate WC compartment:", opts: ["1.0 m²", "1.4 m²", "1.8 m²", "2.4 m²"], a: 1, why: "1.4 m² for a separate WC; 1.8 m² for a bathroom containing WC + basin." }
      ]
    },
    {
      moduleId: "walls",
      title: "Walls",
      questions: [
        { q: "Minimum height of a damp-proof course above finished ground:", opts: ["75 mm", "100 mm", "150 mm", "300 mm"], a: 2, why: "KK16: dpc must be at least 150 mm above finished ground level on all external and internal walls." },
        { q: "Cavity-wall ties: maximum vertical spacing per SANS 10400:", opts: ["300 mm", "450 mm", "600 mm", "900 mm"], a: 1, why: "4 ties per m² with max 900 mm horizontal × 450 mm vertical centres." },
        { q: "Maximum total length of openings on any storey of an empirical-design wall:", opts: ["⅓ of wall length", "½ of wall length", "⅔ of wall length", "No limit"], a: 0, why: "Empirical KK5 caps total openings at ⅓ of wall length on any storey to keep the wall acting as a load-bearing diaphragm." },
        { q: "Minimum lintel bearing each side of an opening:", opts: ["75 mm", "100 mm", "150 mm", "200 mm"], a: 2, why: "150 mm minimum bearing — important for stress transfer into the masonry." }
      ]
    },
    {
      moduleId: "roofs",
      title: "Roofs",
      questions: [
        { q: "Maximum spacing of cyclone clips / hoop-iron tying roof to walls:", opts: ["600 mm", "900 mm", "1.2 m", "1.5 m"], a: 2, why: "1.2 m maximum centres in normal wind zones. Tighter in coastal zones 3 & 4." },
        { q: "Minimum pitch for concrete roof tiles:", opts: ["12°", "17°", "26°", "30°"], a: 1, why: "Concrete tiles 17° minimum (with underlay); slate is 26°." },
        { q: "Stress-grade structural pine for roof timber must be treated to at least:", opts: ["H2", "H3", "H4", "H5"], a: 0, why: "H2 for protected interior, H3 for exposed conditions. H4/H5 are for ground/water contact." },
        { q: "Engineered timber trusses must:", opts: ["Be CE-marked", "Carry an SABS sticker", "Be designed by a competent person and stamped on each truss", "Be hand-cut on site"], a: 2, why: "Each engineered truss has a stamp identifying the design, the engineer or fabricator and the design loads." }
      ]
    },
    {
      moduleId: "drainage",
      title: "Drainage",
      questions: [
        { q: "Minimum diameter of a discharge pipe from a WC pan:", opts: ["50 mm", "75 mm", "100 mm", "150 mm"], a: 2, why: "WC discharge pipes are 100 mm. Wash basins are 32 mm; baths/showers/sinks are 40 mm." },
        { q: "Minimum trap-seal water depth on a normal fixture:", opts: ["25 mm", "50 mm", "75 mm", "100 mm"], a: 1, why: "50 mm minimum on most fixtures, 75 mm where the trap serves a back-inlet gully." },
        { q: "Hydraulic test for a drain before backfilling:", opts: ["1.0 m head for 60 min", "1.5 m head for 30 min", "2.0 m head for 30 min", "0.5 m head for 5 min"], a: 1, why: "PP26: 1.5 m head of water for 30 minutes with no detectable loss." },
        { q: "A vent pipe must extend above any opening within:", opts: ["2 m horizontally and 1 m above", "5 m horizontally and 1.5 m above", "10 m horizontally and 0.6 m above", "It need not"], a: 1, why: "Stacks must rise 1.5 m above any opening within 5 m horizontally to prevent foul air re-entering buildings." }
      ]
    },
    {
      moduleId: "fire",
      title: "Fire protection",
      questions: [
        { q: "Single-storey H4 detached house — minimum structural fire stability:", opts: ["No requirement", "30 min", "60 min", "120 min"], a: 1, why: "Table 5 in SANS 10400 — 30 minutes for single and double storey H4." },
        { q: "Maximum travel distance for a single-direction escape from an A3 (school) classroom:", opts: ["10 m", "20 m", "30 m", "45 m"], a: 1, why: "TT19: A1, A2, A3, A4 single-direction is 20 m; two directions is 45 m." },
        { q: "Minimum width of an escape route serving more than 50 persons:", opts: ["0.75 m", "0.9 m", "1.1 m", "1.5 m"], a: 2, why: "Escape route width = 0.5 m per 100 persons, with absolute minimum 1.1 m (or 0.9 m where it serves ≤ 50 persons)." },
        { q: "Maximum risers in a single flight of an escape stair:", opts: ["12", "14", "16", "20"], a: 2, why: "16 risers per flight, then a landing. Common designer mistake on tight stairs." }
      ]
    },
    {
      moduleId: "lightvent",
      title: "Lighting & ventilation",
      questions: [
        { q: "Minimum window glazed area as a percentage of room floor area for natural lighting:", opts: ["5%", "10%", "15%", "20%"], a: 1, why: "OO2: 10% of floor area as clear glazed window for natural light in any habitable room." },
        { q: "Minimum openable area for natural ventilation:", opts: ["5% of floor area", "10% of floor area", "15% of floor area", "1 m²"], a: 0, why: "OO4: 5% of floor area as actually openable area (window, louvre or door)." },
        { q: "If a bathroom has no opening, minimum mechanical extraction:", opts: ["3 ACH", "4 ACH", "6 ACH", "12 ACH"], a: 2, why: "6 air-changes per hour mechanical extraction where there is no opening." }
      ]
    },
    {
      moduleId: "stairs",
      title: "Stairways",
      questions: [
        { q: "For domestic H4 stairs, the rule 2R + G must fall in the range:", opts: ["400–550 mm", "550–700 mm", "700–850 mm", "Any"], a: 1, why: "MM2: 2R + G between 550 mm and 700 mm to feel comfortable to climb." },
        { q: "Balustrade is required wherever there is a fall greater than:", opts: ["0.5 m", "1.0 m", "1.5 m", "2.0 m"], a: 1, why: "MM3: required wherever fall exceeds 1.0 m." },
        { q: "Maximum gap that a 100 mm sphere may NOT pass through:", opts: ["Anywhere on a balustrade", "Only on stairs", "Only above 1 m", "Only in commercial buildings"], a: 0, why: "100 mm anti-climb / anti-fall rule applies anywhere on a balustrade — toddlers' heads must not pass through." }
      ]
    },
    {
      moduleId: "energy",
      title: "Energy (Part XA)",
      questions: [
        { q: "Part XA was introduced in:", opts: ["1990", "2008", "2011", "2020"], a: 2, why: "SANS 10400-XA was added in November 2011 — after the SABS 0400-1990 base and after the 2008 NBR amendment." },
        { q: "What proportion of hot-water heating volume must come from non-electric-resistance sources?", opts: ["25%", "50%", "75%", "100%"], a: 1, why: "At least 50% of the volume of hot water must be heated by means other than electric resistance — usually solar or heat pump." },
        { q: "Net floor area fenestration limit (without thermal modelling):", opts: ["10%", "15%", "20%", "30%"], a: 1, why: "15% of net floor area unless the design is justified by thermal modelling." }
      ]
    },
    {
      moduleId: "process",
      title: "Build approval process",
      questions: [
        { q: "Local authority must process plans for a building under 500 m² typically within:", opts: ["10 working days", "30 working days", "60 working days", "90 working days"], a: 1, why: "30 working days under 500 m², 60 working days for larger buildings." },
        { q: "After NHBRC's final inspection passes, the homeowner receives:", opts: ["A bond statement", "An NHBRC enrolment / 'Happy Letter'", "The original plans", "A SABS mark"], a: 1, why: "The 'Happy Letter' confirms the home is enrolled and in compliance — the trigger for warranty activation." },
        { q: "Without which document may a building NOT be occupied?", opts: ["Form 1", "Form 2", "Occupation Certificate", "Boundary surveyor report"], a: 2, why: "Reg A25 — the local authority's Occupation Certificate is statutory; occupying without it is an offence." }
      ]
    },
    {
      moduleId: "warranty",
      title: "NHBRC warranty",
      questions: [
        { q: "How long does NHBRC cover roof leaks caused by workmanship?", opts: ["3 months", "12 months", "5 years", "10 years"], a: 1, why: "12 months for roof leaks; 3 months for general non-compliance with the technical manual; 5 years for major structural defects." },
        { q: "Which is NOT a major structural defect?", opts: ["Foundation subsidence", "Settlement crack within agreed tolerance", "Roof structure failure", "Non-engineered wall collapse"], a: 1, why: "Cracks within the tolerable settlement range (typically ≤ 5 mm) are not warranty defects — they are normal." },
        { q: "If the builder fails to remedy a notified defect, the owner can:", opts: ["Sue NHBRC immediately", "Lodge a complaint with NHBRC; if unresolved the Warranty Fund pays for repair", "Withdraw the warranty", "Demolish the home"], a: 1, why: "NHBRC investigates first. If the builder still fails (or is liquidated), the Warranty Fund pays for rectification up to the cover limit." }
      ]
    }
  ]
};
