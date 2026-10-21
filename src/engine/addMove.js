// The Add move itself, "Add ___ to both sides" in one action (lifted out of Add to both sides in Build K so the Two-step card uses the same
// one): the amount's checks, the work row and the board after it (the numbers on x's side cancel on their own, the other side is left as
// it is), and the judging: the lights from the shapes before and after, committed through the loop (a helpful move is the new equation;
// any other waits for Undo), and what it did said in the student's numbers. x may have a number in front of it (`3x + 4 = 19`). A card
// says how its boards are read (`shape`), what x alone is, and how it talks. No DOM.

import { lightsOf } from './solveit/shape.js';
import { signed } from './solveTerms.js';
import { xSideOf, otherSideOf, sumNums, xConstantTerm, workLine, lightBoard } from './addBothMoves.js';

const plus = (v) => (v < 0 ? `${signed(v)}` : `+${v}`);
export const amountOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : null);

// A move has been made (in Add to both sides' seesaw, once everything that can combine has): judged and committed. `s.prevBoard` is the
// board before it. o: { shape(board), say }.
export function judgeAdd(s, api, amount, o) {
  const before = s.prevBoard;
  const lights = lightsOf(o.shape(before), o.shape(s.board));
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
    return o.say(s, 'aZeroOther', {}, true);
  }
  if (lights.fewer === 'red') {
    if (s.reds >= 3) s.startOver = true;
    return o.say(s, s.reds >= 3 ? 'aRed3' : 'aRed', params, true);
  }
  if (lights.solved === 'green') return o.say(s, 'aSolvedBoard');
  if (lights.fewer === 'neutral') return o.say(s, 'aPartial', { ...params, con: plus(xConstantTerm(s.board)?.v ?? 0) });
  return o.say(s, 'aGreen');
}

// The bare move (no seesaw): the amount in the blank, added to both sides in one action. Returns the state, or null when the amount is
// not one the move takes (the card's message is already said). o: { alone(board), shape(board), say }.
export function addBare(s, api, o) {
  const amount = amountOf(s.amountEntry);                        // (the light design allows a 0: it just doesn't help)
  if (amount === null || (amount === 0 && !s.allowZero)) return o.say(s, 'aAmountZero', {}, true);
  if (Math.abs(amount) > 15) return o.say(s, 'aAmountBig', {}, true);
  if (s.forced && amount !== s.forcedAmount) return o.say(s, 'aForced', { amount: signed(s.forcedAmount) }, true);
  const gate = api.blockMove(s);
  if (gate) return gate;
  api.pushHistory(s);
  const before = s.board;
  if (o.rebase) s.prevBoard = before;
  s.alone = null;
  s.work = workLine(before, amount);
  s.board = lightBoard(before, amount);                            // (the commit writes the rows for it)
  s.zeroOther = !o.alone(s.board) && sumNums(before[otherSideOf(before)]) + amount === 0;
  s.lastAmount = amount;
  Object.assign(s, { menu: null, typing: null, amountEntry: '', hint: null });
  return judgeAdd(s, api, amount, o);                              // (judged against s.prevBoard, the board the move was made on)
}
