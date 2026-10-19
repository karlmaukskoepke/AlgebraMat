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

import { reduceAddBoth, newAddBoth, xAlone, xSideOf, aloneAsk, alonePair } from './addBothMoves.js';
import { isTyping, typeInto } from './entry.js';
import { findTerm, outcomeOf, reorderBoard, combineBoard, pairText, valueOf, crossBoard, otherSide } from './lightsGrab.js';

const slotSide = (board, id) => otherSide(findTerm(board, id).side);

// fieldCursor: x = was clicked, so it shows its blinking cursor until anything else happens (Build D-2, Part 2)
const UI0 = { preview: false, focus: null, shake: false, light: null, hoverMove: null, carry: null, drag: null, fieldCursor: false };
const ui = (s) => s.ui ?? UI0;
const withUi = (s, patch) => ({ ...s, ui: { ...ui(s), ...patch } });
const sameUi = (a, b) => JSON.stringify(ui(a)) === JSON.stringify(ui(b));

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...(s.feedback?.params ?? {}), ...params }, bad }; return s; };

export function newLightsSession(problem, opts = {}) {
  const s = newAddBoth(problem, { level: opts.level, introTrade: opts.introTrade });
  s.allowZero = true;                     // a 0 in the blank is allowed (it simply does not help)
  s.lx = {
    awaitNext: null,                      // the row a just-applied move left, waiting for its Next
    rules: [],                            // rows whose move was committed (a solid rule line under each)
    forced: Boolean(opts.forceMove),      // the problem after a correct guess: shown with a move first (A1)
    movedOnce: false,                     // a move was committed (or a combine applied) on this problem
    moves: 0,                             // moves applied (Undo does not take them back off this count)
    negIds: [],                           // terms whose minus was tapped: shown as "+ −2" (B4)
    combine: null,                        // two like terms dropped together: { a, b, side, entry, wrong } (B3)
    hand: { fewer: 'off' },               // the by-hand Fewer terms light (a combine), beside Each side simplified
    log: {
      previews: 0, chosenAfterPreview: 0, chosenCold: 0, typedBeforeMove: false, sameSignRed: 0, nextPressed: 0, implicitCommits: 0, stuck: 0, teach: 0,
      drags: 0, outcomes: { reorder: 0, cross: 0, combine: 0, distribute: 0, snapBack: 0, keyboard: 0 }, minusTaps: 0,
      lightHovers: {}, moveHovers: {}, sumsWrong: 0,
    },
  };
  s.ui = { ...UI0 };
  return s.feedback?.key === 'aTradeIntro' ? s : say(s, s.lx.forced ? 'lxMustMove' : 'aFindX');
}

// Is the bare move open (S2/S3): the blank in the equation row holds the cursor?
export const blankOpen = (s) => s.menu === 'add' && !s.scaffold && s.stage === 'moves' && !s.sub && !s.pending && !s.combining;
// Can the Add move be previewed or chosen right now (S0)?
export const canChoose = (s) => s.stage === 'moves' && !s.scaffold && !s.sub && !s.pending && !s.combining && !s.resolving && s.menu !== 'add';
// The move is owed (the problem after a correct guess) until one is committed: x = [ ] is greyed and Add has a steady ring (A1).
export const moveOwed = (s) => Boolean(s.lx?.forced) && !s.lx.movedOnce && s.stage === 'moves';
// Can the terms of the newest row be grabbed (B0)? Not while help, a substitution, a half-made move or a combine is going on.
export const canGrab = (s) => s.stage === 'moves' && !s.scaffold && !s.sub && !s.pending && !s.combining && !s.resolving && !s.lx?.combine && !s.lx?.distribute;
export const combineOpen = (s) => Boolean(s.lx?.combine);
// Do keys go to the blank (true) or to x = (false)? The open blank wins until it is applied or cancelled, or x = is tapped.
export const amountMode = (s) => s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second) && !s.combining;

// Is x = [ ] live? Always, from the first frame, except while a substitution is stepped, while the move is owed, and in the
// scaffold until x is alone (as built).
export function lightsAnswerLive(s) {
  if (s.stage === 'done' || s.stage === 'build') return false;
  if (s.lx?.combine || s.lx?.distribute || s.lx?.mult) return false;
  if (s.combining) return s.combining.step === 'count';
  if (s.sub) return s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok;
  if (moveOwed(s)) return false;
  if (s.scaffold) return xAlone(s.board) && !s.pending && !s.resolving;
  return !s.pending && !s.resolving;
}

const amountOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : null);
const xConstant = (board) => board[xSideOf(board)].filter((t) => t.kind === 'num').reduce((a, t) => a + t.v, 0);

// The move waiting for its Next is committed: Undo no longer reaches it and its rule line goes solid.
function commit(s, how) {
  if (s.lx.awaitNext === null) return s;
  s.lx.rules = [...s.lx.rules, s.lx.awaitNext];
  s.lx.awaitNext = null;
  s.history = [];
  s.lx.movedOnce = true;
  if (how === 'next') s.lx.log.nextPressed += 1; else s.lx.log.implicitCommits += 1;
  return s;
}


export function withLights(reduce = reduceAddBoth) {
  const wrapped = (state, action) => {
    // ----- view state only -----
    if (action.type === 'ui') {
      const patch = { ...action.patch };
      if (patch.preview && !canChoose(state)) return state;
      if ((patch.carry || patch.drag) && !canGrab(state)) return state;
      const next = withUi(state, patch);
      if (sameUi(next, state)) return state;
      if (patch.light && patch.light !== ui(state).light) countHover(next, 'lightHovers', patch.light);
      if (patch.hoverMove && patch.hoverMove !== ui(state).hoverMove) countHover(next, 'moveHovers', patch.hoverMove);
      return patch.preview === true ? countPreview(next) : next;
    }
    if (state.stage === 'done') return state;
    const grab = grabAction(state, action, wrapped);
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
      if (state.lx.combine) return closeCombine(state);
      if (blankOpen(state)) return cancel(state);
      return ui(state).preview ? withUi(state, { preview: false }) : state;
    }

    // ----- Next: the move just applied is committed -----
    if (action.type === 'lxNext') {
      if (state.lx.awaitNext === null) return state;
      const s = commit(structuredClone(state), 'next');
      s.ui = { ...UI0, focus: 'answer' };
      return s;
    }

    // ----- choosing the move: preview first on touch, a second tap (or Esc) cancels -----
    if (action.type === 'choose' && action.move === 'add') {
      if (blankOpen(state)) return cancel(state);
      if (action.touch && !ui(state).preview && canChoose(state)) return reduceUi(state, { preview: true });
    }

    // ----- apply with an empty or unreadable blank: the box shakes, nothing else -----
    if (action.type === 'go' && blankOpen(state) && amountOf(state.amountEntry) === null) return withUi(state, { shake: true, preview: false, focus: 'blank' });

    const typingAnswer = isTyping(action) && !amountMode(state);
    // greyed while the move is owed; a good move waiting for its Next counts once the student goes on (it is committed below)
    if ((typingAnswer || (action.type === 'focus' && action.target === 'answer')) && moveOwed(state) && state.lx.awaitNext === null) return state;

    // the input to the engine: the waiting move committed when the student goes on without Next
    let input = state;
    const prep = () => { if (input === state) input = structuredClone(state); return input; };
    if (state.lx.awaitNext !== null && (typingAnswer || ['check', 'choose', 'stuck', 'teach'].includes(action.type))) {
      commit(prep(), 'implicit');
    }
    if (state.lx.combine && ['stuck', 'teach', 'choose', 'check'].includes(action.type)) prep().lx.combine = null;   // help closes the sum

    const s = reduce(input, action);
    if (s === input) return input;                                  // the engine did nothing (an implicit commit still counts)
    s.ui = { ...UI0 };
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
        if (s.history.length <= state.history.length && !s.scaffold) break;    // the engine said no (too big, say)
        if (s.scaffold) break;
        lx.moves += 1;
        const before = state.board;
        const amount = s.lastAmount;
        if (s.lights.fewer === 'red' && state.history.length === 0 && Math.sign(amount) === Math.sign(xConstant(before))) lx.log.sameSignRed += 1;
        if (amount === 0) say(s, 'lxZero', {}, false);
        if (s.lights.fewer === 'green' && !s.zeroOther) {
          lx.awaitNext = s.rows.length - 1;
          s.ui.focus = 'next';
        }
        // Teach me's move is done for the student's "Do it": committed at once; at x alone, party or battle at the numbers (Build D)
        if (s.teachFlow) {
          s.teachFlow = false;
          s.forced = false;
          commit(s, 'implicit');
          if (xAlone(s.board) && alonePair(s.board)) aloneAsk(s);
        }
        break;
      }
      case 'undo':
        if (lx.awaitNext !== null && lx.awaitNext >= s.rows.length) lx.awaitNext = null;
        lx.rules = lx.rules.filter((r) => r < s.rows.length);
        if (blankOpen(s)) s.ui.focus = 'blank';                                     // back to S2: the box cleared and focused
        break;
      case 'startOver':
        lx.awaitNext = null;
        lx.rules = [];
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
  s.ui = { ...UI0 };
  return say(s, moveOwed(s) ? 'lxMustMove' : 'aFindX');
};
const sumParams = (s) => ({ sum: pairText(s.board, s.lx.combine.a, s.lx.combine.b) });

// The actions that are the wrapper's own: a drop (pointer or keyboard), a minus tap, the sum of a combine typed and applied, and the
// Undo of a reorder, a minus tap or a combine. Returns null for anything else.
function grabAction(state, action, wrapped) {
  const lx = state.lx;
  // ----- the sum of a combine: typed into its blank, applied with Enter or ✓ -----
  if (lx.combine && isTyping(action)) {
    const entry = typeInto(lx.combine.wrong ? '' : lx.combine.entry, action, 'integer');
    if (entry === lx.combine.entry && !lx.combine.wrong) return state;
    const s = structuredClone(state);
    s.lx.combine = { ...s.lx.combine, entry, wrong: false };
    s.ui = { ...UI0 };
    return say(s, 'lxCombineAsk', sumParams(s));
  }
  if (action.type === 'lxApply' || (action.type === 'go' && lx.combine)) {
    if (!lx.combine) return state;
    const c = lx.combine;
    if (!/^-?\d+$/.test(c.entry)) return withUi(state, { shake: true });
    const s = structuredClone(state);
    const total = valueOf(findTerm(s.board, c.a).term) + valueOf(findTerm(s.board, c.b).term);
    if (Number(c.entry) !== total) {
      s.lx.combine = { ...c, wrong: true };
      s.lx.log.sumsWrong += 1;
      s.ui = { ...UI0 };
      return say(s, 'lxCombineWrong', { ...sumParams(s), typed: c.entry }, true);
    }
    s.history.push({ lxKind: 'combine', board: s.board, rows: [...s.rows], prevBoard: s.prevBoard, lights: s.lights, hand: s.lx.hand });
    const next = combineBoard(s.board, c.a, c.b, total);
    s.board = next;
    s.prevBoard = next;
    s.rows.push({ type: 'eq', board: next });
    s.lights = { ...s.lights, solved: xAlone(next) ? 'green' : 'off' };
    s.lx.hand = { fewer: 'green' };                         // the by-hand part of Fewer terms (A3): one term fewer
    s.lx.combine = null;
    s.lx.movedOnce = true;
    s.ui = { ...UI0, focus: 'answer' };
    return say(s, xAlone(next) ? 'lxCombinedAlone' : 'lxCombined');
  }

  // ----- Undo: a combine being typed closes; a reorder, a minus tap or a combine is taken back here -----
  if (action.type === 'undo') {
    if (lx.combine) return closeCombine(state);
    const top = state.history[state.history.length - 1];
    if (state.sub || !top?.lxKind) return null;
    const s = structuredClone(state);
    s.history.pop();
    if (top.lxKind === 'minus') s.lx.negIds = s.lx.negIds.includes(top.id) ? s.lx.negIds.filter((x) => x !== top.id) : [...s.lx.negIds, top.id];
    else {
      Object.assign(s, { board: top.board, rows: top.rows, prevBoard: top.prevBoard });
      if (top.lxKind === 'combine') { s.lights = top.lights; s.lx.hand = top.hand; }
    }
    s.ui = { ...UI0 };
    return say(s, 'lxUndone');
  }

  // ----- a minus tapped (B4): "x − 2" ⇄ "x + −2", display only -----
  if (action.type === 'lxMinus') {
    const f = findTerm(state.board, action.id);
    if (!canGrab(state) || !f || f.at === 0 || f.term.kind !== 'num' || f.term.v >= 0) return state;
    const s = structuredClone(state);
    if (s.lx.awaitNext !== null) commit(s, 'implicit');
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
    return out.kind === 'snapX' ? say(s, 'lxXCross', { side: findTerm(state.board, action.id)?.side ?? 'left' }) : s;
  }
  if (out.kind === 'crossX') {
    // x carried across when the other side has x too (no card has such an equation yet): the opposite lands in its slot
    const s = logged(structuredClone(state));
    if (s.lx.awaitNext !== null) commit(s, 'implicit');
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
    if (s0.lx.awaitNext !== null) commit(s0, 'implicit');
    Object.assign(s0, { menu: 'add', typing: null, amountEntry: String(out.amount), hint: null, ui: { ...UI0 } });
    const s = wrapped(s0, { type: 'go' });
    if (s.history.length <= s0.history.length) {                      // the engine said no (too big): nothing moves
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
  if (s.lx.awaitNext !== null) commit(s, 'implicit');
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
    nextPressed: l.nextPressed, implicitCommits: l.implicitCommits, stuck: l.stuck, teach: l.teach,
    guessedRight: s.stage === 'done' && s.sub?.kind === 'guess' && s.sub.ok, forced: s.lx.forced,
    drags: l.drags, outcomes: l.outcomes, minusTaps: l.minusTaps, lightHovers: l.lightHovers, moveHovers: l.moveHovers, sumsWrong: l.sumsWrong,
  };
}

// ---------- the spotlight (Build C, Part 2: engine/spotlight.js) ----------
// Which messages are errors on Add to both sides, what each lights up and its small label, and the hint after Undo: the card's
// reminder rung for the state Undo returned to (the number next to x outlined, "What would we add to both sides to eliminate it?").
// The scaffold (the seesaw) keeps its own messages on the line.
const ADD_ERRORS = {
  // the two numbers added are lit too, and the sum (or what is left) carries the label (Build D-2)
  aRed: { target: 'xnum', label: 'got bigger', lit: ['workpair'] },
  aRed3: { target: 'xnum', label: 'got bigger', lit: ['workpair'] },
  aPartial: { target: 'xnum', label: 'still here', lit: ['workpair'] },
  lxZero: { target: 'xnum', label: 'no change' },
  aZeroOther: { target: 'otherSide', label: 'now 0' },
  aUndoFirstHelp: { target: 'lastMove', label: 'waiting for Undo' },
  aUndoGuess: { target: 'subst' },
  aWrong: { target: 'subst', clear: true },
  lxCombineWrong: { target: 'sumbox', label: 'check this' },
};
const plusText = (v) => (v < 0 ? `−${-v}` : `+${v}`);
export const ADD_SPOT = {
  error: (s) => (s.scaffold ? null : ADD_ERRORS[s.feedback?.key] ?? null),
  keepsReds: (s) => ['aRed', 'aRed3', 'aZeroOther', 'lxZero', 'aPartial'].includes(s.feedback?.key),
  startOverAt: 3,
  clear: (s) => { s.entry = ''; s.sub = null; },
  // `before`: the state Undo was pressed on. A value that was a slip shapes the hint (Build D, Part 2): the opposite of the number next
  // to x lights the Add move with that amount in its blank (its preview); added sizes at x = −8 + 11 ask party or battle at the numbers.
  hint(s, before = null) {
    const tag = before?.sub?.tag ?? (before?.feedback?.key === 'aWrong' ? before.feedback.params?.tag : null);
    // added sizes are read from the numbers on screen (x = 11 − 8 and 19), whatever the tag says (19 is also 11 + 8)
    const pair = xAlone(s.board) ? alonePair(s.board) : null;
    const typed = before?.sub?.typed;
    const sizes = pair && Math.sign(pair[0].v) !== Math.sign(pair[1].v) && Math.abs(typed) === Math.abs(pair[0].v) + Math.abs(pair[1].v);
    if (sizes || (tag === 'sizes-added' && pair)) {
      aloneAsk(s);
      return { ask: true, key: 'aAlonePB', params: { sum: s.feedback.params.sum } };
    }
    const con0 = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
    if (tag === 'gave-opposite' && con0) {
      s.hint = { kind: 'cancel', id: con0.id };
      s.menu = 'add';
      s.amountEntry = String(-con0.v);
      s.typing = null;
      return { target: 'xnum', key: 'aOppHint', params: { constant: plusText(con0.v), opposite: plusText(-con0.v) }, move: 'add' };
    }
    if (xAlone(s.board)) return { target: 'answer', key: 'aStuckSolved' };
    const con = s.board[xSideOf(s.board)].find((t) => t.kind === 'num');
    if (!con) return null;
    s.hint = { kind: 'cancel', id: con.id };
    s.menu = 'add';
    s.amountEntry = '';
    s.typing = null;
    return { target: 'xnum', key: 'aStuckHint', params: { constant: plusText(con.v) }, move: 'add' };
  },
  prompt: (s) => (moveOwed(s) ? 'lxMustMove' : 'aFindX'),
  // the help at x alone (Build C, Part 3): "Party or battle?" floats at the two numbers, then "Now type x." at the field
  ask(s) {
    // the scaffold's pair: party or battle, floating right above the two groups on the balance (Build D, Part 5)
    if (s.scaffold && s.combining?.step === 'kind') return { kind: 'ask', target: 'combining', choices: [['Party!', 'party'], ['Battle!', 'battle']] };
    if (s.alone?.step === 'pb') return { kind: 'ask', target: 'otherSide', choices: [['Party!', 'party'], ['Battle!', 'battle']] };
    if (s.alone?.step === 'type') return { kind: 'ask', target: 'answer' };
    return null;
  },
};
