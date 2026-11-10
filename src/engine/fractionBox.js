// One box for a fraction answer (Build AF, Karl 2026-11-09): `x = [3/2]`, typed with the slash key and shown exactly as typed. Strange
// solutions' answer and Try a number use it. The box is kept as three pieces, so what was stored, checked and recorded before is unchanged:
// `top` (with its minus), `bottom`, and `part` ('den' once the slash is typed). Pure logic, no DOM.

// the box's text: `3/2`, `-4`, `3/` (the slash is shown from the moment it is typed)
export const boxText = (top, bottom, part) => `${top ?? ''}${part === 'den' ? `/${bottom ?? ''}` : ''}`;
// one key in the box: { top, bottom, part } after it, or null when the key is ignored (no message). Shared with Try a number.
// `opts.topMax`, `opts.bottomMax`: digits allowed; `opts.dot(top, bottom, part)`: what a decimal point does (each place keeps its own rule).
export function boxKey({ top, bottom, part }, action, opts) {
  const slash = part === 'den';
  if (action.type === 'typeChar' && action.ch === '/') {
    if (slash || top === '' || top === '-') return null;                              // (a slash first, or a second slash)
    return { top, bottom, part: 'den' };
  }
  if (action.type === 'typeChar' && (action.ch === '.' || action.ch === ',')) return opts.dot({ top, bottom, part });
  if (action.type === 'typeChar' && (action.ch === '-' || action.ch === '−')) {
    return top === '' && !slash ? { top: '-', bottom, part } : null;                  // (a minus only at the front)
  }
  if (action.type === 'toggleSign') return { top: top.startsWith('-') ? top.slice(1) : `-${top}`, bottom, part };   // (the keypad's ±: the front minus)
  if (action.type === 'digit') {
    if (!Number.isInteger(action.digit)) return null;
    if (!slash) return top.replace(/[-.]/g, '').length >= opts.topMax ? null : { top: top + String(action.digit), bottom, part };
    return bottom.replace('.', '').length >= opts.bottomMax ? null : { top, bottom: bottom + String(action.digit), part };
  }
  if (action.type === 'backspace') {
    if (slash && bottom !== '') return { top, bottom: bottom.slice(0, -1), part };
    if (slash) return { top, bottom, part: 'num' };                                     // (across the slash)
    return top === '' ? null : { top: top.slice(0, -1), bottom: '', part };
  }
  return null;
}
// the box can be checked: a top with digits, and a bottom with digits once the slash is typed (`3/` waits)
export const boxReady = (top, bottom, part) => /\d/.test(top ?? '') && (part !== 'den' || /\d/.test(bottom ?? ''));
