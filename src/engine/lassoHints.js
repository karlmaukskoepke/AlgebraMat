// Group It hints after 3 wrong tries on the same step (SPEC §5, SPEC-LASSO.md §10).
// Like Flip It's, a hint shows the move and never makes it: the student still taps.
// Pure logic, no DOM: lassoHintFor(state) → null | { key, params, show }.
//
// show: { button: action name to pulse ('addGroup', 'chooseSign:+', 'pickSign:-', …),
//         slot: pulse the hidden-1 gap, groups: [indices to blink] }

import { HINT_AFTER } from './hints.js';
import { lassoCount, isFraction, isOpposite, evaluateGroups } from './groups.js';

const signOf = (v) => (v > 0 ? '+' : '-');

export function lassoHintFor(s) {
  if (!s || s.step === 'done' || (s.tries[s.step] ?? 0) < HINT_AFTER) return null;
  const { problem } = s;
  const fraction = isFraction(problem);
  const b = problem.inside.value;

  switch (s.step) {
    case 'groups': {
      if (!s.wroteOne) return { key: 'hintWriteOne', show: { slot: true } };
      const n = fraction ? problem.count.d : lassoCount(problem);
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
      const sign = signOf(b);
      const count = Math.abs(b);
      if (fraction) return { key: 'hintDeal', params: { b, count, sign }, show: { button: `pickSign:${sign}` } };
      const off = s.groups.map((g, i) => (g.terms.length === count && g.terms.every((t) => t.sign === sign) ? -1 : i))
        .filter((i) => i >= 0);
      return { key: 'hintFill', params: { b, count, sign }, show: { button: `pickSign:${sign}`, groups: off } };
    }

    case 'take':
      return { key: 'hintTake', params: { n: problem.count.n }, show: { groups: s.groups.map((_, i) => i).slice(0, problem.count.n) } };

    case 'count': {
      const answer = evaluateGroups(problem);
      const counted = s.groups.map((g, i) => i).filter((i) => !fraction || s.groups[i].taken);
      return {
        key: fraction ? 'hintCountTaken' : 'hintCount',
        params: { sign: answer > 0 ? '+' : '-' },
        show: { groups: counted },
      };
    }

    default: // Flip has no wrong tries: a − is either tapped or not yet.
      return null;
  }
}
