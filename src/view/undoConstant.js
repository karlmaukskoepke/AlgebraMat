// Undoing a number added to or subtracted from x (Karl, 2026-10-08): never "take away", always ADD THE OPPOSITE to both
// sides, so students see negatives cancel the positives (or the reverse) in pairs. `B` is the number as it sits in the
// equation (+a for x + a, −a for x − a) and `C` the other side. Shared by One-step and Two-step equations.

const signOf = (v) => (v < 0 ? '-' : '+');
const signedText = (v) => `${v < 0 ? '−' : '+'}${Math.abs(v)}`;

// `withConstant(rest)` puts the x side's items together, with `rest` (the number and what is added to cancel it) where
// the number sits. The pairs that cancel are struck: on the x side all of them; on the other side as many as it has.
export function undoConstant(B, C, withConstant) {
  const n = Math.abs(B);
  const opposite = signOf(-B);
  const pairsRight = signOf(C) === signOf(B) ? Math.min(Math.abs(C), n) : 0;
  return {
    label: `Add ${signedText(-B)} to both sides: the pairs cancel`,
    left: withConstant([
      { type: 'counters', n, sign: signOf(B), struck: n, added: false },
      { type: 'counters', n, sign: opposite, struck: n, added: true },
    ]),
    right: [
      { type: 'counters', n: Math.abs(C), sign: signOf(C), struck: pairsRight, added: false },
      { type: 'counters', n, sign: opposite, struck: pairsRight, added: true },
    ],
  };
}
