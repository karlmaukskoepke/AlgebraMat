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
  const cls = ctx.ops?.has(it) ? 'is-op' : ctx.res?.has(it) ? 'is-res' : '';
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
    const opCls = i && ctx.sums?.has(it) && ctx.sums.has(items[i - 1]) ? 'is-op' : '';
    if (i && it.k === 'num' && it.v.n < 0) {                         // a negative number after another term is a subtraction: 15/2 − 8/2
      out.push({ text: ` ${MINUS} `, cls: opCls });
      out.push({ text: bare(it.v), cls: ctx.ops?.has(it) ? 'is-op' : ctx.res?.has(it) ? 'is-res' : '' });
      return;
    }
    if (i && it.k === 'prod' && it.a < 0) {
      const cls = ctx.ops?.has(it) ? 'is-op' : '';
      out.push({ text: ` ${MINUS} `, cls }, { text: `${-it.a}(`, cls }, { text: text(it.v), cls: cls ? `${cls} is-blue` : 'is-blue' }, { text: ')', cls });
      return;
    }
    if (i) out.push({ text: ' + ', cls: opCls });
    out.push(...itemSegs(it, ctx, items.length === 1));
  });
  return out;
}

// One step (Karl, after Build V): every operation of the same kind, on both sides at once: first inside the parentheses, then every
// product (and the opposite of a number), then every run of numbers written over one denominator where they differ, then every run added
// together in one go.
const KINDS = ['inner', 'mul', 'den', 'sum'];
const single = (it) => it.inner.length === 1 && isNumber(it.inner[0]);
const runs = (items) => {                                          // the runs of two or more numbers side by side: [start, end)
  const out = [];
  for (let i = 0; i < items.length;) {
    let j = i;
    while (j < items.length && isNumber(items[j])) j++;
    if (j - i >= 2) out.push([i, j]);
    i = Math.max(j, i + 1);
  }
  return out;
};
function kindOf(items) {
  let mul = false;
  for (const it of items) {
    if (it.k === 'grp') { if (!single(it)) return 'inner'; mul = true; }
    if (it.k === 'prod' || it.k === 'neg' || it.k === 'negnum') mul = true;
  }
  if (mul) return 'mul';
  const rs = runs(items);
  if (rs.some(([i, j]) => new Set(items.slice(i, j).map((it) => it.v.d)).size > 1)) return 'den';
  return rs.length ? 'sum' : null;
}
const earliest = (...kinds) => KINDS.find((k) => kinds.includes(k)) ?? null;
function stepOf(items, kind, ctx) {
  if (kind === 'inner') return items.map((it) => (it.k === 'grp' && !single(it) ? { ...it, inner: stepOf(it.inner, kindOf(it.inner), ctx) } : it));
  if (kind === 'mul') {
    return items.map((it) => {
      let v = null;
      if (it.k === 'grp' && single(it)) { const u = it.inner[0].v; v = it.d > 1 ? { n: it.f * u.n, d: it.d * u.d } : times(it.f, u); }
      else if (it.k === 'neg' || it.k === 'negnum') v = neg(it.v);
      else if (it.k === 'prod') v = times(it.a, it.v);
      if (v === null) return it;
      const r = { k: 'num', v };
      ctx.ops.add(it); ctx.res.add(r);
      return r;
    });
  }
  const out = [...items];
  for (const [i, j] of runs(items)) {
    const run = items.slice(i, j);
    if (kind === 'den') {
      // (a whole number meeting a fraction is written over its denominator: `15/2 + 4` → `15/2 + 8/2`)
      const d = run.reduce((m, it) => lcm(m, it.v.d), 1);
      run.forEach((it, k) => { if (it.v.d !== d) { const r = { k: 'num', v: over(it.v, d) }; ctx.ops.add(it); ctx.res.add(r); out[i + k] = r; } });
    } else if (kind === 'sum') {
      const r = { k: 'num', v: run.slice(1).reduce((a, it) => add(a, it.v), run[0].v) };
      run.forEach((it) => { ctx.ops.add(it); ctx.sums.add(it); });
      ctx.res.add(r);
      out.splice(i, j - i, r, ...Array(j - i - 1).fill(null));
    }
  }
  return out.filter(Boolean);
}

const lineOf = (left, right, ctx) => [...sumSegs(left, ctx), { text: ' = ', cls: '' }, ...sumSegs(right, ctx)];
const valueOf = (items) => (items.length === 1 && isNumber(items[0]) ? items[0].v : null);

export function fractionLines(board, value) {
  let left = board.left.map((t) => toItem(t, value));
  let right = board.right.map((t) => toItem(t, value));
  const lines = [];
  let prevRes = new Set();
  for (let guard = 0; guard < 40; guard++) {
    const kind = earliest(kindOf(left), kindOf(right));
    const ctx = { ops: new Set(), sums: new Set(), res: new Set() };
    if (!kind) {
      // both sides one number over different denominators: written over the same one, so the two can be compared (`12/2 = 6` → `12/2 = 12/2`)
      const l = valueOf(left);
      const r = valueOf(right);
      if (l && r && l.d !== r.d) {
        const d = lcm(l.d, r.d);
        const nl = l.d === d ? left[0] : { k: 'num', v: over(l, d) };
        const nr = r.d === d ? right[0] : { k: 'num', v: over(r, d) };
        if (nl !== left[0]) { ctx.ops.add(left[0]); ctx.res.add(nl); }
        if (nr !== right[0]) { ctx.ops.add(right[0]); ctx.res.add(nr); }
        lines.push({ segs: lineOf(left, right, { ops: ctx.ops, sums: ctx.sums, res: prevRes }), op: true, res: prevRes.size > 0 });
        left = [nl];
        right = [nr];
        prevRes = ctx.res;
        continue;
      }
    }
    const nextLeft = kind ? stepOf(left, kind, ctx) : left;
    const nextRight = kind ? stepOf(right, kind, ctx) : right;
    lines.push({ segs: lineOf(left, right, { ops: ctx.ops, sums: ctx.sums, res: prevRes }), op: Boolean(kind), res: prevRes.size > 0 });
    if (!kind) break;
    left = nextLeft;
    right = nextRight;
    prevRes = ctx.res;
  }
  const l = valueOf(left);
  const r = valueOf(right);
  return { lines, left: l, right: r, ok: Boolean(l && r && same(l, r)) };
}
