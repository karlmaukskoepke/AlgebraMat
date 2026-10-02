// The spotlight tour (SPEC-SCAFFOLD.md §1b), as a tiny state machine. The first light problem on a new device opens
// with a guided tour that lights up each feature in turn. The "I'm stuck" step makes the student press the real
// button (so they remember pressing it, rather than clicking past it). Pure logic, no DOM; the overlay is view/tour.js.

// Each step names the feature it lights up (view/tour.js finds it) and what moves it on: 'next' is the Next button,
// 'press' is the student pressing the lit-up control.
const STEPS = [
  { id: 'problem', target: 'problem', needs: 'next', text: 'Here’s what you’re adding.' },
  { id: 'pad', target: 'pad', needs: 'next', text: 'Type the answer here. ± makes it negative.' },
  { id: 'check', target: 'check', needs: 'next', text: 'Press Check when you’re ready.' },
  { id: 'stuck', target: 'stuck', needs: 'press', text: 'Not sure? Press “I’m stuck” any time. There’s no penalty. Try it now!' },
  { id: 'help', target: 'feedback', needs: 'next', text: 'That’s the help. Answer its question, then type the answer yourself.' },
];

// The first-time tour makes the press required and ends on what the help looks like. A replay (the ? button) only
// points at I'm stuck: pressing it for real would start a support in the middle of a problem.
export function tourSteps({ required }) {
  if (required) return STEPS;
  return STEPS.filter((s) => s.id !== 'help').map((s) => (
    s.id === 'stuck' ? { ...s, needs: 'next', text: 'Not sure? Press “I’m stuck” any time. There’s no penalty.' } : s));
}

export const startTour = (required) => ({ steps: tourSteps({ required }), index: 0, done: false });

export const currentStep = (tour) => (tour.done ? null : tour.steps[tour.index]);

// Events: 'next' (the Next button), 'press' (the student pressed the lit-up control), 'skip' (leave the tour),
// and 'pass' (this step's feature isn't on the screen, so move past it).
export function advance(tour, event) {
  if (tour.done) return tour;
  if (event === 'skip') return { ...tour, done: true };
  const step = tour.steps[tour.index];
  const moves = event === 'pass' || (event === 'next' && step.needs === 'next') || (event === 'press' && step.needs === 'press');
  if (!moves) return tour;
  const index = tour.index + 1;
  return index >= tour.steps.length ? { ...tour, index, done: true } : { ...tour, index };
}
