// The keys of Strange solutions' answer box and Try a number's box, one box typed as it is written, `3/2` (Build AF; two boxes before,
// Build V): `/` types the slash; the minus key types a minus only at the front (anywhere else it is ignored, with no message); a decimal
// point goes to the card's rule (the answer: "Write it as a fraction, like 5/2."; Try a number: read as an exact fraction). Tab is the
// page's, as on every answer box. Digits and Backspace come by the shared typing keys. Runs before the page's keys (capture).

import { keyForMat } from './typingKeys.js';
import { answerTyping } from '../engine/cards/strange.js';
import { trialTyping } from '../engine/strangeTry.js';

export function bindStrangeKeys(root, dispatch, getSession, loop) {
  const onKey = (e) => {
    const s = getSession?.();
    const trying = Boolean(s) && trialTyping(s);                      // (Try a number's box, Build V2)
    if (!s || !keyForMat(e, root) || !(answerTyping(s, loop) || trying)) return;
    let action = null;
    if (e.key === '/' || e.key === 'Divide') action = { type: 'typeChar', ch: '/' };
    else if (e.key === '.' || e.key === ',' || e.key === 'Decimal') action = { type: 'typeChar', ch: '.' };
    else if (e.key === '-' || e.key === '−' || e.key === 'Subtract') action = { type: 'typeChar', ch: '-' };
    if (!action) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch(action);
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
