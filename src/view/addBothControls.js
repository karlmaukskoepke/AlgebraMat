// The controls for Add to both sides: the number pad. The answer row (x = [  ] with Check) and the help buttons are on the Mat. The pad
// types into the amount blank while the move is open and into the answer otherwise.


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

// `liveOf`: is the x = [ ] row live? (engine/addBothLights.js: from the first frame, unless a move is owed.)

// `xKeyOf` (the drill): when the pad also has an x key, for typing products like −2x (Build D-2, Part 3).
export const makeAddBothControls = (liveOf, xKeyOf = null) => (root, dispatch) => {
  root.innerHTML = '';
  const keys = document.createElement('div');
  keys.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  keys.append(button('±', 'toggleSign', { cls: 'btn-pad', aria: 'Change sign' }), ...digits, button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' }));
  const xKey = xKeyOf ? button('x', 'typeChar', { cls: 'btn-pad', data: { ch: 'x', key: 'x' }, aria: 'x' }) : null;
  if (xKey) keys.append(xKey);

  root.append(keys);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    const { action, digit, ch } = b.dataset;
    dispatch({ type: action, digit: digit === undefined ? undefined : Number(digit), ...(ch ? { ch } : {}) });
  });

  return {
    update(s) {
      const done = s.stage === 'done' || s.step === 'levelDone';
      const amountMode = !done && s.stage === 'moves' && s.menu === 'add' && s.typing !== 'answer' && !s.combining;
      // the pad is live for the amount (once the move is open) and for the answer (once it is live); greyed otherwise
      const on = !done && s.step !== 'levelDone' && (amountMode || liveOf(s));
      for (const b of keys.querySelectorAll('button')) b.disabled = !on;
      if (xKey) { xKey.hidden = done || !xKeyOf(s); xKey.disabled = xKey.hidden; }
    },
  };
};
