// @vitest-environment happy-dom
// Build AC, Part 5, as the student plays it: Fractions of x's model draws itself on the first problem of Level 1 (and Level 3) once per
// device, not once per run of the level.
import { describe, it, expect, beforeEach } from 'vitest';
import { fractionsPlay } from '../src/play/solveCards.js';
import { generateFractionsLevel } from '../src/engine/generateFractions.js';
import { FX_MODEL_KEY } from '../src/fxModelStore.js';

const first = (level) => ({ ...generateFractionsLevel(level, 7)[0], logLevel: level });
const start = (level) => fractionsPlay.newSession(first(level), { flags: {} });          // (a new run of the level: fresh flags)

describe('Part 5: once per device', () => {
  beforeEach(() => localStorage.clear());
  it('Level 1: drawn on the first run, not on a second run', () => {
    expect(start(1).model?.auto).toBe(true);
    expect(JSON.parse(localStorage.getItem(FX_MODEL_KEY))).toEqual([1]);
    expect(start(1).model).toBeNull();
  });
  it('Level 3 has its own first time; Levels 2, 4, 5, 6 never draw it by themselves', () => {
    expect(start(1).model?.auto).toBe(true);
    expect(start(3).model?.auto).toBe(true);
    expect(start(3).model).toBeNull();
    for (const l of [2, 4, 5, 6]) expect(start(l).model, `L${l}`).toBeNull();
  });
  it('cleared site data: drawn again', () => {
    start(1);
    localStorage.clear();
    expect(start(1).model?.auto).toBe(true);
  });
  it('the save code, the sync state and the class sheet do not hold it (its own key only)', () => {
    start(1);
    const keys = Object.keys(localStorage).filter((k) => localStorage.getItem(k)?.includes('fxmodel'));
    expect(keys).toEqual([]);
    expect(Object.keys(localStorage)).toContain(FX_MODEL_KEY);
  });
});

import { newFractions, reduceFractions } from '../src/engine/cards/fractions.js';
import { renderFractionsScreen } from '../src/view/fractionsScreen.js';
import { redrawMat } from '../src/view/keepRows.js';
import { finishRewrites, rewriteFrames } from '../src/view/rewriteAnim.js';
import { makeFracX } from '../src/engine/fractionsX.js';

const flat = (el) => { const c = el.cloneNode(true); for (const f of c.querySelectorAll('.lx-sfrac')) f.replaceWith(`${f.querySelector('.lx-sfrac-top').textContent}/${f.querySelector('.lx-sfrac-bot').textContent}`); return c.textContent.replace(/\s+/g, ''); };

describe('Part 3: the rewrite drawn', () => {
  const start = () => newFractions(makeFracX({ p: 2, q: 3, x: 9 }), { level: 3 });
  it('the frames, both ways, dots only (never a times sign), the 1 on top absorbed for a unit fraction', () => {
    expect(rewriteFrames('times', 2, 3).map(flat)).toEqual(['2/3x', '2/3x/1', '2/3·x/1', '2·x/3·1', '2x/3']);
    expect(rewriteFrames('over', 2, 3).map(flat)).toEqual(['2x/3', '2·x/3', '2/3·x/1', '2/3·x/1', '2/3x']);
    expect(rewriteFrames('times', 1, 3).map(flat)).toEqual(['1/3x', '1/3x/1', '1/3·x/1', '1·x/3·1', 'x/3']);
    for (const f of [...rewriteFrames('times', 2, 3), ...rewriteFrames('over', 1, 5)]) expect(f.textContent).not.toContain('×');
  });
  it('plays on the tap, in the new row only; a redraw keeps it playing (the same row, never started again)', () => {
    const box = document.createElement('div');
    let s = start();
    redrawMat(box, renderFractionsScreen(s));
    expect(box.querySelectorAll('.fa-frame')).toHaveLength(0);
    s = reduceFractions(s, { type: 'rewrite' });
    redrawMat(box, renderFractionsScreen(s));
    const row = box.querySelector('.lb-rowwrap.is-rewriteanim');
    expect(row).toBeTruthy();
    expect(row.classList.contains('is-settled')).toBe(false);
    expect(row.querySelectorAll('.fa-frame')).toHaveLength(5);
    expect(box.querySelectorAll('.lb-rowwrap')[0].querySelector('.fa-frame')).toBeNull();
    redrawMat(box, renderFractionsScreen({ ...s, ui: { ...(s.ui ?? {}), rewrite: true } }));        // (a hover: a redraw)
    expect(box.querySelector('.lb-rowwrap.is-rewriteanim')).toBe(row);
    expect(row.classList.contains('is-settled')).toBe(false);
  });
  it('a key finishes it at once, and no redraw starts it again; the stored term changes only its form', () => {
    const box = document.createElement('div');
    let s = reduceFractions(start(), { type: 'rewrite' });
    redrawMat(box, renderFractionsScreen(s));
    finishRewrites(box);
    expect(box.querySelector('.lb-rowwrap.is-rewriteanim').classList.contains('is-settled')).toBe(true);
    redrawMat(box, renderFractionsScreen(s));
    expect(box.querySelectorAll('.lb-rowwrap')[1].classList.contains('is-settled')).toBe(true);
    const fresh = document.createElement('div');
    redrawMat(fresh, renderFractionsScreen(s));                                     // (drawn again from nothing: a resize)
    expect(fresh.querySelectorAll('.fa-frame')).toHaveLength(0);
    const [a, b] = [s.rows[0].board.left[0], s.rows[1].board.left[0]];
    expect({ ...b, id: a.id }).toEqual({ ...a, form: 'over' });
    // Undo takes the row away; tapping again plays the new row
    s = reduceFractions(reduceFractions(s, { type: 'undo' }), { type: 'rewrite' });
    redrawMat(box, renderFractionsScreen(s));
    expect(box.querySelectorAll('.fa-frame')).toHaveLength(5);
  });
});
