// Dragging a box or circle around a term (SPEC-BOXES.md §2 ① and Karl's notes).
//
// Press on the expression, drag across the parts you want (the operation and
// the number), and let go: the shape is drawn around everything between the two
// ends. While the finger or mouse is down, the covered parts light up (the
// session's `selecting`), so you see what you're taking before you release. A
// short tap does the same for one part, or removes a shape you tap.
//
// The listeners live on the Mat's container, which is never replaced, so a
// drag keeps going while the drawing is redrawn under it. Mouse, touch and pen
// all arrive as pointer events.

import { exprLayout, partNear, dragRange, shapeBounds, viewFor, SHAPE_TOP, SHAPE_HEIGHT, BOX_VIEW } from './boxLayout.js';

const BAND = 30;        // how far above or below the row a press still counts
const TAP_SLOP = 7;     // a press that moves less than this is a tap

// A pointer position in the drawing's own units.
function toDrawing(root, e) {
  const svg = root.querySelector('svg');
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

const inBand = (y) => y >= SHAPE_TOP - BAND && y <= SHAPE_TOP + SHAPE_HEIGHT + BAND;

// Which parts a lasso from (x0, y0) to (x, y) covers: the parts under its horizontal span, as long as it crosses the
// row of the expression (so a drag high above it takes nothing). null if it takes nothing.
export function lassoRange(layout, x0, y0, x, y) {
  const lo = Math.min(y0, y);
  const hi = Math.max(y0, y);
  if (hi < SHAPE_TOP - BAND || lo > SHAPE_TOP + SHAPE_HEIGHT + BAND) return null;
  return dragRange(layout, x0, x);
}

export function bindBoxMat(root, dispatch, getSession) {
  let drag = null; // { id, x0, y0, layout, part, range }

  const down = (e) => {
    const s = getSession();
    if (!s || s.step !== 'boxcircle' || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = toDrawing(root, e);
    if (!p || p.x < 0 || p.x > BOX_VIEW.width) return;
    const view = viewFor(s.problem);
    if (p.y < view.y || p.y > BOX_VIEW.height) return;
    // A press anywhere on the Mat starts a lasso (the dashed line follows it); a tap lands on the part under it.
    const layout = exprLayout(s.problem);
    const part = inBand(p.y) ? partNear(layout, p.x) : -1;
    e.preventDefault();
    if (!s.tool) { dispatch({ type: 'drawShape', from: Math.max(part, 0), to: Math.max(part, 0) }); return; } // says "pick a tool first"
    drag = { id: e.pointerId, x0: p.x, y0: p.y, layout, part, range: null };
    root.setPointerCapture?.(e.pointerId);
  };

  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toDrawing(root, e);
    if (!p) return;
    if (Math.abs(p.x - drag.x0) < TAP_SLOP && Math.abs(p.y - drag.y0) < TAP_SLOP) return;   // still a tap
    const range = lassoRange(drag.layout, drag.x0, drag.y0, p.x, p.y);
    drag.range = range;
    dispatch({ type: 'selecting', from: range?.from, to: range?.to, rect: { x0: drag.x0, y0: drag.y0, x1: p.x, y1: p.y } });
  };

  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { x0, y0, layout, part } = drag;
    const p = toDrawing(root, e) ?? { x: x0, y: y0 };
    const range = lassoRange(layout, x0, y0, p.x, p.y);
    drag = null;
    root.releasePointerCapture?.(e.pointerId);
    if (cancelled) { dispatch({ type: 'selecting', clear: true }); return; }
    const tapped = Math.abs(p.x - x0) < TAP_SLOP && Math.abs(p.y - y0) < TAP_SLOP;
    if (tapped) {
      dispatch({ type: 'selecting', clear: true });
      // A tap on a finished shape takes it away; otherwise it shapes the one part.
      const s = getSession();
      const hit = s.shapes.map((shape, i) => ({ shape, i, b: shapeBounds(layout, shape.from, shape.to) }))
        .filter(({ b }) => x0 >= b.x && x0 <= b.x + b.width && y0 >= b.y && y0 <= b.y + b.height)
        .pop();
      if (hit) { dispatch({ type: 'removeShape', index: hit.i }); return; }
      if (part >= 0) dispatch({ type: 'drawShape', from: part, to: part });
      return;
    }
    if (!range) { dispatch({ type: 'selecting', clear: true }); return; }          // the lasso took nothing
    dispatch({ type: 'drawShape', from: range.from, to: range.to });
  };

  const up = (e) => finish(e, false);
  const cancel = (e) => finish(e, true);

  root.addEventListener('pointerdown', down);
  root.addEventListener('pointermove', move);
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', cancel);
  return () => {
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerup', up);
    root.removeEventListener('pointercancel', cancel);
  };
}
