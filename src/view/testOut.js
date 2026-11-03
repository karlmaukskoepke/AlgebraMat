// Test out (Build Z), the screen half: the small panel a locked level opens, the bar over the play screen during an attempt ("Problem 1 of
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

export const ASK_TEXT = 'Want to try it? Solve 2 problems here to skip ahead.';

// The panel a locked level opens: Try it, Not now. No timer, no countdown.
export function askTestOut({ title, levelText }, onTry) {
  const d = document.getElementById('dialog');
  if (d.open) d.close();
  d.replaceChildren(h('div', { class: 'testout-ask' },
    h('h2', {}, `${title} · ${levelText}`),
    h('p', { class: 'testout-ask-text' }, ASK_TEXT),
    h('div', { class: 'dialog-actions' },
      h('button', { type: 'button', class: 'btn', 'data-close': '1' }, 'Not now'),
      h('button', { type: 'button', class: 'btn btn-primary', 'data-try': '1' }, 'Try it'))));
  d.querySelector('[data-close]').onclick = () => d.close();
  d.querySelector('[data-try]').onclick = () => { d.close(); onTry(); };
  d.showModal();
  d.querySelector('[data-try]').focus();
}

// The bar over the play screen while an attempt is on: which problem, and Give up. After the attempt it says how it went.
export function renderTestOutBar(bar, { index, total, levelText, over = null, onGiveUp }) {
  bar.hidden = false;
  bar.className = `testout-bar${over ? ` is-${over}` : ''}`;
  const words = over === 'pass' ? `${total} of ${total} balanced!` : over === 'fail' ? 'This try is over.' : `Problem ${index + 1} of ${total}`;
  const give = over ? null : h('button', { type: 'button', class: 'btn btn-quiet testout-giveup', 'data-giveup': '1' }, 'Give up');
  bar.replaceChildren(...[h('span', { class: 'testout-tag' }, `Skip ahead · ${levelText}`), h('strong', { class: 'testout-count', role: 'status', 'aria-live': 'polite' }, words), give].filter(Boolean));
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
