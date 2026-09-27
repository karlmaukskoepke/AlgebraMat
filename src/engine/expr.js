// Expression model: two signed terms joined by + or −.
// Pure logic, no DOM. `kind` leaves room for variable terms ('x') later.

export const MINUS = '−'; // typographic minus, as printed in the notes

export function int(value) {
  return { kind: 'int', value };
}

export function makeProblem(a, op, b) {
  if (op !== '+' && op !== '-') throw new Error(`Unknown op: ${op}`);
  return { left: int(a), op, right: int(b) };
}

export function isSubtraction(p) {
  return p.op === '-';
}

// Adding the opposite: a − b  →  a + (−b). Addition is left as is.
export function rewrite(p) {
  if (!isSubtraction(p)) return p;
  return { left: p.left, op: '+', right: int(-p.right.value) };
}

export function evaluate(p) {
  const { left, op, right } = p;
  return op === '+' ? left.value + right.value : left.value - right.value;
}

// Decided on the rewritten (addition) form: same signs → party, different → battle.
export function partyOrBattle(p) {
  const r = rewrite(p);
  return Math.sign(r.left.value) === Math.sign(r.right.value) ? 'party' : 'battle';
}

function signed(n, explicitPlus) {
  if (n < 0) return `${MINUS}${-n}`;
  return explicitPlus ? `+${n}` : `${n}`;
}

// "5 − (−3)", "2 − 6"; with explicitPlus: "5 + (+3)", "2 + (−6)".
export function formatProblem(p, { explicitPlus = false } = {}) {
  const left = signed(p.left.value, false);
  const r = p.right.value;
  const right = r < 0 || explicitPlus ? `(${signed(r, explicitPlus)})` : `${r}`;
  const op = p.op === '+' ? '+' : MINUS;
  return `${left} ${op} ${right}`;
}
