// Test out (Build Z, Karl 2026-11-01): a student taps a locked level on a Solve it or Solve it Plus card and solves two of its problems
// with no help. Both right on the first check: the level and every displayed level below it become PLACED (silver; one extra problem earns
// gold, Build X) and the next level opens. A wrong value, or Give up, ends the attempt: nothing is lowered, and the student can try again at
// once with new problems. Each problem of an attempt is logged as the usual per-problem row with the attempt's word, `test-out-pass` or
// `test-out-fail`, in its supports. Pure logic, no DOM.

import { isLevelUnlocked, levelState, placeLevels } from './progress.js';
import { makeRecord } from './eventlog.js';

export const TEST_OUT_SECTIONS = ['solve', 'solve-plus'];
export const TEST_OUT_PROBLEMS = 2;
export const PASS_WORD = 'test-out-pass';
export const FAIL_WORD = 'test-out-fail';

const firstOf = (pack) => pack.firstLevel ?? 1;
const lastOf = (pack) => pack.lastLevel ?? pack.levels;

// Can this level be tried? A displayed level (never "See why it works", never a hidden one) of a Solve it or Solve it Plus card, locked
// and with nothing done on it.
export function canTestOut(progress, pack, level, sections) {
  if (!pack || pack.comingSoon || pack.retired || pack.hidden) return false;
  const sec = sections.find((s) => s.packs.includes(pack.id));
  if (!sec || !TEST_OUT_SECTIONS.includes(sec.id)) return false;
  if (level < firstOf(pack) || level > lastOf(pack) || level === pack.whyLevel) return false;
  return !isLevelUnlocked(progress, pack.id, level) && levelState(progress, pack.id, level) === 'none';
}

// Build AE (Karl, 2026-11-03): the same no-help attempt is a choice at the start of every level. An open level, displayed, of a Solve it or
// Solve it Plus card, with nothing placed or earned on it, can be started with help (the default) or tried with no help. (Count it and
// Build it never; their numeric levels are not displayed levels here either: Divide it's and Add to both sides' saved Level 1.)
export function canTryOpen(progress, pack, level, sections) {
  if (!pack || pack.comingSoon || pack.retired || pack.hidden) return false;
  const sec = sections.find((s) => s.packs.includes(pack.id));
  if (!sec || !TEST_OUT_SECTIONS.includes(sec.id)) return false;
  if (level < firstOf(pack) || level > lastOf(pack) || level === pack.whyLevel) return false;
  return isLevelUnlocked(progress, pack.id, level) && levelState(progress, pack.id, level) === 'none';
}
// Does opening this level ask first? A fresh open level (canTryOpen, and no problem started on it) asks; `choose=0` never, a fixed seed
// (every test link) never unless `choose=1` (testers: the chooser on a test link, its problems fixed by the seed).
export function chooserDue({ progress, pack, level, sections, started, choose = null, fixedSeed = null }) {
  if (choose === '0' || started || !canTryOpen(progress, pack, level, sections)) return false;
  return choose === '1' || fixedSeed === null;
}

// The problems of an attempt: fresh each attempt. A fixed seed (a test link) gives the same first attempt every time, and a different
// set for each retry.
export function testOutSeed(fixedSeed, attempt, fresh) {
  if (fixedSeed === null || fixedSeed === undefined) return fresh();
  return (fixedSeed + 7919 * attempt) >>> 0;
}
export const testOutProblems = (pack, level, seed) => pack.generate(level, seed).slice(0, TEST_OUT_PROBLEMS);

// Every card's way of pointing things out once a level, said as already pointed out (Trade places, the flip, dividing by a negative, the
// model drawn by itself, the rewrite's instruction): a test-out shows none of them.
export const ALL_TAUGHT = () => ({ trade: true, flip: true, divneg: true, model: true, rewrite: true });

// How a problem stands: 'right' (solved, the first check right), 'wrong' (a value checked and not balanced, its check written out to the
// mark), or null (still going). A wrong value counts once its substitution reaches "Not balanced", so the student sees the check.
export function checkResult(s) {
  if (!s) return null;
  if (s.stage === 'done' || s.step === 'done') return (s.wrongs ?? 0) === 0 ? 'right' : 'wrong';
  if (!(s.wrongs > 0)) return null;
  if (!s.sub) return 'wrong';
  if (s.sub.placing) return null;
  return s.sub.step >= s.sub.lines.length + 1 ? 'wrong' : null;
}

// The check's own words are kept (dropping the value onto x, plugging it in, Balanced, and Strange solutions' "Can you simplify this
// further?", which is the check saying the value is right but not simplest). Everything else the card would say goes: the line shows the
// plain prompt. No hint spot and no outlined move either.
const CHECK_WORDS = new Set(['aPlace', 'aPlugIn', 'aPlugCurrent', 'aCorrect', 'sSimplify']);
export function quiet(s) {
  if (!s || typeof s !== 'object') return s;
  const fb = s.feedback;
  const keep = fb && CHECK_WORDS.has(fb.key);
  const out = { ...s, spot: null, hint: null };
  out.feedback = keep ? { ...fb, params: { ...fb.params, ...(fb.key === 'sSimplify' ? { second: false } : {}) }, bad: false } : { key: 'aFindX', params: {}, bad: false };
  return out;
}
// The actions a test-out never passes on: help.
export const HELP_ACTIONS = new Set(['stuck', 'teach']);

// A pass: the level and every displayed level below it are placed (never lowering an earned level), so the next level opens.
export const passCredit = (progress, packId, level) => placeLevels(progress, packId, level + 1);

// After a fail: the level to try first, the highest one the student has open (a displayed level below the one tried).
export function suggestedLevel(progress, pack, level) {
  for (let l = level - 1; l >= firstOf(pack); l--) if (isLevelUnlocked(progress, pack.id, l)) return l;
  return firstOf(pack);
}

// The class-sheet rows of an attempt: each problem's usual record, with the attempt's word added to its supports.
export function attemptRecords(entries, word) {
  return entries.map(({ session, meta }) => {
    const r = makeRecord(session, meta);
    return { ...r, supports: [...r.supports.filter((w) => w !== PASS_WORD && w !== FAIL_WORD), word] };
  });
}
