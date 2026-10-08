// One door for the equation cards (One-step and Two-step): each problem says which kind it is.
import * as one from './solve.js';
import * as two from './solve2.js';

const of = (p) => (p.kind === 'solve2' ? two : one);
export const formatEquation = (p) => of(p).formatEquation(p);
export const answerText = (p) => of(p).answerText(p);
export const substituteSegments = (p, t) => of(p).substituteSegments(p, t);
export const balanceOf = (p, t) => of(p).balanceOf(p, t);
export const checkEquation = (p, text) => (p.kind === 'solve2' ? two.checkSolve2(p, text) : one.checkSolve(p, text));
export const isTwoStep = (p) => p.kind === 'solve2';
