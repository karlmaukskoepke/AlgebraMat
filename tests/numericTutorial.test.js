import { describe, it, expect } from 'vitest';
import {
  newTutorial, reduceTutorial, readoutOf, equationText, readyForQuiz, quizItem, quizBoard, QUIZ_LENGTH,
} from '../src/engine/numericTutorial.js';

const run = (t, ...actions) => actions.reduce(reduceTutorial, t);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const addMove = (t, amount) => run(t, { type: 'choose', move: 'add' }, ...typed(String(amount)), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });

describe('the add tutorial (4 + 1 = 2 + 3)', () => {
  it('starts balanced, shows both values, and goes unbalanced after one side', () => {
    let t = newTutorial('add');
    expect(equationText(t.board)).toBe('4 + 1 = 2 + 3');
    expect(readoutOf(t.board)).toMatchObject({ left: 5, right: 5, balanced: true, text: '5 = 5   Balanced ✓' });
    t = run(t, { type: 'choose', move: 'add' }, ...typed('−1'), { type: 'addTo', side: 'left' });
    expect(equationText(t.board)).toBe('4 + 1 + −1 = 2 + 3');
    expect(readoutOf(t.board).text).toBe('4 ≠ 5   Unbalanced ✗');
    expect(run(t, { type: 'go' }).feedback.key).toBe('tuGoNotYet');                  // Go waits for the balance
    t = run(t, { type: 'addTo', side: 'right' });
    expect(readoutOf(t.board).text).toBe('4 = 4   Balanced ✓');
    expect(t.feedback.key).toBe('tuBalanced');
    t = run(t, { type: 'go' });
    expect(equationText(t.board)).toBe('4 = 4');                                      // tidied: each side is what it comes to
    expect(t.moves).toEqual([-1]);
  });

  it('never offers amount 0, or the same side twice, and Undo takes both actions back', () => {
    let t = run(newTutorial('add'), { type: 'choose', move: 'add' });
    expect(run(t, { type: 'addTo', side: 'left' }).feedback.key).toBe('tuAmountZero');
    expect(run(t, ...typed('0'), { type: 'addTo', side: 'left' }).feedback.key).toBe('tuAmountZero');
    t = run(t, ...typed('2'), { type: 'addTo', side: 'left' });
    expect(run(t, { type: 'addTo', side: 'left' }).feedback.key).toBe('tuOtherSide');
    t = run(t, { type: 'undo' });
    expect(equationText(t.board)).toBe('4 + 1 = 2 + 3');
    expect(t.pending).toBeNull();
  });

  it('is ready for the quiz after two different moves (and having seen it tilt), and not before', () => {
    let t = addMove(newTutorial('add'), 2);
    expect(readyForQuiz(t)).toBe(false);
    expect(run(t, { type: 'continue' }).feedback.key).toBe('tuNotYet');
    t = addMove(t, -3);
    expect(readyForQuiz(t)).toBe(true);
    expect(t.feedback.key).toBe('tuTryMoreDone');
    // the same amount again is not a new one
    expect(readyForQuiz(addMove(addMove(newTutorial('add'), 2), 2))).toBe(false);
  });

  it('quizzes keeps or upsets: right moves on, wrong shows the two equations side by side and asks again', () => {
    let t = run(addMove(addMove(newTutorial('add'), 2), -3), { type: 'continue' });
    expect([t.stage, quizItem(t).say, QUIZ_LENGTH('add')]).toEqual(['quiz', 'Adding 3 to one side only', 3]);
    t = run(t, { type: 'quiz', value: 'keeps' });                                   // wrong
    expect(t.reveal).toEqual({ before: '4 + 1 = 2 + 3', beforeRead: '5 = 5   Balanced ✓', after: '4 + 1 + 3 = 2 + 3', afterRead: '8 ≠ 5   Unbalanced ✗' });
    expect([t.misses, t.quiz, t.feedback.key]).toEqual([1, 0, 'tuQuizWrong']);
    t = run(t, { type: 'quiz', value: 'upsets' });
    expect([t.quiz, t.reveal]).toEqual([1, null]);
    expect(quizItem(t).say).toBe('Adding 3 to both sides');
    t = run(t, { type: 'quiz', value: 'keeps' }, { type: 'quiz', value: 'upsets' });
    expect(t.stage).toBe('quizDone');
    expect(run(t, { type: 'continue' }).stage).toBe('done');
    expect(quizBoard(t)).toBeTruthy();
  });
});

describe('the trade places tutorial', () => {
  it('trades 5 = 2 + 3 to 2 + 3 = 5, keeps the balance, then a second equation, then the quiz', () => {
    let t = newTutorial('trade');
    expect(equationText(t.board)).toBe('5 = 2 + 3');
    t = run(t, { type: 'trade' });
    expect(equationText(t.board)).toBe('2 + 3 = 5');
    expect(readoutOf(t.board).balanced).toBe(true);
    expect(run(t, { type: 'continue' }).feedback.key).toBe('tuNotYet');
    t = run(t, { type: 'nextItem' });
    expect(equationText(t.board)).toBe('7 = 4 + 3');
    t = run(t, { type: 'trade' });
    expect(readyForQuiz(t)).toBe(true);
    t = run(t, { type: 'continue' });
    expect(quizItem(t).say).toBe('Trading places');
    t = run(t, { type: 'quiz', value: 'keeps' });
    expect(quizItem(t).say).toBe('Changing the sign of just one term');
    const wrong = run(t, { type: 'quiz', value: 'keeps' });
    expect(wrong.reveal).toMatchObject({ after: '5 = −2 + 3', afterRead: '5 ≠ 1   Unbalanced ✗' });
    expect(run(t, { type: 'quiz', value: 'upsets' }).stage).toBe('quizDone');
  });
});

describe('the cross the border tutorial', () => {
  it('crossing without switching teams is unbalanced; switching balances it; Go counts it; every sign at once keeps the balance', () => {
    let t = newTutorial('cross');
    const one = t.board.left[1].id;
    t = run(t, { type: 'cross', id: one });
    expect(equationText(t.board)).toBe('4 = 2 + 3 + 1');
    expect(readoutOf(t.board).text).toBe('4 ≠ 6   Unbalanced ✗');
    expect(t.feedback).toMatchObject({ key: 'tuCrossedBare', bad: true });
    expect(run(t, { type: 'go' }).feedback.key).toBe('tuGoNotYet');
    t = run(t, { type: 'flipSign', id: one });
    expect(equationText(t.board)).toBe('4 = 2 + 3 + −1');
    expect(readoutOf(t.board).balanced).toBe(true);
    expect(t.feedback.key).toBe('tuSwitched');
    t = run(t, { type: 'go' });
    expect([t.crosses, t.flips, readyForQuiz(t)]).toEqual([1, 1, true]);
    t = run(t, { type: 'flipAll' });
    expect(readoutOf(t.board).balanced).toBe(true);                                   // every sign on both sides: keeps
    expect(t.sawAllFlip).toBe(true);
    const upset = run(t, { type: 'flipSign', id: t.board.left[0].id });
    expect(readoutOf(upset.board).balanced).toBe(false);                              // just one sign: upsets
    expect(upset.feedback.key).toBe('tuUpset');
    t = run(t, { type: 'continue' });
    expect(quizItem(t).say).toBe('Crossing the border and not switching teams');
    expect(run(t, { type: 'quiz', value: 'keeps' }).reveal.afterRead).toBe('4 ≠ 6   Unbalanced ✗');
    t = run(t, { type: 'quiz', value: 'upsets' });
    expect(quizItem(t).say).toBe('Crossing the border and switching teams');
    expect(run(t, { type: 'quiz', value: 'keeps' }).stage).toBe('quizDone');
  });

  it('Undo takes back the last thing, and the flip mode switches any term', () => {
    let t = newTutorial('cross');
    const first = t.board.left[0].id;
    t = run(t, { type: 'cross', id: first }, { type: 'undo' });
    expect(equationText(t.board)).toBe('4 + 1 = 2 + 3');
    expect(t.crossed).toBeNull();
    expect(run(t, { type: 'flipMode' }).flipMode).toBe(true);
  });

  it('knows its kinds', () => {
    expect(() => newTutorial('nope')).toThrow();
  });
});
