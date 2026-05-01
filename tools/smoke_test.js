// Headless smoke test: load the data.js module text, validate shape.
const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, '..', 'docs', 'data.js'), 'utf8');
// Run in a fake window so the IIFE assigns NHBRC_DATA.
const win = {};
new Function('window', data)(win);
const D = win.NHBRC_DATA;

let errors = 0;
function ok(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); errors++; }
}

ok(D, 'NHBRC_DATA exists');
ok(D.modules.length >= 10, `modules >=10 (got ${D.modules.length})`);
ok(D.glossary.length >= 20, `glossary >=20 (got ${D.glossary.length})`);
ok(D.quizzes.length >= 10, `quizzes >=10 (got ${D.quizzes.length})`);

// Each quiz should map to a real module and every answer index in range
const ids = new Set(D.modules.map(m => m.id));
for (const q of D.quizzes) {
  ok(ids.has(q.moduleId), `quiz moduleId ${q.moduleId} matches a module`);
  for (const qq of q.questions) {
    ok(Number.isInteger(qq.a) && qq.a >= 0 && qq.a < qq.opts.length,
       `answer index in range for "${qq.q}"`);
    ok(qq.opts.length >= 2, `at least 2 options in "${qq.q}"`);
    ok(qq.why && qq.why.length > 5, `explanation present in "${qq.q}"`);
  }
}

// Each module section validation
let svgCount = 0, swatchCount = 0, chipsCount = 0;
for (const m of D.modules) {
  ok(m.id && m.title && m.summary, `module ${m.id} has id/title/summary`);
  ok(Array.isArray(m.sections) && m.sections.length, `module ${m.id} has sections`);
  for (const s of m.sections) {
    if (s.table) {
      ok(Array.isArray(s.table.head) && Array.isArray(s.table.rows),
         `table in module ${m.id} has head and rows`);
      const cols = s.table.head.length;
      for (const r of s.table.rows) {
        ok(r.length === cols,
           `row width matches header in module ${m.id}: expected ${cols} got ${r.length}`);
      }
    }
    if (s.svg) {
      svgCount++;
      ok(s.svg.includes('<svg'), `svg section in ${m.id} contains <svg`);
      ok(s.svg.includes('</svg>'), `svg section in ${m.id} closes properly`);
    }
    if (s.swatches) {
      swatchCount++;
      ok(D.planColours[s.swatches], `swatches "${s.swatches}" exists in planColours`);
    }
    if (s.chips) {
      chipsCount++;
      ok(s.chips === 'occupancy', `chips type "${s.chips}" supported`);
    }
  }
}

// About + visual data validation
ok(D.about, 'about block exists');
ok(D.about?.sourcePdf?.url, 'sourcePdf.url present');
ok(Array.isArray(D.about?.laws) && D.about.laws.length >= 3, 'at least 3 laws');
ok(Array.isArray(D.planColours?.materials), 'planColours.materials');
ok(Array.isArray(D.planColours?.drainage), 'planColours.drainage');
ok(Array.isArray(D.occupancyChips) && D.occupancyChips.length >= 29, 'occupancyChips >= 29');
ok(D.occupancyChips.some(c => c.spotlight), 'at least one spotlight chip');
console.log(`Visuals: ${svgCount} SVG · ${swatchCount} swatches · ${chipsCount} chip grids`);

console.log(`Modules: ${D.modules.length}`);
console.log(`Glossary entries: ${D.glossary.length}`);
console.log(`Quizzes: ${D.quizzes.length}`);
console.log(`Total questions: ${D.quizzes.reduce((s, q) => s + q.questions.length, 0)}`);
console.log(errors ? `\n${errors} ERROR(S)` : '\nAll checks passed');
process.exit(errors ? 1 : 0);
