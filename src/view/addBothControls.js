// The controls for Add to both sides, "light build": the answer row (x = [   ]), Check, I'm stuck, Teach me, Start over (only
// after three red moves), and the number pad. Everything else lives on the Mat (SPEC-ADD-TO-BOTH-SIDES.md §1). The pad types
// into the amount blank while the move is open and into the answer otherwise; tapping the answer field says "the answer".

import { MINUS } from '../engine/expr.js';

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

export function buildAddBothControls(root, dispatch) {
  root.innerHTML = '';
  // "x = [   ]": a bold prompt and a boxed place for what is being typed (an underline blinks while it is empty)
  const field = document.createElement('div');
  field.className = 'lb-answerrow';
  const prompt = document.createElement('strong');
  const value = document.createElement('button');
  value.type = 'button';
  value.className = 'ab-typed lb-typed';
  value.dataset.action = 'focus';
  value.dataset.target = 'answer';
  value.setAttribute('aria-label', 'Your answer for x');
  field.append(prompt, value);

  const startOver = button('Start over', 'startOver', { cls: 'btn-quiet' });
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const teach = button('Teach me step-by-step', 'teach', { data: { key: 't' }, aria: 'Teach me step-by-step (key T)' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const palette = document.createElement('div');
  palette.className = 'ab-row palette-row';
  palette.append(check, stuck, teach, startOver);

  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' }));

  root.append(field, palette, keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, digit, target } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit), target });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const done = stage === 'done' || stage === 'levelDone';
      const building = stage === 'build';
      const combining = Boolean(s.combining);
      const early = Boolean(s.early);
      const amountMode = s.menu === 'add' && s.typing !== 'answer' && !combining;

      if (combining) { prompt.textContent = 'How many are left?'; value.textContent = s.combining.entry.replace('-', MINUS) || ' '; value.classList.toggle('is-empty', !s.combining.entry); }
      else { prompt.textContent = 'x ='; value.textContent = s.entry.replace('-', MINUS) || ' '; value.classList.toggle('is-empty', !s.entry); }
      field.classList.toggle('is-dim', amountMode);
      field.classList.toggle('is-target', s.path === 'guess' && !done && !amountMode && !s.entry);
      value.disabled = done || building || early;

      startOver.hidden = !s.startOver || done;
      stuck.disabled = teach.disabled = done || building || early || Boolean(s.walk);
      const typingOk = !done && !building && !early && !(combining && s.combining.step !== 'count');
      for (const b of keys.querySelectorAll('button')) b.disabled = !typingOk;
      check.disabled = !done && (!typingOk || amountMode);
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
