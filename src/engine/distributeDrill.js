// The Distribute drill (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md B6), behind ?ui=lights&drill=distribute: two fixed problems on the lights
// screen, solved only by grabbing terms. The Add card's engine has no parentheses, so the drill keeps its own small board (numbers,
// x terms with a coefficient, and a factor times a parenthesis) and its own reducer, built from the same pieces as the Add card's
// round 2 (engine/lightsGrab.js): tap a minus (B4), drag the factor onto its parenthesis and type one product per term (B6), reorder
// (B1), carry a number across the line (B2), combine like terms by typing the sum (B3). Only Solved for x is judged: it lights when
// the value typed in x = is right. No DOM here.

import { isTyping, typeInto } from './entry.js';
import { signed } from './addBoth.js';
import { MINUS } from './expr.js';
import {
  findTerm, outcomeOf, reorderBoard, combineBoard, pairText, valueOf, newId, otherSide, termText,
} from './lightsGrab.js';

const num = (v) => ({ id: newId(), kind: 'num', v });
const xs = (coef = 1) => ({ id: newId(), kind: 'x', coef });
const group = (factor, inner) => ({ id: newId(), kind: 'group', factor, inner });

// The two problems: 5 − 2(x + 2) = 3 (x = −1) and 3(x + 1) = 9 (x = 2).
export const DRILL_PROBLEMS = [
  { kind: 'drill', id: 'd1', text: '5 − 2(x + 2) = 3', x: -1, board: () => ({ left: [num(5), group(-2, [xs(1), num(2)])], right: [num(3)] }) },
  { kind: 'drill', id: 'd2', text: '3(x + 1) = 9', x: 2, board: () => ({ left: [group(3, [xs(1), num(1)])], right: [num(9)] }) },
];

const UI0 = { preview: false, focus: null, shake: false, light: null, hoverMove: null, carry: null };
const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params, bad }; return s; };
const sideOfX = (board) => (board.left.some((t) => t.kind !== 'num') ? 'left' : 'right');

export function newDrill(problem) {
  const board = problem.board();
  const s = {
    drill: true, problem: { kind: problem.kind, id: problem.id, text: problem.text, x: problem.x }, stage: 'moves', step: 'moves', scaffold: false, sub: null, pending: null, combining: null, resolving: false,
    menu: null, amountEntry: '', typing: null, board, rows: [{ type: 'eq', board }], history: [], work: null,
    lights: { fewer: 'off', solved: 'off' }, undoCue: false, startOver: false, hint: null, entry: '', clean: true, wrongs: 0,
    lx: {
      awaitNext: null, rules: [], forced: false, movedOnce: true, moves: 0, negIds: [], combine: null, distribute: null, mult: null, hand: { fewer: 'off' },
      log: {
        drags: 0, outcomes: { reorder: 0, cross: 0, combine: 0, distribute: 0, snapBack: 0, keyboard: 0 }, minusTaps: 0,
        lightHovers: {}, moveHovers: {}, sumsWrong: 0, productsWrong: 0, refusedMinus: 0,
      },
    },
    ui: { ...UI0 },
    feedback: null,
  };
  return say(s, 'dxStart');
}

const canGrab = (s) => s.stage === 'moves' && !s.lx.combine && !s.lx.distribute && !s.lx.mult;
// Flip everything and Multiply (Build D, Part 3), so the drill can be finished from `−2x = 2`: every term on both sides.
const mapTerms = (board, f) => ({ left: board.left.map(f), right: board.right.map(f) });
const flipTerm = (t) => (t.kind === 'num' ? { ...t, v: -t.v } : t.kind === 'x' ? { ...t, coef: -(t.coef ?? 1) } : { ...t, factor: -t.factor });
const splits = (t, n) => (t.kind === 'num' ? t.v % n === 0 : t.kind === 'x' ? (t.coef ?? 1) % n === 0 : t.factor % n === 0);
const divTerm = (t, n) => (t.kind === 'num' ? { ...t, v: t.v / n } : t.kind === 'x' ? { ...t, coef: (t.coef ?? 1) / n } : { ...t, factor: t.factor / n });
// The end of the drill: x alone with a negative in front, the other side a number: Flip everything is the move (a hint lights it).
export const needsFlip = (board) => {
  const xSide = board.left.some((t) => t.kind === 'x') ? 'left' : 'right';
  const xs = board[xSide];
  const other = board[xSide === 'left' ? 'right' : 'left'];
  return xs.length === 1 && xs[0].kind === 'x' && (xs[0].coef ?? 1) < 0 && other.length === 1 && other[0].kind === 'num';
};
const snapshot = (s) => ({ board: s.board, rows: [...s.rows], negIds: [...s.lx.negIds], work: s.work });
// The labels over the product blanks: "−2 · x", "−2 · 2".
export const productLabels = (g) => g.inner.map((t) => `${signed(g.factor)} · ${t.kind === 'x' ? 'x' : signed(t.v)}`);
const product = (g, t) => g.factor * valueOf(t);

// A move across the line: the number and its opposite on the side it left (struck, they cancel), the opposite added on the other side.
function crossBoard(board, id) {
  const f = findTerm(board, id);
  const amount = -f.term.v;
  const from = board[f.side];
  const to = board[otherSide(f.side)];
  const work = {
    [f.side]: [...from.map((t) => ({ term: t, struck: t.id === id })), { term: num(amount), added: true, struck: true }],
    [otherSide(f.side)]: [...to.map((t) => ({ term: t })), { term: num(amount), added: true }],
    amount,
  };
  const left = from.filter((t) => t.id !== id);
  return { work, board: { [f.side]: left.length ? left : [num(0)], [otherSide(f.side)]: [...to, num(amount)] } };
}

export function reduceDrill(state, action) {
  if (action.type === 'ui') {
    const patch = action.patch ?? {};
    if (patch.carry && !canGrab(state)) return state;
    const next = { ...state, ui: { ...state.ui, ...patch } };
    if (JSON.stringify(next.ui) === JSON.stringify(state.ui)) return state;
    for (const [key, field] of [['light', 'lightHovers'], ['hoverMove', 'moveHovers']]) {
      if (patch[key] && patch[key] !== state.ui[key]) next.lx = { ...next.lx, log: { ...next.lx.log, [field]: { ...next.lx.log[field], [patch[key]]: (next.lx.log[field][patch[key]] ?? 0) + 1 } } };
    }
    return next;
  }
  if (state.stage === 'done') return state;
  const lx = state.lx;
  const s = structuredClone(state);
  s.ui = { ...UI0 };

  // ----- typing: the products of a distribute, the sum of a combine, the number of a multiply, or x = -----
  if (isTyping(action)) {
    if (lx.mult) {
      s.lx.mult = { entry: typeInto(lx.mult.entry, action, 'integer') };
      s.ui.focus = 'mult';
      return s;
    }
    if (lx.distribute) {
      const d = s.lx.distribute;
      const entry = typeInto(d.wrong === d.focus ? '' : d.entries[d.focus], action, 'integer');
      d.entries[d.focus] = entry;
      d.wrong = null;
      s.ui.focus = `prod:${d.focus}`;
      return say(s, 'dxProducts');
    }
    if (lx.combine) {
      const c = s.lx.combine;
      c.entry = typeInto(c.wrong ? '' : c.entry, action, 'integer');
      c.wrong = false;
      s.ui.focus = 'sum';
      return say(s, 'lxCombineAsk', { sum: pairText(s.board, c.a, c.b), x: findTerm(s.board, c.a).term.kind === 'x' });
    }
    const entry = typeInto(s.entry, action, 'integer');
    if (entry === state.entry) return state;
    s.entry = entry;
    s.ui.focus = 'answer';
    return s;
  }

  switch (action.type) {
    case 'focus': {
      if (action.target === 'dist' && lx.distribute) { s.lx.distribute.focus = Number(action.index) || 0; s.ui.focus = `prod:${s.lx.distribute.focus}`; return s; }
      if (action.target === 'answer') { s.ui.focus = 'answer'; return s; }
      return state;
    }
    case 'choose': {
      if (action.move === 'flip' && canGrab(state)) {
        s.history.push(snapshot(state));
        s.board = mapTerms(s.board, flipTerm);
        s.lx.negIds = [];
        s.rows.push({ type: 'eq', board: s.board });
        return say(s, 'dxFlipped');
      }
      if (action.move === 'multiply' && canGrab(state)) { s.lx.mult = { entry: '' }; s.ui.focus = 'mult'; return say(s, 'dxMultAsk'); }
      if (action.move === 'multiply' && lx.mult) { s.lx.mult = null; return say(s, 'dxStart'); }
      return say(s, 'dxDragOnly');
    }
    case 'greyMove':
      return say(s, 'dxDragOnly');
    case 'lxCancel':
      if (state.ui.carry) return { ...state, ui: { ...state.ui, carry: null } };
      if (lx.combine || lx.distribute || lx.mult) { s.lx.combine = null; s.lx.distribute = null; s.lx.mult = null; return say(s, 'dxStart'); }
      return state;

    // ----- B4: a minus shown as a negative (and back) -----
    case 'lxMinus': {
      const f = findTerm(s.board, action.id);
      if (!canGrab(state) || !f || f.at === 0 || valueOf(f.term) >= 0) return state;
      const shown = s.lx.negIds.includes(action.id);
      s.history.push(snapshot(state));
      s.lx.negIds = shown ? s.lx.negIds.filter((x) => x !== action.id) : [...s.lx.negIds, action.id];
      s.lx.log.minusTaps += 1;
      s.ui.focus = `tok:${action.id}`;
      if (shown) return s;
      const { body } = termText(f.term, f.at, true);
      return say(s, f.term.kind === 'group' ? 'dxNegFactor' : 'lxNegShown', { neg: f.term.kind === 'group' ? signed(f.term.factor) : body });
    }

    // ----- B6: the factor dropped on its parenthesis -----
    case 'lxDistribute': {
      const f = findTerm(s.board, action.id);
      if (!canGrab(state) || f?.term.kind !== 'group') return state;
      s.lx.log.drags += 1;
      if (action.how === 'key') s.lx.log.outcomes.keyboard += 1;
      // a subtracted factor must be seen as a negative number first
      if (f.term.factor < 0 && f.at > 0 && !s.lx.negIds.includes(f.term.id)) {
        s.lx.log.outcomes.snapBack += 1;
        s.lx.log.refusedMinus += 1;
        s.ui.focus = `tok:${f.term.id}:f`;
        return say(s, 'dxTapMinusFirst', { factor: signed(f.term.factor) });
      }
      s.lx.log.outcomes.distribute += 1;
      s.lx.distribute = { group: f.term.id, entries: f.term.inner.map(() => ''), focus: 0, wrong: null };
      s.ui.focus = 'prod:0';
      return say(s, 'dxProducts');
    }
    case 'lxApply':
    case 'go': {
      if (lx.mult) {
        const n = Number(lx.mult.entry);
        if (!/^-?\d+$/.test(lx.mult.entry) || n === 0) { s.ui = { ...UI0, shake: true, focus: 'mult' }; return s; }
        if (![...s.board.left, ...s.board.right].every((t) => splits(t, n))) return say(s, 'dxMultNo', { n: signed(n) }, true);
        s.history.push(snapshot(state));
        s.board = mapTerms(s.board, (t) => divTerm(t, n));
        s.lx.negIds = [];
        s.rows.push({ type: 'eq', board: s.board });
        s.lx.mult = null;
        s.ui.focus = 'answer';
        return say(s, 'dxMultiplied');
      }
      if (lx.distribute) {
        const d = s.lx.distribute;
        const g = findTerm(s.board, d.group).term;
        const ok = (k) => /^-?\d+$/.test(d.entries[k]);
        // Enter goes from a filled blank to the next empty one; with every blank filled it applies
        const empty = d.entries.findIndex((_, k) => !ok(k));
        if (empty >= 0) {
          if (action.type === 'go' && ok(d.focus)) { d.focus = empty; s.ui.focus = `prod:${empty}`; return s; }
          s.ui = { ...UI0, shake: true, focus: `prod:${empty}` };
          return s;
        }
        const wrong = g.inner.findIndex((t, k) => Number(d.entries[k]) !== product(g, t));
        if (wrong >= 0) {
          d.wrong = wrong;
          d.focus = wrong;
          s.lx.log.productsWrong += 1;
          s.ui.focus = `prod:${wrong}`;
          return say(s, 'dxProductWrong', { product: productLabels(g)[wrong], typed: d.entries[wrong].replace('-', MINUS) }, true);
        }
        // right: the products in the place of the parenthesis, the other terms brought down; written "+ −2x + −4" as in the notes
        s.history.push(snapshot(state));
        const f = findTerm(s.board, d.group);
        const made = g.inner.map((t) => (t.kind === 'x' ? xs(product(g, t)) : num(product(g, t))));
        const side = [...s.board[f.side]];
        side.splice(f.at, 1, ...made);
        s.board = { ...s.board, [f.side]: side };
        s.lx.negIds = [...s.lx.negIds.filter((x) => x !== g.id), ...made.filter((t) => valueOf(t) < 0).map((t) => t.id)];
        s.rows.push({ type: 'eq', board: s.board });
        s.lx.distribute = null;
        return say(s, 'dxDistributed');
      }
      if (lx.combine) {
        const c = s.lx.combine;
        if (!/^-?\d+$/.test(c.entry)) { s.ui.shake = true; s.ui.focus = 'sum'; return s; }
        const total = valueOf(findTerm(s.board, c.a).term) + valueOf(findTerm(s.board, c.b).term);
        const params = { sum: pairText(s.board, c.a, c.b), typed: c.entry, x: findTerm(s.board, c.a).term.kind === 'x' };
        if (Number(c.entry) !== total) { c.wrong = true; s.lx.log.sumsWrong += 1; s.ui.focus = 'sum'; return say(s, 'lxCombineWrong', params, true); }
        s.history.push(snapshot(state));
        s.board = combineBoard(s.board, c.a, c.b, total);
        s.rows.push({ type: 'eq', board: s.board });
        s.lx.combine = null;
        s.ui.focus = 'answer';
        return say(s, 'lxCombined');
      }
      return state;
    }

    // ----- B1–B3: a term dropped -----
    case 'lxDrop': {
      if (!canGrab(state)) return { ...state, ui: { ...state.ui, carry: null } };
      const f = findTerm(s.board, action.id);
      s.lx.log.drags += 1;
      if (action.how === 'key') s.lx.log.outcomes.keyboard += 1;
      const out = f ? outcomeOf(s.board, action.id, action.slot) : { kind: 'none' };
      if (out.kind === 'snapX' || out.kind === 'none') {
        s.lx.log.outcomes.snapBack += 1;
        s.ui.focus = `tok:${action.id}`;
        if (out.kind === 'snapX') return say(s, f.term.kind === 'group' ? 'dxGroupCross' : 'lxXCross');
        return s;
      }
      s.lx.log.outcomes[out.kind] += 1;
      if (out.kind === 'reorder') {
        s.history.push(snapshot(state));
        s.board = reorderBoard(s.board, action.id, out.to);
        s.rows[s.rows.length - 1] = { type: 'eq', board: s.board };
        s.ui.focus = `tok:${action.id}`;
        return s;
      }
      if (out.kind === 'cross') {
        s.history.push(snapshot(state));
        const { work, board } = crossBoard(s.board, action.id);
        s.work = work;
        s.board = board;
        s.rows.push({ type: 'work', work }, { type: 'eq', board });
        s.lx.moves += 1;
        return say(s, 'dxCrossed', { amount: signed(work.amount) });
      }
      s.lx.combine = { a: out.a, b: out.b, side: out.side, entry: '', wrong: false };
      s.ui.focus = 'sum';
      return say(s, 'lxCombineAsk', { sum: pairText(s.board, out.a, out.b), x: findTerm(s.board, out.a).term.kind === 'x' });
    }

    case 'undo': {
      if (lx.combine || lx.distribute || lx.mult) { s.lx.combine = null; s.lx.distribute = null; s.lx.mult = null; return say(s, 'dxStart'); }
      const snap = s.history.pop();
      if (!snap) return state;
      Object.assign(s, { board: snap.board, rows: snap.rows, work: snap.work });
      s.lx.negIds = snap.negIds;
      return say(s, 'lxUndone');
    }

    // ----- x = : the value, checked against the problem -----
    case 'check': {
      if (!/^-?\d+$/.test(s.entry)) return say(s, 'typeAnswer', {}, true);
      if (Number(s.entry) === s.problem.x) {
        s.stage = 'done';
        s.step = 'done';
        s.lights = { ...s.lights, solved: 'green' };
        s.clean = s.wrongs === 0;
        return say(s, 'dxRight', { answer: signed(s.problem.x), xside: sideOfX(s.board) });
      }
      s.wrongs += 1;
      const typed = s.entry;
      s.entry = '';
      s.ui.focus = 'answer';
      return say(s, 'dxWrong', { typed: typed.replace('-', MINUS) }, true);
    }
    default:
      return state;
  }
}

// One line per finished problem, for the drill's log (on this device only).
export function drillSummary(s) {
  const l = s.lx.log;
  return { t: Date.now(), drill: 'distribute', problem: s.problem.text, drags: l.drags, outcomes: l.outcomes, minusTaps: l.minusTaps, lightHovers: l.lightHovers, moveHovers: l.moveHovers, sumsWrong: l.sumsWrong, productsWrong: l.productsWrong, refusedMinus: l.refusedMinus, wrongs: s.wrongs };
}
