// The check with a fraction (Build V, Strange solutions; loop spec rev 2.11, §4A): a value like 5/2 dropped into every x, then worked out
// one operation a line, exactly, as solveTerms.js does it for whole numbers: the products (`3(5/2)` → `15/2`), a whole number written
// over the denominator when it meets a fraction (`15/2 + 4` → `15/2 + 8/2`), the sums (`23/2`), ending `23/2 = 23/2`. Nothing is
// reduced: the denominator is the value's all the way down. A board may hold a fraction already (`−x = 15/6`, a guess at the current
// equation): it is a number like any other. Whole values on boards with no fraction keep solveTerms.js's own check (the same lines as
// every other card). Same output as substitutionLines: { lines: [{ segs }], ok, left, right }. Pure logic, no DOM.

import { MINUS } from './expr.js';
import { frac, add, times, neg, same } from './fraction.js';
import { factorText } from './solveTerms.js';

const lcm = (a, b) => { let x = a; let y = b; while (y) [x, y] = [y, x % y]; return (a / x) * b; };
const over = (f, d) => ({ n: (f.n * d) / f.d, d });
// a number's text: `5/2`, `−15/2`, `4`
const text = (f) => `${f.n < 0 ? MINUS : ''}${Math.abs(f.n)}${f.d === 1 ? '' : `/${f.d}`}`;
const bare = (f) => `${Math.abs(f.n)}${f.d === 1 ? '' : `/${f.d}`}`;

// items: { k: 'sub', v }, { k: 'num', v }, { k: 'prod', a, v }, { k: 'neg', v }, { k: 'grp', f, d, inner }; every v a fraction
const toItem = (t, value) => {
  if (t.kind === 'x') { const c = t.coef ?? 1; return c === 1 ? { k: 'sub', v: value } : c === -1 ? { k: 'neg', v: value } : { k: 'prod', a: c, v: value }; }
  if (t.kind === 'group') return { k: 'grp', f: t.factor, d: t.den ?? 1, inner: t.inner.map((u) => toItem(u, value)) };
  if (t.kind === 'ratio') return { k: 'num', v: frac(t.n, t.d) };
  if (t.kind === 'neg' && t.inner?.length === 1) { const u = toItem(t.inner[0], value); return u.k === 'num' ? { k: 'negnum', v: u.v } : u; }
  return { k: 'num', v: { n: t.v, d: 1 } };
};
const isNumber = (it) => it.k === 'sub' || it.k === 'num';

function itemSegs(it, ctx, alone) {
  const cls = ctx.op === it || ctx.pair?.includes(it) ? 'is-op' : ctx.res === it ? 'is-res' : '';
  const blue = cls ? `${cls} is-blue` : 'is-blue';
  // (a negative fraction put into x is in parentheses, its sign on the top: `(−5/2)`)
  if (it.k === 'sub') return [{ text: !alone && it.v.n < 0 ? `(${text(it.v)})` : text(it.v), cls: blue }];
  if (it.k === 'num') return [{ text: text(it.v), cls }];
  if (it.k === 'prod') return [{ text: `${it.a < 0 ? MINUS : ''}${Math.abs(it.a)}(`, cls }, { text: text(it.v), cls: blue }, { text: ')', cls }];
  if (it.k === 'neg') return [{ text: `${MINUS}(`, cls }, { text: text(it.v), cls: blue }, { text: ')', cls }];
  if (it.k === 'negnum') return [{ text: `${MINUS}(`, cls }, { text: text(it.v), cls }, { text: ')', cls }];
  return [{ text: `${it.d > 1 ? factorText(it.f, it.d) : it.f === 1 ? '' : it.f === -1 ? MINUS : `${it.f < 0 ? MINUS : ''}${Math.abs(it.f)}`}(`, cls }, ...sumSegs(it.inner, ctx, true), { text: ')', cls }];
}
function sumSegs(items, ctx, inGroup = false) {
  const out = [];
  items.forEach((it, i) => {
    if (i === 0 && inGroup && it.k === 'sub') { out.push(...itemSegs(it, ctx, true)); return; }
    const opCls = i && ctx.pair?.includes(it) && ctx.pair.includes(items[i - 1]) ? 'is-op' : '';
    if (i && it.k === 'num' && it.v.n < 0) {                         // a negative number after another term is a subtraction: 15/2 − 8/2
      out.push({ text: ` ${MINUS} `, cls: opCls });
      out.push({ text: bare(it.v), cls: ctx.op === it || ctx.pair?.includes(it) ? 'is-op' : ctx.res === it ? 'is-res' : '' });
      return;
    }
    if (i && it.k === 'prod' && it.a < 0) {
      const cls = ctx.op === it ? 'is-op' : '';
      out.push({ text: ` ${MINUS} `, cls }, { text: `${-it.a}(`, cls }, { text: text(it.v), cls: cls ? `${cls} is-blue` : 'is-blue' }, { text: ')', cls });
      return;
    }
    if (i) out.push({ text: ' + ', cls: opCls });
    out.push(...itemSegs(it, ctx, items.length === 1));
  });
  return out;
}

const done = (r, it, list) => list.map((x) => (x === it ? r : x));
// The next operation: { apply, op | pair, res } or null. Parentheses, then products, then a whole number over the fraction's denominator
// where it meets one (its own line), then sums, left to right.
function nextOp(items) {
  for (const it of items) {
    if (it.k !== 'grp') continue;
    const inner = nextOp(it.inner);
    if (inner) return { ...inner, apply: (list) => list.map((x) => (x === it ? { ...it, inner: inner.apply(it.inner) } : x)) };
    if (it.inner.length === 1 && isNumber(it.inner[0])) {
      const v = it.inner[0].v;
      const r = { k: 'num', v: it.d > 1 ? { n: it.f * v.n, d: it.d * v.d } : times(it.f, v) };
      return { op: it, res: r, apply: (list) => done(r, it, list) };
    }
  }
  for (const it of items) {
    if (it.k === 'neg' || it.k === 'negnum') { const r = { k: 'num', v: neg(it.v) }; return { op: it, res: r, apply: (list) => done(r, it, list) }; }
    if (it.k === 'prod') { const r = { k: 'num', v: times(it.a, it.v) }; return { op: it, res: r, apply: (list) => done(r, it, list) }; }
  }
  for (let i = 0; i + 1 < items.length; i++) {
    const [a, b] = [items[i], items[i + 1]];
    if (!isNumber(a) || !isNumber(b)) continue;
    if (a.v.d !== b.v.d) {
      // a common denominator first, on a line of its own (`15/2 + 4` → `15/2 + 8/2`)
      const d = lcm(a.v.d, b.v.d);
      const na = a.v.d === d ? a : { k: 'num', v: over(a.v, d) };
      const nb = b.v.d === d ? b : { k: 'num', v: over(b.v, d) };
      const changed = [a !== na ? a : null, b !== nb ? b : null].filter(Boolean);
      return { pair: changed, res: nb !== b ? nb : na, apply: (list) => [...list.slice(0, i), na, nb, ...list.slice(i + 2)] };
    }
    const r = { k: 'num', v: add(a.v, b.v) };
    return { pair: [a, b], res: r, apply: (list) => [...list.slice(0, i), r, ...list.slice(i + 2)] };
  }
  return null;
}

const lineOf = (left, right, ctx) => [...sumSegs(left, ctx), { text: ' = ', cls: '' }, ...sumSegs(right, ctx)];
const valueOf = (items) => (items.length === 1 && isNumber(items[0]) ? items[0].v : null);

export function fractionLines(board, value) {
  let left = board.left.map((t) => toItem(t, value));
  let right = board.right.map((t) => toItem(t, value));
  const lines = [];
  let prevRes = null;
  for (let guard = 0; guard < 40; guard++) {
    const onLeft = nextOp(left);
    const found = onLeft ?? nextOp(right);
    // both sides one number over different denominators: written over the same one, so the two can be compared (`12/2 = 6` → `12/2 = 12/2`)
    if (!found) {
      const l = valueOf(left);
      const r = valueOf(right);
      if (l && r && l.d !== r.d) {
        const d = lcm(l.d, r.d);
        const nl = l.d === d ? left[0] : { k: 'num', v: over(l, d) };
        const nr = r.d === d ? right[0] : { k: 'num', v: over(r, d) };
        const ops = [nl !== left[0] ? left[0] : null, nr !== right[0] ? right[0] : null].filter(Boolean);
        lines.push({ segs: lineOf(left, right, { op: null, pair: ops, res: prevRes }), op: true, res: Boolean(prevRes) });
        prevRes = nr !== right[0] ? nr : nl;
        left = [nl];
        right = [nr];
        continue;
      }
    }
    const ctx = { op: found?.op ?? null, pair: found?.pair ?? null, res: prevRes };
    lines.push({ segs: lineOf(left, right, ctx), op: Boolean(found), res: Boolean(prevRes) });
    if (!found) break;
    if (onLeft) left = found.apply(left); else right = found.apply(right);
    prevRes = found.res;
  }
  const l = valueOf(left);
  const r = valueOf(right);
  return { lines, left: l, right: r, ok: Boolean(l && r && same(l, r)) };
}
