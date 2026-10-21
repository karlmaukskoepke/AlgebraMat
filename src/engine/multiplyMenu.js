// The Multiply move's menu and its fraction blank, shared by every card that multiplies both sides (lifted out of Divide it in Build J;
// before that it was Divide's own: Build D, Part 4 and Build D-2, Part 4). The one Multiply button opens three options beside it,
// `s.mopts`: a whole number ▢ × ( ), a fraction ▢/▢ × ( ), and −1 × ( ). Hovering one previews it on the equation (`ui.preview` is its
// kind); clicking it makes it solid. The fraction opens the blank (typed `1/5`, or its top and bottom filled), and the green Go takes
// that fraction of both sides through the card's own `take`. A card says what each option is on it:
//   'live'     the move (the fraction; −1 on Flip everything, which the card's own `flip` applies)
//   'explain'  Go says why it does not get one x (Divide it's whole number and −1)
//   'grey'     a tap says it unlocks later
// A layer round the card's reducer, like Add's (addBothLights.js): the engine, its rows and its save bits are the card's. No DOM here.
//
//   makeMultiplyMenu({ xAlone, coefOf, option(kind, s), probe, negTop })
//     probe    the move the Multiply button checks with the card before it opens (the card's `choose` puts it in s.menu, or says why not)
//     negTop   the fraction's top may be −1 (Flip everything accepts −⅓ of both sides in one move)

import { isTyping, typeInto } from './entry.js';
import { FRACTIONS } from './divide.js';

const FB0 = { num: '', den: '', part: 'num' };
export const MULT_KINDS = ['whole', 'frac', 'flip'];
export const multOpen = (s) => Boolean(s.mopts);
const okWhole = (t) => /^-?\d+$/.test(t ?? '');

export function makeMultiplyMenu({ xAlone, coefOf, option = (kind) => (kind === 'frac' ? 'live' : 'explain'), probe = 'fraction', negTop = false }) {
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
    return (state, action) => {
      const m = state.mopts;
      if (action.type === 'multOpen') {
        if (m && !m.kind) return { ...state, mopts: null, ui: { ...(state.ui ?? {}), preview: false } };     // a second click closes them
        const base = fracOpen(state) ? { ...state, menu: null, fb: FB0 } : state;
        const probed = reduce(base, { type: 'choose', move: probe });
        if (probed === base || probed.menu !== probe) return probed;                       // not now (the card says why)
        return { ...base, mopts: { kind: null, entry: '' }, typing: null, feedback: null, ui: { ...(base.ui ?? {}), preview: false } };
      }
      // the −1 option straight from the card's own Flip button (Flip everything): the same as opening Multiply and picking −1
      if (action.type === 'flipPick' && option('flip', state) === 'live') {
        const base = fracOpen(state) ? { ...state, menu: null, fb: FB0 } : state;
        const probed = reduce(base, { type: 'choose', move: probe });
        if (probed === base || probed.menu !== probe) return probed;
        return { ...base, mopts: { kind: 'flip', entry: '' }, typing: null, feedback: null, ui: { ...(base.ui ?? {}), preview: false } };
      }
      if (action.type === 'multPick' && m && MULT_KINDS.includes(action.kind)) {
        const what = option(action.kind, state);
        if (what === 'grey') return { ...state, feedback: { key: action.kind === 'frac' ? 'aLaterLevel' : 'aLater', params: {}, bad: false } };
        if (action.kind === 'frac') return inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
        return { ...state, mopts: { kind: action.kind, entry: '' }, feedback: null, ui: { ...(state.ui ?? {}), preview: false } };
      }
      // a "/" typed in the whole-number blank is the fraction's bar (Build H, Part 1): the fraction blank opens, what was typed is its
      // top, and the cursor moves to the bottom: 1, /, 5 makes 1/5
      if (m?.kind === 'whole' && (action.type === 'fracSlash' || (action.type === 'typeChar' && action.ch === '/'))) {
        const opened = inner({ ...state, mopts: null }, { type: 'choose', move: 'fraction' });
        if (opened.menu !== 'fraction') return state;
        const num = m.entry === '-' ? '' : m.entry;
        return { ...opened, fb: { num, den: '', part: 'den' }, feedback: num.replace('-', '').length > 1 ? { key: 'dUnitFraction', params: {}, bad: false } : null };
      }
      if (m?.kind && action.type !== 'ui') {
        if (m.kind === 'whole' && isTyping(action)) {
          const entry = typeInto(m.entry, action, 'integer');
          return entry === m.entry ? state : { ...state, mopts: { ...m, entry }, feedback: null };
        }
        if (action.type === 'go') {
          if (option(m.kind, state) === 'live') return inner({ ...state, mopts: null }, { type: m.kind });      // (Flip everything's `flip`)
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
