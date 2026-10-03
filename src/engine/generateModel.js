// Seeded problems for Boxes & Circles' "read the model" round (Karl, 2026-10-03): a picture of boxes, negative boxes and
// counters in columns, and the student writes the expression it shows. Some students draw the model well but can't read
// one back, so this goes the other way. Each problem is a Boxes & Circles expression (one term per column, as `+`
// terms with a signed value) with `mode: 'model'`: the picture is drawn from it and the expression itself is never shown.
// Pure logic, no DOM; a seed always gives the same set.

import { mulberry32, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeTerm, makeExpression, evaluate } from './terms.js';

export const MAX_COLUMN = 5;       // pieces in one column
export const MAX_PIECES = 11;      // pieces in the whole picture
const pick = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

// One candidate picture: 3 columns (sometimes 2 or 4), at least one box column and one counter column, and at least
// one negative (a negative box or a − counter) so the sign has to be read.
function candidate(rng) {
  const count = rng() < 0.65 ? 3 : rng() < 0.5 ? 2 : 4;
  const kinds = Array.from({ length: count }, () => (rng() < 0.5 ? 'x' : 'int'));
  if (!kinds.includes('x')) kinds[pick(rng, 0, count - 1)] = 'x';
  if (!kinds.includes('int')) kinds[(kinds.indexOf('x') + 1) % count] = 'int';
  const terms = kinds.map((kind) => makeTerm(kind, '+', (rng() < 0.4 ? -1 : 1) * pick(rng, 1, MAX_COLUMN)));
  return makeExpression(terms);
}

const pieces = (expr) => expr.terms.reduce((sum, t) => sum + Math.abs(t.value), 0);
const negBoxes = (expr) => expr.terms.some((t) => t.kind === 'x' && t.value < 0);
const negCounters = (expr) => expr.terms.some((t) => t.kind === 'int' && t.value < 0);
const key = (expr) => { const t = evaluate(expr); return `${t.x}|${t.n}`; };

export function generateModelLevel(seed) {
  const rng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const out = [];
  const seen = new Set();
  // The first picks are the required mix (negative boxes twice, negative counters twice), then anything that fits.
  const wants = [negBoxes, negCounters, negBoxes, negCounters, () => true];
  for (const want of wants) {
    for (let tries = 0; tries < 3000; tries++) {
      const expr = candidate(rng);
      const total = evaluate(expr);
      const negative = expr.terms.some((term) => term.value < 0);   // every picture has a negative to read
      if (!negative || pieces(expr) > MAX_PIECES || total.x === 0 || total.n === 0 || seen.has(key(expr)) || !want(expr)) continue;
      // two columns of one kind and sign next to each other would read as one: not worth the confusion
      if (expr.terms.some((t, i) => i > 0 && t.kind === expr.terms[i - 1].kind && Math.sign(t.value) === Math.sign(expr.terms[i - 1].value))) continue;
      seen.add(key(expr));
      out.push({ ...expr, mode: 'model' });
      break;
    }
  }
  if (out.length < PROBLEMS_PER_LEVEL) throw new Error(`Model level: could not build ${PROBLEMS_PER_LEVEL} problems for seed ${seed}`);
  // The required ones came first; mix the order so they aren't predictable.
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
