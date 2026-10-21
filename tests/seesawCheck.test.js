import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { checkMirror, mirrorReadout } from '../src/engine/seesawCheck.js';
import { boardItems } from '../src/view/addBothMat.js';

// Build H, Part 2: the seesaw mirrors the check. Only when the seesaw was opened by I'm stuck (or Teach me).
const R = withSpotlight(withLights(reduceAddBoth), ADD_SPOT);
const run = (s, ...actions) => actions.reduce(R, s);
const typed = (n) => [...String(n)].map((ch) => (ch === '-' ? { type: 'toggleSign' } : { type: 'digit', digit: Number(ch) }));

// x + 8 = −4: I'm stuck twice (the seesaw), add −8, the pair beside x is a battle, x = −4 + −8 is a party
const toX = (form, a, x, mirror = false, level = 5) => {
  const p = { ...makeAddBoth(form, a, x, mirror), logLevel: level };
  const add = form === 'x-a' ? a : -a;
  return run(newLightsSession(p, { level }), { type: 'stuck' }, { type: 'stuck' }, ...typed(add), { type: 'go' }, { type: 'kind', value: 'battle' }, { type: 'crossNext' }, { type: 'kind', value: 'party' });
};
const check = (s, value) => run(s, ...typed(value), { type: 'check' }, { type: 'placeValue' });
const counts = (m) => ({ left: m.left.map((i) => [i.type, i.v]), right: m.right.map((i) => [i.type, i.v]) });

describe('the mirror of a check on the seesaw', () => {
  it('is only there when the seesaw is (not for a check beside the equation)', () => {
    const p = { ...makeAddBoth('x+a', 8, -12), logLevel: 5 };
    const bare = run(newLightsSession(p, { level: 5 }), { type: 'choose', move: 'add' }, ...typed(-8), { type: 'go' });
    const s = check(bare, -12);
    expect(s.scaffold).toBeFalsy();
    expect(checkMirror(s)).toBe(null);
    expect(checkMirror(toX('x+a', 8, -12))).toBe(null);               // (no value checked yet)
  });

  it('while the value waits: the original equation, an empty x box, the numbers as they were; level', () => {
    const s = run(toX('x+a', 8, -12), ...typed(-12), { type: 'check' });
    expect(s.sub.placing).toBe(true);
    const m = checkMirror(s);
    expect([m.index, m.final, m.tilt]).toEqual([-1, false, 0]);
    expect(counts(m)).toEqual({ left: [['x', 0], ['group', 8]], right: [['group', -4]] });
  });

  it('line by line: the x box becomes the value (counters under a little x), then the line just written; level at the end', () => {
    let s = check(toX('x+a', 8, -12), -12);
    let m = checkMirror(s);
    expect([m.index, m.final, mirrorReadout(m)]).toEqual([0, false, '']);
    expect(counts(m)).toEqual({ left: [['xgroup', -12], ['group', 8]], right: [['group', -4]] });
    s = run(s, { type: 'nextLine' });
    m = checkMirror(s);
    expect(counts(m)).toEqual({ left: [['group', -4]], right: [['group', -4]] });
    s = run(s, { type: 'nextLine' });
    m = checkMirror(s);
    expect([m.final, m.tilt, mirrorReadout(m)]).toEqual([true, 0, 'Balanced ✓']);
  });

  it('a wrong value tips the beam the way it really tips, and the last words match the check', () => {
    let s = check(toX('x+a', 8, -12), -10);
    s = run(s, { type: 'nextLine' }, { type: 'nextLine' });
    const m = checkMirror(s);
    expect(counts(m)).toEqual({ left: [['group', -2]], right: [['group', -4]] });
    expect([m.final, m.tilt, m.ok, mirrorReadout(m)]).toEqual([true, 2, false, 'Not balanced ✗']);
  });

  it('x on the right is mirrored on the right', () => {
    const s = check(toX('x-a', 9, 15, true), 15);
    const m = checkMirror(s);
    expect(counts(m)).toEqual({ left: [['group', 6]], right: [['xgroup', 15], ['group', -9]] });
  });

  it('past 12 a value is one box labelled with the number, not counters', () => {
    const items = boardItems(check(toX('x-a', 9, 15, true), 15));
    expect(items.right[0]).toMatchObject({ type: 'token', v: 15, xlabel: true });
    expect(items.right[1]).toMatchObject({ type: 'group', n: 9 });
    expect(items.left[0]).toMatchObject({ type: 'group', n: 6 });
    // 12 is still counters
    const twelve = boardItems(check(toX('x+a', 8, -12), -12));
    expect(twelve.left[0]).toMatchObject({ type: 'group', n: 12, xlabel: true });
  });

  it('collapsed checks (none on this card) would show the first line, then the last', () => {
    const s = check(toX('x+a', 8, -12), -12);
    s.sub = { ...s.sub, collapsed: true, step: 1 };
    expect(checkMirror(s).index).toBe(0);
    s.sub = { ...s.sub, step: 2 };
    expect(checkMirror(s)).toMatchObject({ index: 1, final: true });
  });
});
