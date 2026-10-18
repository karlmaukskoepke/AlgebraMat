// Pointer and keyboard for the Add to both sides screen (the lights layout, SPEC-LIGHTS-EXPERIMENT-ADD.md §2), on top of the card's own dragging
// (addBothPointer.js: a number dragged from the equation into the blank still fills it).
//   Mouse: hovering the Add icon previews the move; a click chooses it.
//   Keyboard: Tab onto the Add icon previews it; Enter or Space chooses; Enter applies; Esc cancels. Enter does the first of:
//   apply the blank, Next, Check (and the substitution's Next).
//   Touch: the first tap on the Add icon previews, the second chooses; a tap anywhere else removes the preview.
// The Mat is redrawn on every change, so focus is put back where it was (or where the screen asks for it: data-lx-focus).

import { bindAddBothMat } from './addBothPointer.js';
import { bindGrab } from './lightsGrabPointer.js';

const ADD = '.lb-move[data-move="add"]';

export function bindLightsMat(root, dispatch, getSession, { grab = false } = {}) {
  const unbindGrab = grab ? bindGrab(root, dispatch, getSession) : null;   // first: a held term's keys are its own (?ui=grab)
  const unbindDrag = bindAddBothMat(root, dispatch, getSession);
  let pointerType = 'mouse';
  let keyboard = false;          // was the last input a key (so a focus is the keyboard's, not a click's)?
  let lastKey = null;            // data-fk of the element that had focus, to give it back after a redraw

  const lights = () => Boolean(root.querySelector('.ui-lights'));
  const preview = (on) => dispatch({ type: 'ui', patch: { preview: on } });

  const onPointerDown = (e) => {
    pointerType = e.pointerType || 'mouse';
    keyboard = false;
    if (!lights()) return;
    const hit = e.target.closest?.('[data-fk]');
    lastKey = hit && root.contains(hit) ? hit.dataset.fk : null;
    if (pointerType !== 'mouse' && !e.target.closest?.(ADD)) preview(false);
  };
  document.addEventListener('pointerdown', onPointerDown, true);

  const onOver = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    if (e.target.closest?.(ADD)) preview(true);
  };
  const onOut = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    const from = e.target.closest?.(ADD);
    if (from && !(e.relatedTarget && from.contains(e.relatedTarget))) preview(false);
  };
  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);

  // a touch tap on the icon goes to the reducer marked as a tap (first tap previews, second chooses)
  const onClick = (e) => {
    if (!lights()) return;
    const add = e.target.closest?.(ADD);
    if (!add || add.disabled || e.detail === 0 || pointerType !== 'touch') return;
    e.stopPropagation();
    dispatch({ type: 'choose', move: 'add', touch: true });
  };
  root.addEventListener('click', onClick, true);

  const onFocusIn = (e) => {
    const t = e.target;
    if (!lights() || !(t instanceof HTMLElement)) return;
    if (t.dataset.fk) lastKey = t.dataset.fk;
    if (!keyboard) return;
    // (deferred, so a dispatch never lands in the middle of a redraw)
    if (t.matches(ADD)) queueMicrotask(() => preview(true));
    else if (t.dataset.lxField && !t.disabled) queueMicrotask(() => dispatch({ type: 'focus', target: t.dataset.target }));
  };
  const onFocusOut = (e) => {
    if (!lights()) return;
    // (a redraw removing the focused icon fires this too, mid-redraw: wait, then check the focus really left the icon)
    if (e.target.matches?.(ADD) && keyboard) queueMicrotask(() => { if (!document.activeElement?.matches?.(ADD)) preview(false); });
    if (e.relatedTarget && !root.contains(e.relatedTarget)) lastKey = null;
  };
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);

  // Enter and Esc. Runs before the page's own keys (capture), so Enter does the first of: apply, Next, the substitution's Next, Check.
  const onKey = (e) => {
    if (e.key === 'Tab') keyboard = true;
    if (!lights() || root.closest('[hidden]') || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { keyboard = true; e.preventDefault(); dispatch({ type: 'lxCancel' }); return; }
    // digits, the sign and Backspace go to the open blank or to x = (the page's own keys skip a focused button on the Mat, and the
    // two fields are buttons), whatever has focus
    const typing = /^[0-9]$/.test(e.key) ? { type: 'digit', digit: Number(e.key) }
      : e.key === '-' || e.key === '−' ? { type: 'toggleSign' } : e.key === 'Backspace' || e.key === 'Delete' ? { type: 'backspace' } : null;
    if (typing) {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      dispatch(typing);
      return;
    }
    if (e.key !== 'Enter' || e.repeat) return;
    keyboard = true;
    const a = document.activeElement;
    // a focused button on the Mat (the Add icon, Undo, I'm stuck…) keeps its own Enter; the two fields do not
    if (a instanceof HTMLElement && root.contains(a) && a.matches('button, a') && !a.dataset.lxField) return;
    if (a instanceof HTMLElement && a.matches('button, a') && !root.contains(a) && !a.closest('#controls')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (root.querySelector('.lx-ghost.is-chosen')) { dispatch({ type: 'go' }); return; }
    const order = ['[data-action="lxNext"]', '[data-action="nextLine"]', '[data-action="next"]', '[data-action="check"]'];
    for (const sel of order) {
      const b = root.querySelector(sel);
      if (b && !b.disabled) { b.click(); return; }
    }
  };
  window.addEventListener('keydown', onKey, true);

  // after every redraw: focus goes where the screen asks (data-lx-focus), else back to the element that had it
  const settle = () => {
    if (!lights()) return;
    const asked = root.querySelector('[data-lx-focus]');
    const a = document.activeElement;
    const lost = !a || a === document.body || !a.isConnected;
    const back = lost && lastKey ? root.querySelector(`[data-fk="${lastKey}"]`) : null;
    const target = asked ?? back;
    if (target && !target.disabled && target !== a) {
      const kb = keyboard;
      keyboard = false;                 // a focus the screen gives is not a keyboard focus (no preview, no field switch)
      target.focus({ preventScroll: true });
      keyboard = kb;
    }
  };
  const obs = new MutationObserver(settle);
  obs.observe(root, { childList: true });

  return () => {
    unbindGrab?.();
    unbindDrag?.();
    obs.disconnect();
    document.removeEventListener('pointerdown', onPointerDown, true);
    root.removeEventListener('pointerover', onOver);
    root.removeEventListener('pointerout', onOut);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('keydown', onKey, true);
  };
}
