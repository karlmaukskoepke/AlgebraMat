// The ghost hand for the distribute move (Build M; the same as the check's value-to-x hint, view/solveScreen.js): while the factor is
// lit (the reminder after Undo or I'm stuck, or the ring of a forced move), after about 2.5 seconds with nothing done a faint copy of the
// factor travels from it to its parenthesis, again and again until the student acts. Under reduced motion it fades in at the parenthesis.

import { html } from './addBothMat.js';

const WAIT = 2500;
const EVERY = 2600;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindFactorHint(root) {
  let idleSince = Date.now();
  let last = 0;
  let seen = false;
  const acted = () => { idleSince = Date.now(); document.querySelectorAll('.lx-handghost').forEach((g) => g.remove()); };
  const tick = () => {
    const factor = root.isConnected && !root.closest('[hidden]') ? root.querySelector('.lx-live .lx-factor.is-hint, .lx-live .lx-factor.is-ring') : null;
    if (!factor || document.querySelector('.spot-layer.is-error')) { seen = false; return; }
    if (!seen) { seen = true; idleSince = Date.now(); }
    const now = Date.now();
    if (now - idleSince < WAIT || now - last < EVERY) return;
    const paren = factor.parentElement?.querySelector('.lx-paren') ?? root.querySelector('.lx-live .lx-paren');
    if (!paren) return;
    last = now;
    const a = factor.getBoundingClientRect();
    const b = paren.getBoundingClientRect();
    const g = html('div', 'sv-ghost sv-hintghost lx-handghost', [factor.textContent], { 'aria-hidden': 'true' });
    document.body.append(g);
    g.style.left = '0px';
    g.style.top = '0px';
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
    document.querySelectorAll('.lx-handghost').forEach((g) => g.remove());
  };
}
