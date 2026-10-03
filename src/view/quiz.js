// The pieces the typed-answer screens share (the fluency challenges and the diagnostic): a tiny element builder, the
// answer pad, and the keyboard. Both screens work like the rest of the site: tap the pad or type.

import { MINUS } from '../engine/expr.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v !== undefined && v !== null) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}

const padButton = (label, data, aria) => h('button', { type: 'button', class: 'btn btn-pad', dataset: data, 'aria-label': aria }, label);

// The answer pad: ± and digits for a number, digits with x, + and − for terms. `onKey` gets the action.
export function buildPad(onKey, pad = 'integer') {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => padButton(String(d), { type: 'digit', digit: String(d) }));
  const back = padButton('⌫', { type: 'backspace' }, 'Delete');
  const group = (caption, ...btns) => h('div', { class: 'pad-group' }, h('span', { class: 'pad-cap' }, caption), h('div', { class: 'pad-group-keys' }, ...btns));
  const keys = pad === 'algebra'
    ? [...digits, group('variable', padButton('x', { type: 'typeChar', ch: 'x' }, 'x')),
      group('sign', padButton('+', { type: 'typeChar', ch: '+' }, 'Plus'), padButton(MINUS, { type: 'typeChar', ch: '-' }, 'Minus')), back]
    : [padButton('±', { type: 'toggleSign' }, 'Change sign'), ...digits, back];
  const el = h('div', { class: 'pad' }, ...keys);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-type]');
    if (!b || b.disabled) return;
    const { type, digit, ch } = b.dataset;
    onKey({ type, digit: digit === undefined ? undefined : Number(digit), ch });
  });
  return {
    el,
    setEnabled(on) { for (const b of el.querySelectorAll('button')) b.disabled = !on; },
  };
}

// A key press as an action, or null: digits, − (± on a number pad), x and + on a terms pad, Backspace, Enter.
// `enter` is the screen's main button (Start, Check, Next, Play again).
export function keyToAction(e, pad = 'integer') {
  if (/^[0-9]$/.test(e.key)) return { type: 'digit', digit: Number(e.key) };
  if (e.key === 'Backspace' || e.key === 'Delete') return { type: 'backspace' };
  if (e.key === 'Enter' && !e.repeat) return { type: 'enter' };
  if (e.key === '-' || e.key === '−') return pad === 'integer' ? { type: 'toggleSign' } : { type: 'typeChar', ch: '-' };
  if (pad === 'algebra' && (e.key === 'x' || e.key === 'X')) return { type: 'typeChar', ch: 'x' };
  if (pad === 'algebra' && e.key === '+') return { type: 'typeChar', ch: '+' };
  return null;
}

// Listen for keys while a screen is up; returns the function that stops listening.
export function bindKeys(getPad, onAction) {
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.getElementById('dialog')?.open) return;
    const t = e.target;
    // A focused Start / Next / Back button keeps its own Enter (the browser clicks it); a pad button doesn't (it'd type again).
    if (t instanceof HTMLElement && (t.matches('input, textarea, select, [contenteditable]') || (t.matches('button[data-go], a') && e.key === 'Enter'))) return;
    const action = keyToAction(e, getPad());
    if (!action) return;
    e.preventDefault();
    onAction(action);
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

export const shown = (entry) => entry.replace(/-/g, MINUS);
