// How a student works on Add to both sides, every equation level (the "lights" experiment, graduated in Build C, 2026-10-18). A
// layer round the card's own reducer (addBothMoves.js): the move still goes through its `go`, Undo through its `undo`. It adds:
//   (A) a preview of the move on the equation on hover: pure view state, `s.ui.preview`;
//   (B) the amount typed into a blank in that equation row, applied with Enter or ✓, then a rule line and a green Next that commits
//       the move (Undo no longer reaches it); typing in x = or Check commits it too;
//   (C) the move and x = [ ] both live from the first frame (there is no choice to make);
//   (D) the forced move: a correct guess makes the NEXT problem a move (the card's own owesMove): on it x = [ ] is greyed and the
//       move has a steady ring until one move is committed (Next, or going on without it) or a combine is applied.
// Behind ?ui=grab only (lights round 2, SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md, still being tested):
//   (E)  the terms of the newest row can be grabbed (engine/lightsGrab.js): reordered in place (B1), carried across the line (B2: the
//        engine's own `go`, with the amount from the term), dropped on a like term to combine them by typing the sum (B3); a minus can
//        be shown as a negative number (B4). Reorder, minus and combine are undone here; everything else is the engine's.
// It also counts what the classroom tests need (`s.lx.log`). No DOM here.

import { reduceAddBoth, newAddBoth, xAlone, xSideOf, solve, hint as hintAfterUndo } from './cards/add.js';
import { isTyping, typeInto } from './entry.js';
import { find as findOnBoard } from './addBothMoves.js';
import { sizesOf } from './cards/addHelp.js';
import { findTerm, outcomeOf, reorderBoard, combineBoard, pairText, valueOf, crossBoard, otherSide, termText } from './lightsGrab.js';
import { productLabels, rightProducts, pieceOf, pieceTyped, productSlip, distributeBoard } from './distributeMove.js';
import { MINUS } from './expr.js';
import { signed, fractionText } from './solveTerms.js';
import { newId } from './lightsGrab.js';
import { productOf, calcParams } from './nudge.js';
import { aloneWords, fracWords, divForm } from './formWords.js';
export { calcParams };

const slotSide = (board, id) => otherSide(findTerm(board, id).side);

// fieldCursor: x = was clicked, so it shows its blinking cursor until anything else happens (Build D-2, Part 2)
const UI0 = { preview: false, focus: null, shake: false, light: null, hoverMove: null, carry: null, drag: null, fieldCursor: false };
const ui = (s) => s.ui ?? UI0;
const withUi = (s, patch) => ({ ...s, ui: { ...ui(s), ...patch } });
const sameUi = (a, b) => JSON.stringify(ui(a)) === JSON.stringify(ui(b));

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...(s.feedback?.params ?? {}), ...params }, bad }; return s; };

export function newLightsSession(problem, opts = {}) {
  // (the problem after a correct guess, shown with a move first, is the loop's: s.mustMove until s.movedOnce)
  return startLights(newAddBoth(problem, { level: opts.level, introTrade: opts.introTrade, forceMove: Boolean(opts.forceMove) }));
}
// The term layer's own fields on a card's new session (Add to both sides; the Two-step card, Build K).
export function startLights(s) {
  s.allowZero = true;                     // a 0 in the blank is allowed (it simply does not help)
  s.lx = {
    moves: 0,                             // moves applied (Undo does not take them back off this count)
    negIds: [],                           // terms whose minus was tapped: shown as "+ −2" (B4)
    combine: null,                        // two like terms dropped together: { a, b, side, entry, wrong } (B3)
    hand: { fewer: 'off' },               // the by-hand Fewer terms light (a combine), beside Each side simplified
    log: {
      previews: 0, chosenAfterPreview: 0, chosenCold: 0, typedBeforeMove: false, sameSignRed: 0, stuck: 0, teach: 0,
      drags: 0, outcomes: { reorder: 0, cross: 0, combine: 0, distribute: 0, snapBack: 0, keyboard: 0 }, minusTaps: 0,
      lightHovers: {}, moveHovers: {}, sumsWrong: 0,
    },
  };
  s.ui = { ...UI0 };
  return s.feedback?.key === 'aTradeIntro' ? s : say(s, s.mustMove ? 'lxMustMove' : 'aFindX');
}

// Is the bare move open (S2/S3): the blank in the equation row holds the cursor?
export const blankOpen = (s) => s.menu === 'add' && !s.scaffold && s.stage === 'moves' && !s.sub && !s.pending && !s.combining;
// Can the Add move be previewed or chosen right now (S0)?
export const canChoose = (s) => s.stage === 'moves' && !s.scaffold && !s.sub && !s.pending && !s.combining && !s.resolving && s.menu !== 'add';
// The move is owed (the problem after a correct guess) until one is committed: x = [ ] is greyed and Add has a steady ring (the loop's
// rule).
export const moveOwed = (s) => Boolean(s.mustMove) && !s.movedOnce && s.stage === 'moves';
// Can the terms of the newest row be grabbed (B0)? Not while help, a substitution, a half-made move or a combine is going on.
export const canGrab = (s) => s.stage === 'moves' && !s.scaffold && !s.sub && !s.pending && !s.combining && !s.resolving && !s.lx?.combine && !s.lx?.distribute && !s.lx?.calc;
export const combineOpen = (s) => Boolean(s.lx?.combine);
// A product being worked out (Build P, Part 2): its blank takes the keys
export const calcOpen = (s) => Boolean(s.lx?.calc);
// Do keys go to the blank (true) or to x = (false)? The open blank wins until it is applied or cancelled, or x = is tapped.
export const amountMode = (s) => s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second) && !s.combining;

// The seesaw's Add is open: one box under each side, the number typed once (Build D-2, Part 5).
export const seesawAdd = (s) => Boolean(s.scaffold) && s.stage === 'moves' && s.menu === 'add' && !s.combining && !s.resolving && s.pending?.kind !== 'cross' && !s.alone;

// Is x = [ ] live? The loop's rule (always, except while a move waits for Undo, a value is being checked, the move is owed, or the
// seesaw is busy), and not while a sum or the products of a distribute are open.
export function lightsAnswerLive(s, loop = solve) {
  if (s.lx?.combine || s.lx?.distribute || s.lx?.calc) return false;
  return loop.answerLive(s);
}

const amountOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : null);
const xConstant = (board) => board[xSideOf(board)].filter((t) => t.kind === 'num').reduce((a, t) => a + t.v, 0);


// opts (a card other than Add to both sides under this layer; Build K): `alone(board)`, what x alone is on its boards, and
// `menuPreview(state, kind)`, whether a Multiply option's preview (a hover on it: 'whole', 'div', 'frac', 'flip') goes to the card's own menu.
// `distribute: true` turns on the distribute move (Build M: a factor dragged onto its parenthesis, one typed product a piece), with
// `lights(state, board)` the card's lights after it and `fold(state)` the loop's fold (the move before it is committed first).
export function withLights(reduce = reduceAddBoth, { alone = xAlone, menuPreview = null, distribute = false, lights = null, fold = null, xAdd = false } = {}) {
  const opts = { distribute, lights, fold, xAdd };
  const wrapped = (state, action) => {
    // ----- view state only -----
    if (action.type === 'ui') {
      const patch = { ...action.patch };
      if (menuPreview && ['frac', 'div', 'flip', 'whole'].includes(patch.preview)) return menuPreview(state, patch.preview) ? reduce(state, action) : state;
      // (Add's two options, Build S: hovering one while the blank is open previews its form)
      const addOpt = patch.preview === 'addX' || patch.preview === 'addNum';
      if (patch.preview && (addOpt ? !blankOpen(state) : !canChoose(state))) return state;
      if ((patch.carry || patch.drag) && !canGrab(state)) return state;
      const next = withUi(state, patch);
      if (sameUi(next, state)) return state;
      if (patch.light && patch.light !== ui(state).light) countHover(next, 'lightHovers', patch.light);
      if (patch.hoverMove && patch.hoverMove !== ui(state).hoverMove) countHover(next, 'moveHovers', patch.hoverMove);
      return patch.preview === true ? countPreview(next) : next;
    }
    if (state.stage === 'done') return state;
    const grab = grabAction(state, action, wrapped, alone, opts);
    if (grab) return grab;

    // Esc (or a second tap on the icon): S2 goes back to S0; a preview just goes away.
    const cancel = (st) => {
      const s = structuredClone(st);
      s.menu = null; s.amountEntry = ''; s.typing = null; s.hint = null;
      s.ui = { ...UI0, focus: 'add' };                              // focus goes back to the Add icon
      return say(s, moveOwed(s) ? 'lxMustMove' : 'aFindX');
    };
    if (action.type === 'lxCancel') {
      if (ui(state).carry) return withUi(state, { carry: null });
      if (state.lx.combine || state.lx.distribute || state.lx.calc) return closeCombine(state);
      if (blankOpen(state)) return cancel(state);
      return ui(state).preview ? withUi(state, { preview: false }) : state;
    }

    // ----- an x-term added in a column (Build T, Part 5): either box takes the keys; a click (or Tab) on one selects the amount to retype -----
    if (action.type === 'focus' && action.target === 'amount' && action.side) {
      const n = reduce(state, { type: 'focus', target: 'amount' });
      const out = structuredClone(n === state ? state : n);
      Object.assign(out, { typing: 'amount', amountSide: action.side === 'right' ? 'right' : 'left', amountSel: Boolean(out.amountEntry) });
      out.ui = { ...ui(out), focus: 'blank', shake: false };
      return out;
    }

    // ----- choosing the move: preview first on touch, a second tap (or Esc) cancels -----
    if (action.type === 'choose' && action.move === 'add') {
      if (blankOpen(state)) return cancel(state);
      if (action.touch && !ui(state).preview && canChoose(state)) return reduceUi(state, { preview: true });
    }

    // ----- apply with an empty or unreadable blank: the box shakes, nothing else -----
    // (and the keys go back to the box: after a click on x =, they went on into x =; Build N)
    if (action.type === 'go' && blankOpen(state) && amountOf(state.amountEntry) === null) {
      const shaken = withUi(state, { shake: true, preview: false, focus: 'blank' });
      return shaken.typing === 'answer' ? { ...shaken, typing: 'amount' } : shaken;
    }

    // ----- the seesaw's Add (Build D-2, Part 5): the number is typed once; its counters go onto both sides as it is typed -----
    if (seesawAdd(state) && isTyping(action) && amountMode(state)) {
      let s0 = structuredClone(state);
      if (s0.pending?.auto) {                                           // the counters of the number typed before come back off
        const entry = s0.amountEntry;
        Object.assign(s0, s0.history.pop());
        s0.amountEntry = entry;
      }
      const s1 = reduce(s0, action);
      const typed = s1 === s0 ? s0 : s1;
      if (typed.amountEntry === state.amountEntry && !state.pending?.auto) return state;
      let out = typed;
      if (amountOf(typed.amountEntry) !== null) {
        const left = reduce(typed, { type: 'addTo', side: 'left' });
        out = left.pending ? reduce(left, { type: 'addTo', side: 'right' }) : left;
        if (out.pending) out.pending.auto = true;
      }
      out.ui = { ...UI0, focus: 'blank' };
      return out;
    }
    if (action.type === 'go' && seesawAdd(state) && !state.pending && amountOf(state.amountEntry) !== null) {
      const left = reduce(state, { type: 'addTo', side: 'left' });             // a number already in the box (Teach me, the guided rung)
      if (!left.pending) return left;
      const both = reduce(left, { type: 'addTo', side: 'right' });
      return both.pending?.both ? wrapped(both, action) : both;
    }

    const typingAnswer = isTyping(action) && !amountMode(state) && !state.mopts?.kind && state.menu !== 'fraction';   // (not the Multiply menu's blanks)
    // greyed while the move is owed
    if ((typingAnswer || (action.type === 'focus' && action.target === 'answer')) && moveOwed(state)) return state;

    // help, a move (Multiply and Flip too: their blanks would take the keys of a sum still open under them, Build N) or a check closes a
    // sum being typed
    let input = state;
    if ((state.lx.combine || state.lx.distribute || state.lx.calc) && ['stuck', 'teach', 'choose', 'check', 'multOpen', 'flipPick', 'divPick', 'startOver'].includes(action.type)) {   // (Start over too: its board has no such terms, Build T)
      input = structuredClone(state); input.lx.combine = null; input.lx.distribute = null; input.lx.calc = null; }

    const s = reduce(input, action);
    if (s === input) return input;                                  // the engine did nothing (a closed sum still counts)
    s.ui = { ...UI0 };
    if (typingAnswer && ui(state).focus === 'answer') s.ui.focus = 'answer';   // keys typed into x = keep its cursor (Build N)
    const lx = s.lx;
    lx.previewed = false;                                           // the next preview is a new look

    switch (action.type) {
      case 'choose':
        if (s.menu === 'add' && !state.menu) {
          if (ui(state).preview) lx.log.chosenAfterPreview += 1; else lx.log.chosenCold += 1;
          s.ui.focus = 'blank';
          say(s, 'aPickAmount');
        }
        break;
      case 'setAmount':
        s.ui.focus = 'blank';
        break;
      case 'go': {
        if (menuPreview && state.menu !== 'add' && !state.scaffold) break;        // (another move's Go: a card's own Multiply menu)
        if (!madeMove(state, s) && !s.scaffold) break;                        // the engine said no (too big, say)
        if (s.scaffold) break;
        lx.moves += 1;
        const before = state.board;
        const amount = s.lastAmount;
        if (s.lights.fewer === 'red' && state.history.length === 0 && Math.sign(amount) === Math.sign(xConstant(before))) lx.log.sameSignRed += 1;
        if (amount === 0) say(s, 'lxZero', {}, false);
        if (alone(s.board)) s.ui.focus = 'answer';                                  // the next thing to do is type x
        break;
      }
      case 'undo':
        if (blankOpen(s)) s.ui.focus = 'blank';                                     // back to S2: the box cleared and focused
        break;
      case 'startOver':
        lx.negIds = [];
        lx.combine = null;
        lx.hand = { fewer: 'off' };
        say(s, moveOwed(s) ? 'lxMustMove' : 'aFindX');
        break;
      case 'stuck':
        lx.log.stuck += 1;
        if (blankOpen(s)) s.ui.focus = 'blank';
        break;
      case 'teach':
        lx.log.teach += 1;
        break;
      case 'check':
        break;
      default:
        break;
    }
    if (action.type === 'focus' && action.target === 'answer') s.ui.fieldCursor = true;
    // the seesaw just built: the student chooses the move (an Add left open from the hint before is closed; Build D-2, Part 5)
    if (state.stage === 'build' && s.stage === 'moves' && s.feedback?.key === 'aBuilt' && !s.forced) { s.menu = null; s.amountEntry = ''; s.hint = null; }
    if (typingAnswer && s.entry !== state.entry && lx.moves === 0 && !s.scaffold) lx.log.typedBeforeMove = true;
    if (s.feedback?.key === 'aFindX' && moveOwed(s)) say(s, 'lxMustMove');
    return s;
  };
  return wrapped;
}

// ---------- Part B: grab the terms ----------

const closeCombine = (state) => {
  const s = structuredClone(state);
  s.lx.combine = null;
  s.lx.distribute = null;
  s.lx.calc = null;
  s.ui = { ...UI0 };
  return say(s, moveOwed(s) ? 'lxMustMove' : 'aFindX');
};
const sumParams = (s) => ({ sum: pairText(s.board, s.lx.combine.a, s.lx.combine.b) });

// Undo after a wrong typed amount goes back to that blank, not to the gesture before it (Build T, Part 3): a wrong sum keeps its two terms
// lit, a wrong product its factor and number, a wrong distribute the move in progress (the factor in colour, the arcs, the labels); the
// blank is empty and has the cursor (a distribute's first blank). `s.retry` is the hint pop-up the spotlight shows for it after Undo.
function retryBlank(state) {
  const { combine, calc, distribute } = state.lx;
  if (!combine?.wrong && !calc?.wrong && !(distribute && distribute.wrong !== null && distribute.wrong !== undefined)) return null;
  const s = structuredClone(state);
  if (combine?.wrong) {
    s.lx.combine = { ...combine, entry: '', wrong: false, pic: null };
    s.ui = { ...UI0, focus: 'sum' };
    s.retry = { target: 'sumbox', lit: ['pair'], key: 'lxCombineRetry', params: { ...sumParams(s), x: combineIsX(s) } };
  } else if (calc?.wrong) {
    const t = findTerm(s.board, calc.id)?.term;
    s.lx.calc = { ...calc, entry: '', wrong: false };
    s.ui = { ...UI0, focus: 'calc' };
    s.retry = { target: 'calcbox', lit: ['calc'], key: 'lxCalcRetry', params: t ? calcParams(s, t) : {} };
  } else {
    const g = findTerm(s.board, distribute.group)?.term;
    s.lx.distribute = { ...distribute, entries: distribute.entries.map(() => ''), focus: 0, wrong: null, sel: false };
    s.ui = { ...UI0, focus: 'prod:0' };
    s.retry = { target: 'prodbox', lit: ['factor'], key: 'dxProductsRetry', params: { labels: g ? productLabels(g).map((l) => l.replace(/-/g, MINUS)).join(' and ') : '' } };
  }
  return say(s, s.retry.key, s.retry.params);
}

// The actions that are the wrapper's own: a drop (pointer or keyboard), a minus tap, the sum of a combine typed and applied, and the
// Undo of a reorder, a minus tap or a combine. Returns null for anything else.
// Did the engine make the move? Its board changed. (Not the history's length: a move made while the one before it still shows its work
// folds that one first, which empties the history, so a dropped term that did move read as refused and nothing happened; Build S)
const madeMove = (before, after) => after !== before && JSON.stringify(after.board) !== JSON.stringify(before.board);

function grabAction(state, action, wrapped, alone, opts = {}) {
  const lx = state.lx;
  if (opts.distribute) {
    const d = distributeAction(state, action, alone, opts);
    if (d) return d;
  }
  // ----- a product worked out (Build P, Part 2): the × (or the fraction bar) clicked, the signed product typed, Enter or Go -----
  const calc = calcAction(state, action, alone);
  if (calc) return calc;

  // ----- the sum of a combine: typed into its blank, applied with Enter or ✓ (two x-terms: every piece is typed, the x too: Build M) -----
  if (lx.combine && isTyping(action)) {
    const entry = combineIsX(state) ? typeX(lx.combine.wrong ? '' : lx.combine.entry, action) : typeInto(lx.combine.wrong ? '' : lx.combine.entry, action, 'integer');
    if (entry === lx.combine.entry && !lx.combine.wrong) return state;
    const s = structuredClone(state);
    s.lx.combine = { ...s.lx.combine, entry, wrong: false };
    s.ui = { ...UI0 };
    return say(s, 'lxCombineAsk', sumParams(s));
  }
  if (action.type === 'lxApply' || (action.type === 'go' && lx.combine)) {
    if (!lx.combine) return state;
    const c = lx.combine;
    const isX = combineIsX(state);
    // two x-terms: a bare number is sent back, the x is part of the answer (Build M)
    // a bare number is sent back with a picture (Build P, Part 6): two x boxes and three x boxes, "5 of what?" (the scaffold: `hint`)
    if (isX && /^-?\d+$/.test(c.entry)) {
      const s = structuredClone(withUi(state, { shake: true, focus: 'sum' }));
      const [ta, tb] = [c.a, c.b].map((id) => findTerm(s.board, id)).sort((p, q) => p.at - q.at).map((f) => f.term.coef ?? 1);
      s.lx.combine = { ...c, pic: { a: ta, b: tb } };
      if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
      return say(s, 'dxXBoxes', { a: signed(ta), b: signed(tb), typed: c.entry.replace('-', MINUS) }, false);
    }
    if (isX ? xCoefOf(c.entry) === null : !/^-?\d+$/.test(c.entry)) return withUi(state, { shake: true });
    const s = structuredClone(state);
    const total = valueOf(findTerm(s.board, c.a).term) + valueOf(findTerm(s.board, c.b).term);
    if ((isX ? xCoefOf(c.entry) : Number(c.entry)) !== total) {
      s.lx.combine = { ...c, wrong: true };
      s.lx.log.sumsWrong += 1;
      s.ui = { ...UI0 };
      return say(s, 'lxCombineWrong', { ...sumParams(s), typed: c.entry }, true);
    }
    s.history.push({ lxKind: 'combine', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard, lights: s.lights, hand: s.lx.hand, negIds: s.lx.negIds });
    const next = combineBoard(s.board, c.a, c.b, total);
    s.board = next;
    s.prevBoard = next;
    s.rows.push({ type: 'eq', board: next });
    s.lights = { ...s.lights, solved: alone(next) ? 'green' : 'off' };
    s.lx.hand = { fewer: 'green' };                         // the by-hand part of Fewer terms (A3): one term fewer
    s.lx.combine = null;
    s.movedOnce = true;                                     // the student's own combining counts as the move
    s.ui = { ...UI0, focus: blankOpen(s) && amountMode(s) ? 'blank' : 'answer' };   // (Add's box still open keeps the keys and the cursor: Build T)
    return say(s, alone(next) ? 'lxCombinedAlone' : 'lxCombined');
  }

  // ----- Undo: a combine being typed closes; a reorder, a minus tap or a combine is taken back here -----
  if (action.type === 'undo') {
    const retry = retryBlank(state);
    if (retry) return retry;
    if (lx.combine || lx.distribute || lx.calc) return closeCombine(state);
    const top = state.history[state.history.length - 1];
    if (state.sub || !top?.lxKind) return null;
    const s = structuredClone(state);
    s.history.pop();
    if (top.lxKind === 'minus') s.lx.negIds = s.lx.negIds.includes(top.id) ? s.lx.negIds.filter((x) => x !== top.id) : [...s.lx.negIds, top.id];
    else {
      Object.assign(s, { board: top.board, rows: top.rows, prevBoard: top.prevBoard });
      if (top.lxKind === 'combine' || top.lxKind === 'calc') { s.lights = top.lights; s.lx.hand = top.hand; if (top.negIds) s.lx.negIds = top.negIds; }
      if (top.lxKind === 'distribute') { Object.assign(s, { lights: top.lights, unfolded: false, movedOnce: top.movedOnce }); s.lx.negIds = top.negIds; }
    }
    s.ui = { ...UI0 };
    return say(s, 'lxUndone');
  }

  // ----- a minus tapped (B4): "x − 2" ⇄ "x + −2", display only -----
  if (action.type === 'lxMinus') {
    const f = findTerm(state.board, action.id);
    if (!canGrab(state) || !f || f.at === 0 || f.term.kind !== 'num' || f.term.v >= 0) return state;
    const s = structuredClone(state);
    const shown = s.lx.negIds.includes(action.id);
    s.lx.negIds = shown ? s.lx.negIds.filter((x) => x !== action.id) : [...s.lx.negIds, action.id];
    s.history.push({ lxKind: 'minus', id: action.id });
    s.lx.log.minusTaps += 1;
    s.ui = { ...UI0, focus: `tok:${action.id}` };
    return shown ? s : say(s, 'lxNegShown', { neg: `−${-f.term.v}` });
  }

  // ----- a term dropped (B1–B3): a pointer drag, or the keyboard's Enter on a carried term -----
  if (action.type !== 'lxDrop') return null;
  if (!canGrab(state)) return withUi(state, { carry: null });
  // a parenthesis's factor let go on the equation but not on its parenthesis: it goes back, and says where it goes (Build S)
  if (action.slot?.factorMiss) {
    const g = findTerm(state.board, action.id)?.term;
    const s = structuredClone(state);
    s.lx.log.drags += 1;
    s.lx.log.outcomes.snapBack += 1;
    s.ui = { ...UI0 };
    return g?.kind === 'group' ? say(s, 'lxFactorParen', { factor: signed(g.factor).replace('-', MINUS) }) : s;
  }
  const out = outcomeOf(state.board, action.id, action.slot);
  const logged = (s) => {
    s.lx.log.drags += 1;
    const o = s.lx.log.outcomes;
    if (out.kind === 'snapX' || out.kind === 'none') o.snapBack += 1; else o[out.kind] += 1;
    if (action.how === 'key') o.keyboard += 1;
    return s;
  };
  if (out.kind === 'none' || out.kind === 'snapX') {
    const s = logged(structuredClone(state));
    s.ui = { ...UI0, focus: `tok:${action.id}` };
    if (out.kind === 'snapX') { const r = crossRefusal(state, action.id); return say(s, r.key, r.params); }
    // (Build S: every drop that does nothing says why. Dropped where it was, or away from the equation, it just goes back)
    const term = findTerm(state.board, action.id)?.term;
    if (action.slot?.onto && action.slot.onto !== action.id) return say(s, 'lxUnlike', { group: findTerm(state.board, action.slot.onto)?.term?.kind === 'group' || term?.kind === 'group' });
    return s;
  }
  if (out.kind === 'crossX' && opts.xAdd) {
    // an x-term carried across the = on a card with x on both sides (Variables on both sides, Build R): the Add of its opposite, the same
    // rows and judging as the Add button's x-term option
    const s0 = structuredClone(state);
    Object.assign(s0, { menu: 'add', addKind: 'x', typing: null, amountEntry: String(-(findTerm(state.board, action.id).term.coef ?? 1)), hint: null, ui: { ...UI0 } });
    const s = wrapped(s0, { type: 'go' });
    if (!madeMove(s0, s)) { const back = logged(structuredClone(state)); back.feedback = s.feedback; return back; }
    return logged(s);
  }
  if (out.kind === 'crossX') {
    // x carried across when the other side has x too (no card has such an equation yet): the opposite lands in its slot
    const s = logged(structuredClone(state));
    s.history.push({ lxKind: 'reorder', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard });
    s.board = crossBoard(s.board, action.id, out.at);
    s.rows.push({ type: 'eq', board: s.board });
    s.prevBoard = s.board;
    s.ui = { ...UI0 };
    return s;
  }
  if (out.kind === 'cross') {
    // the engine's own move, with the amount from the term: the same rows the Add button writes, judged the same way
    const s0 = structuredClone(state);
    Object.assign(s0, { menu: 'add', typing: null, amountEntry: String(out.amount), hint: null, ui: { ...UI0 }, ...(opts.xAdd ? { addKind: 'num' } : {}) });
    const s = wrapped(s0, { type: 'go' });
    if (!madeMove(s0, s)) {                                          // the engine said no (too big): nothing moves
      const back = logged(structuredClone(state));
      back.feedback = s.feedback;
      return back;
    }
    // the term lands where it was dropped (Build D): the amount the engine added at the end of the side without x moves to the slot
    const dest = slotSide(state.board, action.id);
    const added = s.board[dest];
    if (dest !== xSideOf(s.board) && added.length > 1 && out.at < added.length - 1 && added.at(-1).v === out.amount) {
      const moved = [...added];
      moved.splice(out.at, 0, moved.pop());
      s.board = { ...s.board, [dest]: moved };
      s.rows[s.rows.length - 1] = { ...s.rows[s.rows.length - 1], board: s.board };
      s.prevBoard = s.board;
    }
    return logged(s);
  }
  const s = logged(structuredClone(state));
  s.ui = { ...UI0 };
  if (out.kind === 'reorder') {
    // the same equation in a new order: the newest row is replaced in place, and nothing is judged (B1)
    s.history.push({ lxKind: 'reorder', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard });
    const was = s.board;
    s.board = reorderBoard(s.board, action.id, out.to);
    s.rows[s.rows.length - 1] = { ...s.rows[s.rows.length - 1], board: s.board };
    if (s.prevBoard === was) s.prevBoard = s.board;
    s.ui.focus = `tok:${action.id}`;
    return s;
  }
  // combine: a blank for the sum, the two terms dimmed (B3)
  Object.assign(s, { menu: null, amountEntry: '', typing: null, hint: null });
  s.lx.combine = { a: out.a, b: out.b, side: out.side, entry: '', wrong: false };
  s.ui.focus = 'sum';
  return say(s, 'lxCombineAsk', sumParams(s));
}

// ---------- calculating a product (Build P, Part 2) ----------
// After dividing first (or taking a fraction) a side can read `⅓(15)`, a factor times a number. While x is not alone the student can work
// it out: the × between them (the fraction bar, in division form) opens a blank for the signed product; Enter or Go applies it and the
// side becomes that one number. A wrong product waits for Undo (the factor and the number stay lit), then the hint. Never at x alone
// (`x = ⅓(15)`): there the student types x, and the solved value is never displayed.
const calcValue = (t) => (t.sign < 0 ? -1 : 1) * t.inner[0].v / t.n;
// The product that can be worked out on this state: its term, or null
export function calcTerm(s, alone = xAlone) {
  if (!s.board || alone(s.board)) return null;
  const f = productOf(s.board);
  return f ? findTerm(s.board, f.id).term : null;
}
function calcAction(state, action, alone) {
  const lx = state.lx;
  if (action.type === 'lxCalc') {
    if (!canGrab(state)) return state;
    const t = calcTerm(state, alone);
    if (!t || (action.id && action.id !== t.id)) return state;
    const s = structuredClone(state);
    Object.assign(s, { menu: null, amountEntry: '', typing: null, hint: null, spot: null });
    s.lx.calc = { id: t.id, entry: '', wrong: false };
    s.ui = { ...UI0, focus: 'calc' };
    return say(s, 'lxCalcAsk', calcParams(s, t));
  }
  if (!lx.calc) return null;
  const t = findTerm(state.board, lx.calc.id)?.term;
  if (!t) return null;
  if (isTyping(action)) {
    const entry = typeInto(lx.calc.wrong ? '' : lx.calc.entry, action, 'integer');
    if (entry === lx.calc.entry && !lx.calc.wrong) return state;
    const s = structuredClone(state);
    s.lx.calc = { ...s.lx.calc, entry, wrong: false };
    s.ui = { ...UI0, focus: 'calc' };
    return s;
  }
  if (action.type === 'lxApply' || action.type === 'go') {
    const c = lx.calc;
    if (!/^-?\d+$/.test(c.entry)) return withUi(state, { shake: true, focus: 'calc' });
    const s = structuredClone(state);
    const value = calcValue(t);
    if (Number(c.entry) !== value) {
      s.lx.calc = { ...c, wrong: true };
      s.lx.log.sumsWrong += 1;
      s.ui = { ...UI0 };
      return say(s, 'lxCalcWrong', { ...calcParams(s, t), typed: c.entry.replace('-', '−') }, true);
    }
    s.history.push({ lxKind: 'calc', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard, lights: s.lights, hand: s.lx.hand, negIds: s.lx.negIds });
    const side = findTerm(s.board, t.id).side;
    const next = { ...s.board, [side]: s.board[side].map((u) => (u.id === t.id ? { id: newId(), kind: 'num', v: value } : u)) };
    s.board = next;
    s.prevBoard = next;
    s.rows.push({ type: 'eq', board: next });
    s.lights = { ...s.lights, solved: alone(next) ? 'green' : 'off' };
    s.lx.calc = null;
    s.ui = { ...UI0 };
    return say(s, 'lxCalculated', { value: signed(value) });
  }
  return null;
}

// ---------- combining two x-terms (Build M): the sum typed whole, `5x` ----------
const combineIsX = (s) => findTerm(s.board, s.lx.combine.a)?.term.kind === 'x';
// `5x` → 5, `x` → 1, `−x` → −1; null when it is not a number in front of x
export const xCoefOf = (entry) => { const m = /^(-?)(\d*)x$/.exec(entry ?? ''); return m ? (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) : null; };
// digits and a leading minus, then the x at the end
function typeX(entry, action) {
  if (entry.endsWith('x') && !['backspace', 'toggleSign'].includes(action.type)) return entry;
  if (action.type === 'typeChar' && action.ch === 'x') return entry + 'x';
  if (action.type === 'toggleSign' && entry.endsWith('x')) return entry.startsWith('-') ? entry.slice(1) : `-${entry}`;
  return typeInto(entry, action, 'integer');
}

// ---------- the distribute move (Build M; the hidden Distribute drill's move, made shared; the drill is deleted) ----------
// Why a term cannot cross the = (Build T, Part 1): the first words say x stays where it is, the last say what to do instead, fitted to
// the shape of x's side: `x + 4 = 9` move the number; `3x = 9` divide by 3; `x = 9` type its value; `2x + 3x = 10` combine first;
// `3(x + 2) = 15` multiply the 3 in. A number still to work out on the other side (`x = (15)/3`) is said in its own form (Part 2).
export function crossRefusal(state, id) {
  const b = state.board;
  const f = findTerm(b, id);
  const held = f?.term;
  const side = f?.side ?? 'left';
  const hasX = (t) => t.kind === 'x' || (t.kind === 'group' && t.inner.some(hasX));
  const factorOf = (g) => signed(g.factor).replace('-', MINUS);
  if (held && !hasX(held)) {
    const xs = b[otherSide(side)];
    if (xs.length === 1 && xs[0].kind === 'x' && (xs[0].coef ?? 1) === 1 && aloneWords(state, held)) return { key: 'lxSayAlone', params: { text: aloneWords(state, held) } };
    return { key: 'lxWorkFirst', params: held.kind === 'frac' ? { what: fracWords(held, divForm(state, held)), div: divForm(state, held) } : {} };
  }
  const group = b[otherSide(side)].find((t) => t.kind === 'group' && hasX(t));
  if (held?.kind === 'x' && group) return { key: 'lxXInGroup', params: { factor: factorOf(group) } };
  const others = b[side].filter((t) => t.id !== id);
  const nums = others.filter((t) => t.kind === 'num');
  const params = { side };
  if (nums.length) params.tail = nums.length === 1 ? 'number' : 'numbers';
  else if (others.some((t) => t.kind === 'x')) params.tail = 'combine';
  else if (others.some((t) => t.kind === 'group') || held?.kind === 'group') Object.assign(params, { tail: 'distribute', factor: factorOf(others.find((t) => t.kind === 'group') ?? held) });
  else if (others.length) params.tail = 'work';
  else if ((held?.coef ?? 1) === 1) params.tail = 'alone';
  else Object.assign(params, { tail: 'divide', a: signed(held.coef).replace('-', MINUS) });
  return { key: 'lxXCross', params };
}

// Its actions: a subtracted factor's minus tapped (shown as a negative number, needed before distributing), the factor dropped on its
// parenthesis (the blanks open: one per piece, each labelled with its multiplication), a piece typed or a blank chosen, and Go (or
// Enter): with every blank filled, the products are checked; right, the app writes the new row from them, bringing the other terms down.
// A wrong product is the spotlight's (the blank and its label lit, Undo, then the hint). Undo closes the blanks, or takes the move back.
function distributeAction(state, action, alone, opts) {
  const lx = state.lx;
  const d = lx.distribute;
  if (d && isTyping(action)) {
    if (action.type === 'typeChar') return state;                                   // (the x is printed after the x blank)
    const k = d.focus;
    const entry = typeInto(d.wrong === k || (d.sel && action.type !== 'toggleSign') ? '' : d.entries[k], action, 'integer');
    if (entry === d.entries[k] && d.wrong !== k && !d.sel) return state;
    const s = structuredClone(state);
    s.lx.distribute.entries[k] = entry;
    s.lx.distribute.wrong = null;
    s.lx.distribute.sel = false;
    s.ui = { ...UI0, focus: `prod:${k}` };
    return say(s, 'dxProducts');
  }
  // Tab or → to the next blank, Shift+Tab or ← to the one before (Build P, Part 4): its contents are selected, so typing replaces them
  if (d && action.type === 'blankMove') {
    const k = Math.max(0, Math.min(d.entries.length - 1, d.focus + (action.dir > 0 ? 1 : -1)));
    if (k === d.focus) return state;
    const s = structuredClone(state);
    Object.assign(s.lx.distribute, { focus: k, sel: d.entries[k] !== '' });
    s.ui = { ...UI0, focus: `prod:${k}` };
    return s;
  }
  if (d && action.type === 'focus' && action.target === 'dist') {
    const s = structuredClone(state);
    s.lx.distribute.sel = false;
    s.lx.distribute.focus = Math.max(0, Math.min(d.entries.length - 1, Number(action.index) || 0));
    s.ui = { ...UI0, focus: `prod:${s.lx.distribute.focus}` };
    return s;
  }
  // a subtracted factor shown as a negative number (and back): `5 − 2(x + 2)` ⇄ `5 + −2(x + 2)`, display only
  if (action.type === 'lxMinus') {
    const f = findTerm(state.board, action.id);
    if (f?.term.kind !== 'group') return null;
    if (!canGrab(state) || f.at === 0 || f.term.factor >= 0) return state;
    const s = structuredClone(state);
    const shown = s.lx.negIds.includes(action.id);
    s.lx.negIds = shown ? s.lx.negIds.filter((x) => x !== action.id) : [...s.lx.negIds, action.id];
    s.history.push({ lxKind: 'minus', id: action.id });
    s.lx.log.minusTaps += 1;
    s.ui = { ...UI0, focus: `tok:${action.id}:f` };
    return shown ? s : say(s, 'dxNegFactor', { neg: `${MINUS}${-f.term.factor}` });
  }
  if (action.type === 'lxDistribute') {
    const f = findTerm(state.board, action.id);
    if (!canGrab(state) || f?.term.kind !== 'group') return withUi(state, { carry: null });
    const s = structuredClone(state);
    s.lx.log.drags += 1;
    if (action.how === 'key') s.lx.log.outcomes.keyboard += 1;
    // a subtracted factor is seen as a negative number first
    if (f.term.factor < 0 && f.at > 0 && !s.lx.negIds.includes(f.term.id)) {
      s.lx.log.outcomes.snapBack += 1;
      s.ui = { ...UI0, focus: `tok:${f.term.id}:f` };
      return say(s, 'dxTapMinusFirst', { factor: `${MINUS}${-f.term.factor}` });
    }
    s.lx.log.outcomes.distribute += 1;
    Object.assign(s, { menu: null, amountEntry: '', typing: null, hint: null, mopts: null });
    s.lx.distribute = { group: f.term.id, entries: f.term.inner.map(() => ''), focus: 0, wrong: null };
    s.ui = { ...UI0, focus: 'prod:0' };
    return say(s, 'dxProducts');
  }
  if (!d || !(action.type === 'lxApply' || action.type === 'go')) return null;
  const g = findTerm(state.board, d.group).term;
  // Enter goes from a filled blank to the next empty one; Go with a blank still empty shakes it
  const empty = d.entries.findIndex((e) => !pieceTyped(e));
  if (empty >= 0) {
    const s = structuredClone(state);
    if (action.type === 'go' && pieceTyped(d.entries[d.focus])) { Object.assign(s.lx.distribute, { focus: empty, sel: false }); s.ui = { ...UI0, focus: `prod:${empty}` }; return s; }
    s.ui = { ...UI0, shake: true, focus: `prod:${empty}` };
    return s;
  }
  const right = rightProducts(g);
  const wrong = d.entries.findIndex((e, k) => pieceOf(e) !== right[k]);
  const s = structuredClone(state);
  if (wrong >= 0) {
    const typed = pieceOf(d.entries[wrong]);
    const tag = productSlip(g, wrong, typed);
    Object.assign(s.lx.distribute, { wrong, focus: wrong });
    s.lx.log.productsWrong = (s.lx.log.productsWrong ?? 0) + 1;
    // the products' labels (`3 · x`, `3 · 2`) appear now, the scaffold, for the rest of this problem (Build P, Part 5): a reminder (`hint`)
    s.lx.labels = true;
    if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
    s.answers.push({ typed: `${productLabels(g)[wrong]} = ${d.entries[wrong]}`, tag });
    s.tags.push(tag);
    s.ui = { ...UI0, focus: `prod:${wrong}` };
    const shown = `${String(d.entries[wrong]).replace('-', MINUS)}${g.inner[wrong].kind === 'x' ? 'x' : ''}`;
    return say(s, 'dxProductWrong', { product: productLabels(g)[wrong].replace(/-/g, MINUS), typed: shown, tag }, true);
  }
  // right: the move before it is committed (folded) first; this one is the current move, until the student goes on
  opts.fold?.(s);
  s.history.push({ lxKind: 'distribute', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard, lights: s.lights, hand: s.lx.hand, negIds: s.lx.negIds, movedOnce: s.movedOnce });
  const { board, made } = distributeBoard(s.board, g.id);
  s.board = board;
  s.prevBoard = board;
  s.rows.push({ type: 'eq', board });
  // written "+ −2x + −4", as in the notes: a negative piece after the first shows as a negative number
  s.lx.negIds = [...s.lx.negIds.filter((x) => x !== g.id), ...made.filter((t, i) => valueOf(t) < 0 && (i > 0 || findTerm(board, t.id).at > 0)).map((t) => t.id)];
  s.lights = opts.lights ? opts.lights(s, board) : s.lights;
  s.lx.distribute = null;
  s.lx.moves += 1;
  s.movedOnce = true;                                     // a move: it unlocks x = on a forced problem
  s.unfolded = !alone(board);
  s.foldLabel = { dist: g.factor };
  s.ui = { ...UI0 };
  return say(s, 'dxDistributed', { product: termText(made[0], 0).body });
}

// A hover on a light or a move is counted once per look (A3, logging).
function countHover(s, key, id) {
  s.lx = { ...s.lx, log: { ...s.lx.log, [key]: { ...s.lx.log[key], [id]: (s.lx.log[key][id] ?? 0) + 1 } } };
  return s;
}

// A preview is counted once per episode: hovering on and off the icon again before doing anything else is the same look.
function countPreview(s) {
  if (s.lx.previewed) return s;
  return { ...s, lx: { ...s.lx, previewed: true, log: { ...s.lx.log, previews: s.lx.log.previews + 1 } } };
}
const reduceUi = (state, patch) => countPreview(withUi(state, patch));

// One line per finished problem, for the first test (§6).
export function lightsSummary(s) {
  const l = s.lx.log;
  return {
    t: Date.now(), level: s.problem.logLevel ?? s.level, previews: l.previews, previewedBeforeChoose: l.chosenAfterPreview > 0,
    chosenCold: l.chosenCold, typedBeforeMove: l.typedBeforeMove, sameSignRed: l.sameSignRed,
    stuck: l.stuck, teach: l.teach,
    guessedRight: s.stage === 'done' && s.sub?.kind === 'guess' && s.sub.ok, forced: Boolean(s.mustMove),
    drags: l.drags, outcomes: l.outcomes, minusTaps: l.minusTaps, lightHovers: l.lightHovers, moveHovers: l.moveHovers, sumsWrong: l.sumsWrong,
  };
}

// ---------- the spotlight (Build C, Part 2: engine/spotlight.js) ----------
// Which messages are errors on Add to both sides, what each lights up and its small label, and the hint after Undo: the card's
// reminder rung for the state Undo returned to (the number next to x outlined, "What would we add to both sides to eliminate it?").
// On the seesaw, a wrong move is a picture spotlight (below).
export const ADD_ERRORS = {
  // the two numbers added are lit too, and the sum (or what is left) carries the label (Build D-2)
  aRed: { target: 'xnum', label: 'got bigger', lit: ['workpair'] },
  aRed3: { target: 'xnum', label: 'got bigger', lit: ['workpair'] },
  aPartial: { target: 'xnum', label: 'still here', lit: ['workpair'] },
  lxZero: { target: 'xnum', label: 'no change' },
  aZeroOther: { target: 'otherSide', label: 'now 0' },
  aUndoFirstHelp: { target: 'lastMove', label: 'waiting for Undo' },
  aUndoGuess: { target: 'subst', lit: ['substLast', 'board'] },                // (and the seesaw that shows the two sides, when it is up)
  aWrong: { target: 'subst', clear: true, lit: ['substLast', 'board'] },
  lxCombineWrong: { target: 'sumbox', label: 'check this', lit: ['pair'] },       // (the two numbers being combined stay lit too)
  lxCalcWrong: { target: 'calcbox', label: 'check this', lit: ['calc'] },          // (the factor and its number stay lit: Build P, Part 2)
};
// A wrong move on the seesaw (Build F, Part 3): a picture spotlight. The pair that combined beside x is drawn again, its cancelled pairs
// crossed off and what is left (or what joined) lit; the side without x is lit too. Undo, then the hint, as on the bare screen. The
// move's verdict can come wrapped in the answer to the last Party or Battle (aKindRight).
export const slipKey = (s) => (s.feedback?.key === 'aKindRight' ? s.feedback.params?.after?.key ?? null : s.feedback?.key ?? null);
const SEESAW_ERRORS = {
  aRed: { target: 'slip', label: 'got bigger', lit: ['slipOther'] },
  aRed3: { target: 'slip', label: 'got bigger', lit: ['slipOther'] },
  aPartial: { target: 'slip', label: 'still here', lit: ['slipOther'] },
  aZeroOther: { target: 'slipOther', label: 'now 0', lit: ['slip'] },
  aUndoFirstHelp: { target: 'slip', label: 'waiting for Undo', lit: ['slipOther'] },
};
function seesawError(s) {
  if (!s.needUndo || s.combining || s.sub || s.stage !== 'moves') return null;
  return SEESAW_ERRORS[slipKey(s)] ?? null;
}
// Past the counters' limit, at x alone (Build I, Part 2; it was Build H, Part 3): two small questions at the two numbers, which stay lit,
// asked one at a time so the sign is not lost. The first asks for the sign with a big + and a big − (a battle: who won; a party: a party of
// what?). The second does not exist until the first is answered right; then it appears beside it ("Subtract 15 − 2 to find how many of
// the −15 are left.", "Add 2 + 13 to find how many negatives."), and the first stays, showing the sign picked. Their numbers are read from
// the row on screen. The student then types x: the app never writes the value.
function aloneBubbles(s) {
  const al = s.alone;
  const sz = sizesOf(findOnBoard(s.board, al.a).v, findOnBoard(s.board, al.b).v);
  const battle = al.kind === 'battle';
  const wrong = s.feedback?.key === 'aWhoWrong' || s.feedback?.key === 'aPartyWrong';
  const out = [{ id: 'who', key: battle ? (wrong ? 'aBubbleWhoWrong' : 'aBubbleWho') : (wrong ? 'aBubblePartyWrong' : 'aBubbleParty'), params: sz, action: 'whoWon', choices: [['+', '+'], ['−', '-']], picked: al.who ?? null }];
  if (al.step !== 'who') out.push({ id: 'op', key: battle ? 'aBubbleSub' : 'aBubbleAdd', params: sz });
  return out;
}
export const ADD_SPOT = {
  error: (s) => (s.scaffold ? seesawError(s) : ADD_ERRORS[s.feedback?.key] ?? null),
  keepsReds: (s) => ['aRed', 'aRed3', 'aZeroOther', 'lxZero', 'aPartial'].includes(slipKey(s)),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  // the hint after Undo is the registry's, for the shape Undo returned to (engine/solveit/rungs/add.js): the reminder at S1 (the opposite
  // of the number next to x, after a value that was that opposite), Party or Battle at x = −8 + 11 after added sizes
  hint: (s, before = null) => hintAfterUndo(s, before),
  prompt: (s) => (moveOwed(s) ? 'lxMustMove' : 'aFindX'),
  // the help at x alone (Build C, Part 3): "Party or battle?" floats at the two numbers, then "Now type x." at the field
  ask(s) {
    // the scaffold's pair: party or battle, floating right above the two groups on the balance (Build D, Part 5)
    if (s.scaffold && s.combining?.step === 'kind') return { kind: 'ask', target: 'combining', choices: [['Party!', 'party'], ['Battle!', 'battle']] };
    if (s.alone?.step === 'pb') return { kind: 'ask', target: 'otherSide', choices: [['Party!', 'party'], ['Battle!', 'battle']] };
    // a party of negatives typed without its sign (Build I, Part 3): the sign question at the two numbers, which stay lit
    if (s.alone?.step === 'sign') return { kind: 'ask', target: 'otherSide', choices: [['+', '+'], ['−', '-']], choiceAction: 'whoWon', big: true };
    if (s.alone?.sizes && (s.alone.step === 'who' || s.alone.step === 'type')) return { kind: 'ask', target: 'otherSide', lit: s.alone.step === 'type' ? ['answer'] : [], bubbles: aloneBubbles(s), slots: 2 };
    // (the two numbers being worked out stay lit, fully readable: never grey out what the question is about, Build H)
    if (s.alone?.step === 'type') return { kind: 'ask', target: 'answer', lit: ['otherSide'] };
    return null;
  },
};
