// Groups of Terms step 2: the Mat drawn in every state, so the look can be checked
// against the notes before any moves are built. Shown only at ?demo=groupterms;
// the pack still says Coming soon.

import { makeTermGroups, formatTermGroups, answerText, piecesOfGroup, groupCount, pieceTotal } from '../engine/termGroups.js';
import { generateTermGroupsLevel } from '../engine/generateTermGroups.js';
import { renderTermGroupMat } from './termGroupMat.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });

// A Mat state for a problem: its groups filled, optionally flipped and answered.
function state(problem, { filled = true, flipped = false, answer = false, taken, totalText = null, checkIt = false } = {}) {
  const fraction = problem.count.d > 1;
  const count = fraction ? problem.count.d : groupCount(problem);
  const per = piecesOfGroup(problem, fraction);
  const takenN = fraction ? taken ?? 0 : 0;
  return {
    problem,
    opposite: problem.count.neg,
    groups: Array.from({ length: count }, (_, i) => ({
      pieces: filled ? per : [],
      taken: fraction && i < takenN,
      flipped: flipped && (!fraction || i < takenN),
    })),
    answer: answer ? answerText(problem) : null,
    totalText, checkIt,
  };
}

// The most crowded problem the generator makes (most pieces, then most ovals).
function crowded(whole) {
  let best = null;
  for (let level = 1; level <= 8; level++) for (let seed = 1; seed <= 30; seed++) {
    for (const p of generateTermGroupsLevel(level, seed * 31)) {
      if ((p.count.d > 1) === whole) continue;
      const score = pieceTotal(p) * 10 + groupCount(p) + (p.count.neg ? 100 : 0);
      if (!best || score > best.score) best = { p, score };
    }
  }
  return best.p;
}

function demos() {
  const a = makeTermGroups({ n: 3 }, [x(2), n(-1)]);                          // 3(2x − 1)
  const b = makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]);               // −2(x − 4), the notes' example
  const c = makeTermGroups({ n: 1, d: 2 }, [x(4), n(6)]);                     // 1/2(4x + 6)
  const d = makeTermGroups({ neg: true, n: 2, d: 3 }, [x(3), n(-6)]);         // −2/3(3x − 6)
  const e = makeTermGroups({ neg: true, n: 3 }, [n(4), x(-1)]);               // −3(4 − x), a challenge level
  const hidden = makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)], { hidden1: true }); // −(x + 3)
  const wide = makeTermGroups({ neg: true, n: 2 }, [x(4), n(5)]);              // −2(4x + 5): the widest ovals
  const bigWhole = crowded(true);
  const bigFraction = crowded(false);
  return [
    { caption: `${formatTermGroups(a)}: three ovals, each a group of 2 boxes and a negative counter. Boxes are green, as everything inside a group is.`, state: state(a) },
    { caption: 'The answer typed so far, after the arrow.', state: state(a, { totalText: '6x −' }) },
    { caption: `Done: ${formatTermGroups(a)} = ${answerText(a)}.`, state: state(a, { answer: true }) },
    { caption: `Check it: an arrow from A to each term, and the two products. (${formatTermGroups(a)} = ${answerText(a)})`, state: state(a, { answer: true, checkIt: true }) },
    { caption: `${formatTermGroups(b)}: − groups. The − stands beside each oval, and tapping it flips the group.`, state: state(b) },
    { caption: `Flipped: each group is redrawn on the right, every piece turned to its opposite in magenta, with no −. ${formatTermGroups(b)} = ${answerText(b)}.`, state: state(b, { flipped: true, answer: true }) },
    { caption: `${formatTermGroups(hidden)}: the opposite of one group (the hidden 1).`, state: state(hidden, { flipped: true, answer: true }) },
    { caption: `Challenge level: the number comes first, so the oval holds counters, then the negative box. ${formatTermGroups(e)} = ${answerText(e)}.`, state: state(e, { flipped: true, answer: true }) },
    { caption: `${formatTermGroups(c)}: B dealt out into 2 equal parts (2 boxes and 3 counters each), take 1.`, state: state(c, { taken: 1, answer: true }) },
    { caption: `${formatTermGroups(d)}: − fraction. Take 2 of 3 parts, then flip them into a bar of their own. ${formatTermGroups(d)} = ${answerText(d)}.`, state: state(d, { taken: 2, flipped: true, answer: true }) },
    { caption: `Check it for a fraction: ${formatTermGroups(c)}.`, state: state(c, { taken: 1, answer: true, checkIt: true }) },
    { caption: `Check it with a negative A: ${formatTermGroups(b)}.`, state: state(b, { flipped: true, answer: true, checkIt: true }) },
    { caption: `The most crowded whole-number problem the levels make: ${formatTermGroups(bigWhole)}, flipped. Everything must still fit.`, state: state(bigWhole, { flipped: true, answer: true }) },
    { caption: `The widest ovals the levels make (9 pieces each): ${formatTermGroups(wide)}, flipped.`, state: state(wide, { flipped: true, answer: true }) },
    { caption: `The most crowded fraction problem: ${formatTermGroups(bigFraction)}.`, state: state(bigFraction, { taken: bigFraction.count.n, flipped: true, answer: true }) },
  ];
}

export function showTermGroupDemo(body) {
  for (const id of ['home', 'play']) document.getElementById(id)?.setAttribute('hidden', '');
  const page = document.createElement('main');
  page.className = 'box-demo';
  page.append(Object.assign(document.createElement('h1'), { textContent: 'Groups of Terms: the Mat (preview)' }));
  for (const demo of demos()) {
    const figure = document.createElement('figure');
    figure.append(renderTermGroupMat(demo.state), Object.assign(document.createElement('figcaption'), { textContent: demo.caption }));
    page.append(figure);
  }
  body.append(page);
}
