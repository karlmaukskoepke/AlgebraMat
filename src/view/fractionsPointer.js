// The rewrite toggle's pointer and keyboard (Fractions of x, Build AA): resting the pointer on the fraction (or a keyboard focus on it)
// shows a ghost of the other form under the equation; a tap or click writes it (the Mat's own click → `rewrite`); Enter or Space on the
// focused fraction does the same. On touch, a tap writes it at once (the ghost is for pointers and the keyboard).

export function bindRewrite(root, dispatch, getSession) {
  const FX = '[data-fx]';
  const set = (on) => { if ((getSession()?.ui?.rewrite ?? false) !== on) dispatch({ type: 'ui', patch: { rewrite: on } }); };
  const over = (e) => { if (e.pointerType !== 'touch' && e.target.closest?.(FX)) set(true); };
  const out = (e) => { if (e.target.closest?.(FX) && !(e.relatedTarget && e.relatedTarget.closest?.(FX))) set(false); };
  const focus = (e) => { if (e.target.closest?.(FX)) set(true); };
  const blur = (e) => { if (e.target.closest?.(FX)) setTimeout(() => { if (!document.activeElement?.closest?.(FX) && !root.querySelector(`${FX}:hover`)) set(false); }, 0); };
  const key = (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.closest?.(FX) || e.repeat) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch({ type: 'rewrite' });
  };
  root.addEventListener('pointerover', over);
  root.addEventListener('pointerout', out);
  root.addEventListener('focusin', focus);
  root.addEventListener('focusout', blur);
  window.addEventListener('keydown', key, true);
  return () => {
    root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out);
    root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur);
    window.removeEventListener('keydown', key, true);
  };
}
