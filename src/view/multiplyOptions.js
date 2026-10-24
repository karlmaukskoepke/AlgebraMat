// The one Multiply button's three options (Build D-2, Part 4; Build L, loop rev 2.3), beside the button: Multiply, a whole number
// × ▢ ( ); Divide, ÷ 1/▢ ( ); and Fraction, ▢/▢ ( ). Hovering one previews it on the equation (dashed); clicking it makes it solid.
// Shared by every Solve it card with Multiply.

import { html } from './addBothMat.js';

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
export const optionSel = (m) => (m === 'divOption' ? '[data-mopt="div"]' : m === 'fracOption' ? '[data-mopt="frac"]' : `[data-move="${m}"]`);

// Hovering an option (or a keyboard focus on it) previews it: the kind under the pointer, or false.
export function bindMultiplyHover(root, dispatch, getSession) {
  const set = (kind) => { if ((getSession()?.ui?.preview ?? false) !== kind) dispatch({ type: 'ui', patch: { preview: kind } }); };
  const over = (e) => { const o = e.target.closest?.('[data-mopt]'); if (o) set(o.dataset.mopt); };
  const out = (e) => {
    const o = e.target.closest?.('[data-mopt]');
    if (o && !(e.relatedTarget && e.relatedTarget.closest?.('[data-mopt]'))) set(false);
  };
  const focus = (e) => { const o = e.target.closest?.('[data-mopt]'); if (o) set(o.dataset.mopt); };
  // a keyboard focus leaving the move ends its preview too (Build O, Part 1). (A redraw takes the focused button away for a moment:
  // wait, then look where the focus and the pointer really are.)
  const blur = (e) => {
    if (!e.target.closest?.('[data-mopt]')) return;
    setTimeout(() => {
      const a = document.activeElement;
      if (a?.closest?.('[data-mopt]') || root.querySelector('[data-mopt]:hover')) return;
      const p = getSession()?.ui?.preview;
      if (['whole', 'div', 'frac', 'flip'].includes(p)) dispatch({ type: 'ui', patch: { preview: false } });
    }, 0);
  };
  root.addEventListener('pointerover', over);
  root.addEventListener('pointerout', out);
  root.addEventListener('focusin', focus);
  root.addEventListener('focusout', blur);
  return () => { root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out); root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur); };
}
