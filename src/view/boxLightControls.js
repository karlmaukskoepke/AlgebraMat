// The palette for light mode on Boxes & Circles: I'm stuck, Teach me step-by-step, and the two supports to ask for at
// any time (Draw boxes & circles, Rewrite subtractions), the Box and Circle tools while drawing them, Done rewriting
// while rewriting, ? and Check, with the answer pad (digits, x apart as the variable, + and −).

import { startTour } from './tour.js';
import { padGroup } from './walkLightControls.js';

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

export function buildBoxLightControls(root, dispatch) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'palette-row box-palette';
  const stuck = button('I’m stuck', 'stuck', { data: { key: 's' }, aria: 'I’m stuck (key S)' });
  const teach = button('Teach me step-by-step', 'teach', { data: { key: 't' }, aria: 'Teach me step-by-step (key T)' });
  const draw = button('Draw boxes &amp; circles', 'drawBoxes', { data: { key: 'd' }, aria: 'Draw boxes and circles (key D)' });
  const rewrite = button('Rewrite subtractions', 'rewriteSubs', { data: { key: 'r' }, aria: 'Rewrite subtractions as adding the opposite (key R)' });
  const box = button(`${BOX_SVG}Box`, 'pickTool', { cls: 'btn-tool', data: { tool: 'box', key: 'b' }, aria: 'Box tool (key B)' });
  const circle = button(`${CIRCLE_SVG}Circle`, 'pickTool', { cls: 'btn-tool', data: { tool: 'circle', key: 'c' }, aria: 'Circle tool (key C)' });
  const undo = button('Undo', 'undo', { data: { key: 'Backspace' }, aria: 'Undo' });
  const done = button('Done rewriting', 'doneRewrite', { cls: 'btn-primary', data: { key: 'enter' }, aria: 'Done rewriting' });
  const tourButton = button('?', 'tour', { cls: 'btn-tour', aria: 'Show me around' });
  const check = button('Check ✓', 'check', { cls: 'btn-primary' });
  const tools = document.createElement('div');
  tools.className = 'group';
  tools.append(box, circle, undo);
  row.append(stuck, teach, draw, rewrite, tools, done, tourButton, check);

  const pad = document.createElement('div');
  pad.className = 'pad';
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => button(String(d), 'digit', { cls: 'btn-pad', data: { digit: d } }));
  const chars = [['x', 'x', 'x'], ['+', '+', 'Plus'], ['−', '-', 'Minus']].map(([label, ch, aria]) =>
    button(label, 'typeChar', { cls: 'btn-pad', data: { ch, key: ch }, aria }));
  const back = button('⌫', 'backspace', { cls: 'btn-pad', aria: 'Delete' });
  pad.append(...digits, padGroup('variable', chars[0]), padGroup('sign', chars[1], chars[2]), back);
  root.append(row, pad);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b || b.disabled) return;
    if (b.dataset.action === 'tour') { startTour({ first: false }); return; }   // a look around, not a move
    const { action, tool, digit, ch } = b.dataset;
    if (action === 'check' && b.dataset.next) return dispatch({ type: 'next' });
    dispatch({ type: action, tool, ch, digit: digit === undefined ? undefined : Number(digit) });
  });

  return {
    update(s) {
      const stage = s.step === 'levelDone' ? 'levelDone' : s.stage;
      const typing = stage === 'light';
      const drawing = stage === 'support' && s.support === 'boxcircle';
      const rewriting = stage === 'support' && s.support === 'rewrite';
      stuck.disabled = teach.disabled = !(typing || stage === 'support');
      draw.disabled = rewrite.disabled = !typing;
      draw.hidden = rewrite.hidden = !typing && stage !== 'support';
      tools.hidden = !drawing;
      box.disabled = circle.disabled = !drawing;
      box.setAttribute('aria-pressed', String(drawing && s.ts?.tool === 'box'));
      circle.setAttribute('aria-pressed', String(drawing && s.ts?.tool === 'circle'));
      undo.disabled = !(drawing && s.ts?.shapes?.length > 0);
      done.hidden = !rewriting;
      done.disabled = !rewriting;
      tourButton.disabled = !typing;
      for (const b of pad.querySelectorAll('button')) b.disabled = !typing;
      const finished = stage === 'done';
      check.hidden = rewriting;
      check.disabled = !typing && !drawing && !finished;
      check.innerHTML = finished ? 'Next →' : 'Check ✓';
      if (finished) check.dataset.next = '1'; else delete check.dataset.next;
    },
  };
}
