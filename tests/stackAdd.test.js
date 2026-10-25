// @vitest-environment happy-dom
// Build T, Part 5: an x-term added in a column. The boxes sit under the first x-term of each side, either takes the keys (one amount,
// both sides), and the work row writes the amount under the x-term it was added to, the cancelling pair struck; the new row puts the
// added x-term beside its like term.
import { describe, it, expect } from 'vitest';
import { bothSidesPlay as P } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { addToBoth } from '../src/engine/cards/bothSides.js';
import { boardText } from '../src/engine/solveTerms.js';

const run = (s, acts) => acts.reduce((st, a) => P.reduce(st, a), s);
const start = () => P.newSession({ ...packById('variables-both-sides').generate(2, 21)[0], logLevel: 2 }, {});     // 5x + 5 = 2x + 14
const open = (s) => run(s, [{ type: 'choose', move: 'add' }, { type: 'addPick', kind: 'x' }]);
const text = (el) => el.textContent.replace(/\s+/g, '');

describe('Build T, Part 5: the stacked x-term Add', () => {
  it('the new row puts the added x-term right after the first x-term; the work row is stacked under it', () => {
    const x = (c) => ({ id: `x${c}`, kind: 'x', coef: c });
    const n = (v) => ({ id: `n${v}`, kind: 'num', v });
    const { board, work } = addToBoth({ left: [x(5), n(5)], right: [x(2), n(14)] }, -2, true);
    expect(boardText(board)).toBe('5x + −2x + 5 = 14');
    expect(work.stack).toBe(true);
    expect(work.left.at(-1)).toMatchObject({ added: true, under: 0, struck: false });
    expect(work.right.at(-1)).toMatchObject({ added: true, under: 0, struck: true });
    expect(boardText(addToBoth({ left: [x(5)], right: [n(8)] }, -3, true).board)).toBe('5x + −3x = 8 + −3x');      // (no x-term: after the first term)
    expect(addToBoth({ left: [x(5)], right: [n(8)] }, -3, false).work.stack).toBeUndefined();                       // (a number stays in line)
  });
  it('the ghost row: a box under the first x-term of each side, inside its column, the x printed after it', () => {
    const s = open(start());
    expect(boardText(s.board)).toBe('5x + 5 = 2x + 14');
    const root = P.renderMat(s, {});
    const ghost = root.querySelector('.lx-ghost.is-stacked');
    expect(ghost).not.toBeNull();
    const cols = [...ghost.querySelectorAll('.lx-col')];
    expect(cols.map((c) => text(c.firstElementChild))).toEqual(['5x', '2x']);
    const boxes = [...ghost.querySelectorAll('.lx-box.is-stackbox')];
    expect(boxes.map((b) => b.dataset.side)).toEqual(['left', 'right']);
    expect(boxes[0].classList.contains('is-focus')).toBe(true);
    expect(cols.every((c) => c.querySelector('.lx-under .lx-addx')?.textContent === 'x')).toBe(true);
  });
  it('either box takes the keys and the other mirrors it; Tab’s focus action moves the cursor; a click retypes; zero is refused', () => {
    let s = open(start());
    s = run(s, [{ type: 'focus', target: 'amount', side: 'right' }, { type: 'digit', digit: 2 }, { type: 'toggleSign' }]);
    expect([s.amountEntry, s.amountSide]).toEqual(['-2', 'right']);
    let boxes = [...P.renderMat(s, {}).querySelectorAll('.lx-box.is-stackbox')];
    expect(boxes.map((b) => [b.dataset.side, text(b), b.classList.contains('is-focus')])).toEqual([['left', '−2', false], ['right', '−2', true]]);
    s = run(s, [{ type: 'focus', target: 'amount', side: 'left' }, { type: 'digit', digit: 3 }]);              // (a click selects: 3 replaces −2)
    expect([s.amountEntry, s.amountSide]).toEqual(['3', 'left']);
    boxes = [...P.renderMat(s, {}).querySelectorAll('.lx-box.is-stackbox')];
    expect(boxes.map((b) => b.classList.contains('is-focus'))).toEqual([true, false]);
    expect(run(open(start()), [{ type: 'digit', digit: 0 }, { type: 'go' }]).feedback.key).toBe('aAmountZero');
  });
  it('Go: the amounts sit under their x-terms, the 2x and its −2x struck; then 5x − 2x + 5 = 14, ready to combine', () => {
    const s = run(open(start()), [{ type: 'focus', target: 'amount', side: 'right' }, { type: 'digit', digit: 2 }, { type: 'toggleSign' }, { type: 'go' }]);
    expect(boardText(s.board)).toBe('5x + −2x + 5 = 14');
    const root = P.renderMat(s, {});
    const work = root.querySelector('.lb-rowwrap.is-stackwork .lb-work.is-stacked');
    expect(work).not.toBeNull();
    const [left, right] = [...work.querySelectorAll('.lx-col')];
    expect([text(left.firstElementChild), text(left.querySelector('.lx-under'))]).toEqual(['5x', '+−2x']);
    expect([text(right.firstElementChild), text(right.querySelector('.lx-under'))]).toEqual(['2x', '+−2x']);
    expect([...left.querySelectorAll('.is-struck')].length).toBe(0);                                          // (the app writes nothing it did not cancel)
    expect([...right.querySelectorAll('.is-struck')].map(text)).toEqual(['2x', '−2x']);
  });
  it('an amount that cancels no x-term: the spotlight on the stacked amounts, "To cancel 2x, add −2x.", Undo, then the hint', () => {
    let s = run(open(start()), [{ type: 'digit', digit: 4 }, { type: 'toggleSign' }, { type: 'go' }]);
    expect(s.feedback).toMatchObject({ key: 'vNoCancelX', bad: true, params: { term: '2x', amount: '−2x' } });
    expect(P.feedbackText(s.feedback)).toBe('Add so that one x-term cancels. To cancel 2x, add −2x. Press Undo.');
    s = run(s, [{ type: 'undo' }]);
    expect([s.feedback.key, s.menu, s.addKind, s.amountEntry]).toEqual(['vZeroHint', 'add', 'x', '-2']);
    expect(P.renderMat(s, {}).querySelector('.lx-ghost.is-stacked')).not.toBeNull();
  });
});
