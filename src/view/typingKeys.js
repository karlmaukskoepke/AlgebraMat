// Typing on every Solve it card (Build N, 2026-10-24): a digit, the minus and Backspace go straight to the card's reducer, which puts
// them in whatever is open (a move's blank first, then x =), wherever the focus is. Before this, Divide it and Flip everything typed by
// pressing the hidden keypad's buttons: a click on the Divide blank left the focus on it, and the page's keys skip a focused button on
// the Mat, so nothing could be typed; and on the problem after a correct guess the keypad was off, so the blank took nothing.
import { onRedraw } from './keepRows.js';


// The action a key types, or null. (x types only in a sum of two x-terms or a distribute blank: Build M.)
export function typedAction(e, s) {
  if (/^[0-9]$/.test(e.key)) return { type: 'digit', digit: Number(e.key) };
  if (e.key === '-' || e.key === '−') return { type: 'toggleSign' };
  if (e.key === 'Backspace' || e.key === 'Delete') return { type: 'backspace' };
  if ((e.key === 'x' || e.key === 'X') && (s?.lx?.distribute || s?.lx?.combine)) return { type: 'typeChar', ch: 'x' };
  return null;
}

// Is a key for the Mat now? (not with a dialog open, the Mat hidden, or a shortcut held; a real text input keeps its keys)
export const keyForMat = (e, root) => !(root.closest('[hidden]') || !root.isConnected || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey
  || (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable]')));

// The open field gets the focus back after a redraw that lost it (the Mat is redrawn on every change): the box the screen marks with
// the cursor (.is-focus), so the focus and the cursor are in one place.
export function settleTypingFocus(root) {
  const a = document.activeElement;
  if (a && a !== document.body && a.isConnected) return;
  const field = root.querySelector('[data-lx-field].is-focus:not(:disabled):not(.is-mirror)');
  if (field && !field.closest('[hidden]')) field.focus({ preventScroll: true });
}

// For a card whose Mat has no keys of its own (Divide it, Flip everything). Runs before the page's keys (capture).
export function bindTypingKeys(root, dispatch, getSession) {
  const onKey = (e) => {
    if (!keyForMat(e, root)) return;
    const typing = typedAction(e, getSession?.());
    if (!typing) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch(typing);
  };
  window.addEventListener('keydown', onKey, true);
  const unwatch = onRedraw(root, () => settleTypingFocus(root));
  return () => { window.removeEventListener('keydown', onKey, true); unwatch(); };
}
