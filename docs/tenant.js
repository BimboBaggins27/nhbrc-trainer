// Tenant manifest — describes WHO this build of the platform is for.
//
// The Trainer Engine ships content-agnostic. A "tenant" is a JSON-ish
// description that wires a specific cert prep (NHBRC, SACAP, ECSA, SAIQS,
// CIDB, FET coursework…) into the same engine.
//
// Swap this file (or the data*.js + quiz-extra*.js files it points to) to
// re-skin the entire app for a different domain. No engine changes needed.

window.TRAINER_TENANT = {
  id: "nhbrc-sa",
  name: "NHBRC Trainer",
  domain: "South African National Building Regulations",
  authority: "Independent (not affiliated with NHBRC or SABS)",
  brand: {
    primary: "#0b6e3f",       // SA flag green
    primaryDark: "#0e8a4f",
    accent: "#f5b800",
    icon: "🏠",
  },
  // Globals supplied by the tenant — the engine reads from these.
  // Each is loaded by its own script tag in index.html.
  contentRefs: {
    data: "NHBRC_DATA",          // data.js
    library: "NHBRC_LIBRARY",    // library.js
    regulations: "NHBRC_REGS",   // regulations.js
    quizExtra: "NHBRC_QUIZ_EXTRA",
    calculators: "NHBRC_CALCULATORS",
  },
  // Pricing (drives the Unlock view)
  pricing: {
    currency: "ZAR",
    founderPrice: 199,
    listPrice: 399,
    founderSeats: 50,
    paystackPayPage: "https://paystack.shop/pay/f2qzss5120",
  },
  // Marketing copy (drives landing + checkout)
  marketing: {
    headline: "Pass the NHBRC homebuilder competency assessment.",
    sub: "Curated study modules, calculators, mock tests, and offline access — built for SA builders, students, and site supervisors.",
    valueProps: [
      "29 modules covering every Part of SANS 10400 (A → XA)",
      "13 on-site calculators (bricks, mortar, concrete, rebar, plaster, paint, tiling, excavation, beams, cube tests…)",
      "Mock NHBRC test simulator (50 q · 60 min · 70% pass mark)",
      "Master Quiz with smart coverage — 250+ questions",
      "Bundled public-domain SA legislation, offline",
      "Privacy-first: localStorage only, no analytics, no trackers",
    ],
  },
  // Honest scope
  disclaimers: {
    short: "Independent study aid — not affiliated with NHBRC or SABS.",
    long: "This trainer is a learning service. The official SANS 10400 standards (paid, from SABS) and the NHBRC Home Building Manual must be obtained from their publishers and consulted before any plan submission.",
  },
};
