// The Multiply move on screen, shared by every card that multiplies both sides (lifted out of Divide it's screen in Build J): the move's
// row under the newest equation (its preview while a move is hovered, dashed and grey; then the chosen move solid: the whole-number
// blank; Divide's division form, each side over a big bar with the blank beneath and "Same as multiplying by ⅕." once typed (Build O); the
// fraction blank, top and bottom, typed "1/5", the other side mirroring it; or −1), and, after a fraction that did not
// split, the boxes and the counters with the fractions to choose from (the ones tried crossed off). x may be on either side.

import { html } from './addBothMat.js';
import { sideTerms, divisionEl, sameAsLine } from './solveScreen.js';
import { equationRow } from './lightScreen.js';
import { groupDiagram } from './groupDiagram.js';
import { FRACTIONS } from '../engine/divide.js';
import { fractionText } from '../engine/solveTerms.js';
import { MINUS } from '../engine/expr.js';
import { coefOn, otherTerm, xSideOf } from '../engine/fractionMove.js';

// The fraction blank (Build D, Part 4): top and bottom; the side without the typing mirrors it.
function fracBox(s, mirror, open) {
  const fb = s.fb ?? { num: '', den: '', part: 'num' };
  const part = (p) => {
    const text = fb[p];
    const focus = open && !mirror && fb.part === p;
    return html(mirror ? 'span' : 'button', `lx-box dv-fracpart${focus ? ' is-focus' : ''}${focus && fb.sel && text ? ' is-selected' : ''}${text ? '' : ' is-empty'}${focus && !text ? ' is-blink' : ''}${mirror ? ' is-mirror' : ''}`, [text ? text.replace('-', MINUS) : ' '],
      mirror ? { 'aria-hidden': 'true' } : { type: 'button', 'data-action': 'focus', 'data-target': p, 'data-lx-field': '1', 'aria-label': p === 'num' ? 'The top of the fraction' : 'The bottom of the fraction', ...(open ? {} : { tabindex: '-1' }) });
  };
  // the cue under the open blank: a click or tap on a box clears it (Build H, Part 1)
  return html('span', `dv-fracblank${mirror ? ' is-mirror' : ''}`, [part('num'), html('span', 'dv-fracbar'), part('den'), ...(open && !mirror ? [html('span', 'dv-retype', ['Tap a box to retype it'])] : [])]);
}
// The whole-number option's blank (Build D-2, Part 4): typed on one side, mirrored on the other.
// A blank shown while its option is only previewed, with the options open (the hint after Undo lights Divide): typing goes into it, so
// it shows the cursor, and a tap on it picks the option (Build N).
const pickAttrs = (s, kind) => (s.mopts && !s.mopts.kind ? { 'data-action': 'multPick', 'data-kind': kind } : {});
function wholeBox(s, mirror, typeable = false) {
  const chosen = s.mopts?.kind === 'whole';
  const text = chosen ? s.mopts.entry : '';
  const cursor = (chosen || typeable) && !mirror;
  return html(mirror ? 'span' : 'button', `lx-box mo-blank${cursor ? ' is-focus' : ''}${text ? '' : ' is-empty'}${cursor && !text ? ' is-blink' : ''}${mirror ? ' is-mirror' : ''}`,
    [text ? text.replace('-', MINUS) : ' '], mirror ? { 'aria-hidden': 'true' } : { type: 'button', 'data-lx-field': '1', 'aria-label': 'The whole number to multiply both sides by', ...(chosen ? {} : pickAttrs(s, 'whole')) });
}

// The Divide button's blank (Build O): one digit, a minus allowed, under the fraction bar on both sides; the other side mirrors it.
function divBox(s, mirror, typeable = false) {
  const chosen = s.mopts?.kind === 'div';
  const entry = chosen ? s.mopts.entry : '';
  const cursor = (chosen || typeable) && !mirror;
  const digit = /\d/.test(entry);
  return html(mirror ? 'span' : 'button', `lx-box dv-fracpart mo-divpart${cursor ? ' is-focus' : ''}${digit ? '' : ' is-empty'}${cursor && !digit ? ' is-blink' : ''}${mirror ? ' is-mirror' : ''}`, [entry ? entry.replace('-', MINUS) : ' '],
    mirror ? { 'aria-hidden': 'true' } : { type: 'button', 'data-lx-field': '1', 'aria-label': 'The number to divide both sides by', ...(chosen ? {} : typeable ? { 'data-action': 'divPick' } : {}) });
}
// The line under Divide's row once a digit is typed: what dividing by it is ("Same as multiplying by ⅕.")
function divLabel(s) {
  const entry = s.mopts?.kind === 'div' ? s.mopts.entry : '';
  if (!/^-?[2-9]$/.test(entry)) return null;
  const d = Number(entry);
  return sameAsLine(Math.abs(d), Math.sign(d));
}

// menu: the card's Multiply menu (engine/multiplyMenu.js): { fracOpen, canPreview }. The blank is typed on x's side. blueFlip: −1 is the
// move on this card (Flip everything), so it is drawn in the operation's blue (loop §3D); on Divide it is only explained.
export function moveRow(s, menu, { blueFlip = false } = {}) {
  const open = menu.fracOpen(s);
  const chosen = s.mopts?.kind ?? (open ? 'frac' : null);
  // the hovered option (Build D-2: one Multiply button, three options)
  const hovered = !chosen && menu.canPreview(s) ? (s.ui?.preview === true ? 'frac' : s.ui?.preview || null) : null;
  const kind = chosen ?? hovered;
  const slot = html('div', `lx-ghost dv-ghost${chosen ? ' is-chosen' : hovered ? ' is-preview' : ''}`);
  if (!kind) return slot;
  const typedOn = xSideOf(s.board);
  const typeable = !chosen && Boolean(menu.previewTyped?.(s));       // (typing goes into the shown blank: Build N)
  const front = (mirror) => (kind === 'frac' ? fracBox(s, mirror, open) : kind === 'whole' ? wholeBox(s, mirror, typeable) : html('span', `lb-num${blueFlip ? ' is-blue' : ''}`, [`${MINUS}1`]));
  // Divide (Build O): each whole side in parentheses over a big fraction bar, the blank beneath it
  const side = kind === 'div'
    ? (terms, mirror) => [divisionEl(sideTerms(terms, s), divBox(s, mirror, typeable))]
    : (terms, mirror) => [front(mirror), html('span', 'lb-plus dv-times', ['×']), html('span', 'lb-plus', ['(']), ...sideTerms(terms, s), html('span', 'lb-plus', [')'])];
  slot.append(equationRow(side(s.board.left, typedOn !== 'left'), side(s.board.right, typedOn !== 'right'), `lx-ghosteq${kind === 'div' ? ' is-division' : ''}`));
  const label = kind === 'div' ? divLabel(s) : null;
  if (label) slot.append(label);
  if (!chosen && !typeable) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// After a fraction that did not split, the hint shows the boxes (as many as the number in front of x, by its size) and the counters, the
// boxes bracketed, and the fractions to choose from: the ones already tried are crossed off and greyed (Build D, Part 4).
export function fractionChoices(s, textOf) {
  const b = s.board;
  const other = otherTerm(b);
  const size = other.kind === 'num' ? Math.min(36, Math.abs(other.v)) : 0;
  const boxes = Math.abs(coefOn(b));
  const wrap = html('div', 'dv-choose');
  const div = s.tryForm === 'div';                                 // (Build T: after a division, numbers to divide by)
  const [want, ask] = textOf({ key: 'dWhichFraction', params: { boxes, div } }).split('\n');
  wrap.append(groupDiagram({ n: 1, boxes, size, neg: other.kind === 'num' && other.v < 0, groups: null, pile: size, kept: null, tap: null, bracketBoxes: true }),
    html('p', 'spot-text', [want]), html('p', 'spot-text', [ask]));
  const row = html('div', 'dv-choices');
  for (const n of FRACTIONS) {
    const tried = s.tried.includes(n);
    const label = div ? `÷ ${n}` : fractionText(n);
    const btn = html('button', `btn dv-choice${tried ? ' is-tried' : ''}`, [label], { type: 'button', 'data-action': 'take', 'data-n': n, 'data-from': 'list', 'aria-label': `${div ? `divide by ${n}` : fractionText(n)}${tried ? ', tried already' : ''}` });
    btn.disabled = tried;
    row.append(btn);
  }
  wrap.append(row);
  return wrap;
}
