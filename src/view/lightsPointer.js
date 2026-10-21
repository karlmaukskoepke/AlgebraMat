// Pointer and keyboard for the Add to both sides screen (the lights layout, SPEC-LIGHTS-EXPERIMENT-ADD.md §2), on top of the card's own dragging
// (addBothPointer.js: a number dragged from the equation into the blank still fills it).
//   Mouse: hovering the Add icon previews the move; a click chooses it.
//   Keyboard: Tab onto the Add icon previews it; Enter or Space chooses; Esc cancels. Enter presses the one green button.
//   Touch: the first tap on the Add icon previews, the second chooses; a tap anywhere else removes the preview.
// The Mat is redrawn on every change, so focus is put back where it was (or where the screen asks for it: data-lx-focus).

import { bindAddBothMat } from './addBothPointer.js';
import { bindGrab } from './lightsGrabPointer.js';
import { bindHelpTimer } from './helpTimer.js';
import { bindValueDrag, HELP_BUTTONS } from './solveScreen.js';

const ADD = '.lb-move[data-move="add"]';

export function bindLightsMat(root, dispatch, getSession) {
  const unbindGrab = bindGrab(root, dispatch, getSession);   // first: a held term's keys are its own
  const unbindDrag = bindAddBothMat(root, dispatch, getSession);
  const unbindHelp = bindHelpTimer(root);
  const unbindValue = bindValueDrag(root, dispatch);          // the value checked is dragged into x
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
    if (e.target.closest?.(ADD) && getSession?.()?.ui?.preview !== true) preview(true);
  };
  const onOut = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    const from = e.target.closest?.(ADD);
    // (a redraw swaps the icon under a still pointer: going from the old icon to the new one is not leaving it)
    if (!from || !from.isConnected || e.relatedTarget?.closest?.(ADD) || (e.relatedTarget && from.contains(e.relatedTarget))) return;
    if (getSession?.()?.ui?.preview === true) dispatch({ type: 'ui', patch: { preview: 'near' } });   // still near
  };
  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);
  // the preview begins on approach: within about 40 px of the Add icon it starts faintly (and the icon jumps up a little)
  const NEAR = 40;
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    const add = root.querySelector(`${ADD}:not(:disabled)`);
    const s = getSession?.();
    if (!add || !s) return;
    const r = add.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const d = Math.hypot(dx, dy);
    const cur = s.ui?.preview;
    if (d === 0 || cur === true) return;                              // on the icon: the full preview (pointerover)
    if (d <= NEAR && cur !== 'near') dispatch({ type: 'ui', patch: { preview: 'near' } });
    else if (d > NEAR && cur === 'near') preview(false);
  };
  document.addEventListener('pointermove', onMove);

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
    if (e.target.matches?.(ADD) && keyboard && e.target.isConnected) setTimeout(() => { if (!document.activeElement?.matches?.(ADD) && !root.querySelector(`${ADD}:hover`)) preview(false); }, 0);
    if (e.relatedTarget && !root.contains(e.relatedTarget)) lastKey = null;
  };
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);

  // Enter and Esc. Runs before the page's own keys (capture), so Enter presses the green button.
  const onKey = (e) => {
    if (e.key === 'Tab') keyboard = true;
    if (!lights() || root.closest('[hidden]') || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { keyboard = true; e.preventDefault(); dispatch({ type: 'lxCancel' }); return; }
    // digits, the sign and Backspace go to the open blank or to x = (the page's own keys skip a focused button on the Mat, and the
    // two fields are buttons), whatever has focus
    const typing = /^[0-9]$/.test(e.key) ? { type: 'digit', digit: Number(e.key) }
      : e.key === '-' || e.key === '−' ? { type: 'toggleSign' } : e.key === 'Backspace' || e.key === 'Delete' ? { type: 'backspace' }
        : (e.key === 'x' || e.key === 'X') && getSession?.()?.lx?.distribute ? { type: 'typeChar', ch: 'x' } : null;   // the drill's products: −2x
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
    // (I'm stuck, Teach me and Start over never do: Enter is the green button's, Build H, Part 1)
    if (a instanceof HTMLElement && root.contains(a) && a.matches('button, a') && !a.dataset.lxField && !a.matches(HELP_BUTTONS)) return;
    if (a instanceof HTMLElement && a.matches('button, a') && !root.contains(a) && !a.closest('#controls')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    // Enter presses the one green button (an empty blank shakes instead)
    const f = root.querySelector('.btn-forward');
    if (f && !f.disabled) { f.click(); return; }
    if (f && root.querySelector('.lx-ghost.is-chosen')) dispatch({ type: 'go' });   // an empty blank shakes; a filled product goes to the next
    root.querySelector('[data-x][data-action="placeValue"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));   // (an x on the seesaw is SVG: no .click())          // the keyboard's way to put the value into x
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
    unbindHelp();
    unbindValue();
    obs.disconnect();
    document.removeEventListener('pointerdown', onPointerDown, true);
    root.removeEventListener('pointerover', onOver);
    root.removeEventListener('pointerout', onOut);
    document.removeEventListener('pointermove', onMove);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('keydown', onKey, true);
  };
}
