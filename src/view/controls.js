// The palette, choice buttons, Check, and the answer pad. Only the current
// step's controls are enabled; the rest stay visible but dimmed.

const PLUS_SVG = '<svg viewBox="-16 -16 32 32" aria-hidden="true"><line x1="-11" y1="0" x2="11" y2="0"/><line x1="0" y1="-11" x2="0" y2="11"/></svg>';
const MINUS_SVG = '<svg viewBox="-16 -16 32 32" aria-hidden="true"><line x1="-11" y1="0" x2="11" y2="0"/></svg>';

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

export function buildControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';

  const nothing = button('Nothing to rewrite', 'nothingToRewrite');
  const plus = button(PLUS_SVG, 'pickSign', { cls: 'btn-sign', data: { sign: '+' }, aria: 'Plus counter' });
  const minus = button(MINUS_SVG, 'pickSign', { cls: 'btn-sign', data: { sign: '-' }, aria: 'Minus counter' });
  const party = button('Party!', 'choose', { data: { choice: 'party' } });
  const battle = button('Battle!', 'choose', { data: { choice: 'battle' } });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });

  const group = (...items) => {
    const g = document.createElement('div');
    g.className = 'group';
    g.append(...items);
    return g;
  };
  row.append(group(nothing), group(plus, minus), group(party, battle), check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const toggle = button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' });
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) =>
    button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(toggle, ...digits, back);

  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, sign, choice, digit } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, sign, choice, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const step = s.step;
      nothing.disabled = step !== 'rewrite';
      plus.disabled = minus.disabled = step !== 'draw';
      plus.setAttribute('aria-pressed', String(step === 'draw' && s.drawSign === '+'));
      minus.setAttribute('aria-pressed', String(step === 'draw' && s.drawSign === '-'));
      party.disabled = battle.disabled = step !== 'partyBattle';
      const done = step === 'done';
      check.disabled = !(step === 'draw' || step === 'answer' || done);
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
      for (const b of pad.querySelectorAll('button')) b.disabled = step !== 'answer';
    },
  };
}
