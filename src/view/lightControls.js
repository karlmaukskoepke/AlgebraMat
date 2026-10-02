// The palette for light mode (SPEC-SCAFFOLD.md §2): Party and Battle (for the party-or-battle support), I'm stuck,
// Check, and Flip It's answer pad (± and digits). After a right answer Check becomes Next →. `data-key`: S asks
// for I'm stuck, P and B choose; Enter is Check, and the keyboard's − presses ±.

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
  const party = button('Party!', 'choose', { data: { choice: 'party', key: 'p' }, aria: 'Party (key P)' });
  const battle = button('Battle!', 'choose', { data: { choice: 'battle', key: 'b' }, aria: 'Battle (key B)' });
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const choices = document.createElement('div');
  choices.className = 'group';
  choices.append(party, battle);
  row.append(choices, stuck, check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const toggle = button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' });
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(toggle, ...digits, back);
  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, choice, digit } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, choice, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const typing = stage === 'light';
      party.disabled = battle.disabled = stage !== 'support';
      stuck.disabled = !(typing || stage === 'support');
      for (const b of pad.querySelectorAll('button')) b.disabled = !typing;
      const done = stage === 'done';
      check.disabled = !typing && !done;
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
