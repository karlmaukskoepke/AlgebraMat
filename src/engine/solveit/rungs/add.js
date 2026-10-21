// Add to both sides' help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Every rung reads the
// equation on screen (the number now next to x, the two numbers at x alone), never the original problem. The shared ladder decides which
// rung a click gets and records its class-sheet word; a rung only sets up what the student does next. (Moved here from the card's own
// `climb` and `teach` in Build E, P4: the rungs, their messages and their words are the same.)

import { xConstantTerm, cancelAmount, alonePair, xAlone, negativeParty } from '../../addBothMoves.js';
import { enterScaffold, aloneAsk, aloneCounters, plus, say } from '../../cards/addHelp.js';

const plusText = (v) => (v < 0 ? `−${-v}` : `+${v}`);
const plusless = (v) => (v < 0 ? `−${-v}` : `${v}`);
// What the seesaw's rungs say: the number next to x and the move that cancels it.
function scaffoldParams(s) {
  const constant = xConstantTerm(s.board);
  const amount = cancelAmount(s.board);
  return { constant: constant ? plus(constant.v) : '', opposite: amount === null ? '' : plus(amount) };
}

// S1 `x + c = b` (and the seesaw's half-made move, T1 and T2): the reminder, then the seesaw (Model it), the two-action move (Choose
// the move), the amount filled in (Guided).
const S1 = {
  ladder: ['hintPopup', 'modelIt', 'chooseMove', 'guided'],
  // the reminder: the number next to x outlined, the Add blank open, "What would we add to both sides to eliminate it?"
  hintPopup: {
    word: 'hint',
    open(s) {
      const con = xConstantTerm(s.board);
      s.hint = con ? { kind: 'cancel', id: con.id } : null;
      s.menu = 'add';
      s.typing = null;
      s.amountEntry = '';
      return say(s, 'aStuckHint', { constant: con ? plus(con.v) : '' });
    },
    // after Undo; a value that was a slip shapes it (Build D, Part 2): the opposite of the number next to x lights the Add move with that
    // amount in its blank (its preview)
    after(s, before) {
      const tag = before?.sub?.tag ?? (before?.feedback?.key === 'aWrong' ? before.feedback.params?.tag : null);
      const con = xConstantTerm(s.board);
      if (!con) return null;
      s.hint = { kind: 'cancel', id: con.id };
      s.menu = 'add';
      s.typing = null;
      if (tag === 'gave-opposite') {
        s.amountEntry = String(-con.v);
        return { target: 'xnum', key: 'aOppHint', params: { constant: plusText(con.v), opposite: plusText(-con.v) }, move: 'add' };
      }
      s.amountEntry = '';
      return { target: 'xnum', key: 'aStuckHint', params: { constant: plusText(con.v) }, move: 'add' };
    },
  },
  modelIt: {
    word: 'model',
    open(s) {
      enterScaffold(s);
      if (s.stage === 'build') return say(s, 'aBuild');
      const constant = xConstantTerm(s.board);
      s.hint = constant ? { kind: 'cancel', id: constant.id } : null;
      return say(s, 'aStuck1', scaffoldParams(s));
    },
  },
  chooseMove: {
    word: 'move',
    open(s) {
      enterScaffold(s);
      if (s.stage === 'build') return say(s, 'aBuild');
      s.menu = 'add';
      return say(s, 'aStuck2', scaffoldParams(s));
    },
  },
  guided: {
    word: 'guided',
    open(s) {
      enterScaffold(s);
      if (s.stage === 'build') return say(s, 'aBuild');
      const amount = cancelAmount(s.board);
      s.menu = 'add';
      s.hint = { kind: 'amount', amount };
      s.amountEntry = String(amount);
      return say(s, 'aStuck3', scaffoldParams(s));
    },
  },
  // Teach me (Build D, Part 5): the move that cancels the number now next to x, already in the Add move's blank (its preview on the
  // equation), with Go on the green button; then party or battle at the numbers. In the seesaw: the same amount, pre-filled. Never the value.
  teach: {
    open(s) {
      const con = xConstantTerm(s.board);
      s.forcedAmount = cancelAmount(s.board);
      if (!s.scaffold) {
        s.teachFlow = true;
        s.menu = 'add';
        s.typing = null;
        s.amountEntry = String(s.forcedAmount);
        s.hint = con ? { kind: 'cancel', id: con.id } : null;
        return say(s, 'aTeachDo', { opposite: plus(s.forcedAmount), constant: con ? plus(con.v) : '' });
      }
      if (s.stage === 'build') return say(s, 'aBuild');
      s.menu = 'add';
      s.rung = 3;
      s.hint = { kind: 'amount', amount: s.forcedAmount };
      s.amountEntry = String(s.forcedAmount);
      return say(s, 'aTeach', { opposite: plus(s.forcedAmount), constant: con ? plus(con.v) : '' });
    },
  },
};

// S2 `x = b + k` (and S5, the same with more numbers: the first two): Party or Battle at the two numbers, then Count it's counters walk
// (its big-number walk past 12). The app never writes the value.
const S2 = {
  ladder: ['partyBattle', 'countersWalk'],
  partyBattle: { word: 'hint', open: (s) => aloneAsk(s, say) },
  countersWalk: { word: 'model', open: (s) => aloneCounters(s, say) },
  bigNumberWalk: { word: 'model', open: (s) => aloneCounters(s, say) },          // (the counters rung takes this one past the counters' limit)
  // after Undo: added sizes at x = −8 + 11 ask party or battle at the numbers (read from the numbers on screen, whatever the tag says,
  // since 19 is also 11 + 8); anything else points at x =
  hintPopup: {
    after(s, before) {
      const tag = before?.sub?.tag ?? (before?.feedback?.key === 'aWrong' ? before.feedback.params?.tag : null);
      // a party of negatives typed without its sign (x = −2 + −13, typed 15; Build I, Part 3): the sign question at the two numbers,
      // "−2 and −13 are both negatives. A party of negatives makes ___" with a big + and −; recorded as the reminder (`hint`)
      const negs = negativeParty(s.board);
      if (tag === 'party-neg-sign' && negs) {
        s.alone = { a: negs[0].id, b: negs[1].id, kind: 'party', step: 'sign', walk: null, who: null };
        s.hint = { kind: 'sum', ids: negs.map((t) => t.id) };
        s.menu = null;
        s.typing = null;
        if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
        return { ask: true, key: 'aNegSign', params: { a: plusless(negs[0].v), b: plusless(negs[1].v) } };
      }
      const pair = xAlone(s.board) ? alonePair(s.board) : null;
      const typed = before?.sub?.typed;
      const sizes = pair && Math.sign(pair[0].v) !== Math.sign(pair[1].v) && Math.abs(typed) === Math.abs(pair[0].v) + Math.abs(pair[1].v);
      if (sizes || (tag === 'sizes-added' && pair)) {
        aloneAsk(s, say);
        return { ask: true, key: 'aAlonePB', params: { sum: s.feedback.params.sum } };
      }
      return { target: 'answer', key: 'aStuckSolved' };
    },
  },
  // Teach me at x alone: there is no move to force; party or battle at the numbers, then the counters
  teach: {
    open(s) {
      s.forced = false;
      return s.alone ? aloneCounters(s, say) : aloneAsk(s, say);
    },
  },
};

// S7 `x = v`: nothing to help with but typing it.
const S7 = { ladder: [], none: 'aStuckSolved', hintPopup: { after: () => ({ target: 'answer', key: 'aStuckSolved' }) } };
// T0: the seesaw being built (help waits until it is built).
const T0 = { ladder: [], none: 'aBuild' };
// S3, S4, S6: a move that waits for Undo: I'm stuck and Teach me answer "Undo first" (the loop's, for every card).
const WAITING = { waiting: true };

export const ADD_RUNGS = { S1, T1: S1, T2: S1, S2, S5: S2, S7, T0, S3: WAITING, S4: WAITING, S6: WAITING };
