import { describe, it, expect } from 'vitest';
import { resolveBase } from '../build/base.js';

describe('resolveBase', () => {
  it('defaults to the root when unset or empty', () => {
    expect(resolveBase(undefined)).toBe('/');
    expect(resolveBase('')).toBe('/');
    expect(resolveBase('   ')).toBe('/');
    expect(resolveBase('/')).toBe('/');
  });

  it('adds missing leading and trailing slashes', () => {
    expect(resolveBase('AlgebraMat')).toBe('/AlgebraMat/');
    expect(resolveBase('/AlgebraMat')).toBe('/AlgebraMat/');
    expect(resolveBase('AlgebraMat/')).toBe('/AlgebraMat/');
  });

  it('keeps nested sub-paths and collapses extra edge slashes', () => {
    expect(resolveBase('/apps/mat/')).toBe('/apps/mat/');
    expect(resolveBase('//apps/mat//')).toBe('/apps/mat/');
  });
});
