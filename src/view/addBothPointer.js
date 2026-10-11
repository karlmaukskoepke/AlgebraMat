// Dragging the typed answer onto x (the early answer's check, SPEC-ADD-TO-BOTH-SIDES.md §4). Press the number, drag it
// over the x box, let go. The tap alternative is just tapping x (it carries its own data-action), and Enter or Space on a
// focused group or x does what a tap does, so a keyboard needs no dragging. Listeners live on the Mat's container.

export function bindAddBothMat(root, dispatch, getSession) {
  let drag = null;   // { id, chip, x0, y0 }

  const toDrawing = (e) => {
    const svg = root.querySelector('svg');
    const ctm = svg?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  root.addEventListener('pointerdown', (e) => {
    const chip = e.target.closest?.('[data-chip]');
    if (!chip || drag || getSession()?.early?.step !== 'drag' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = toDrawing(e);
    if (!p) return;
    e.preventDefault();
    drag = { id: e.pointerId, chip, x0: p.x, y0: p.y };
    root.setPointerCapture?.(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toDrawing(e);
    if (p) drag.chip.setAttribute('transform', `translate(${p.x - drag.x0} ${p.y - drag.y0})`);
  });
  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { chip } = drag;
    drag = null;
    root.releasePointerCapture?.(e.pointerId);
    const target = root.querySelector('[data-x]');
    const r = target?.getBoundingClientRect();
    const over = r && e.clientX >= r.left - 12 && e.clientX <= r.right + 12 && e.clientY >= r.top - 12 && e.clientY <= r.bottom + 12;
    chip.removeAttribute('transform');
    if (!cancelled && over) dispatch({ type: 'dropValue' });
  };
  root.addEventListener('pointerup', (e) => finish(e, false));
  root.addEventListener('pointercancel', (e) => finish(e, true));

  // keyboard: Enter or Space presses a focused group, chip or x box
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('[role="button"][data-action]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  return () => {};
}
