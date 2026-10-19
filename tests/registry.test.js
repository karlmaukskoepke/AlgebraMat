import { describe, it, expect } from 'vitest';
import { REGISTRY, registerRungs } from '../src/engine/solveit/registry.js';
import { SHAPES } from '../src/engine/solveit/shape.js';

// Build E, P3: the scaffold registry. Every entry's ladder names rungs it has; every rung records a class-sheet word from the old list.
const WORDS = [null, 'hint', 'model', 'move', 'guided', 'crossoff'];
describe('Build E, P3: the scaffold registry', () => {
  it('has only known shapes, and every ladder names rungs that exist', () => {
    for (const [id, e] of Object.entries(REGISTRY)) {
      expect(Object.keys(SHAPES), id).toContain(id);
      for (const name of e.ladder ?? []) {
        expect(e[name], `${id}.${name}`).toBeTruthy();
        expect(typeof e[name].open, `${id}.${name}.open`).toBe('function');
        expect(WORDS, `${id}.${name}.word`).toContain(e[name].word);
      }
      if (!e.waiting && !e.none) expect(e.ladder?.length, `${id} has rungs`).toBeGreaterThan(0);
    }
  });
  it('refuses a shape registered twice', () => {
    expect(() => registerRungs({ D1: { ladder: [] } })).toThrow(/twice/);
  });
});
