// Hints after 3 wrong tries on the same step (SPEC §5, general rules).
// A hint shows the move; it never makes it. The student still has to tap.
// Pure logic, no DOM: hintFor(state) → null | { key, params, show }.

import { rewrite, isSubtraction, partyOrBattle } from './expr.js';
import { zoneTargets } from './moves.js';

export const HINT_AFTER = 3;

export function hintFor(s) {
  if (!s || s.step === 'done' || (s.tries[s.step] ?? 0) < HINT_AFTER) return null;
  const { problem } = s;

  switch (s.step) {
    case 'rewrite': {
      if (!isSubtraction(problem)) return { key: 'hintNothing', show: { nothingButton: true } };
      const parts = ['op', 'sign'].filter((p) => !s.flips[p]);
      return { key: 'hintRewrite', show: { flip: parts } };
    }

    case 'draw': {
      const ghosts = zoneTargets(problem).map((n) => ({ sign: n > 0 ? '+' : '-', count: Math.abs(n) }));
      const [left, right] = zoneTargets(problem);
      return { key: 'hintDraw', params: { left, right }, show: { ghosts } };
    }

    case 'partyBattle': {
      const r = rewrite(problem);
      return {
        key: 'hintPartyBattle',
        params: { a: r.left.value, b: r.right.value, same: partyOrBattle(problem) === 'party' },
        show: { signs: true },
      };
    }

    case 'cancel': {
      const find = (sign) => {
        for (let zone = 0; zone < s.zones.length; zone++) {
          const index = s.zones[zone].findIndex((c) => c.sign === sign && !c.canceled);
          if (index >= 0) return { zone, index };
        }
        return null;
      };
      const plus = find('+');
      const minus = find('-');
      return { key: 'hintCancel', show: { pair: plus && minus ? [plus, minus] : [] } };
    }

    case 'answer': {
      const left = s.zones.flat().filter((c) => !c.canceled);
      const sign = left[0]?.sign ?? null;
      return { key: 'hintAnswer', params: { sign, none: left.length === 0 }, show: { survivors: true } };
    }

    default:
      return null;
  }
}
