import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FEEDBACK, feedbackText } from '../src/view/feedback.js';

describe('feedback table', () => {
  it('has a message for every key the engine can produce', () => {
    const src = ['moves.js', 'session.js']
      .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8'))
      .join('\n');
    const keys = new Set();
    for (const m of src.matchAll(/(?:pass|fail)\('(\w+)'|(?:feedbackKey|key): '(\w+)'/g)) keys.add(m[1] ?? m[2]);
    expect(keys.size).toBeGreaterThan(15);
    for (const k of keys) expect(FEEDBACK, `missing message for "${k}"`).toHaveProperty(k);
  });

  it('fills in numbers with a real minus sign', () => {
    expect(feedbackText({ key: 'needType', params: { n: -3, count: 3, sign: '-' } }))
      .toBe('That number is −3, so it needs 3 negatives.');
    expect(feedbackText({ key: 'countAgain', params: { n: 5, have: 4 } }))
      .toBe('Count again — you have 4, the number is 5.');
    expect(feedbackText({ key: 'needType', params: { n: 1, count: 1, sign: '+' } }))
      .toBe('That number is 1, so it needs 1 positive.');
  });
});
