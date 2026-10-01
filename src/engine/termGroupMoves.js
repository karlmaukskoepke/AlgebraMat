// Move validators for the Groups of Terms pack (SPEC-GROUPS-OF-TERMS.md §3). Each returns
// { ok, feedbackKey, params? }; the wording lives in view/termGroupFeedback.js.
// The group-making and + or − checks are Group It's: a term-group problem has the same
// `count` and `hidden1` as a Group It problem. Pure logic, no DOM.

import { validateGroups, validateHiddenOne, validateGroupSign, MAX_GROUPS_MADE, MAX_PARTS } from './lassoMoves.js';
import { isOpposite, insideText, piecesOfGroup } from './termGroups.js';
import { piecePhrase } from './termMoves.js';

export { validateGroups, validateHiddenOne, validateGroupSign, MAX_GROUPS_MADE, MAX_PARTS };

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

// Pieces one group can take beyond what B needs, so "too many" can happen.
export const SPARE = 2;

// B in words: "2 boxes and 1 negative", "4 boxes and 6 positives".
export const describeB = (problem) =>
  problem.inside.map((t) => piecePhrase({ kind: t.kind, op: '+', value: t.value })).join(' and ');

// How many pieces of one kind (box or counter) the whole of B needs.
export const neededOf = (problem, type) => piecesOfGroup(problem).filter((q) => q.type === type).length;

// One group (or a whole oval) can hold what B needs plus a little more.
export const maxInGroup = (problem) => piecesOfGroup(problem).length + SPARE;

const tally = (pieces) => {
  const out = {};
  for (const q of pieces) out[`${q.type}${q.sign}`] = (out[`${q.type}${q.sign}`] ?? 0) + 1;
  return out;
};
const sameTally = (a, b) => {
  const [ta, tb] = [tally(a), tally(b)];
  const keys = new Set([...Object.keys(ta), ...Object.keys(tb)]);
  return [...keys].every((k) => (ta[k] ?? 0) === (tb[k] ?? 0));
};

// ③ Fill, one group: it must hold exactly one group of B, in any order. `index` names it.
export function validateGroup(problem, pieces, index = 0) {
  const params = { index, text: insideText(problem), need: describeB(problem) };
  if (pieces.length === 0) return fail('emptyGroup', params);
  if (!sameTally(pieces, piecesOfGroup(problem))) return fail('groupOff', params);
  return pass('groupOk');
}

// ③ Fill, every group.
export function validateFill(problem, groups) {
  for (let i = 0; i < groups.length; i++) {
    const res = validateGroup(problem, groups[i].pieces, i);
    if (!res.ok) return res;
  }
  return pass(isOpposite(problem) ? 'fillDoneOpp' : 'fillDone');
}

// ③ Fill, fraction bar: all of B dealt out into equal parts.
export function validateDeal(problem, groups) {
  const params = { text: insideText(problem), need: describeB(problem) };
  const all = groups.flatMap((g) => g.pieces);
  if (all.length === 0 || !sameTally(all, piecesOfGroup(problem))) return fail('dealOff', params);
  const part = piecesOfGroup(problem, true);
  if (!groups.every((g) => sameTally(g.pieces, part))) return fail('dealUneven', params);
  return pass('dealDone', { n: problem.count.n });
}
