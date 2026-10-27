// The shared term algebra of the Solve it loop (SPEC-SOLVE-IT-LOOP.md §3C, §4): an equation state is two sides, each a list of
// terms. A term is { kind: 'x', coef? } (coef defaults to 1), { kind: 'num', v }, { kind: 'frac', n, inner: [terms] } (1/n of
// the inner terms, as in ⅓(−12)), or { kind: 'group', factor, inner: [terms] } (a factor times a parenthesis, `3(x + 2)`: Build M). This module writes a state as text, and works out a value substituted for x one operation at a
// time: each line has the operation about to happen marked (`op`: underlined, in the accent colour) and the result of the one
// before marked (`res`: the same colour), so the eye follows one change down the stack. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const FRACTIONS = { 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 6: '⅙' };
export const fractionText = (n) => FRACTIONS[n] ?? `1/${n}`;
export const plugValue = (v) => (v < 0 ? `(${signed(v)})` : `${v}`);
// A fraction n/d as one character where there is one (`⅔`, `¾`), else `n/d`; a group's factor with its sign: `3`, `−2`, `⅔`, `−⅔`
// (Build U: a fraction factor is `factor` over `den`, the sign on top).
const VULGAR = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚' };
export const ratioText = (n, d) => VULGAR[`${n}/${d}`] ?? `${n}/${d}`;
export const factorText = (f, den = 1) => (den > 1 ? `${f < 0 ? MINUS : ''}${ratioText(Math.abs(f), den)}` : signed(f));
// The factor as it is written in front of its parenthesis: nothing for 1, a bare minus for −1 (the invisible 1), else the factor
const frontText = (f, den = 1) => (den > 1 ? factorText(f, den) : f === 1 ? '' : f === -1 ? MINUS : signed(f));

// How many x's an equation has to drop the value into (each x term is one, with or without a number in front; the x inside a fraction
// of a worked row is not a drop target).
const xIn = (terms) => terms.reduce((n, t) => n + (t.kind === 'x' ? 1 : t.kind === 'group' ? xIn(t.inner) : 0), 0);
export const xCount = (board) => xIn(board.left) + xIn(board.right);

export const termText = (t) => {
  if (t.kind === 'x') return (t.coef ?? 1) > 1 ? `${t.coef}x` : (t.coef ?? 1) < -1 ? `${MINUS}${-t.coef}x` : (t.coef ?? 1) === -1 ? `${MINUS}x` : 'x';
  if (t.kind === 'frac') return `${t.sign < 0 ? MINUS : ''}${fractionText(t.n)}(${t.inner.map(termText).join(' + ')})`;
  if (t.kind === 'neg') return `${MINUS}(${t.inner.map(termText).join(' + ')})`;                       // `−(12)` (Build J)
  if (t.kind === 'ratio') return `${t.n < 0 ? MINUS : ''}${Math.abs(t.n)}/${t.d}`;                  // `x = 15/6` (Build V: a divide that does not split)
  if (t.kind === 'times') return `${signed(t.f)}(${t.inner.map(termText).join(' + ')})`;          // `−1(−x)` (Build J; no times sign, Build U)
  if (t.kind === 'group') return `${frontText(t.factor, t.den)}(${sideText(t.inner)})`;   // `3(x + 2)` (Build M), `⅔(6x + 9)` (Build U)
  return signed(t.v);
};
export const sideText = (terms) => terms.map((t, i) => (i && t.kind === 'num' && t.v < 0 ? ` − ${-t.v}`
  : i && t.kind === 'group' && t.factor < 0 ? ` − ${termText({ ...t, factor: -t.factor })}` : `${i ? ' + ' : ''}${termText(t)}`)).join('');
export const boardText = (board) => `${sideText(board.left)} = ${sideText(board.right)}`;

// ---------- the value in place of x, worked out one operation at a time ----------

// An item of the working expression: { k: 'sub', v } (the value, in blue), { k: 'num', v }, { k: 'prod', a, v } (a times the value, written `a(v)`),
// { k: 'frac', n, inner: [items] }. `sub`/`num` are finished numbers.
const toItem = (t, value) => {
  if (t.kind === 'x') return (t.coef ?? 1) === 1 ? { k: 'sub', v: value } : (t.coef === -1 ? { k: 'neg', v: value } : { k: 'prod', a: t.coef, v: value });
  if (t.kind === 'frac') return { k: 'frac', n: t.n, inner: t.inner.map((u) => toItem(u, value)) };
  if (t.kind === 'group') return { k: 'grp', f: t.factor, d: t.den ?? 1, inner: t.inner.map((u) => toItem(u, value)) };   // `3(x + 2)`: the parenthesis first
  return { k: 'num', v: t.v };
};
const isNumber = (it) => it.k === 'sub' || it.k === 'num';

// Text of an item as a list of segments ({ text, cls }); `mark` says which item (by reference) is the op, and which the result.
function itemSegs(it, ctx, alone) {
  const cls = ctx.ops?.has(it) ? 'is-op' : ctx.res?.has(it) ? 'is-res' : '';
  // the value dropped into x is always the blue of the x it replaced (Build H, Part 1), even when it is the operation about to happen
  const blue = cls ? `${cls} is-blue` : 'is-blue';
  if (it.k === 'sub') return [{ text: !alone && it.v < 0 ? `(${signed(it.v)})` : signed(it.v), cls: blue }];
  if (it.k === 'num') return [{ text: signed(it.v), cls }];
  // a product in parentheses, never a times sign next to the x's (Build T): `7(3)`, `−3(−4)`
  if (it.k === 'prod') return [{ text: `${signed(it.a)}(`, cls }, { text: signed(it.v), cls: blue }, { text: ')', cls }];
  if (it.k === 'neg') return [{ text: `${MINUS}(`, cls }, { text: signed(it.v), cls: blue }, { text: ')', cls }];
  // a factor times a parenthesis (Build M): `3(3 + 2)`, `−2(−7 + 4)`; a negative value first inside the parenthesis needs no second pair
  // of parentheses, and the whole is the op once the parenthesis is one number (`3(5)`)
  if (it.k === 'grp') return [{ text: `${frontText(it.f, it.d)}(`, cls }, ...sumSegs(it.inner, ctx, true), { text: ')', cls }];
  // a fraction: the fraction and its inner part; the whole is the op when it is the one being worked out
  const inner = sumSegs(it.inner, ctx);
  return [{ text: `${fractionText(it.n)}(`, cls }, ...inner, { text: ')', cls }];
}
function sumSegs(items, ctx, inGroup = false) {
  const out = [];
  items.forEach((it, i) => {
    if (i === 0 && inGroup && it.k === 'sub') { out.push(...itemSegs(it, ctx, true)); return; }   // `(−7 + 4)`, not `((−7) + 4)`
    if (i && it.k === 'grp' && it.f < 0) {                          // a group subtracted after another term: 5 − 2(−3 + 2) (Build M)
      const cls = ctx.ops?.has(it) ? 'is-op' : '';
      out.push({ text: ' − ', cls }, { text: `${frontText(-it.f, it.d)}(`, cls }, ...sumSegs(it.inner, ctx, true), { text: ')', cls });
      return;
    }
    const opCls = i && ctx.sums?.has(it) && ctx.sums.has(items[i - 1]) ? 'is-op' : '';
    if (i && it.k === 'num' && it.v < 0) {                          // a negative number after another term is written as a subtraction: 15 − 6
      out.push({ text: ' − ', cls: opCls });
      out.push({ text: `${-it.v}`, cls: ctx.ops?.has(it) ? 'is-op' : ctx.res?.has(it) ? 'is-res' : '' });
      return;
    }
    if (i && it.k === 'prod' && it.a < 0) {                         // so is x with a minus after another term: 4 − 3(5) (Build K, T)
      const cls = ctx.ops?.has(it) ? 'is-op' : '';
      out.push({ text: ' − ', cls }, { text: `${-it.a}(`, cls }, { text: signed(it.v), cls: cls ? `${cls} is-blue` : 'is-blue' }, { text: ')', cls });
      return;
    }
    if (i) out.push({ text: ' + ', cls: opCls });
    out.push(...itemSegs(it, ctx, items.length === 1));
  });
  return out;
}

// One step of the work (Karl, after Build V: the check was too slow, one operation a press): every operation of the same kind, on both
// sides at once, in the order of operations: first inside the parentheses, then every product (each x's number times the value, a factor
// or a fraction times its parenthesis worked out, the opposite of a number), then every run of numbers added together in one go
// (`12 + 4 = 4 + 9` → `16 = 13`). `kindOf(items)` is the first kind a list still holds.
const KINDS = ['inner', 'mul', 'sum'];
const single = (it) => it.inner.length === 1 && isNumber(it.inner[0]);
function kindOf(items) {
  let mul = false;
  for (const it of items) {
    if (it.k === 'grp' || it.k === 'frac') { if (!single(it)) return 'inner'; mul = true; }
    if (it.k === 'prod' || it.k === 'neg') mul = true;
  }
  if (mul) return 'mul';
  return items.some((it, i) => isNumber(it) && isNumber(items[i + 1] ?? {})) ? 'sum' : null;
}
const earliest = (...kinds) => KINDS.find((k) => kinds.includes(k)) ?? null;
// The list after one step of `kind`; the items worked on go into `ops`, their results into `res` (and summed runs into `sums`).
function stepOf(items, kind, ctx) {
  if (kind === 'inner') return items.map((it) => ((it.k === 'grp' || it.k === 'frac') && !single(it) ? { ...it, inner: stepOf(it.inner, kindOf(it.inner), ctx) } : it));
  if (kind === 'mul') {
    return items.map((it) => {
      let v = null;
      if ((it.k === 'grp') && single(it)) v = (it.f * it.inner[0].v) / (it.d ?? 1);
      else if (it.k === 'frac' && single(it)) v = it.inner[0].v / it.n;
      else if (it.k === 'neg') v = -it.v;
      else if (it.k === 'prod') v = it.a * it.v;
      if (v === null) return it;
      const r = { k: 'num', v };
      ctx.ops.add(it); ctx.res.add(r);
      return r;
    });
  }
  if (kind === 'sum') {
    const out = [];
    for (let i = 0; i < items.length;) {
      let j = i;
      while (j < items.length && isNumber(items[j])) j++;
      if (j - i >= 2) {
        const run = items.slice(i, j);
        const r = { k: 'num', v: run.reduce((a, it) => a + it.v, 0) };
        run.forEach((it) => { ctx.ops.add(it); ctx.sums.add(it); });
        ctx.res.add(r);
        out.push(r);
        i = j;
      } else { out.push(items[i]); i += 1; }
    }
    return out;
  }
  return items;
}

const lineOf = (left, right, ctx) => [...sumSegs(left, ctx), { text: ' = ', cls: '' }, ...sumSegs(right, ctx)];
const valueOf = (items) => (items.length === 1 && isNumber(items[0]) ? items[0].v : null);

// The lines of the work: [{ segs }], and whether the two sides come out equal. Each line shows the operations about to happen
// (`op`) and the results of the step before (`res`); a line may carry both.
export function substitutionLines(board, value) {
  let left = board.left.map((t) => toItem(t, value));
  let right = board.right.map((t) => toItem(t, value));
  const lines = [];
  const states = [];                                                // the items of each line, for a picture of it (the seesaw's check, Build H)
  let prevRes = new Set();
  for (let guard = 0; guard < 40; guard++) {
    const kind = earliest(kindOf(left), kindOf(right));
    const ctx = { ops: new Set(), sums: new Set(), res: new Set() };
    const nextLeft = kind ? stepOf(left, kind, ctx) : left;
    const nextRight = kind ? stepOf(right, kind, ctx) : right;
    lines.push({ segs: lineOf(left, right, { ops: ctx.ops, sums: ctx.sums, res: prevRes }), op: Boolean(kind), res: prevRes.size > 0 });
    states.push({ left: left.map((it) => ({ ...it })), right: right.map((it) => ({ ...it })) });
    if (!kind) break;
    left = nextLeft;
    right = nextRight;
    prevRes = ctx.res;
  }
  const l = valueOf(left);
  const r = valueOf(right);
  return { lines, states, left: l, right: r, ok: l !== null && l === r };
}

export const lineText = (line) => line.segs.map((s) => s.text).join('');

// The equation as the check's first line writes it (Build I, Part 1): the same spacing and signs as the line under it, every x blue and
// numbered left to right (`xi`), so each value of the line under it can be set directly below the x it replaced.
export function equationSegs(board) {
  let xi = 0;
  const termSegs = (t) => {
    if (t.kind === 'x') {
      const c = t.coef ?? 1;
      const front = c === 1 ? [] : [{ text: c === -1 ? MINUS : signed(c), cls: '', front: true }];      // (`front`: the start of an x-term)
      return [...front, { text: 'x', cls: 'is-blue', xi: xi++ }];
    }
    if (t.kind === 'frac') return [{ text: `${fractionText(t.n)}(`, cls: '' }, ...sideSegs(t.inner), { text: ')', cls: '' }];
    if (t.kind === 'group') return [{ text: `${frontText(t.factor, t.den)}(`, cls: '' }, ...sideSegs(t.inner), { text: ')', cls: '' }];
    if (t.kind === 'ratio') return [{ text: termText(t), cls: '' }];                                              // (Build V: `15/6`)
    return [{ text: signed(t.v), cls: '' }];
  };
  const sideSegs = (terms) => terms.flatMap((t, i) => {
    if (i && t.kind === 'num' && t.v < 0) return [{ text: ' − ', cls: '' }, { text: `${-t.v}`, cls: '' }];
    if (i && t.kind === 'x' && (t.coef ?? 1) < 0) return [{ text: ' − ', cls: '' }, ...termSegs({ ...t, coef: -t.coef })];   // `4 − 3x` (Build K)
    if (i && t.kind === 'group' && t.factor < 0) return [{ text: ' − ', cls: '' }, ...termSegs({ ...t, factor: -t.factor })];   // `5 − 2(x + 2)` (Build M)
    return [...(i ? [{ text: ' + ', cls: '' }] : []), ...termSegs(t)];
  });
  return [...sideSegs(board.left), { text: ' = ', cls: '' }, ...sideSegs(board.right)];
}
