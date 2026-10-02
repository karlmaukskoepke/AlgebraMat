import { describe, it, expect } from 'vitest';
import {
  readInteger, classify, firstSupport, nextRung, skillOf, numberWords, spokenNumber, buildCloze, spokenSentence, leftover, clozeFeedbackKey,
} from '../src/engine/scaffold.js';
import { makeProblem, evaluate, partyOrBattle } from '../src/engine/expr.js';
import { generateCombineLevel } from '../src/engine/generateCombine.js';

const P = (a, b) => makeProblem(a, '+', b);
const tag = (a, b, typed) => classify(P(a, b), typed);

describe('reading what was typed', () => {
  it('reads whole numbers with either minus, and nothing else', () => {
    expect(readInteger('-5')).toBe(-5);
    expect(readInteger('−5')).toBe(-5);
    expect(readInteger(' 12 ')).toBe(12);
    expect(readInteger('+7')).toBe(7);
    for (const bad of ['', '-', '5x', '5-3', '--5', '1234', null]) expect(readInteger(bad)).toBeNull();
  });
});

describe('what a wrong answer says: classify', () => {
  it('right answers are right, empty or garbled ones are not a mistake', () => {
    expect(tag(-5, 3, '-2')).toEqual({ correct: true, tag: null });
    expect(tag(-5, 3, '')).toEqual({ correct: false, tag: 'unreadable' });
    expect(tag(-5, 3, '2x')).toEqual({ correct: false, tag: 'unreadable' });
  });

  it('a negative answer typed without its sign is sign-dropped (battle or party)', () => {
    expect(tag(-5, 3, '2').tag).toBe('sign-dropped');         // −5 + 3 = −2
    expect(tag(-4, -6, '10').tag).toBe('sign-dropped');       // −4 + −6 = −10
  });

  it('the right size with the opposite sign when the answer is positive is wrong-winner', () => {
    expect(tag(5, -3, '-2').tag).toBe('wrong-winner');        // 5 + −3 = 2
    expect(tag(8, 4, '-12').tag).toBe('wrong-winner');
  });

  it('a battle answered by adding the sizes is battle-as-party, either sign', () => {
    expect(tag(-5, 3, '-8').tag).toBe('battle-as-party');
    expect(tag(-5, 3, '8').tag).toBe('battle-as-party');
    expect(tag(7, -2, '9').tag).toBe('battle-as-party');
  });

  it('a party answered by subtracting the sizes is party-as-battle, either sign', () => {
    expect(tag(-4, -6, '-2').tag).toBe('party-as-battle');
    expect(tag(-4, -6, '2').tag).toBe('party-as-battle');
    expect(tag(3, 9, '6').tag).toBe('party-as-battle');
  });

  it('anything else is unmatched', () => {
    expect(tag(-5, 3, '7').tag).toBe('unmatched');
    expect(tag(-4, -6, '24').tag).toBe('unmatched');
  });

  it('numbers that fit two signatures get the first that makes sense', () => {
    // −2 + −2 = −4: typing 4 drops the sign; typing 0 is a party answered as a battle (2 − 2).
    expect(tag(-2, -2, '4').tag).toBe('sign-dropped');
    expect(tag(-2, -2, '0').tag).toBe('party-as-battle');
    // A battle whose answer is the other size's negative: −9 + 2 = −7; typing 7 drops the sign, typing 11 adds sizes.
    expect(tag(-9, 2, '7').tag).toBe('sign-dropped');
    expect(tag(-9, 2, '11').tag).toBe('battle-as-party');
  });

  it('every tag has exactly one first support, and I\'m stuck starts at the smallest', () => {
    expect(firstSupport('sign-dropped')).toBe('cloze');
    expect(firstSupport('wrong-winner')).toBe('cloze');
    expect(firstSupport('battle-as-party')).toBe('partyBattle');
    expect(firstSupport('party-as-battle')).toBe('partyBattle');
    expect(firstSupport('unmatched')).toBe('fullWalk');
    expect(firstSupport(null)).toBe('partyBattle');
    expect(nextRung('cloze')).toBe('fullWalk');
    expect(nextRung('partyBattle')).toBe('fullWalk');
    expect(nextRung('fullWalk')).toBeNull();
    expect(['sign-dropped', 'wrong-winner', 'battle-as-party', 'party-as-battle', 'unmatched'].map(skillOf))
      .toEqual(['sign', 'sign', 'partyBattle', 'partyBattle', null]);
  });
});

describe('saying numbers', () => {
  it('spells 0 to 99, and puts "negative" in front', () => {
    expect([0, 5, 13, 20, 24, 99].map(numberWords)).toEqual(['zero', 'five', 'thirteen', 'twenty', 'twenty-four', 'ninety-nine']);
    expect(spokenNumber(-5)).toBe('negative five');
    expect(spokenNumber(3)).toBe('three');
  });
});

describe('the cloze', () => {
  it('writes a battle and a party the way the spec does', () => {
    const battle = buildCloze(P(-5, 3));
    expect(battle.kind).toBe('battle');
    expect(battle.sentence).toBe('The battle of −5 and 3 leaves ____ standing.');
    expect(battle.choices.map((c) => c.text).sort()).toEqual(['negative 2', 'negative 8', 'positive 2', 'positive 8']);
    const party = buildCloze(P(-4, -6));
    expect(party.sentence).toBe('The party of −4 and −6 has ____ in all.');
    expect(party.choices.map((c) => c.text).sort()).toEqual(['negative 10', 'negative 2', 'positive 10', 'positive 2']);
  });

  it('has one right choice, and the wrong ones are the sign and size mistakes', () => {
    const c = buildCloze(P(-5, 3));
    expect(c.choices.filter((x) => x.right)).toHaveLength(1);
    expect(c.choices[c.rightIndex].value).toBe(-2);
    expect(c.choices.map((x) => x.mistake).sort()).toEqual([null, 'sign', 'size', 'size']);
    expect(c.choices.find((x) => x.mistake === 'sign').value).toBe(2);
    expect(clozeFeedbackKey(c.choices[c.rightIndex])).toBe('clozeRight');
    expect(clozeFeedbackKey(c.choices.find((x) => x.mistake === 'sign'))).toBe('clozeSign');
    expect(clozeFeedbackKey(c.choices.find((x) => x.mistake === 'size'))).toBe('clozeSize');
  });

  it('reads the whole sentence aloud with the choice in it, and says what is left over', () => {
    const p = P(-5, 3);
    const c = buildCloze(p);
    expect(spokenSentence(p, c.choices[c.rightIndex])).toBe('The battle of negative five and three leaves negative two standing.');
    expect(spokenSentence(P(-4, -6), buildCloze(P(-4, -6)).choices.find((x) => x.value === 10))).toBe('The party of negative four and negative six has positive ten in all.');
    expect(leftover(c.choices[c.rightIndex])).toEqual({ sign: '-', count: 2 });
  });

  it('works for every problem Combine it hands out: four different choices, never zero, right one is the answer', () => {
    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const p of generateCombineLevel(level, seed)) {
          const c = buildCloze(p);
          const values = c.choices.map((x) => x.value);
          expect(new Set(values).size, JSON.stringify(p)).toBe(4);
          expect(values.every((v) => v !== 0 && Math.abs(v) < 100)).toBe(true);
          expect(c.choices[c.rightIndex].value).toBe(evaluate(p));
          expect(c.kind).toBe(partyOrBattle(p));
          // each wrong choice is a tag classify would recognize as a mistake, or at least not the right answer
          for (const x of c.choices) expect(classify(p, String(x.value)).correct).toBe(x.right);
        }
      }
    }
  });

  it('shows the same order for the same problem, and varies it across problems', () => {
    expect(buildCloze(P(-5, 3)).rightIndex).toBe(buildCloze(P(-5, 3)).rightIndex);
    const spots = new Set();
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) if (a !== b) spots.add(buildCloze(P(-a, b)).rightIndex);
    expect(spots.size).toBeGreaterThan(1);
  });
});

describe('every tag turns up from real answers', () => {
  it('each wrong-answer tag is reachable on Levels 1 to 3', () => {
    const seen = new Set();
    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed <= 30; seed++) {
        for (const p of generateCombineLevel(level, seed)) {
          const a = p.left.value;
          const b = p.right.value;
          const r = evaluate(p);
          for (const t of [-r, Math.abs(r), Math.abs(a) + Math.abs(b), Math.abs(Math.abs(a) - Math.abs(b)), r + 1]) {
            seen.add(classify(p, String(t)).tag);
          }
        }
      }
    }
    for (const t of ['sign-dropped', 'wrong-winner', 'battle-as-party', 'party-as-battle', 'unmatched']) expect(seen.has(t), t).toBe(true);
  });
});
