// The spotlight tour overlay (SPEC-SCAFFOLD.md §1b): the page dims, one real control stays lit with a ring and a
// caption, and each step moves on with Next (or, for I'm stuck, by pressing the real button). It lights up the
// actual controls, so it can't drift out of date. State is engine/tour.js.

import { startTour as newTour, tipTour, currentStep, advance } from '../engine/tour.js';
import { tourSeen, markTourSeen, tipSeen, markTipSeen } from '../lightStore.js';

const TARGETS = {
  problem: () => document.querySelector('.light-mat .dist-original'),
  pad: () => document.querySelector('.dist-controls:not([hidden]) .pad'),
  check: () => document.querySelector('.dist-controls:not([hidden]) button[data-action="check"]'),
  stuck: () => document.querySelector('.dist-controls:not([hidden]) button[data-action="stuck"]'),
  feedback: () => document.getElementById('feedback'),
};

let tour = null;
let root = null;
let required = false;
let tipId = null;
let onKey = null;
let onPress = null;
let onResize = null;

const el = (cls, tag = 'div') => { const n = document.createElement(tag); n.className = cls; return n; };

export const touring = () => tour !== null;

// Finish (or abandon) the tour. A first-time tour that ends, however it ends, is remembered.
export function endTour() {
  if (!tour) return;
  if (required) markTourSeen();
  if (tipId) markTipSeen(tipId);
  tipId = null;
  tour = null;
  root?.remove();
  root = null;
  document.removeEventListener('keydown', onKey, true);
  document.removeEventListener('click', onPress, true);
  window.removeEventListener('resize', onResize);
  document.body.classList.remove('touring');
}

// The pad step says what the lit-up pad actually has: ± for a number, x + and − for terms.
function textFor(step, target) {
  if (step.id === 'pad' && target.querySelector('[data-action="typeChar"]')) return 'Type the answer here. x, + and − are for terms like 2x + 3.';
  if (step.id === 'help' && !document.querySelector('.light-mat')) return 'That’s the help: the step-by-step way. Finish it, and the next problem is yours to type again.';
  return step.text;
}

function place(step) {
  const target = TARGETS[step.target]?.();
  if (!target || !target.getClientRects().length) return false;
  const pad = 8;
  const r = target.getBoundingClientRect();
  const x = Math.max(0, r.left - pad);
  const y = Math.max(0, r.top - pad);
  const w = Math.min(window.innerWidth - x, r.width + pad * 2);
  const h = Math.min(window.innerHeight - y, r.height + pad * 2);
  root.replaceChildren();
  // Four panels dim everything but the lit-up control; the control itself is only open to clicks when it's the step.
  for (const [left, top, width, height] of [
    [0, 0, window.innerWidth, y], [0, y + h, window.innerWidth, window.innerHeight - y - h],
    [0, y, x, h], [x + w, y, window.innerWidth - x - w, h],
  ]) {
    const p = el('tour-dim');
    p.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
    root.append(p);
  }
  if (step.needs !== 'press') {
    const shield = el('tour-shield');   // the lit-up control is for looking at, not pressing, until the step asks
    shield.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    root.append(shield);
  }
  const ring = el('tour-ring');
  ring.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  root.append(ring);

  const caption = el('tour-caption');
  caption.setAttribute('role', 'dialog');
  caption.setAttribute('aria-live', 'polite');
  const text = el('tour-text', 'p');
  text.textContent = textFor(step, target);
  const buttons = el('tour-buttons');
  const skip = el('btn tour-skip', 'button');
  skip.type = 'button';
  skip.textContent = 'Skip tour';
  skip.addEventListener('click', () => move('skip'));
  if (!tipId) buttons.append(skip);
  if (step.needs === 'next') {
    const next = el('btn btn-primary tour-next', 'button');
    next.type = 'button';
    next.textContent = tour.index === tour.steps.length - 1 ? 'Got it' : 'Next';
    next.addEventListener('click', () => move('next'));
    buttons.append(next);
  }
  caption.append(text, buttons);
  root.append(caption);
  // Below the lit-up control if there's room, otherwise above it.
  const tall = caption.offsetHeight;
  const below = window.innerHeight - (y + h) >= tall + 20;
  caption.style.top = `${below ? y + h + 12 : Math.max(8, y - tall - 12)}px`;
  caption.style.left = `${Math.min(Math.max(8, x + w / 2 - 230), window.innerWidth - 468)}px`;
  return true;
}

function show() {
  const step = currentStep(tour);
  if (!step) { endTour(); return; }
  if (!place(step)) move('pass');   // a feature that isn't there is skipped
}

function move(event) {
  if (!tour) return;
  tour = advance(tour, event);
  if (tour.done) { endTour(); return; }
  setTimeout(show, 60);   // let the screen settle first (pressing I'm stuck changes it)
}

// Begin a tour state: the first-time tour, a replay (the ? button), or a one-step tip.
function begin(state, { remember = false, tip = null } = {}) {
  endTour();
  required = remember;
  tipId = tip;
  tour = state;
  root = el('tour-root');
  document.body.append(root);
  document.body.classList.add('touring');
  onKey = (e) => {
    const step = currentStep(tour);
    if (!step) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); move('skip'); return; }
    if (step.needs === 'press' && (e.key === 's' || e.key === 'S')) return;   // the keyboard's way to press it
    e.stopImmediatePropagation();
    if (e.key === 'Enter' && step.needs === 'next') { e.preventDefault(); move('next'); }
  };
  onPress = (e) => {
    const step = currentStep(tour);
    if (step?.needs === 'press' && e.target.closest?.('.dist-controls:not([hidden]) button[data-action="stuck"]')) setTimeout(() => move('press'), 0);
  };
  onResize = () => show();
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('click', onPress, true);
  window.addEventListener('resize', onResize);
  setTimeout(show, 0);
}

// Start the tour: `first` is the required, first-time one; otherwise it's a replay from the ? button.
export function startTour({ first = false } = {}) {
  if (first && tourSeen()) return;
  begin(newTour(first), { remember: first });
}

// A one-step tip, once per device.
export function startTip(id) {
  if (tipSeen(id)) return;
  begin(tipTour(id), { tip: id });
}

// The first light problem on a device starts the tour (once the Mat is on the screen).
export function startTourIfFirst() {
  if (touring() || tourSeen()) return;
  setTimeout(() => startTour({ first: true }), 120);
}

// What a light problem opens with: the tour on a new device, else a one-step tip when this card's pad is new to the
// student (the tour itself already covers an algebra pad if that's where it starts).
export function startIntro({ algebra = false } = {}) {
  if (touring()) return;
  if (!tourSeen()) {
    if (algebra) markTipSeen('algebra-pad');
    startTourIfFirst();
  } else if (algebra && !tipSeen('algebra-pad')) {
    setTimeout(() => startTip('algebra-pad'), 120);
  }
}
