// The keys of Strange solutions' answer, x = [ ] / [ ] (Build V): `/` (or ↓, or Tab from the top) goes to the bottom box; ↑ (or Shift+Tab
// from the bottom) back to the top; a decimal point is answered "Write it as a fraction, like 5/2." Anywhere else Tab is the page's.
// Digits, the minus and Backspace come by the shared typing keys. Runs before the page's keys (capture).

import { keyForMat } from './typingKeys.js';
import { answerTyping } from '../engine/cards/strange.js';

export function bindStrangeKeys(root, dispatch, getSession, loop) {
  const onKey = (e) => {
    const s = getSession?.();
    if (!s || !keyForMat(e, root) || !answerTyping(s, loop)) return;
    const part = s.part ?? 'num';
    let action = null;
    if (e.key === '/' || e.key === 'Divide') action = { type: 'typeChar', ch: '/' };
    else if (e.key === '.' || e.key === ',' || e.key === 'Decimal') action = { type: 'typeChar', ch: '.' };
    else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && part === 'num')) action = { type: 'ansPart', part: 'den' };
    else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey && part === 'den')) action = { type: 'ansPart', part: 'num' };
    if (!action) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch(action);
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
