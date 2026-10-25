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
// Two-step equations (Build K; read with the card's family: shapeOfBoard(board, 'two')). x has a number in front of it and a number beside it;
// where a state is one another card already has, it is that card's shape, with its entries (`3x = 15` is Divide it's D1, `−3x = 15` is
// F2, `x = ⅓(15)` is F5)
//   W1  ax + c = b            the original, or any state with a number still beside x and one number on the other side (a ≠ ±1, either
//                             sign: `4 − 3x = 19` is −3x + 4)
//   W2  ax = b + k …          the number beside x cancelled, the other side not combined yet (after Add)
//   W3  ax + c′ = b + k …     an Add that did not cancel (partly, or bigger): waits for Undo
//   W4  ax + c′ = 0           the side without x zeroed: waits for Undo
//   D1  ax = b, F1 −x = b, F2 −ax = b, F4 x = −(b), F5 x = ⅟a(b) or −⅟a(b): as on Divide it and Flip everything
//   DF  a fraction that does not split (the board is D1, F1 or F2 until Undo)
// Distribute, combine, solve (Build M; read with the card's family: shapeOfBoard(board, 'dist')). x may sit in a factor times a
// parenthesis (a group, `3(x + 2)`); the distributed rows have several terms, x-terms and numbers not yet put together. Order-free and
// sign-normalised. Where a state is one Two-step already has, it is Two-step's shape, with its entries (`3x + 6 = 15` is W1, `3x = 15 − 6`
// W2, `3x = 9` D1, `−2x = 14` F2, `x = ⅓(9)` F5)
//   P1  a(x + c) = b          a group alone on its side, a positive factor
//   P2  −a(x + c) = b         a group alone, a negative factor
//   P3  n + a(x + c) = b      numbers beside the group, a positive factor
//   P4  n − a(x + c) = b      numbers beside the group, a negative factor (shown subtracted until its minus is tapped)
//   P5  a(x + c) + bx = d     an x-term beside the group (Level 5)
//   P6  a(x + c) = b + k      the other side not combined yet (after an Add that cancelled n)
//   E1  n + ax + k = b        the distributed row: one x-term, two or more numbers beside it, not yet put together
//   E2  ax + bx + k = d       two or more x-terms not yet put together
//   E4  ax + k = b + m        one x-term and one number, the other side not combined yet (an Add that cancelled one number of E1)
//   Q1  x + c = ⅟a(b)         after dividing first: the parenthesis's terms, the other side a fraction (or −(b), after a flip)
//   Q2  x = ⅟a(b) + k         Q1 after the Add that cancels c: x is alone, the other side is left as it is
//   Q3  x + c′ = ⅟a(b) + k    an Add at Q1 that did not cancel: waits for Undo
//   Q4  x + c = b             Q1 with its product worked out (Build P, Part 2: `x + 2 = ⅓(15)` → `x + 2 = 5`)
//   Q5  x = b + k             Q4 after the Add that cancels c: x is alone, the other side not combined (the student types x)
// Variables on both sides (Build R; read with the card's family: shapeOfBoard(board, 'both')). x-terms on both sides are its own shapes;
// once x is on one side the board is read as Distribute's (E2 `ax + bx + k = d`, then Two-step's W1, W2, D1, F2…; mirrored as r).
//   V1  ax + b = cx + d       x-terms on both sides (any numbers, either order), no parenthesis
//   VP  a(x + b) = cx + d     x on both sides with a parenthesis on either side (or both): distribute first

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
  W1: 'ax + c = b',
  W2: 'ax = b + k (the other side not combined yet)',
  W3: 'ax + c′ = b + k (partly done or bigger)',
  W4: 'ax + c′ = 0 (the other side zeroed)',
  P1: 'a(x + c) = b',
  P2: '−a(x + c) = b',
  P3: 'n + a(x + c) = b',
  P4: 'n − a(x + c) = b',
  P5: 'a(x + c) + bx = d',
  P6: 'a(x + c) = b + k (the other side not combined yet)',
  E1: 'n + ax + k = b (the numbers not yet put together)',
  E2: 'ax + bx + k = d (the x-terms not yet put together)',
  E4: 'ax + k = b + m (the other side not combined yet)',
  Q1: 'x + c = ⅟a(b) (after dividing first)',
  Q2: 'x = ⅟a(b) + k',
  Q3: 'x + c′ = ⅟a(b) + k (an Add that did not cancel)',
  Q4: 'x + c = b (after the product was worked out)',
  Q5: 'x = b + k (after Q4\'s Add)',
  V1: 'ax + b = cx + d (x on both sides)',
  VP: 'a(x + b) = cx + d (x on both sides, a parenthesis)',
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
  if (family === 'two') return twoShape(board);
  if (family === 'dist') return distShape(board);
  if (family === 'both') return bothShape(board);
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

// Two-step equations' shapes: one x term with its number in front (either side, either place on its side) and numbers beside it; the
// other side numbers, or, once x is alone, the opposite of a number or a fraction of a number. Order-free and sign-normalised.
function twoShape(board) {
  const xl = board.left.filter((t) => t.kind === 'x').length;
  const xr = board.right.filter((t) => t.kind === 'x').length;
  if (xl + xr !== 1) return { id: UNKNOWN, why: xl + xr === 0 ? 'no x' : 'x on both sides' };
  const r = xr === 1;
  const mine = board[r ? 'right' : 'left'];
  const theirs = board[r ? 'left' : 'right'];
  if (mine.some((t) => t.kind !== 'x' && t.kind !== 'num')) return { id: UNKNOWN, why: `a ${mine.find((t) => t.kind !== 'x' && t.kind !== 'num').kind} beside x` };
  if (!theirs.length) return { id: UNKNOWN, why: 'an empty side' };
  const coef = mine.find((t) => t.kind === 'x').coef ?? 1;
  const xNums = nums(mine).map((t) => t.v);
  const base = { family: 'two', r, coef, xNums, xSum: sum(nums(mine)) };
  // x alone after the finishing move: the other side is never evaluated
  if (theirs.length === 1 && (theirs[0].kind === 'neg' || theirs[0].kind === 'frac')) {
    if (coef !== 1 || xNums.length) return { id: UNKNOWN, why: `a ${theirs[0].kind} with x not alone` };
    const t = theirs[0];
    const b = t.inner?.[0]?.v;
    if (t.kind === 'neg') return { ...base, id: 'F4', other: { neg: b }, params: { b } };
    return { ...base, id: 'F5', other: { n: t.n, inner: b }, params: { n: t.n, sign: t.sign ?? 1, b } };
  }
  if (theirs.some((t) => t.kind !== 'num')) return { id: UNKNOWN, why: `a ${theirs.find((t) => t.kind !== 'num').kind} on the other side` };
  const other = nums(theirs).map((t) => t.v);
  const shaped = (id, params) => ({ ...base, id, other, params });
  if (xNums.length) {
    if (coef === 1 || coef === -1) return { id: UNKNOWN, why: 'a number beside a single x (never made on Two-step)' };
    if (other.length === 1) return other[0] === 0 ? shaped('W4', { a: coef, c: base.xSum }) : shaped('W1', { a: coef, c: base.xSum, b: other[0] });
    return shaped('W3', { a: coef, c: base.xSum, b: other[0], k: other.slice(1) });
  }
  if (other.length >= 2) return shaped('W2', { a: coef, b: other[0], k: other.slice(1) });
  if (coef === 1) return { id: UNKNOWN, why: 'x = a number (the app never writes the value)' };
  if (coef === -1) return shaped('F1', { b: other[0] });
  if (coef < -1) return shaped('F2', { a: -coef, b: other[0] });
  return shaped('D1', { a: coef, b: other[0] });
}

// Distribute, combine, solve's shapes (Build M): a group or several x-terms first; everything else is read as Two-step reads it.
const hasX = (t) => t.kind === 'x' || t.kind === 'group';
function distShape(board) {
  const xl = board.left.filter(hasX).length;
  const xr = board.right.filter(hasX).length;
  if (xl && xr) return { id: UNKNOWN, why: 'x on both sides' };
  if (!xl && !xr) return { id: UNKNOWN, why: 'no x' };
  const r = xr > 0;
  const mine = board[r ? 'right' : 'left'];
  const theirs = board[r ? 'left' : 'right'];
  if (!theirs.length) return { id: UNKNOWN, why: 'an empty side' };
  if (mine.some((t) => !hasX(t) && t.kind !== 'num')) return { id: UNKNOWN, why: `a ${mine.find((t) => !hasX(t) && t.kind !== 'num').kind} beside x` };
  const groups = mine.filter((t) => t.kind === 'group');
  const xs = mine.filter((t) => t.kind === 'x');
  const xNums = nums(mine).map((t) => t.v);
  const odd = theirs.find((t) => t.kind !== 'num');
  const other = nums(theirs).map((t) => t.v);
  const base = { family: 'dist', r, xNums, xSum: sum(nums(mine)), group: groups.length > 0, xPart: mine.filter(hasX).map((t) => (t.kind === 'group' ? `g${t.factor}` : `x${t.coef ?? 1}`)).join(',') };
  const shaped = (id, params, extra = {}) => ({ ...base, ...extra, id, other, params });
  if (groups.length) {
    if (groups.length > 1) return { id: UNKNOWN, why: 'two parentheses' };
    if (odd) return { id: UNKNOWN, why: `a ${odd.kind} on the other side of a parenthesis` };
    const g = groups[0];
    const coef = g.factor;
    const p = { a: coef, c: g.inner.find((t) => t.kind === 'num')?.v ?? 0, b: other[0], n: base.xSum, factorId: g.id };
    if (other.length >= 2) return shaped('P6', { ...p, k: other.slice(1) }, { coef });
    if (xs.length) return shaped('P5', { ...p, bx: xs.map((t) => t.coef ?? 1) }, { coef });
    if (xNums.length) return shaped(coef > 0 ? 'P3' : 'P4', p, { coef });
    return shaped(coef > 0 ? 'P1' : 'P2', p, { coef });
  }
  if (xs.length >= 2) return shaped('E2', { xs: xs.map((t) => t.coef ?? 1), ids: xs.slice(0, 2).map((t) => t.id) }, { coef: xs.reduce((a, t) => a + (t.coef ?? 1), 0) });
  const coef = xs[0].coef ?? 1;
  // after dividing first (or flipping first): the parenthesis's own terms, the other side a fraction or the opposite of a number
  if (odd) {
    if (odd.kind !== 'frac' && odd.kind !== 'neg') return { id: UNKNOWN, why: `a ${odd.kind} on the other side` };
    if (coef !== 1) return { id: UNKNOWN, why: `a ${odd.kind} with a number in front of x` };
    const q = { n: odd.n, sign: odd.sign ?? 1, neg: odd.kind === 'neg', b: odd.inner?.[0]?.v, k: other };
    if (!xNums.length && !other.length) return twoShape(board);                               // x = ⅓(15): F5, x = −(5): F4
    if (!xNums.length) return shaped('Q2', q, { coef });
    return shaped(other.length ? 'Q3' : 'Q1', { ...q, c: base.xSum }, { coef });
  }
  if (xNums.length >= 2) return shaped('E1', { a: coef, nums: xNums, ids: nums(mine).slice(0, 2).map((t) => t.id), b: other }, { coef });
  if (xNums.length === 1 && other.length >= 2) return shaped('E4', { a: coef, c: xNums[0], b: other[0], k: other.slice(1) }, { coef });
  // a plain x after a product was worked out on the divide-first route (Build P, Part 2): `x + 2 = 5`, then `x = 5 − 2`
  if (coef === 1 && xNums.length === 1 && other.length === 1) return shaped('Q4', { c: xNums[0], b: other[0] }, { coef });
  if (coef === 1 && !xNums.length && other.length >= 2) return shaped('Q5', { b: other[0], k: other.slice(1) }, { coef });
  const two = twoShape(board);
  return two.id === UNKNOWN ? two : { ...two, family: 'dist', group: false, xPart: base.xPart };
}

// Variables on both sides (Build R): x on both sides is its own shape; x on one side is read as Distribute's boards are. `small` is the
// x-term to move first in the reminder: the one with the smaller number in front (so the x-term left keeps a plus), its side `from`.
function bothShape(board) {
  const xl = board.left.filter(hasX);
  const xr = board.right.filter(hasX);
  if (!xl.length || !xr.length) return distShape(board);
  if ([...board.left, ...board.right].some((t) => !hasX(t) && t.kind !== 'num')) return { id: UNKNOWN, why: 'a fraction with x on both sides' };
  const coef = (t) => (t.kind === 'group' ? t.factor : t.coef ?? 1);
  const base = { family: 'both', r: false, xNums: nums(board.left).map((t) => t.v), xSum: sum(nums(board.left)), other: nums(board.right).map((t) => t.v) };
  if ([...xl, ...xr].some((t) => t.kind === 'group')) {
    const g = [...xl, ...xr].find((t) => t.kind === 'group');
    return { ...base, id: 'VP', group: true, params: { factorId: g.id, a: g.factor } };
  }
  const xs = [...xl.map((t) => ({ t, side: 'left' })), ...xr.map((t) => ({ t, side: 'right' }))];
  // (Build Q, Part 6, Karl's rule: where one side is a lone x-term, the x-term to move is the other side's, the one beside the number, so
  // the number ends alone on its side: `2x = 3x + 6`, move the 3x. A negative number in front afterwards is fine: Flip handles it.)
  const lone = ['left', 'right'].find((k) => board[k].length === 1 && hasX(board[k][0]));
  const small = lone ? xs.find((q) => q.side !== lone)
    : xs.reduce((m, q) => (Math.abs(coef(q.t)) < Math.abs(coef(m.t)) || (Math.abs(coef(q.t)) === Math.abs(coef(m.t)) && q.side === 'right' && m.side === 'left') ? q : m));
  return { ...base, id: 'V1', group: false, params: { xl: xl.map(coef), xr: xr.map(coef), small: small.t.id, from: small.side, c: coef(small.t) } };
}

// (the cards whose boards are read with their own family)
const FAMILY_OF = { flip: 'flip', 'two-step': 'two', 'distribute-solve': 'dist', 'variables-both-sides': 'both' };

// The shape of a state: the board's, refined by the flags the board does not hold. `waiting` says a move (or a try) waits for Undo.
export function shapeOf(s) {
  if (s?.stage === 'build') return { id: 'T0', family: 'add', r: Boolean(s.problem?.mirror), params: { built: s.built } };
  const shape = shapeOfBoard(s?.board, FAMILY_OF[s?.problem?.kind] ?? null);
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
//   Two-step equations judges Fewer terms (as Add to both sides: x's side only) and Solved for x (x alone with a plain 1 in front).
//   Flip everything judges No opposite box (green when the move took the minus off x, red when it put one on, grey otherwise) and Solved
//   for x (x alone with a plain 1 in front).
//   Distribute, combine, solve judges Fewer terms, No parentheses and Solved for x. Fewer terms is judged only when the x part of x's side
//   (its x-terms and parenthesis) is unchanged, so only on an Add: its numbers are counted one by one (several are not put together for
//   the student), and a size that grew counts as worse; after a distribute, a fraction or a flip it is off. No parentheses is green once
//   no parenthesis is left.
export function lightsOf(prev, now) {
  if (now.family === 'dist') {
    const fewer = prev.xPart !== now.xPart ? 'off' : now.xNums.length < prev.xNums.length ? 'green'
      : now.xNums.length > prev.xNums.length || Math.abs(now.xSum) > Math.abs(prev.xSum) ? 'red' : prev.xNums.length === 0 ? 'off' : 'neutral';
    return { fewer, noparen: now.group ? 'off' : 'green', solved: now.coef === 1 && now.xNums.length === 0 && !now.group && now.xPart === 'x1' ? 'green' : 'off' };
  }
  if (now.family === 'flip') {
    return { noopp: prev.coef < 0 && now.coef > 0 ? 'green' : prev.coef > 0 && now.coef < 0 ? 'red' : 'neutral', solved: now.coef === 1 ? 'green' : 'off' };
  }
  if (now.family === 'two') {
    const count = (sh) => 1 + (sh.xSum !== 0 ? 1 : 0);
    // (a fraction or a flip of `3x = 15` is not about the number beside x: Fewer terms is not judged there, so it goes back to off)
    const none = prev.xSum === 0 && now.xSum === 0 && (prev.other?.length ?? 1) === 1;
    const fewer = none ? 'off' : count(now) < count(prev) ? 'green' : count(now) > count(prev) || Math.abs(now.xSum) > Math.abs(prev.xSum) ? 'red' : 'neutral';
    return { fewer, solved: now.coef === 1 && now.xNums.length === 0 ? 'green' : 'off' };
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
