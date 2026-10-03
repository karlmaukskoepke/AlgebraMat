// A one-time demonstration the first time Boxes & Circles asks for a lasso: a pointer presses at the left of the first
// term and drags across it, a dashed line growing behind it, a few times over. Any tap, press or key dismisses it.
// Once per device (`box-drag` in the tips store).

import { tipSeen, markTipSeen } from '../lightStore.js';

const TIP = 'box-drag';
let layer = null;
let off = null;

export function endDragDemo() {
  layer?.remove();
  layer = null;
  off?.();
  off = null;
}

const CURSOR = '<svg viewBox="0 0 24 28" width="34" height="40" aria-hidden="true"><path d="M3 2 L3 22 L8 17 L12 26 L16 24 L12 15 L19 15 Z" fill="#fff" stroke="#1f2430" stroke-width="2" stroke-linejoin="round"/></svg>';

// `kind` is the first term's shape: a box for an x term, a pill for a number.
export function maybeShowDragDemo(kind = 'circle') {
  if (tipSeen(TIP) || layer) return;
  setTimeout(() => {
    const target = document.querySelector('.box-mat .bm-text');            // the first part: the first term's number
    if (!target || layer || tipSeen(TIP) || !target.getClientRects().length) return;
    const r = target.getBoundingClientRect();
    markTipSeen(TIP);
    const left = r.left - 22;
    const width = r.width + 44;
    const top = r.top - 6;
    const height = r.height + 16;
    layer = document.createElement('div');
    layer.className = 'drag-demo';
    layer.setAttribute('aria-hidden', 'true');
    const ring = document.createElement('div');
    ring.className = `drag-demo-ring is-${kind}`;
    Object.assign(ring.style, { left: `${left}px`, top: `${top}px`, height: `${height}px`, width: '0px' });
    const cursor = document.createElement('div');
    cursor.className = 'drag-demo-cursor';
    cursor.innerHTML = CURSOR;
    Object.assign(cursor.style, { left: `${left - 6}px`, top: `${top + height - 12}px` });
    const caption = document.createElement('div');
    caption.className = 'drag-demo-caption';
    caption.textContent = `Press and drag across a term to ${kind === 'box' ? 'box' : 'circle'} it.`;
    Object.assign(caption.style, { left: `${Math.max(8, r.left + r.width / 2 - 170)}px`, top: `${Math.max(8, top - 56)}px` });
    layer.append(ring, cursor, caption);
    document.body.append(layer);
    const timing = { duration: 1500, iterations: 3, easing: 'ease-in-out', fill: 'forwards' };
    ring.animate([{ width: '0px', opacity: 1 }, { width: `${width}px`, opacity: 1 }], timing);
    const move = cursor.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${width}px)` }], timing);
    move.onfinish = endDragDemo;
    const stop = () => endDragDemo();
    document.addEventListener('pointerdown', stop, true);
    document.addEventListener('keydown', stop, true);
    off = () => { document.removeEventListener('pointerdown', stop, true); document.removeEventListener('keydown', stop, true); };
  }, 350);
}
