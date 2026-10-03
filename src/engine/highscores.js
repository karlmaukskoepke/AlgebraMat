// High scores for the fluency challenges (Karl, 2026-10-03): the best runs this month, this school year (September 1
// to September 1) and all time. For now they're this device's own runs; a shared list comes later. Pure logic.

export const PERIODS = [
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This school year' },
  { id: 'all', label: 'All time' },
];

export const RUN_CAP = 300;

// When a period began, in ms (local time): the first of this month, or the September 1 that began this school year.
export function periodStart(period, now) {
  const d = new Date(now);
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (period === 'year') return new Date(d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1, 8, 1).getTime();
  return 0;
}

// What was saved, as a clean list of { c, s, t, tier }.
export function readRuns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r) => r && typeof r.c === 'string' && Number.isInteger(r.s) && r.s >= 0 && Number.isFinite(r.t))
    .map((r) => ({ c: r.c, s: r.s, t: r.t, tier: Number.isInteger(r.tier) ? r.tier : 0 }));
}

export function addRun(runs, run, cap = RUN_CAP) {
  const next = [...readRuns(runs), run];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

// The best runs of a challenge in a period: highest score first, newer first on a tie.
export function topRuns(runs, challenge, period, now, n = 5) {
  const start = periodStart(period, now);
  return readRuns(runs).filter((r) => r.c === challenge && r.t >= start && r.t <= now + 1000)
    .sort((a, b) => b.s - a.s || b.t - a.t).slice(0, n);
}

export const bestScore = (runs, challenge, period, now) => topRuns(runs, challenge, period, now, 1)[0]?.s ?? 0;
