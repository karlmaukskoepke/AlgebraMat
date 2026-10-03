// The palette for light mode (SPEC-SCAFFOLD.md §2): I'm stuck, Teach me step-by-step (the full walk at once),
// Sound (reading the cloze aloud, on or off), Check, and Flip It's answer pad (± and digits). After a right answer Check becomes Next →. `data-key`: S asks
// for I'm stuck, T for the full walk; Enter is Check, and the keyboard's − presses ±.

import { soundOn, setSound } from './speech.js';
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

export function buildLightControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const teach = button('Teach me step-by-step', 'teach', { data: { key: 't' }, aria: 'Teach me step-by-step (key T)' });
  const sound = button('', 'sound', { aria: 'Read sentences aloud' });
  const tourButton = button('?', 'tour', { cls: 'btn-tour', aria: 'Show me around' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(stuck, teach, sound, tourButton, check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const toggle = button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' });
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(toggle, ...digits, back);
  root.append(row, pad);
  const showSound = () => {
    sound.textContent = soundOn() ? '🔊 Sound on' : '🔇 Sound off';
    sound.setAttribute('aria-pressed', String(soundOn()));
  };
  showSound();

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    if (b.dataset.action === 'sound') { setSound(!soundOn()); showSound(); return; } // a setting, not a move
    if (b.dataset.action === 'tour') { startTour({ first: false }); return; }      // a look around, not a move
    const { action, digit } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const typing = stage === 'light';
      stuck.disabled = teach.disabled = !(typing || stage === 'support');
      tourButton.disabled = !(typing || stage === 'support');
      for (const b of pad.querySelectorAll('button')) b.disabled = !typing;
      const done = stage === 'done';
      check.disabled = !typing && !done;
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
