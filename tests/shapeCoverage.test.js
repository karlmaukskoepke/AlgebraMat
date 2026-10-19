import { describe, it, expect } from 'vitest';
import { ADD_SCENARIOS, DIVIDE_SCENARIOS } from './parity/scenarios.mjs';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { newDivide, reduceDivide, DIVIDE_SPOT } from '../src/engine/divideMoves.js';
import { withSpotlight } from '../src/engine/spotlight.js';
import { shapeOf, UNKNOWN } from '../src/engine/solveit/shape.js';
import { REGISTRY } from '../src/engine/solveit/registry.js';

// Build E: every state the parity scripts reach has a known shape and a registry entry (a ladder, "waits for Undo", or an explicit
// "no scaffold here"). An unknown shape, or a shape with no entry, fails here rather than quietly on screen.
const RUNS = [
  ['add-both', ADD_SCENARIOS, newLightsSession, withSpotlight(withLights(reduceAddBoth), ADD_SPOT)],
  ['divide-it', DIVIDE_SCENARIOS, (p, o) => newDivide(p, o), withSpotlight(reduceDivide, DIVIDE_SPOT)],
];
describe('Build E: shape coverage of the parity scripts', () => {
  for (const [pack, scenarios, start, reduce] of RUNS) {
    for (const [name, sc] of Object.entries(scenarios)) {
      it(`${pack}/${name}`, () => {
        let s = start(sc.problem, sc.opts);
        const check = (where) => {
          const shape = shapeOf(s);
          expect(shape.id, `${where}: ${shape.why ?? ''}`).not.toBe(UNKNOWN);
          const e = REGISTRY[shape.id];
          expect(e, `${where}: no registry entry for ${shape.id}`).toBeTruthy();
          expect(Boolean(e.ladder?.length || e.waiting || e.none), `${where}: ${shape.id} gives nothing`).toBe(true);
        };
        check('start');
        sc.actions.forEach((a, i) => { s = reduce(s, a); check(`#${i} ${JSON.stringify(a)}`); });
      });
    }
  }
});
