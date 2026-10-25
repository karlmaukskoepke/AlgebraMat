// Moving between the blanks of a row with several (Build P, Part 4): the distribute move's products and the fraction blank's top and
// bottom. Tab and → go to the next blank, Shift+Tab and ← to the one before; the box moved to has its contents selected, so typing
// replaces them (the engine's `blankMove`). Enter goes to the next (Go at the last) as before, and a click on a box still clears it for
// retyping. At either end Tab is the page's again, so the keyboard can still leave the row.

const OPEN = '.lx-ghost.is-products .lx-box.is-focus, .dv-fracblank:not(.is-mirror) .dv-fracpart.is-focus';

export function bindBlankKeys(root, dispatch) {
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !root.isConnected || root.closest('[hidden]') || document.querySelector('dialog[open], .spot-layer.is-error')) return;
    // Add's two stacked boxes (Build T, Part 5): Tab and the arrows go to the other side's box, which then has the amount selected
    const stacked = root.querySelector('.lx-ghost.is-stacked .lx-box.is-stackbox.is-focus');
    if (stacked && (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const side = stacked.dataset.side;
      const to = e.key === 'Tab' ? (side === 'left' ? 'right' : 'left') : e.key === 'ArrowRight' ? 'right' : 'left';   // (Tab: the other box)
      if (to === side) { e.preventDefault(); return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      dispatch({ type: 'focus', target: 'amount', side: to });
      return;
    }
    const box = root.querySelector(OPEN);
    if (!box) return;
    const next = e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey);
    const back = e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey);
    if (!next && !back) return;
    // the boxes of the row, in order: is there one to go to?
    const row = box.closest('.lx-ghost.is-products, .dv-fracblank');
    const boxes = [...row.querySelectorAll('.lx-box:not(.is-mirror)')];
    const at = boxes.indexOf(box);
    const to = at + (next ? 1 : -1);
    if (to < 0 || to >= boxes.length) { if (e.key !== 'Tab') e.preventDefault(); return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch({ type: 'blankMove', dir: next ? 1 : -1 });
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
