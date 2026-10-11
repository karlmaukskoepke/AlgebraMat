import { describe, it, expect } from 'vitest';
import { newAddBoth } from '../src/engine/addBothMoves.js';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { startTutorial, reduceTutorialSession } from '../src/play/addBothTutorial.js';

const base = () => newAddBoth(makeAddBoth('x+a', 3, -9), { level: 4 });

describe('tutorials inside an Add to both sides session', () => {
  it('starts on top of the problem and leaves it untouched', () => {
    const s = base();
    const t = startTutorial(s, ['add', 'trade']);
    expect(t.step).toBe('tutorial');
    expect(t.board).toBe(s.board);
    expect(startTutorial(s, [])).toBe(s);
  });
  it('Skip moves to the next tutorial, and past the last one puts the problem back as it was', () => {
    const s = base();
    let t = startTutorial(s, ['add', 'trade']);
    t = reduceTutorialSession(t, { type: 'skipTutorial' });
    expect(t.tut.kind).toBe('trade');
    t = reduceTutorialSession(t, { type: 'skipTutorial' });
    expect(t.tut).toBeNull();
    expect(t.step).toBe(s.step);
    expect(t.feedback).toEqual(s.feedback);
  });
  it('a replay says it is back to the problem; the engine action is ignored while the tutorial is up', () => {
    const t = startTutorial(base(), ['trade'], true);
    const same = reduceTutorialSession(t, { type: 'drop', piece: 'x', side: 'left' });
    expect(same.board).toBe(t.board);
    expect(reduceTutorialSession(t, { type: 'skipTutorial' }).feedback.key).toBe('tuBack');
  });
  it('trade: do it twice, take the quiz, and the tutorial ends', () => {
    let t = startTutorial(base(), ['trade']);
    const go = (a) => { t = reduceTutorialSession(t, a); };
    go({ type: 'trade' }); go({ type: 'nextItem' }); go({ type: 'trade' }); go({ type: 'continue' });
    expect(t.tut.t.stage).toBe('quiz');
    go({ type: 'quiz', value: 'keeps' }); go({ type: 'quiz', value: 'upsets' });
    expect(t.tut.t.stage).toBe('quizDone');
    go({ type: 'continue' });
    expect(t.tut).toBeNull();
  });
});
