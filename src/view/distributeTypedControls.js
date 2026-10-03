// The palette for Rounds 4 and 5 (SPEC-DISTRIBUTE.md §5): Show me (Round 4 only), Check, and the answer pad
// (digits, x, + and −). `data-key`: S asks for Show me; Enter is Check. After a right answer Check becomes Next →.

import { padGroup } from './walkLightControls.js';

function button(label, action, extra = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${extra.cls ?? ''}`.trim();
  b.innerHTML = label;
  b.dataset.action = action;
  for (const [k, v] of Object.entries(extra.data ?? {})) b.dataset[k] = v;
  if (extra.aria) b.setAttribute('aria-label', extra.aria);
  return b;
}

export function buildTypedControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row box-palette';
  const show = button('Show me', 'showMe', { data: { key: 's' }, aria: 'Show me (key S)' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(show, check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const chars = [['x', 'x', 'x'], ['+', '+', 'Plus'], ['−', '-', 'Minus']].map(([label, ch, aria]) =>
    button(label, 'typeChar', { cls: 'btn-pad', data: { ch, key: ch }, aria }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(...digits, padGroup('variable', chars[0]), padGroup('sign', chars[1], chars[2]), back);
  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, ch, digit } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, ch, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s, hint = null) {
      const step = s.step === 'levelDone' ? 'levelDone' : s.step;
      const typing = step === 'open' || step === 'answer';
      show.hidden = !s.problem || s.problem.level !== 4;     // Round 5 has hints only
      show.disabled = !typing || Boolean(s.asked);
      row.querySelectorAll('button').forEach((b) => b.classList.toggle('hint-pulse', false));
      void hint;
      const done = step === 'done';
      check.disabled = !typing && !done;
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
      for (const b of pad.querySelectorAll('button')) b.disabled = !typing || b.hidden;
    },
  };
}
