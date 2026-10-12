// The tucked layout pilot (BUILD-BRIEF-DIVIDE-IT-2026-10-12-c): the drawer and tray rules, on Divide it. The engine is unchanged; the
// layout only adds view state (`s.ui`), so these tests check when the drawer and the tray open and close.
import { describe, it, expect } from 'vitest';
import { withTuckedUi, tuckedEffects } from '../src/view/tuckedLayout.js';
import { newDivide, reduceDivide, xAlone } from '../src/engine/divideMoves.js';
import { makeDivide } from '../src/engine/divide.js';
import { CHOICE_PROMPT } from '../src/engine/solveLoop.js';
import { divideFeedbackText } from '../src/view/divideFeedback.js';

const O = {
  moveId: 'fraction',
  trayAvailable: (s) => s.stage !== 'done' && (s.scaffold || Boolean(s.pic)),
  canOpenMoves: (s) => s.stage === 'moves' && s.path === 'move' && !s.sub && !s.needUndo && !xAlone(s.board),
};
const reduce = withTuckedUi(reduceDivide, O);
const run = (s, ...actions) => actions.reduce((st, a) => reduce(st, a), s);
const start = (a, x) => newDivide(makeDivide(a, x), { level: 4 });

describe('the Moves drawer', () => {
  it('opens on Use a move, closes on the move itself, and the choice returns with the same prompt', () => {
    let s = run(start(4, -4), { type: 'path', value: 'move' });
    expect(s.ui.drawer).toBe(true);
    s = run(s, { type: 'choose', move: 'fraction' });
    expect(s.ui.drawer).toBe(true);
    s = run(s, { type: 'take', n: 2 });                                  // a partial move: 2x = −8
    expect(s.ui.drawer).toBe(false);
    expect(divideFeedbackText(s.feedback)).toBe(CHOICE_PROMPT);
  });
  it('the Moves tab from the choice is Use a move; in guess mode it does not open, and the card says why', () => {
    expect(run(start(3, 5), { type: 'openMoves' })).toMatchObject({ path: 'move', ui: { drawer: true } });
    const g = run(start(3, 5), { type: 'path', value: 'guess' }, { type: 'openMoves' });
    expect(g.ui?.drawer ?? false).toBe(false);
    expect(g.feedback.key).toBe('aGuessing');
  });
  it('closes on ✕, on Escape (the same action) and before Undo acts', () => {
    let s = run(start(3, 5), { type: 'path', value: 'move' }, { type: 'ui', patch: { drawer: false } });
    expect(s.ui.drawer).toBe(false);
    s = run(start(3, 5), { type: 'path', value: 'move' }, { type: 'choose', move: 'fraction' }, { type: 'take', n: 2 });   // a failed attempt
    expect(s.ui.drawer).toBe(false);
    s = run(s, { type: 'openMoves' }, { type: 'undo' });
    expect(s.ui.drawer).toBe(false);
  });
});

describe('the counter tray', () => {
  it('opens for I’m stuck and Teach me, can be closed and shown again, and the stack keeps every row', () => {
    let s = run(start(4, -4), { type: 'path', value: 'move' }, { type: 'choose', move: 'fraction' }, { type: 'take', n: 2 }, { type: 'foldNext' });
    const rows = s.rows.length;
    s = run(s, { type: 'stuck' });
    expect(O.trayAvailable(s) && !s.ui.trayHidden).toBe(true);
    expect(s.rows.length).toBe(rows);                                     // a scaffold never blanks the stack
    expect(run(s, { type: 'ui', patch: { trayHidden: true } }).ui.trayHidden).toBe(true);
    expect(tuckedEffects(run(s, { type: 'ui', patch: { trayHidden: true } }), s, O).trayOpened).toBe(true);
  });
  it('keeps the picture after the move, until Next folds it', () => {
    let s = run(start(3, 4), { type: 'stuck' }, { type: 'take', n: 3 });
    for (let i = 0; i < 12; i++) s = run(s, { type: 'deal', group: i % 3 });
    s = run(s, { type: 'keep', group: 0 });
    expect(Boolean(s.pic) && O.trayAvailable(s)).toBe(true);
    s = run(s, { type: 'foldNext' });
    expect(O.trayAvailable(s)).toBe(false);
  });
});
