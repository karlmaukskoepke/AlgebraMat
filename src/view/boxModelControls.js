// The palette for the "read the model" round: the usual light-mode pad, and, while the student is saying each column
// ("Column 1 has ____"), four choice buttons in the pad's place. I'm stuck and Teach me stay: either shows every label.

import { buildWalkLightControls } from './walkLightControls.js';
import { columnChoices } from '../engine/boxModel.js';

export function buildBoxModelControls(root, dispatch) {
  const base = buildWalkLightControls(root, dispatch, 'algebra');
  const pad = root.querySelector('.pad');
  const choices = document.createElement('div');
  choices.className = 'say-choices';
  choices.hidden = true;
  root.insertBefore(choices, pad);
  let shown = null;                       // which column's choices are drawn

  return {
    update(s) {
      base.update(s);
      const saying = s.stage === 'cloze';
      pad.hidden = saying;
      choices.hidden = !saying;
      if (!saying) { shown = null; return; }
      for (const b of root.querySelectorAll('[data-action="stuck"], [data-action="teach"]')) b.disabled = false;
      for (const b of root.querySelectorAll('[data-action="check"], [data-action="tour"]')) b.disabled = true;
      if (shown === s.col) return;
      shown = s.col;
      choices.replaceChildren(...columnChoices(s.problem, s.col).map((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn say-choice';
        b.dataset.action = 'pick';
        b.dataset.digit = String(i);
        b.textContent = c.text;
        return b;
      }));
    },
  };
}
