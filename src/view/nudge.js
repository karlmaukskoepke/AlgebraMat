// The nudge, the screen half (loop spec rev 2.5, §2A; Build P, Part 1). One component for every nudge: after about 2.5 seconds with
// nothing happening (any key, click or drag starts the wait again), the target glows and pulses for about 1.5 seconds; if still nothing,
// a small pop-up says what to do (placed by the pop-ups' rule, never over the equation or the work) and a faint ghost shows the action:
// a copy of one term gliding onto the other, or a click at the place to click. Reduced motion: a steady highlight and a still ghost. It
// repeats gently (the ghost again every few seconds), never stacks, never shows while a spotlight, an error, a scaffold or another pop-up
// is up, and clears on any input. A nudge is not help: it dispatches nothing, so nothing is recorded. What to nudge is engine/nudge.js.

import { html } from './addBothMat.js';
import { spotlightLayer } from './spotlight.js';
import { nudgeOf, calcParams } from '../engine/nudge.js';

export const NUDGE_WAIT = 2500;        // idle before the glow
const GLOW_MS = 1500;                  // the glow alone, before the pop-up
const GHOST_EVERY = 3600;              // the ghost again, while nothing happens
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The words of each nudge
export function nudgeText(n, s) {
  if (n.kind === 'combine') return 'Drag one onto the other to combine them.';
  if (n.kind === 'calc') {
    const t = [...s.board.left, ...s.board.right].find((u) => u.id === n.id);
    const p = calcParams(s, t);
    return p.div ? `Click the fraction bar to divide ${p.b} by ${p.by}.` : `Click the × to work out ${p.expr}.`;
  }
  return '';
}

// The elements a nudge is about, on the screen as drawn: [the term to drag or the place to click, the term it goes onto]
function targetsOf(root, n) {
  const tok = (id) => root.querySelector(`.lx-live [data-tok="${id}"]`);
  if (n.kind === 'combine') return [tok(n.a), tok(n.b)].filter(Boolean);
  if (n.kind === 'calc') return [root.querySelector(`.lb-stack [data-action="lxCalc"][data-id="${n.id}"]`)].filter(Boolean);   // (the × or the fraction bar)
  return [];
}

// Something else is up: a pop-up of any kind, a dialog, a value or a term being carried, a move's preview, the screen hidden
function busy(root) {
  if (!root.isConnected || root.closest('[hidden]')) return true;
  if (root.querySelector('.spot-layer') || document.querySelector('dialog[open], .spot-layer:not(.is-nudgelayer)')) return true;
  if (root.querySelector('.lx-ghost.is-preview, .lx-ghost.is-near, .lx-ghost.is-chosen, .lx-tok.is-held, .is-carrying') || root.classList.contains('is-carrying-value')) return true;
  return document.querySelector('.sv-ghost:not(.sv-hintghost), .lx-dragghost') !== null;
}

export function bindNudge(root, getSession, { of = nudgeOf, text = nudgeText } = {}) {
  let idleSince = Date.now();
  let phase = 'none';                  // none → glow → pop
  let current = null;                  // the nudge on screen: its key, targets and layer
  let lastGhost = 0;

  const keyOf = (n) => `${n.kind}:${n.a ?? n.id}:${n.b ?? ''}`;
  function clear() {
    if (current) {
      current.targets.forEach((t) => t.classList.remove('nudge-glow', 'nudge-still'));
      current.layer?.remove();
    }
    document.querySelectorAll('.nudge-ghost').forEach((g) => g.remove());
    current = null;
    phase = 'none';
  }
  const reset = () => { idleSince = Date.now(); clear(); };

  function ghost(n, targets) {
    const still = reduceMotion();
    const at = (r) => `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%)`;
    if (n.kind === 'combine' && targets.length === 2) {
      const [a, b] = targets.map((t) => t.getBoundingClientRect());
      const g = html('div', 'nudge-ghost is-term', [targets[0].textContent.replace(/^\s*\+\s*/, '').trim()], { 'aria-hidden': 'true' });
      g.style.font = getComputedStyle(targets[0]).font;
      document.body.append(g);
      const anim = g.animate(still
        ? [{ transform: at(b), opacity: 0 }, { transform: at(b), opacity: 0.45 }, { transform: at(b), opacity: 0 }]
        : [{ transform: at(a), opacity: 0 }, { transform: at(a), opacity: 0.55, offset: 0.15 }, { transform: at(b), opacity: 0.55, offset: 0.8 }, { transform: at(b), opacity: 0 }],
      { duration: 1800, easing: 'ease-in-out' });
      anim.onfinish = () => g.remove();
      anim.oncancel = () => g.remove();
      return;
    }
    if (targets[0]) {
      // a ghost click: a ring that closes in on the place to click, twice
      const r = targets[0].getBoundingClientRect();
      const g = html('div', 'nudge-ghost is-click', [], { 'aria-hidden': 'true' });
      document.body.append(g);
      const anim = g.animate(still
        ? [{ transform: `${at(r)} scale(1)`, opacity: 0 }, { transform: `${at(r)} scale(1)`, opacity: 0.6 }, { transform: `${at(r)} scale(1)`, opacity: 0 }]
        : [{ transform: `${at(r)} scale(2)`, opacity: 0 }, { transform: `${at(r)} scale(1)`, opacity: 0.7, offset: 0.4 }, { transform: `${at(r)} scale(0.8)`, opacity: 0.7, offset: 0.5 }, { transform: `${at(r)} scale(1.4)`, opacity: 0 }],
      { duration: 1400, easing: 'ease-out', iterations: 2 });
      anim.onfinish = () => g.remove();
      anim.oncancel = () => g.remove();
    }
  }

  function tick() {
    const s = getSession?.();
    const n = s ? of(s) : null;
    if (!n || busy(root)) { if (current) clear(); return; }
    const now = Date.now();
    if (current && current.key !== keyOf(n)) clear();
    if (now - idleSince < NUDGE_WAIT) return;
    const targets = current?.targets.every((t) => t.isConnected) ? current.targets : targetsOf(root, n);
    if (!targets.length) return;
    if (phase === 'none') {
      current = { key: keyOf(n), targets, layer: null };
      targets.forEach((t) => t.classList.add(reduceMotion() ? 'nudge-still' : 'nudge-glow'));
      phase = 'glow';
      return;
    }
    if (phase === 'glow' && now - idleSince >= NUDGE_WAIT + GLOW_MS) {
      const words = text(n, s);
      const layer = spotlightLayer({ kind: 'nudge', target: targets.length > 1 ? targets : targets[0], place: 'below' }, { root, find: () => null, text: words, keepPlace: true });
      layer.classList.add('is-nudgelayer');
      document.body.append(layer);
      current.layer = layer;
      phase = 'pop';
      lastGhost = 0;
    }
    if (phase === 'pop' && now - lastGhost >= GHOST_EVERY) {
      lastGhost = now;
      ghost(n, current.targets);
    }
  }

  const timer = setInterval(tick, 200);
  document.addEventListener('pointerdown', reset, true);
  document.addEventListener('keydown', reset, true);
  document.addEventListener('wheel', reset, true);
  // a redraw of the Mat is a change on screen: the wait starts again (as the I'm stuck timer does)
  const obs = new MutationObserver(reset);
  obs.observe(root, { childList: true });
  return () => {
    clearInterval(timer);
    obs.disconnect();
    clear();
    document.removeEventListener('pointerdown', reset, true);
    document.removeEventListener('keydown', reset, true);
    document.removeEventListener('wheel', reset, true);
  };
}
