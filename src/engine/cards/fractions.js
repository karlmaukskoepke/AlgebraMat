// Fractions of x (Build AA) as a card of the shared Solve it loop (engine/solveLoop.js), built like Flip everything (engine/cards/flip.js:
// one term on each side, the shared Multiply menu, Flip everything and Trade places) and changed where this card is its own:
//   - the board: a fraction of x on one side (`⅔x`, `2x/3`), a number on the other. The term is an x-term whose number in front is a
//     fraction: { kind: 'x', coef: top, den: q, form }, `top` signed, `den` the bottom (2 to 6), `form` 'times' (`⅔x`, a fraction times x)
//     or 'over' (`2x/3`, the x over the bottom). Both forms are the same term: `coef` and `den` never change in a rewrite, only `form`;
//   - the rewrite toggle: a tap on the fraction writes the same equation in the other form, as a row of its own ("rewrite"), with Undo;
//   - Multiply's whole number is live (here for the first time on a card): multiplying both sides by the bottom cancels the divide (the
//     two 3s crossed off), `x = 3(4)` when x is left alone (the student types 12), else the new numbers (`2x = 18`); a number that does
//     not cancel the bottom is legal but not helpful (the spotlight, Undo);
//   - Divide is helpful when it splits the top and the other side evenly (`⅔x = 6` ÷ 2 is `⅓x = 3`); dividing by a number that does not go
//     into the top is legal but makes the bottom bigger (spotlight, Undo); one that does not go into the other side fails, as on Divide it;
//   - Flip everything from saved Level 4, Trade places from saved Level 5; Add, one over a blank and the fraction greyed;
//   - the box model (engine/fractionsModel.js): the first scaffold, drawn on its own on the first problem of Levels 1 and 3.
// The help is the scaffold registry's (solveit/rungs/fractions.js). No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard } from '../solveit/shape.js';
import { signed, fxTermText } from '../solveTerms.js';
import { xTerm, numTerm, fracOf } from '../divideBoard.js';
import { chooseFraction, takeStep, xSideOf, otherTerm, mapSides } from '../fractionMove.js';
import { commitFlip as sharedFlip, commitFraction as sharedFraction } from '../flipMove.js';
import { makeMultiplyMenu } from '../multiplyMenu.js';
import { hintAfterUndo } from '../solveit/registry.js';
import { FRACTIONS } from '../divide.js';
import { topOf, tagFracX, formatFracX, gcd } from '../fractionsX.js';
import { newModel, modelReduce, modelOpen, modelTyping } from '../fractionsModel.js';
import { fractionsLines } from '../fractionsCheck.js';
import { xCount } from '../solveTerms.js';

export { formatFracX, signed };

export const FLIP_LEVEL = 4;               // −⅔x = b
export const TRADE_LEVEL = 5;              // b = ⅔x
export const MODEL_LEVELS = [1, 3];        // the model is drawn on its own on the first problem of these levels
export const REWRITE_LEVEL = 2;            // the one-time instruction

let counter = 0;
const id = () => `q${++counter}`;
export const fxTerm = (top, q, form = 'times') => ({ id: id(), kind: 'x', coef: top, den: q, form });
export const isFx = (t) => t?.kind === 'x' && (t.den ?? 1) > 1;
export const startBoard = (p) => {
  const xs = [fxTerm(topOf(p), p.q, p.form)];
  const bs = [numTerm(p.b)];
  return p.mirror ? { left: bs, right: xs } : { left: xs, right: bs };
};
export const xTermOf = (board) => board[xSideOf(board)][0];
export const xAlone = (board) => { const t = xTermOf(board); return t?.kind === 'x' && !isFx(t) && (t.coef ?? 1) === 1; };
export const hasFx = (board) => isFx(xTermOf(board));
export const termWords = (t) => (isFx(t) ? fxTermText(t) : (t.coef ?? 1) === 1 ? 'x' : (t.coef ?? 1) === -1 ? '−x' : `${signed(t.coef)}x`);
const shape = (board) => shapeOfBoard(board, 'fracx');

// The lights (worked out, not shown to students): the divide cancelled (no bottom left on x), and Solved for x.
const lightsFor = (board) => ({ cancel: hasFx(board) ? 'off' : 'green', solved: xAlone(board) ? 'green' : 'off' });

export const tradeAvailable = (s) => s.level >= TRADE_LEVEL && s.stage === 'moves' && !s.sub && !s.needUndo && !s.fail && xSideOf(s.board) === 'right';
export const tradePending = (s) => Boolean(s.tradeIntro) && s.tradeCount === 0 && tradeAvailable(s);

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...params }, bad }; return s; };
const MOVE = { shape, alone: xAlone, say: (...a) => say(...a) };

// ---------- the moves ----------

// Multiply both sides by a whole number m (not 0, not −1: those are the menu's). Helpful when it cancels the bottom.
function multiply(s, m, api) {
  const g = api.blockMove(s);
  if (g) return g;
  if (xAlone(s.board)) return say(s, 'aSolvedBoard');
  api.fold(s);
  api.pushHistory(s);
  Object.assign(s, { hint: null, model: null });
  const before = s.board;
  const t = xTermOf(before);
  const o = otherTerm(before);
  const q = t.den ?? 1;
  const top = t.coef ?? 1;
  const work = mapSides(before, (terms) => [{ id: id(), kind: 'times', f: m, inner: [terms[0]] }]);
  const made = top * m;
  let next;
  let helpful;
  let madeText;
  if (made % q === 0) {
    const c = made / q;
    helpful = q > 1;                                                          // the bottom cancelled (a whole number in front gets bigger)
    next = c === 1
      ? mapSides(before, (terms, mine) => (mine ? [xTerm(1)] : [{ id: id(), kind: 'times', f: m, inner: [numTerm(o.v)] }]))   // x = 3(4)
      : mapSides(before, (terms, mine) => (mine ? [xTerm(c)] : [numTerm(o.v * m)]));
    madeText = termWords({ kind: 'x', coef: c });
  } else {
    const k = gcd(made, q);
    const nt = fxTerm(made / k, q / k, t.form);
    next = mapSides(before, (terms, mine) => (mine ? [nt] : [numTerm(o.v * m)]));
    helpful = false;
    madeText = termWords(nt);
  }
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { mult: m }, helpful, lights: lightsFor(next) });
  s.fail = null;
  if (!helpful) {
    s.answers.push({ typed: `multiply ${m}`, tag: 'fx-mult-wrong' });
    return say(s, q > 1 ? 'xMultNo' : 'xMultWhole', { m: signed(m), q, made: madeText, was: termWords(t), a: Math.abs(top), form: t.form }, true);
  }
  return say(s, xAlone(next) ? 'aSolvedBoard' : 'aFindX');
}

// Divide both sides by n (sign −1: by −n) on a fraction of x. Helpful when n goes into the top and into the other side.
const fracTerm = (n, inner, sign) => (sign < 0 ? { ...fracOf(n, inner), sign: -1 } : fracOf(n, inner));
function divideFx(s, action, api) {
  if (s.menu !== 'fraction' || !FRACTIONS.includes(action.n)) return 'ignore';
  const g = api.blockMove(s);
  if (g) return 'ignore';
  const n = action.n;
  const sign = action.sign === -1 ? -1 : 1;
  const before = s.board;
  const t = xTermOf(before);
  const o = otherTerm(before);
  api.pushHistory(s);
  Object.assign(s, { hint: null, model: null });
  const work = mapSides(before, (terms) => [fracTerm(n, [terms[0]], sign)]);
  if (o.v % n !== 0) {
    s.fail = { n, fx: true };
    s.tryForm = 'frac';
    s.reds += 1;
    s.rows.push({ type: 'work', board: work, failed: true });
    return say(s, 'xDivSplit', { n, b: signed(o.v), q: t.den, top: Math.abs(t.coef) }, true);
  }
  const top = t.coef * sign;
  let nt;
  let helpful;
  if (top % n === 0) { nt = fxTerm(top / n, t.den, t.form); helpful = true; }
  else { const k = gcd(top, t.den * n); nt = fxTerm(top / k, (t.den * n) / k, t.form); helpful = false; }
  const next = mapSides(before, (terms, mine) => (mine ? [nt] : [numTerm((o.v * sign) / n)]));
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { n, ...(sign < 0 ? { sign } : {}) }, helpful, lights: lightsFor(next) });
  s.fail = null;
  if (!helpful) {
    s.answers.push({ typed: `divide ${n * sign}`, tag: 'fx-div-wrong' });
    return say(s, 'xDivNo', { n, q: t.den, made: termWords(nt), was: termWords(t), form: t.form }, true);
  }
  return say(s, 'aFindX');
}

// Flip everything on a fraction of x: `−1(−⅔x) = −1(6)`, then `⅔x = −6`. Helpful when the fraction had a minus.
function flipFx(s, api) {
  api.fold(s);
  api.pushHistory(s);
  Object.assign(s, { hint: null, model: null });
  const before = s.board;
  const t = xTermOf(before);
  const o = otherTerm(before);
  const work = mapSides(before, (terms) => [{ id: id(), kind: 'times', f: -1, inner: [terms[0]] }]);
  const nt = fxTerm(-t.coef, t.den, t.form);
  const next = mapSides(before, (terms, mine) => (mine ? [nt] : [numTerm(-o.v)]));
  const helpful = t.coef < 0;
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { flip: true }, helpful, lights: lightsFor(next) });
  s.fail = null;
  if (!helpful) return say(s, 'fWorse', { was: termWords(t), now: termWords(nt), b: signed(o.v), nb: signed(-o.v) }, true);
  if (s.flipIntro && s.flipCount === 0) say(s, 'fFlipIntro');
  else say(s, 'aFindX');
  s.flipCount += 1;
  return s;
}

// The rewrite toggle: the same term in the other form, written as its own row ("rewrite"); the value never changes.
function rewrite(s, api) {
  if (s.stage !== 'moves' || s.sub) return 'ignore';
  const g = api.blockMove(s);
  if (g) return g;
  const t = xTermOf(s.board);
  if (!isFx(t)) return 'ignore';
  api.fold(s);
  api.pushHistory(s);
  const nt = { ...t, id: id(), form: t.form === 'over' ? 'times' : 'over' };
  const next = mapSides(s.board, (terms, mine) => (mine ? [nt] : terms));
  s.board = next;
  s.rows.push({ type: 'fold', label: { rewrite: true }, board: next });
  s.moveStart = s.rows.length;
  s.rewriteCount += 1;
  Object.assign(s, { menu: null, mopts: null, hint: null, typing: null });
  if (s.ui) s.ui = { ...s.ui, preview: false, rewrite: false };
  return say(s, 'xRewritten', { was: termWords(t), now: termWords(nt) });
}

// The check (the loop's, with this card's lines: `⅔(9) = 6`, `2(9)/3 = 6`, `18/3 = 6`): a wrong guess in the current equation, a value or
// a correct answer in the original.
function check(s, api) {
  if (s.sub) return s;
  const typedText = s.entry.replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(typedText)) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
  if (!api.answerLive(s)) return 'ignore';
  const typed = Number(typedText);
  const correct = typed === s.problem.x;
  const kind = api.alone(s) ? 'value' : 'guess';
  const tag = correct ? null : tagFracX(s.problem, typed);
  if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
  s.guessedFirst = correct && kind === 'guess' && s.rows.length === 1 && s.history.length === 0;
  const current = !correct && kind === 'guess';
  const target = current ? s.board : s.rows[0].board;
  s.sub = { kind, typed, ok: correct, tag, target: current ? 'current' : 'original', lines: fractionsLines(target, typed).lines, placing: true, step: 0, xs: xCount(target), filled: [] };
  return say(s, 'aPlace', { typed: signed(typed), where: s.sub.target });
}

// ---------- the card ----------

const loop = createSolveLoop({
  id: 'fractions-of-x',
  startBoard,
  alone: xAlone,
  noLights: () => ({ cancel: 'off', solved: 'off' }),
  extra: (p, { level, introTrade = false, introFlip = false, autoModel = false, introRewrite = false }) => ({
    fail: null, deal: null, diag: null, pic: null, tried: [], model: autoModel ? newModel(p, { auto: true }) : null,
    tradeIntro: introTrade && level >= TRADE_LEVEL && Boolean(p.mirror), tradeCount: 0, flipIntro: introFlip, flipCount: 0, rewriteCount: 0,
    rewriteIntro: introRewrite && level === REWRITE_LEVEL,
  }),
  snapshotExtra: (s) => ({ fail: null, deal: null, diag: null, pic: null, model: s.model ? structuredClone(s.model) : null }),
  resetState: (s) => { s.fail = null; s.deal = null; s.diag = null; s.pic = null; },
  mustMoveKey: () => 'aMustMove',
  undoKey: () => 'aUndone',
  touched: (s) => s.tradeCount > 0 || s.rewriteCount > 0 || Boolean(s.model?.q),
  waitingForUndo: (s) => Boolean(s.fail),
  undoReason: (s) => (s.fail ? 'fail' : 'red'),
  answerBlocked: (s) => modelTyping(s),
  tag: (p, typed) => tagFracX(p, typed),
  slip: (s, typed, tag) => ({ key: 'xWrong', params: { typed: signed(typed), tag } }),

  reduce(s, action, api) {
    const m = modelReduce(s, action, api, MOVE);
    if (m !== undefined) return m;
    switch (action.type) {
      case 'greyMove':
        return say(s, action.move === 'flip' && s.level < FLIP_LEVEL ? 'aLaterLevel' : 'aLater');
      case 'check':
        return check(s, api);
      case 'multiply':
        return multiply(s, action.m, api);
      case 'rewrite':
        return rewrite(s, api);
      case 'choose': {
        if (action.move === 'fraction') return chooseFraction(s, api, say, xAlone);
        if (action.move === 'flip') {
          const g = api.blockMove(s);
          if (g) return g;
          if (xAlone(s.board)) return say(s, 'aSolvedBoard');
          s.menu = 'flip';
          return s;
        }
        if (action.move === 'trade') {
          if (!tradeAvailable(s)) return say(s, 'aTradeNot');
          const g = api.blockMove(s);
          if (g) return g;
          api.fold(s);
          api.pushHistory(s);
          s.board = { left: s.board.right, right: s.board.left };                     // the same equation, the sides swapped (not judged)
          s.rows.push({ type: 'eq', board: s.board });
          s.moveStart = s.rows.length;
          s.tradeCount += 1;
          Object.assign(s, { menu: null, hint: null, model: null });
          return say(s, 'fTraded');
        }
        return undefined;
      }
      case 'take':
        if (hasFx(s.board)) return divideFx(s, action, api);
        return takeStep(s, action, api, say, (st, n, sign) => { st.model = null; return sharedFraction(st, n, sign, api, MOVE); });
      case 'flip': {
        if (s.level < FLIP_LEVEL) return say(s, 'aLaterLevel');
        const g = api.blockMove(s);
        if (g) return g;
        if (xAlone(s.board)) return say(s, 'aSolvedBoard');
        if (hasFx(s.board)) return flipFx(s, api);
        api.fold(s);
        s.model = null;
        const out = sharedFlip(s, api, MOVE);
        if (!out.needUndo) { if (s.flipIntro && s.flipCount === 0) say(s, 'fFlipIntro'); s.flipCount += 1; }
        return out;
      }
      default:
        return undefined;
    }
  },
});

// ---------- the card's entry points ----------

export function newFractions(problem, { level = 1, forceMove = false, introTrade = false, introFlip = false, autoModel = false, introRewrite = false } = {}) {
  const s = loop.newSession(problem, { level, forceMove, introTrade, introFlip, autoModel: autoModel && !forceMove, introRewrite: introRewrite && !forceMove });
  if (s.model) return say(s, 'mCutAsk', { q: problem.q });
  if (s.rewriteIntro) return say(s, 'xRewriteIntro', { was: termWords(xTermOf(s.board)), now: termWords({ ...xTermOf(s.board), form: 'over' }), q: problem.q });
  return tradePending(s) && !forceMove ? say(s, 'aTradeIntro') : s;
}
export const solve = loop;
export { modelOpen };

// Multiply on this card: the whole number and Divide live; one over a blank and the fraction greyed (the reciprocal is not taught here);
// Flip everything from saved Level 4.
export function fracOption(kind, s, raw = kind) {
  if (raw === 'unit') return 'grey';
  if (kind === 'whole' || kind === 'div') return 'live';
  if (kind === 'flip') return s.level >= FLIP_LEVEL ? 'live' : 'grey';
  return 'grey';
}
export const FRAC_MENU = makeMultiplyMenu({
  xAlone,
  coefOf: (board) => xTermOf(board).coef ?? 1,
  option: fracOption,
  greyKey: (kind, s) => (kind === 'flip' && s.level < FLIP_LEVEL ? 'aLaterLevel' : 'aLater'),
  probe: 'fraction',
  negTop: true,
});
// The layer: Multiply's whole number goes to this card's own multiply (the shared menu explains a whole number on other cards); 0 and −1
// stay the menu's (0 is refused, −1 is Flip everything).
const menuReduce = FRAC_MENU.withMenu(loop.reduce);
export function reduceFractions(state, action) {
  const m = state.mopts;
  if (action.type === 'go' && m?.kind === 'whole' && /^-?\d+$/.test(m.entry ?? '') && Number(m.entry) !== 0 && Number(m.entry) !== -1) {
    return menuReduce({ ...state, mopts: null }, { type: 'multiply', m: Number(m.entry) });
  }
  // the hover on the fraction: a ghost of the other form (view state only)
  if (action.type === 'ui' && 'rewrite' in (action.patch ?? {})) {
    const on = Boolean(action.patch.rewrite) && state.stage === 'moves' && !state.sub && !state.needUndo && !state.fail && hasFx(state.board);
    return (state.ui?.rewrite ?? false) === on ? state : { ...state, ui: { ...(state.ui ?? {}), rewrite: on } };
  }
  return menuReduce(state, action);
}

// The spotlight on this card: its errors, and the hint after Undo (the model after a wrong value; else the registry's reminder).
const ERRORS = {
  xMultNo: { target: 'coef', label: 'still divided', lit: ['newest'] },
  xMultWhole: { target: 'coef', label: 'bigger', lit: ['newest'] },
  xDivNo: { target: 'coef', label: 'more parts', lit: ['newest'] },
  xDivSplit: { target: 'failSide', label: 'doesn’t split' },
  dFail: { target: 'failSide', label: 'doesn’t split' },
  dFail3: { target: 'failSide', label: 'doesn’t split' },
  fWorse: { target: 'coef', label: 'x has a minus', lit: ['newest'] },
  aUndoFirstHelp: { target: 'lastMove', label: 'waiting for Undo' },
  aUndoGuess: { target: 'subst', lit: ['substLast'] },
  xWrong: { target: 'subst', clear: true, lit: ['substLast'] },
};
export const FRAC_SPOT = {
  error: (s) => ERRORS[s.feedback?.key] ?? null,
  keepsReds: (s) => ['dFail', 'dFail3', 'xDivSplit', 'fWorse', 'xMultNo', 'xMultWhole', 'xDivNo'].includes(s.feedback?.key),
  clear: (s) => { s.entry = ''; s.sub = null; },
  // after a wrong value (or a wrong guess) the hint is the model (Karl: the model is the first scaffold); after a move, the reminder
  hint: (s, before = null) => {
    if (before?.sub && !before.sub.ok && s.model) { say(s, s.model.step === 'x' ? 'mXAgain' : 'mCutAsk', { q: s.problem.q, after: true }); return null; }
    if (before?.sub && !before.sub.ok && !s.model) {
      s.model = newModel(s.problem, { help: true });
      if (!s.supportsShown.includes('model')) s.supportsShown.push('model');
      if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
      say(s, 'mCutAsk', { q: s.problem.q, after: true });
      return null;
    }
    return hintAfterUndo(s, before);
  },
  prompt: (s) => (loop.moveOwed(s) ? 'aMustMove' : 'aFindX'),
};
