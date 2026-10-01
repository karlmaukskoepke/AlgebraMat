// Groups of Terms palette: Add group, + groups / − groups, the four pieces (□, −□, +, −),
// Copy to all, Undo, Check, and the pad (digits, x, + and −). Only the current step's controls
// are enabled; the rest stay visible but dimmed. `data-key` names the keyboard key that
// presses a button (K copies, Backspace is Undo or the pad's delete; Enter is Check).

const PIECE_BOX = '<svg viewBox="-14 -13 28 26" aria-hidden="true"><rect x="-11" y="-11" width="22" height="22" rx="2" style="stroke-width:2.5"/></svg>';
const PIECE_NEG_BOX = '<svg viewBox="-21 -13 40 26" aria-hidden="true"><rect x="-5" y="-11" width="22" height="22" rx="2" style="stroke-width:2.5"/><line x1="-19" y1="0" x2="-5" y2="0" style="stroke-width:2.5"/></svg>';
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

const group = (...items) => {
  const g = document.createElement('div');
  g.className = 'group';
  g.append(...items);
  return g;
};

export function buildTermGroupControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row box-palette tg-palette';

  const addGroup = button('Add group', 'addGroup');
  const plusGroups = button('+ groups', 'chooseSign', { data: { sign: '+' } });
  const minusGroups = button('<span class="opp-word">−</span> groups', 'chooseSign', { data: { sign: '-' }, aria: 'Minus groups (opposite)' });
  const boxPlus = button(PIECE_BOX, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'box', sign: '+' }, aria: 'Box (x)' });
  const boxMinus = button(PIECE_NEG_BOX, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'box', sign: '-' }, aria: 'Negative box (minus x)' });
  const plus = button(PLUS_SVG, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'counter', sign: '+' }, aria: 'Plus counter' });
  const minus = button(MINUS_SVG, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'counter', sign: '-' }, aria: 'Minus counter' });
  const flipAll = button('Flip all', 'flipAll', { aria: 'Flip every − group to its opposite' });
  const copy = button('Copy to all', 'copyAll', { data: { key: 'k' }, aria: 'Copy the first group to all (key K)' });
  const undo = button('Undo', 'undo', { data: { key: 'Backspace' }, aria: 'Undo' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(group(addGroup), group(plusGroups, minusGroups), group(boxPlus, boxMinus, plus, minus), group(copy, undo, flipAll), check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) =>
    button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const chars = [['x', 'x', 'x'], ['+', '+', 'Plus'], ['−', '-', 'Minus']].map(([label, ch, aria]) =>
    button(label, 'typeChar', { cls: 'btn-pad', data: { ch, key: ch }, aria }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(...digits, ...chars, back);

  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, sign, pieceType, digit, ch } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, sign, pieceType, ch, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s, hint = null) {
      const step = s.step === 'levelDone' ? 'done' : s.step;
      const pulse = hint?.show?.button;
      const named = (b) => [b.dataset.action, b.dataset.pieceType, b.dataset.sign].filter(Boolean).join(':');
      for (const b of row.querySelectorAll('button')) b.classList.toggle('hint-pulse', Boolean(pulse) && (named(b) === pulse || b.dataset.action === pulse));
      addGroup.disabled = step !== 'groups' || Boolean(s.problem?.hidden1 && !s.wroteOne);
      plusGroups.disabled = minusGroups.disabled = step !== 'sign';
      const filling = step === 'fill';
      for (const b of [boxPlus, boxMinus, plus, minus]) {
        b.disabled = !filling;
        b.setAttribute('aria-pressed', String(filling && s.pick?.type === b.dataset.pieceType && s.pick?.sign === b.dataset.sign));
      }
      const whole = s.script === 'whole';
      copy.hidden = !whole;
      copy.disabled = !(filling && whole);
      undo.disabled = !(filling && s.snapshots?.length > 0);
      flipAll.disabled = step !== 'flip';
      const hiddenOne = step === 'groups' && s.problem?.hidden1 && !s.wroteOne;
      for (const b of pad.querySelectorAll('button')) b.disabled = true;
      if (hiddenOne) for (const b of pad.querySelectorAll('[data-action="digit"], [data-action="backspace"]')) b.disabled = false;
      check.disabled = !(hiddenOne || ['groups', 'fill', 'take'].includes(step));
    },
  };
}
