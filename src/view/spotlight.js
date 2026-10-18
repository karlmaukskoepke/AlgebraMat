// The spotlight message (Build C, Part 2), the view half; the logic is engine/spotlight.js. Shared by every Solve it card: a card's
// screen appends `spotlightLayer(...)` to its own root. An overlay, so nothing on the page moves to make room.
//   ERROR: the page dims (about 60%); the wrong thing is lit (an outline and a small label, never colour alone); the message pops up
//   right beside it, never over it (right, else left, else below, else above). Undo, the only way out, is drawn above the dimming,
//   pulsing (a steady ring for reduced motion), and has the focus: Enter or Space presses it. role="alertdialog", said once.
//   HINT: no dimming; the thing it is about is outlined, the move to make is highlighted, and the hint pops up beside it with Got it.
//   ASK: a question the card is asking at a place (a light dim, nothing held back), with its answer buttons in the bubble.

const BOX_W = 340;
const GAP = 14;

let place = null;                     // the latest layer's placement, run again when the window changes size
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => place?.());
  // while an error is up, the keyboard has one thing to do: Enter or Space presses Undo; every other key is held back
  window.addEventListener('keydown', (e) => {
    const undo = document.querySelector('.spot-layer.is-error .spot-undo');
    if (!undo || e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) undo.click();
    else undo.focus({ preventScroll: true });
  }, true);
}

const el = (tag, cls, kids = [], attrs = {}) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
  n.append(...kids);
  return n;
};

// spot: { kind: 'error' | 'hint', target, label, move }; o: { root, find(root, target) → Element, text, undo: selector, moveSel(move) → selector }
export function spotlightLayer(spot, o) {
  const error = spot.kind === 'error';
  const layer = el('div', `spot-layer is-${spot.kind}`, [], { 'data-spot': spot.target });
  const frame = el('div', 'spot-frame', spot.label ? [el('span', 'spot-label', [spot.label])] : []);
  const textId = `spot-text-${Math.random().toString(36).slice(2, 8)}`;
  const box = el('div', 'spot-box', [el('p', 'spot-text', [o.text], { id: textId })], error
    ? { role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': textId }
    : { role: 'status', 'aria-live': 'polite' });
  if (spot.kind === 'ask') {
    if (spot.choices) box.append(el('div', 'spot-choices', spot.choices.map(([label, value]) => el('button', `btn ${value === 'party' ? 'btn-party' : value === 'battle' ? 'btn-battle' : ''}`, [label], { type: 'button', 'data-action': 'kind', 'data-value': value }))));
  } else if (error) {
    const dim = el('div', 'spot-dim');                                          // catches every tap outside Undo, and gives Undo the focus back
    dim.addEventListener('pointerdown', (e) => { e.preventDefault(); layer.querySelector('.spot-undo')?.focus({ preventScroll: true }); });
    layer.append(dim);
    box.append(el('p', 'spot-way', ['Press Undo to go on.']));
  } else {
    box.append(el('button', 'btn spot-gotit', ['Got it'], { type: 'button', 'data-action': 'spotDismiss' }));
  }
  layer.append(frame, box);

  const run = () => {
    if (!layer.isConnected) return;
    const target = o.find(o.root, spot.target);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!target) { frame.hidden = true; Object.assign(box.style, { left: `${(vw - BOX_W) / 2}px`, top: '120px' }); }
    else {
      const r = target.getBoundingClientRect();
      const pad = 6;
      Object.assign(frame.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      // beside it: right, else left, else below, else above; never over it, and never taller than the room it has
      const bh = box.offsetHeight;
      // the label sits on the frame's top edge and may be wider than it: the box clears it too
      const lw = frame.querySelector('.spot-label')?.offsetWidth ?? 0;
      const right = Math.max(r.right + pad, r.left - pad - 4 + lw);
      const fitsV = (top) => top >= 8 && top + bh <= vh - 8;
      const midTop = Math.min(Math.max(8, r.top + r.height / 2 - bh / 2), vh - 8 - bh);
      let left; let top;
      if (right + GAP + BOX_W <= vw - 8 && fitsV(midTop)) { left = right + GAP; top = midTop; box.dataset.side = 'right'; }
      else if (r.left - pad - GAP - BOX_W >= 8 && fitsV(midTop)) { left = r.left - pad - GAP - BOX_W; top = midTop; box.dataset.side = 'left'; }
      else if (r.bottom + pad + GAP + bh <= vh - 8) { left = r.left + r.width / 2 - BOX_W / 2; top = r.bottom + pad + GAP; box.dataset.side = 'below'; }
      else { left = r.left + r.width / 2 - BOX_W / 2; top = Math.max(8, r.top - pad - GAP - bh); box.dataset.side = 'above'; }
      Object.assign(box.style, { left: `${Math.min(Math.max(8, left), vw - BOX_W - 8)}px`, top: `${top}px` });
    }
    if (error) {
      // Undo above the dimming: a copy at the very place of the real one, pulsing, with the focus
      layer.querySelector('.spot-undo')?.remove();
      const real = o.root.querySelector(o.undo);
      if (real) {
        const r = real.getBoundingClientRect();
        const copy = real.cloneNode(true);
        copy.classList.add('spot-undo');
        copy.disabled = false;
        copy.removeAttribute('data-lx-focus');
        Object.assign(copy.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        layer.append(copy);
        if (had || !layer.dataset.focused) copy.focus({ preventScroll: true });
        layer.dataset.focused = '1';
      }
    } else if (spot.move && o.moveSel) {
      o.root.querySelector(o.moveSel(spot.move))?.classList.add('spot-move');
    }
  };
  place = run;
  requestAnimationFrame(run);
  // a move's new row fades in after its work row: the error waits for it (so the move is seen first), and is placed again then
  requestAnimationFrame(() => {
    if (error && o.root.querySelector('.lb-stack .lb-rowwrap.has-work + .lb-rowwrap:not(.is-settled)')) layer.classList.add('is-late');
  });
  for (const ms of [380, 800, 2150]) setTimeout(run, ms);
  return layer;
}

// Where a target is on a Solve it screen (the work stack's rows, the substitution, the x = field), for any card that draws them
// with the shared classes. `failSide` and `coef` are Divide it's.
export function findSolveTarget(root, target, s = null) {
  const rows = [...root.querySelectorAll('.lb-stack .lb-rowwrap')];
  const eqRows = rows.filter((r) => !r.classList.contains('has-work'));
  const newest = eqRows.at(-1) ?? null;
  const sides = (row) => [...(row?.querySelectorAll('.lb-side') ?? [])];
  const hasX = (side) => Boolean(side.querySelector('.lb-x, [data-x]'));
  switch (target) {
    case 'xnum': {
      const side = sides(newest).find(hasX);
      return side?.querySelector('.lb-num') ?? side ?? newest;
    }
    case 'otherSide': return sides(newest).find((sd) => !hasX(sd)) ?? newest;
    case 'lastMove': return rows.filter((r) => r.classList.contains('has-work')).at(-1) ?? newest;
    case 'subst': return root.querySelector('.lx-subst li:last-child, .lb-subst li:last-child') ?? root.querySelector('.lx-subst, .lb-subst');
    case 'answer': return root.querySelector('[data-fk="answer"], .lb-typed');
    case 'failSide': {
      const row = root.querySelector('.lb-work.is-failed');
      if (!row || !s?.fail) return row;
      if (!s.fail.boxesSplit && s.fail.countersSplit) return row.querySelector('.lb-left') ?? row;
      if (s.fail.boxesSplit && !s.fail.countersSplit) return row.querySelector('.lb-right') ?? row;
      return row;
    }
    case 'coef': return newest?.querySelector('.lb-hintbox, .lb-coef, .lb-x') ?? newest;
    default: return null;
  }
}
