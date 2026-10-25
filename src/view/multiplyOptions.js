// The one Multiply button's options (Build D-2, Part 4; Build O, loop rev 2.4: two again, as before Build L), beside the button: a whole
// number ▢ ( ) and a fraction ▢/▢ ( ). Divide is the panel's own button (Build O), drawn here too: `multiplyMoves`. Hovering one previews it on the equation (dashed); clicking it makes it solid.
// Shared by every Solve it card with Multiply.

import { html } from './addBothMat.js';
import { optionsOpen, MULT_KINDS } from '../engine/multiplyMenu.js';

const box = () => html('span', 'mo-box');
const unit = () => html('span', 'mo-frac', [html('span', 'mo-one', ['1']), html('span', 'mo-bar'), box()]);
const frac = () => html('span', 'mo-frac', [box(), html('span', 'mo-bar'), box()]);
// each option is the move's own form, both sides: n ( ) = n ( ) (Build O: the small × and ÷ beside them went; the panel's symbols say it)
const LOOK = {
  whole: () => [box(), ' ( ) = ', box(), ' ( )'],
  div: () => [unit(), ' ( ) = ', unit(), ' ( )'],
  frac: () => [frac(), ' ( ) = ', frac(), ' ( )'],
  flip: () => ['−1 × ( )'],
};
const SAID = { whole: 'Multiply both sides by a whole number', div: 'Divide both sides by a number', frac: 'Multiply both sides by a fraction', flip: 'Multiply both sides by −1' };

// kinds: which options, in order; preview: the kind hovered now; grey: options greyed on this card (a tap says why; Build J). A greyed
// option is not previewed.
export function multiplyOptions(kinds, preview, grey = []) {
  return html('div', 'mo-flyout', kinds.map((k) => html('button', `btn mo-opt${preview === k ? ' is-preview' : ''}${grey.includes(k) ? ' is-grey' : ''}`, LOOK[k](), {
    type: 'button', 'data-action': 'multPick', 'data-kind': k, ...(grey.includes(k) ? { 'aria-disabled': 'true' } : { 'data-mopt': k }), 'aria-label': SAID[k],
  })), { role: 'group', 'aria-label': 'Multiply by' });
}

// The spotlight's selector for a move it lights: a Multiply option ('divOption', 'fracOption'), or a panel move.
// (Build O: 'divOption', the move the hints name, is the Divide button)
export const optionSel = (m) => (m === 'divOption' ? '[data-move="div"]' : m === 'fracOption' ? '[data-mopt="frac"]' : `[data-move="${m}"]`);

// The panel's Multiply and Divide buttons on a card with the Multiply menu (Build O): Multiply opens its two options; Divide (its own
// button, a second way in to the same move) is chosen in one click, previewed on hover (data-mopt), greyed where the card says so (a tap
// says why), and lit by the hint after Undo. `option(kind, s)` is the card's; `ring`: which of the two has the forced move's ring.
export function multiplyMoves(s, option, { move = 'mult', ring = null } = {}) {
  const grey = MULT_KINDS.filter((k) => option(k, s) === 'grey');
  const open = optionsOpen(s);
  const divGrey = option('div', s) === 'grey';
  const divCycle = s.menu === 'fraction' && !s.fail && s.tryForm === 'div';      // (Build T: the choices after a division are Divide's)
  return {
    multiply: { live: true, move, action: 'multOpen', pressed: (s.menu === 'fraction' && !s.fail && !divCycle) || open || s.mopts?.kind === 'whole', ring: ring === 'multiply', flyout: open ? multiplyOptions(MULT_KINDS, s.ui?.preview, grey) : null },
    divide: {
      live: true, greyed: divGrey, move: 'div', action: 'divPick', pressed: s.mopts?.kind === 'div' || divCycle, ring: ring === 'divide' && !divGrey,
      preview: !s.mopts?.kind && s.ui?.preview === 'div' && !divGrey, attrs: { 'data-mopt': 'div' },
    },
  };
}

// Hovering an option (or a keyboard focus on it) previews it: the kind under the pointer, or false.
export function bindMultiplyHover(root, dispatch, getSession) {
  const set = (kind) => { if ((getSession()?.ui?.preview ?? false) !== kind) dispatch({ type: 'ui', patch: { preview: kind } }); };
  // (Add's two options on Variables on both sides preview the same way: `+ ▢` and `+ ▢x`, Build S)
  const OPT = '[data-mopt], [data-aopt]';
  const kindOf = (o) => o.dataset.mopt ?? (o.dataset.aopt === 'x' ? 'addX' : 'addNum');
  const over = (e) => { const o = e.target.closest?.(OPT); if (o) set(kindOf(o)); };
  const out = (e) => {
    const o = e.target.closest?.(OPT);
    if (o && !(e.relatedTarget && e.relatedTarget.closest?.(OPT))) set(false);
  };
  const focus = (e) => { const o = e.target.closest?.(OPT); if (o) set(kindOf(o)); };
  // a keyboard focus leaving the move ends its preview too (Build O, Part 1). (A redraw takes the focused button away for a moment:
  // wait, then look where the focus and the pointer really are.)
  const blur = (e) => {
    if (!e.target.closest?.(OPT)) return;
    setTimeout(() => {
      const a = document.activeElement;
      if (a?.closest?.(OPT) || root.querySelector('[data-mopt]:hover, [data-aopt]:hover')) return;
      const p = getSession()?.ui?.preview;
      if (['whole', 'div', 'frac', 'flip', 'addX', 'addNum'].includes(p)) dispatch({ type: 'ui', patch: { preview: false } });
    }, 0);
  };
  root.addEventListener('pointerover', over);
  root.addEventListener('pointerout', out);
  root.addEventListener('focusin', focus);
  root.addEventListener('focusout', blur);
  return () => { root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out); root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur); };
}
