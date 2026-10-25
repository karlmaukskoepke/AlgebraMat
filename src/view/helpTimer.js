// I'm stuck starts to flash gently after 10 seconds with nothing done on the problem (Build D, Part 1). Any input (a tap, a key, a
// redraw of the screen) starts the 10 seconds again. Reduced motion: a steady highlight instead (style.css).

import { onRedraw } from './keepRows.js';

const IDLE_MS = 10000;

export function bindHelpTimer(root) {
  let timer = null;
  const reset = () => {
    clearTimeout(timer);
    root.querySelector('.lx-help.is-idle')?.classList.remove('is-idle');
    timer = setTimeout(() => {
      const b = root.querySelector('[data-action="stuck"]');
      if (b && !b.disabled && !root.closest('[hidden]') && !document.querySelector('.spot-layer.is-error')) b.classList.add('is-idle');
    }, IDLE_MS);
  };
  document.addEventListener('pointerdown', reset, true);
  document.addEventListener('keydown', reset, true);
  const unwatch = onRedraw(root, reset);
  reset();
  return () => {
    clearTimeout(timer);
    unwatch();
    document.removeEventListener('pointerdown', reset, true);
    document.removeEventListener('keydown', reset, true);
  };
}
