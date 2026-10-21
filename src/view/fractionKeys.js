// Divide it's keys on the Mat (moved from its play adapter in Build E): "/" goes to the bottom of the fraction blank (and from the whole-number blank it opens the fraction blank); the Multiply options'
// hover previews; and the unit-fraction pop-up when the blank has sat open a while.

import { fracOpen as divideFracOpen, fracOf as divideFracOf } from '../engine/divideBlank.js';
import { bindMultiplyHover } from './multiplyOptions.js';

// The fraction blank's keys; the Multiply options' hover previews (Build D-2, Part 4); and, when the blank has sat open a while with no
// unit fraction in it, the pop-up "Enter a unit fraction, like ⅕ or ½." (once each time the blank opens).
const STUCK_AFTER = 7000;
// `menu`: the card's Multiply menu ({ fracOpen, fracOf }; Divide it's unless a card passes its own, Build J).
export function bindFractionKeys(root, dispatch, getSession, { fracOpen, fracOf } = { fracOpen: divideFracOpen, fracOf: divideFracOf }) {
  const onKey = (e) => {
    idle = Date.now();
    const open = getSession() && (fracOpen(getSession()) || getSession().mopts?.kind === 'whole');     // (a "/" in the whole-number blank opens the fraction)
    if ((e.key === '/' || e.key === 'Divide') && open) { e.preventDefault(); e.stopImmediatePropagation(); dispatch({ type: 'fracSlash' }); }
  };
  let idle = Date.now();
  let wasOpen = false;
  let told = false;
  const onPress = () => { idle = Date.now(); };
  const tick = () => {
    const s = getSession();
    const open = Boolean(s) && fracOpen(s) && root.isConnected;
    if (open && !wasOpen) { idle = Date.now(); told = false; }
    wasOpen = open;
    if (!open || told || fracOf(s.fb) || Date.now() - idle < STUCK_AFTER) return;
    told = true;
    dispatch({ type: 'fracStuck' });
  };
  const timer = setInterval(tick, 500);
  window.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', onPress, true);
  const offHover = bindMultiplyHover(root, dispatch, getSession);
  return () => { clearInterval(timer); window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onPress, true); offHover(); };
}
