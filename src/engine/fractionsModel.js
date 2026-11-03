// The model on Fractions of x (Build AA, Karl 2026-11-01): a box (x) cut into equal parts, in the look of Group It's fraction walk (the
// parts of one bar, brackets). The first scaffold: drawn on its own on the first problem of Levels 1 and 3, then on I'm stuck's first click
// and as the hint after a wrong value and Undo. For `⅔x = 6`:
//   1. cut   the student chooses the cut: 2 to 6 equal parts (the bottom says 3)
//   2. select  click p parts (the top says 2), then Go: they are labelled with the given number (these 2 parts are 6)
//   3. value   type what one part is worth (6 / 2 = 3); for a unit fraction the one part is the given number, nothing to type. After it the
//              app writes the equivalent equation as a row of its own, "one part": `⅓x = 3`, made from the typed amount
//   4. fill    click each other part to fill it with that amount
//   5. x       the whole box is x: the student types it in the usual x = field (the sum of the parts)
// A negative fraction is drawn with its minus moved to the other side (`−⅔x = 6` is `⅔x = −6`). Every step takes a click or a key; Tab
// reaches every part and Enter selects or fills it. The app never writes x's value. No DOM here.

import { numTerm } from './divideBoard.js';
import { xSideOf, mapSides } from './fractionMove.js';
import { typeInto, isTyping } from './entry.js';
import { signed } from './solveTerms.js';

export const CUTS = [2, 3, 4, 5, 6];

// The model of a problem: the parts it has to be cut into, how many are given, what they make (the minus moved over)
export function newModel(p, { auto = false, help = false } = {}) {
  const given = p.neg ? -p.b : p.b;
  return { auto, help, step: 'cut', q: null, want: p.q, p: p.p, given, part: given / p.p, sel: [], entry: '', typed: null, filled: [] };
}
export const modelOpen = (s) => Boolean(s.model);
// What the model asks at its step (its caption when the last thing said was not the model's: Undo, a move's words)
export const STEP_KEY = { cut: 'mCutAsk', select: 'mSelectAsk', value: 'mValueAsk', fill: 'mFillAsk', x: 'mXAsk' };
export const stepParams = (m) => ({ p: m.p, q: m.want, given: signed(m.given), part: signed(m.part), rest: m.want - m.p });
export const modelTyping = (s) => s.model?.step === 'value';
// the parts that hold a value now (selected after Go, or filled), each with its value; null for an empty part
export function partValues(m) {
  if (!m.q) return [];
  const labelled = m.step === 'fill' || m.step === 'x';
  return Array.from({ length: m.q }, (_, i) => (m.filled.includes(i) || (labelled && m.sel.includes(i)) ? m.part : null));
}

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...params }, bad }; return s; };
const P = (m) => ({ p: m.p, q: m.want, given: signed(m.given), part: signed(m.part), rest: m.want - m.p });

// The model's own actions: undefined when the action is not the model's.
export function modelReduce(s, action, api) {
  const m = s.model;
  if (!m || s.stage !== 'moves' || s.sub) return undefined;
  if (m.step === 'value' && isTyping(action)) {
    const entry = typeInto(m.entry, action, 'integer');
    if (entry === m.entry) return 'ignore';
    s.model = { ...m, entry };
    s.feedback = null;
    return s;
  }
  switch (action.type) {
    case 'mCut': {
      if (m.step !== 'cut') return 'ignore';
      const q = Number(action.q);
      if (!CUTS.includes(q)) return 'ignore';
      if (q !== m.want) return say(s, 'mCutWrong', { ...P(m), typed: q });
      s.model = { ...m, q, step: 'select' };
      return say(s, 'mSelectAsk', P(m));
    }
    case 'mPart': {
      const i = Number(action.i);
      if (!m.q || !Number.isInteger(i) || i < 0 || i >= m.q) return 'ignore';
      if (m.step === 'select') {
        const sel = m.sel.includes(i) ? m.sel.filter((k) => k !== i) : [...m.sel, i].sort((a, b) => a - b);
        s.model = { ...m, sel };
        return say(s, 'mSelectAsk', P(m));
      }
      if (m.step === 'fill') {
        if (m.sel.includes(i)) return say(s, 'mFillSelected', P(m));
        if (m.filled.includes(i)) return 'ignore';
        const filled = [...m.filled, i];
        const done = filled.length + m.sel.length >= m.q;
        s.model = { ...m, filled, step: done ? 'x' : 'fill' };
        return say(s, done ? 'mXAsk' : 'mFillAsk', P(m));
      }
      return 'ignore';
    }
    case 'mGo': {
      if (m.step === 'select') {
        if (m.sel.length !== m.p) return say(s, 'mSelectWrong', { ...P(m), chose: m.sel.length });
        // (the chosen parts are drawn first, side by side, so one bracket says what they make)
        const sel = Array.from({ length: m.p }, (_, i) => i);
        if (m.p === 1) { s.model = { ...m, sel, step: 'fill' }; return say(s, 'mFillAsk', P(m)); }
        s.model = { ...m, sel, step: 'value', entry: '' };
        return say(s, 'mValueAsk', P(m));
      }
      if (m.step === 'value') {
        if (!/^-?\d+$/.test(m.entry)) return say(s, 'mValueType', P(m), false);
        const v = Number(m.entry);
        if (v !== m.part) { s.model = { ...m, entry: '' }; return say(s, 'mValueWrong', { ...P(m), typed: signed(v) }); }
        // the bridge to symbols: the equation for one part, from the typed amount, as a row of its own ("one part")
        const g = api.blockMove(s);
        if (g) return g;
        api.fold(s);
        s.model = { ...m, entry: '' };                                        // (Undo comes back to an empty box: the question asked again)
        api.pushHistory(s);
        const t = s.board[xSideOf(s.board)][0];
        const one = { ...t, id: `${t.id}'1`, coef: 1 };
        const next = mapSides(s.board, (terms, mine) => (mine ? [one] : [numTerm(v)]));
        s.board = next;
        s.rows.push({ type: 'fold', label: { part: true }, board: next });
        s.moveStart = s.rows.length;
        s.model = { ...m, typed: v, step: 'fill' };
        return say(s, 'mFillAsk', P(m));
      }
      return 'ignore';
    }
    default:
      return undefined;
  }
}
