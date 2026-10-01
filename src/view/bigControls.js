// Combine it Level 4's palette: Party! / Battle!, Add / Subtract, the sign (+ or −), Undo (for circles), Check,
// and the number pad (digits and a −). Only the current step's buttons are enabled; the rest stay visible but
// dimmed. `data-key` names the keyboard key that presses a button: P and B for Party and Battle, A and S for Add
// and Subtract, + and − for the sign (or, while typing, the pad's −); Enter is Check.

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

const group = (...items) => {
  const g = document.createElement('div');
  g.className = 'group';
  g.append(...items);
  return g;
};

export function buildBigControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row box-palette tg-palette';

  const party = button('Party!', 'choose', { data: { choice: 'party', key: 'p' }, aria: 'Party (key P)' });
  const battle = button('Battle!', 'choose', { data: { choice: 'battle', key: 'b' }, aria: 'Battle (key B)' });
  const add = button('Add', 'chooseOp', { data: { op: 'add', key: 'a' }, aria: 'Add the values (key A)' });
  const subtract = button('Subtract', 'chooseOp', { data: { op: 'subtract', key: 's' }, aria: 'Subtract the values (key S)' });
  const plus = button('+', 'chooseSign', { cls: 'btn-sign', data: { sign: '+', key: '+' }, aria: 'Positive' });
  const minus = button('−', 'chooseSign', { cls: 'btn-sign', data: { sign: '-', key: '-' }, aria: 'Negative' });
  const undo = button('Undo', 'undo', { data: { key: 'Backspace' }, aria: 'Undo the latest circle' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(group(party, battle), group(add, subtract), group(plus, minus), group(undo), check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const dash = button('−', 'typeChar', { cls: 'btn-pad', data: { ch: '-', key: '-' }, aria: 'Minus' });
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(...digits, dash, back);

  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, choice, op, sign, digit, ch } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, choice, op, sign, ch, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s, hint = null) {
      const step = s.step === 'levelDone' ? 'done' : s.step;
      void hint;
      party.disabled = battle.disabled = step !== 'partyBattle';
      add.disabled = subtract.disabled = step !== 'addSub';
      plus.disabled = minus.disabled = step !== 'sign';
      undo.disabled = !(step === 'boxcircle' && s.shapes?.length > 0);
      const typing = step === 'combine' || step === 'answer';
      for (const b of pad.querySelectorAll('button')) b.disabled = !typing;
      const done = step === 'done'; // 'levelDone' leaves every control disabled
      check.disabled = !(step === 'boxcircle' || typing || (done && s.step === 'done'));
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
