// The scaffold engine's thinking (SPEC-SCAFFOLD.md §3 and §4), for Combine it's two-term problems:
// what a wrong answer says about the mistake behind it, which support answers that mistake, and the
// cloze that makes a student say the sign. Pure logic, no DOM.

import { evaluate, partyOrBattle, rewrite, MINUS } from './expr.js';

// ---------- Reading what was typed ----------

// "-5", "−5", "5", " + 5 " → a number; anything else (empty, 5x, 5-3) → null.
export function readInteger(text) {
  if (typeof text !== 'string') return null;
  const s = text.replace(/\s+/g, '').replace(/[−–—]/g, '-');
  return /^[+-]?\d{1,3}$/.test(s) ? Number(s) : null;
}

// ---------- What a wrong answer tells us ----------

// Tags (SPEC-JIT.md's catalog):
//   sign-dropped     the size is right and a negative answer was typed without its sign   (I3)
//   wrong-winner     the size is right and the sign is the opposite                       (I3, I5)
//   battle-as-party  a battle answered as if the sizes were added                         (I1)
//   party-as-battle  a party answered as if the smaller size were taken from the larger   (I1)
//   minus-as-minus   a subtraction answered as if the subtracted number's own sign didn't count: 5 − (−3) typed as 2,
//                    the double negative dropped (Flip It; I1 and I2)
//   unmatched        none of these: the full walk
// classify returns { correct, tag }. `tag` is null when correct, and 'unreadable' when nothing usable was typed
// (an empty or garbled answer isn't a mistake, so it isn't a wrong try).
export function classify(problem, typed) {
  const t = readInteger(typed);
  if (t === null) return { correct: false, tag: 'unreadable' };
  const a = problem.left.value;
  const b = problem.right.value;
  const r = evaluate(problem);
  if (t === r) return { correct: true, tag: null };
  if (problem.op === '-' && t === a + b) return { correct: false, tag: 'minus-as-minus' };
  if (r < 0 && t === -r) return { correct: false, tag: 'sign-dropped' };
  if (t === -r) return { correct: false, tag: 'wrong-winner' };
  const battle = partyOrBattle(problem) === 'battle';
  if (battle && Math.abs(t) === Math.abs(a) + Math.abs(b)) return { correct: false, tag: 'battle-as-party' };
  if (!battle && Math.abs(t) === Math.abs(Math.abs(a) - Math.abs(b))) return { correct: false, tag: 'party-as-battle' };
  return { correct: false, tag: 'unmatched' };
}

// ---------- Which support answers which mistake ----------

export const SUPPORTS = ['circle', 'rewrite', 'cloze', 'partyBattle', 'fullWalk'];

const FIRST_SUPPORT = {
  'sign-dropped': 'circle',          // circle each number with its sign, then try again
  'wrong-winner': 'circle',
  'battle-as-party': 'partyBattle',
  'party-as-battle': 'partyBattle',
  'minus-as-minus': 'partyBattle',   // that question first shows the subtraction as adding the opposite
  unmatched: 'fullWalk',
};

// The first support for a mistake. A subtraction goes straight to rewriting it as an addition (click the minus and
// the number's sign), whatever the mistake; with no mistake yet (I'm stuck) an addition gets the smallest support:
// the party-or-battle question.
export function firstSupport(tag, problem = null) {
  if (problem?.op === '-') return 'rewrite';
  return tag == null ? 'partyBattle' : FIRST_SUPPORT[tag] ?? 'fullWalk';
}

// The next rung: another wrong answer, or I'm stuck again. A sign mistake goes circle → cloze → full walk; the rest
// go to the full walk; there's nothing after that.
const NEXT_RUNG = { circle: 'cloze', cloze: 'fullWalk', rewrite: 'fullWalk', partyBattle: 'fullWalk', fullWalk: null };
export const nextRung = (kind) => NEXT_RUNG[kind] ?? null;

// Which skill a mistake belongs to, for the support that stays on (SPEC-SCAFFOLD.md §5).
const SKILL = {
  'sign-dropped': 'sign', 'wrong-winner': 'sign', 'battle-as-party': 'partyBattle', 'party-as-battle': 'partyBattle',
  'minus-as-minus': 'partyBattle',
};
export const skillOf = (tag) => SKILL[tag] ?? null;

// ---------- Saying numbers ----------

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

// 0 to 99 in words: 5 → "five", 24 → "twenty-four".
export function numberWords(n) {
  const v = Math.abs(n);
  if (v < 20) return ONES[v];
  if (v > 99) return String(v);
  return TENS[Math.floor(v / 10)] + (v % 10 ? `-${ONES[v % 10]}` : '');
}

// A signed number as a sentence says it: −5 → "negative five", 3 → "three".
export const spokenNumber = (n) => (n < 0 ? `negative ${numberWords(n)}` : numberWords(n));

// ---------- The cloze ----------
//
//   "The battle of −5 and 3 leaves ____ standing."     negative 2 · positive 2 · negative 8 · positive 8
//   "The party of −4 and −6 has ____ in all."          negative 10 · positive 10 · negative 2 · positive 2
//
// The choices are written with the words "negative" and "positive" so the student has to say the sign, and the
// wrong ones are the common mistakes: the wrong sign, and the sizes combined the wrong way.

const signWord = (v) => (v < 0 ? 'negative' : 'positive');
const choiceText = (v) => `${signWord(v)} ${Math.abs(v)}`;
const termText = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// A small, steady shuffle keyed on the problem, so the right choice isn't always in the same place and a
// given problem always shows the same order.
function orderFor(problem) {
  const key = Math.abs(problem.left.value * 31 + problem.right.value * 17);
  const rotate = key % 4;
  const flip = Math.floor(key / 4) % 2 === 1;
  const base = flip ? [1, 0, 3, 2] : [0, 1, 2, 3];
  return base.map((_, i) => base[(i + rotate) % 4]);
}

// A subtraction is read as the addition it becomes (adding the opposite): 5 − (−3) is the party of 5 and 3.
export function buildCloze(problem) {
  const added = rewrite(problem);
  const a = added.left.value;
  const b = added.right.value;
  const r = evaluate(problem);
  const battle = partyOrBattle(problem) === 'battle';
  const size = Math.abs(r);
  // The wrong-sized answer a student would get from combining the sizes the wrong way.
  let other = battle ? Math.abs(a) + Math.abs(b) : Math.abs(Math.abs(a) - Math.abs(b));
  if (other === 0 || other === size) other = Math.abs(a) === size ? Math.abs(b) + 1 : Math.abs(a);
  const sign = Math.sign(r);
  const raw = [
    { value: r, mistake: null },
    { value: -r, mistake: 'sign' },
    { value: sign * other, mistake: 'size' },
    { value: -sign * other, mistake: 'size' },
  ];
  const choices = orderFor(problem).map((i) => raw[i]).map((c, index) => ({ ...c, index, text: choiceText(c.value), right: c.mistake === null }));
  const sentence = battle
    ? `The battle of ${termText(a)} and ${termText(b)} leaves ____ standing.`
    : `The party of ${termText(a)} and ${termText(b)} has ____ in all.`;
  return { kind: battle ? 'battle' : 'party', sentence, choices, rightIndex: choices.findIndex((c) => c.right) };
}

// What gets read aloud once a choice is picked (never before): the whole sentence with the choice in it.
export function spokenSentence(problem, choice) {
  const added = rewrite(problem);
  const a = spokenNumber(added.left.value);
  const b = spokenNumber(added.right.value);
  const said = `${choice.value < 0 ? 'negative' : 'positive'} ${numberWords(choice.value)}`;
  return partyOrBattle(problem) === 'battle'
    ? `The battle of ${a} and ${b} leaves ${said} standing.`
    : `The party of ${a} and ${b} has ${said} in all.`;
}

// The counters left over after a choice, for the Mat to draw: { sign: '+' | '-', count }.
export const leftover = (choice) => ({ sign: choice.value < 0 ? '-' : '+', count: Math.abs(choice.value) });

// What to say about a wrong choice: its mistake is the wrong sign, or the sizes combined the wrong way.
export const clozeFeedbackKey = (choice) => (choice.right ? 'clozeRight' : choice.mistake === 'sign' ? 'clozeSign' : 'clozeSize');
