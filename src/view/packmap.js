// The home screen (Build X, Karl 2026-10-26): the main menu. Four section panels side by side, each with its cards' names as a list.
//   - Clicking a card name opens that card's level set (the card view, with ← All sections to go back).
//   - Pointing at a section's title for a moment, focusing it (Tab) or tapping it expands the whole section over the panels: every card
//     with its levels, and the section's placement quiz. It goes when the pointer or the focus leaves it, on Escape, on a click outside,
//     on its Close button, or on a second tap. Pointing is never the only way: a tap, a click and the keyboard all work.
//   - Each card and section shows its metallic status (engine/status.js): plain, green, silver, gold, each with its own shape and the
//     "3 of 5" text, so colour is never the only sign. Level dots: none plain, placed silver, earned gold (a star), the current one ringed.
//   - Anything that improved since the student last saw the menu shines once (about 1.5 seconds; any key or click stops it; never under
//     reduced motion). A card that shows more levels than before says "New levels added!" once.
import { isLevelDone, isLevelUnlocked, levelState } from '../engine/progress.js';
import { installBar } from './installPrompt.js';
import { accountLabel } from './account.js';
import { CARD_CHALLENGES, challengeById } from '../engine/fluency.js';
import { levelNumber, isWhyLevel, WHY_LABEL, lastLevelOf } from '../packs/index.js';
import { cardStatus, sectionStatus, countText, sectionText, STATUS_WORDS } from '../engine/status.js';

const firstOf = (pack) => pack.firstLevel ?? 1;                       // a card that opens at a later level counts from 1 on screen

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v !== false && v !== undefined) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return el;
};

// ---------- The status shapes (inline SVG: no images, nothing to load) ----------
const SVG = 'http://www.w3.org/2000/svg';
const PATHS = {
  plain: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  green: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" fill="currentColor" stroke="#0a4d2a" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 19l8-8" stroke="#eafff2" stroke-width="1.6" stroke-linecap="round"/>',
  silver: '<path d="M8 2h3l1 6-3 1zM16 2h-3l-1 6 3 1z" fill="#5e6b78"/><circle cx="12" cy="15" r="6.5" fill="currentColor" stroke="#46525e" stroke-width="1.4"/><circle cx="12" cy="15" r="3" fill="none" stroke="#f4f7fa" stroke-width="1.3"/>',
  gold: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="currentColor" stroke="#7a5600" stroke-width="1.3" stroke-linejoin="round"/>',
};
function icon(status, cls = 'st-icon') {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  s.innerHTML = PATHS[status];
  return s;
}

// The status badge on a card: its shape and "3 of 5".
const badge = (c) => h('span', { class: `status-badge st-${c.status}`, title: STATUS_WORDS[c.status] }, icon(c.status), h('span', { class: 'st-count' }, countText(c)));

// ---------- One card, in full (in an expanded section and in the card view) ----------

// The level the student is on: the first open level not finished; once every level is finished, the first placed one (one problem
// earns it). Ringed on the dots.
function currentLevel(progress, pack) {
  const levels = Array.from({ length: lastLevelOf(pack) - firstOf(pack) + 1 }, (_, i) => firstOf(pack) + i);
  return levels.find((l) => !isLevelDone(progress, pack.id, l) && isLevelUnlocked(progress, pack.id, l))
    ?? levels.find((l) => levelState(progress, pack.id, l) === 'placed') ?? null;
}

function levelDots(progress, pack, shine) {
  const current = currentLevel(progress, pack);
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  for (let l = firstOf(pack); l <= lastLevelOf(pack); l++) {
    const state = levelState(progress, pack.id, l);
    const cls = state === 'earned' ? 'is-earned' : state === 'placed' ? 'is-placed' : isLevelUnlocked(progress, pack.id, l) ? '' : 'locked';
    dots.append(h('span', { class: `dot ${cls}${l === current ? ' is-current' : ''}${shine?.includes(l) ? ' is-shining' : ''}`.replace(/\s+/g, ' ').trim() }));
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

const LEVEL_WORDS = { earned: ', earned', placed: ', placed: one problem earns it' };
function packCard(progress, pack, bests, { shine = null, grew = false, titleLink = true } = {}) {
  const status = cardStatus(progress, pack);
  const levels = h('div', { class: `level-list${lastLevelOf(pack) > 4 ? ' many' : ''}` });
  for (let l = firstOf(pack); l <= lastLevelOf(pack); l++) {
    const state = levelState(progress, pack.id, l);
    const open = isLevelUnlocked(progress, pack.id, l);
    levels.append(h('button', {
      type: 'button',
      class: `btn level-btn${state === 'earned' ? ' is-done is-earned' : state === 'placed' ? ' is-placed' : ''}${shine?.includes(l) ? ' is-shining' : ''}`,
      disabled: !open && state === 'none',
      dataset: { pack: pack.id, level: String(l) },
      'aria-label': `${pack.title} Level ${levelNumber(pack, l)}, ${pack.levelNames[l - 1]}${LEVEL_WORDS[state] ?? (open ? '' : ', locked')}`,
    },
    h('span', { class: 'level-num' }, state === 'earned' ? icon('gold', 'lv-icon') : state === 'placed' ? icon('silver', 'lv-icon') : null, `Level ${levelNumber(pack, l)}`),
    h('span', { class: 'level-name' }, open || state !== 'none' ? pack.levelNames[l - 1] : 'Locked'),
    state === 'placed' ? h('span', { class: 'level-placed' }, 'One problem earns it') : null));
  }
  const title = titleLink
    ? h('h2', {}, h('button', { type: 'button', class: 'card-title-btn', dataset: { card: pack.id }, 'aria-label': `Open ${pack.title}` }, pack.title))
    : h('h2', {}, pack.title);
  return h('article', { class: `pack-card st-card-${status.status}` },
    h('div', { class: 'pack-head' }, title,
      levelDots(progress, pack, shine),
      badge(status),
      // The walkthrough of why the move works: always open, never needed for a level (it plays as its old level, so it is saved as before).
      pack.whyLevel ? h('button', {
        type: 'button', class: 'btn why-btn', dataset: { pack: pack.id, level: String(pack.whyLevel) }, 'aria-label': `${pack.title}: ${WHY_LABEL}`,
      }, isLevelDone(progress, pack.id, pack.whyLevel) ? `✓ ${WHY_LABEL}` : WHY_LABEL) : null),
    grew ? h('p', { class: 'new-levels' }, 'New levels added!') : null,
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

// ---------- The menu: four panels ----------

function cardName(progress, pack, shine) {
  if (pack.comingSoon) {
    return h('li', { class: 'card-item is-soon' }, h('span', { class: 'card-name is-soon' }, h('span', { class: 'card-label' }, pack.title), h('span', { class: 'card-count' }, 'soon')));
  }
  const c = cardStatus(progress, pack);
  const grew = shine.grew.has(pack.id);
  return h('li', { class: 'card-item' },
    h('button', {
      type: 'button', class: `card-name st-${c.status}${shine.cards.has(pack.id) ? ' is-shining' : ''}`, dataset: { card: pack.id },
      'aria-label': `${pack.title}: ${countText(c)} levels, ${STATUS_WORDS[c.status]}${grew ? '. New levels added!' : ''}`,
    },
    icon(c.status),
    h('span', { class: 'card-label' }, pack.title),
    h('span', { class: 'card-count' }, countText(c))),
    grew ? h('span', { class: 'new-levels' }, 'New levels added!') : null);
}

function sectionPanel(sec, packs, progress, bests, diag, shine) {
  const mine = sec.packs.map((id) => packs.find((p) => p.id === id)).filter(Boolean);
  const playable = mine.filter((p) => !p.comingSoon);
  const soon = mine.filter((p) => p.comingSoon);
  const st = sectionStatus(progress, sec, packs);
  const sheetId = `sheet-${sec.id}`;
  return h('section', { class: `section-panel sec-${sec.id}${st.status === 'gold' ? ' is-gold' : ''}${shine.sections.has(sec.id) ? ' is-shining' : ''}`, 'data-section': sec.id, 'aria-label': `${sec.title}${sec.grade ? `, ${sec.grade}` : ''}` },
    h('button', {
      type: 'button', class: 'section-head', dataset: { expand: sec.id }, 'aria-expanded': 'false', 'aria-controls': sheetId,
      'aria-label': `${sec.title}${sec.grade ? `, ${sec.grade}` : ''}: ${sec.blurb}. ${sectionText(st)}. Show every card and level`,
    },
    h('span', { class: 'section-title' }, sec.title),
    sec.grade ? h('span', { class: 'section-grade' }, sec.grade) : null,
    h('span', { class: 'section-blurb' }, sec.blurb),
    h('span', { class: `section-status${st.status === 'gold' ? ' st-gold' : ''}` }, st.status === 'gold' ? icon('gold') : null, sectionText(st))),
    h('ul', { class: 'card-list', 'aria-label': `${sec.title} cards` }, ...mine.map((p) => cardName(progress, p, shine))),
    // the whole section, expanded over the panels
    h('div', { class: 'section-sheet', id: sheetId, role: 'region', 'aria-label': `${sec.title}: every card` },
      h('div', { class: 'sheet-head' },
        // (the title again, at the top of the expanded section: a second tap or click on it collapses the section)
        h('h2', { class: 'sheet-title' }, h('button', { type: 'button', class: 'sheet-title-btn', 'data-close': sec.id, 'aria-expanded': 'true', 'aria-label': `${sec.title}: collapse` },
          sec.title, sec.grade ? h('span', { class: 'section-grade' }, ` · ${sec.grade}`) : null, h('span', { class: 'sheet-caret', 'aria-hidden': 'true' }, ' ▴'))),
        h('span', { class: `section-status${st.status === 'gold' ? ' st-gold' : ''}` }, st.status === 'gold' ? icon('gold') : null, sectionText(st)),
        h('button', { type: 'button', class: 'btn sheet-close', 'data-close': sec.id }, 'Close')),
      // (a section with no placement quiz says so, in the bar's place: Solve it Plus, Build X)
      diag ? diagnosticBar(sec, diag) : h('p', { class: 'diag-none' }, `${sec.title} has no placement quiz: start at Level 1 of any card.`),
      playable.length ? h('div', { class: `pack-grid packs-${Math.min(6, playable.length)} sec-${sec.id}` },
        ...playable.map((p) => packCard(progress, p, bests, { shine: shine.levels[p.id], grew: shine.grew.has(p.id) }))) : null,
      soon.length ? h('div', { class: `soon-grid sec-${sec.id}` }, ...soon.map(soonCard)) : null));
}

// One card on its own: its level set, big (Build X: what a card name opens).
function cardView(card, packs, sections, progress, bests, shine) {
  const pack = packs.find((p) => p.id === card);
  const sec = sections.find((s) => s.packs.includes(card));
  return h('section', { class: `card-view sec-${sec?.id ?? 'none'}`, 'aria-label': pack.title },
    h('div', { class: 'card-view-bar' },
      h('button', { type: 'button', class: 'btn card-back', 'data-back': '1' }, '← All sections'),
      sec ? h('span', { class: 'card-crumb' }, sec.title, sec.grade ? ` · ${sec.grade}` : '') : null),
    h('div', { class: `pack-grid packs-1 sec-${sec?.id ?? 'none'}` }, packCard(progress, pack, bests, { shine: shine.levels[pack.id], grew: shine.grew.has(pack.id), titleLink: false })));
}

// ---------- Rendering, and what the menu remembers between redraws ----------

const NO_SHINE = () => ({ cards: new Set(), levels: {}, sections: new Set(), grew: new Set() });
let view = { card: null };        // the card view open, if any (only while the home screen is up: a level or a reload starts at the panels)
let pending = NO_SHINE();          // what still shines: each thing shines once, the first time it is drawn
let last = null;                   // the last call, to redraw for the card view and back
const HOVER_DELAY = 250;           // resting on a title this long (ms) expands its section

// What has been drawn no longer shines on the next draw (it shone once).
function consume(drawn) {
  if (drawn === 'menu') { pending.cards = new Set(); pending.sections = new Set(); }
  if (drawn === 'menu' || drawn === 'card') {
    for (const el of last.root.querySelectorAll('.dot.is-shining, .level-btn.is-shining')) {
      const id = el.closest('.pack-card')?.querySelector('[data-pack]')?.dataset.pack;
      if (id) delete pending.levels[id];
    }
  }
  pending.grew = new Set();
}

export function renderPackMap(root, progress, packs, opts = {}) {
  const {
    onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount, sections = [],
    account = { state: 'off' }, diags = {}, bests = {}, note, shine, keepView = false,
  } = opts;
  if (!keepView) view = { card: null };
  if (shine) pending = { cards: new Set(shine.cards), levels: { ...shine.levels }, sections: new Set(shine.sections), grew: new Set(shine.grew) };
  last = { root, progress, packs, opts: { ...opts, shine: null, keepView: true } };
  root.className = 'home';
  const card = view.card && packs.some((p) => p.id === view.card) ? view.card : null;
  root.replaceChildren(...[
    h('header', { class: 'home-head' },
      h('div', {},
        h('h1', {}, h('button', { type: 'button', class: 'home-title', 'aria-label': 'The Mat: all sections' }, 'The Mat')),
        h('p', { class: 'tagline' }, card ? 'Pick a level.' : 'Pick a card.')),
      h('div', { class: 'home-actions' },
        onAccount ? h('button', { type: 'button', class: 'btn', 'data-home': 'account' }, accountLabel(account)) : null,
        onSaveCode ? h('button', { type: 'button', class: 'btn', 'data-home': 'save' }, 'Save code') : null,   // (only with ?codes=1)
        onEnterCode ? h('button', { type: 'button', class: 'btn', 'data-home': 'enter' }, 'Enter code') : null)),
    h('p', { class: 'home-note', role: 'status', hidden: !note }, note ?? ''),
    installBar(h),
    card ? cardView(card, packs, sections, progress, bests, pending)
      : h('nav', { class: 'landing', 'aria-label': 'Sections' }, ...sections.map((sec) => sectionPanel(sec, packs, progress, bests, diags[sec.id], pending))),
  ].filter(Boolean));
  consume(card ? 'card' : 'menu');
  bindMenu(root, { onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount });
}

const hoverDevice = () => matchMedia('(hover: hover)').matches;

function bindMenu(root, { onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount }) {
  const panels = [...root.querySelectorAll('.section-panel')];
  const expanded = () => root.querySelector('.section-panel.is-expanded');
  const setOpen = (panel, open) => {
    panel.classList.toggle('is-expanded', open);
    panel.querySelector('.section-head')?.setAttribute('aria-expanded', String(open));
  };
  const collapse = () => panels.forEach((p) => setOpen(p, false));
  const expand = (panel) => { panels.forEach((p) => { if (p !== panel) setOpen(p, false); }); setOpen(panel, true); };
  let lastPointer = 0;          // a pointer press on a title: the click that follows decides (a tap toggles), not the focus it brings

  for (const panel of panels) {
    const head = panel.querySelector('.section-head');
    const sheet = panel.querySelector('.section-sheet');
    let timer = null;
    head.addEventListener('pointerdown', () => { lastPointer = Date.now(); });
    // pointing: resting on the title for a moment expands it (a quick pass on the way to a card name does not)
    head.addEventListener('mouseenter', () => {
      if (!hoverDevice()) return;
      clearTimeout(timer);
      timer = setTimeout(() => expand(panel), expanded() ? 0 : HOVER_DELAY);
    });
    head.addEventListener('mouseleave', () => clearTimeout(timer));
    panel.addEventListener('mouseleave', () => { clearTimeout(timer); if (hoverDevice() && panel.classList.contains('is-expanded')) setOpen(panel, false); });
    // the keyboard: Tab onto a title expands it; Tab on to the card names (or anywhere else) collapses it
    head.addEventListener('focus', () => { if (Date.now() - lastPointer > 600 && head.matches(':focus-visible')) expand(panel); });
    panel.addEventListener('focusout', (e) => {
      const to = e.relatedTarget;
      // (focus going nowhere, a click on an empty part of the page: the pointer and click handlers decide)
      if (!to || head.contains(to) || sheet.contains(to)) return;
      setOpen(panel, false);
    });
    head.addEventListener('click', (e) => {
      const was = panel.classList.contains('is-expanded');
      if (e.detail === 0) {                            // Enter or Space on the title: open it, or step into it once open
        if (!was) expand(panel);
        else sheet.querySelector('button:not([disabled])')?.focus();
        return;
      }
      // a click with a mouse only ever opens it; a tap (no hover) opens or closes it
      if (was && !hoverDevice()) setOpen(panel, false); else expand(panel);
    });
  }

  if (!root.dataset.menuBound) {
    root.dataset.menuBound = '1';
    // a tap or click outside the expanded section closes it
    document.addEventListener('click', (e) => { if (!e.target.closest?.('.section-panel')) root.querySelectorAll('.section-panel.is-expanded').forEach((p) => { p.classList.remove('is-expanded'); p.querySelector('.section-head')?.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = root.querySelector('.section-panel.is-expanded');
      if (open) { open.classList.remove('is-expanded'); open.querySelector('.section-head')?.setAttribute('aria-expanded', 'false'); if (open.contains(document.activeElement)) open.querySelector('.card-name')?.focus(); }
      else if (root.querySelector('.card-view') && !document.querySelector('dialog[open]')) goBack(root);
    });
    // the shine stops at any key or click
    const stop = () => root.querySelectorAll('.is-shining').forEach((el) => el.classList.remove('is-shining'));
    document.addEventListener('keydown', stop, true);
    document.addEventListener('pointerdown', stop, true);
  }

  root.onclick = (e) => {
    const b = e.target.closest('button[data-level]');
    if (b && !b.disabled) return onPlay(b.dataset.pack, Number(b.dataset.level));
    const f = e.target.closest('button[data-fluency]');
    if (f) return onFluency(f.dataset.fluency);
    const c = e.target.closest('button[data-card]');
    if (c) return openCard(root, c.dataset.card);
    if (e.target.closest('[data-back]')) return goBack(root);
    const close = e.target.closest('[data-close]');
    if (close) { const p = close.closest('.section-panel'); collapse(); p?.querySelector('.section-head')?.focus({ preventScroll: true }); return; }
    if (e.target.closest('.home-title')) { collapse(); if (root.querySelector('.card-view')) goBack(root); return; }
    const act = e.target.closest('[data-home]')?.dataset.home;
    if (act === 'account') onAccount();
    if (act === 'save') onSaveCode?.();
    if (act === 'enter') onEnterCode?.();
    if (act === 'diagnostic') onDiagnostic(e.target.closest('[data-home]').dataset.section);
  };
}

function redraw() { renderPackMap(last.root, last.progress, last.packs, last.opts); }
function openCard(root, id) {
  view = { card: id };
  redraw();
  window.scrollTo(0, 0);
  root.querySelector('.card-view .level-btn:not([disabled])')?.focus({ preventScroll: true });
}
function goBack(root) {
  const from = view.card;
  view = { card: null };
  redraw();
  root.querySelector(`.card-name[data-card="${from}"]`)?.focus({ preventScroll: true });
}

// Shown in place of the Mat when the fifth problem of a level is solved.
export function renderLevelDone(root, { pack, level, packComplete, nextPack, best = 0, onNext, onMap, onPractice }) {
  const hasNext = level < lastLevelOf(pack);
  const buttons = h('div', { class: 'level-done-actions' });
  if (hasNext) buttons.append(h('button', { type: 'button', class: 'btn btn-primary', 'data-go': 'next' }, `Level ${levelNumber(pack, level + 1)} →`));
  buttons.append(h('button', { type: 'button', class: hasNext ? 'btn' : 'btn btn-primary', 'data-go': 'practice' }, 'Keep practicing'));
  buttons.append(h('button', { type: 'button', class: 'btn', 'data-go': 'map' }, 'Pack map'));

  const why = isWhyLevel(pack, level);
  const panel = h('section', { class: 'level-done', 'aria-live': 'polite' },
    h('h2', {}, why ? 'Now you’ve seen why it works!' : `Level ${levelNumber(pack, level)} complete!`),
    h('p', {}, why
      ? `Try Level ${levelNumber(pack, level + 1)}, or go through this again.`
      : hasNext
      ? `Level ${levelNumber(pack, level + 1)} is open. Move on, or keep practicing this level as long as you like.`
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
