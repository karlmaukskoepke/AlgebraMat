// One text size a problem (Build S, Part 3). The equation's size used to follow the rows on screen (a fourth row made every row smaller,
// an Undo made them big again), so the problem jumped from step to step. Now the size is chosen once, when the problem starts, from its
// worst case, and kept for the whole problem: the honest path is played ahead (engine/solveit/honest.js), the states with the most rows,
// the widest rows and the longest check are drawn out of sight at the width of the Mat, and the largest size at which every one of them
// fits the screen (nothing scrolls, no row wider than its space) is the problem's. The loop's rule stays: rows fold, text never shrinks.
//
//   chooseSize(matRoot, adapter, session)   sets --eq-size and --work-size on the Mat for this problem; returns the size chosen

import { honestPath } from '../engine/solveit/honest.js';
import { asItWas } from './visit.js';

// the sizes, largest first: the equation's rows, and the move's work rows (and folded rows) under them
export const SIZES = [[46, 32], [42, 30], [38, 28], [34, 25], [32, 24]];
const POPUP_ROOM = 168;                // a pop-up of four lines under the Mat, its gap above and its margin below (view/spotlight.js)

const rowsOf = (s) => s.rows?.length ?? 0;
const widthOf = (s) => Math.max(0, ...(s.rows ?? []).map((r) => JSON.stringify(r.board ?? r.work ?? '').length));

// the states that need the most room: the most rows, the widest rows, the longest check (and the first, for the ghost row's preview)
function worstStates(path) {
  const pick = new Set([path[0]]);
  [...path].sort((a, b) => rowsOf(b) - rowsOf(a)).slice(0, 3).forEach((s) => pick.add(s));
  [...path].sort((a, b) => widthOf(b) - widthOf(a)).slice(0, 2).forEach((s) => pick.add(s));
  path.filter((s) => s.sub?.placing).slice(0, 1).forEach((s) => pick.add(s));      // (the value waiting to be dragged, its pop-up under x =)
  path.filter((s) => s.sub).slice(-2).forEach((s) => pick.add(s));
  // Add's x-term option open, its boxes stacked under the x-terms (Build T, Part 5: a row one line taller), on the fullest state with an
  // x-term on each side
  const xs = (side) => (side ?? []).some((t) => t.kind === 'x');
  const both = [...path].filter((s) => s.stage === 'moves' && !s.sub && xs(s.board?.left) && xs(s.board?.right)).sort((a, b) => rowsOf(b) - rowsOf(a))[0];
  if (both) pick.add({ ...both, menu: 'add', addKind: 'x', typing: null, amountEntry: '', spot: null });
  return [...pick];
}

// every row's two sides keep to their own space: the left side's ink ends before the =, the right side's starts after it, and neither
// goes past the work's column (into the check while one is drawn, or under the moves)
function inkOf(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const b = r.getBoundingClientRect();
  return b.width ? b : null;
}
function fitsAcross(root) {
  return [...root.querySelectorAll('.lb-stack .lb-rowwrap .lb-eq')].every((eq) => {
    // (while nothing is being checked, a long row may reach into the empty checking space beside it, as it always could)
    const work = eq.closest('.sv-work');
    const area = (work && !work.classList.contains('is-checking') ? work : eq.closest('.sv-solve') ?? root).getBoundingClientRect();
    const border = eq.querySelector(':scope > .lb-border')?.getBoundingClientRect();
    const [left, right] = [eq.querySelector(':scope > .lb-left'), eq.querySelector(':scope > .lb-right')].map((n) => (n ? inkOf(n) : null));
    const inside = (r) => !r || (r.left >= area.left - 1 && r.right <= area.right + 1);
    return inside(left) && inside(right) && (!border || ((!left || left.right <= border.left + 1) && (!right || right.left >= border.right - 1)));
  });
}

// While the value waits to be dragged into x, its pop-up must not cover x = (the value is dragged from there): it goes in the empty space
// under the rows (beside the checking space), or under the Mat, using the page's margin down to the window's edge (view/spotlight.js).
function popupRoom(probe, top) {
  const work = probe.querySelector('.sv-work')?.getBoundingClientRect();
  const last = Math.max(0, ...[...probe.querySelectorAll('.lb-stack .lb-rowwrap')].map((r) => r.getBoundingClientRect().bottom));
  if (work && last && work.bottom - last >= POPUP_ROOM) return true;
  return top + probe.scrollHeight + POPUP_ROOM <= window.innerHeight + 1;
}

function setSize(el, [eq, work]) {
  el.style.setProperty('--eq-size', `${eq}px`);
  el.style.setProperty('--work-size', `${work}px`);
}

export function chooseSize(matRoot, adapter, session) {
  let path;
  try { path = asItWas(() => honestPath(adapter.reduce, session, { grab: adapter.grab !== false })); } catch { path = [session]; }
  const states = worstStates(path);
  const box = matRoot.getBoundingClientRect();
  // the room: from the Mat's top to the bottom of the window, less what the page draws under the Mat (and its padding)
  let below = 0;
  for (let n = matRoot.nextElementSibling; n; n = n.nextElementSibling) {
    const st = getComputedStyle(n);
    if (n.hidden || st.display === 'none' || st.position === 'fixed' || st.position === 'absolute') continue;
    below += n.getBoundingClientRect().height + parseFloat(st.marginTop) + parseFloat(st.marginBottom);
  }
  for (let n = matRoot.parentElement; n && n !== document.documentElement; n = n.parentElement) {
    const st = getComputedStyle(n);
    below += parseFloat(st.paddingBottom) + parseFloat(st.borderBottomWidth) + parseFloat(st.marginBottom);
  }
  const room = window.innerHeight - (box.top + window.scrollY) - below;
  // a copy of the Mat out of sight, at its place and width: the page's own styles apply, nothing on screen moves
  const probe = matRoot.cloneNode(false);
  probe.removeAttribute('id');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, { position: 'absolute', top: `${box.top + window.scrollY}px`, visibility: 'hidden', pointerEvents: 'none', zIndex: '-1' });
  const page = matRoot.parentElement;
  page.append(probe);
  // (at the width the Mat takes when it holds a card: the page's content width, once the page holds one; an empty Mat is narrower)
  const place = () => {
    const ps = getComputedStyle(page);
    const pr = page.getBoundingClientRect();
    probe.style.left = `${pr.left + parseFloat(ps.borderLeftWidth) + parseFloat(ps.paddingLeft) + window.scrollX}px`;
    probe.style.width = `${page.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)}px`;
  };
  let chosen = SIZES.at(-1);
  try {
    for (const size of SIZES) {
      setSize(probe, size);
      const fits = states.every((s) => {
        const tree = adapter.renderMat(s, {});
        tree.querySelectorAll('.spot-layer').forEach((n) => n.remove());           // (pop-ups float over the page: no room of their own)
        probe.replaceChildren(tree);
        place();
        const tall = probe.scrollHeight <= room + 1 && (!s.sub?.placing || popupRoom(probe, box.top));
        const wide = probe.scrollWidth <= probe.clientWidth + 1 && fitsAcross(probe);
        return tall && wide;
      });
      if (fits) { chosen = size; break; }
    }
  } finally {
    probe.remove();
  }
  setSize(matRoot, chosen);
  return chosen;
}
