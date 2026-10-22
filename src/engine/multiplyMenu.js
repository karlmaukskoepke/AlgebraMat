// The Multiply move's menu and its blanks, shared by every card that multiplies both sides (lifted out of Divide it in Build J;
// before that it was Divide's own: Build D, Part 4 and Build D-2, Part 4). The one Multiply button opens three options beside it,
// `s.mopts` (Build L, loop rev 2.3): Multiply, a whole number ▢ × ( ); Divide, 1/▢ × ( ) (the student types only n, one digit, a minus
// allowed); and Fraction, ▢/▢ × ( ). Hovering one previews it on the equation (`ui.preview` is its kind); clicking it makes it solid.
// Flip everything is not an option: it is the card's own panel button (`flipPick`), and typing −1 in Multiply (or dividing by −1) is the
// same move. Dividing by n is taking 1/n of both sides through the card's own `take` (−n is −1/n: the sign on the top), the same code
// path as the Fraction blank (typed `1/5`, or its top and bottom filled). A card says what each option is on it:
//   'live'     the move (Divide; Flip everything, which the card's own `flip` applies)
//   'explain'  Go says why it does not get one x (Divide it's whole number and −1)
//   'grey'     a tap says it unlocks later (or the card's own reason)
// A layer round the card's reducer, like Add's (addBothLights.js): the engine, its rows and its save bits are the card's. No DOM here.
//
//   makeMultiplyMenu({ xAlone, coefOf, option(kind, s), probe, negTop })
//     option   what 'whole', 'div', 'frac' and 'flip' are on this card (default: Divide it's)
//     probe    the move the Multiply button checks with the card before it opens (the card's `choose` puts it in s.menu, or says why not)
//     negTop   the fraction's top may be −1, and Divide may take a negative (Flip everything accepts −⅓ of both sides in one move)
//     greyKey  what a greyed option says when tapped (default: "That move unlocks on a later card.")

import { isTyping, typeInto } from './entry.js';
import { FRACTIONS } from './divide.js';

const FB0 = { num: '', den: '', part: 'num' };
// the options, in order (Build L: Flip everything left the menu; it is its own button)
export const MULT_KINDS = ['whole', 'div', 'frac'];
export const multOpen = (s) => Boolean(s.mopts);
const okWhole = (t) => /^-?\d+$/.test(t ?? '');
// Divide's blank holds one digit, with a minus allowed
export const okDivisor = (t) => /^-?\d$/.test(t ?? '');
// Is the green Go live for the option chosen? (−1 is Flip everything, with nothing to type)
export const goReady = (m) => m.kind === 'flip' || (m.kind === 'whole' && okWhole(m.entry)) || (m.kind === 'div' && okDivisor(m.entry));
// Divide it's options: Divide is the move; a whole number and −1 are explained; the general fraction belongs to a later card
const DIVIDE_IT = { whole: 'explain', div: 'live', frac: 'grey', flip: 'explain' };

export function makeMultiplyMenu({ xAlone, coefOf, option = (kind) => DIVIDE_IT[kind], greyKey = () => 'aLater', probe = 'fraction', negTop = false }) {
  // Can the move be previewed (hovered) right now? Is its blank open?
  const canPreview = (s) => s.stage === 'moves' && !s.sub && !s.deal && !s.diag && !s.fail && !s.needUndo && s.menu !== 'fraction' && !xAlone(s.board) && !s.mopts?.kind;
  const fracOpen = (s) => s.stage === 'moves' && s.menu === 'fraction' && !s.sub && !s.deal && !s.fail && !s.spot?.choose && s.typing !== 'answer';
  // The fraction in the blank: { n } when it is 1 over 2..6 (a top left empty counts as 1), else null; with negTop, −1 over 2..6 too
  // ({ n, sign: −1 }).
  function fracOf(fb) {
    if (!fb || !/^\d+$/.test(fb.den)) return null;
    const num = fb.num === '' ? 1 : Number(fb.num);
    const n = Number(fb.den);
    if (!FRACTIONS.includes(n)) return null;
    if (num === 1) return { n };
    return negTop && num === -1 ? { n, sign: -1 } : null;
  }
  const unitTop = (num) => num === '' || num === '1' || (negTop && num === '-1');

  function withMenu(reduce) {
    const inner = fractionBlank(reduce);
    // −1, from the Flip button, typed in Multiply, or divided by: Flip everything where it is live (the card's `flip`), else the card's
    // reason (Divide it explains it; a card where Flip is greyed says why)
    function flipGo(state) {
      const what = option('flip', state);
      if (what === 'live') return inner({ ...state, mopts: null }, { type: 'flip' });
      if (what === 'grey') return { ...state, feedback: { key: greyKey('flip', state), params: {}, bad: false } };
      const a = coefOf(state.board);
      return { ...state, feedback: { key: 'dFlipNo', params: { n: -1, a, made: -a }, bad: true } };
    }
    // dividing by n is taking 1/n of both sides (−n: −1/n), through the card's own `choose` and `take`; a move the card refuses (a level
    // gate, a forced path) leaves the Divide blank open with the card's words
    function divideGo(state, entry) {
      if (!okDivisor(entry)) return { ...state, feedback: { key: 'dDivBad', params: { neg: negTop }, bad: true } };
      const d = Number(entry);
      const n = Math.abs(d);
      if (n === 0) return { ...state, feedback: { key: 'dDivZero', params: {}, bad: true } };
      if (!FRACTIONS.includes(n) || (d < 0 && !negTop)) return { ...state, feedback: { key: 'dDivBad', params: { neg: negTop, typed: d }, bad: true } };
      const opened = inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
      if (opened.menu !== 'fraction') return { ...state, feedback: opened.feedback ?? state.feedback };
      const s = reduce({ ...opened, fb: FB0 }, { type: 'take', n, ...(d < 0 ? { sign: -1 } : {}) });
      if (s === opened || (s.history?.length ?? 0) === (opened.history?.length ?? 0)) return { ...state, feedback: s.feedback ?? state.feedback };
      return s;
    }
    return (state, action) => {
      const m = state.mopts;
      if (action.type === 'multOpen') {
        if (m && !m.kind) return { ...state, mopts: null, ui: { ...(state.ui ?? {}), preview: false } };     // a second click closes them
        const base = fracOpen(state) ? { ...state, menu: null, fb: FB0 } : state;
        const probed = reduce(base, { type: 'choose', move: probe });
        if (probed === base || probed.menu !== probe) return probed;                       // not now (the card says why)
        return { ...base, mopts: { kind: null, entry: '' }, typing: null, feedback: null, ui: { ...(base.ui ?? {}), preview: false } };
      }
      // Flip everything, from the card's own Flip button: the −1 row, solid, waiting for Go
      if (action.type === 'flipPick' && option('flip', state) === 'live') {
        const base = fracOpen(state) ? { ...state, menu: null, fb: FB0 } : state;
        const probed = reduce(base, { type: 'choose', move: probe });
        if (probed === base || probed.menu !== probe) return probed;
        return { ...base, mopts: { kind: 'flip', entry: '' }, typing: null, feedback: null, ui: { ...(base.ui ?? {}), preview: false } };
      }
      if (action.type === 'multPick' && m && MULT_KINDS.includes(action.kind)) {
        const what = option(action.kind, state);
        if (what === 'grey') return { ...state, feedback: { key: greyKey(action.kind, state), params: {}, bad: false } };
        if (action.kind === 'frac') return inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
        return { ...state, mopts: { kind: action.kind, entry: '' }, feedback: null, ui: { ...(state.ui ?? {}), preview: false } };
      }
      // a "/" typed in the whole-number blank is the fraction's bar (Build H, Part 1): the fraction blank opens, what was typed is its
      // top, and the cursor moves to the bottom: 1, /, 5 makes 1/5. Where the Fraction option is greyed and Divide is live (Build L), a
      // top of 1 (or none) is dividing: the Divide blank opens instead, its 1/ printed.
      if (m?.kind === 'whole' && (action.type === 'fracSlash' || (action.type === 'typeChar' && action.ch === '/'))) {
        const num = m.entry === '-' ? '' : m.entry;
        if (option('frac', state) === 'grey') {
          const top = m.entry === '-' ? '-1' : m.entry;
          if (option('div', state) !== 'grey' && ['', '1', ...(negTop ? ['-1'] : [])].includes(top)) {
            return { ...state, mopts: { kind: 'div', entry: top === '-1' ? '-' : '' }, feedback: null };
          }
          return { ...state, feedback: { key: greyKey('frac', state), params: {}, bad: false } };
        }
        const opened = inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
        if (opened.menu !== 'fraction') return state;
        return { ...opened, fb: { num, den: '', part: 'den' }, feedback: num.replace('-', '').length > 1 ? { key: 'dUnitFraction', params: {}, bad: false } : null };
      }
      if (m?.kind && action.type !== 'ui') {
        if (m.kind === 'whole' && isTyping(action)) {
          const entry = typeInto(m.entry, action, 'integer');
          return entry === m.entry ? state : { ...state, mopts: { ...m, entry }, feedback: null };
        }
        // Divide's blank: one digit, a minus allowed; a "/" means nothing here (the 1/ is printed)
        if (m.kind === 'div') {
          if (action.type === 'fracSlash' || (action.type === 'typeChar' && action.ch === '/')) return state;
          if (isTyping(action)) {
            const entry = typeInto(m.entry, action, 'integer');
            if (entry === m.entry) return state;
            if (entry.replace('-', '').length > 1) return { ...state, feedback: { key: 'dDivOneDigit', params: {}, bad: false } };
            return { ...state, mopts: { ...m, entry }, feedback: null };
          }
        }
        if (action.type === 'go') {
          if (m.kind === 'flip' || ((m.kind === 'whole' || m.kind === 'div') && m.entry === '-1')) return flipGo(state);
          if (m.kind === 'div') return divideGo(state, m.entry);
          if (option(m.kind, state) === 'live') return inner({ ...state, mopts: null }, { type: m.kind });
          if (m.kind === 'whole' && !okWhole(m.entry)) return { ...state, feedback: { key: 'dBlankBad', params: {}, bad: true } };
          const a = coefOf(state.board);
          const n = Number(m.entry);
          return { ...state, feedback: { key: n === 0 ? 'dZeroNo' : 'dWholeNo', params: { n, a, made: n * a }, bad: true } };
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
        if (isTyping(action) && (action.type !== 'toggleSign' || (negTop && fb.part === 'num'))) {
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
          return done && !unitTop(fb.num) ? { ...next, feedback: { key: 'dUnitFraction', params: {}, bad: false } } : { ...next, feedback: null };
        }
        if (action.type === 'fracStuck') return { ...state, feedback: { key: 'dUnitFraction', params: {}, bad: false } };
        // a click or tap on either box clears it and puts the cursor in it (Build H, Part 1)
        if (action.type === 'focus' && (action.target === 'num' || action.target === 'den')) return { ...state, fb: { ...fb, [action.target]: '', part: action.target }, feedback: null };
        if (action.type === 'go') {
          const f = fracOf(fb);
          if (!f) return { ...state, fb: { ...fb, part: fb.den ? fb.part : 'den' }, feedback: { key: 'dBlankBad', params: {}, bad: true } };
          const s = reduce({ ...state, fb: FB0 }, { type: 'take', n: f.n, ...(f.sign ? { sign: f.sign } : {}) });
          return s;
        }
      }
      const r = reduce(state, action);
      if (r === state) return state;
      // x = clicked shows its blinking cursor until anything else happens (Build D-2, Part 2)
      const cursor = action.type === 'focus' && action.target === 'answer';
      const s = (r.ui?.fieldCursor ?? false) === cursor ? r : { ...r, ui: { ...(r.ui ?? {}), fieldCursor: cursor } };
      if (action.type === 'choose' && s.menu === 'fraction' && state.menu !== 'fraction') return { ...s, fb: FB0, typing: null, ui: { ...(s.ui ?? {}), preview: false } };
      // a hover's preview goes with the next action; one the card has just set (the reminder lights its move's preview) stays
      if (s.ui?.preview && s.ui.preview === state.ui?.preview) return { ...s, ui: { ...s.ui, preview: false } };
      return s;
    };
  }

  return { withMenu, canPreview, fracOpen, fracOf };
}
