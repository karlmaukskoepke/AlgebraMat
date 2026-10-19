// Divide it's move as a blank (Build D, Part 4; Karl chose it in rev 2 of the brief): the five fraction buttons are gone. Hovering the
// move previews it on the equation (`▢(5x) = ▢(−15)`, dashed); choosing it opens the blank, a fraction typed as `1/5` (or its top and
// bottom filled), and the green Go takes that fraction of both sides through the card's own `take`. A layer round Divide it's reducer,
// like Add's (addBothLights.js): the engine, its rows, its save bits and its class-sheet words are unchanged. No DOM here.

import { isTyping, typeInto } from './entry.js';
import { xAlone, coefOf } from './divideMoves.js';
import { FRACTIONS } from './divide.js';

const FB0 = { num: '', den: '', part: 'num' };

// The one Multiply button (Build D-2, Part 4): a click opens three options beside it, `s.mopts`: a whole number ▢ × ( ), a fraction
// ▢/▢ × ( ), and −1 × ( ). Hovering one previews it (`ui.preview` is its kind); clicking it makes it solid. The fraction is the move
// (the card's own `choose`, then the blank); a whole number or −1 is applied to nothing here: Go says why it does not get one x.
export const MULT_KINDS = ['whole', 'frac', 'flip'];
export const multOpen = (s) => Boolean(s.mopts);
const okWhole = (t) => /^-?\d+$/.test(t ?? '');

// Can the move be previewed (hovered) right now? Is its blank open?
export const canPreview = (s) => s.stage === 'moves' && !s.sub && !s.deal && !s.diag && !s.fail && !s.needUndo && s.menu !== 'fraction' && !xAlone(s.board) && !s.mopts?.kind;
export const fracOpen = (s) => s.stage === 'moves' && s.menu === 'fraction' && !s.sub && !s.deal && !s.fail && !s.spot?.choose && s.typing !== 'answer';
// The fraction in the blank: { n } when it is 1 over 2..6 (a top left empty counts as 1), else null.
export function fracOf(fb) {
  if (!fb || !/^\d+$/.test(fb.den)) return null;
  const num = fb.num === '' ? 1 : Number(fb.num);
  const n = Number(fb.den);
  return num === 1 && FRACTIONS.includes(n) ? { n } : null;
}

export function withFractionBlank(reduce) {
  const inner = fractionBlank(reduce);
  return (state, action) => {
    const m = state.mopts;
    if (action.type === 'multOpen') {
      if (m && !m.kind) return { ...state, mopts: null, ui: { ...(state.ui ?? {}), preview: false } };     // a second click closes them
      const base = fracOpen(state) ? { ...state, menu: null, fb: FB0 } : state;
      const probe = reduce(base, { type: 'choose', move: 'fraction' });
      if (probe === base || probe.menu !== 'fraction') return probe;                    // not now (the card says why)
      return { ...base, mopts: { kind: null, entry: '' }, typing: null, feedback: null, ui: { ...(base.ui ?? {}), preview: false } };
    }
    if (action.type === 'multPick' && m && MULT_KINDS.includes(action.kind)) {
      if (action.kind === 'frac') return inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
      return { ...state, mopts: { kind: action.kind, entry: '' }, feedback: null, ui: { ...(state.ui ?? {}), preview: false } };
    }
    if (m?.kind && action.type !== 'ui') {
      if (m.kind === 'whole' && isTyping(action)) {
        const entry = typeInto(m.entry, action, 'integer');
        return entry === m.entry ? state : { ...state, mopts: { ...m, entry }, feedback: null };
      }
      if (action.type === 'go') {
        if (m.kind === 'whole' && !okWhole(m.entry)) return { ...state, feedback: { key: 'dBlankBad', params: {}, bad: true } };
        const a = coefOf(state.board);
        const n = m.kind === 'flip' ? -1 : Number(m.entry);
        return { ...state, feedback: { key: m.kind === 'flip' ? 'dFlipNo' : n === 0 ? 'dZeroNo' : 'dWholeNo', params: { n, a, made: n * a }, bad: true } };
      }
      if (action.type === 'undo' || action.type === 'lxCancel') return { ...state, mopts: null, feedback: null };
    }
    const s = inner(m && action.type !== 'ui' ? { ...state, mopts: null } : state, action);
    return s;
  };
}

function fractionBlank(reduce) {
  return (state, action) => {
    if (action.type === 'ui') {
      if ('fieldCursor' in (action.patch ?? {})) {
        const on = Boolean(action.patch.fieldCursor);
        return (state.ui?.fieldCursor ?? false) === on ? state : { ...state, ui: { ...(state.ui ?? {}), fieldCursor: on } };
      }
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
        if (v === fb[fb.part]) return state;
        // one digit each (Build D-2, Part 4): a second digit is not a unit fraction (66, 55)
        if (v.replace('-', '').length > 1) return { ...state, feedback: { key: 'dUnitFraction', params: {}, bad: false } };
        const done = /\d/.test(v);
        // the top's digit typed (or − and a digit): the cursor jumps to the bottom
        if (fb.part === 'num') return { ...state, fb: { ...fb, num: v, part: done ? 'den' : 'num' }, feedback: null };
        const next = { ...state, fb: { ...fb, den: v } };
        // a top that is not 1 over a bottom: not a unit fraction
        return done && fb.num !== '' && fb.num !== '1' ? { ...next, feedback: { key: 'dUnitFraction', params: {}, bad: false } } : { ...next, feedback: null };
      }
      if (action.type === 'fracStuck') return { ...state, feedback: { key: 'dUnitFraction', params: {}, bad: false } };
      if (action.type === 'focus' && (action.target === 'num' || action.target === 'den')) return { ...state, fb: { ...fb, part: action.target } };
      if (action.type === 'go') {
        const f = fracOf(fb);
        if (!f) return { ...state, fb: { ...fb, part: fb.den ? fb.part : 'den' }, feedback: { key: 'dBlankBad', params: {}, bad: true } };
        const s = reduce({ ...state, fb: FB0 }, { type: 'take', n: f.n });
        return s;
      }
    }
    const r = reduce(state, action);
    if (r === state) return state;
    // x = clicked shows its blinking cursor until anything else happens (Build D-2, Part 2)
    const cursor = action.type === 'focus' && action.target === 'answer';
    const s = (r.ui?.fieldCursor ?? false) === cursor ? r : { ...r, ui: { ...(r.ui ?? {}), fieldCursor: cursor } };
    if (action.type === 'choose' && s.menu === 'fraction' && state.menu !== 'fraction') return { ...s, fb: FB0, typing: null, ui: { ...(s.ui ?? {}), preview: false } };
    if (s.ui?.preview) return { ...s, ui: { ...s.ui, preview: false } };
    return s;
  };
}
