// The pop-ups of the light design (Build C, Part 2; Build D, Part 1), the view half; the logic is engine/spotlight.js. Shared by every
// Solve it card: a card's screen appends `spotlightLayer(...)` to its own root. An overlay, so nothing on the page moves to make room.
// There is no banner: every message is one of these.
//   ERROR: the page dims (about 60%); the wrong thing is lit (an outline and a small label under it, never colour alone); the message
//   pops up BELOW the equation and the work, never over an equation or any work (it may cover greyed things, like x =). Undo, the
//   only way out, is drawn above the dimming, pulsing (a steady ring for reduced motion), with a hopping arrow pointing at it (a
//   steady arrow for reduced motion), and has the focus: Enter or Space presses it. role="alertdialog", said once.
//   HINT: no dimming; the thing it is about is outlined, the move to make is highlighted, and the hint pops up beside it. The green
//   button says Got it.
//   ASK: a question the card is asking at a place (a light dim, nothing held back), floating directly above it, with its answer
//   buttons in the bubble.
//   INTRO: the page greys out except what it lights (the problem, the moves); nothing is held back. Below the work.
//   NOTE: a message with nothing lit and nothing dimmed, below the work. NUDGE: a small note next to the x = field (type a number,
//   too big...), with nothing to undo.

const BOX_W = 340;
const NUDGE_W = 270;
const GAP = 14;
const SVG_NS = 'http://www.w3.org/2000/svg';

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
const svgEl = (name, attrs = {}) => {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

// A rounded rectangle as a path (for the holes in the dimming).
const roundRect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// The greying: the whole page, with a hole at each lit rectangle. Purely visual (taps go through), except under an error, where a
// transparent catcher holds every tap back.
function dimmer(strength) {
  const svg = svgEl('svg', { class: `spot-dimsvg is-${strength}`, 'aria-hidden': 'true' });
  svg.append(svgEl('path', { 'fill-rule': 'evenodd' }));
  return svg;
}
function drawDim(svg, rects) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  svg.setAttribute('width', vw);
  svg.setAttribute('height', vh);
  const holes = rects.filter(Boolean).map((r) => roundRect(r.left - 6, r.top - 6, r.width + 12, r.height + 12, 10)).join('');
  svg.firstChild.setAttribute('d', `M0 0H${vw}V${vh}H0Z${holes}`);
}

// Lit rectangles that touch or nearly touch become one hole (a problem and its preview row are lit as one).
function mergeRects(list) {
  const rs = list.map((q) => ({ left: q.left, top: q.top, right: q.right ?? q.left + q.width, bottom: q.bottom ?? q.top + q.height }));
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < rs.length && !changed; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i]; const b = rs[j];
        if (a.left < b.right + 16 && b.left < a.right + 16 && a.top < b.bottom + 16 && b.top < a.bottom + 16) {
          rs[i] = { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) };
          rs.splice(j, 1);
          changed = true;
          break;
        }
      }
    }
  }
  return rs.map((q) => ({ left: q.left, top: q.top, width: q.right - q.left, height: q.bottom - q.top }));
}

// The bottom of what is written so far (the rows of the work and of the check), so a pop-up placed below never covers any of it.
function workBottom(o) {
  let bottom = 0;
  for (const n of o.root.querySelectorAll(o.workRows ?? '.lb-stack .lb-rowwrap, .lx-ghost.is-chosen, .lx-ghost.is-preview, .sv-check .sv-checkrow, .lx-subst li, .lb-subst li')) {
    const r = n.getBoundingClientRect();
    if (r.height && n.offsetParent !== null) bottom = Math.max(bottom, r.bottom);
  }
  return bottom;
}

// What a pop-up must never cover: every row of the work and of the check; and, unless it is an error (which greys them), the controls.
// (A question asked at a place floats right above it, over the greyed rows: only the controls are kept clear.)
function protectedRects(o, error, kind) {
  const rows = kind === 'ask' ? '' : '.lb-stack .lb-rowwrap .lb-eq, .lx-ghost.is-chosen .lb-eq, .lx-ghost.is-preview .lb-eq, .sv-check .sv-checkrow, .ab-boardwrap svg, ';
  const sel = `${rows}${error ? '.lb-stack .lb-rowwrap .lb-eq' : '.lx-answer, .lx-panel, .lx-corners .btn:not(:disabled), .lb-fractionrow:not(.is-off), .ab-tray, .ab-sidebtns, .alone-tray'}`;
  const out = [];
  for (const n of o.root.querySelectorAll(sel)) {
    const k = contentRect(n);
    if (k) out.push(k);
  }
  return out;
}
// The part of an element that is ink: the union of its children's boxes (an equation row is as wide as the screen; its terms are not).
function contentRect(n) {
  const kids = [...n.querySelectorAll('.lx-tok, .lb-num, .lb-x, .lb-plus, .lb-equals, .lx-box, .lb-coef, .lb-frac, .lx-paren, .sv-checkrow')];
  const rects = (kids.length ? kids : [n]).map((k) => k.getBoundingClientRect()).filter((q) => q.width && q.height);
  if (!rects.length) return null;
  return { left: Math.min(...rects.map((q) => q.left)), top: Math.min(...rects.map((q) => q.top)), right: Math.max(...rects.map((q) => q.right)), bottom: Math.max(...rects.map((q) => q.bottom)) };
}
// The box round several elements.
function unionRect(list) {
  const rs = list.map((n) => contentRect(n)).filter(Boolean);
  if (!rs.length) return null;
  return { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) };
}

// Where a pop-up may go, best first.
function candidates({ kind, spot, r, pad, labelBottom, bw, bh, area, side, workBottom: wb, vw, vh, anchorTop }) {
  const out = [];
  const mid = (x) => x - bw / 2;
  const sideAt = (top) => side && side.width > 200 && { name: 'side', left: side.left + 12, top: Math.min(Math.max(8, top), vh - bh - 8) };
  const sideHigh = side && side.width > 200 && { name: 'sidehigh', left: side.left + 12, top: 8 };
  if (kind === 'error' || !r) {
    out.push({ name: 'below', left: mid(spot.alignTarget && r ? r.left + r.width / 2 : area.left + area.width / 2), top: Math.max(wb, labelBottom) + GAP });
    out.push(sideAt(r ? r.top - 4 : anchorTop));
    out.push({ name: 'low', left: mid(area.left + area.width / 2), top: vh - 8 - bh });
    return out.filter(Boolean);
  }
  const below = { name: 'below', left: mid(r.left + r.width / 2), top: Math.max(labelBottom, r.bottom + pad) + GAP };
  const above = { name: 'above', left: mid(r.left + r.width / 2), top: r.top - pad - GAP - bh };
  const right = { name: 'right', left: r.right + pad + GAP, top: r.top + r.height / 2 - bh / 2 };
  const leftOf = { name: 'left', left: r.left - pad - GAP - bw, top: r.top + r.height / 2 - bh / 2 };
  const where = spot.place ?? (kind === 'ask' ? 'above' : kind === 'nudge' ? 'field' : 'below');
  if (where === 'above') out.push(above, below, sideAt(r.top), right, leftOf);
  else if (where === 'field') out.push(above, right, leftOf, below);
  else if (where === 'beside') out.push(right, leftOf, below, above, sideAt(r.top));
  else out.push(below, sideAt(r.top), right, leftOf, above);
  out.push(sideHigh, { name: 'workbelow', left: mid(area.left + area.width / 2), top: wb + GAP }, { name: 'low', left: mid(area.left + area.width / 2), top: vh - 8 - bh });
  return out.filter(Boolean);
}

// spot: { kind, target, label, move, lit: [targets], place, buttons } ; o: { root, find(root, target) → Element, text, undo: selector,
// moveSel(move) → selector, work: selector of the work area }
export function spotlightLayer(spot, o) {
  const kind = spot.kind;
  const error = kind === 'error';
  const layer = el('div', `spot-layer is-${kind}`, [], { 'data-spot': spot.target ?? '' });
  const dimStrength = error ? 'strong' : kind === 'intro' || kind === 'ask' || spot.dim === 'strong' ? 'medium' : spot.dim === 'light' ? 'light' : null;
  const dim = dimStrength ? dimmer(dimStrength) : null;
  if (dim) layer.append(dim);
  const frame = spot.target && kind !== 'note' && kind !== 'nudge' && (kind !== 'intro' || spot.label)
    ? el('div', 'spot-frame', spot.label ? [el('span', `spot-label${spot.labelTop ? ' is-top' : ''}`, [spot.label])] : []) : null;
  const textId = `spot-text-${Math.random().toString(36).slice(2, 8)}`;
  const box = el('div', `spot-box${kind === 'nudge' ? ' is-small' : ''}`, o.text ? [el('p', 'spot-text', [o.text], { id: textId })] : [], error
    ? { role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': textId }
    : { role: 'status', 'aria-live': 'polite' });
  if (kind === 'ask' && spot.choices) {
    box.append(el('div', 'spot-choices', spot.choices.map(([label, value]) => el('button', `btn ${value === 'party' ? 'btn-party' : value === 'battle' ? 'btn-battle' : ''}`, [label], { type: 'button', 'data-action': spot.choiceAction ?? 'kind', 'data-value': value }))));
  }
  if (o.extra) box.append(o.extra);                       // a card's own content in the bubble (Divide's boxes and its fractions)
  let arrow = null;
  if (error) {
    const catcher = el('div', 'spot-dim');                                     // catches every tap outside Undo, and gives Undo the focus back
    catcher.addEventListener('pointerdown', (e) => { e.preventDefault(); layer.querySelector('.spot-undo')?.focus({ preventScroll: true }); });
    layer.append(catcher);
    arrow = el('div', 'spot-arrow', [], { 'aria-hidden': 'true' });
    const svg = svgEl('svg', { viewBox: '0 0 48 36', width: 48, height: 36 });
    svg.append(svgEl('path', { d: 'M4 18 L20 4 V12 H44 V24 H20 V32 Z' }));
    arrow.append(svg);
  }
  if (frame) layer.append(frame);
  if (o.text || o.extra) layer.append(box);
  if (arrow) layer.append(arrow);

  const find = (t) => (typeof t === 'string' ? o.find(o.root, t) : t);
  const box0 = (n) => (Array.isArray(n) ? unionRect(n) : n ? contentRect(n) : null);
  const run = () => {
    if (!layer.isConnected) return;
    const target = spot.target ? find(spot.target) : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 6;
    const c = box0(target);                                         // the ink of the target, not its whole row
    const r = c ? { left: c.left, top: c.top, right: c.right, bottom: c.bottom, width: c.right - c.left, height: c.bottom - c.top } : null;
    if (frame) {
      if (!r) frame.hidden = true;
      else {
        frame.hidden = false;
        Object.assign(frame.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      }
    }
    // what is lit: the target, and whatever else the spot names (the problem, the moves, the green button)
    const lit = mergeRects([...(frame && r ? [r] : []), ...(spot.lit ?? []).map((t) => box0(find(t))).filter(Boolean).map((q) => ({ left: q.left, top: q.top, width: q.right - q.left, height: q.bottom - q.top, right: q.right, bottom: q.bottom }))]);
    if (error) {
      // Undo above the dimming: a copy at the very place of the real one, pulsing, with the focus, and the arrow hopping at it
      layer.querySelector('.spot-undo')?.remove();
      const real = o.root.querySelector(o.undo);
      if (real) {
        const ur = real.getBoundingClientRect();
        const copy = real.cloneNode(true);
        copy.classList.add('spot-undo');
        copy.disabled = false;
        copy.removeAttribute('data-lx-focus');
        Object.assign(copy.style, { left: `${ur.left}px`, top: `${ur.top}px`, width: `${ur.width}px`, height: `${ur.height}px` });
        layer.append(copy);
        Object.assign(arrow.style, { left: `${ur.right + 10}px`, top: `${ur.top + ur.height / 2 - 18}px` });
        if (!layer.dataset.focused) copy.focus({ preventScroll: true });
        layer.dataset.focused = '1';
        lit.push(ur);
      }
    }
    if (dim) drawDim(dim, lit);

    const bw = kind === 'nudge' ? NUDGE_W : BOX_W;
    box.style.width = `${bw}px`;
    const bh = box.offsetHeight;
    // One rule (Build D, Part 1): the message goes below wherever the action is; with no room there, the nearest free space that covers
    // no equation and no work (nor, unless it is an error, the controls still in use: x =, the green button, the moves, Undo).
    const labelBottom = frame && r ? r.bottom + pad + (frame.querySelector('.spot-label')?.offsetHeight ?? 0) + 4 : 0;
    const keep = protectedRects(o, error, kind);
    if (r) keep.push({ left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: labelBottom || r.bottom + pad });
    const undoCopy = layer.querySelector('.spot-undo');
    if (undoCopy) { const ur = undoCopy.getBoundingClientRect(); keep.push({ left: ur.left, top: ur.top, right: ur.right + 70, bottom: ur.bottom }); }
    const area = o.root.querySelector(o.work ?? '.lb-main')?.getBoundingClientRect() ?? { left: 0, right: vw, width: vw };
    const side = o.root.querySelector('.sv-work:not(.is-checking) .sv-check')?.getBoundingClientRect();
    const cands = candidates({ kind, spot, r, pad, labelBottom, bw, bh, area, side, workBottom: workBottom(o), vw, vh, anchorTop: lit[0]?.top ?? area.top });
    const fits = (c) => c.left >= 8 && c.top >= 8 && c.left + bw <= vw - 8 && c.top + bh <= vh - 8
      && !keep.some((k) => c.left < k.right + 4 && c.left + bw > k.left - 4 && c.top < k.bottom + 4 && c.top + bh > k.top - 4);
    const pick = cands.find(fits) ?? cands[0];
    if (typeof window !== 'undefined' && window.__spotDebug) window.__spotDebug.push({ cands, keep, bw, bh, pick: pick.name });
    let { left, top } = pick;
    box.dataset.side = pick.name;
    left = Math.min(Math.max(8, left), vw - bw - 8);
    top = Math.min(Math.max(8, top), vh - bh - 8);
    Object.assign(box.style, { left: `${left}px`, top: `${top}px` });
    if (!error && spot.move && o.moveSel) o.root.querySelector(o.moveSel(spot.move))?.classList.add('spot-move');
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
  const hasX = (side) => Boolean(side.querySelector('.lb-x, [data-x], .lx-tok[data-like="x"]'));
  switch (target) {
    case 'xnum': {
      const side = sides(newest).find(hasX);
      return side?.querySelector('.lx-tok[data-like="num"], .lb-num') ?? side ?? newest;
    }
    case 'otherSide': return sides(newest).find((sd) => !hasX(sd)) ?? newest;
    case 'lastMove': return rows.filter((r) => r.classList.contains('has-work')).at(-1) ?? newest;
    case 'newest': return newest?.querySelector('.lb-eq') ?? newest;
    case 'plugrow': return root.querySelector('.is-plugrow .lb-eq');
    case 'original': return eqRows[0]?.querySelector('.lb-eq') ?? eqRows[0] ?? null;
    case 'preview': return root.querySelector('.lx-ghost.is-preview .lb-eq, .lx-ghost.is-near .lb-eq, .lx-ghost.is-chosen .lb-eq');
    case 'subst': return root.querySelector('.sv-check .sv-mark, .lx-subst li:last-child, .lb-subst li:last-child') ?? root.querySelector('.lx-subst, .lb-subst');
    case 'check': return root.querySelector('.sv-check');
    case 'answer': return root.querySelector('[data-fk="answer"], .lb-typed');
    case 'forward': return root.querySelector('.btn-forward');
    case 'panel': return root.querySelector('.lx-panel');
    case 'combining': return [...root.querySelectorAll('.ab-boardwrap .is-combining')];
    case 'pair': return [...root.querySelectorAll('.lx-live .lx-tok.is-pair')];
    case 'sumbox': return root.querySelector('.lx-box.is-sum');
    case 'blank': return root.querySelector('.lx-ghost.is-chosen .lx-box:not(.is-mirror)');
    case 'fractions': return root.querySelector('.lb-fractionrow');
    case 'board': return root.querySelector('.ab-boardwrap, .sv-diagram .gd');
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
