// Streaks (SPEC-SCAFFOLD.md §9): a streak is problems in a row with no wrong typed answer (a "clean" answer: right
// on the first try; pressing I'm stuck doesn't break it, a wrong answer does). The best streak is kept per card and
// level, on this device. Pure logic, no DOM or storage.

export const afterAnswer = (streak, clean) => (clean ? streak + 1 : 0);

// Whatever was saved, as { pack: { level: n } } with whole numbers only.
export function readBests(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [pack, levels] of Object.entries(raw)) {
    if (!levels || typeof levels !== 'object') continue;
    for (const [level, n] of Object.entries(levels)) {
      if (Number.isInteger(n) && n > 0) (out[pack] ??= {})[level] = n;
    }
  }
  return out;
}

export const bestFor = (bests, pack, level) => bests?.[pack]?.[level] ?? 0;

// The bests with `n` counted: the same object when it doesn't beat the best.
export function withBest(bests, pack, level, n) {
  if (!Number.isInteger(n) || n <= bestFor(bests, pack, level)) return bests;
  return { ...bests, [pack]: { ...bests[pack], [level]: n } };
}
