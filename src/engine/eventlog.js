// The anonymous log (SPEC-SCAFFOLD.md §6): one small record per problem, newest 500 kept, nothing that identifies a
// student. The pilot only writes it; the pattern-finding and the teacher report read it later. Pure logic.

export const LOG_CAP = 500;

// A record from a finished light-mode session:
//   { t, pack, level, problem, answers: [{ typed, tag }], supports: [kind], stuck, clean, on: { partyBattle, sign } }
// `answers` are the wrong answers typed, with the mistake each looked like (the pile of 'unmatched' is where new
// mistakes show up). `supports` are the supports brought in by a wrong answer or I'm stuck.
export function makeRecord(session, { t, pack, level, problem }) {
  return {
    t,
    pack,
    level,
    problem,
    answers: session.answers.map((a) => ({ typed: a.typed, tag: a.tag })),
    supports: [...session.supportsShown],
    stuck: session.stuck,
    taught: session.taught ?? 0,
    clean: session.clean,
    on: { ...session.on },
  };
}

export function appendRecord(log, record, cap = LOG_CAP) {
  const next = [...(Array.isArray(log) ? log : []), record];
  return next.length > cap ? next.slice(next.length - cap) : next;
}
