import { describe, it, expect } from 'vitest';
import { makeDistribute, groupPart, termPart, formatDistribute, distributedText, answerText } from '../src/engine/distribute.js';
import {
  newDistributeSession, reduceDistribute as reduce, distributeSteps, phaseLabel, groupProblem, openedProblem,
} from '../src/engine/distributeSession.js';
import { validateLine } from '../src/engine/distributeMoves.js';
import { distributeHintFor } from '../src/engine/distributeHints.js';
import { distributeFeedbackText } from '../src/view/distributeFeedback.js';
import { piecesOfGroup, answerText as groupAnswer } from '../src/engine/termGroups.js';
import { termParts, formatAnswer, evaluate, effective } from '../src/engine/terms.js';
import { generateDistributeLevel } from '../src/engine/generateDistribute.js';
import { hasSubtractedGroup, addOppositeSegments, formatAddOpposite } from '../src/engine/distribute.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });
const run = (s, ...actions) => actions.reduce(reduce, s);
const check = { type: 'check' };
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));

// 2(3x − 4) + 5 → 6x − 8 + 5 → 6x − 3
const P = makeDistribute([groupPart('+', 2, [x(3), n(-4)]), termPart('int', '+', 5)]);

// Walk ① distribute's Groups of Terms steps the way a student would, up to Check it.
function toCheckIt(s) {
  const g = groupProblem(s.problem);
  let t = s;
  if (g.hidden1) t = run(t, { type: 'digit', digit: 1 }, check);                  // the invisible 1
  t = run(t, ...Array(g.count.n).fill({ type: 'addGroup' }), check, { type: 'chooseSign', sign: g.count.neg ? '-' : '+' });
  for (const q of piecesOfGroup(g)) t = run(t, { type: 'pickPiece', pieceType: q.type, sign: q.sign }, { type: 'tapGroup', index: 0 });
  t = run(t, { type: 'copyAll' }, check);
  if (g.count.neg) t = run(t, { type: 'flipAll' });
  return run(t, ...typed(groupAnswer(g).replace(/[\s]/g, '').replace(/−/g, '-')), check);
}

// Walk ② combine: box and circle, draw, cancel, type.
function solveCombine(s) {
  const expr = s.ts.problem;
  const parts = termParts(expr);
  let t = s;
  expr.terms.forEach((term, i) => {
    const idx = parts.map((p, k) => (p.term === i ? k : -1)).filter((k) => k >= 0);
    t = run(t, { type: 'pickTool', tool: term.kind === 'x' ? 'box' : 'circle' }, { type: 'drawShape', from: idx[0], to: idx.at(-1) });
  });
  t = run(t, check);
  expr.terms.forEach((term, i) => {
    const e = effective(term);
    t = run(t, { type: 'pickPiece', pieceType: term.kind === 'x' ? 'box' : 'counter', sign: e < 0 ? '-' : '+' }, ...Array(Math.abs(e)).fill({ type: 'tapZone', term: i }));
  });
  t = run(t, check);
  for (;;) {
    const all = t.ts.pieces.flatMap((col, term) => col.map((p, index) => ({ term, index, p }))).filter((q) => !q.p.canceled);
    const a = all.find((q) => all.some((r) => r !== q && r.p.type === q.p.type && r.p.sign !== q.p.sign));
    if (t.step !== 'cancel' || !a) break;
    const b = all.find((r) => r.p.type === a.p.type && r.p.sign !== a.p.sign);
    t = run(t, { type: 'tapPiece', term: a.term, index: a.index }, { type: 'tapPiece', term: b.term, index: b.index });
  }
  return run(t, ...typed(formatAnswer(evaluate(expr)).replace(/\s/g, '').replace(/−/g, '-')), check);
}

describe('Distribute, then combine session: ① distribute', () => {
  it('starts at Groups of Terms on the group, with ① distribute and Write it in the step strip', () => {
    const s = newDistributeSession(P);
    expect(s).toMatchObject({ stage: 'tg', step: 'groups', feedback: { key: 'groupsIntro', src: 'tg' } });
    expect(groupProblem(P).count).toMatchObject({ neg: false, n: 2 });
    expect(distributeSteps(s).map((t) => t.id)).toEqual(['groups', 'sign', 'fill', 'flip', 'answer', 'checkit', 'line']);
    expect(phaseLabel(s)).toBe('① distribute');
  });

  it('runs Groups of Terms to Check it, which waits for Continue (not the next problem)', () => {
    const s = toCheckIt(newDistributeSession(P));
    expect(s).toMatchObject({ stage: 'tg', step: 'checkit', skipped: ['flip'] });
    expect(reduce(newDistributeSession(P), { type: 'continue' })).toEqual(newDistributeSession(P));
    expect(run(s, { type: 'continue' })).toMatchObject({ stage: 'line', step: 'line', line: '', feedback: { key: 'lineIntro', src: 'dist' } });
  });
});

describe('Write it', () => {
  const atLine = () => run(toCheckIt(newDistributeSession(P)), { type: 'continue' });

  it('reads what is typed, deletes, and stops at its limit', () => {
    let s = run(atLine(), ...typed('6x-8+5'));
    expect(s.line).toBe('6x-8+5');
    s = run(s, { type: 'backspace' });
    expect(s.line).toBe('6x-8+');
    expect(run(s, ...typed('1'.repeat(40))).line.length).toBe(24);
  });

  it('wants every opened term in order, and says what is off', () => {
    const say = (text) => validateLine(P, text).feedbackKey;
    expect(say('')).toBe('typeAnswer');
    expect(say('6x-8+5')).toBe('lineOk');
    expect(say('6x - 3')).toBe('lineTooSoon');            // already combined
    expect(say('6x+8+5')).toBe('lineSigns');               // a sign is wrong
    expect(say('6x-8')).toBe('lineMissing');               // the 5 is left out
    expect(say('5-8+6x')).toBe('lineOff');                 // out of order
    expect(say('3x-4+5')).toBe('lineOff');
    expect(say('6x-8+')).toBe('answerUnreadable');
  });

  it('counts wrong tries and shows a hint after three', () => {
    let s = run(atLine(), ...typed('6x-3'), check);
    expect(s).toMatchObject({ feedback: { key: 'lineTooSoon', bad: true }, tries: { line: 1 } });
    expect(distributeHintFor(s)).toBeNull();
    s = run(s, check, check);
    expect(distributeHintFor(s)).toMatchObject({ key: 'hintLine', src: 'dist' });
    expect(distributeFeedbackText(distributeHintFor(s))).toContain('6x − 8');
  });

  it('right line starts ② combine on the opened expression, with Rewrite left out', () => {
    const s = run(atLine(), ...typed('6x-8+5'), check);
    expect(s).toMatchObject({ stage: 'ts', step: 'boxcircle', feedback: { key: 'lineOk', src: 'dist' } });
    expect(distributeFeedbackText(s.feedback)).toMatch(/Opened! 6x − 8 \+ 5/);
    expect(distributeSteps(s).map((t) => t.id)).toEqual(['boxcircle', 'draw', 'cancel', 'answer']);
    expect(phaseLabel(s)).toBe('② combine');
    expect(s.ts.problem.terms.map((t) => [t.kind, t.op, t.value])).toEqual([['x', '+', 6], ['int', '-', 8], ['int', '+', 5]]);
  });
});

describe('② combine', () => {
  it('runs Boxes & Circles on the opened line to the answer', () => {
    let s = run(toCheckIt(newDistributeSession(P)), { type: 'continue' }, ...typed('6x-8+5'), check);
    expect(s.feedback.src).toBe('dist');
    s = run(s, { type: 'pickTool', tool: 'box' });
    expect(s.feedback.src).toBe('ts');                     // after a move, Boxes & Circles speaks
    s = solveCombine(s);
    expect(s).toMatchObject({ stage: 'ts', step: 'done', finalText: '6x − 3' });
    expect(answerText(P)).toBe('6x − 3');
  });
});

describe('Round 1 problems from the generator all open and combine', () => {
  it('every generated problem is a one-group problem the session accepts', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const p of generateDistributeLevel(1, seed)) {
        const s = newDistributeSession(p);
        expect(s.stage).toBe('tg');
        expect(formatDistribute(p)).toMatch(/\(/);
        expect(openedProblem(p).terms.length).toBe(distributedText(p).split(/ [+−] /).length);
      }
    }
  });
});

describe('Rounds 2 and 3: the invisible 1 and the subtracted group', () => {
  const plusOne = makeDistribute([termPart('int', '+', 4), groupPart('+', 1, [x(2), n(-3)], { hiddenOne: true })]);   // 4 + (2x − 3)
  const minusOne = makeDistribute([termPart('int', '+', 4), groupPart('-', 1, [x(1), n(2)], { hiddenOne: true })]);   // 4 − (x + 2)
  const minusMany = makeDistribute([termPart('int', '+', 5), groupPart('-', 2, [x(2), n(-3)])]);                      // 5 − 2(2x − 3)

  it('writes a subtracted group as adding the opposite, with the changed part marked', () => {
    expect(formatAddOpposite(minusMany)).toBe('5 + −2(2x − 3)');
    expect(formatAddOpposite(minusOne)).toBe('4 + −(x + 2)');
    expect(addOppositeSegments(minusMany).filter((g) => g.opp).map((g) => g.text)).toEqual(['+ −2']);
    expect([plusOne, minusOne, minusMany].map(hasSubtractedGroup)).toEqual([false, true, true]);
  });

  it('a positive single group hides its 1 too, and the student writes it first', () => {
    const s = newDistributeSession(plusOne);
    expect(s.tg.problem.hidden1).toBe(true);
    expect(s.feedback.key).toBe('groupsIntroHidden');
    expect(reduce(s, { type: 'addGroup' }).feedback).toMatchObject({ key: 'writeOneFirst', bad: true });
  });

  it('a subtracted group flips before its answer, and the answer is what Write it opens', () => {
    const atCheck = toCheckIt(newDistributeSession(minusMany));
    expect(atCheck).toMatchObject({ stage: 'tg', step: 'checkit' });
    expect(atCheck.skipped).toEqual([]);                                   // Flip was not skipped
    const atLine = run(atCheck, { type: 'continue' });
    expect(validateLine(minusMany, '5-4x+6').feedbackKey).toBe('lineOk');
    expect(validateLine(minusMany, '5+4x+6').feedbackKey).toBe('lineSigns');
    expect(validateLine(minusMany, '5-4x-6').feedbackKey).toBe('lineSigns');
    expect(atLine.line).toBe('');
  });

  it('shows the add-the-opposite note in the hint for Write it', () => {
    let s = run(toCheckIt(newDistributeSession(minusMany)), { type: 'continue' }, ...typed('5-2x'), check, check, check);
    expect(distributeFeedbackText(distributeHintFor(s))).toContain('5 + −2(2x − 3)');
    s = run(toCheckIt(newDistributeSession(plusOne)), { type: 'continue' }, ...typed('4'), check, check, check);
    expect(distributeFeedbackText(distributeHintFor(s))).not.toContain('opposite');
  });

  it('every Round 1, 2 and 3 problem from the generator walks start to finish', () => {
    for (const level of [1, 2, 3]) {
      for (const seed of [3, 11]) {
        for (const p of generateDistributeLevel(level, seed)) {
          let s = toCheckIt(newDistributeSession(p));
          expect(s.step).toBe('checkit');
          s = run(s, { type: 'continue' }, ...typed(distributedText(p).replace(/\s/g, '').replace(/−/g, '-')), check);
          expect(s.stage).toBe('ts');
          s = solveCombine(s);
          expect(s).toMatchObject({ step: 'done', finalText: answerText(p) });
        }
      }
    }
  });
});
