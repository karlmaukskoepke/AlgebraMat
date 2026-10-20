// The help pieces of Add to both sides that both its registry entries (engine/solveit/rungs/add.js) and its card (./add.js) use: the
// seesaw coming in, and the help at x alone (Party or Battle at the two numbers, then Count it's counters walk, or its big-number walk past
// the counters' limit). Each takes the state and the loop's `say`. Count it's engines are used read-only, as before: their tags stay
// inside `s.alone` (never in this card's tags, the device skills or the class sheet). No DOM.

import { signed, constantOf, oppositeOf, isBattle } from '../addBoth.js';
import { alonePair, find, otherNums } from '../addBothMoves.js';
import { newCombineSession } from '../combineSession.js';
import { reduce as reduceWalk } from '../session.js';
import { makeProblem } from '../expr.js';
import { MAX_PER_ZONE } from '../moves.js';
import { newBigSession, reduceBig } from '../bigSession.js';

export const plus = (v) => (v < 0 ? signed(v) : `+${v}`);
// What every message may say about the problem itself (the number next to x, its opposite, the other side), and the card's `say`.
export const problemParams = (p) => ({ con: plus(constantOf(p)), opp: plus(oppositeOf(p)), a: p.a, other: signed(p.b), battle: isBattle(p), mirror: Boolean(p.mirror), form: p.form });
export const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...problemParams(s.problem), ...params }, bad }; return s; };
const record = (s, word) => { if (!s.supportsShown.includes(word)) s.supportsShown.push(word); };

// The seesaw comes in (and stays until the problem ends): the equation as counters, the tray, the two-action move, the combining ritual.
// At Levels 2-3, if no move has been made yet, the student builds the equation first.
export function enterScaffold(s) {
  if (s.scaffold) return s;
  s.scaffold = true;
  s.counterMode = true;
  s.sub = null;
  s.entry = '';
  s.typing = null;
  if (s.level <= 3 && s.history.length === 0) {
    s.stage = 'build';
    s.step = 'build';
    s.built = { constant: 0, other: 0, x: false };
    s.pick = null;
  }
  return s;
}

// x alone with numbers still to put together and no pair to ask about: the numbers outlined, the sum asked for in plain words. The value
// is never written.
export function sumHelp(s, say, level) {
  const nums = otherNums(s.board);
  if (nums.length < 2) return say(s, 'aStuckSolved');
  s.hint = { kind: 'sum', ids: nums.map((t) => t.id) };
  s.menu = null;
  s.typing = null;
  const same = nums.every((t) => Math.sign(t.v) === Math.sign(nums[0].v));
  return say(s, 'aStuckSum', { sum: nums.map((t) => signed(t.v)).join(' + '), many: nums.length > 2, party: same, level: Math.min(level, 3) });
}

// 1. The question floats at the two numbers: "11 − 8: party or battle?" (recorded as the reminder, `hint`).
export function aloneAsk(s, say) {
  const [a, b] = alonePair(s.board);
  s.alone = { a: a.id, b: b.id, kind: null, step: 'pb', walk: null };
  s.hint = { kind: 'sum', ids: [a.id, b.id] };
  s.menu = null;
  s.typing = null;
  record(s, 'hint');
  return say(s, 'aAlonePB', { sum: `${signed(a.v)} ${b.v < 0 ? '−' : '+'} ${Math.abs(b.v)}` });   // as the row reads: 11 − 8
}

// 2. Count it's counters walk on the two numbers, in a tray above them (Party/Battle is skipped once answered); numbers past the counters'
// limit get Count it's big-number walk instead (Build D, Part 5). Recorded as a model.
export function aloneCounters(s, say) {
  const pair = s.alone ? [s.alone.a, s.alone.b].map((id) => find(s.board, id)) : alonePair(s.board);
  if (!pair || !pair[0] || !pair[1]) return sumHelp(s, say, 3);
  const [a, b] = pair;
  if (s.alone?.walk || s.alone?.big) return say(s, s.alone.big ? 'aAloneBig' : 'aAloneCounters');
  s.hint = { kind: 'sum', ids: [a.id, b.id] };
  s.menu = null;
  s.typing = null;
  record(s, 'model');
  if (Math.abs(a.v) > MAX_PER_ZONE || Math.abs(b.v) > MAX_PER_ZONE) {
    let big = newBigSession({ mode: 'integers-big', terms: [{ kind: 'int', op: '+', value: a.v }, { kind: 'int', op: '+', value: b.v }] });
    big = { ...big, step: 'partyBattle', feedback: { key: 'bigPartyIntro' } };
    if (s.alone?.kind) big = reduceBig(big, { type: 'choose', choice: s.alone.kind });
    s.alone = { a: a.id, b: b.id, kind: s.alone?.kind ?? null, step: 'big', walk: null, big };
    return say(s, 'aAloneBig');
  }
  s.alone = { a: a.id, b: b.id, kind: s.alone?.kind ?? null, step: 'counters', walk: drawnWalk(a.v, b.v, s.alone?.kind ?? null) };
  return say(s, 'aAloneCounters');
}

// Count it's walk with the two numbers already drawn as counters (Build F, Part 3): the student answers Party or Battle (unless that was
// answered at the numbers), crosses off the pairs, counts what is left and types x. Drawn through Count it's own reducer, unchanged.
export function drawnWalk(a, b, kind = null) {
  let w = newCombineSession(makeProblem(a, '+', b));
  [a, b].forEach((v, zone) => {
    w = reduceWalk(w, { type: 'pickSign', sign: v < 0 ? '-' : '+' });
    for (let i = 0; i < Math.abs(v); i++) w = reduceWalk(w, { type: 'tapZone', zone });
  });
  w = reduceWalk(w, { type: 'check' });
  return kind ? reduceWalk(w, { type: 'choose', choice: kind }) : w;
}

// A cross-off in the walk (Build F, Part 3): a tapped counter goes with the first opposite counter in the other box; a tapped box crosses
// off every pair it can. Through Count it's own pair rule (select, then partner).
export function crossOff(w, zone, index = null) {
  if (w.step !== 'cancel') return w;
  const partner = (c) => w.zones[1 - zone].findIndex((d) => !d.canceled && d.sign !== c.sign);
  const one = (i) => {
    const c = w.zones[zone][i];
    const j = c && !c.canceled ? partner(c) : -1;
    if (j < 0) return false;
    w = reduceWalk(reduceWalk(w, { type: 'tapCounter', zone, index: i }), { type: 'tapCounter', zone: 1 - zone, index: j });
    return true;
  };
  if (index !== null) { one(index); return w; }
  for (let i = 0; i < w.zones[zone].length && w.step === 'cancel'; i++) one(i);
  return w;
}
