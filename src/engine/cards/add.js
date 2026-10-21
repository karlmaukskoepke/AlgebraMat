// Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md) as a card of the shared Solve it loop (engine/solveLoop.js), since Build E (P4). The loop
// owns what every card shares: the x = [ ] row (always live), guesses and the final value with the check beside the equation, the
// forced-move rule, committing a move (a helpful one writes the new equation; an unhelpful one waits for Undo), Undo, Start over, and the
// help ladder, which reads the scaffold registry by the shape of the equation on screen (engine/solveit/rungs/add.js). This file says only
// what is Add to both sides' own:
//   - the board (an x and numbers) and the one move: an amount added to both sides in one action; the numbers on x's side cancel on
//     their own and the other side is left as it is, so the value is never shown;
//   - Trade places (Level 5 up, x on the right): the sides swapped, not judged; the first time it matters it is pointed out;
//   - the seesaw, from I'm stuck or Teach me: building the equation (Levels 2-3), the two-action move (one side, then the other, then
//     Go), and the pairs combined by Party or Battle; it stays up until the problem ends;
//   - at x alone, Party or Battle at the two numbers and Count it's counters walk (or its big-number walk), driven here;
//   - the lights (from the shapes), the slips, and what its moves say.
// No DOM here.

import { createSolveLoop } from '../solveLoop.js';
import { shapeOfBoard, lightsOf } from '../solveit/shape.js';
import { constantOf, signed, tagAddBoth } from '../addBoth.js';
import { typeInto, isTyping } from '../entry.js';
import { emptySkills } from '../skills.js';
import {
  startBoard, xAlone, xSideOf, otherSideOf, find, sideOf, combinable, unresolved, kindOf, combineTerms, sumNums, xConstantTerm,
  alonePair, lightBoard, workLine, tilt, balanced, num,
} from '../addBothMoves.js';
import { aloneAsk, plus, say, problemParams, crossOff, pastCounters, sizesOf } from './addHelp.js';
import { reduce as reduceWalk } from '../session.js';
import { reduceBig } from '../bigSession.js';
import { hintAfterUndo } from '../solveit/registry.js';

// ---------- Trade places ----------

// Offered from Level 5, where x can be on the right. The first time it matters it is pointed out and the student has to click it.
export const TRADE_LEVEL = 5;
export const tradeAvailable = (s) => s.level >= TRADE_LEVEL && !s.scaffold && s.stage === 'moves' && !s.sub && !s.pending && !s.combining
  && !s.resolving && xSideOf(s.board) === 'right';
export const tradePending = (s) => Boolean(s.tradeIntro) && s.tradeCount === 0 && tradeAvailable(s);

const amountOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : null);
// Keys go to the amount's blank (rather than x =) while the move is open.
export const amountKeys = (s) => s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second);

// ---------- a move, judged ----------

// A move has been made (and, in the seesaw, everything that can combine has): it is judged by the lights (from the shapes before and
// after), committed through the loop (a helpful move is the new equation; any other waits for Undo), and said in the student's numbers.
function judgeMove(s, api, amount) {
  const before = s.prevBoard;
  const lights = lightsOf(shapeOfBoard(before), shapeOfBoard(s.board));
  const helpful = lights.fewer === 'green';
  const redsBefore = s.reds;
  const next = s.board;
  api.commit(s, { rows: [{ type: 'work', work: workLine(before, amount) }, { type: 'eq', board: next }], next, label: null, helpful, lights, keepScaffold: s.scaffold });
  if (helpful) delete s.slipPair;                                // (a wrong move keeps its pair for the picture until Undo, Build F)
  // what the addition did, in the student's numbers (Build D-2): the number next to x before the move, and the amount added
  const params = { amount: signed(amount), before: plus(sumNums(before[xSideOf(before)])), added: plus(amount) };
  s.prevBoard = next;
  s.resolving = false;
  s.reds = lights.fewer === 'red' || s.zeroOther ? redsBefore + 1 : 0;                      // a red or a zeroed side counts toward three
  if (s.zeroOther) {                                                                           // the side without x went to 0 (§3B step 8)
    if (s.reds >= 3) s.startOver = true;
    return say(s, 'aZeroOther', {}, true);
  }
  if (lights.fewer === 'red') {
    if (s.reds >= 3) s.startOver = true;
    return say(s, s.reds >= 3 ? 'aRed3' : 'aRed', params, true);
  }
  if (lights.solved === 'green') return say(s, 'aSolvedBoard');
  if (lights.fewer === 'neutral') return say(s, 'aPartial', { ...params, con: plus(xConstantTerm(s.board)?.v ?? 0) });
  return say(s, 'aGreen');
}

// ---------- the seesaw: building, the two-action move, the pairs ----------

const xSideName = (s) => (s.problem.mirror ? 'right' : 'left');

// Change a group of counters while building: returns a message to say (a mistake), 'none', or null when it worked.
function buildChange(s, group, sign, remove) {
  const cur = s.built[group];
  if (remove) { if (cur === 0) return 'none'; s.built[group] = cur - Math.sign(cur); return null; }
  if (cur !== 0 && Math.sign(cur) !== sign) return say(s, 'aBuildOneSign', { group }, true);
  if (Math.abs(cur) >= 15) return 'none';
  s.built[group] = cur + sign;
  return null;
}

// After a build change: finished (the box and both groups match the equation) or keep going.
function buildStep(s, problem) {
  if (problem === 'none') return s;
  if (problem) return problem;
  const p = s.problem;
  if (s.built.x && s.built.constant === constantOf(p) && s.built.other === p.b) {
    s.stage = 'moves';
    s.step = 'moves';
    s.pick = null;
    if (s.forced) { s.menu = 'add'; s.rung = 3; s.hint = { kind: 'amount', amount: s.forcedAmount }; s.amountEntry = String(s.forcedAmount); }
    return say(s, 'aBuilt');
  }
  return say(s, 'aBuilding', { have: s.built.constant, other: s.built.other });
}

// The two-action move: an amount added to one side, then to the other (either order). The beam tips, then levels.
function addTo(s, api, side, amountGiven, chip) {
  if (s.stage !== 'moves' || s.menu !== 'add' || !s.scaffold) return 'ignore';
  if (s.resolving) return say(s, 'aSimplifyFirst', {}, true);
  const amount = amountGiven ?? amountOf(s.amountEntry);
  if (amount === null || amount === 0) return say(s, 'aAmountZero', {}, true);
  if (chip && (chip === '-') !== (amount < 0)) return say(s, 'aChipSign', { amount: signed(amount), chip: chip === '-' ? 'minus' : 'plus' }, true);
  if (Math.abs(amount) > 15) return say(s, 'aAmountBig', {}, true);
  if (s.forced && amount !== s.forcedAmount) return say(s, 'aForced', { amount: signed(s.forcedAmount) }, true);
  if (s.pending && s.pending.side === side) return say(s, 'aOtherSide', {}, true);
  const snap = api.snapshot(s);
  const term = num(amount);
  s.board = { ...s.board, [side]: [...s.board[side], term] };
  if (side === 'left') s.leftDelta += amount; else s.rightDelta += amount;
  if (!s.pending) {
    s.history.push(snap);
    s.pending = { side, amount, ids: [term.id], second: true };
    s.amountEntry = String(amount);                                       // pre-filled for the other side
    return say(s, 'aAddedOne', { amount: signed(amount), side, tilt: Math.abs(tilt(s)), heavier: tilt(s) > 0 ? 'left' : 'right' });
  }
  s.pending = { ...s.pending, ids: [...s.pending.ids, term.id], both: true, otherAmount: amount };
  return balanced(s)
    ? say(s, 'aBalanced', { amount: signed(amount) })
    : say(s, 'aUnbalanced', { tilt: Math.abs(tilt(s)), heavier: tilt(s) > 0 ? 'left' : 'right' }, true);
}

const pairOf = (s) => ({ a: find(s.board, s.combining.a), b: find(s.board, s.combining.b) });
function pairParams(s) {
  const { a, b } = pairOf(s);
  return { g1: signed(a.v), g2: signed(b.v), kind: kindOf(a.v, b.v), total: signed(a.v + b.v) };
}

// The next two numbers on a side that can combine (the pair beside x first: it cancels on its own) are highlighted and the student is
// asked: Party or Battle? With none left, the move is judged.
function startPair(s, api) {
  const pairs = combinable(s.board);
  const pair = pairs.find((q) => q.side === xSideOf(s.board)) ?? pairs[0];
  if (!pair) {
    s.combining = null;
    if (s.helpCombine) { s.helpCombine = false; s.resolving = false; return say(s, 'aSolvedBoard'); }   // help only: no judging
    return judgeMove(s, api, s.lastAmount);
  }
  s.combining = { a: pair.a, b: pair.b, step: 'kind', crossed: false, entry: '' };
  const n = s.combinedNote;
  return say(s, 'aPartyOrBattle', { ...pairParams(s), before: n ? `${n.kind === 'party' ? 'Party' : 'Battle'}! ${n.g1} and ${n.g2} make ${n.total}.` : '' });
}

// The pair beside x is combined (the seesaw's ritual) and the next pair is asked about. While the move is being resolved the pairs are part
// of it, so one Undo takes the whole move back (the loop's rule); pairs combined outside a move are each their own step.
function combineNow(s, api, a, b, kind, params) {
  if (!s.resolving) api.pushHistory(s);
  const side = sideOf(s.board, a.id);
  const had = new Set(s.board[side].map((t) => t.id));
  s.board = combineTerms(s.board, a.id, b.id);
  // the pair beside x, while a move is resolved: if the move turns out wrong, the seesaw shows it again, its cancelled pairs crossed off
  // (the picture spotlight, Build F, Part 3)
  if (s.resolving && side === xSideOf(s.board)) s.slipPair = { a: a.v, b: b.v, kind, id: s.board[side].find((t) => !had.has(t.id))?.id ?? null };
  s.combining = null;
  s.combinedNote = { kind, g1: params.g1, g2: params.g2, total: params.total };
  return startPair(s, api);
}

// ---------- x alone: Count it's walks, driven by their own actions ----------

// The walk stops at its answer step: the student types the value in x =, not in the walk.
const WALK_ACTIONS = new Set(['pickSign', 'tapZone', 'tapCounter', 'tapBox', 'check', 'choose']);
const BIG_ACTIONS = new Set(['choose', 'chooseOp', 'chooseSign']);
function walkStep(s, act) {
  const al = s.alone;
  if (al?.big) {
    if (!BIG_ACTIONS.has(act?.type) || ['answer', 'done'].includes(al.big.step)) return 'ignore';
    const b = reduceBig(al.big, act);
    if (b === al.big) return 'ignore';
    s.alone = { ...al, big: b, kind: b.choice ?? al.kind };
    return say(s, b.step === 'answer' ? 'aAloneCount' : 'aAloneBig');
  }
  if (!al?.walk || !WALK_ACTIONS.has(act?.type) || al.walk.step === 'answer' || al.walk.step === 'done') return 'ignore';
  if (act.type === 'check' && al.walk.step !== 'draw') return 'ignore';
  // crossing off (Build F, Part 3): a tapped counter takes an opposite one with it; a tapped box, every pair it can
  let w = al.walk.step === 'cancel' && (act.type === 'tapCounter' || act.type === 'tapBox') ? crossOff(al.walk, act.zone, act.type === 'tapCounter' ? act.index : null)
    : act.type === 'tapBox' ? al.walk : reduceWalk(al.walk, act);
  if (w === al.walk) return 'ignore';
  if (w.step === 'partyBattle' && al.kind) w = reduceWalk(w, { type: 'choose', choice: al.kind });   // already answered at the numbers
  if ((act.type === 'tapCounter' || act.type === 'tapBox') && w.zones.some((z) => z.some((c) => c.canceled)) && !s.supportsShown.includes('crossoff')) s.supportsShown.push('crossoff');
  s.alone = { ...al, walk: w };
  return say(s, w.step === 'answer' ? 'aAloneCount' : 'aAloneCounters');
}

// ---------- the card ----------

// Only these go on while two numbers are being combined (and the loop's help and Undo).
const WHILE_COMBINING = new Set(['kind', 'crossNext', 'abandon', 'check', 'stuck', 'teach', 'undo']);

const loop = createSolveLoop({
  id: 'add-both',
  startBoard,
  alone: xAlone,
  noLights: () => ({ fewer: 'off', solved: 'off' }),
  params: (s) => problemParams(s.problem),
  extra: (p, { level, introTrade = false }) => ({
    tradeIntro: introTrade && level >= TRADE_LEVEL && Boolean(p.mirror), tradeCount: 0,
    built: { constant: 0, other: 0, x: false }, pick: null, resolving: false, amountEntry: '', pending: null, zeroOther: false,
    leftDelta: 0, rightDelta: 0, prevBoard: null, counterMode: false, startOver: false, helpCombine: false, work: null,
    selected: null, combining: null, combinedNote: null, kindMisses: 0, alone: null, lastAmount: null, forcedAmount: null, teachFlow: false,
    on: { ...emptySkills(), partyBattle: false, sign: false },
  }),
  snapshotExtra: (s) => ({
    leftDelta: s.leftDelta, rightDelta: s.rightDelta, pending: s.pending, prevBoard: s.prevBoard, resolving: s.resolving,
    amountEntry: s.amountEntry, work: s.work, startOver: s.startOver, combining: null, selected: null,
  }),
  // a bare state again (Start over): nothing half made, no seesaw
  resetState(s) {
    Object.assign(s, {
      pending: null, leftDelta: 0, rightDelta: 0, prevBoard: s.board, resolving: false, amountEntry: '', zeroOther: false, work: null,
      combining: null, selected: null, alone: null, startOver: false, counterMode: false, teachFlow: false, forcedAmount: null,
      combinedNote: null,
    });
    delete s.slipPair;
    if (s.stage === 'build') { s.stage = 'moves'; s.step = 'moves'; s.built = { constant: 0, other: 0, x: false }; s.pick = null; }
  },
  collapse: () => false,                                                       // a single-step card: the check never collapses
  mustMoveKey: () => 'lxMustMove',
  touched: (s) => s.amountEntry !== '' || s.tradeCount > 0,
  // something of the card's holds x = [ ] back: the seesaw being built, a half-made move, the pairs; in the seesaw, until x is alone
  answerBlocked: (s) => s.stage === 'build' || Boolean(s.pending) || s.resolving || Boolean(s.combining) || (s.scaffold && !xAlone(s.board)),
  helpBlocked: (s) => s.stage === 'build' || s.resolving || Boolean(s.combining),
  undoReason: (s) => (s.zeroOther ? 'zero' : s.lights.fewer === 'red' ? 'red' : 'partial'),
  // after Undo the move stays chosen with its blank cleared; after zeroing the other side, the number next to x is outlined
  afterUndo(s) {
    const wasZero = s.zeroOther;
    Object.assign(s, { zeroOther: false, alone: null, helpCombine: false, selected: null, undoneZero: false });
    delete s.slipPair;
    if (s.scaffold) return;
    s.menu = 'add';
    s.amountEntry = '';
    if (wasZero) {
      const con = xConstantTerm(s.board);
      s.hint = con ? { kind: 'cancel', id: con.id } : null;
      s.undoneZero = true;
    }
  },
  undoKey: (s) => (s.undoneZero ? 'aZeroUndone' : 'aUndone'),
  tag: (p, typed) => tagAddBoth(p, typed),
  slip: (s, typed, tag) => ({ key: 'aWrong', params: { typed: signed(typed), tag, value: signed(typed + constantOf(s.problem)) } }),

  // ----- Add to both sides' own actions -----
  reduce(s, action, api) {
    s.anim = null;
    // typing: the amount's blank while the move is open, a pair's count; x = is the loop's
    if (isTyping(action)) {
      if (s.stage === 'build') return 'ignore';
      if (s.sub) return undefined;
      if (s.combining) return 'ignore';
      if (amountKeys(s)) {
        const entry = typeInto(s.amountEntry, action, 'integer');
        if (entry === s.amountEntry) return 'ignore';
        s.amountEntry = entry;
        if (!s.scaffold) s.hint = null;
        return s;
      }
      if (s.alone?.step === 'type' || s.alone?.step === 'who') s.alone = { ...s.alone, step: 'typing' };   // "Now type x." (or the two small questions) has done its job
      return undefined;
    }
    if (s.combining && !WHILE_COMBINING.has(action.type)) return 'ignore';

    switch (action.type) {
      // ----- the seesaw: build the equation (Build it's way: pick a piece, tap a side, or drag it up) -----
      case 'buildTap':
        if (s.stage !== 'build') return 'ignore';
        return buildStep(s, buildChange(s, action.group === 'other' ? 'other' : 'constant', action.sign === '-' ? -1 : 1, Boolean(action.remove)));
      case 'pickPiece':
        if (s.stage !== 'build' || !['x', '+', '-'].includes(action.piece)) return 'ignore';
        s.pick = s.pick === action.piece ? null : action.piece;
        return s;
      case 'buildRemove': {
        if (s.stage !== 'build') return 'ignore';
        const side = action.side === 'right' ? 'right' : 'left';
        if (action.what === 'x') { if (!s.built.x) return 'ignore'; s.built.x = false; return buildStep(s, null); }
        return buildStep(s, buildChange(s, side === xSideName(s) ? 'constant' : 'other', 1, true));
      }
      case 'zone':
      case 'drop': {
        const piece = action.type === 'zone' ? s.pick : action.piece;
        const side = action.side === 'right' ? 'right' : 'left';
        if (s.stage === 'build') {
          if (!['x', '+', '-'].includes(piece)) return say(s, 'aPickFirst', {}, true);
          if (piece === 'x') {
            if (side !== xSideName(s)) return say(s, 'aBuildXSide', { xside: xSideName(s) }, true);
            if (s.built.x) return say(s, 'aBuildXHave', {}, true);
            s.built.x = true;
            return buildStep(s, null);
          }
          return buildStep(s, buildChange(s, side === xSideName(s) ? 'constant' : 'other', piece === '-' ? -1 : 1, false));
        }
        if (s.stage === 'moves' && s.scaffold) {
          if (s.menu !== 'add') return say(s, 'aChooseMoveFirst', {}, true);
          return addTo(s, api, side, undefined, action.type === 'drop' ? piece : undefined);
        }
        return 'ignore';
      }
      // a number dragged up into the blank of "Add ___ to both sides" fills it (the student still decides its sign)
      case 'setAmount':
        if (s.stage !== 'moves' || s.resolving || (s.pending && !s.pending.second) || s.sub || s.combining || !Number.isInteger(action.value)) return 'ignore';
        s.menu = 'add';
        s.typing = null;
        s.amountEntry = String(action.value);
        return say(s, 'aAmountSet', { amount: signed(action.value) });

      // ----- the moves: "Add ___ to both sides", and Trade places -----
      case 'choose': {
        if (s.stage !== 'moves' || s.pending || s.sub) return 'ignore';
        if (action.move !== 'add' && action.move !== 'trade') return 'ignore';
        if (s.resolving) return say(s, 'aSimplifyFirst', {}, true);
        const gate = api.blockMove(s);
        if (gate) return gate;
        if (action.move === 'trade') {
          if (!tradeAvailable(s)) return say(s, 'aTradeNot');
          api.pushHistory(s);
          s.board = { left: s.board.right, right: s.board.left };                    // the same equation, the sides swapped (not judged)
          s.rows.push({ type: 'eq', board: s.board });
          s.prevBoard = s.board;
          s.tradeCount += 1;
          Object.assign(s, { menu: null, hint: null, amountEntry: '' });
          return say(s, 'aTraded');
        }
        if (tradePending(s)) return say(s, 'aTradeFirst', {}, true);
        s.menu = 'add';
        s.typing = null;
        return say(s, 'aPickAmount');
      }
      case 'addTo':
        return addTo(s, api, action.side === 'right' ? 'right' : 'left', action.amount, undefined);

      // ----- Go: the seesaw's move once both sides have it, or the bare move in one action -----
      case 'go': {
        if (s.scaffold) {
          if (!s.pending?.both || !balanced(s)) return say(s, 'aGoNotYet', {}, true);
          s.lastAmount = s.pending.amount;
          Object.assign(s, { pending: null, amountEntry: '', menu: null, hint: null });
          if (unresolved(s.board)) { s.resolving = true; return startPair(s, api); }
          return judgeMove(s, api, s.lastAmount);
        }
        if (s.stage !== 'moves' || s.menu !== 'add' || s.sub) return 'ignore';
        const amount = amountOf(s.amountEntry);                        // (the light design allows a 0: it just doesn't help)
        if (amount === null || (amount === 0 && !s.allowZero)) return say(s, 'aAmountZero', {}, true);
        if (Math.abs(amount) > 15) return say(s, 'aAmountBig', {}, true);
        if (s.forced && amount !== s.forcedAmount) return say(s, 'aForced', { amount: signed(s.forcedAmount) }, true);
        const gate = api.blockMove(s);
        if (gate) return gate;
        api.pushHistory(s);
        const before = s.board;
        s.alone = null;
        s.work = workLine(before, amount);
        s.board = lightBoard(before, amount);                            // (the commit writes the rows for it)
        s.zeroOther = !xAlone(s.board) && sumNums(before[otherSideOf(before)]) + amount === 0;
        s.lastAmount = amount;
        Object.assign(s, { menu: null, typing: null, amountEntry: '', hint: null });
        judgeMove(s, api, amount);
        // Teach me's move, done for the student's Go: at x alone, party or battle at the numbers (Build D, Part 5)
        if (s.teachFlow) {
          s.teachFlow = false;
          s.forced = false;
          if (xAlone(s.board) && alonePair(s.board)) aloneAsk(s, say);
        }
        return s;
      }

      // ----- the pairs, in the seesaw: tap one number, then the other; Party or Battle? -----
      case 'select': {
        if (s.stage !== 'moves' || !s.scaffold || s.pending || s.combining) return 'ignore';
        const t = find(s.board, action.id);
        if (!t || t.kind !== 'num') return say(s, 'aOnlyNumbers', {}, true);
        if (!s.selected) { s.selected = t.id; return s; }
        const first = s.selected;
        s.selected = null;
        if (first === t.id) return s;
        if (sideOf(s.board, first) !== sideOf(s.board, t.id)) return say(s, 'aSameSide', {}, true);
        s.combining = { a: first, b: t.id, step: 'kind', crossed: false, entry: '' };
        return say(s, 'aPartyOrBattle', pairParams(s));
      }
      case 'kind': {
        // at x alone: a right pick confirms (nothing is combined, no value written) and moves to x =; a wrong one nudges
        if (s.alone?.step === 'pb') {
          const a = find(s.board, s.alone.a);
          const b = find(s.board, s.alone.b);
          const right = kindOf(a.v, b.v);
          const params = { g1: signed(a.v), g2: signed(b.v), kind: right, picked: action.value };
          if (action.value !== right) { s.kindMisses += 1; return say(s, 'aKindWrong', params, true); }
          // past 12 there are no counters: a battle asks who won, a party asks to add (two small questions at the numbers, Build H, Part 3)
          if (pastCounters(a.v, b.v)) {
            const sizes = sizesOf(a.v, b.v);
            s.alone = { ...s.alone, kind: right, sizes: true, who: null, step: right === 'battle' ? 'who' : 'type' };
            if (right === 'battle') return say(s, 'aAloneWho', { ...params, ...sizes });
            s.typing = 'answer';
            return say(s, 'aAloneAdd', { ...params, ...sizes });
          }
          s.alone = { ...s.alone, kind: right, step: 'type' };
          s.typing = 'answer';
          return say(s, 'aAloneRight', params);
        }
        if (s.combining?.step !== 'kind') return 'ignore';
        const { a, b } = pairOf(s);
        const right = kindOf(a.v, b.v);
        if (action.value !== right) {
          s.kindMisses += 1;
          return say(s, 'aKindWrong', { ...pairParams(s), picked: action.value }, true);
        }
        const params = pairParams(s);
        // The pair beside x cancels on its own. The pair on the other side is the answer being worked out: a right pick only confirms
        // it, and the numbers stay for the student to put together and type (the app never writes the value).
        if (sideOf(s.board, a.id) !== xSideOf(s.board)) {
          s.combining = null;
          s.hint = { kind: 'sum', ids: [a.id, b.id] };
          const judged = s.resolving && !s.helpCombine ? judgeMove(s, api, s.lastAmount) : s;
          s.resolving = false;
          s.helpCombine = false;
          s.hint = { kind: 'sum', ids: [a.id, b.id] };
          const after = judged.feedback;                                                   // how the move went, said after the confirmation
          return say(s, 'aKindRight', { kind: right, alone: xAlone(s.board), after: after && !xAlone(s.board) ? { key: after.key, params: after.params } : null }, Boolean(after?.bad));
        }
        // a battle: the pairs are crossed off and stay on the balance, struck, until the green Next (Build D, Part 5)
        if (right === 'battle') {
          s.combining = { ...s.combining, step: 'struck', crossed: true, kind: 'battle' };
          return say(s, 'aStruck', params);
        }
        return combineNow(s, api, a, b, right, params);
      }
      // who won, at big numbers (a battle): the sign of the bigger team. The app never writes the value; the sizes are told, the sum is not.
      case 'whoWon': {
        const al = s.alone;
        if (al?.step !== 'who' || s.sub || !['+', '-'].includes(action.value)) return 'ignore';
        const sizes = sizesOf(find(s.board, al.a).v, find(s.board, al.b).v);
        if (action.value !== sizes.sign) { s.alone = { ...al, whoMisses: (al.whoMisses ?? 0) + 1 }; return say(s, 'aWhoWrong', sizes, true); }
        s.alone = { ...al, step: 'type', who: action.value };
        s.typing = 'answer';
        return say(s, 'aWhoRight', sizes);
      }
      case 'crossNext': {
        if (s.combining?.step !== 'struck') return 'ignore';
        const { a, b } = pairOf(s);
        return combineNow(s, api, a, b, 'battle', pairParams(s));
      }
      case 'abandon':
        if (!s.combining) return 'ignore';
        s.combining = null;
        return say(s, 'aAbandoned');
      // ----- Count it's walks at x alone (its engine, unchanged) -----
      case 'cnt':
        return walkStep(s, action.act);

      // ----- the typed value: the loop's check, unless the seesaw is busy -----
      case 'check': {
        if (s.combining) return say(s, 'aPickKind', {}, true);
        const readable = /^-?\d+$/.test(s.entry.replace(/−/g, '-').trim());
        if (readable && (s.stage === 'build' || s.pending)) return say(s, 'aFinishMoveFirst', {}, true);
        return undefined;
      }
      default:
        return undefined;
    }
  },
});

// ---------- the card's entry points ----------

export function newAddBoth(problem, { level = 2, introTrade = false, forceMove = false } = {}) {
  const s = loop.newSession(problem, { level, forceMove, introTrade });
  s.prevBoard = s.board;
  return tradePending(s) ? say(s, 'aTradeIntro') : s;
}
export const reduceAddBoth = loop.reduce;
export const solve = loop;
export const { answerLive, helpOk, startOverOk, subView, subTotal, touched, owesMove, moveOwed } = loop;
export const hint = (s, before = null) => hintAfterUndo(s, before);
export { xAlone, alonePair, xSideOf };
