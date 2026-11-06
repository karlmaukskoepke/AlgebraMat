// Test out (Build Z) and the no-help choice (Build AE), the screen half: the chooser a level opens, the bar over the play screen during an attempt ("Problem 1 of
// 2", Give up), and what a fail shows in place of the Mat. The logic is engine/testOut.js; main.js runs the attempt.

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v !== undefined && v !== null) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return el;
};

// The chooser (Build AE, Karl 2026-11-03): a level is entered with help or by trying it with no help. A fresh open level asks: "Start with
// help" (filled, focused: Enter or Space starts the level as today) or "Try with no help" ("2 problems"). A locked level asks the second
// only, with Not now (focused, so an Enter pressed through never starts a test). Escape or a tap outside closes it, and the focus goes back
// to where it came from. No timer, no heading: two large buttons and one small line. In the place Build Z's panel opened (#dialog).
export const HELP_TEXT = 'Start with help';
export const TRY_TEXT = 'Try with no help';
export const TRY_SMALL = '2 problems';
const GUARD = 400;                 // (a "Try with no help" pressed this soon after the panel opens is a key held through: ignored)

export function askNoHelp({ levelText, locked = false }, { onHelp, onTry, onClose = null, returnFocus = null }) {
  const d = document.getElementById('dialog');
  if (d.open) d.close();
  const opened = performance.now();
  const help = locked ? null : h('button', { type: 'button', class: 'btn btn-primary chooser-btn chooser-help', 'data-choose': 'help' }, HELP_TEXT);
  const tryBtn = h('button', { type: 'button', class: `btn chooser-btn chooser-try${locked ? ' is-only' : ''}`, 'data-choose': 'try' },
    h('span', { class: 'chooser-big' }, TRY_TEXT), h('span', { class: 'chooser-small' }, TRY_SMALL));
  const notNow = locked ? h('button', { type: 'button', class: 'btn chooser-not', 'data-close': '1' }, 'Not now') : null;
  const buttons = [help, tryBtn, notNow].filter(Boolean);
  const panel = h('div', { class: `chooser${locked ? ' is-locked' : ''}` }, h('div', { class: 'chooser-actions' }, ...buttons));
  d.replaceChildren(panel);
  d.classList.add('is-chooser');
  d.setAttribute('aria-label', locked ? `Try ${levelText} with no help` : `Start ${levelText}`);
  const outside = (e) => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
  };
  const keys = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = buttons.indexOf(document.activeElement);
    const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    buttons[(i + step + buttons.length) % buttons.length].focus();
  };
  const mine = Symbol('chooser');
  let done = false;
  const cleanup = () => {
    done = true;
    d.removeEventListener('click', outside);
    d.removeEventListener('keydown', keys);
    d.removeEventListener('close', closed);
    if (d._chooser !== mine) return;
    d._chooser = null;
    d.classList.remove('is-chooser');
    d.removeAttribute('aria-label');
  };
  // closed with no choice (Escape, a tap outside, Not now): the focus goes back. (Another panel taking the dialog over, as the sign-in at
  // the start of a visit does, only tidies up.)
  function closed() {
    if (done) return;
    const taken = !d.contains(panel);
    if (!taken && d.open) return;                // (an earlier panel's close arriving late: this one is still up)
    cleanup();
    if (taken) return;
    const back = typeof returnFocus === 'function' ? returnFocus() : returnFocus;
    if (back?.isConnected) back.focus({ preventScroll: true });
    onClose?.();
  }
  // a choice acts at once (an Enter pressed quickly after it must find the level already starting, not the card page)
  const choose = (then) => { if (done) return; cleanup(); if (d.open) d.close(); then(); };
  d._chooser = mine;
  d.addEventListener('click', outside);
  d.addEventListener('keydown', keys);
  d.addEventListener('close', closed);
  if (help) help.onclick = () => choose(onHelp);
  tryBtn.onclick = (e) => {
    if (e.detail === 0 && performance.now() - opened < GUARD) return;          // (a key, not a press: only after a moment)
    choose(onTry);
  };
  if (notNow) notNow.onclick = () => d.close();
  d.showModal();
  (help ?? notNow).focus();
}

// The bar over the play screen while an attempt is on: which problem, and Give up. After the attempt it says how it went.
export function renderTestOutBar(bar, { index, total, levelText, over = null, onGiveUp }) {
  bar.hidden = false;
  bar.className = `testout-bar${over ? ` is-${over}` : ''}`;
  const words = over === 'pass' ? `${total} of ${total} balanced!` : over === 'fail' ? 'This try is over.' : `Problem ${index + 1} of ${total}`;
  const give = over ? null : h('button', { type: 'button', class: 'btn btn-quiet testout-giveup', 'data-giveup': '1' }, 'Give up');
  bar.replaceChildren(...[h('span', { class: 'testout-tag' }, `No help · ${levelText}`), h('strong', { class: 'testout-count', role: 'status', 'aria-live': 'polite' }, words), give].filter(Boolean));
  if (give) give.onclick = onGiveUp;
}

// A fail, in place of the Mat: "Not yet. Try Level 2 first." with Go to Level 2, Try again (new problems, at once) and the menu.
export function renderTestOutFail(root, { suggestText, typed = null, onSuggested, onRetry, onMap }) {
  const panel = h('section', { class: 'level-done testout-done', 'aria-live': 'polite', 'aria-label': `Not yet. Try ${suggestText} first.` },
    h('h2', {}, 'Not yet.'),
    h('p', { class: 'testout-suggest' }, `Try ${suggestText} first.`),
    typed !== null ? h('p', { class: 'testout-small' }, `x = ${typed} did not balance.`) : null,
    h('p', { class: 'testout-small' }, 'You can try again any time, with new problems.'),
    h('div', { class: 'level-done-actions' },
      h('button', { type: 'button', class: 'btn btn-primary', 'data-go': 'suggested' }, `Go to ${suggestText}`),
      h('button', { type: 'button', class: 'btn', 'data-go': 'retry' }, 'Try again'),
      h('button', { type: 'button', class: 'btn', 'data-go': 'map' }, 'Pack map')));
  panel.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (go === 'suggested') onSuggested();
    if (go === 'retry') onRetry();
    if (go === 'map') onMap();
  });
  root.replaceChildren(panel);
  // (the panel itself takes the focus, not a button: a student still pressing Enter through the check must not go anywhere by it; Tab
  // reaches the buttons)
  panel.tabIndex = -1;
  panel.focus({ preventScroll: true });
}

export const passNote = (levelText) => `You skipped ahead! Do one more problem on ${levelText} to make it gold.`;
// (a pass on a level that was open, Build AE)
export const openPassNote = (levelText) => `No help needed! Do one more problem on ${levelText} to make it gold.`;
