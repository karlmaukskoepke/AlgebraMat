// Boxes & Circles step 2: the Mat drawn in every state, using the notes' two
// examples (and one crowded problem), so the look can be checked against the
// notes before any moves are built. Shown only at ?demo=boxes; the pack still
// says Coming soon.

import { makeTerm, makeExpression, formatExpression, evaluate, formatAnswer } from '../engine/terms.js';
import { piecesForExpression, cancelAll } from '../engine/termPieces.js';
import { generateTermLevel } from '../engine/generateTerms.js';
import { renderBoxMat } from './boxMat.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);

const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);       // 3x − 5 + 7 − x
const EX2 = makeExpression([n('+', -5), x('-', 2), x('-', 1), n('-', -7)]);     // −5 − 2x − x − (−7)

// Parts: [3x] [−][5] [+][7] [−][x]   and   [−5] [−][2x] [−][x] [−][(−7)]
const SHAPES1 = [
  { kind: 'box', from: 0, to: 0 }, { kind: 'circle', from: 1, to: 2 },
  { kind: 'circle', from: 3, to: 4 }, { kind: 'box', from: 5, to: 6 },
];
const SHAPES2 = [
  { kind: 'circle', from: 0, to: 0 }, { kind: 'box', from: 1, to: 2 },
  { kind: 'box', from: 3, to: 4 }, { kind: 'circle', from: 5, to: 6 },
];

const answer = (e, done = true) => ({ text: formatAnswer(evaluate(e)), done });

// The most crowded problem the generator makes (most pieces, then most terms).
function crowded() {
  let best = null;
  for (const level of [3, 4, 5]) for (let seed = 1; seed <= 40; seed++) {
    for (const e of generateTermLevel(level, seed * 31)) {
      const pieces = e.terms.reduce((sum, t) => sum + Math.abs(t.value), 0);
      if (!best || pieces + e.terms.length > best.score) best = { e, score: pieces + e.terms.length };
    }
  }
  return best.e;
}

export function demos() {
  const big = crowded();
  const p1 = piecesForExpression(EX1);
  const p2 = piecesForExpression(EX2);
  const pb = piecesForExpression(big);
  return [
    {
      caption: `${formatExpression(EX1)}: Box & Circle done. Boxes are rounded squares around x terms; pills go around numbers. Each includes the sign in front.`,
      state: { expr: EX1, shapes: SHAPES1 },
    },
    {
      caption: 'The − left out of the last box: a dashed shape means it is not finished.',
      state: { expr: EX1, shapes: [...SHAPES1.slice(0, 3), { kind: 'box', from: 6, to: 6, complete: false }] },
    },
    {
      caption: 'Dragging from the − across the x: the parts under the finger light up before letting go.',
      state: { expr: EX1, shapes: SHAPES1.slice(0, 3), selecting: { from: 5, to: 6 } },
    },
    {
      caption: 'Draw: pieces stand above their term, two to a row, with the key from the notes (□ = x, −□ = −x).',
      state: { expr: EX1, shapes: SHAPES1, pieces: p1, key: true },
    },
    {
      caption: 'Cancel: one piece picked (dashed ring), waiting for its partner.',
      state: { expr: EX1, shapes: SHAPES1, pieces: p1, selected: { term: 0, index: 0 } },
    },
    {
      caption: `Cancel done and answered: ${formatExpression(EX1)} = ${formatAnswer(evaluate(EX1))}.`,
      state: { expr: EX1, shapes: SHAPES1, pieces: cancelAll(p1), answer: answer(EX1) },
    },
    {
      caption: 'Typing the answer: the line fills in as the student types.',
      state: { expr: EX1, shapes: SHAPES1, pieces: cancelAll(p1), answer: { text: '2x +', done: false } },
    },
    {
      caption: `${formatExpression(EX2)}: the − (−7) is rewritten, so it says "is +7" and draws magenta + counters.`,
      state: { expr: EX2, shapes: SHAPES2, rewritten: [3], pieces: cancelAll(p2), answer: answer(EX2) },
    },
    {
      caption: `The most crowded problem the levels make: ${formatExpression(big)}. Everything must still fit.`,
      state: { expr: big, shapes: [], pieces: pb, key: true },
    },
  ];
}

export function showBoxDemo(body) {
  for (const id of ['home', 'play']) document.getElementById(id)?.setAttribute('hidden', '');
  const page = document.createElement('main');
  page.className = 'box-demo';
  page.append(Object.assign(document.createElement('h1'), { textContent: 'Boxes & Circles: the Mat (preview)' }));
  for (const d of demos()) {
    const figure = document.createElement('figure');
    figure.append(renderBoxMat(d.state), Object.assign(document.createElement('figcaption'), { textContent: d.caption }));
    page.append(figure);
  }
  body.append(page);
}
