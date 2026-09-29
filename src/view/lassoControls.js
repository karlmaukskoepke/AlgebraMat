// Lasso palette: Add lasso, + / − groups, the counter palette with Undo,
// opp., Check, and the number pad. Only the current step's controls are
// enabled; the rest stay visible but dimmed (SPEC §4, SPEC-LASSO.md §3).

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

export function buildLassoControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';

  const addLasso = button('Add lasso', 'addLasso'); // "Add part" in fraction problems
  const plusGroups = button('+ groups', 'chooseSign', { data: { sign: '+' } });
  const minusGroups = button('<span class="opp-word">−</span> groups', 'chooseSign', { data: { sign: '-' }, aria: 'Minus groups (opposite)' });
  const plus = button(PLUS_SVG, 'pickSign', { cls: 'btn-sign', data: { sign: '+' }, aria: 'Plus counter' });
  const minus = button(MINUS_SVG, 'pickSign', { cls: 'btn-sign', data: { sign: '-' }, aria: 'Minus counter' });
  const undo = button('Undo', 'undo');
  const opp = button('<span class="opp-word">opp.</span>', 'flip', { aria: 'Opposite: flip every group' });
  const noOpp = button('No opposite', 'noOpposite');
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const signGroup = group(plusGroups, minusGroups);
  row.append(group(addLasso), signGroup, group(plus, minus, undo), group(opp, noOpp), check);

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
    const { action, sign, digit } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, sign, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const step = s.step;
      const fraction = s.script === 'fraction';
      // The two scripts share one palette; fraction problems swap in their own buttons.
      addLasso.textContent = fraction ? 'Add part' : 'Add lasso';
      addLasso.dataset.action = fraction ? 'addPart' : 'addLasso';
      signGroup.hidden = fraction;
      noOpp.hidden = !fraction;
      const drawing = fraction ? step === 'whole' : step === 'fill';
      addLasso.disabled = step !== (fraction ? 'split' : 'groups');
      plusGroups.disabled = minusGroups.disabled = step !== 'sign';
      plus.disabled = minus.disabled = !drawing;
      undo.disabled = !(drawing || (fraction && step === 'split'));
      plus.setAttribute('aria-pressed', String(drawing && s.drawSign === '+'));
      minus.setAttribute('aria-pressed', String(drawing && s.drawSign === '-'));
      opp.disabled = noOpp.disabled = !(step === 'opposite' && !s.flipped);
      if (!fraction) noOpp.disabled = true;
      const padOpen = step === 'count' || (step === 'opposite' && s.flipped);
      const done = step === 'done'; // 'levelDone' leaves every control disabled
      const checkable = ['groups', 'fill', 'whole', 'split', 'take'].includes(step);
      check.disabled = !(checkable || padOpen || done);
      check.innerHTML = done ? 'Next →' : 'Check ✓';
      if (done) check.dataset.next = '1'; else delete check.dataset.next;
      for (const b of pad.querySelectorAll('button')) b.disabled = !padOpen;
    },
  };
}
