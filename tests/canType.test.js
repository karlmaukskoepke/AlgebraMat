// @vitest-environment happy-dom
// Can I type? (Build N, 2026-10-24.) A student could not type in Divide it's Divide blank; every walk passed, because the walks follow
// the intended steps. This test plays every Solve it card the way a student might (wrong values, Undo, I'm stuck, the menus opened
// and closed, moves half made), from every level, and keeps every state it reaches. Wherever the card is waiting for a typed value
// (its keypad would come up: a move's blank, x =, a sign, a sum, the distribute blanks), it draws the real screen, binds the card's
// real keys, and checks: the field is on screen and live, it has the focus, the keypad's keys are on, and a key pressed lands in it.
// No later build can break typing on any card without failing here.

import { describe, it, expect, afterEach } from 'vitest';
import { addBothPlay, divideMovesPlay, flipPlay, twoStepPlay, distSolvePlay, bothSidesPlay } from '../src/play/solveCards.js';
import { packById } from '../src/packs/index.js';
import { shapeOf } from '../src/engine/solveit/shape.js';
import { seesawAdd } from '../src/engine/addBothLights.js';

const CARDS = [
  ['Add to both sides', 'add-both', addBothPlay, [2, 3, 4, 5, 6]],
  ['Divide it', 'divide-it', divideMovesPlay, [2, 3, 4, 5, 6]],
  ['Flip everything', 'flip-everything', flipPlay, [2, 3, 4, 5, 6]],
  ['Two-step equations', 'two-step-equations', twoStepPlay, [1, 2, 3, 4, 5, 6, 7]],
  ['Distribute, combine, solve', 'distribute-solve', distSolvePlay, [1, 2, 3, 4, 5]],
  ['Variables on both sides', 'variables-both-sides', bothSidesPlay, [1, 2, 3, 4, 5]],             // (Build R)
];

// what a student can do (an action a card does not have leaves its state alone)
const ACTIONS = [
  { type: 'focus', target: 'answer' }, { type: 'focus', target: 'amount' }, { type: 'focus', target: 'dist', index: 0 }, { type: 'focus', target: 'dist', index: 1 },
  { type: 'focus', target: 'num' }, { type: 'focus', target: 'den' },
  ...[0, 1, 2, 3, 5, 7].map((digit) => ({ type: 'digit', digit })), { type: 'toggleSign' }, { type: 'backspace' }, { type: 'typeChar', ch: 'x' }, { type: 'fracSlash' },
  { type: 'check' }, { type: 'nextLine' }, { type: 'foldNext' }, { type: 'placeValue' }, { type: 'go' }, { type: 'next' },
  { type: 'undo' }, { type: 'spotDismiss' }, { type: 'introNext' }, { type: 'stuck' }, { type: 'teach' }, { type: 'startOver' }, { type: 'lxCancel' },
  { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, { type: 'divPick' }, { type: 'multPick', kind: 'frac' }, { type: 'flipPick' },
  ...[2, 3, 4, 5].map((n) => ({ type: 'take', n })), { type: 'choose', move: 'add' }, { type: 'choose', move: 'distribute' }, { type: 'lxApply' },
  { type: 'ui', patch: { preview: 'div' } }, { type: 'ui', patch: { preview: 'whole' } },
  { type: 'addPick', kind: 'num' }, { type: 'addPick', kind: 'x' },                          // (Add's two options: Build R)
];
// the moves that make progress (so the walks get past the first equation and reach every shape): Add the opposite of the number on
// x's side, divide by x's number, flip, fold the move, answer x correctly; each as the steps a student takes
const digits = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
function moves(s) {
  const sh = shapeOf(s);
  const out = [[{ type: 'foldNext' }], [{ type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' }], [{ type: 'lxApply' }], [{ type: 'teach' }, { type: 'go' }, { type: 'foldNext' }]];
  if (sh.xSum) out.push([{ type: 'choose', move: 'add' }, ...digits(-sh.xSum), { type: 'go' }, { type: 'lxApply' }, { type: 'foldNext' }]);
  if (sh.coef && Math.abs(sh.coef) > 1) out.push([{ type: 'divPick' }, ...digits(sh.coef), { type: 'go' }, { type: 'foldNext' }]);
  if (sh.coef < 0) out.push([{ type: 'flipPick' }, { type: 'go' }, { type: 'foldNext' }]);
  // x on both sides (Build R): drag the smaller x-term across the =, or Add its opposite as an x-term
  if (sh.id === 'V1') {
    out.push([{ type: 'lxDrop', id: sh.params.small, slot: { side: sh.params.from === 'left' ? 'right' : 'left', at: 0 } }]);
    out.push([{ type: 'addPick', kind: 'x' }, ...digits(-sh.params.c), { type: 'go' }]);
  }
  if (sh.group) out.push([{ type: 'choose', move: 'distribute' }, { type: 'focus', target: 'dist', index: 0 }, ...digits(sh.params?.a * sh.params?.n || 0), { type: 'go' }, ...digits(sh.params?.a * sh.params?.c || 0), { type: 'go' }, { type: 'foldNext' }]);
  // Distribute's moves (Build M): tap a subtracted factor's minus, drop the factor on its parenthesis and type the products, and drop a
  // term on a like term to open the combine blank (then type the sum: two x-terms take the x too)
  const terms = [...(s.board?.left ?? []), ...(s.board?.right ?? [])];
  const g = terms.find((x) => x.kind === 'group');
  if (g) {
    out.push([{ type: 'lxMinus', id: g.id }]);
    const ps = g.inner.map((x) => g.factor * (x.kind === 'x' ? 1 : x.v));
    out.push([{ type: 'lxDistribute', id: g.id }, ...ps.flatMap((v, k) => [{ type: 'focus', target: 'dist', index: k }, ...digits(v)]), { type: 'lxApply' }]);
    out.push([{ type: 'lxDistribute', id: g.id }]);
  }
  for (const side of ['left', 'right']) {
    for (const kind of ['num', 'x']) {
      const [p1, p2] = (s.board?.[side] ?? []).filter((x) => x.kind === kind);
      if (!p2) continue;
      const sum = kind === 'x' ? p1.coef + p2.coef : p1.v + p2.v;
      out.push([{ type: 'lxDrop', id: p1.id, slot: { side, onto: p2.id } }]);
      out.push([{ type: 'lxDrop', id: p1.id, slot: { side, onto: p2.id } }, ...digits(sum), ...(kind === 'x' ? [{ type: 'typeChar', ch: 'x' }] : []), { type: 'lxApply' }]);
    }
  }
  if (s.problem?.x !== undefined) out.push([{ type: 'focus', target: 'answer' }, ...digits(s.problem.x), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' }]);
  return out;
}

// a fixed shuffle, so every run reaches the same states
function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

// the states a card's walks reach, one of each kind (its shape, what is open, what is typed)
function reachable(play, pack, levels) {
  const seen = new Map();
  const keep = (s, path) => {
    // (the seesaw's Add boxes take a typed number too; and x = holding digits typed straight in, with no click: the keys go there)
    if (!play.padOpen(s) && !seesawAdd(s) && !(s.entry && s.stage !== 'done' && !s.sub)) return;
    const k = JSON.stringify([shapeOf(s).id, s.problem?.logLevel, s.mopts?.kind ?? Boolean(s.mopts), s.menu, s.typing, s.ui?.focus, s.ui?.preview, Boolean(s.fb?.num), s.fb?.part,
      Boolean(s.lx?.distribute), Boolean(s.lx?.combine), s.lx?.distribute?.index, Boolean(s.spot), s.spot?.kind, s.mustMove && !s.movedOnce, Boolean(s.entry), Boolean(s.mopts?.entry)]);
    if (!seen.has(k)) seen.set(k, { s, path: [...path] });
  };
  for (const level of levels) {
    const problems = [7, 11].flatMap((seed) => packById(pack).generate(level, seed)).map((p) => ({ ...p, logLevel: level }));
    for (const [i, problem] of problems.entries()) {
      const start = play.newSession(problem, { forceMove: i % 3 === 1 });   // (every third, the problem after a correct guess: a move first)
      const r = rng(level * 101 + i);
      for (let walk = 0; walk < 25; walk++) {
        let s = start;
        const path = [];
        keep(s, path);
        for (let step = 0; step < 14; step++) {
          const seq = r() < 0.35 ? (() => { const m = moves(s); return m[Math.floor(r() * m.length)]; })() : [ACTIONS[Math.floor(r() * ACTIONS.length)]];
          for (const a of seq) {
            if (a.type === 'next') continue;
            let n;
            try { n = play.reduce(s, a); } catch (e) { throw new Error(`${pack} L${level}: ${JSON.stringify(a)} after ${path.map((p) => JSON.stringify(p)).join(', ')} threw ${e}`); }
            if (n === s) continue;
            s = n;
            path.push(a);
            keep(s, path);
          }
        }
      }
    }
  }
  return [...seen.values()];
}

// the field a key goes to, found again after a redraw by what it is
const fieldKey = (el) => el.dataset.fk ?? (el.dataset.target ? `${el.dataset.target}${el.dataset.index ?? ''}` : (el.className.match(/mo-divpart|mo-blank/)?.[0] ?? el.className));
const findField = (root, key) => [...root.querySelectorAll('[data-lx-field]:not(.is-mirror)')].find((e) => fieldKey(e) === key);
const press = (key) => (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => { document.body.replaceChildren(); });

describe('Build N: can I type? On every card, in every state where it waits for a typed value', () => {
  for (const [name, pack, play, levels] of CARDS) {
    it(`${name}: a key lands in a visible, focused field`, async () => {
      const states = reachable(play, pack, levels);
      expect(states.length, `${name}: the walks reached no state that waits for typing`).toBeGreaterThan(5);
      const fails = [];
      for (const { s, path } of states) {
        const where = `${name} L${s.problem.logLevel}, shape ${shapeOf(s).id}, after ${path.map((p) => JSON.stringify(p)).join(' ') || 'nothing'}`;
        document.body.replaceChildren();
        const root = document.createElement('div');
        root.id = 'mat';
        const pad = document.createElement('div');
        pad.id = 'controls';
        document.body.append(root, pad);
        let cur = s;
        const controls = play.buildControls(pad, (a) => dispatch(a));
        function dispatch(a) {
          const n = play.reduce(cur, a);
          if (n === cur) return;
          cur = n;
          controls.update(cur);
          root.replaceChildren(play.renderMat(cur, {}));
        }
        const off = play.bindMat(root, dispatch, () => cur);
        controls.update(cur);
        root.replaceChildren(play.renderMat(cur, {}));
        await settle();
        try {
          if (root.querySelector('.spot-layer.is-error')) continue;   // an error waits for Undo: every key is held, by design
          const texts = () => new Map([...root.querySelectorAll('[data-lx-field]:not(.is-mirror)')].map((e) => [fieldKey(e), e.textContent.trim()]));
          const active = () => (document.activeElement?.dataset?.lxField ? fieldKey(document.activeElement) : document.activeElement?.className || document.activeElement?.tagName);
          // clear what is typed in the field the keys go to, then type 3 (a field holding a digit already may refuse a second)
          for (let i = 0; i < 3; i++) { press('Backspace'); await settle(); }
          const focusBefore = active();
          const marked = [...root.querySelectorAll('[data-lx-field].is-focus:not(.is-mirror)')].map(fieldKey);
          const before = texts();
          press('3');
          await settle();
          const after = texts();
          const landed = [...after].filter(([k, v]) => v !== before.get(k) && v.includes('3')).map(([k]) => k);
          if (!landed.length) { fails.push(`${where}: pressed 3 and no field changed (the focus was on ${focusBefore})`); continue; }
          const k = landed[0];
          const el = findField(root, k);
          if (!el || el.disabled || el.closest('[hidden]')) fails.push(`${where}: the 3 went into ${k}, which is greyed or hidden`);
          else if (focusBefore !== k) fails.push(`${where}: the 3 went into ${k}, but the focus was on ${focusBefore}`);
          else if (!marked.includes(k)) fails.push(`${where}: the 3 went into ${k}, which had the focus but no cursor shown`);
          else if ([...pad.querySelectorAll('button[data-digit]')].some((x) => x.disabled)) fails.push(`${where}: the keypad's keys are off`);
        } finally { off?.(); }
      }
      expect(fails, `${fails.length} of ${states.length} states:\n${fails.slice(0, 12).join('\n')}`).toEqual([]);
    }, 120000);
  }
});
