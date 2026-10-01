// Groups of Terms hints after 3 wrong tries on the same step (SPEC-GROUPS-OF-TERMS.md §6).
// Like the other packs', a hint shows the move and never makes it: the student still taps.
// Pure logic, no DOM: termGroupHintFor(state) → null | { key, params, show }.
//
// show: { button: the palette button to pulse ('addGroup', 'chooseSign:-', 'pickPiece:box:+', 'copyAll'),
//         slot: pulse the hidden-1 gap, groups: [indices to blink] }

import { HINT_AFTER } from './hints.js';
import { isFraction, isOpposite, insideText, piecesOfGroup, evaluateTermGroups } from './termGroups.js';
import { validateGroup, describeB, neededOf } from './termGroupMoves.js';
import { kindInProgress, flippable } from './termGroupSession.js';

const countOf = (pieces, q) => pieces.filter((p) => p.type === q.type && p.sign === q.sign).length;
const signOf = (n) => (n > 0 ? '+' : '-');

export function termGroupHintFor(s) {
  if (!s || ['done', 'checkit'].includes(s.step) || (s.tries[s.step] ?? 0) < HINT_AFTER) return null;
  const { problem } = s;
  const fraction = isFraction(problem);
  const need = piecesOfGroup(problem);

  switch (s.step) {
    case 'groups': {
      if (!s.wroteOne) return { key: 'hintWriteOne', show: { slot: true } };
      const n = fraction ? problem.count.d : problem.count.n;
      const have = s.groups.length;
      return {
        key: fraction ? 'hintParts' : 'hintGroups',
        params: { n, have },
        // Too many: blink the extras to erase them. Too few: pulse Add group.
        show: have > n ? { groups: s.groups.map((_, i) => i).slice(n) } : { button: 'addGroup' },
      };
    }

    case 'sign': {
      const sign = isOpposite(problem) ? '-' : '+';
      return { key: 'hintSign', params: { sign, fraction }, show: { button: `chooseSign:${sign}` } };
    }

    case 'fill': {
      const params = { text: insideText(problem), need: describeB(problem) };
      if (fraction) {
        // The kind being dealt, or the first kind not finished: pulse its button.
        const all = s.groups.flatMap((g) => g.pieces);
        const kind = kindInProgress(s) ?? ['box', 'counter'].find((t) => all.filter((p) => p.type === t).length < neededOf(problem, t));
        const piece = need.find((q) => q.type === kind) ?? need[0];
        return { key: 'hintDealTerms', params, show: { button: `pickPiece:${piece.type}:${piece.sign}` } };
      }
      const first = s.groups[0]?.pieces ?? [];
      const missing = need.find((q) => countOf(first, q) < countOf(need, q));
      const off = s.groups.map((g, i) => (validateGroup(problem, g.pieces, i).ok ? -1 : i)).filter((i) => i >= 0);
      return {
        key: 'hintFillTerms',
        params,
        show: { button: missing ? `pickPiece:${missing.type}:${missing.sign}` : 'copyAll', groups: off },
      };
    }

    case 'take':
      return { key: 'hintTake', params: { n: problem.count.n }, show: { groups: s.groups.map((_, i) => i).slice(0, problem.count.n) } };

    case 'answer': {
      const want = evaluateTermGroups(problem);
      return { key: 'hintAnswerTerms', params: { x: signOf(want.x), n: signOf(want.n) }, show: { groups: flippable(s) } };
    }

    default: // Flip has no wrong tries: a − is either tapped or not yet.
      return null;
  }
}
