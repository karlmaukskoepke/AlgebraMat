// The "tucked" layout for Solve it cards (BUILD-BRIEF-DIVIDE-IT-2026-10-12-c, a pilot behind ?layout=tucked). Card-agnostic: a card
// hands it its work stack, its controls (the line, the helper row, the x = [ ] row), its lights, its moves and its scaffold picture.
//
//   - one work column: the original equation and the work stack (it scrolls; the original stays pinned at the top), then the controls;
//   - a slim Why? column on the right: the lights by name and state, and a small "Moves" tab at its foot;
//   - a Moves drawer that slides in from the right over the Why? column, only when asked for (Use a move, the Moves tab);
//   - a counter tray that slides up at the foot of the work column, only for I'm stuck and Teach me (and for the picture a move
//     leaves behind, until Next). The stack stays above it.
// Nothing else, and no reserved empty areas. Which moves exist and how they behave is the card's; this file only places them.
//
// The drawer and tray are view state, kept on the session as `s.ui = { drawer, trayHidden }` by `withTuckedUi` (the engine never
// reads it), so a re-render keeps them as they were and Undo / Start over never depend on them.

import { html } from './addBothMat.js';
import { checkbox } from './lightScreen.js';

// The pilot flag: ?layout=tucked (read once; the tests run without a page, so no location there).
export const TUCKED = typeof location !== 'undefined' && new URLSearchParams(location.search).get('layout') === 'tucked';

// ---------- view state: the drawer and the tray ----------

// Wraps a card's reducer. `o`: { moveId (the card's move, for the messages a blocked open gives), trayAvailable(s) (a scaffold or a
// picture is up), canOpenMoves(s) (the move path, nothing waiting) }.
// Rules: Use a move opens the drawer; the Moves tab opens it on the move path, and from the choice it is the same as Use a move; in
// guess mode (and whenever the moves can't be used) it does not open, and the card's own message says why. The drawer closes on
// the move itself, on ✕ and Escape, and on anything that leaves the move menu (Undo, Start over, help, Check, Guess x, Next).
const CLOSES_DRAWER = new Set(['take', 'go', 'undo', 'startOver', 'stuck', 'teach', 'check', 'foldNext', 'nextLine', 'placeValue', 'next']);
const OPENS_TRAY = new Set(['stuck', 'teach']);

export function withTuckedUi(reduce, o) {
  const ui = (s) => s.ui ?? { drawer: false, trayHidden: false };
  const withUi = (s, patch) => ({ ...s, ui: { ...ui(s), ...patch } });
  return (state, action) => {
    if (action.type === 'ui') {
      const next = withUi(state, { ...action.patch, ...(action.patch.drawer === false && ui(state).drawer ? { returnFocus: true } : {}) });
      return JSON.stringify(next.ui) === JSON.stringify(ui(state)) ? state : next;
    }
    if (action.type === 'openMoves') {
      if (o.canOpenMoves(state)) return withUi(state, { drawer: true });
      if (!state.path && state.stage === 'moves') {                       // from the choice, the tab is "Use a move"
        const s = reduce(state, { type: 'path', value: 'move' });
        return s.path === 'move' ? withUi(s, { drawer: true }) : s;
      }
      return reduce(state, { type: 'choose', move: o.moveId });          // guess mode, x alone, a move waiting: the card says why
    }
    let s = reduce(state, action);
    if (s === state) return state;
    const was = ui(state);
    let drawer = was.drawer;
    let trayHidden = was.trayHidden;
    if (action.type === 'path') drawer = s.path === 'move';
    if (CLOSES_DRAWER.has(action.type)) drawer = false;
    if (OPENS_TRAY.has(action.type) || (!o.trayAvailable(state) && o.trayAvailable(s))) trayHidden = false;
    if (drawer && !o.canOpenMoves(s)) drawer = false;
    // a drawer closed by the work itself (a move taken, Check, help...) gives focus back to the page, not to the Moves tab, so the
    // keyboard keeps typing into x = and Enter still presses Check; only ✕ and Escape (a 'ui' action) return focus to the tab
    const returnFocus = was.drawer && !drawer ? false : Boolean(was.returnFocus);
    if (drawer !== Boolean(s.ui?.drawer) || trayHidden !== Boolean(s.ui?.trayHidden) || returnFocus !== Boolean(s.ui?.returnFocus) || !s.ui) s = withUi(s, { drawer, trayHidden, returnFocus });
    return s;
  };
}

// What changed between two renders, for the slide-in and for where focus goes (handed to the renderer as `fx.tucked`).
export function tuckedEffects(before, s, o) {
  const was = before?.ui ?? {};
  const now = s.ui ?? {};
  const trayWas = Boolean(before && o.trayAvailable(before) && !was.trayHidden);
  const trayNow = o.trayAvailable(s) && !now.trayHidden;
  return {
    drawerOpened: !was.drawer && Boolean(now.drawer),
    drawerClosed: Boolean(was.drawer) && !now.drawer,
    returnFocus: Boolean(now.returnFocus),
    trayOpened: !trayWas && trayNow,
    trayClosed: trayWas && !trayNow,
  };
}

// ---------- the shell ----------

// o: { cls, original (the original equation's row, pinned on top), stack (element: the rows and the check rows), controls (elements: the line, the helper row, the answer rows),
//      lights ([{ key, label, state }]), movesTabOff (bool), drawer: { open, content (elements) },
//      tray: { available, open, title, content (elements) }, fx (tuckedEffects), backFocus (selector of the button that opened the tray) }
export function tuckedShell(o) {
  const fx = o.fx ?? {};
  const shell = html('div', `lb-game sv-card tk-shell ${o.cls ?? ''}`.trim());

  const work = html('div', 'tk-work');
  if (o.original) work.append(html('div', 'tk-original lb-rows', [o.original]));
  work.append(html('div', 'tk-stack', [o.stack]));
  work.append(html('div', 'tk-controls', o.controls));
  if (o.tray.available && o.tray.open) {
    const tray = html('section', `tk-tray${fx.trayOpened ? ' is-entering' : ''}`, [
      html('div', 'tk-trayhead', [
        html('strong', 'tk-traytitle', [o.tray.title]),
        html('button', 'btn btn-quiet tk-close', ['✕'], { type: 'button', 'data-action': 'tkTray', 'aria-label': `Close ${o.tray.title.toLowerCase()}` }),
      ]),
      ...o.tray.content,
    ], { 'aria-label': o.tray.title, tabindex: '-1' });
    if (fx.trayOpened) tray.dataset.tkFocus = '1';
    work.append(tray);
  } else if (o.tray.available) {
    const tab = html('button', 'btn tk-traytab', [`Show ${o.tray.title.toLowerCase()}`], { type: 'button', 'data-action': 'tkTrayShow' });
    if (fx.trayClosed) tab.dataset.tkFocus = '1';
    work.append(tab);
  } else if (fx.trayClosed && o.backFocus) {
    shell.dataset.tkFocusSel = o.backFocus;
  }

  const why = html('aside', 'tk-why', [], { 'aria-label': 'Why?' });
  why.append(html('div', 'tk-whyhead', ['Why?']));
  why.append(html('ul', 'tk-lights', o.lights.map((l) => html('li', `ab-goal tk-light is-${l.state}`, [checkbox(l.state), html('span', 'ab-goal-label', [l.label])]))));
  const tab = html('button', 'btn tk-movestab', ['Moves'], { type: 'button', 'data-action': 'tkMoves', 'aria-expanded': String(Boolean(o.drawer.open)), 'aria-controls': 'tk-drawer' });
  tab.disabled = Boolean(o.movesTabOff);
  if (fx.drawerClosed && fx.returnFocus) tab.dataset.tkFocus = '1';
  why.append(tab);

  shell.append(work, why);
  if (o.drawer.open) {
    const drawer = html('section', `tk-drawer${fx.drawerOpened ? ' is-entering' : ''}`, [
      html('div', 'tk-drawerhead', [
        html('strong', '', ['Moves']),
        html('button', 'btn btn-quiet tk-close', ['✕'], { type: 'button', 'data-action': 'tkDrawer', 'aria-label': 'Close the moves' }),
      ]),
      ...o.drawer.content,
    ], { id: 'tk-drawer', role: 'dialog', 'aria-label': 'Moves', tabindex: '-1' });
    if (fx.drawerOpened) drawer.dataset.tkFocus = '1';
    shell.append(drawer);
  }
  return shell;
}

// The shell's own clicks, as actions: the Moves tab, the two ✕ buttons, and showing a hidden tray again.
export function tuckedAction(d) {
  switch (d.action) {
    case 'tkMoves': return { type: 'openMoves' };
    case 'tkDrawer': return { type: 'ui', patch: { drawer: false } };
    case 'tkTray': return { type: 'ui', patch: { trayHidden: true } };
    case 'tkTrayShow': return { type: 'ui', patch: { trayHidden: false } };
    default: return null;
  }
}

// Bound once on the Mat's container: Escape closes the drawer (or else the tray); after every render, focus goes where the shell
// marked it (into a drawer or tray that just opened, back to the button that opened it when it closed), and the work stack shows
// its newest rows (the original equation is pinned above it).
export function bindTucked(root, dispatch) {
  const onKey = (e) => {
    if (e.key !== 'Escape' || !root.isConnected || root.closest('[hidden]') || document.querySelector('dialog[open]')) return;
    if (root.querySelector('.tk-drawer')) { e.preventDefault(); dispatch({ type: 'ui', patch: { drawer: false } }); }
    else if (root.querySelector('.tk-tray')) { e.preventDefault(); dispatch({ type: 'ui', patch: { trayHidden: true } }); }
  };
  const settle = () => {
    const stack = root.querySelector('.tk-stack');
    if (stack) stack.scrollTop = stack.scrollHeight;
    const shell = root.querySelector('.tk-shell');
    const mark = root.querySelector('[data-tk-focus]') ?? (shell?.dataset.tkFocusSel ? root.querySelector(shell.dataset.tkFocusSel) : null);
    if (mark) { mark.removeAttribute('data-tk-focus'); mark.focus({ preventScroll: true }); }
  };
  const obs = new MutationObserver(settle);
  obs.observe(root, { childList: true });
  document.addEventListener('keydown', onKey);
  return () => { obs.disconnect(); document.removeEventListener('keydown', onKey); };
}
