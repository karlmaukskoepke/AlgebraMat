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
// The same Add shape with x on the right is the R twin: the same id, with `r: true`.

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
};

export const UNKNOWN = 'unknown';

const nums = (terms) => terms.filter((t) => t.kind === 'num');
const sum = (terms) => terms.reduce((a, t) => a + t.v, 0);

// The shape of a board alone (no flags): `{ id, family, r, coef, xNums, other, params }`, or `{ id: 'unknown', why }`.
//   family  'add' or 'divide'
//   r       x is on the right (an Add R twin)
//   xNums   the numbers on x's side (values); `other` the other side's numbers (values), or a fraction `{ n, inner }`
export function shapeOfBoard(board) {
  if (!board?.left || !board?.right) return { id: UNKNOWN, why: 'no board' };
  const xl = board.left.filter((t) => t.kind === 'x').length;
  const xr = board.right.filter((t) => t.kind === 'x').length;
  if (xl + xr !== 1) return { id: UNKNOWN, why: xl + xr === 0 ? 'no x' : 'x on both sides' };
  const xSide = xl ? 'left' : 'right';
  const mine = board[xSide];
  const theirs = board[xSide === 'left' ? 'right' : 'left'];
  const xt = mine.find((t) => t.kind === 'x');
  if (mine.some((t) => t.kind !== 'x' && t.kind !== 'num')) return { id: UNKNOWN, why: `a ${mine.find((t) => t.kind !== 'x' && t.kind !== 'num').kind} beside x` };
  const coef = xt.coef ?? 1;
  const family = xt.coef === undefined ? 'add' : 'divide';
  const xNums = nums(mine).map((t) => t.v);
  const r = xSide === 'right';
  const base = { family, r, coef, xNums, xSum: sum(nums(mine)) };

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
  if (family === 'divide') return { id: UNKNOWN, why: 'Divide it with x alone and no fraction' };
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

// The shape of a state: the board's, refined by the flags the board does not hold. `waiting` says a move (or a try) waits for Undo.
export function shapeOf(s) {
  if (s?.stage === 'build') return { id: 'T0', family: 'add', r: Boolean(s.problem?.mirror), params: { built: s.built } };
  const shape = shapeOfBoard(s?.board);
  if (shape.id === UNKNOWN) return shape;
  const waiting = Boolean(s.needUndo || s.undoCue || s.fail || s.zeroOther);
  if (s.fail) return { ...shape, id: 'DF', over: shape.id, waiting: true, params: { ...shape.params, n: s.fail.n } };
  if (shape.id === 'T2' && s.pending && !s.pending.both) return { ...shape, id: 'T1', waiting };
  return { ...shape, waiting };
}

// The Goals lights from two shapes (loop spec §5; inventory 3B): what a move did, read from the shape before and the shape after.
//   Add to both sides judges Fewer terms and Solved for x. Only x's side is judged: its terms are counted as if its numbers were
//   combined, so zeroing the other side never lights up green and the unsimplified side is never read. Fewer terms is green when x's
//   side has fewer terms, red when it has more or the number next to x got bigger, and grey otherwise.
//   Divide it judges Smaller numbers (the number in front of x got smaller) and One box (x alone).
export function lightsOf(prev, now) {
  if (now.family === 'divide') {
    return { smaller: now.coef < prev.coef ? 'green' : 'off', onebox: now.coef === 1 ? 'green' : 'off' };
  }
  const terms = (sh) => 1 + (sh.xSum !== 0 ? 1 : 0);
  const fewer = terms(now) < terms(prev) ? 'green'
    : terms(now) > terms(prev) || Math.abs(now.xSum) > Math.abs(prev.xSum) ? 'red' : 'neutral';
  return { fewer, solved: now.xNums.length === 0 ? 'green' : 'off' };
}
