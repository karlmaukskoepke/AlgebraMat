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
const REACH = 90;             // a drop more than this far above or below the row puts the term back

export function bindGrab(root, dispatch, getSession) {
  let drag = null;            // { id, pid, x0, y0, started, minus, src, ghost, slot }
  const lights = () => Boolean(root.querySelector('.ui-lights'));
  const live = () => root.querySelector('.lx-live');

  // ---------- where a pointer drop would land ----------
  function slotAt(e) {
    const row = live();
    if (!row || !drag) return null;
    const box = row.getBoundingClientRect();
    if (e.clientY < box.top - REACH || e.clientY > box.bottom + REACH) return null;
    const border = row.querySelector('.lb-border').getBoundingClientRect();
    const side = e.clientX < border.left + border.width / 2 ? 'left' : 'right';
    if (side !== drag.src.dataset.side) return { side, at: 0 };
    const others = [...row.querySelectorAll(`[data-side="${side}"] [data-tok]`)].filter((n) => n !== drag.src && !n.classList.contains('is-gap'));
    for (const n of others) {
      const r = n.getBoundingClientRect();
      if (n.dataset.like === drag.src.dataset.like && e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24) return { side, onto: n.dataset.tok };
    }
    return { side, at: others.filter((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2 < e.clientX; }).length };
  }

  function clearMarks() {
    for (const n of root.querySelectorAll('.is-drop-side, .is-combine-target, .is-gap-before, .is-gap-after')) n.classList.remove('is-drop-side', 'is-combine-target', 'is-gap-before', 'is-gap-after');
  }
  function mark(slot) {
    clearMarks();
    const row = live();
    if (!row || !slot) { drag.ghost.classList.add('is-away'); return; }
    drag.ghost.classList.remove('is-away');
    const crossing = slot.side !== drag.src.dataset.side;
    drag.ghost.classList.toggle('is-crossing', crossing);
    drag.ghost.firstChild.textContent = crossing && drag.term.kind === 'num' ? crossedText(drag.term.v) : drag.text;
    drag.ghost.lastChild.hidden = !crossing;
    if (crossing) { row.querySelector(`.lb-side[data-side="${slot.side}"]`)?.classList.add('is-drop-side'); return; }
    if (slot.onto) { row.querySelector(`[data-tok="${slot.onto}"]`)?.classList.add('is-combine-target'); return; }
    const others = [...row.querySelectorAll(`[data-side="${slot.side}"] [data-tok]`)].filter((n) => n !== drag.src);
    if (others[slot.at]) others[slot.at].classList.add('is-gap-before'); else others[others.length - 1]?.classList.add('is-gap-after');
  }

  function end() {
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
    const term = findTerm(s.board, src.dataset.tok)?.term;
    if (!term) return;
    drag = { id: term.id, term, pid: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, minus: e.target.closest('[data-minus]')?.dataset.minus ?? null, src, text: src.textContent.trim(), slot: null };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < THRESHOLD) return;
      drag.started = true;
      drag.src = live()?.querySelector(`[data-tok="${drag.id}"]`) ?? drag.src;     // (the row may have been redrawn since the press)
      const ghost = document.createElement('div');
      ghost.className = 'lx-dragghost';
      ghost.append(document.createElement('span'), Object.assign(document.createElement('span'), { className: 'lx-swap', textContent: '⇄' }));
      ghost.firstChild.textContent = drag.text;
      document.body.append(ghost);
      drag.ghost = ghost;
      drag.src.classList.add('is-lifted');
      root.classList.add('is-grabbing');
    }
    e.preventDefault();
    const g = drag.ghost;
    g.style.transform = `translate(${e.clientX - g.offsetWidth / 2}px, ${e.clientY - LIFT - g.offsetHeight}px)`;
    drag.slot = slotAt(e);
    mark(drag.slot);
  };
  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const { id, started, minus } = drag;
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
    dispatch({ type: 'lxDrop', id, slot, how: 'pointer' });
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
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
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
    if (e.key === 'Enter' && !e.repeat) {
      stop();
      dispatch({ type: 'ui', patch: { carry: { id: focused.dataset.tok, slot: homeSlot(s.board, focused.dataset.tok) } } });
    } else if (e.key === '-' || e.key === '−') {
      stop();
      dispatch({ type: 'lxMinus', id: focused.dataset.tok });
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
