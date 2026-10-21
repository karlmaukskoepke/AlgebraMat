// The shared term algebra of the Solve it loop (SPEC-SOLVE-IT-LOOP.md §3C, §4): an equation state is two sides, each a list of
// terms. A term is { kind: 'x', coef? } (coef defaults to 1), { kind: 'num', v }, or { kind: 'frac', n, inner: [terms] } (1/n of
// the inner terms, as in ⅓(−12)). This module writes a state as text, and works out a value substituted for x one operation at a
// time: each line has the operation about to happen marked (`op`: underlined, in the accent colour) and the result of the one
// before marked (`res`: the same colour), so the eye follows one change down the stack. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const FRACTIONS = { 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 6: '⅙' };
export const fractionText = (n) => FRACTIONS[n] ?? `1/${n}`;
export const plugValue = (v) => (v < 0 ? `(${signed(v)})` : `${v}`);

// How many x's an equation has to drop the value into (each x term is one, with or without a number in front; the x inside a fraction
// of a worked row is not a drop target).
const xIn = (terms) => terms.reduce((n, t) => n + (t.kind === 'x' ? 1 : 0), 0);
export const xCount = (board) => xIn(board.left) + xIn(board.right);

export const termText = (t) => {
  if (t.kind === 'x') return (t.coef ?? 1) > 1 ? `${t.coef}x` : (t.coef ?? 1) < -1 ? `${MINUS}${-t.coef}x` : (t.coef ?? 1) === -1 ? `${MINUS}x` : 'x';
  if (t.kind === 'frac') return `${t.sign < 0 ? MINUS : ''}${fractionText(t.n)}(${t.inner.map(termText).join(' + ')})`;
  if (t.kind === 'neg') return `${MINUS}(${t.inner.map(termText).join(' + ')})`;                       // `−(12)` (Build J)
  if (t.kind === 'times') return `${signed(t.f)} × (${t.inner.map(termText).join(' + ')})`;          // `−1 × (−x)` (Build J)
  return signed(t.v);
};
export const sideText = (terms) => terms.map((t, i) => (i && t.kind === 'num' && t.v < 0 ? ` − ${-t.v}` : `${i ? ' + ' : ''}${termText(t)}`)).join('');
export const boardText = (board) => `${sideText(board.left)} = ${sideText(board.right)}`;

// ---------- the value in place of x, worked out one operation at a time ----------

// An item of the working expression: { k: 'sub', v } (the value, in blue), { k: 'num', v }, { k: 'prod', a, v } (a × value),
// { k: 'frac', n, inner: [items] }. `sub`/`num` are finished numbers.
const toItem = (t, value) => {
  if (t.kind === 'x') return (t.coef ?? 1) === 1 ? { k: 'sub', v: value } : (t.coef === -1 ? { k: 'neg', v: value } : { k: 'prod', a: t.coef, v: value });
  if (t.kind === 'frac') return { k: 'frac', n: t.n, inner: t.inner.map((u) => toItem(u, value)) };
  return { k: 'num', v: t.v };
};
const isNumber = (it) => it.k === 'sub' || it.k === 'num';

// Text of an item as a list of segments ({ text, cls }); `mark` says which item (by reference) is the op, and which the result.
function itemSegs(it, ctx, alone) {
  const cls = ctx.op === it || ctx.pair?.includes(it) ? 'is-op' : ctx.res === it ? 'is-res' : '';
  // the value dropped into x is always the blue of the x it replaced (Build H, Part 1), even when it is the operation about to happen
  const blue = cls ? `${cls} is-blue` : 'is-blue';
  if (it.k === 'sub') return [{ text: !alone && it.v < 0 ? `(${signed(it.v)})` : signed(it.v), cls: blue }];
  if (it.k === 'num') return [{ text: signed(it.v), cls }];
  if (it.k === 'prod') return [{ text: `${signed(it.a)} × `, cls }, { text: plugValue(it.v), cls: blue }];
  if (it.k === 'neg') return [{ text: `${MINUS}(`, cls }, { text: signed(it.v), cls: blue }, { text: ')', cls }];
  // a fraction: the fraction and its inner part; the whole is the op when it is the one being worked out
  const inner = sumSegs(it.inner, ctx);
  return [{ text: `${fractionText(it.n)}(`, cls }, ...inner, { text: ')', cls }];
}
function sumSegs(items, ctx) {
  const out = [];
  items.forEach((it, i) => {
    const opCls = i && ctx.pair?.includes(it) && ctx.pair.includes(items[i - 1]) ? 'is-op' : '';
    if (i && it.k === 'num' && it.v < 0) {                          // a negative number after another term is written as a subtraction: 15 − 6
      out.push({ text: ' − ', cls: opCls });
      out.push({ text: `${-it.v}`, cls: ctx.op === it || ctx.pair?.includes(it) ? 'is-op' : ctx.res === it ? 'is-res' : '' });
      return;
    }
    if (i && it.k === 'prod' && it.a < 0) {                         // so is x with a minus after another term: 4 − 3 × 5 (Build K)
      const cls = ctx.op === it ? 'is-op' : '';
      out.push({ text: ' − ', cls }, { text: `${-it.a} × `, cls }, { text: plugValue(it.v), cls: cls ? `${cls} is-blue` : 'is-blue' });
      return;
    }
    if (i) out.push({ text: ' + ', cls: opCls });
    out.push(...itemSegs(it, ctx, items.length === 1));
  });
  return out;
}

// The next operation on a list of items (left to right, products and fractions first, then sums): { apply, op, pair }, or null.
function nextOp(items) {
  for (const it of items) {
    if (it.k === 'frac') {
      const inner = nextOp(it.inner);
      if (inner) return { ...inner, apply: (list) => list.map((x) => (x === it ? { ...it, inner: inner.apply(it.inner) } : x)) };
      if (it.inner.length === 1 && isNumber(it.inner[0])) {
        const r = { k: 'num', v: it.inner[0].v / it.n };
        return { op: it, res: r, apply: (list) => list.map((x) => (x === it ? r : x)) };
      }
    }
  }
  for (const it of items) {
    if (it.k === 'neg') {
      const r = { k: 'num', v: -it.v };
      return { op: it, res: r, apply: (list) => list.map((x) => (x === it ? r : x)) };
    }
    if (it.k === 'prod') {
      const r = { k: 'num', v: it.a * it.v };
      return { op: it, res: r, apply: (list) => list.map((x) => (x === it ? r : x)) };
    }
  }
  for (let i = 0; i + 1 < items.length; i++) {
    if (isNumber(items[i]) && isNumber(items[i + 1])) {
      const r = { k: 'num', v: items[i].v + items[i + 1].v };
      return { pair: [items[i], items[i + 1]], res: r, apply: (list) => [...list.slice(0, i), r, ...list.slice(i + 2)] };
    }
  }
  return null;
}
const applyOp = (items, found) => found.apply(items);

const lineOf = (left, right, ctx) => [...sumSegs(left, ctx), { text: ' = ', cls: '' }, ...sumSegs(right, ctx)];
const valueOf = (items) => (items.length === 1 && isNumber(items[0]) ? items[0].v : null);

// The lines of the work: [{ segs }], and whether the two sides come out equal. Each line shows the operation about to happen
// (`op`) and the result of the one before (`res`); a line may carry both.
export function substitutionLines(board, value) {
  let left = board.left.map((t) => toItem(t, value));
  let right = board.right.map((t) => toItem(t, value));
  const lines = [];
  const states = [];                                                // the items of each line, for a picture of it (the seesaw's check, Build H)
  let prevRes = null;
  for (let guard = 0; guard < 40; guard++) {
    const onLeft = nextOp(left);
    const found = onLeft ?? nextOp(right);
    const ctx = { op: found?.op ?? null, pair: found?.pair ?? null, res: prevRes };
    lines.push({ segs: lineOf(left, right, ctx), op: Boolean(found), res: Boolean(prevRes) });
    states.push({ left: left.map((it) => ({ ...it })), right: right.map((it) => ({ ...it })) });
    if (!found) break;
    if (onLeft) left = applyOp(left, found); else right = applyOp(right, found);
    prevRes = found.res;
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
      const front = c === 1 ? [] : [{ text: c === -1 ? MINUS : signed(c), cls: '' }];
      return [...front, { text: 'x', cls: 'is-blue', xi: xi++ }];
    }
    if (t.kind === 'frac') return [{ text: `${fractionText(t.n)}(`, cls: '' }, ...sideSegs(t.inner), { text: ')', cls: '' }];
    return [{ text: signed(t.v), cls: '' }];
  };
  const sideSegs = (terms) => terms.flatMap((t, i) => {
    if (i && t.kind === 'num' && t.v < 0) return [{ text: ' − ', cls: '' }, { text: `${-t.v}`, cls: '' }];
    if (i && t.kind === 'x' && (t.coef ?? 1) < 0) return [{ text: ' − ', cls: '' }, ...termSegs({ ...t, coef: -t.coef })];   // `4 − 3x` (Build K)
    return [...(i ? [{ text: ' + ', cls: '' }] : []), ...termSegs(t)];
  });
  return [...sideSegs(board.left), { text: ' = ', cls: '' }, ...sideSegs(board.right)];
}
