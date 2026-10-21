// The shape of an equation state (docs/scaffolds/SCAFFOLD-INVENTORY.md Part 2; docs/architecture/SOLVE-IT-ONE-SYSTEM.md layer 2,
// phase P2): what the student is looking at, read from the board and a few flags, never from the original problem. Help is keyed to
// the shape (the scaffold registry, ./registry.js), and so are the Goals lights (lightsOf). Order-free and sign-normalised: `x + −2`,
// `x − 2` and `−2 + x` are the same shape. Pure: no DOM, no card code.
//
// Add to both sides
//   S1  x + c = b             the original, or any combined state that is not solved
//   S2  x = b + k             x alone, two numbers on the other side (party: same signs; battle: opposite signs)
//   S3  x + c′ = b + k        a move that did not finish (partly cancelled, or bigger): waits for Undo
//   S4  x + c′ = 0            the side without x zeroed: waits for Undo
//   S5  x = b + k₁ + k₂ …     moves stacked, the last one finishing
//   S6  x + c′ = b + k₁ + k₂  moves stacked, not finished
//   S7  x = v                 solved on the board (only after the student's own combining)
//   T0                        the seesaw being built (scaffold, Levels 2 and 3)
//   T1  x + c + k = b         the seesaw's two-action move, one side done
//   T2  x + c + k = b + k     both sides done, before the pairs combine
// Divide it
//   D1  ax = b                a = 2 to 6
//   D2  x = ⅟a(b)             the finishing move (the right side is never evaluated)
//   DF  ⅟n(ax) = ⅟n(b) ✗      a fraction that does not split (the board is D1 until Undo)
// Flip everything (Build J; read from the board with the card's family, since `3x = −12` there is not Divide it's D1: no counters yet)
//   F1  −x = b                x has a minus
//   F2  −ax = b               a = 2 to 6, x has a minus
//   F3  ax = b                a = 2 to 6, after a flip that did not finish (or the flip that made it worse, undone)
//   F4  x = −(b)              the finishing flip (the other side is the opposite of a number, never evaluated)
//   F5  x = ⅟a(b), x = −⅟a(b) the finishing fraction (one move of −⅟a, or ⅟a after the flip)
//   FF  a fraction that does not split (the board is F2 or F3 until Undo)
// The same Add shape with x on the right is the R twin: the same id, with `r: true` (and so on every Flip shape: `12 = −x` is F1, r).

export const SHAPES = {
  S1: 'x + c = b',
  S2: 'x = b + k',
  S3: 'x + c′ = b + k (partly done or bigger)',
  S4: 'x + c′ = 0 (the other side zeroed)',
  S5: 'x = b + k₁ + k₂ … (stacked, finished)',
  S6: 'x + c′ = b + k₁ + k₂ … (stacked)',
  S7: 'x = v',
  T0: 'the seesaw being built',
  T1: 'x + c + k = b (one side added)',
  T2: 'x + c + k = b + k (both sides added)',
  D1: 'ax = b',
  D2: 'x = ⅟a(b)',
  DF: 'a fraction that does not split',
  F1: '−x = b',
  F2: '−ax = b',
  F3: 'ax = b (after a flip)',
  F4: 'x = −(b)',
  F5: 'x = ⅟a(b) or −⅟a(b)',
  FF: 'a fraction that does not split (Flip everything)',
};

export const UNKNOWN = 'unknown';

const nums = (terms) => terms.filter((t) => t.kind === 'num');
const sum = (terms) => terms.reduce((a, t) => a + t.v, 0);

// The shape of a board alone (no flags): `{ id, family, r, coef, xNums, other, params }`, or `{ id: 'unknown', why }`.
//   family  'add', 'divide' or 'flip' (Flip everything's boards are read with the card's family: shapeOfBoard(board, 'flip'))
//   r       x is on the right (an Add R twin)
//   xNums   the numbers on x's side (values); `other` the other side's numbers (values), or a fraction `{ n, inner }`
export function shapeOfBoard(board, family = null) {
  if (!board?.left || !board?.right) return { id: UNKNOWN, why: 'no board' };
  if (family === 'flip') return flipShape(board);
  const xl = board.left.filter((t) => t.kind === 'x').length;
  const xr = board.right.filter((t) => t.kind === 'x').length;
  if (xl + xr !== 1) return { id: UNKNOWN, why: xl + xr === 0 ? 'no x' : 'x on both sides' };
  const xSide = xl ? 'left' : 'right';
  const mine = board[xSide];
  const theirs = board[xSide === 'left' ? 'right' : 'left'];
  const xt = mine.find((t) => t.kind === 'x');
  if (mine.some((t) => t.kind !== 'x' && t.kind !== 'num')) return { id: UNKNOWN, why: `a ${mine.find((t) => t.kind !== 'x' && t.kind !== 'num').kind} beside x` };
  const coef = xt.coef ?? 1;
  const kind = xt.coef === undefined ? 'add' : 'divide';
  const xNums = nums(mine).map((t) => t.v);
  const r = xSide === 'right';
  const base = { family: kind, r, coef, xNums, xSum: sum(nums(mine)) };

  // Divide it's right side after the finishing move: one fraction of a number
  if (theirs.length === 1 && theirs[0].kind === 'frac') {
    if (coef !== 1 || xNums.length) return { id: UNKNOWN, why: 'a fraction with x not alone' };
    const inner = theirs[0].inner?.[0];
    return { ...base, id: 'D2', other: { n: theirs[0].n, inner: inner?.v }, params: { n: theirs[0].n, b: inner?.v } };
  }
  if (theirs.some((t) => t.kind !== 'num')) return { id: UNKNOWN, why: `a ${theirs.find((t) => t.kind !== 'num').kind} on the other side` };
  const other = nums(theirs).map((t) => t.v);
  if (!other.length) return { id: UNKNOWN, why: 'an empty side' };
  const shaped = (id, params) => ({ ...base, id, other, params });

  if (coef !== 1) {
    if (xNums.length || other.length !== 1) return { id: UNKNOWN, why: 'a coefficient with more terms' };
    return shaped('D1', { a: coef, b: other[0] });
  }
  if (kind === 'divide') return { id: UNKNOWN, why: 'Divide it with x alone and no fraction' };
  if (xNums.length >= 2) return shaped('T2', { c: xNums[0], k: xNums.slice(1), b: other });   // the seesaw's half-made move (T1 by its flag)
  if (xNums.length === 1) {
    const c = xNums[0];
    if (other.length === 1) return other[0] === 0 ? shaped('S4', { c }) : shaped('S1', { c, b: other[0] });
    if (other.length === 2) return shaped('S3', { c, b: other[0], k: other[1] });
    return shaped('S6', { c, b: other[0], k: other.slice(1) });
  }
  if (other.length === 1) return shaped('S7', { v: other[0] });
  if (other.length === 2) {
    const [b, k] = other;
    return shaped('S2', { b, k, kind: Math.sign(b) === Math.sign(k) ? 'party' : 'battle' });
  }
  return shaped('S5', { b: other[0], k: other.slice(1) });
}

// Flip everything's shapes: one x term with its number in front (either side), and one thing on the other side: a number, the opposite
// of a number (`−(12)`), or a fraction of a number (`⅓(−12)`, `−⅓(12)`). Sign-normalised by the coefficient's sign and size.
function flipShape(board) {
  const xl = board.left.filter((t) => t.kind === 'x').length;
  const xr = board.right.filter((t) => t.kind === 'x').length;
  if (xl + xr !== 1) return { id: UNKNOWN, why: xl + xr === 0 ? 'no x' : 'x on both sides' };
  const r = xr === 1;
  const mine = board[r ? 'right' : 'left'];
  const theirs = board[r ? 'left' : 'right'];
  if (mine.length !== 1) return { id: UNKNOWN, why: 'a number beside x' };
  if (theirs.length !== 1) return { id: UNKNOWN, why: theirs.length ? 'more than one term on the other side' : 'an empty side' };
  const coef = mine[0].coef ?? 1;
  const t = theirs[0];
  const base = { family: 'flip', r, coef, xNums: [], xSum: 0 };
  if (t.kind === 'num') {
    if (coef === -1) return { ...base, id: 'F1', other: [t.v], params: { b: t.v } };
    if (coef < -1) return { ...base, id: 'F2', other: [t.v], params: { a: -coef, b: t.v } };
    if (coef > 1) return { ...base, id: 'F3', other: [t.v], params: { a: coef, b: t.v } };
    return { id: UNKNOWN, why: 'x alone with a plain number (never made on Flip everything)' };
  }
  if (coef !== 1) return { id: UNKNOWN, why: `a ${t.kind} with x not alone` };
  const b = t.inner?.[0]?.v;
  if (t.kind === 'neg') return { ...base, id: 'F4', other: { neg: b }, params: { b } };
  if (t.kind === 'frac') return { ...base, id: 'F5', other: { n: t.n, inner: b }, params: { n: t.n, sign: t.sign ?? 1, b } };
  return { id: UNKNOWN, why: `a ${t.kind} on the other side` };
}

// The shape of a state: the board's, refined by the flags the board does not hold. `waiting` says a move (or a try) waits for Undo.
export function shapeOf(s) {
  if (s?.stage === 'build') return { id: 'T0', family: 'add', r: Boolean(s.problem?.mirror), params: { built: s.built } };
  const shape = shapeOfBoard(s?.board, s?.problem?.kind === 'flip' ? 'flip' : null);
  if (shape.id === UNKNOWN) return shape;
  const waiting = Boolean(s.needUndo || s.fail || s.zeroOther);
  if (s.fail) return { ...shape, id: shape.family === 'flip' ? 'FF' : 'DF', over: shape.id, waiting: true, params: { ...shape.params, n: s.fail.n } };
  if (shape.id === 'T2' && s.pending && !s.pending.both) return { ...shape, id: 'T1', waiting };
  return { ...shape, waiting };
}

// The Goals lights from two shapes (loop spec §5; inventory 3B): what a move did, read from the shape before and the shape after.
//   Add to both sides judges Fewer terms and Solved for x. Only x's side is judged: its terms are counted as if its numbers were
//   combined, so zeroing the other side never lights up green and the unsimplified side is never read. Fewer terms is green when x's
//   side has fewer terms, red when it has more or the number next to x got bigger, and grey otherwise.
//   Divide it judges Smaller numbers (the number in front of x got smaller) and One box (x alone).
//   Flip everything judges No opposite box (green when the move took the minus off x, red when it put one on, grey otherwise) and Solved
//   for x (x alone with a plain 1 in front).
export function lightsOf(prev, now) {
  if (now.family === 'flip') {
    return { noopp: prev.coef < 0 && now.coef > 0 ? 'green' : prev.coef > 0 && now.coef < 0 ? 'red' : 'neutral', solved: now.coef === 1 ? 'green' : 'off' };
  }
  if (now.family === 'divide') {
    // (by size, so −3x to −x is smaller too; Build J. The same as before for positive coefficients)
    return { smaller: Math.abs(now.coef) < Math.abs(prev.coef) ? 'green' : 'off', onebox: now.coef === 1 ? 'green' : 'off' };
  }
  const terms = (sh) => 1 + (sh.xSum !== 0 ? 1 : 0);
  const fewer = terms(now) < terms(prev) ? 'green'
    : terms(now) > terms(prev) || Math.abs(now.xSum) > Math.abs(prev.xSum) ? 'red' : 'neutral';
  return { fewer, solved: now.xNums.length === 0 ? 'green' : 'off' };
}
