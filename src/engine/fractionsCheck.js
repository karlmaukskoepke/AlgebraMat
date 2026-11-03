// The check on Fractions of x (Build AA; loop spec §4): the value dropped into x, then one kind of operation a press, every step shown, with
// parentheses for products. In the form on the screen:
//   `⅔x = 6`, 9:   ⅔(9) = 6      →  6 = 6
//   `2x/3 = 6`, 9: 2(9)/3 = 6    →  18/3 = 6   →  6 = 6
//   `x/3 = 4`, 12: 12/3 = 4      →  4 = 4
// A wrong value can leave a fraction (`⅔(10)` → `20/3`): it is written as one, exactly. Boards after a move (a guess at the current
// equation) hold `2x`, `3(4)`, `½(18)` or `−(12)`: worked out the same way. Same output as solveTerms.substitutionLines: { lines: [{ segs }],
// ok, left, right }. A segment may be stacked (`stack: { top: [segs], bot }`): the view draws it as a fraction. Pure logic, no DOM.

import { MINUS } from './expr.js';
import { ratioText } from './solveTerms.js';

const gcd = (a, b) => { let x = Math.abs(a); let y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x || 1; };
const fr = (n, d = 1) => { const k = gcd(n, d) * Math.sign(d); return { n: n / k, d: d / k }; };
const txt = (f) => `${f.n < 0 ? MINUS : ''}${Math.abs(f.n)}${f.d === 1 ? '' : `/${f.d}`}`;
const sgn = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const plug = (v) => (v < 0 ? `(${sgn(v)})` : `${v}`);

// items: { k: 'num', v: frac }, { k: 'sub', v } (the value alone), { k: 'fx', top, q, form, v }, { k: 'over', top: n, q } (a number over q),
// { k: 'prod', a, v }, { k: 'times', f, b }, { k: 'frac', n, sign, b }, { k: 'neg', b }
function toItem(t, value) {
  if (t.kind === 'x') {
    if ((t.den ?? 1) > 1) return { k: 'fx', top: t.coef, q: t.den, form: t.form ?? 'times', v: value };
    const c = t.coef ?? 1;
    return c === 1 ? { k: 'sub', v: value } : { k: 'prod', a: c, v: value };
  }
  if (t.kind === 'times') return { k: 'times', f: t.f, b: t.inner[0].v };
  if (t.kind === 'frac') return { k: 'frac', n: t.n, sign: t.sign ?? 1, b: t.inner[0].v };
  if (t.kind === 'neg') return { k: 'neg', b: t.inner[0].v };
  return { k: 'num', v: fr(t.v) };
}

function segsOf(it, cls) {
  const op = cls ? `${cls}` : '';
  const blue = cls ? `${cls} is-blue` : 'is-blue';
  const m = (top) => (top < 0 ? MINUS : '');
  switch (it.k) {
    case 'num': return [{ text: txt(it.v), cls: op }];
    case 'sub': return [{ text: sgn(it.v), cls: blue }];
    case 'prod': return [{ text: `${it.a === -1 ? MINUS : sgn(it.a)}(`, cls: op }, { text: sgn(it.v), cls: blue }, { text: ')', cls: op }];
    case 'times': return [{ text: `${sgn(it.f)}(${sgn(it.b)})`, cls: op }];
    case 'frac': return [{ text: `${it.sign < 0 ? MINUS : ''}${ratioText(1, it.n)}(${sgn(it.b)})`, cls: op }];
    case 'neg': return [{ text: `${MINUS}(${sgn(it.b)})`, cls: op }];
    case 'over': return [{ text: `${it.top}/${it.q}`, cls: op, stack: { top: [{ text: sgn(it.top), cls: op }], bot: String(it.q) } }];
    case 'fx': {
      const a = Math.abs(it.top);
      if (it.form === 'over') {
        // `2(9)/3`; x alone on the top is the value itself, `12/3` (in parentheses after a minus, `−(9)/3`)
        const top = a === 1 ? [{ text: `${m(it.top)}${it.top < 0 ? '(' : ''}`, cls: op }, { text: sgn(it.v), cls: blue }, { text: it.top < 0 ? ')' : '', cls: op }]
          : [{ text: `${m(it.top)}${a}(`, cls: op }, { text: sgn(it.v), cls: blue }, { text: ')', cls: op }];
        return [{ text: '', cls: op, stack: { top: top.filter((x) => x.text !== '' || x.cls.includes('is-blue')), bot: String(it.q) } }];
      }
      return [
        ...(it.top < 0 ? [{ text: MINUS, cls: op }] : []),
        { text: ratioText(a, it.q), cls: op, stack: { top: [{ text: String(a), cls: op }], bot: String(it.q) } },
        { text: '(', cls: op }, { text: sgn(it.v), cls: blue }, { text: ')', cls: op },
      ];
    }
    default: return [];
  }
}
// (a value alone in parentheses where it is not the whole side: `2(−9)`)
const lineOf = (left, right, ops, res) => {
  const side = (items) => items.flatMap((it) => segsOf(it, ops.has(it) ? 'is-op' : res.has(it) ? 'is-res' : ''));
  return [...side(left), { text: ' = ', cls: '' }, ...side(right)];
};

const isDone = (it) => it.k === 'num' || it.k === 'sub';
// one step: every product at once (the first kind), then every division (a number over the bottom)
function step(items, ops, res) {
  const out = items.map((it) => {
    let r = null;
    if (it.k === 'fx') r = it.form === 'over' && Math.abs(it.top) !== 1 ? { k: 'over', top: it.top * it.v, q: it.q } : { k: 'num', v: fr(it.top * it.v, it.q) };
    else if (it.k === 'prod') r = { k: 'num', v: fr(it.a * it.v) };
    else if (it.k === 'times') r = { k: 'num', v: fr(it.f * it.b) };
    else if (it.k === 'frac') r = { k: 'num', v: fr(it.sign * it.b, it.n) };
    else if (it.k === 'neg') r = { k: 'num', v: fr(-it.b) };
    if (!r) return it;
    ops.add(it); res.add(r);
    return r;
  });
  if (out.some((it, i) => it !== items[i])) return out;
  return items.map((it) => {
    if (it.k !== 'over') return it;
    const r = { k: 'num', v: fr(it.top, it.q) };
    ops.add(it); res.add(r);
    return r;
  });
}
const valueOf = (items) => (items.length === 1 ? (items[0].k === 'sub' ? fr(items[0].v) : items[0].k === 'num' ? items[0].v : null) : null);

export function fractionsLines(board, value) {
  let left = board.left.map((t) => toItem(t, value));
  let right = board.right.map((t) => toItem(t, value));
  const lines = [];
  let prevRes = new Set();
  for (let guard = 0; guard < 10; guard++) {
    const done = [...left, ...right].every(isDone);
    const ops = new Set();
    const res = new Set();
    const nl = done ? left : step(left, ops, res);
    const nr = done ? right : step(right, ops, res);
    lines.push({ segs: lineOf(left, right, ops, prevRes), op: !done, res: prevRes.size > 0 });
    if (done) break;
    left = nl;
    right = nr;
    prevRes = res;
  }
  const l = valueOf(left);
  const r = valueOf(right);
  return { lines, left: l, right: r, ok: Boolean(l && r && l.n === r.n && l.d === r.d) };
}
export { plug };
