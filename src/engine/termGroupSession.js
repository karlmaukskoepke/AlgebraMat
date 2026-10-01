// One Groups of Terms problem's walk through its steps, as a pure reducer (like
// engine/lassoSession.js for Group It). Two scripts (SPEC-GROUPS-OF-TERMS.md §3):
//   whole-number groups: Groups → + or − → Fill → Flip → Answer → Check it
//   fraction groups:     Groups → + or − → Fill → Take → Flip → Answer → Check it
//
// Answer (typed with the pad) comes after Flip; once it's right, Check it shows the distributing
// arrows and the student goes on with Next →.

import { isFraction } from './termGroups.js';
import { prettyAnswer } from './terms.js';
import {
  validateHiddenOne, validateGroups, validateGroupSign, validateFill, validateDeal, validateTake, validateAnswer,
  MAX_GROUPS_MADE, MAX_PARTS, maxInGroup, neededOf, SPARE,
} from './termGroupMoves.js';
import { entryValue } from './session.js';

export const WHOLE_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'flip', label: 'Flip' },
  { id: 'answer', label: 'Answer' },
  { id: 'checkit', label: 'Check it' },
];

export const FRACTION_STEPS = [
  { id: 'groups', label: 'Groups' },
  { id: 'sign', label: '+ or −' },
  { id: 'fill', label: 'Fill' },
  { id: 'take', label: 'Take' },
  { id: 'flip', label: 'Flip' },
  { id: 'answer', label: 'Answer' },
  { id: 'checkit', label: 'Check it' },
];

export const stepsFor = (problem) => (isFraction(problem) ? FRACTION_STEPS : WHOLE_STEPS);

export const MAX_ANSWER_LENGTH = 12;

export function newTermGroupSession(problem) {
  const fraction = isFraction(problem);
  return {
    problem,
    script: fraction ? 'fraction' : 'whole',
    step: 'groups',
    skipped: [],
    wroteOne: !problem.hidden1,  // −(B) problems start with the 1 unwritten: the student types it
    groups: [],                  // [{ pieces: [{ type, sign }], taken, flipped }]
    opposite: false,             // − groups, once chosen in step ②
    pick: null,                  // { type: 'box' | 'counter', sign } the piece Fill adds
    snapshots: [],               // each group's pieces before every change, for Undo
    entry: { digits: '' },        // the hidden 1, while it's being typed
    typed: '',                    // the answer, while it's being typed
    finalText: null,              // the answer as written, once it's right
    tries: {},
    feedback: { key: problem.hidden1 ? 'groupsIntroHidden' : fraction ? 'partsIntro' : 'groupsIntro', params: { d: problem.count.d } },
  };
}

const clone = (s) => structuredClone(s);

function say(s, res) {
  s.feedback = { key: res.feedbackKey, params: res.params, bad: !res.ok };
  return s;
}

function wrong(s, res) {
  s.tries[s.step] = (s.tries[s.step] ?? 0) + 1;
  return say(s, res);
}

const note = (s, key, params) => { s.feedback = { key, params }; return s; };

// The hidden 1 in −(B) is typed in step ①, before any group can be made.
export const oneOpen = (s) => s.step === 'groups' && s.problem.hidden1 && !s.wroteOne;

const countOf = (s, type) => s.groups.reduce((n, g) => n + g.pieces.filter((q) => q.type === type).length, 0);

// Fraction Fill: a kind that has been started but not finished (boxes, then counters, or the other way round).
export const kindInProgress = (s) => ['box', 'counter'].find((type) => {
  const n = countOf(s, type);
  return n > 0 && n < neededOf(s.problem, type);
}) ?? null;

// Fraction Fill: the part that gets the next piece of the kind being dealt (one at a time, top to bottom, around again).
export function nextPart(s) {
  const kind = kindInProgress(s) ?? s.pick?.type ?? null;
  return kind ? countOf(s, kind) % Math.max(1, s.groups.length) : 0;
}

// The groups that flip: every group, or in a fraction the parts taken.
export const flippable = (s) => s.groups.map((g, i) => i).filter((i) => s.script === 'whole' || s.groups[i].taken);

function flipGroup(s, i) {
  const g = s.groups[i];
  if (!g || g.flipped || !flippable(s).includes(i)) return false;
  g.flipped = true;
  return true;
}

const allFlipped = (s) => flippable(s).every((i) => s.groups[i].flipped);

function pushSnapshot(s) {
  s.snapshots.push(s.groups.map((g) => g.pieces.map((q) => ({ ...q }))));
}

// After Fill the student flips (− groups), takes (fractions) or answers; those steps come later.
function afterFill(s, res) {
  say(s, res);
  if (s.script === 'fraction') s.step = 'take';
  else if (s.opposite) s.step = 'flip';
  else { s.skipped.push('flip'); s.step = 'answer'; }
  return s;
}

export function reduceTermGroups(state, action) {
  const s = clone(state);
  const { problem } = s;
  const fraction = s.script === 'fraction';

  switch (action.type) {
    case 'addGroup': {
      if (s.step !== 'groups') return state;
      if (!s.wroteOne) return wrong(s, { ok: false, feedbackKey: 'writeOneFirst' });
      if (s.groups.length >= (fraction ? MAX_PARTS : MAX_GROUPS_MADE)) return note(s, 'tooManyGroups');
      s.groups.push({ pieces: [], taken: false, flipped: false });
      return s;
    }

    case 'pickPiece': {
      if (s.step !== 'fill' || !['box', 'counter'].includes(action.pieceType) || !['+', '-'].includes(action.sign)) return state;
      s.pick = { type: action.pieceType, sign: action.sign };
      return s;
    }

    case 'tapGroup': {
      const i = action.index;
      const g = s.groups[i];
      if (!g) return state;

      if (s.step === 'groups') { // tapping a group erases it
        s.groups.splice(i, 1);
        return s;
      }
      if (s.step === 'take') { // tapping a part takes it (tap again to put it back)
        g.taken = !g.taken;
        return note(s, 'takeIntro', { n: problem.count.n });
      }
      if (s.step === 'flip') return reduceTermGroups(state, { type: 'flipGroup', index: i });
      if (s.step !== 'fill') return state;
      if (!s.pick) return note(s, 'pickPieceFirst');

      if (fraction) {
        const started = kindInProgress(s);
        if (started && s.pick.type !== started) return note(s, 'finishKind', { kind: started });
        if (i !== nextPart(s)) return note(s, 'dealHere');
        if (countOf(s, s.pick.type) >= neededOf(problem, s.pick.type) + SPARE) return note(s, 'groupFull');
      } else if (g.pieces.length >= maxInGroup(problem)) {
        return note(s, 'groupFull');
      }
      pushSnapshot(s);
      g.pieces.push({ type: s.pick.type, sign: s.pick.sign });
      return note(s, fraction ? 'dealIntro' : 'fillIntro');
    }

    // Copy to all: the first group's pieces are repeated in every other group.
    case 'copyAll': {
      if (s.step !== 'fill' || fraction) return state;
      if (s.groups.length === 0 || s.groups[0].pieces.length === 0) return note(s, 'copyNeedsFirst');
      pushSnapshot(s);
      const first = s.groups[0].pieces;
      s.groups.forEach((g, i) => { if (i > 0) g.pieces = first.map((q) => ({ ...q })); });
      return note(s, 'copied');
    }

    case 'undo': { // takes back the latest piece or copy
      if (s.step !== 'fill' || s.snapshots.length === 0) return state;
      const before = s.snapshots.pop();
      s.groups.forEach((g, i) => { g.pieces = before[i] ?? g.pieces; });
      return s;
    }

    // Flip: tap a group's − to flip that group (in a fraction bar, the one − flips the parts
    // taken), or Flip all for every one at once. The original stays; its opposite is redrawn.
    case 'flipGroup':
    case 'flipAll': {
      if (s.step !== 'flip') return state;
      const targets = action.type === 'flipAll' || fraction ? flippable(s) : [action.index];
      if (!targets.map((i) => flipGroup(s, i)).some(Boolean)) return state;
      if (allFlipped(s)) {
        s.step = 'answer';
        return note(s, 'flipDone', { fraction });
      }
      return note(s, 'flipMore');
    }

    case 'chooseSign': {
      if (s.step !== 'sign') return state;
      const res = validateGroupSign(problem, action.sign);
      if (!res.ok) return wrong(s, res);
      s.opposite = action.sign === '-';
      s.step = 'fill';
      return say(s, res);
    }

    case 'check': {
      if (s.step === 'groups' && oneOpen(s)) { // type the hidden 1, then Check
        const res = validateHiddenOne(entryValue({ negative: false, digits: s.entry.digits }));
        if (!res.ok) return res.feedbackKey === 'typeOne' ? say(s, res) : wrong(s, res);
        s.wroteOne = true;
        s.entry = { digits: '' };
        return say(s, res);
      }
      if (s.step === 'groups') {
        const res = validateGroups(problem, { count: s.groups.length, wroteOne: s.wroteOne });
        if (!res.ok) return wrong(s, res);
        s.step = 'sign';
        return say(s, res);
      }
      if (s.step === 'fill') {
        const res = fraction ? validateDeal(problem, s.groups) : validateFill(problem, s.groups);
        if (!res.ok) return wrong(s, res);
        return afterFill(s, res);
      }
      if (s.step === 'take') {
        const res = validateTake(problem, s.groups);
        if (!res.ok) return wrong(s, res);
        say(s, res);
        if (s.opposite) { s.step = 'flip'; return s; }
        s.skipped.push('flip');
        s.step = 'answer';
        return s;
      }
      if (s.step === 'flip') return note(s, fraction ? 'tapFlipBar' : 'tapFlip');
      if (s.step === 'answer') {
        const res = validateAnswer(problem, s.typed);
        if (!res.ok) return res.feedbackKey === 'typeAnswer' ? say(s, res) : wrong(s, res);
        s.finalText = prettyAnswer(s.typed);
        s.step = 'checkit';
        return say(s, res);
      }
      return state;
    }

    // The pad types the hidden 1 (one positive digit), or the answer.
    case 'digit': {
      if (!Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return state;
      if (s.step === 'answer') {
        if (s.typed.length >= MAX_ANSWER_LENGTH) return state;
        s.typed += String(action.digit);
        return s;
      }
      if (!oneOpen(s) || s.entry.digits.length >= 1) return state;
      s.entry.digits = String(action.digit);
      return s;
    }

    case 'typeChar': {
      if (s.step !== 'answer' || !['x', '+', '-'].includes(action.ch) || s.typed.length >= MAX_ANSWER_LENGTH) return state;
      s.typed += action.ch;
      return s;
    }

    case 'backspace': {
      if (s.step === 'answer') {
        if (s.typed === '') return state;
        s.typed = s.typed.slice(0, -1);
        return s;
      }
      if (!oneOpen(s)) return state;
      s.entry.digits = s.entry.digits.slice(0, -1);
      return s;
    }

    default:
      return state;
  }
}
