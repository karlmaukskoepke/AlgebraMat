// "Try a number" (Build V2, Karl 2026-11-02): after a right conclusion ("No solution" or "Infinitely many") on Strange solutions, an
// optional experiment. The student types any number (a whole number, a fraction, or a decimal, which is read as the exact fraction), drags
// it into every x of the ORIGINAL equation (one drop per x: x is gone from the work, so the original is the one to try) and steps through
// the usual check; then the balance picture shows the two sides (view/balance.js) with one line in Karl's words from the exact values,
// and the line after it that names the pattern. Never graded, never red, no Undo, nothing recorded (no answers, tags or supports), and it
// does not change the problem: it stays solved. Not in a no-help attempt (the screen does not offer it there). No DOM here.
//
//   s.trial   { typing, entry, den, part, note, sub, result }  (entry, den, part: one box as typed, `3/2`; Build AF)   the try in hand (null before the button is pressed)
//   s.trials  [{ value, left, right }]                                  every finished try on this problem (exact fractions)

import { readFraction, frac, lowest, fracText } from './fraction.js';
import { linear } from './bothSides.js';
import { substitutionLines, xCount, signed } from './solveTerms.js';
import { fractionLines } from './fractionCheck.js';
import { MINUS } from './expr.js';
import { boxKey } from './fractionBox.js';

const TOP_MAX = 3;
const BOTTOM_MAX = 2;
export const tryOpen = (s) => s.stage === 'done' && Boolean(s.concluded);
export const trialTyping = (s) => tryOpen(s) && Boolean(s.trial?.typing);

// a side's exact value at x = v (the problem's own pieces, groups included)
export function sideValue(side, v) {
  const { a, b } = linear(side);                 // (whole numbers: a fraction factor's products are whole on this card)
  return lowest({ n: a * v.n + b * v.d, d: v.d });
}
// What the balance says: { heavier: 'left' | 'right' | 'balanced', diff, left, right } from exact fractions
export function compareAt(problem, v) {
  const left = sideValue(problem.left, v);
  const right = sideValue(problem.right, v);
  const d = lowest({ n: left.n * right.d - right.n * left.d, d: left.d * right.d });
  return { left, right, diff: { n: Math.abs(d.n), d: d.d }, heavier: d.n > 0 ? 'left' : d.n < 0 ? 'right' : 'balanced' };
}
const shown = (v) => fracText(v);
// Karl's line: "x = 3/2. Right side is heavier by 4." / "x = 3. Balanced."
export function balanceLine(v, cmp) {
  const head = `x = ${shown(v)}.`;
  if (cmp.heavier === 'balanced') return `${head} Balanced.`;
  return `${head} ${cmp.heavier === 'left' ? 'Left' : 'Right'} side is heavier by ${shown(cmp.diff)}.`;
}
// The line after, by type: the pattern, said gently
export function patternLine(type, cmp) {
  if (type === 'all') return 'Try another number: it balances every time.';
  return `Try another number: it is still heavier by ${shown(cmp.diff)}.`;
}

// a typed value: a whole number or a fraction (the top, `/`, the bottom), or a decimal read as its exact fraction (1.5 is 3/2)
export function readTry(top, bottom) {
  const t = String(top ?? '').replace(MINUS, '-');
  if (/^-?\d*\.\d+$/.test(t) && !bottom) {
    const places = t.split('.')[1].length;
    const n = Math.round(Number(t) * 10 ** places);
    return { value: lowest(frac(n, 10 ** places)) };
  }
  if (/\./.test(`${t}${bottom ?? ''}`)) return { key: 'tUnreadable' };
  const r = readFraction(t, bottom ?? '');
  return r.key ? { key: 'tUnreadable' } : { value: lowest(r.value) };
}

const fresh = () => ({ typing: true, entry: '', den: '', part: 'num', note: null, sub: null, result: null });

// The try's own actions, or undefined for anything that is not the try's. `s` is a fresh copy (the caller cloned it).
export function reduceTry(s, action) {
  if (!tryOpen(s)) return undefined;
  if (action.type === 'tryOpen' || action.type === 'tryAgain') {
    if (s.trial?.sub && !s.trial.result) return 'ignore';                      // (a check under way finishes first)
    s.trial = fresh();
    s.trials = s.trials ?? [];
    return s;
  }
  const t = s.trial;
  if (!t) return undefined;
  if (t.typing) {
    if (action.type === 'focus' && action.target === 'tryBox') {                // (a click on the box clears it, as on x =)
      Object.assign(t, { entry: '', den: '', part: 'num', note: null });
      return s;
    }
    if (['digit', 'toggleSign', 'typeChar', 'backspace'].includes(action.type)) return typeTry(s, t, action);
    if (action.type === 'check' || action.type === 'tryGo') return checkTry(s, t);
    return action.type === 'next' ? undefined : 'ignore';
  }
  if (t.sub && !t.result) {
    if (action.type === 'placeValue') {
      if (!t.sub.placing) return 'ignore';
      const xs = t.sub.xs ?? 1;
      if (xs > 1) {
        const at = Number.isInteger(action.index) && action.index >= 0 && action.index < xs ? action.index : [...Array(xs).keys()].find((i) => !t.sub.filled.includes(i));
        if (at === undefined) return 'ignore';
        if (!t.sub.filled.includes(at)) t.sub = { ...t.sub, filled: [...t.sub.filled, at] };
        if (t.sub.filled.length < xs) return s;
      }
      t.sub = { ...t.sub, placing: false, step: 1 };
      return s;
    }
    if (action.type === 'nextLine') {
      if (t.sub.placing) return 'ignore';
      t.sub = { ...t.sub, step: t.sub.step + 1 };
      if (t.sub.step >= t.sub.lines.length) finishTry(s, t);                   // (the last line written: the balance shows, no mark)
      return s;
    }
    return action.type === 'next' ? undefined : 'ignore';
  }
  return undefined;
}

// one key in the box (the same rules as the answer's box, engine/fractionBox.js); a decimal point once, in the top (1.5 is 3/2)
function typeTry(s, t, action) {
  const next = boxKey({ top: t.entry, bottom: t.den, part: t.part ?? 'num' }, action, {
    topMax: TOP_MAX, bottomMax: BOTTOM_MAX, dot: (b) => (b.part !== 'den' && !b.top.includes('.') ? { ...b, top: `${b.top}.` } : null),
  });
  if (!next) return 'ignore';
  Object.assign(t, { entry: next.top, den: next.part === 'den' ? next.bottom : '', part: next.part, note: null });
  return s;
}

function checkTry(s, t) {
  if (t.entry === '' || t.entry === '-') { t.note = 'tTypeFirst'; return s; }
  if (t.part === 'den' && t.den === '') return 'ignore';                          // (`3/` waits for its bottom: Build AF)
  if (t.part === 'den' && /^0+$/.test(t.den)) { t.note = 'tZeroBottom'; return s; }
  const r = readTry(t.entry, t.den);
  if (r.key) { t.note = r.key; return s; }
  const v = r.value;
  const target = s.rows[0].board;
  const lines = v.d === 1 ? substitutionLines(target, v.n).lines : fractionLines(target, v).lines;
  const cmp = compareAt(s.problem, v);
  t.typing = false;
  t.note = null;
  t.sub = { kind: 'value', typed: v.d === 1 ? v.n : fracText(v), value: v, ok: cmp.heavier === 'balanced', tag: null, target: 'original', lines, placing: true, step: 0, xs: xCount(target), filled: [], trial: true };
  return s;
}

function finishTry(s, t) {
  const v = t.sub.value;
  const cmp = compareAt(s.problem, v);
  t.result = { value: v, ...cmp, line: balanceLine(v, cmp), after: patternLine(s.problem.type, cmp), work: workingOf(t.sub.lines[0], cmp) };
  s.trials = [...(s.trials ?? []), { value: v, left: cmp.left, right: cmp.right }];
}

// The totals with their working, as on Karl's page: each side of the check's first line, then its total (`4(3/2) + 2 = 8`)
export function workingOf(line, cmp) {
  const text = line.segs.map((seg) => seg.text ?? '').join('');
  const [l, r] = text.split(' = ');
  return { left: `${l} = ${shown(cmp.left)}`, right: `${r} = ${shown(cmp.right)}` };
}

export const TRY_NOTES = {
  tTypeFirst: 'Type a number for x first.',
  tUnreadable: 'Type a whole number, a fraction like 3/2, or a decimal like 1.5.',
  tZeroBottom: 'The bottom of a fraction can’t be 0.',
};
export { signed };
