// The scaffold registry and the one help ladder (docs/architecture/SOLVE-IT-ONE-SYSTEM.md layer 3, phase P3). Help is keyed to the
// SHAPE of the equation on screen (./shape.js), not to the card: the registry maps each shape to what each kind of help does there.
//
//   { [shapeId]: { ladder: [names], hintPopup?, modelIt?, chooseMove?, guided?, partyBattle?, countersWalk?, bigNumberWalk?, teach?,
//                  waiting?, none? } }
//
//   ladder        the I'm stuck rungs in order, by name: one click a rung, the last repeats; rungs restart at each equation state
//   a rung        { word, open(s, api, shape) → s }: `word` is the class-sheet word it records (`hint`, `model`, `move`, `guided`),
//                 or null; `open` sets up what the student does next (every rung gives something to do)
//   hintPopup     { word, open, after(s, before) → spot }: the reminder rung, and the hint pop-up after Undo (`before`: the state Undo was
//                 pressed on, so a known slip can shape the hint)
//   teach         Teach me: the same scaffolds on a forced path (the loop records `forced`)
//   waiting       the state waits for Undo: I'm stuck and Teach me answer "Undo first" (the loop's, for every card)
//   none          no scaffold here, on purpose (said when asked)
//
// The ladder lives here, once: cards never hand-roll rungs. A card supplies only its entries (./rungs/*.js). No DOM.

import { shapeOf, UNKNOWN } from './shape.js';
import { DIVIDE_RUNGS } from './rungs/divide.js';
import { ADD_RUNGS } from './rungs/add.js';
import { FLIP_RUNGS } from './rungs/flip.js';

export const REGISTRY = { ...ADD_RUNGS, ...DIVIDE_RUNGS, ...FLIP_RUNGS };
// (a new card adds its own shapes' entries)
export function registerRungs(entries) {
  for (const [id, entry] of Object.entries(entries)) {
    if (REGISTRY[id] && REGISTRY[id] !== entry) throw new Error(`Shape ${id} is registered twice`);
    REGISTRY[id] = entry;
  }
}

// The entry for a state. An unknown shape, or a shape nobody registered, is a bug: it is reported (tests fail on it), and the student
// gets the move's prompt rather than nothing.
export function entryOf(s) {
  const shape = shapeOf(s);
  const entry = shape.id === UNKNOWN ? null : REGISTRY[shape.id] ?? null;
  if (!entry && typeof console !== 'undefined') console.error(`No scaffold registered for shape ${shape.id}${shape.why ? ` (${shape.why})` : ''}`);
  return { shape, entry };
}

const record = (s, word) => { if (word && !s.supportsShown.includes(word)) s.supportsShown.push(word); };

// I'm stuck: the next rung of the shape's ladder (the loop has already counted the click and checked that nothing waits for Undo).
export function climb(s, api) {
  const { shape, entry } = entryOf(s);
  if (!entry?.ladder?.length) return api.say(s, entry?.none ?? 'aFindX');
  const i = Math.min(s.rung, entry.ladder.length - 1);
  s.rung += 1;
  const rung = entry[entry.ladder[i]];
  record(s, rung.word);
  return rung.open(s, api, shape);
}

// Teach me: the shape's forced path.
export function teach(s, api) {
  const { shape, entry } = entryOf(s);
  if (!entry?.teach) return api.say(s, entry?.none ?? 'aFindX');
  return entry.teach.open(s, api, shape);
}

// The hint pop-up after Undo (engine/spotlight.js asks for it): the reminder for the state Undo returned to.
export function hintAfterUndo(s, before) {
  const { shape, entry } = entryOf(s);
  return entry?.hintPopup?.after ? entry.hintPopup.after(s, before, shape) : null;
}
