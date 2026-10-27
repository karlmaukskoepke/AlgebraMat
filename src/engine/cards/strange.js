// Strange solutions (Build V, basic form): Variables on both sides' card (engine/cards/bothSides.js: the same loop, layers, moves, help,
// x-on-one-side rule and no forced move) with answers that are fractions or 0 (loop spec rev 2.11, §4A). What is its own:
//   - the answer is typed in two boxes, `x = [ ]/[ ]`: digits go into the top, `/` (or Tab, ↓) to the bottom, Shift+Tab or ↑ back, a click
//     on a box clears it; the minus is the top's; a whole number is the top alone; a decimal point is refused ("Write it as a fraction");
//   - an unsimplified fraction (`15/6`) is nudged, never red and never checked: "Can you simplify this further?", and after a second try
//     "Divide the top and the bottom by the same number." (tag `unsimplified`, recorded `hint` only with the second line);
//   - the check works with fractions exactly (engine/fractionCheck.js);
//   - dividing never fails: dividing by the number in front of x writes `x = 15/6` (a `ratio` term; nothing worked out for the student);
//     a divide by another number that would leave a fraction beside x is not made, said kindly ("Divide by 6, the number in front of x.");
//     `−x = 15/6` (divided by 6) flips to `x = −(15/6)`;
//   - its shapes (engine/solveit/shape.js, family 'strange') and their reminders (engine/solveit/rungs/strange.js).
// No DOM here.

import { makeBothCard, singleTerm, xAlone } from './bothSides.js';
import { coefOn, otherTerm, mapSides, xWith } from '../fractionMove.js';
import { fracOf } from '../divideBoard.js';
import { FRACTIONS } from '../divide.js';
import { newId } from '../lightsGrab.js';
import { readFraction, isLowest, same, fracText } from '../fraction.js';
import { tagStrange } from '../generateStrange.js';
import { substitutionLines, xCount, signed } from '../solveTerms.js';
import { fractionLines } from '../fractionCheck.js';

const TOP_MAX = 3;
const BOTTOM_MAX = 2;
const fracTerm = (n, inner, sign) => (sign < 0 ? { ...fracOf(n, inner), sign: -1 } : fracOf(n, inner));
export const hasRatio = (board) => [...board.left, ...board.right].some((t) => t.kind === 'ratio' || (t.kind === 'neg' && t.inner?.[0]?.kind === 'ratio'));
// a value as the screen shows it: a whole number stays a number (every other card's displays), a fraction is its text, `−5/2`
const shownValue = (v) => (v.d === 1 ? v.n : fracText(v));

// Is x = where the keys go? (not while Add's blank, a sum, the distribute blanks or a Multiply blank takes them)
export const answerTyping = (s, loop) => loop.answerLive(s) && !(s.menu === 'add' && s.typing !== 'answer') && !s.mopts?.kind && !s.lx?.combine && !s.lx?.distribute && !s.lx?.calc
  && !(s.menu === 'fraction' && s.typing !== 'answer');

// ---------- typing the answer: the top, then the bottom ----------
const KEYS = new Set(['digit', 'toggleSign', 'typeChar', 'backspace', 'ansPart']);
function typeAnswer(s, action, api) {
  if (s.sub) {
    if (!(s.sub.kind === 'value' && s.sub.step >= api.subTotal(s.sub) && !s.sub.ok)) return 'ignore';
    s.sub = null;                                                                    // (after a wrong value the first key clears its check)
  }
  if (!api.answerLive(s)) return 'ignore';
  let top = s.entry ?? '';
  let bottom = s.den ?? '';
  let part = s.part ?? 'num';
  let sel = Boolean(s.denSel);
  // (after the simplify nudge the first digit starts the fraction again; the boxes keep what was typed until then, to look at)
  if (s.ansFresh && (action.type === 'digit' || action.type === 'toggleSign')) { top = ''; bottom = ''; part = 'num'; }
  // (a decimal point is written where it was typed, so the student sees what they typed, and is answered at once: Build V)
  const dot = action.type === 'typeChar' && (action.ch === '.' || action.ch === ',');
  if (dot) { if (part === 'num') top += '.'; else bottom += '.'; }
  const toBottom = (action.type === 'typeChar' && action.ch === '/') || (action.type === 'ansPart' && action.part === 'den');
  // (moving to the bottom selects what is there: the next digit replaces it, as the fraction blank's boxes do, Build P)
  if (toBottom) { if (part !== 'den' && bottom !== '') sel = true; part = 'den'; }
  else if (action.type === 'ansPart') part = 'num';
  else if (dot) { /* written above */ }
  else if (action.type === 'toggleSign' || (action.type === 'typeChar' && action.ch === '-')) top = top.startsWith('-') ? top.slice(1) : `-${top}`;   // (the minus is the top's)
  else if (action.type === 'digit') {
    if (!Number.isInteger(action.digit)) return 'ignore';
    if (part === 'num') { if (top.replace('-', '').length >= TOP_MAX) return 'ignore'; top += String(action.digit); }
    else { if (sel) { bottom = ''; sel = false; } if (bottom.length >= BOTTOM_MAX) return 'ignore'; bottom += String(action.digit); }
  } else if (action.type === 'backspace') {
    if (part === 'den' && bottom === '') part = 'num';
    else if (part === 'den') { bottom = sel ? '' : bottom.slice(0, -1); sel = false; }
    else top = top.slice(0, -1);
  } else return 'ignore';
  if (part !== 'den') sel = false;
  if (top === (s.entry ?? '') && bottom === (s.den ?? '') && part === (s.part ?? 'num') && sel === Boolean(s.denSel)) return 'ignore';
  api.fold(s);                                                                       // typing a value commits the move before it
  Object.assign(s, { entry: top, den: bottom, part, denSel: sel, typing: 'answer', ansFresh: false });
  return dot ? api.say(s, 'sNoDecimal', {}, false) : s;
}

// ---------- the check: a fraction read from the two boxes ----------
function check(s, api) {
  if (s.sub) return s;
  if (/\./.test(`${s.entry}${s.den}`)) return api.say(s, 'sNoDecimal', {}, false);
  const r = readFraction(s.entry, s.den);
  if (r.key) return api.say(s, r.key, {}, true);
  if (!api.answerLive(s)) return 'ignore';
  const v = r.value;
  // not simplified (`15/6`, `0/5`): a nudge, whatever the value (so it never gives away that the value is right); nothing is checked
  if (v.d > 1 && !isLowest(v)) {
    s.simplifyTries = (s.simplifyTries ?? 0) + 1;
    if (!s.tags.includes('unsimplified')) s.tags.push('unsimplified');
    const second = s.simplifyTries >= 2;
    if (second && !s.supportsShown.includes('hint')) s.supportsShown.push('hint');
    Object.assign(s, { ansFresh: true, part: 'num' });
    return api.say(s, 'sSimplify', { second }, false);
  }
  const p = s.problem;
  const correct = same(v, p.ans);
  const kind = api.alone(s) ? 'value' : 'guess';
  const tag = correct ? null : tagStrange(p, v);
  const typed = shownValue(v);
  if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: v.d === 1 ? String(v.n) : `${v.n}/${v.d}`, tag }); }
  s.guessedFirst = correct && kind === 'guess' && s.rows.length === 1 && s.history.length === 0;
  const current = !correct && kind === 'guess';
  const target = current ? s.board : s.rows[0].board;
  // (a whole number on a board with no fraction: the same check as every other card; anything else, exactly with fractions)
  const lines = v.d === 1 && !hasRatio(target) ? substitutionLines(target, v.n).lines : fractionLines(target, v).lines;
  s.sub = { kind, typed, value: v, ok: correct, tag, target: current ? 'current' : 'original', lines, placing: true, step: 0, xs: xCount(target), filled: [] };
  return api.say(s, 'aPlace', { typed: signed(typed), where: s.sub.target });
}

// ---------- dividing never fails ----------
function take(s, action, api, MOVE) {
  if (s.menu !== 'fraction' || !FRACTIONS.includes(action.n) || !singleTerm(s.board)) return undefined;
  const other = otherTerm(s.board);
  const a = coefOn(s.board);
  const n = action.n;
  const sign = action.sign === -1 ? -1 : 1;
  if (other.kind === 'num' && a % n === 0 && other.v % n === 0) return undefined;    // it splits: the shared move
  const g = api.blockMove(s);
  if (g) return 'ignore';
  // only the number in front of x is divided by here: anything else would leave a fraction beside x (`6x = 15` ÷ 2 is `3x = 15/2`)
  if (other.kind !== 'num' || n !== Math.abs(a)) return api.say(s, 'sDivideFront', { a: Math.abs(a), n, minus: other.kind !== 'num' }, false);
  const before = s.board;
  api.pushHistory(s);
  s.hint = null;
  const work = mapSides(before, (terms) => [fracTerm(n, [terms[0]], sign)]);
  const next = mapSides(before, (terms, mine) => (mine ? xWith(terms[0], (a * sign) / n) : [{ id: newId(), kind: 'ratio', n: other.v * sign, d: n }]));
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { n, ...(sign < 0 ? { sign } : {}) }, helpful: true, lights: s.lights });
  s.fail = null;
  return MOVE.say(s, xAlone(next) ? 'aSolvedBoard' : 'aFindX');
}

// `−x = 15/6` flipped: `−1(−x) = −1(15/6)`, then `x = −(15/6)` (the other side is never worked out for the student)
function flipRatio(s, api, MOVE) {
  const g = api.blockMove(s);
  if (g) return g;
  if (xAlone(s.board)) return MOVE.say(s, 'aSolvedBoard');
  api.fold(s);
  api.pushHistory(s);
  const before = s.board;
  const a = coefOn(before);
  const r = otherTerm(before);
  const work = mapSides(before, (terms) => [{ id: newId(), kind: 'times', f: -1, inner: [terms[0]] }]);
  const next = mapSides(before, (terms, mine) => (mine ? xWith(terms[0], -a) : [-a === 1 ? { id: newId(), kind: 'neg', inner: [r] } : { ...r, id: newId(), n: -r.n }]));
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { flip: true }, helpful: a < 0, lights: s.lights });
  s.flipCount = (s.flipCount ?? 0) + 1;
  return MOVE.say(s, xAlone(next) ? 'aSolvedBoard' : 'aFindX');
}

const own = {
  reduce(s, action, api, MOVE) {
    if (KEYS.has(action.type) && answerTyping(s, { answerLive: api.answerLive })) return typeAnswer(s, action, api);
    switch (action.type) {
      case 'check': return check(s, api);
      // a click on either box clears it and puts the cursor in it (Build H)
      case 'focus':
        if (action.target !== 'ansTop' && action.target !== 'ansBottom') return undefined;
        if (!api.answerLive(s)) return 'ignore';
        if (s.sub) { if (!(s.sub.kind === 'value' && s.sub.step >= api.subTotal(s.sub) && !s.sub.ok)) return 'ignore'; s.sub = null; }
        Object.assign(s, action.target === 'ansTop' ? { entry: '', part: 'num' } : { den: '', part: 'den' }, { denSel: false });
        Object.assign(s, { typing: 'answer', ansFresh: false });
        return s;
      case 'take': return take(s, action, api, MOVE);
      case 'flip': return singleTerm(s.board) && otherTerm(s.board).kind === 'ratio' ? flipRatio(s, api, MOVE) : undefined;
      case 'choose': case 'addPick':
        // (`−x = 15/6`: Add has nothing to cancel; flip it)
        if ((action.type === 'addPick' || action.move === 'add') && hasRatio(s.board) && !xAlone(s.board)) return MOVE.say(s, 'sFlipFirst');
        return undefined;
      case 'undo':
        if (s.sub?.kind === 'guess' && !s.sub.ok) Object.assign(s, { den: '', part: 'num' });                      // (the loop clears the top)
        return undefined;
      case 'startOver':
        Object.assign(s, { den: '', part: 'num', ansFresh: false });
        return undefined;
      default:
        return undefined;
    }
  },
  extra: { den: '', part: 'num', denSel: false, ansFresh: false, simplifyTries: 0 },
  loop: {
    tag: (p, typed) => tagStrange(p, typeof typed === 'number' ? { n: typed, d: 1 } : typed),
    answerText: (p) => fracText(p.ans),
    // a wrong value: the boxes clear so the student retypes (the loop clears the top), with a second sentence where a slip says more
    slip: (s, typed, tag) => {
      Object.assign(s, { den: '', part: 'num' });
      const hint = ['frac-swapped', 'frac-no-divide'].includes(tag);
      if (hint && !s.supportsShown.includes('hint')) s.supportsShown.push('hint');
      return { key: 'wWrong', params: { typed: signed(typed), tag, ...(hint ? { more: tag } : {}) } };
    },
  },
};

const CARD = makeBothCard({ id: 'strange-solutions', family: 'strange', own });
export const newStrange = CARD.newSession;
export const solve = CARD.loop;
export const STRANGE_MENU = CARD.MENU;
export const STRANGE_LAYER = CARD.LAYER;
export { xAlone };
