// Fluency challenges (Karl, 2026-10-03): simple problems, typed answers, as many as you can before the clock runs
// out. A wrong answer flashes the right one and pauses you, so it costs time, not points. Problems get harder the more
// you get right: every 5 correct is a step up (the tier). Pure logic and a seeded generator; the clock is passed in.
//
//   add / subtract / addsub   bigger numbers each tier, and a third number from tier 3
//   multiply-concept          tier 1 negative multipliers, tier 2 unit fractions, tier 3 other fractions; small numbers
//   multiply-large            the same ramp with multipliers up to 12 and fractions with bigger denominators
//   mixed                     all of those mixed together

import { mulberry32 } from './generate.js';
import { typeInto, isTyping } from './entry.js';
import { readInteger } from './scaffold.js';
import { MINUS } from './expr.js';

export const DURATION_MS = 60000;   // one round
export const PAUSE_MS = 2500;       // a wrong answer: the right one shows and the clock keeps running
export const PER_TIER = 5;          // correct answers per step up

export const CHALLENGES = [
  { id: 'add', title: 'Adding', blurb: 'Add integers.' },
  { id: 'subtract', title: 'Subtracting', blurb: 'Subtract integers.' },
  { id: 'addsub', title: 'Add & subtract', blurb: 'Adding and subtracting together.' },
  { id: 'multiply-concept', title: 'Multiplying', blurb: 'Groups, opposites and fractions of a group, with small numbers.' },
  { id: 'multiply-large', title: 'Big multiplying', blurb: 'The same, with multipliers up to 12 and bigger fractions.' },
  { id: 'mixed', title: 'Everything', blurb: 'Adding, subtracting and multiplying, all mixed.' },
];
export const challengeById = (id) => CHALLENGES.find((c) => c.id === id);

// Each card's last item: the challenges that go with it.
export const CARD_CHALLENGES = {
  combineit: ['add'],
  flipit: ['subtract', 'addsub'],
  lasso: ['multiply-concept', 'multiply-large'],
  'distribute-combine': ['mixed'],
};

const MAX_TIER = { add: 4, subtract: 4, addsub: 4, 'multiply-concept': 3, 'multiply-large': 3, mixed: 4 };
export const tierOf = (id, correct) => Math.min(MAX_TIER[id] ?? 3, Math.floor(correct / PER_TIER));

// ---------- Making problems ----------

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const sign = (rng) => (rng() < 0.5 ? -1 : 1);
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const inParens = (v) => (v < 0 ? `(${signed(v)})` : `${v}`);
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

// Whole numbers get bigger by tier: up to 9, 15, 25, 40, 60.
const ADD_MAX = [9, 15, 25, 40, 60];

// Terms joined by + or −: the first signed, the rest with their sign as an operation (negatives in parentheses).
function chain(rng, tier, ops) {
  const max = ADD_MAX[Math.min(tier, 4)];
  const count = tier >= 3 ? 3 : 2;
  const values = Array.from({ length: count }, () => sign(rng) * int(rng, 1, max));
  let text = signed(values[0]);
  let answer = values[0];
  for (let i = 1; i < count; i++) {
    const op = ops(i);
    text += ` ${op === '-' ? MINUS : '+'} ${inParens(values[i])}`;
    answer += op === '-' ? -values[i] : values[i];
  }
  return { text, answer };
}

// A fraction of a group: n/d(B), with B a multiple of d, the sign of the fraction and of B both random.
function fractionProblem(rng, { dens, maxB, unit }) {
  const d = pick(rng, dens);
  const numerators = unit ? [1] : Array.from({ length: d - 2 }, (_, i) => i + 2).filter((n) => gcd(n, d) === 1);
  const n = pick(rng, numerators.length ? numerators : [1]);
  const b = sign(rng) * d * int(rng, 1, Math.max(1, Math.floor(maxB / d)));
  const neg = rng() < 0.5;
  const answer = (neg ? -1 : 1) * n * (b / d);
  return { text: `${neg ? MINUS : ''}${n}/${d}(${signed(b)})`, answer };
}

function multiply(rng, tier, large) {
  // Easier kinds stay in the mix as the tier climbs, so a hard step isn't a wall.
  const level = tier > 0 && rng() < 0.3 ? int(rng, 0, tier - 1) : tier;
  const maxA = large ? 12 : 5;
  const maxB = large ? 12 : 6;
  if (level >= 2) {
    const unit = level === 2;
    return fractionProblem(rng, large
      ? { dens: [2, 3, 4, 5, 6, 8], maxB: 36, unit }
      : { dens: unit ? [2, 3, 4] : [3, 4, 5, 6], maxB: unit ? 12 : 12, unit });
  }
  // Large multipliers lean toward the 6 to 12 range.
  const a = large && rng() < 0.6 ? int(rng, 6, 12) : int(rng, 2, maxA);
  const aSigned = level >= 1 ? sign(rng) * a : a;
  const b = sign(rng) * int(rng, 2, maxB);
  return { text: `${signed(aSigned)}(${signed(b)})`, answer: aSigned * b };
}

// One problem for a challenge, given how many are right so far. `rng` is any () => [0, 1).
export function makeFluencyProblem(id, correct, rng) {
  const tier = tierOf(id, correct);
  switch (id) {
    case 'add': return chain(rng, tier, () => '+');
    case 'subtract': return chain(rng, tier, () => '-');
    case 'addsub': return chain(rng, tier, () => (rng() < 0.5 ? '-' : '+'));
    case 'multiply-concept': return multiply(rng, tier, false);
    case 'multiply-large': return multiply(rng, tier, true);
    case 'mixed': {
      const kind = pick(rng, ['add', 'subtract', 'addsub', 'multiply-concept', 'multiply-concept']);
      return makeFluencyProblem(kind, correct, rng);
    }
    default: throw new Error(`Unknown challenge: ${id}`);
  }
}

// A problem the player can't have just seen again, and never zero (nothing to type for a zero is a free answer).
function nextProblem(id, correct, seed, n, last) {
  for (let tries = 0; tries < 12; tries++) {
    const rng = mulberry32((seed + Math.imul(n + tries * 101, 0x9e3779b1)) >>> 0);
    const p = makeFluencyProblem(id, correct, rng);
    if (p.answer !== 0 && p.text !== last) return p;
  }
  return makeFluencyProblem(id, correct, mulberry32(seed + n));
}

// ---------- A round, as a reducer ----------
//
// status: 'ready' (the start screen) → 'playing' → 'ended'. Every action that depends on the clock carries `now` (ms).

export function newFluency(id, seed) {
  return {
    challenge: id, seed, status: 'ready',
    startedAt: null, endsAt: null, now: 0,
    correct: 0, wrong: 0, tier: 0, n: 0, problem: null,
    entry: '', flash: null,          // flash: { answer, until, typed } while a wrong answer's right answer shows
    topTier: 0,
  };
}

export const timeLeft = (s) => Math.max(0, (s.endsAt ?? 0) - s.now);

function end(s) {
  s.status = 'ended';
  s.entry = '';
  s.flash = null;
  return s;
}

export function reduceFluency(state, action) {
  const s = structuredClone(state);
  if (action.now !== undefined) s.now = action.now;

  if (action.type === 'start') {
    if (s.status === 'playing') return state;
    const fresh = newFluency(s.challenge, action.seed ?? s.seed);
    fresh.status = 'playing';
    fresh.startedAt = action.now;
    fresh.now = action.now;
    fresh.endsAt = action.now + DURATION_MS;
    fresh.problem = nextProblem(fresh.challenge, 0, fresh.seed, 0, null);
    return fresh;
  }
  if (s.status !== 'playing') return state;

  if (action.type === 'tick') {
    if (s.now >= s.endsAt) return end(s);
    if (s.flash && s.now >= s.flash.until) { s.flash = null; s.problem = advance(s); }
    return s;
  }
  if (s.now >= s.endsAt) return end(s);
  if (s.flash) return state;                                   // paused: the right answer is showing

  if (isTyping(action)) {
    const entry = typeInto(s.entry, action, 'integer');
    if (entry === s.entry) return state;
    s.entry = entry;
    return s;
  }
  if (action.type === 'check') {
    const typed = readInteger(s.entry);
    if (typed === null) return state;                          // nothing readable typed: nothing happens
    const right = typed === s.problem.answer;
    const typedText = s.entry;
    s.entry = '';
    if (right) {
      s.correct += 1;
      s.tier = tierOf(s.challenge, s.correct);
      s.topTier = Math.max(s.topTier, s.tier);
      s.problem = advance(s);
    } else {
      s.wrong += 1;
      s.flash = { answer: s.problem.answer, typed: typedText, until: s.now + PAUSE_MS };
    }
    return s;
  }
  return state;
}

function advance(s) {
  s.n += 1;
  return nextProblem(s.challenge, s.correct, s.seed, s.n, s.problem?.text ?? null);
}
