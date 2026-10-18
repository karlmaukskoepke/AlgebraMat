// Divide it's move as a blank (Build D, Part 4; Karl chose it in rev 2 of the brief): the five fraction buttons are gone. Hovering the
// move previews it on the equation (`▢(5x) = ▢(−15)`, dashed); choosing it opens the blank, a fraction typed as `1/5` (or its top and
// bottom filled), and the green Go takes that fraction of both sides through the card's own `take`. A layer round Divide it's reducer,
// like Add's (addBothLights.js): the engine, its rows, its save bits and its class-sheet words are unchanged. No DOM here.

import { isTyping, typeInto } from './entry.js';
import { xAlone } from './divideMoves.js';
import { FRACTIONS } from './divide.js';

const FB0 = { num: '', den: '', part: 'num' };

// Can the move be previewed (hovered) right now? Is its blank open?
export const canPreview = (s) => s.stage === 'moves' && !s.sub && !s.deal && !s.diag && !s.fail && !s.needUndo && s.menu !== 'fraction' && !xAlone(s.board);
export const fracOpen = (s) => s.stage === 'moves' && s.menu === 'fraction' && !s.sub && !s.deal && !s.fail && !s.spot?.choose && s.typing !== 'answer';
// The fraction in the blank: { n } when it is 1 over 2..6 (a top left empty counts as 1), else null.
export function fracOf(fb) {
  if (!fb || !/^\d+$/.test(fb.den)) return null;
  const num = fb.num === '' ? 1 : Number(fb.num);
  const n = Number(fb.den);
  return num === 1 && FRACTIONS.includes(n) ? { n } : null;
}

export function withFractionBlank(reduce) {
  return (state, action) => {
    if (action.type === 'ui') {
      const preview = action.patch?.preview;
      if (preview && !canPreview(state)) return state;
      if ((state.ui?.preview ?? false) === (preview ?? false)) return state;
      return { ...state, ui: { ...(state.ui ?? {}), preview: preview ?? false } };
    }
    const fb = state.fb ?? FB0;
    if (fracOpen(state)) {
      // typing goes into the blank: the top, then (after "/") the bottom
      if (action.type === 'fracSlash' || (action.type === 'typeChar' && action.ch === '/')) return { ...state, fb: { ...fb, part: 'den' } };
      if (isTyping(action) && action.type !== 'toggleSign') {
        if (action.type === 'backspace' && fb[fb.part] === '' && fb.part === 'den') return { ...state, fb: { ...fb, part: 'num' } };
        const v = typeInto(fb[fb.part], action, 'integer');
        if (v === fb[fb.part] || v.length > 2) return state;
        // a top of 1 then another digit: the student is typing the bottom (1 then 5 reads as 1/5)
        if (fb.part === 'num' && fb.num === '1' && action.type === 'digit') return { ...state, fb: { ...fb, den: String(action.digit), part: 'den' } };
        return { ...state, fb: { ...fb, [fb.part]: v } };
      }
      if (action.type === 'focus' && (action.target === 'num' || action.target === 'den')) return { ...state, fb: { ...fb, part: action.target } };
      if (action.type === 'go') {
        const f = fracOf(fb);
        if (!f) return { ...state, fb: { ...fb, part: fb.den ? fb.part : 'den' }, feedback: { key: 'dBlankBad', params: {}, bad: true } };
        const s = reduce({ ...state, fb: FB0 }, { type: 'take', n: f.n });
        return s;
      }
    }
    const s = reduce(state, action);
    if (s === state) return state;
    if (action.type === 'choose' && s.menu === 'fraction' && state.menu !== 'fraction') return { ...s, fb: FB0, typing: null, ui: { ...(s.ui ?? {}), preview: false } };
    if (s.ui?.preview) return { ...s, ui: { ...s.ui, preview: false } };
    return s;
  };
}
