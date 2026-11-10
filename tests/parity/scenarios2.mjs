// The scripted runs for the newer cards (Build AF, Part 3; tests/parity/README.md): Fractions of x, Strange solutions, the no-help choice
// and a placed level. A run is a problem (pack, level, seed, which problem) and a list of steps. A step is a card action, or one of four
// tokens worked out from the state at that point, so the run does not depend on generated term ids:
//   'MOVES'   the honest moves (engine/solveit/honest.js nextMove) until x is alone or gone, a Next after each that folds
//   'ANSWER'  the problem's own answer typed (its fraction with `/`) and Check; ['ANSWER', '9'] types 9 instead
//   'PLACE'   the value dropped into every x;  'LINES' Next until the check ends
// `locked: true`: a miss ends the attempt (otherwise help comes on, the same problem). `noHelp: true` plays it as a no-help attempt (engine/noHelp.js on, the session cleaned after every action, help actions dropped, as
// main.js does in a test out); `attempt` names the class-sheet word its rows carry (test-out-pass or test-out-fail).

export const NEW_SCENARIOS = {
  // Fractions of x: Levels 1, 3 and 6 the honest way (the model, the moves, the check); Level 3 with I'm stuck first
  'fractions-of-x/L1-honest': { pack: 'fractions-of-x', level: 1, seed: 7, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'fractions-of-x/L3-honest': { pack: 'fractions-of-x', level: 3, seed: 7, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'fractions-of-x/L3-stuck': { pack: 'fractions-of-x', level: 3, seed: 5, steps: [{ type: 'stuck' }, { type: 'stuck' }, 'MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'fractions-of-x/L6-honest': { pack: 'fractions-of-x', level: 6, seed: 7, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  // Strange solutions: a no-solution pick, an infinitely-many pick, a wrong pick then Undo, a fraction answer at Level 5, the zero case,
  // an unsimplified answer (15/6) before the simplest one
  'strange-solutions/none-pick': { pack: 'strange-solutions', level: 4, seed: 1, steps: ['MOVES', { type: 'conclude', pick: 'none' }] },
  'strange-solutions/all-pick': { pack: 'strange-solutions', level: 4, seed: 3, steps: ['MOVES', { type: 'conclude', pick: 'all' }] },
  'strange-solutions/wrong-pick': { pack: 'strange-solutions', level: 4, seed: 1, steps: ['MOVES', { type: 'conclude', pick: 'all' }, { type: 'undo' }, { type: 'conclude', pick: 'none' }] },
  'strange-solutions/L5-fraction': { pack: 'strange-solutions', level: 5, seed: 8, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'strange-solutions/zero': { pack: 'strange-solutions', level: 4, seed: 178, problem: 5, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'strange-solutions/unsimplified': { pack: 'strange-solutions', level: 2, seed: 27, steps: ['MOVES', ['ANSWER', '15/6'], ['ANSWER', '-15/6'], 'ANSWER', 'PLACE', 'LINES'] },
  // the no-help choice: a pass (two problems, both right), a miss on an open level (the second problem wrong), a locked level's fail on
  // Strange solutions (a wrong pick)
  'no-help/pass-1': { pack: 'two-step-equations', level: 1, seed: 7, noHelp: true, attempt: 'test-out-pass', steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'no-help/pass-2': { pack: 'two-step-equations', level: 1, seed: 7, problem: 2, noHelp: true, attempt: 'test-out-pass', steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
  'no-help/miss-open': { pack: 'two-step-equations', level: 1, seed: 7, problem: 2, noHelp: true, attempt: 'test-out-fail', steps: ['MOVES', ['ANSWER', '9'], 'PLACE', 'LINES', { type: 'stuck' }] },
  'no-help/locked-fail': { pack: 'strange-solutions', level: 4, seed: 1, noHelp: true, locked: true, attempt: 'test-out-fail', steps: ['MOVES', { type: 'conclude', pick: 'all' }, { type: 'stuck' }] },
  // a placed level: its fifth problem solved, which earns it (gold)
  'placed/problem-5': { pack: 'two-step-equations', level: 1, seed: 7, problem: 5, steps: ['MOVES', 'ANSWER', 'PLACE', 'LINES'] },
};
