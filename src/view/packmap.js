// The home screen: one card per pack with its level dots and level buttons.
import { isLevelDone, isLevelUnlocked, isPackComplete } from '../engine/progress.js';
import { installBar } from './installPrompt.js';
import { accountLabel } from './account.js';
import { menuEntries } from '../engine/menu.js';
import { CARD_CHALLENGES, challengeById } from '../engine/fluency.js';

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

// A card's last item: its fluency challenges, with the best score on this device.
function fluencyRow(pack, bests) {
  const ids = CARD_CHALLENGES[pack.id];
  if (!ids) return null;
  return h('div', { class: 'fluency-row' },
    ...ids.map((id) => h('button', { type: 'button', class: 'btn fluency-btn', dataset: { fluency: id }, 'aria-label': `${challengeById(id).title} fluency challenge${bests[id] ? `, best ${bests[id]}` : ''}` },
      `⏱ ${challengeById(id).title}`,
      bests[id] ? h('span', { class: 'fluency-best' }, ` · ${bests[id]}`) : null)));
}

function packCard(progress, pack, bests) {
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
    // The scroll box is a plain wrapper, so the grid inside sizes its rows to their text
    // (a grid with a fixed height squeezes its rows and clips the level names).
    h('div', { class: 'level-scroll' }, levels),
    fluencyRow(pack, bests));
}

// A section's diagnostic button: take it, pick it up where it was left, or see the results.
function diagnosticBar(section, diag) {
  const label = diag.status === 'done' ? `See my ${section.title} diagnostic results`
    : diag.status === 'partial' ? `Continue the ${section.title} diagnostic (${diag.index} of ${diag.total} done)`
      : `Take the ${section.title} diagnostic to find your levels`;
  return h('section', { class: `diag-bar${diag.status === 'done' ? ' is-done' : ''}`, 'aria-label': `${section.title} diagnostic` },
    h('button', { type: 'button', class: 'btn btn-primary diag-start', 'data-home': 'diagnostic', 'data-section': section.id }, label),
    h('p', { class: 'diag-blurb' }, diag.status === 'done'
      ? 'The levels you showed you’re ready for are open.'
      : `About ${diag.total} problems. Nothing is marked until the end, and it opens the levels you’re ready for.`));
}

// The three sections as big panels (the first screen): each shows its cards, small, with how far along you are.
function landing(sections, packs, progress) {
  return h('nav', { class: 'landing', 'aria-label': 'Sections' },
    ...sections.map((sec) => h('button', { type: 'button', class: `section-panel sec-${sec.id}`, 'data-section': sec.id, 'aria-label': `${sec.title}: ${sec.blurb}` },
      h('span', { class: 'section-title' }, sec.title),
      h('span', { class: 'section-blurb' }, sec.blurb),
      h('span', { class: 'mini-cards' }, ...sec.packs.map((id) => {
        const pack = packs.find((p) => p.id === id);
        const done = pack.comingSoon ? 0 : Array.from({ length: pack.levels }, (_, i) => isLevelDone(progress, pack.id, i + 1)).filter(Boolean).length;
        return h('span', { class: `mini-card${pack.comingSoon ? ' is-soon' : ''}` },
          h('span', { class: 'mini-name' }, pack.title),
          h('span', { class: 'mini-progress' }, pack.comingSoon ? 'soon' : `${done}/${pack.levels}`));
      })))));
}

// The three titles in a bar across the top. Over a title (or a tap on a touch screen) a dropdown lists that section's
// cards, each with its level buttons, so any open level is one click away; moving off collapses it again. The open
// section's title is wide and bold, the others small beside it.
function sectionBar(sections, open, packs, progress) {
  const entries = menuEntries(sections, packs, progress);
  return h('nav', { class: 'section-bar', 'aria-label': 'Sections' },
    ...entries.map((entry) => h('div', { class: `section-menu sec-${entry.id}${entry.id === open ? ' is-current' : ''}` },
      h('button', {
        type: 'button', class: `section-tab sec-${entry.id}${entry.id === open ? ' is-open' : ''}`, 'data-section': entry.id,
        'aria-current': entry.id === open ? 'true' : null, 'aria-haspopup': 'true',
      }, entry.title),
      h('div', { class: 'dropdown', role: 'group', 'aria-label': `${entry.title} cards` },
        h('button', { type: 'button', class: 'dropdown-open', 'data-section': entry.id }, `Open all of ${entry.title} →`),
        h('div', { class: 'dropdown-cards' }, ...entry.cards.map((card) => h('div', { class: `dropdown-card${card.soon ? ' is-soon' : ''}` },
          h('span', { class: 'dropdown-name' }, card.title),
          card.soon
            ? h('span', { class: 'dropdown-soon' }, 'soon')
            : h('span', { class: 'dropdown-levels' }, ...card.levels.map((lv) => h('button', {
              type: 'button', class: `menu-pill${lv.done ? ' is-done' : ''}${lv.open ? '' : ' is-locked'}`, disabled: !lv.open,
              'data-level': lv.level, 'data-pack': card.id,
              'aria-label': `${card.title}, level ${lv.level}${lv.open ? `: ${lv.name}` : ', locked'}${lv.done ? ', finished' : ''}`,
            }, `${lv.done ? '✓' : ''}${lv.level}`))))))))));
}

export function renderPackMap(root, progress, packs, {
  onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount, onSection, sections = [], open = null,
  account = { state: 'off' }, diags = {}, bests = {}, note,
}) {
  const section = sections.find((s) => s.id === open) ?? null;
  const mine = section ? section.packs.map((id) => packs.find((p) => p.id === id)).filter(Boolean) : [];
  const playable = mine.filter((p) => !p.comingSoon);
  const soon = mine.filter((p) => p.comingSoon);
  const diag = section ? diags[section.id] : null;
  root.className = `home${section ? ` in-${section.id} sec-${section.id}` : ""}`;
  root.replaceChildren(...[
    h('header', { class: 'home-head' },
      h('div', {},
        h('h1', {}, h('button', { type: 'button', class: 'home-title', 'data-section': '', 'aria-label': 'The Mat: all sections' }, 'The Mat')),
        h('p', { class: 'tagline' }, section ? section.blurb : 'Pick a section.')),
      h('div', { class: 'home-actions' },
        onAccount ? h('button', { type: 'button', class: 'btn', 'data-home': 'account' }, accountLabel(account)) : null,
        h('button', { type: 'button', class: 'btn', 'data-home': 'save' }, 'Save code'),
        h('button', { type: 'button', class: 'btn', 'data-home': 'enter' }, 'Enter code'))),
    h('p', { class: 'home-note', role: 'status', hidden: !note }, note ?? ''),
    installBar(h),
    sectionBar(sections, open, packs, progress),
    section ? null : landing(sections, packs, progress),
    section && diag ? diagnosticBar(section, diag) : null,
    section && playable.length ? h('div', { class: `pack-grid packs-${Math.min(6, playable.length)} sec-${section.id}` },
      ...playable.map((p) => packCard(progress, p, bests))) : null,
    section && soon.length
      ? h('section', { class: `soon sec-${section.id}`, 'aria-label': 'Coming soon' },
        h('h2', { class: 'soon-head' }, playable.length ? 'Coming soon' : 'On the way'),
        h('div', { class: 'soon-grid' }, ...soon.map(soonCard)))
      : null,
  ].filter(Boolean));
  // A tap outside the open dropdown, or Escape, closes it.
  const closeMenus = () => root.querySelectorAll('.section-menu.is-expanded').forEach((m) => m.classList.remove('is-expanded'));
  if (!root.dataset.menuBound) {
    root.dataset.menuBound = '1';
    document.addEventListener('click', (e) => { if (!e.target.closest?.('.section-menu')) closeMenus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenus(); document.activeElement?.blur?.(); } });
  }
  // On a computer, resting the mouse on a title for half a second opens its dropdown; moving off closes it.
  root.querySelectorAll('.section-menu').forEach((m) => {
    let timer = null;
    m.addEventListener('mouseenter', () => {
      if (!matchMedia('(hover: hover)').matches) return;
      timer = setTimeout(() => { closeMenus(); m.classList.add('is-expanded'); }, 500);
    });
    m.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      if (matchMedia('(hover: hover)').matches) m.classList.remove('is-expanded');
    });
  });
  root.onclick = (e) => {
    const b = e.target.closest('button[data-level]');
    if (b && !b.disabled) return onPlay(b.dataset.pack, Number(b.dataset.level));
    const f = e.target.closest('button[data-fluency]');
    if (f) return onFluency(f.dataset.fluency);
    const tab = e.target.closest('.section-tab');
    if (tab) {
      // A click or tap opens that dropdown (and closes any other); "Open all of …" goes in. On a computer, resting the
      // mouse on a title does the same after half a second (CSS), and moving off closes a click-opened one.
      const menu = tab.closest('.section-menu');
      // (With a mouse a click only ever opens it: the half-second rest may already have.)
      const was = menu.classList.contains('is-expanded') && matchMedia('(hover: none)').matches;
      closeMenus();
      if (!was) menu.classList.add('is-expanded');
      return;
    }
    const sec = e.target.closest('[data-section]');
    if (sec && !sec.dataset.home) return onSection(sec.dataset.section || null);
    const act = e.target.closest('[data-home]')?.dataset.home;
    if (act === 'account') onAccount();
    if (act === 'save') onSaveCode();
    if (act === 'enter') onEnterCode();
    if (act === 'diagnostic') onDiagnostic(e.target.closest('[data-home]').dataset.section);
  };
}

// Shown in place of the Mat when the fifth problem of a level is solved.
export function renderLevelDone(root, { pack, level, packComplete, nextPack, best = 0, onNext, onMap, onPractice }) {
  const hasNext = level < pack.levels;
  const buttons = h('div', { class: 'level-done-actions' });
  if (hasNext) buttons.append(h('button', { type: 'button', class: 'btn btn-primary', 'data-go': 'next' }, `Level ${level + 1} →`));
  buttons.append(h('button', { type: 'button', class: hasNext ? 'btn' : 'btn btn-primary', 'data-go': 'practice' }, 'Keep practicing'));
  buttons.append(h('button', { type: 'button', class: 'btn', 'data-go': 'map' }, 'Pack map'));

  const panel = h('section', { class: 'level-done', 'aria-live': 'polite' },
    h('h2', {}, `Level ${level} complete!`),
    h('p', {}, hasNext
      ? `Level ${level + 1} is open. Move on, or keep practicing this level as long as you like.`
      : packComplete && nextPack?.comingSoon
        ? `You finished ${pack.title}! ${nextPack.title} is coming soon.`
        : packComplete && nextPack ? `You finished ${pack.title}! Next up: ${nextPack.title}, on the pack map.`
          : packComplete ? `You finished ${pack.title}!`
            : `That’s the last ${pack.title} level! Finish the others to complete the pack.`),
    best > 0 ? h('p', { class: 'level-best' }, `Best streak on this level: ${best}`) : null,
    buttons);
  panel.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (go === 'next') onNext();
    if (go === 'map') onMap();
    if (go === 'practice') onPractice();
  });
  root.replaceChildren(panel);
  panel.querySelector('.btn-primary')?.focus();
}
