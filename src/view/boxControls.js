// Boxes & Circles palette: the Box and Circle tools, Undo, and Check. Only the
// current step's controls are enabled; the rest stay visible but dimmed. The
// answer pad joins in the Answer step. `data-key` names the keyboard key that
// presses a button (B and C pick the tools, Backspace is Undo; Enter is Check).

const BOX_SVG = '<svg viewBox="0 0 26 22" aria-hidden="true"><rect x="2" y="2" width="22" height="18" rx="4"/></svg>';
const CIRCLE_SVG = '<svg viewBox="0 0 26 22" aria-hidden="true"><rect x="2" y="2" width="22" height="18" rx="9"/></svg>';

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

export function buildBoxControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row';

  const box = button(`${BOX_SVG}Box`, 'pickTool', { cls: 'btn-tool', data: { tool: 'box', key: 'b' }, aria: 'Box tool (key B)' });
  const circle = button(`${CIRCLE_SVG}Circle`, 'pickTool', { cls: 'btn-tool', data: { tool: 'circle', key: 'c' }, aria: 'Circle tool (key C)' });
  const undo = button('Undo', 'undo', { data: { key: 'Backspace' }, aria: 'Undo the latest shape' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });

  const group = (...items) => {
    const g = document.createElement('div');
    g.className = 'group';
    g.append(...items);
    return g;
  };
  row.append(group(box, circle), group(undo), check);
  root.append(row);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    dispatch({ type: b.dataset.action, tool: b.dataset.tool });
  });

  return {
    update(s) {
      const step = s.step === 'levelDone' ? 'done' : s.step;
      const boxCircle = step === 'boxcircle';
      box.disabled = circle.disabled = !boxCircle;
      box.setAttribute('aria-pressed', String(boxCircle && s.tool === 'box'));
      circle.setAttribute('aria-pressed', String(boxCircle && s.tool === 'circle'));
      undo.disabled = !(boxCircle && s.shapes.length > 0);
      check.disabled = !boxCircle; // Draw, Cancel and Answer come in the next builds
    },
  };
}
