// The home screen: one card per pack with its level dots and level buttons.
import { isLevelDone, isLevelUnlocked, isPackComplete } from '../engine/progress.js';

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v !== undefined) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.filter((c) => c !== null && c !== undefined));
  return el;
};

function levelDots(progress, pack) {
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  for (let l = 1; l <= pack.levels; l++) {
    const state = isLevelDone(progress, pack.id, l) ? 'done'
      : isLevelUnlocked(progress, pack.id, l) ? '' : 'locked';
    dots.append(h('span', { class: `dot ${state}`.trim() }));
  }
  return dots;
}

// A future pack: its name and the math it's about, no levels yet.
function soonCard(pack) {
  return h('article', { class: 'pack-card is-soon', 'aria-label': `${pack.title}, ${pack.subtitle}, coming soon` },
    h('h2', {}, pack.title),
    h('p', { class: 'subtitle' }, pack.subtitle));
}

function packCard(progress, pack) {
  const complete = isPackComplete(progress, pack.id);
  const levels = h('div', { class: `level-list${pack.levels > 4 ? ' many' : ''}` });
  for (let l = 1; l <= pack.levels; l++) {
    const done = isLevelDone(progress, pack.id, l);
    const open = isLevelUnlocked(progress, pack.id, l);
    levels.append(h('button', {
      type: 'button',
      class: `btn level-btn${done ? ' is-done' : ''}`,
      disabled: !open,
      dataset: { pack: pack.id, level: String(l) },
      'aria-label': `${pack.title} Level ${l}, ${pack.levelNames[l - 1]}${done ? ', done' : open ? '' : ', locked'}`,
    },
    h('span', { class: 'level-num' }, `${done ? '✓ ' : ''}Level ${l}`),
    h('span', { class: 'level-name' }, open ? pack.levelNames[l - 1] : 'Locked')));
  }
  return h('article', { class: 'pack-card' },
    h('div', { class: 'pack-head' }, h('h2', {}, pack.title),
      complete ? h('span', { class: 'tag' }, 'Complete ✓') : levelDots(progress, pack)),
    h('p', { class: 'subtitle' }, pack.subtitle),
    h('p', { class: 'blurb' }, pack.blurb),
    levels);
}

export function renderPackMap(root, progress, packs, { onPlay, onSaveCode, onEnterCode, note }) {
  root.replaceChildren(
    h('header', { class: 'home-head' },
      h('div', {},
        h('h1', {}, 'The Mat'),
        h('p', { class: 'tagline' }, 'Pick a pack and a level.')),
      h('div', { class: 'home-actions' },
        h('button', { type: 'button', class: 'btn', 'data-home': 'save' }, 'Save code'),
        h('button', { type: 'button', class: 'btn', 'data-home': 'enter' }, 'Enter code'))),
    h('p', { class: 'home-note', role: 'status', hidden: !note }, note ?? ''),
    h('div', { class: 'pack-grid', style: `--packs: ${packs.filter((p) => !p.comingSoon).length}` },
      ...packs.filter((p) => !p.comingSoon).map((p) => packCard(progress, p))),
    h('section', { class: 'soon', 'aria-label': 'Coming soon' },
      h('h2', { class: 'soon-head' }, 'Coming soon'),
      h('div', { class: 'soon-grid' }, ...packs.filter((p) => p.comingSoon).map(soonCard))),
  );
  root.onclick = (e) => {
    const b = e.target.closest('button[data-level]');
    if (b && !b.disabled) return onPlay(b.dataset.pack, Number(b.dataset.level));
    const act = e.target.closest('[data-home]')?.dataset.home;
    if (act === 'save') onSaveCode();
    if (act === 'enter') onEnterCode();
  };
}

// Shown in place of the Mat when the fifth problem of a level is solved.
export function renderLevelDone(root, { pack, level, packComplete, nextPack, onNext, onMap, onReplay }) {
  const hasNext = level < pack.levels;
  const buttons = h('div', { class: 'level-done-actions' });
  if (hasNext) buttons.append(h('button', { type: 'button', class: 'btn btn-primary', 'data-go': 'next' }, `Level ${level + 1} →`));
  else buttons.append(h('button', { type: 'button', class: 'btn', 'data-go': 'replay' }, `Play Level ${level} again`));
  buttons.append(h('button', { type: 'button', class: hasNext ? 'btn' : 'btn btn-primary', 'data-go': 'map' }, 'Pack map'));

  const panel = h('section', { class: 'level-done', 'aria-live': 'polite' },
    h('h2', {}, `Level ${level} complete!`),
    h('p', {}, hasNext
      ? `Level ${level + 1} is open.`
      : packComplete && nextPack?.comingSoon
        ? `You finished ${pack.title}! ${nextPack.title} is coming soon.`
        : packComplete && nextPack ? `You finished ${pack.title}! Next up: ${nextPack.title}, on the pack map.`
          : packComplete ? `You finished ${pack.title}!`
            : `That’s the last ${pack.title} level! Finish the others to complete the pack.`),
    buttons);
  panel.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (go === 'next') onNext();
    if (go === 'map') onMap();
    if (go === 'replay') onReplay();
  });
  root.replaceChildren(panel);
  panel.querySelector('.btn-primary')?.focus();
}
