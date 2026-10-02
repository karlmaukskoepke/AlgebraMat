// Supports that stay on, and fade (SPEC-SCAFFOLD.md §5). After a mistake, the support that answers it is on for the
// next problems, and three clean answers in a row turn it off. Pure logic, no DOM or storage.
//
//   skills = { partyBattle: n, sign: n }    n is how many clean answers a support still needs before it's off (0 = off)
//
//   partyBattle (on): the party-or-battle question comes first, before the student types.
//   sign (on): the student's typed answer is read back in words as they type ("negative 2"), so the sign is heard.
//     (The cloze isn't the support that stays on: shown before typing, it would hand over the answer.)

import { skillOf } from './scaffold.js';

export const FADE_AFTER = 3;
export const SKILL_NAMES = ['partyBattle', 'sign'];

export const emptySkills = () => ({ partyBattle: 0, sign: 0 });

// Whatever was saved, as a clean { partyBattle, sign } of whole numbers from 0 to FADE_AFTER.
export function readSkills(raw) {
  const out = emptySkills();
  if (raw && typeof raw === 'object') {
    for (const name of SKILL_NAMES) {
      const n = raw[name];
      if (Number.isInteger(n) && n >= 0) out[name] = Math.min(n, FADE_AFTER);
    }
  }
  return out;
}

export const isOn = (skills, name) => (skills?.[name] ?? 0) > 0;
export const whichOn = (skills) => ({ partyBattle: isOn(skills, 'partyBattle'), sign: isOn(skills, 'sign') });

// The skills after one problem. `outcome` is { tags, wrongs, stuck, on }: the mistakes' tags, how many wrong answers
// were typed, how many times I'm stuck was pressed, and which supports were on when the problem began.
//   a mistake turns its support on (three clean answers to go)
//   a support that was on and still got a wrong first answer starts its count again
//   a support that was on and got a clean answer (right first try, never stuck) counts one down
//   being stuck without a wrong answer changes nothing
export function afterProblem(skills, outcome) {
  const next = readSkills(skills);
  for (const tag of outcome.tags ?? []) {
    const name = skillOf(tag);
    if (name) next[name] = FADE_AFTER;
  }
  for (const name of SKILL_NAMES) {
    if (!outcome.on?.[name]) continue;
    if (outcome.wrongs > 0) next[name] = FADE_AFTER;
    else if (outcome.stuck === 0) next[name] = Math.max(0, readSkills(skills)[name] - 1);
  }
  return next;
}
