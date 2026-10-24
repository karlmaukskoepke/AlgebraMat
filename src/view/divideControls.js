// The number pad for Divide it and Flip everything (the answer row is in the work stack on the Mat). `live`: is a field waiting for
// typing (x = [ ], or a Multiply blank: Build N)? The card's play adapter says.

export function buildSolvePad(root, dispatch, live) {
  root.innerHTML = '';
  const keys = document.createElement('div');
  keys.className = 'pad';
  const mk = (label, action, data = {}, aria) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-pad';
    b.textContent = label;
    b.dataset.action = action;
    for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
    if (aria) b.setAttribute('aria-label', aria);
    return b;
  };
  keys.append(mk('±', 'toggleSign', {}, 'Change sign'), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => mk(String(d), 'digit', { digit: d })), mk('⌫', 'backspace', {}, 'Delete'));
  root.append(keys);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    dispatch({ type: b.dataset.action, digit: b.dataset.digit === undefined ? undefined : Number(b.dataset.digit) });
  });
  return {
    update(s) {
      const done = s.stage === 'done' || s.step === 'levelDone';
      const on = !done && s.stage === 'moves' && live(s);
      for (const b of keys.querySelectorAll('button')) b.disabled = !on;
    },
  };
}
