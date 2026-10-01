import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression, evaluate, formatAnswer } from '../src/engine/terms.js';
import { boxes } from '../src/packs/index.js';
import { newTermSession, reduceTerms, TERM_STEPS, termSteps, shapeComplete } from '../src/engine/termSession.js';
import { TERM_FEEDBACK, termFeedbackText } from '../src/view/termFeedback.js';
import { generateTermLevel } from '../src/engine/generateTerms.js';
import { fullyCanceled } from '../src/engine/termPieces.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);   // 3x − 5 + 7 − x
const run = (s, ...actions) => actions.reduce(reduceTerms, s);
const draw = (from, to) => ({ type: 'drawShape', from, to });
const tool = (t) => ({ type: 'pickTool', tool: t });
const check = { type: 'check' };

describe('Boxes & Circles session: Box & Circle', () => {
  it('starts at Box & Circle with no tool and nothing drawn', () => {
    const s = newTermSession(EX1);
    expect(s).toMatchObject({ step: 'boxcircle', tool: null, shapes: [], selecting: null });
    expect(TERM_STEPS.map((t) => t.id)).toEqual(['boxcircle', 'draw', 'cancel', 'answer']);
  });

  it('draws nothing until a tool is picked, and says so', () => {
    const s = run(newTermSession(EX1), draw(0, 0));
    expect(s.shapes).toEqual([]);
    expect(s.feedback.key).toBe('pickToolFirst');
  });

  it('draws the picked shape around the parts dragged over, either direction', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), tool('circle'), draw(2, 1));
    expect(s.shapes).toEqual([{ kind: 'box', from: 0, to: 0 }, { kind: 'circle', from: 1, to: 2 }]);
    expect(shapeComplete(EX1, s.shapes[1])).toBe(true);
    s = run(s, tool('box'), draw(6, 6));
    expect(shapeComplete(EX1, s.shapes[2])).toBe(false);   // just the x: dashed until the − is taken in
  });

  it('keeps the tool until the other is picked, so a student can box everything first or circle first', () => {
    let s = run(newTermSession(EX1), tool('circle'), draw(1, 2), draw(3, 4), tool('box'), draw(0, 0), draw(5, 6));
    expect(s.shapes.map((sh) => sh.kind)).toEqual(['circle', 'circle', 'box', 'box']);
    expect(run(s, check).step).toBe('draw');
  });

  it('shows the drag as it happens, and clears it on release', () => {
    let s = run(newTermSession(EX1), tool('box'), { type: 'selecting', from: 6, to: 5 });
    expect(s.selecting).toEqual({ from: 5, to: 6 });
    expect(reduceTerms(s, { type: 'selecting', from: 5, to: 6 })).toBe(s);   // no change: no new state
    s = run(s, { type: 'selecting', from: 5, to: 5 });
    expect(s.selecting).toEqual({ from: 5, to: 5 });
    s = run(s, draw(5, 6));
    expect(s.selecting).toBeNull();
    expect(run(s, { type: 'selecting', clear: true })).toBe(s);
    expect(run(run(s, { type: 'selecting', from: 0, to: 0 }), { type: 'selecting', clear: true }).selecting).toBeNull();
  });

  it('lets a new shape replace the ones it overlaps, so fixing a dashed shape is one drag', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(6, 6), draw(5, 6));
    expect(s.shapes).toEqual([{ kind: 'box', from: 5, to: 6 }]);
    s = run(s, tool('circle'), draw(5, 6));    // changing its mind: the circle replaces the box
    expect(s.shapes).toEqual([{ kind: 'circle', from: 5, to: 6 }]);
  });

  it('removes a tapped shape, and undoes the latest', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), tool('circle'), draw(1, 2), draw(3, 4));
    s = run(s, { type: 'removeShape', index: 1 });
    expect(s.shapes.map((sh) => sh.from)).toEqual([0, 3]);
    s = run(s, { type: 'undo' });
    expect(s.shapes.map((sh) => sh.from)).toEqual([0]);
    expect(reduceTerms(run(s, { type: 'undo' }), { type: 'undo' })).toEqual(run(s, { type: 'undo' }));
  });

  it('checks the shapes: each wrong try counts, and the right ones go on to Draw', () => {
    let s = run(newTermSession(EX1), tool('box'), draw(0, 0), draw(6, 6), tool('circle'), draw(1, 2), draw(3, 4), check);
    expect(s).toMatchObject({ step: 'boxcircle', feedback: { key: 'includeSign', bad: true }, tries: { boxcircle: 1 } });
    s = run(s, tool('box'), draw(5, 6), check);
    expect(s).toMatchObject({ step: 'draw', feedback: { key: 'boxCircleDone' } });
    expect(s.feedback.bad).toBeFalsy();
    expect(s.tries.boxcircle).toBe(1);
  });

  it('ignores moves outside their step, and nonsense', () => {
    const done = run(newTermSession(EX1), tool('box'), draw(0, 0), draw(5, 6), tool('circle'), draw(1, 2), draw(3, 4), check);
    for (const a of [draw(0, 0), tool('box'), { type: 'selecting', from: 0, to: 1 }, { type: 'removeShape', index: 0 }, { type: 'digit', digit: 1 }]) {
      expect(reduceTerms(done, a)).toBe(done);
    }
    const s = run(newTermSession(EX1), tool('box'));
    expect(reduceTerms(s, draw(0, 99))).toBe(s);
    expect(reduceTerms(s, draw(-1, 2))).toBe(s);
    expect(reduceTerms(s, tool('triangle'))).toBe(s);
    expect(reduceTerms(s, { type: 'removeShape', index: 3 })).toBe(s);
    expect(reduceTerms(s, { type: 'bogus' })).toBe(s);
  });

  it('can be solved on every kind of problem the levels make', () => {
    for (const level of [1, 2, 3, 4, 5]) for (const e of generateTermLevel(level, 99)) {
      let s = newTermSession(e);
      let part = 0;
      for (let i = 0; i < e.terms.length; i++) {
        const first = part;
        const last = part + (i === 0 ? 0 : 1);
        s = run(s, tool(e.terms[i].kind === 'x' ? 'box' : 'circle'), draw(first, last));
        part = last + 1;
      }
      expect(run(s, check).step, `${level}`).toBe('draw');
    }
  });
});

describe('Boxes & Circles feedback table', () => {
  it('has a message for every key the engine can produce', async () => {
    const { readFileSync } = await import('node:fs');
    const src = ['termMoves.js', 'termSession.js']
      .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8')).join('\n');
    // Message keys are camelCase words in fail(...), pass(...), note(s, ...) and key: '...' lines.
    const keys = new Set();
    for (const text of src.split('\n').filter((l) => /\b(fail|pass)\(|note\(s,|key: '/.test(l))) {
      for (const m of text.matchAll(/'([a-z]+[A-Z]\w*)'/g)) keys.add(m[1]);
    }
    expect(keys.size).toBeGreaterThanOrEqual(10);
    for (const k of keys) expect(TERM_FEEDBACK, `missing "${k}"`).toHaveProperty(k);
  });

  it('reads well', () => {
    expect(termFeedbackText({ key: 'includeSign', params: { op: '−' } })).toBe('Take the sign in front with it: drag from the − across the number.');
    expect(termFeedbackText({ key: 'twoTerms' })).toBe('One term at a time — this shape has two.');
    expect(termFeedbackText({ key: 'nope' })).toBe('');
  });
});

// ---------- Draw, Cancel and Answer ----------

const pick = (pieceType, sign) => ({ type: 'pickPiece', pieceType, sign });
const zone = (term) => ({ type: 'tapZone', term });
const piece = (term, index) => ({ type: 'tapPiece', term, index });
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));

// 3x − 5 + 7 − x: shapes done, ready to draw
const atDraw = () => run(newTermSession(EX1), tool('box'), draw(0, 0), draw(5, 6), tool('circle'), draw(1, 2), draw(3, 4), check);
// the right pieces for it: 3 boxes, 5 −, 7 +, 1 − box
const drawAll = (s) => run(s,
  pick('box', '+'), ...Array(3).fill(zone(0)),
  pick('counter', '-'), ...Array(5).fill(zone(1)),
  pick('counter', '+'), ...Array(7).fill(zone(2)),
  pick('box', '-'), zone(3));

describe('Boxes & Circles session: Draw', () => {
  it('adds the picked piece above the tapped term, one per tap, any term in any order', () => {
    let s = run(atDraw(), zone(1));
    expect(s.feedback.key).toBe('pickPieceFirst');
    s = run(s, pick('counter', '-'), zone(2), zone(1), zone(1));
    expect(s.pieces.map((c) => c.length)).toEqual([0, 2, 1, 0]);
    expect(s.pieces[1][0]).toMatchObject({ type: 'counter', sign: '-', canceled: false });
  });

  it('takes a piece away when it is tapped, and Undo takes back the latest', () => {
    let s = run(atDraw(), pick('box', '+'), zone(0), zone(0), zone(0));
    s = run(s, piece(0, 1));
    expect(s.pieces[0]).toHaveLength(2);
    s = run(s, { type: 'undo' });
    expect(s.pieces[0]).toHaveLength(1);
    s = run(s, { type: 'undo' }, { type: 'undo' });
    expect(s.pieces[0]).toHaveLength(0);
  });

  it('caps a term at 10 pieces', () => {
    const s = run(atDraw(), pick('box', '+'), ...Array(12).fill(zone(0)));
    expect(s.pieces[0]).toHaveLength(10);
    expect(s.feedback.key).toBe('columnFull');
  });

  it('names the first term that is off, and counts the wrong try', () => {
    let s = run(atDraw(), pick('box', '+'), zone(0), zone(0), check);              // 3x needs 3
    expect(s.feedback).toMatchObject({ key: 'countAgain', params: { text: '3x', have: 2, count: 3 }, bad: true });
    s = run(newTermSession(EX1), tool('box'), draw(0, 0), draw(5, 6), tool('circle'), draw(1, 2), draw(3, 4), check, check);
    expect(s.feedback).toMatchObject({ key: 'needPieces', params: { text: '3x', phrase: '3 boxes' } });
    expect(s.tries.draw).toBe(1);
    s = run(s, pick('counter', '+'), zone(0), check);
    expect(s.feedback.key).toBe('drawBoxes');
    s = run(atDraw(), pick('box', '-'), zone(0), zone(0), zone(0), check);        // negative boxes for 3x
    expect(s.feedback).toMatchObject({ key: 'needPieces', params: { phrase: '3 boxes' } });
    s = run(drawAll(atDraw()), piece(1, 0), pick('box', '+'), zone(1), check);    // a box above − 5
    expect(s.feedback.key).toBe('drawCounters');
  });

  it('says what a subtracted term needs, in the sign it is worth', () => {
    const e = makeExpression([n('+', -5), x('-', 2), x('-', 1), n('-', -7)]);       // −5 − 2x − x − (−7)
    let s = run(newTermSession(e), tool('circle'), draw(0, 0), tool('box'), draw(1, 2), draw(3, 4), tool('circle'), draw(5, 6), check);
    expect(s.step).toBe('draw');
    s = run(s, check);
    expect(s.feedback).toMatchObject({ key: 'needPieces', params: { text: '−5', phrase: '5 negatives' } });
    s = run(s, pick('counter', '-'), ...Array(5).fill(zone(0)), pick('box', '-'), ...Array(2).fill(zone(1)), zone(2), check);
    expect(s.feedback).toMatchObject({ key: 'needPieces', params: { text: '− (−7)', phrase: '7 positives' } });
    s = run(s, pick('counter', '+'), ...Array(7).fill(zone(3)));
    expect(s.pieces[3].every((p) => p.opposite)).toBe(true);   // the rewritten term's pieces are magenta
    expect(run(s, check).step).toBe('cancel');
  });

  it('goes on to Cancel when pairs can cancel, and straight to Answer when none can', () => {
    expect(run(drawAll(atDraw()), check)).toMatchObject({ step: 'cancel', feedback: { key: 'drawDone' } });
    const plain = makeExpression([x('+', 2), n('+', 3), x('+', 1)]);
    let s = run(newTermSession(plain), tool('box'), draw(0, 0), draw(3, 4), tool('circle'), draw(1, 2), check);
    s = run(s, pick('box', '+'), zone(0), zone(0), zone(2), pick('counter', '+'), zone(1), zone(1), zone(1), check);
    expect(s).toMatchObject({ step: 'answer', skipped: ['cancel'], feedback: { key: 'drawDoneNoCancel' } });
  });
});

describe('Boxes & Circles session: Cancel', () => {
  const atCancel = () => run(drawAll(atDraw()), check);

  it('cancels a pair: tap a piece, then its opposite, in either order', () => {
    let s = run(atCancel(), piece(0, 0));
    expect(s).toMatchObject({ selected: { term: 0, index: 0 }, feedback: { key: 'cancelPick' } });
    s = run(s, piece(3, 0));                          // the − box
    expect(s.pieces[0][0].canceled && s.pieces[3][0].canceled).toBe(true);
    expect(s.selected).toBeNull();
    expect(s.pairs).toEqual([[[0, 0], [3, 0]]]);
    s = run(s, piece(1, 2), piece(2, 4));             // a − then a +: the other way round
    expect(s.pairs).toHaveLength(2);
  });

  it('lets go of a piece tapped twice, and ignores canceled ones', () => {
    let s = run(atCancel(), piece(1, 0), piece(1, 0));
    expect(s.selected).toBeNull();
    s = run(s, piece(0, 0), piece(3, 0), piece(0, 0));
    expect(s.feedback.key).toBe('alreadyCanceled');
    expect(s.selected).toBeNull();
  });

  it('says why a pair does not work, keeps the first piece, and counts the try', () => {
    let s = run(atCancel(), piece(0, 0), piece(1, 0));      // a box and a number
    expect(s).toMatchObject({ feedback: { key: 'notLikeTerms', bad: true }, selected: { term: 0, index: 0 }, tries: { cancel: 1 } });
    s = run(s, piece(0, 1));                                // two boxes
    expect(s.feedback.key).toBe('pairIsPlusMinus');
    s = run(atCancel(), piece(1, 0), piece(1, 1));          // two negatives
    expect(s.feedback.key).toBe('pairIsPlusMinus');
    expect(s.pairs).toEqual([]);
  });

  it('undoes the latest pair', () => {
    let s = run(atCancel(), piece(0, 0), piece(3, 0), piece(1, 0), piece(2, 0));
    s = run(s, { type: 'undo' });
    expect(s.pairs).toHaveLength(1);
    expect(s.pieces[1][0].canceled || s.pieces[2][0].canceled).toBe(false);
    s = run(s, { type: 'undo' }, { type: 'undo' });
    expect(s.pairs).toEqual([]);
    expect(s.pieces.flat().some((p) => p.canceled)).toBe(false);
  });

  it('moves on to Answer by itself when every pair is canceled, and not before', () => {
    let s = atCancel();
    s = run(s, piece(0, 0), piece(3, 0));                              // the box pair
    expect(s.step).toBe('cancel');
    for (let i = 0; i < 5; i++) s = run(s, piece(1, i), piece(2, i));  // five counter pairs
    expect(s).toMatchObject({ step: 'answer', feedback: { key: 'cancelDone' } });
    expect(fullyCanceled(s.pieces)).toBe(true);
  });
});

describe('Boxes & Circles session: Answer', () => {
  const atAnswer = () => {
    let s = run(drawAll(atDraw()), check, piece(0, 0), piece(3, 0));
    for (let i = 0; i < 5; i++) s = run(s, piece(1, i), piece(2, i));
    return s;
  };

  it('types digits, x, + and −, and Backspace takes one back', () => {
    let s = run(atAnswer(), ...typed('2x+2'));
    expect(s.entry).toBe('2x+2');
    s = run(s, { type: 'backspace' }, { type: 'backspace' }, ...typed('-3'));
    expect(s.entry).toBe('2x-3');
    expect(reduceTerms(run(newTermSession(EX1), { type: 'typeChar', ch: 'x' }), { type: 'backspace' }).entry).toBe('');
  });

  it('stops typing at 12 characters, and ignores other characters', () => {
    const s = run(atAnswer(), ...typed('1234567890123456'));
    expect(s.entry).toHaveLength(12);
    expect(reduceTerms(s, { type: 'typeChar', ch: 'q' })).toBe(s);
  });

  it('accepts the right answer in either order, as x or 1x, and goes on', () => {
    for (const [t, shown] of [['2x+2', '2x + 2'], ['2+2x', '2 + 2x'], ['2x+2', '2x + 2']]) {
      const s = run(atAnswer(), ...typed(t), check);
      expect(s, t).toMatchObject({ step: 'done', finalText: shown, feedback: { key: 'correct', params: { answer: '2x + 2' } } });
    }
  });

  it('says what is wrong without giving the number', () => {
    const wrongTry = (t) => run(atAnswer(), ...typed(t), check);
    expect(wrongTry('').feedback.key).toBe('typeAnswer');
    expect(wrongTry('').tries.answer ?? 0).toBe(0);
    expect(wrongTry('2x+').feedback.key).toBe('answerUnreadable');
    expect(wrongTry('2x+3-1').feedback.key).toBe('combineAll');
    expect(wrongTry('2x+0').feedback.key).toBe('noZeroTerm');
    expect(wrongTry('3x+2').feedback.key).toBe('checkBoxes');
    expect(wrongTry('2x+3').feedback.key).toBe('checkNumbers');
    expect(wrongTry('-2x+2').feedback.key).toBe('checkBoxes');
    expect(wrongTry('2x+3').tries.answer).toBe(1);
  });

  it('can be played from the first tap to the last on every problem the levels make', () => {
    for (const level of [1, 2, 3, 4, 5]) for (let seed = 1; seed <= 12; seed++) for (const e of generateTermLevel(level, seed * 7)) {
      let s = newTermSession(e);
      let part = 0;
      for (let i = 0; i < e.terms.length; i++) {
        const last = part + (i === 0 ? 0 : 1);
        s = run(s, tool(e.terms[i].kind === 'x' ? 'box' : 'circle'), draw(part, last));
        part = last + 1;
      }
      s = run(s, check);
      for (let i = 0; i < e.terms.length; i++) {
        const eff = e.terms[i].op === '-' ? -e.terms[i].value : e.terms[i].value;
        s = run(s, pick(e.terms[i].kind === 'x' ? 'box' : 'counter', eff < 0 ? '-' : '+'), ...Array(Math.abs(eff)).fill(zone(i)));
      }
      s = run(s, check);
      expect(['cancel', 'answer'], `${level}`).toContain(s.step);
      // cancel greedily: the first live + and − of the same type
      for (let guard = 0; s.step === 'cancel' && guard < 40; guard++) {
        const live = s.pieces.flatMap((c, t) => c.map((p, k) => ({ t, k, p }))).filter((o) => !o.p.canceled);
        const a = live[0];
        const b = live.find((o) => o.p.type === a.p.type && o.p.sign !== a.p.sign);
        if (!b) { const alt = live.find((o) => live.some((q) => q.p.type === o.p.type && q.p.sign !== o.p.sign)); const mate = live.find((q) => q.p.type === alt.p.type && q.p.sign !== alt.p.sign); s = run(s, piece(alt.t, alt.k), piece(mate.t, mate.k)); } else s = run(s, piece(a.t, a.k), piece(b.t, b.k));
      }
      expect(s.step, `${level}`).toBe('answer');
      s = run(s, ...typed(formatAnswer(evaluate(e)).replace(/\s/g, '').replace(/−/g, '-')), check);
      expect(s.step, `${level}`).toBe('done');
    }
  });
});

describe('Boxes & Circles session: Rewrite (Levels 4–5)', () => {
  // 4x − (−2x) + 3: the second term subtracts a negative. Parts: 0=4x, 1=−, 2=(−2x), 3=+, 4=3
  const SUBNEG = { ...makeExpression([x('+', 4), x('-', -2), n('+', 3)]), level: 4 };
  const flip = (term, part) => ({ type: 'flip', term, part });

  it('starts at Rewrite on Levels 4–5 only, and the step bar says so', () => {
    expect(newTermSession(SUBNEG)).toMatchObject({ step: 'rewrite', feedback: { key: 'rewriteIntro' } });
    expect(newTermSession(EX1).step).toBe('boxcircle');
    expect(newTermSession({ ...EX1, level: 3 }).step).toBe('boxcircle');
    expect(termSteps(SUBNEG).map((t) => t.id)).toEqual(['rewrite', 'boxcircle', 'draw', 'cancel', 'answer']);
    expect(termSteps(EX1).map((t) => t.id)).toEqual(['boxcircle', 'draw', 'cancel', 'answer']);
  });

  it('needs both signs flipped, in either order, and goes on when they are', () => {
    let s = run(newTermSession(SUBNEG), flip(1, 'num'));
    expect(s).toMatchObject({ step: 'rewrite', feedback: { key: 'flipBoth' } });
    s = run(s, flip(1, 'op'));
    expect(s).toMatchObject({ step: 'boxcircle', feedback: { key: 'rewriteDone' } });
    const t = run(newTermSession(SUBNEG), flip(1, 'op'), flip(1, 'num'));
    expect(t.step).toBe('boxcircle');
  });

  it('flips back when tapped again, and flipPart reads the Mat\'s part index', () => {
    let s = run(newTermSession(SUBNEG), { type: 'flipPart', index: 1 });
    expect(s.flips).toEqual({ '1:op': true });
    s = run(s, { type: 'flipPart', index: 1 });
    expect(s.flips).toEqual({});
    expect(run(newTermSession(SUBNEG), { type: 'flipPart', index: 99 }).flips).toEqual({});
  });

  it('tapping a term that needs no flip is a wrong try', () => {
    const s = run(newTermSession(SUBNEG), flip(0, 'num'));
    expect(s).toMatchObject({ step: 'rewrite', tries: { rewrite: 1 }, feedback: { key: 'notNegative', bad: true } });
  });

  it('Nothing to rewrite works only when nothing subtracts a negative', () => {
    const wrong = run(newTermSession(SUBNEG), { type: 'nothingToRewrite' });
    expect(wrong).toMatchObject({ step: 'rewrite', feedback: { key: 'somethingToRewrite', bad: true } });
    const plain = { ...EX1, level: 5 };
    expect(run(newTermSession(plain), { type: 'nothingToRewrite' })).toMatchObject({ step: 'boxcircle', feedback: { key: 'nothingToRewriteOk' } });
  });

  it('nothing else works until Rewrite is done', () => {
    const s = newTermSession(SUBNEG);
    for (const a of [tool('box'), draw(0, 0), { type: 'check' }, { type: 'digit', digit: 1 }]) expect(reduceTerms(s, a)).toBe(s);
  });

  it('plays a Level 4 problem start to finish, with magenta pieces for the rewritten term', () => {
    let s = run(newTermSession(SUBNEG), flip(1, 'op'), flip(1, 'num'),
      tool('box'), draw(0, 0), draw(1, 2), tool('circle'), draw(3, 4), check);
    expect(s.step).toBe('draw');
    s = run(s, { type: 'pickPiece', pieceType: 'box', sign: '+' }, ...Array(4).fill({ type: 'tapZone', term: 0 }), ...Array(2).fill({ type: 'tapZone', term: 1 }),
      { type: 'pickPiece', pieceType: 'counter', sign: '+' }, ...Array(3).fill({ type: 'tapZone', term: 2 }), check);
    expect(s.pieces[1].every((p) => p.opposite)).toBe(true);
    expect(s.step).toBe('answer');
    s = run(s, ...typed('6x+3'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '6x + 3' });
  });

  it('the pack\'s generator hands each problem its level, and every Level 4–5 set plays through', () => {
    for (const level of [4, 5]) {
      for (const e of boxes.generate(level, 11)) {
        expect(e.level).toBe(level);
        expect(newTermSession(e).step).toBe('rewrite');
      }
    }
  });
});
