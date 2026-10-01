import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression } from '../src/engine/terms.js';
import { newTermSession, reduceTerms, TERM_STEPS, shapeComplete } from '../src/engine/termSession.js';
import { TERM_FEEDBACK, termFeedbackText } from '../src/view/termFeedback.js';
import { generateTermLevel } from '../src/engine/generateTerms.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);   // 3x − 5 + 7 − x
const run = (s, ...actions) => actions.reduce(reduceTerms, s);
const draw = (from, to) => ({ type: 'drawShape', from, to });
const tool = (t) => ({ type: 'pickTool', tool: t });
const check = { type: 'check' };

describe('Boxes & Circles session: Box & Circle', () => {
  it('starts at Box & Circle with no tool and nothing drawn', () => {
    const s = newTermSession(EX1);
    expect(s).toMatchObject({ step: 'boxcircle', tool: null, shapes: [], selecting: null });
    expect(TERM_STEPS.map((t) => t.id)).toEqual(['boxcircle', 'draw', 'cancel', 'answer']);
  });

  it('draws nothing until a tool is picked, and says so', () => {
    const s = run(newTermSession(EX1), draw(0, 0));
    expect(s.shapes).toEqual([]);
    expect(s.feedback.key).toBe('pickToolFirst');
  });

  it('draws the picked shape around the parts dragged over, either direction', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), tool('circle'), draw(2, 1));
    expect(s.shapes).toEqual([{ kind: 'box', from: 0, to: 0 }, { kind: 'circle', from: 1, to: 2 }]);
    expect(shapeComplete(EX1, s.shapes[1])).toBe(true);
    s = run(s, tool('box'), draw(6, 6));
    expect(shapeComplete(EX1, s.shapes[2])).toBe(false);   // just the x: dashed until the − is taken in
  });

  it('keeps the tool until the other is picked, so a student can box everything first or circle first', () => {
    let s = run(newTermSession(EX1), tool('circle'), draw(1, 2), draw(3, 4), tool('box'), draw(0, 0), draw(5, 6));
    expect(s.shapes.map((sh) => sh.kind)).toEqual(['circle', 'circle', 'box', 'box']);
    expect(run(s, check).step).toBe('draw');
  });

  it('shows the drag as it happens, and clears it on release', () => {
    let s = run(newTermSession(EX1), tool('box'), { type: 'selecting', from: 6, to: 5 });
    expect(s.selecting).toEqual({ from: 5, to: 6 });
    expect(reduceTerms(s, { type: 'selecting', from: 5, to: 6 })).toBe(s);   // no change: no new state
    s = run(s, { type: 'selecting', from: 5, to: 5 });
    expect(s.selecting).toEqual({ from: 5, to: 5 });
    s = run(s, draw(5, 6));
    expect(s.selecting).toBeNull();
    expect(run(s, { type: 'selecting', clear: true })).toBe(s);
    expect(run(run(s, { type: 'selecting', from: 0, to: 0 }), { type: 'selecting', clear: true }).selecting).toBeNull();
  });

  it('lets a new shape replace the ones it overlaps, so fixing a dashed shape is one drag', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(6, 6), draw(5, 6));
    expect(s.shapes).toEqual([{ kind: 'box', from: 5, to: 6 }]);
    s = run(s, tool('circle'), draw(5, 6));    // changing its mind: the circle replaces the box
    expect(s.shapes).toEqual([{ kind: 'circle', from: 5, to: 6 }]);
  });

  it('removes a tapped shape, and undoes the latest', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), tool('circle'), draw(1, 2), draw(3, 4));
    s = run(s, { type: 'removeShape', index: 1 });
    expect(s.shapes.map((sh) => sh.from)).toEqual([0, 3]);
    s = run(s, { type: 'undo' });
    expect(s.shapes.map((sh) => sh.from)).toEqual([0]);
    expect(reduceTerms(run(s, { type: 'undo' }), { type: 'undo' })).toEqual(run(s, { type: 'undo' }));
  });

  it('checks the shapes: each wrong try counts, and the right ones go on to Draw', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), draw(6, 6), tool('circle'), draw(1, 2), draw(3, 4), check);
    expect(s).toMatchObject({ step: 'boxcircle', feedback: { key: 'includeSign', bad: true }, tries: { boxcircle: 1 } });
    s = run(s, tool('box'), draw(5, 6), check);
    expect(s).toMatchObject({ step: 'draw', feedback: { key: 'boxCircleDone', bad: false } });
    expect(s.tries.boxcircle).toBe(1);
  });

  it('ignores moves outside their step, and nonsense', () => {
    const done = run(newTermSession(EX1), tool('box'), draw(0, 0), draw(5, 6), tool('circle'), draw(1, 2), draw(3, 4), check);
    for (const a of [draw(0, 0), tool('box'), { type: 'undo' }, { type: 'selecting', from: 0, to: 1 }, { type: 'removeShape', index: 0 }]) {
      expect(reduceTerms(done, a)).toBe(done);
    }
    const s = run(newTermSession(EX1), tool('box'));
    expect(reduceTerms(s, draw(0, 99))).toBe(s);
    expect(reduceTerms(s, draw(-1, 2))).toBe(s);
    expect(reduceTerms(s, tool('triangle'))).toBe(s);
    expect(reduceTerms(s, { type: 'removeShape', index: 3 })).toBe(s);
    expect(reduceTerms(s, { type: 'bogus' })).toBe(s);
  });

  it('can be solved on every kind of problem the levels make', () => {
    for (const level of [1, 2, 3, 4, 5]) for (const e of generateTermLevel(level, 99)) {
      let s = newTermSession(e);
      let part = 0;
      for (let i = 0; i < e.terms.length; i++) {
        const first = part;
        const last = part + (i === 0 ? 0 : 1);
        s = run(s, tool(e.terms[i].kind === 'x' ? 'box' : 'circle'), draw(first, last));
        part = last + 1;
      }
      expect(run(s, check).step, `${level}`).toBe('draw');
    }
  });
});

describe('Boxes & Circles feedback table', () => {
  it('has a message for every key the engine can produce', async () => {
    const { readFileSync } = await import('node:fs');
    const src = ['termMoves.js', 'termSession.js']
      .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8')).join('\n');
    // Message keys are camelCase words in fail(...), pass(...), note(s, ...) and key: '...' lines.
    const keys = new Set();
    for (const text of src.split('\n').filter((l) => /\b(fail|pass)\(|note\(s,|key: '/.test(l))) {
      for (const m of text.matchAll(/'([a-z]+[A-Z]\w*)'/g)) keys.add(m[1]);
    }
    expect(keys.size).toBeGreaterThanOrEqual(10);
    for (const k of keys) expect(TERM_FEEDBACK, `missing "${k}"`).toHaveProperty(k);
  });

  it('reads well', () => {
    expect(termFeedbackText({ key: 'includeSign', params: { op: '−' } })).toBe('Take the sign in front with it: drag from the − across the number.');
    expect(termFeedbackText({ key: 'twoTerms' })).toBe('One term at a time — this shape has two.');
    expect(termFeedbackText({ key: 'nope' })).toBe('');
  });
});
