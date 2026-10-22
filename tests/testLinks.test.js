// The data behind the test-links page (public/test-links.json): every "Features to check" item has the parts Karl was promised, its
// button opens a fixed problem with sign-in skipped, and the words are a teacher's, not a developer's (CLAUDE.md, Working with Karl).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PACKS } from '../src/packs/index.js';

const data = JSON.parse(readFileSync(new URL('../public/test-links.json', import.meta.url), 'utf8'));
const checks = data.checks;
const packs = PACKS.map((p) => p.id);
const text = (c) => [c.name, c.build, c.link.label, ...c.steps, c.see].join('\n');

describe('Features to check (test-links.json)', () => {
  it('has items, with unique ids', () => {
    expect(checks.length).toBeGreaterThan(0);
    expect(new Set(checks.map((c) => c.id)).size).toBe(checks.length);
  });

  it.each(checks.map((c) => [c.id, c]))('%s has exactly the promised parts', (_id, c) => {
    expect(Object.keys(c).sort()).toEqual(['build', 'id', 'link', 'name', 'see', 'steps']);
    expect(c.name.length).toBeGreaterThan(5);
    expect(c.build).toMatch(/^Build [A-Z]/);
    expect(c.see.length).toBeGreaterThan(20);
    expect(c.steps.length).toBeGreaterThan(2);
    expect(Object.keys(c.link).sort()).toEqual(['label', 'query', 'reset']);
  });

  it.each(checks.map((c) => [c.id, c]))('%s opens a fixed problem with sign-in skipped', (_id, c) => {
    const q = new URLSearchParams(c.link.query.replace(/^\?/, ''));
    if (q.get('diag')) expect(['count', 'build', 'solve']).toContain(q.get('diag'));     // a section's placement quiz (Build L)
    else {
      expect(packs).toContain(q.get('pack'));
      expect(Number(q.get('level'))).toBeGreaterThan(0);
    }
    expect(Number(q.get('seed'))).toBeGreaterThan(0);
    expect(q.get('nosignin')).toBe('1');
    expect(c.link.reset).toBe(true);        // a fresh student, so the same problem comes up every time
  });

  it.each(checks.map((c) => [c.id, c]))('%s is written in plain words', (_id, c) => {
    const t = text(c);
    // no file names, branch names, flags or other developer words
    expect(t).not.toMatch(/\.(js|json|html|css|md|mjs)\b/i);
    expect(t).not.toMatch(/\b(branch|commit|flag|localStorage|query|seed|parity|json|console|reducer|DOM|repo)\b/i);
    expect(t).not.toMatch(/[?&]\w+=/);
  });

  it('has a "Play it like a student" item for each live card', () => {
    const names = checks.map((c) => c.name);
    expect(names).toContain('Play it like a student: Add to both sides');
    expect(names).toContain('Play it like a student: Divide it');
  });
});
