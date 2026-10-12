// Dragging on the Add to both sides Mat. Three things can be picked up:
//   a piece from the tray (the x box, a + or a −) → dropped on a side of the board       → { drop, piece, side }
//   a number on the board (a group or a token)     → dropped in the blank of "Add ___ to both sides" → { setAmount, value }
//   the typed answer (the early check)             → dropped on the x box                 → { dropValue }
// A press that barely moves is a tap and is left alone (the buttons and groups already respond to taps, which is every
// drag's tap alternative). Listeners live on the Mat's container, which is never replaced; the ghost that follows the
// pointer is a plain element on the page. Enter or Space on a focused group or x does what a tap does.

const SLOP = 8;

export function bindAddBothMat(root, dispatch, getSession) {
  let drag = null;   // { id, src, kind, x0, y0, started, ghost }

  const kindOf = (src) => (src.matches('[data-chip]') ? 'answer' : src.matches('[data-piece]') ? 'piece' : 'number');
  const SOURCES = '[data-chip], [data-piece], [data-numval]';

  const at = (e, selector) => {
    for (const node of document.elementsFromPoint(e.clientX, e.clientY)) {
      const hit = node.closest?.(selector);
      if (hit && root.contains(hit)) return hit;
    }
    return null;
  };

  const stop = () => {
    drag?.ghost?.remove();
    root.classList.remove('is-dragging');
    for (const n of root.querySelectorAll('.is-drop-over')) n.classList.remove('is-drop-over');
    drag = null;
  };

  const downHandler = (e) => {
    const src = e.target.closest?.(SOURCES);
    if (!src || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const s = getSession();
    const kind = kindOf(src);
    if (kind === 'answer' && s?.early?.step !== 'drag') return;
    if (kind === 'number' && !(s?.stage === 'moves' && !s.combining && !s.pending)) return;
    if (kind === 'piece' && s?.stage === 'moves' && s.menu !== 'add') return;
    drag = { id: e.pointerId, src, kind, x0: e.clientX, y0: e.clientY, started: false, ghost: null };
  };
  root.addEventListener('pointerdown', downHandler);

  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < SLOP) return;
      drag.started = true;
      if (drag.kind === 'number') root.classList.add('is-dragging');             // the blank in "Add ___" must be visible to drop on
      const ghost = document.createElement('div');
      ghost.className = 'ab-ghost';
      ghost.textContent = drag.kind === 'number' ? (drag.src.getAttribute('data-numval') < 0 ? `−${Math.abs(drag.src.getAttribute('data-numval'))}` : drag.src.getAttribute('data-numval')) : drag.src.textContent.trim();
      document.body.append(ghost);
      drag.ghost = ghost;
    }
    e.preventDefault();
    drag.ghost.style.transform = `translate(${e.clientX - 28}px, ${e.clientY - 28}px)`;
    const target = at(e, drag.kind === 'piece' ? '[data-zone]' : drag.kind === 'number' ? '[data-blank]' : '[data-x]');
    for (const n of root.querySelectorAll('.is-drop-over')) if (n !== target) n.classList.remove('is-drop-over');
    target?.classList.add('is-drop-over');
  };

  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { kind, src, started } = drag;
    const target = started && !cancelled ? at(e, kind === 'piece' ? '[data-zone]' : kind === 'number' ? '[data-blank]' : '[data-x]') : null;
    stop();
    if (started) {
      // the press was a drag, not a tap: swallow the click that follows it
      const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    }
    if (!target) return;
    if (kind === 'piece') dispatch({ type: 'drop', piece: src.getAttribute('data-piece'), side: target.getAttribute('data-zone') });
    else if (kind === 'number') dispatch({ type: 'setAmount', value: Number(src.getAttribute('data-numval')) });
    else dispatch({ type: 'dropValue' });
  };
  const onUp = (e) => finish(e, false);
  const onCancel = (e) => finish(e, true);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);

  // keyboard: Enter or Space presses a focused group, chip or x box
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('[role="button"][data-action]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };
  root.addEventListener('keydown', onKey);
  const onDown = downHandler;
  return () => {
    stop();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    root.removeEventListener('keydown', onKey);
    root.removeEventListener('pointerdown', onDown);
  };
}
