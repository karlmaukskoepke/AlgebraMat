// Boxes & Circles palette: the Box and Circle tools (Box & Circle), the four
// pieces (Draw), Undo, Check, and the answer pad (x, + and − next to the digits).
// Only the current step's controls are enabled; the rest stay visible but dimmed.
// `data-key` names the keyboard key that presses a button (B and C pick the
// tools, Backspace is Undo or the pad's delete, x, + and − type; Enter is Check).

const BOX_SVG = '<svg viewBox="0 0 26 22" aria-hidden="true"><rect x="2" y="2" width="22" height="18" rx="4"/></svg>';
const CIRCLE_SVG = '<svg viewBox="0 0 26 22" aria-hidden="true"><rect x="2" y="2" width="22" height="18" rx="9"/></svg>';
// The pieces as the Mat draws them: □ is x, −□ is −x (a dash on its left), + and − counters.
const PIECE_BOX = '<svg viewBox="-14 -13 28 26" aria-hidden="true"><rect x="-11" y="-11" width="22" height="22" rx="2"/></svg>';
const PIECE_NEG_BOX = '<svg viewBox="-21 -13 40 26" aria-hidden="true"><rect x="-5" y="-11" width="22" height="22" rx="2"/><line x1="-19" y1="0" x2="-5" y2="0"/></svg>';
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

export function buildBoxControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';

  const box = button(`${BOX_SVG}Box`, 'pickTool', { cls: 'btn-tool', data: { tool: 'box', key: 'b' }, aria: 'Box tool (key B)' });
  const circle = button(`${CIRCLE_SVG}Circle`, 'pickTool', { cls: 'btn-tool', data: { tool: 'circle', key: 'c' }, aria: 'Circle tool (key C)' });
  const boxPlus = button(PIECE_BOX, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'box', sign: '+' }, aria: 'Box (x)' });
  const boxMinus = button(PIECE_NEG_BOX, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'box', sign: '-' }, aria: 'Negative box (minus x)' });
  const plus = button(PLUS_SVG, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'counter', sign: '+' }, aria: 'Plus counter' });
  const minus = button(MINUS_SVG, 'pickPiece', { cls: 'btn-sign', data: { pieceType: 'counter', sign: '-' }, aria: 'Minus counter' });
  const undo = button('Undo', 'undo', { data: { key: 'Backspace' }, aria: 'Undo' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  row.append(group(box, circle), group(boxPlus, boxMinus, plus, minus), group(undo), check);

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
    const { action, tool, pieceType, sign, digit, ch } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, tool, pieceType, sign, ch, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const step = s.step === 'levelDone' ? 'done' : s.step;
      const boxCircle = step === 'boxcircle';
      const drawing = step === 'draw';
      const answering = step === 'answer';
      box.disabled = circle.disabled = !boxCircle;
      box.setAttribute('aria-pressed', String(boxCircle && s.tool === 'box'));
      circle.setAttribute('aria-pressed', String(boxCircle && s.tool === 'circle'));
      for (const b of [boxPlus, boxMinus, plus, minus]) {
        b.disabled = !drawing;
        b.setAttribute('aria-pressed', String(drawing && s.pick?.type === b.dataset.pieceType && s.pick?.sign === b.dataset.sign));
      }
      const undoable = (boxCircle && s.shapes.length > 0) || (drawing && s.drawn.length > 0) || (step === 'cancel' && (s.pairs.length > 0 || Boolean(s.selected)));
      undo.disabled = !undoable;
      const done = step === 'done'; // 'levelDone' leaves every control disabled
      check.disabled = !(boxCircle || drawing || answering) && !(done && s.step === 'done');
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
      for (const b of pad.querySelectorAll('button')) b.disabled = !answering;
    },
  };
}
