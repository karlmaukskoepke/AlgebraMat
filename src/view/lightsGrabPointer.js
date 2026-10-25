// Grabbing the terms of the newest row (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md B0–B4), and opening the lights (A3), on the ?ui=lights
// screen. Bound by lightsPointer.js before its own listeners, so a term's keys are handled here first.
//   Pointer (mouse, touch, pen): press a term and move 6 px to lift it. A copy rides about 40 px above the pointer and a dashed gap
//   stays where it was. Over the other side of the line the copy shows the opposite sign (⇄) and that side's slots light up; over a
//   like term on its own side, the term is outlined (combine); elsewhere on its side a bar shows where it would go (reorder). Release
//   to drop; far from the row, or a cancelled pointer, puts it back. A press that does not move is a tap: on a minus it shows the
//   number as a negative (B4).
//   Keyboard: Tab to a term, Enter picks it up, ← / → move it between slots (across the line too), Enter drops, Esc puts it back.
//   The minus key on a focused subtracted term shows it as a negative.
//   Lights: hover or keyboard focus opens a light into its goal; on touch a tap opens it and a second tap closes it.

import { canGrab } from '../engine/addBothLights.js';
import { slotsFor, homeSlot, sameSlot, findTerm, crossedText } from '../engine/lightsGrab.js';

const THRESHOLD = 6;
const LIFT = 40;              // the copy rides this far above the pointer, so a finger never hides it
const REACH = 220;            // a drop more than this far above or below the row puts the term back (Build D-2: a drop a little above
const SIDEWAYS = 120;         // or below the line still lands in the slot the row shows)

export function bindGrab(root, dispatch, getSession) {
  let drag = null;            // { id, pid, x0, y0, started, minus, src, ghost, slot }
  const lights = () => Boolean(root.querySelector('.ui-lights'));
  const live = () => root.querySelector('.lx-live');

  // ---------- where a pointer drop would land ----------
  function slotAt(e) {
    const row = live();
    if (!row || !drag) return null;
    const box = row.getBoundingClientRect();
    const away = e.clientY < box.top - REACH || e.clientY > box.bottom + REACH || e.clientX < box.left - SIDEWAYS || e.clientX > box.right + SIDEWAYS;
    if (drag.factor) {                                              // a factor goes onto its own parenthesis, or back (B6)
      const paren = row.querySelector(`[data-paren="${drag.factor}"]`)?.getBoundingClientRect();
      if (paren && e.clientX >= paren.left - 8 && e.clientX <= paren.right + 8 && e.clientY >= paren.top - 30 && e.clientY <= paren.bottom + 30) return { paren: drag.factor };
      return away ? null : { factorMiss: true };                    // (on the equation but not its parenthesis: it goes back and says so, Build S)
    }
    if (away) return null;
    const border = row.querySelector('.lb-border').getBoundingClientRect();
    const side = e.clientX < border.left + border.width / 2 ? 'left' : 'right';
    // over the shadow of the term (where the row already shows it landing): it stays there, so the row does not flicker as it reflows
    const shadow = row.querySelector('.lx-tok.is-shadow')?.getBoundingClientRect();
    if (shadow && drag.slot?.side === side && e.clientX >= shadow.left && e.clientX <= shadow.right) return drag.slot;
    // (the row shows the term where it would land, as a shadow with no data-tok: only the other terms are counted)
    const others = [...row.querySelectorAll(`.lb-side[data-side="${side}"] [data-tok]`)].filter((n) => n.dataset.tok !== drag.src.dataset.tok && !n.classList.contains('is-gap') && !n.dataset.factor);
    // across the line: before, between or after the terms there (Build D-2, Part 3)
    if (side !== drag.src.dataset.side) return { side, at: others.filter((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2 < e.clientX; }).length };
    let over = null;
    for (const n of others) {
      const r = n.getBoundingClientRect();
      const on = e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24;
      if (on && n.dataset.like === drag.src.dataset.like) return { side, onto: n.dataset.tok };
      if (on) over = n;
    }
    const at = others.filter((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2 < e.clientX; }).length;
    // dropped on a term it cannot combine with, where it would not move either: the engine says why (Build S: never a silent drop)
    const home = [...row.querySelectorAll(`.lb-side[data-side="${side}"] [data-tok]`)].filter((n) => !n.dataset.factor && !n.classList.contains('is-gap')).indexOf(drag.src);
    if (over && at === home && !over.contains(drag.src) && !drag.src.contains(over)) return { side, onto: over.dataset.tok };
    return { side, at };
  }

  function clearMarks() {
    for (const n of root.querySelectorAll('.is-drop-side, .is-combine-target, .is-gap-before, .is-gap-after')) n.classList.remove('is-drop-side', 'is-combine-target', 'is-gap-before', 'is-gap-after');
  }
  function mark(slot) {
    clearMarks();
    drag.src.classList.add('is-lifted');                            // (a redraw keeps the term, but lays the new tree's classes on it: Build S)
    const row = live();
    if (!row || !slot || slot.factorMiss) { drag.ghost.classList.add('is-away'); return; }
    drag.ghost.classList.remove('is-away');
    drag.ghost.lastChild.hidden = true;
    if (slot.paren) { row.querySelector(`[data-paren="${slot.paren}"]`)?.classList.add('is-combine-target'); return; }
    const crossing = slot.side !== drag.src.dataset.side;
    drag.ghost.classList.toggle('is-crossing', crossing);
    drag.ghost.firstChild.textContent = crossing && drag.term.kind === 'num' ? crossedText(drag.term.v) : drag.text;
    // the token is coloured by its sign: green while positive; across the line it flips sign (and colour)
    const v = drag.term.kind === 'num' ? drag.term.v : drag.term.coef ?? 1;
    const shownV = crossing ? -v : v;
    drag.ghost.classList.toggle('is-pos', shownV > 0);
    drag.ghost.classList.toggle('is-neg', shownV < 0);
    drag.ghost.lastChild.hidden = !crossing;
    if (crossing) { row.querySelector(`.lb-side[data-side="${slot.side}"]`)?.classList.add('is-drop-side'); return; }
    if (slot.onto) {                                                 // (only a like term is outlined: an unlike one says why on the drop)
      const n = row.querySelector(`[data-tok="${slot.onto}"]`);
      if (n?.dataset.like && n.dataset.like === drag.src.dataset.like) n.classList.add('is-combine-target');
      return;
    }
    if (drag.previewed) return;                                     // the grey preview row shows where it goes
    const others = [...row.querySelectorAll(`[data-side="${slot.side}"] [data-tok]`)].filter((n) => n.dataset.tok !== drag.src.dataset.tok);
    if (others[slot.at]) others[slot.at].classList.add('is-gap-before'); else others[others.length - 1]?.classList.add('is-gap-after');
  }

  function end() {
    if (drag?.previewed) dispatch({ type: 'ui', patch: { drag: null } });
    drag?.ghost?.remove();
    drag?.src?.classList.remove('is-lifted');
    root.classList.remove('is-grabbing');
    clearMarks();
    drag = null;
  }

  const onDown = (e) => {
    if (!lights() || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const src = e.target.closest?.('.lx-live [data-tok]');
    const s = getSession();
    if (!src || !s || !canGrab(s) || src.classList.contains('is-gap')) return;
    const factor = src.dataset.factor ?? null;
    const term = findTerm(s.board, factor ?? src.dataset.tok)?.term;
    if (!term) return;
    drag = { id: term.id, term, factor, pid: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, minus: e.target.closest('[data-minus]')?.dataset.minus ?? null, src, text: src.textContent.trim(), slot: null };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < THRESHOLD) return;
      drag.started = true;
      drag.src = live()?.querySelector(`[data-tok="${drag.src.dataset.tok}"]`) ?? drag.src;     // (the row may have been redrawn since the press)
      const ghost = document.createElement('div');
      ghost.className = 'lx-dragghost';
      ghost.append(document.createElement('span'), Object.assign(document.createElement('span'), { className: 'lx-swap', textContent: '⇄' }));
      ghost.firstChild.textContent = drag.text;
      ghost.lastChild.hidden = true;
      document.body.append(ghost);
      drag.ghost = ghost;
      drag.src.classList.add('is-lifted');
      root.classList.add('is-grabbing');
    }
    e.preventDefault();
    const g = drag.ghost;
    g.style.transform = `translate(${e.clientX - g.offsetWidth / 2}px, ${e.clientY - LIFT - g.offsetHeight}px)`;
    const slot = slotAt(e);
    const changed = JSON.stringify(slot) !== JSON.stringify(drag.slot);
    drag.slot = slot;
    if (changed && !drag.factor) { drag.previewed = true; dispatch({ type: 'ui', patch: { drag: slot ? { id: drag.id, slot } : null } }); }   // the grey preview follows the slot
    mark(drag.slot);
  };
  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const { id, started, minus, factor } = drag;
    const slot = started && !cancelled ? slotAt(e) : null;
    end();
    if (!started) {
      if (minus && !cancelled) dispatch({ type: 'lxMinus', id: minus });
      return;
    }
    // the press was a drag: swallow the click that follows it
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
    if (factor) dispatch(slot?.paren ? { type: 'lxDistribute', id, how: 'pointer' } : { type: 'lxDrop', id, slot: slot ?? null, how: 'pointer' });
    else dispatch({ type: 'lxDrop', id, slot, how: 'pointer' });
  };
  const onUp = (e) => finish(e, false);
  const onCancel = (e) => finish(e, true);
  root.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);

  // ---------- keyboard: carry a term between slots ----------
  const onKey = (e) => {
    if (!lights() || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const s = getSession();
    if (!s) return;
    const carry = s.ui?.carry;
    const focused = document.activeElement?.closest?.('.lx-live [data-tok]');
    const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (carry) {
      const factor = carry.id.endsWith(':f') ? carry.id.slice(0, -2) : null;   // a factor: back, or onto its parenthesis (B6)
      if (factor && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        stop();
        dispatch({ type: 'ui', patch: { carry: { id: carry.id, slot: e.key === 'ArrowRight' ? { paren: factor } : { home: true } } } });
      } else if (factor && e.key === 'Enter' && !e.repeat) {
        stop();
        dispatch(carry.slot.paren ? { type: 'lxDistribute', id: factor, how: 'key' } : { type: 'lxDrop', id: factor, slot: null, how: 'key' });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stop();
        const slots = slotsFor(s.board, carry.id);
        const k = slots.findIndex((x) => sameSlot(x, carry.slot));
        const next = slots[Math.max(0, Math.min(slots.length - 1, k + (e.key === 'ArrowLeft' ? -1 : 1)))];
        dispatch({ type: 'ui', patch: { carry: { id: carry.id, slot: next } } });
      } else if (e.key === 'Enter' && !e.repeat) {
        stop();
        dispatch({ type: 'lxDrop', id: carry.id, slot: carry.slot, how: 'key' });
      } else if (e.key === 'Tab') stop();                       // the term is in the hand: Tab does not leave it behind
      return;                                                      // Esc: lightsPointer's lxCancel puts it back
    }
    if (!focused || !canGrab(s)) return;
    const factor = focused.dataset.factor ?? null;
    if (e.key === 'Enter' && !e.repeat) {
      stop();
      dispatch({ type: 'ui', patch: { carry: { id: focused.dataset.tok, slot: factor ? { home: true } : homeSlot(s.board, focused.dataset.tok) } } });
    } else if (e.key === '-' || e.key === '−') {
      stop();
      dispatch({ type: 'lxMinus', id: factor ?? focused.dataset.tok });
    }
  };
  window.addEventListener('keydown', onKey, true);

  // ---------- lights: hover, focus or tap opens one; move hovers are counted ----------
  let pointerType = 'mouse';
  let keyboard = false;
  const ui = (patch) => { if (!drag?.started) dispatch({ type: 'ui', patch }); };
  const onAnyDown = (e) => { pointerType = e.pointerType || 'mouse'; keyboard = false; };
  const onAnyKey = (e) => { if (e.key === 'Tab') keyboard = true; };
  document.addEventListener('pointerdown', onAnyDown, true);
  window.addEventListener('keydown', onAnyKey, true);
  const onOver = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    const d = e.target.closest?.('[data-light]');
    if (d) ui({ light: d.dataset.light });
    const m = e.target.closest?.('.lx-move');
    if (m) ui({ hoverMove: m.dataset.move });
  };
  const onOut = (e) => {
    if (e.pointerType !== 'mouse' || !lights()) return;
    const d = e.target.closest?.('[data-light]');
    if (d && !(e.relatedTarget && d.contains(e.relatedTarget))) ui({ light: null });
    const m = e.target.closest?.('.lx-move');
    if (m && !(e.relatedTarget && m.contains(e.relatedTarget))) ui({ hoverMove: null });
  };
  const onClick = (e) => {
    const d = e.target.closest?.('[data-light]');
    if (!d || !lights() || (pointerType === 'mouse' && e.detail !== 0)) return;   // a mouse already opened it by hovering
    const s = getSession();
    ui({ light: s?.ui?.light === d.dataset.light ? null : d.dataset.light });
  };
  const onFocusIn = (e) => {
    const d = e.target.closest?.('[data-light]');
    if (d && keyboard && lights()) queueMicrotask(() => ui({ light: d.dataset.light }));
  };
  const onFocusOut = (e) => {
    const d = e.target.closest?.('[data-light]');
    if (d && keyboard && lights()) queueMicrotask(() => { if (!document.activeElement?.closest?.('[data-light]')) ui({ light: null }); });
  };
  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);
  root.addEventListener('click', onClick);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);

  return () => {
    end();
    root.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onAnyDown, true);
    window.removeEventListener('keydown', onAnyKey, true);
    root.removeEventListener('pointerover', onOver);
    root.removeEventListener('pointerout', onOut);
    root.removeEventListener('click', onClick);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
  };
}
