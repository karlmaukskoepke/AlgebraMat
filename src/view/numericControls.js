// The numeric level's controls: just the pad (the amount is typed in the "Add [ ] to both sides" line on the Mat; SPEC-ADD-TO-BOTH-SIDES.md
// §3D: no I'm stuck and no Teach me on this level).

export function buildNumericControls(root, dispatch) {
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
      const on = s.stage === 'moves' && s.menu === 'add';
      for (const b of keys.querySelectorAll('button')) b.disabled = !on;
    },
  };
}
