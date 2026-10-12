// The numeric level's controls: just the pad, with the amount being typed shown above it (SPEC-ADD-TO-BOTH-SIDES.md §3D: no
// I'm stuck and no Teach me on this level).

import { MINUS } from '../engine/expr.js';

export function buildNumericControls(root, dispatch) {
  root.innerHTML = '';
  const field = document.createElement('div');
  field.className = 'lb-answerrow';
  const prompt = document.createElement('strong');
  prompt.textContent = 'Amount to add:';
  const value = document.createElement('span');
  value.className = 'ab-typed';
  field.append(prompt, value);
  const keys = document.createElement('div');
  keys.className = 'pad';
  const mk = (label, action, data = {}, aria) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-pad';
    b.textContent = label;
    b.dataset.action = action;
    for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
    if (aria) b.setAttribute('aria-label', aria);
    return b;
  };
  keys.append(mk('±', 'toggleSign', {}, 'Change sign'), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => mk(String(d), 'digit', { digit: d })), mk('⌫', 'backspace', {}, 'Delete'));
  root.append(field, keys);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    dispatch({ type: b.dataset.action, digit: b.dataset.digit === undefined ? undefined : Number(b.dataset.digit) });
  });
  return {
    update(s) {
      const on = s.stage === 'moves' && s.menu === 'add';
      field.hidden = !on;                                  // the amount row appears only once the move is chosen
      value.textContent = (s.amountEntry ?? '').replace('-', MINUS) || ' ';
      value.classList.toggle('is-empty', !s.amountEntry);
      value.classList.toggle('is-blink', on && !s.amountEntry);
      for (const b of keys.querySelectorAll('button')) b.disabled = !on;
    },
  };
}
