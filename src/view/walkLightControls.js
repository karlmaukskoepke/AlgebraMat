// The palette for light mode on the cards without targeted supports (SPEC-SCAFFOLD.md §8): I'm stuck, ?, Check,
// and the answer pad: ± and digits for a number, digits with x, + and − for terms. After a right answer Check
// becomes Next →. `data-key`: S asks for I'm stuck, x, + and − type; Enter is Check.

import { startTour } from './tour.js';

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

export function buildWalkLightControls(root, dispatch, pad) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const tourButton = button('?', 'tour', { cls: 'btn-tour', aria: 'Show me around' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(stuck, tourButton, check);

  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  if (pad === 'algebra') {
    const chars = [['x', 'x', 'x'], ['+', '+', 'Plus'], ['−', '-', 'Minus']].map(([label, ch, aria]) =>
      button(label, 'typeChar', { cls: 'btn-pad', data: { ch, key: ch }, aria }));
    keys.append(...digits, ...chars, back);
  } else {
    keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, back);
  }
  root.append(row, keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    if (b.dataset.action === 'tour') { startTour({ first: false }); return; }   // a look around, not a move
    const { action, digit, ch } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit), ch });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const typing = stage === 'light';
      stuck.disabled = tourButton.disabled = !typing;
      for (const b of keys.querySelectorAll('button')) b.disabled = !typing;
      const done = stage === 'done';
      check.disabled = !typing && !done;
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
