// Moving the number across the border (SPEC-SOLVE.md §8): press the group of counters, drag it over the border and let go.
// A short tap moves it too (and so does Enter or Space on it), so touch screens and keyboards need no dragging. Let go
// before the border and it springs back. The listeners live on the Mat's container, which is never replaced.

const TAP_SLOP = 7;      // a press that moves less than this is a tap
const PAST = 16;         // how far beyond the border the pointer must go to count as crossing

// Did the pointer, starting at `startX`, cross the border at `borderX`? (Past it by a little, on the other side.)
export function crossedBorder(startX, x, borderX) {
  return startX < borderX ? x > borderX + PAST : x < borderX - PAST;
}

function toDrawing(root, e) {
  const svg = root.querySelector('svg');
  const ctm = svg?.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export function bindSwitchMat(root, dispatch, getSession) {
  let drag = null;   // { id, x0, y0, group, borderX }

  const down = (e) => {
    const s = getSession();
    const group = e.target.closest?.('.sw-movable');
    if (!s || s.moved || !group || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = toDrawing(root, e);
    const borderX = Number(root.querySelector('svg')?.dataset.borderX);
    if (!p || !Number.isFinite(borderX)) return;
    e.preventDefault();
    drag = { id: e.pointerId, x0: p.x, y0: p.y, group, borderX };
    root.setPointerCapture?.(e.pointerId);
  };

  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toDrawing(root, e);
    if (!p) return;
    const dx = p.x - drag.x0;
    const dy = p.y - drag.y0;
    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return;
    drag.group.classList.add('is-dragging');
    drag.group.setAttribute('transform', `translate(${dx} ${dy})`);
  };

  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { x0, y0, group, borderX } = drag;
    const p = toDrawing(root, e) ?? { x: x0, y: y0 };
    drag = null;
    root.releasePointerCapture?.(e.pointerId);
    group.classList.remove('is-dragging');
    group.removeAttribute('transform');
    if (cancelled) return;
    const tapped = Math.abs(p.x - x0) < TAP_SLOP && Math.abs(p.y - y0) < TAP_SLOP;
    if (tapped || crossedBorder(x0, p.x, borderX)) dispatch({ type: 'move' });
  };

  root.addEventListener('pointerdown', down);
  root.addEventListener('pointermove', move);
  root.addEventListener('pointerup', (e) => finish(e, false));
  root.addEventListener('pointercancel', (e) => finish(e, true));
  // Keyboard and assistive technology: a click without a pointer (detail 0), or Enter/Space on the focused group.
  root.addEventListener('click', (e) => {
    if (e.detail === 0 && e.target.closest?.('.sw-movable') && !getSession()?.moved) dispatch({ type: 'move' });
  });
  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.sw-movable') && !getSession()?.moved) {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: 'move' });
    }
  });
  return () => {};
}
