// What Fractions of x says (Build AA), always with the real numbers, in the form on the screen: fraction words for `⅔x` ("⅔ of x"),
// divide-by words for `2x/3` and `x/3` ("x divided by 3"). Keys it does not define fall through to Flip everything's (the flip, Trade
// places), then Divide it's and Add to both sides' (the check, the blanks, "Yes!").

import { flipFeedbackText } from './flipFeedback.js';

const s = (n) => (Number(n) === 1 ? '' : 's');
const M = {
  // the reminders: I'm stuck's second click, and the hint after a move and Undo (solveit/rungs/fractions.js)
  xUnitHint: (p) => (p.form === 'over'
    ? `x/${p.q} means x divided by ${p.q}. Multiply both sides by ${p.q} to cancel the divide by ${p.q}.`
    : `${p.frac}x means ${p.frac} of x: one of ${p.q} equal parts is ${p.b}. Multiply both sides by ${p.q} to make the whole x.`),
  xNonUnitHint: (p) => `${p.frac}x means ${p.frac} of x: ${p.p} of ${p.q} equal parts make ${p.b}. Divide both sides by ${p.p}: one part is ${p.unit}x = ${p.part}.`,
  xOverHint: (p) => (p.form === 'over'
    ? `${p.was} means ${p.was.replace(`/${p.q}`, '')} divided by ${p.q}. Multiply both sides by ${p.q} to cancel the divide by ${p.q}.`
    : `${p.was} is ${p.p} of ${p.q} equal parts of x. Multiply both sides by ${p.q} to put the ${p.q} parts back together.`),
  xNegHint: (p) => (p.form === 'over'
    ? `${p.was} has a minus. Flip everything (multiply both sides by −1), or multiply both sides by ${p.q} to cancel the divide by ${p.q}: either order works.`
    : `${p.was} has a minus. Flip everything (multiply both sides by −1), or multiply both sides by ${p.q} first: either order works.`),
  xWholeHint: (p) => `${p.a}x means ${p.a} · x. Divide both sides by ${p.a}.`,
  xTimesHint: (p) => `x is ${p.m}(${p.b}): ${p.m} groups of ${p.b}. Work it out, then type x.`,
  // a legal move that does not help (the spotlight, then Undo)
  xMultNo: (p) => (p.form === 'over'
    ? `Multiplying ${p.was} by ${p.m} makes ${p.made}: the divide by ${p.q} is still there. Press Undo.`
    : `Multiplying ${p.was} by ${p.m} makes ${p.made}: x is still cut into parts. Press Undo.`),
  xMultWhole: (p) => `Multiplying ${p.was} by ${p.m} makes ${p.made}: further from one x. Press Undo.`,
  xDivNo: (p) => (p.form === 'over'
    ? `Dividing ${p.was} by ${p.n} makes ${p.made}: the bottom got bigger. Press Undo.`
    : `Dividing ${p.was} by ${p.n} makes ${p.made}: smaller parts, not one x. Press Undo.`),
  xDivSplit: (p) => `${p.b} does not split into ${p.n} equal whole parts. Press Undo.`,
  aUndone: () => 'Undone. Try another move.',
  xWrong: (p) => `When x = ${p.typed}, the equation is not balanced.`,
  // the rewrite toggle: Level 2's one-time instruction (a pop-up below the action)
  xRewriteIntro: (p) => `Tap the fraction to rewrite ${p.was} as ${p.now}. To cancel the divide by ${p.q}, multiply both sides by ${p.q}.`,
  xRewritten: (p) => `${p.was} and ${p.now} are the same: rewritten.`,
  // the model (drawn in the model's own caption, never over the work)
  mCutAsk: (p) => `${p.after ? 'Let’s model it. ' : ''}The whole box is x. Cut it into equal parts: how many does the fraction’s bottom say?`,
  mCutWrong: (p) => `The fraction’s bottom is ${p.q}: cut the box into ${p.q} equal parts.`,
  mSelectAsk: (p) => `The fraction says ${p.p} of the ${p.q} parts make ${p.given}. Click ${p.p} part${s(p.p)}, then Go.`,
  mSelectWrong: (p) => `The fraction says ${p.p} of the ${p.q} parts.`,
  mValueAsk: (p) => `These ${p.p} parts make ${p.given}. What does 1 part make? Type it, then Go.`,
  mValueType: () => 'Type what 1 part makes, then Go.',
  mValueWrong: (p) => `${p.p} parts make ${p.given}. What does 1 part make?`,
  mFillAsk: (p) => `Every part is the same: ${p.part}. Click each empty part to fill it.`,
  mFillSelected: (p) => `That part is already filled. Click the empty part${s(p.rest)}.`,
  mXAsk: () => 'The whole box is x. Add up the parts and type x.',
  mXAgain: (p) => `x is the whole box: all ${p.q} parts. Add them up and type x.`,
};
export const MODEL_KEYS = new Set(Object.keys(M).filter((k) => k.startsWith('m')));
export const MODEL_BAD = new Set(['mCutWrong', 'mSelectWrong', 'mValueWrong', 'mFillSelected']);

export function fractionsFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : flipFeedbackText(fb);
}
