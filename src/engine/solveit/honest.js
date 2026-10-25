// The honest path of a Solve it problem (Build S): the moves a student who knows the card makes, one at a time, as the card's own actions,
// from the state it is given to Balanced. Read from the board alone, so it works on every card: distribute a parenthesis, carry the smaller
// x-term across the =, combine like terms on a side, carry the number beside x across, flip a minus, divide by the number in front of x,
// then type x, drop it into each x and press Next to Balanced. Pure: it only calls the card's reducer.
//
//   honestPath(reduce, s, { grab })   every state on the way, the first one included ([] when the card refuses a step: the path stops)
//     grab   the card's terms can be picked up (Add's term layer): a number crosses by a drag; otherwise by the Add move
//
// Used to choose a problem's text size before it is solved (the worst case of its rows, view/fitSize.js) and by the standing tests.

const digitsOf = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const sides = ['left', 'right'];
const xTerms = (side) => side.filter((t) => t.kind === 'x');
const nums = (side) => side.filter((t) => t.kind === 'num');
const coefOf = (t) => t.coef ?? 1;

// x alone on a side, and no x on the other (`x = 5`, `x = ⅓(15)`, `x = −(8)`)
export function xAlone(board) {
  return sides.some((k) => {
    const o = k === 'left' ? 'right' : 'left';
    const one = board[k].length === 1 && board[k][0].kind === 'x' && coefOf(board[k][0]) === 1;
    return one && !JSON.stringify(board[o]).includes('"kind":"x"');
  });
}

// the next move, as the card's actions, or null when x is alone
export function nextMove(s, { grab = true } = {}) {
  const b = s.board;
  if (!b || xAlone(b)) return null;
  // a parenthesis: distribute it (the factor onto the parenthesis, one typed product a piece)
  for (const k of sides) {
    const g = b[k].find((t) => t.kind === 'group');
    if (g) {
      const ps = g.inner.map((x) => g.factor * (x.kind === 'x' ? (x.coef ?? 1) : x.v));
      // (a subtracted factor, `5 − 2(x + 1)`, is shown as a negative first: its minus tapped)
      const tap = g.factor < 0 && b[k].indexOf(g) > 0 && !s.lx?.negIds?.includes(g.id) ? [{ type: 'lxMinus', id: g.id }] : [];
      return [...tap, { type: 'lxDistribute', id: g.id }, ...ps.flatMap((v, i) => [{ type: 'focus', target: 'dist', index: i }, ...digitsOf(v)]), { type: 'lxApply' }];
    }
  }
  // x on both sides: the smaller x-term (the right one on a tie) carried across the =
  const xl = xTerms(b.left);
  const xr = xTerms(b.right);
  if (xl.length && xr.length) {
    const sum = (ts) => Math.abs(ts.reduce((a, t) => a + coefOf(t), 0));
    const from = sum(xl) < sum(xr) ? 'left' : 'right';
    const t = (from === 'left' ? xl : xr)[0];
    const to = from === 'left' ? 'right' : 'left';
    return [{ type: 'lxDrop', id: t.id, slot: { side: to, at: b[to].length }, how: 'pointer' }];
  }
  // like terms on one side: the second dropped onto the first, their sum typed (an x sum with its x)
  for (const k of sides) {
    for (const pick of [xTerms, nums]) {
      const like = pick(b[k]);
      if (like.length < 2) continue;
      const [a, c] = like;
      const isX = a.kind === 'x';
      const total = isX ? coefOf(a) + coefOf(c) : a.v + c.v;
      const typed = isX ? [...digitsOf(total), { type: 'typeChar', ch: 'x' }] : digitsOf(total);
      return [{ type: 'lxDrop', id: c.id, slot: { side: k, onto: a.id }, how: 'pointer' }, ...typed, { type: 'lxApply' }];
    }
  }
  // a number beside x: carried across (its opposite added to both sides)
  const xs = sides.find((k) => b[k].some((t) => t.kind === 'x'));
  const beside = xs ? b[xs].find((t) => t.kind === 'num') : null;
  if (beside) {
    const other = xs === 'left' ? 'right' : 'left';
    if (grab) return [{ type: 'lxDrop', id: beside.id, slot: { side: other, at: b[other].length }, how: 'pointer' }];
    return [{ type: 'choose', move: 'add' }, ...digitsOf(-beside.v), { type: 'go' }];
  }
  // the number in front of x: a minus flipped, anything else divided by (one digit; a bigger one as its fraction)
  const x = xs ? b[xs].find((t) => t.kind === 'x') : null;
  if (x && b[xs].length === 1) {
    const a = coefOf(x);
    if (a === -1) return [{ type: 'flipPick' }, { type: 'go' }];
    if (Math.abs(a) <= 9) return [{ type: 'divPick' }, ...digitsOf(a), { type: 'go' }];
    return [{ type: 'multPick', kind: 'frac' }, { type: 'focus', target: 'num' }, { type: 'digit', digit: 1 }, { type: 'focus', target: 'den' }, ...digitsOf(a), { type: 'go' }];
  }
  return null;
}

// a step's actions, with the pop-ups that would stand in the way answered first (the first problem's intro, a hint's Got it)
function apply(reduce, s, actions, out) {
  let cur = s;
  for (const clear of [{ type: 'introNext' }, { type: 'spotDismiss' }]) {
    const c = reduce(cur, clear);
    if (c !== cur && c.board && JSON.stringify(c.board) === JSON.stringify(cur.board)) { cur = c; out.push(cur); }
  }
  for (const a of actions) {
    const n = reduce(cur, a);
    if (n !== cur) { cur = n; out.push(cur); }
  }
  return cur;
}

export function honestPath(reduce, s0, { grab = true, answer = true } = {}) {
  const out = [s0];
  let s = s0;
  for (let guard = 0; guard < 12; guard++) {
    const m = nextMove(s, { grab });
    if (!m) break;
    const before = JSON.stringify(s.board);
    s = apply(reduce, s, m, out);
    if (JSON.stringify(s.board) === before || s.needUndo) return out;          // refused, or a move that waits for Undo: stop here
  }
  if (!answer || !xAlone(s.board ?? { left: [], right: [] })) return out;
  const x = s.problem?.x;
  if (!Number.isInteger(x)) return out;
  s = apply(reduce, s, [{ type: 'focus', target: 'answer' }, ...digitsOf(x), { type: 'check' }], out);
  for (let k = 0; k < 6 && s.sub?.placing; k++) s = apply(reduce, s, [{ type: 'placeValue', index: k }], out);
  for (let k = 0; k < 12 && s.sub && s.stage !== 'done'; k++) {
    const n = reduce(s, { type: 'nextLine' });
    if (n === s) break;
    s = n;
    out.push(s);
  }
  return out;
}
