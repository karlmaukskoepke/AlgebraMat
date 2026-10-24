// The ghost for moving an x-term across the = (Build R; the same as the distribute move's ghost hand, view/factorHint.js): while the
// reminder lights an x-term to move, after about 2.5 seconds with nothing done a faint copy of it travels across the = to the end of the
// other side, again and again until the student acts. Under reduced motion it fades in on the other side.

import { html } from './addBothMat.js';

const WAIT = 2500;
const EVERY = 2600;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindCrossHint(root) {
  let idleSince = Date.now();
  let last = 0;
  let seen = false;
  const acted = () => { idleSince = Date.now(); document.querySelectorAll('.lx-crossghost').forEach((g) => g.remove()); };
  const tick = () => {
    const term = root.isConnected && !root.closest('[hidden]') ? root.querySelector('.lx-live .lx-tok.is-crosshint') : null;
    if (!term || document.querySelector('.spot-layer.is-error')) { seen = false; return; }
    if (!seen) { seen = true; idleSince = Date.now(); }
    const now = Date.now();
    if (now - idleSince < WAIT || now - last < EVERY) return;
    const sides = [...root.querySelectorAll('.lx-live .lb-side')];
    const other = sides.find((sd) => !sd.contains(term));
    if (!other) return;
    last = now;
    const a = term.getBoundingClientRect();
    const o = other.getBoundingClientRect();
    const toLeft = o.right < a.left;
    const b = { left: toLeft ? o.left - 40 : o.right + 10, top: o.top, width: 30, height: o.height };
    const g = html('div', 'sv-ghost sv-hintghost lx-crossghost', [term.textContent.trim()], { 'aria-hidden': 'true' });
    document.body.append(g);
    const at = (r) => `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%)`;
    const still = reduceMotion();
    const anim = g.animate(still
      ? [{ transform: at(b), opacity: 0 }, { transform: at(b), opacity: 0.45 }, { transform: at(b), opacity: 0 }]
      : [{ transform: at(a), opacity: 0 }, { transform: at(a), opacity: 0.6, offset: 0.15 }, { transform: at(b), opacity: 0.6, offset: 0.8 }, { transform: at(b), opacity: 0 }],
    { duration: 1800, easing: 'ease-in-out' });
    anim.onfinish = () => g.remove();
    anim.oncancel = () => g.remove();
  };
  const timer = setInterval(tick, 250);
  document.addEventListener('pointerdown', acted, true);
  window.addEventListener('keydown', acted, true);
  return () => {
    clearInterval(timer);
    document.removeEventListener('pointerdown', acted, true);
    window.removeEventListener('keydown', acted, true);
    acted();
  };
}
