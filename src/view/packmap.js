// The home screen: the main menu. Four section panels side by side, each with its title, grade, blurb, status line and its cards' names.
//   - Clicking a card name opens that card's level set (the card view, with ← All sections to go back) (Build X).
//   - Pointing at a card name for a moment (Build AB, Karl 2026-11-01) shows a small popup beside it with the card's levels: each level's
//     name and status (plain, placed in silver, earned in gold, the current one ringed, locked greyed with a short note), "See why it works"
//     where the card has it, and the card's "3 of 5". A level in the popup opens that level. A small chevron beside each name opens the
//     same popup for a tap or the keyboard (Tab reaches the name, then the chevron; Enter or Space opens it, the arrows move between the
//     levels, Enter opens one, Escape closes it), so pointing is never the only way. It opens beside the name (to the left near the right
//     edge, under it on a narrow window), never over the card names below, stays inside the window, and closes when the pointer leaves
//     both the name and the popup, on Escape, and on a tap or click outside.
//   - Each section's footer (Build AB): "Find my level" (its placement quiz) where the section has one (Count it, Build it, Solve it;
//     not Solve it Plus), and "Timed challenges" where it has challenges (Count it), which opens a small list of them.
//   - Each card and section shows its metallic status (engine/status.js): plain, green, silver, gold, each with its own shape and the
//     "3 of 5" text, so colour is never the only sign. Level dots: none plain, placed silver, earned gold (a star), the current one ringed.
//   - Anything that improved since the student last saw the menu shines once (about 1.5 seconds; any key or click stops it; never under
//     reduced motion). A card that shows more levels than before says "New levels added!" once.
// (Build X's expanding section titles are gone, Build AB: the title is a plain heading.)
import { isLevelDone, isLevelUnlocked, levelState } from '../engine/progress.js';
import { installBar } from './installPrompt.js';
import { accountLabel } from './account.js';
import { SECTION_CHALLENGES, challengeById } from '../engine/fluency.js';
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
  // (Build AB: a locked level in a popup, and the chevron that opens a popup)
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  chevron: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
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

// ---------- One card, in full (in the card view) ----------

// The level the student is on: the first open level not finished; once every level is finished, the first placed one (one problem
// earns it). Ringed on the dots and in the popup.
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

const LEVEL_WORDS = { earned: ', earned', placed: ', placed: one problem earns it' };
// A locked level a student may test out of (Build Z: Solve it and Solve it Plus cards): set by renderPackMap from opts.canTry.
let canTry = () => false;
const TRY_WORDS = 'Tap to skip ahead';
function packCard(progress, pack, { shine = null, grew = false } = {}) {
  const status = cardStatus(progress, pack);
  const levels = h('div', { class: `level-list${lastLevelOf(pack) > 4 ? ' many' : ''}` });
  for (let l = firstOf(pack); l <= lastLevelOf(pack); l++) {
    const state = levelState(progress, pack.id, l);
    const open = isLevelUnlocked(progress, pack.id, l);
    const tryable = !open && state === 'none' && canTry(pack.id, l);
    levels.append(h('button', {
      type: 'button',
      class: `btn level-btn${state === 'earned' ? ' is-done is-earned' : state === 'placed' ? ' is-placed' : ''}${shine?.includes(l) ? ' is-shining' : ''}`,
      disabled: !open && state === 'none' && !tryable,
      dataset: tryable ? { tryPack: pack.id, tryLevel: String(l) } : { pack: pack.id, level: String(l) },
      'aria-label': `${pack.title} Level ${levelNumber(pack, l)}, ${pack.levelNames[l - 1]}${LEVEL_WORDS[state] ?? (open ? '' : tryable ? `, locked. ${TRY_WORDS}` : ', locked')}`,
      ...(tryable ? { class: 'btn level-btn is-locked is-tryable', 'aria-haspopup': 'dialog' } : {}),
    },
    h('span', { class: 'level-num' }, state === 'earned' ? icon('gold', 'lv-icon') : state === 'placed' ? icon('silver', 'lv-icon') : null, `Level ${levelNumber(pack, l)}`),
    h('span', { class: 'level-name' }, open || state !== 'none' ? pack.levelNames[l - 1] : 'Locked'),
    state === 'placed' ? h('span', { class: 'level-placed' }, 'One problem earns it') : null,
    tryable ? h('span', { class: 'level-try' }, TRY_WORDS) : null));
  }
  return h('article', { class: `pack-card st-card-${status.status}` },
    h('div', { class: 'pack-head' }, h('h2', {}, pack.title),
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
    h('div', { class: 'level-scroll' }, levels));
}

// ---------- A card's popup of levels (Build AB, Part 3) ----------
//
// Every row is a button, so a later build can make a locked row do something (Build Z, "Test out") by giving it an action: today a locked
// row carries data-locked (its saved level number) and aria-disabled, and a click or tap on it only shows its note. An open row carries
// data-pack and data-level, like a level button, and opens that level.

const lockNote = (pack, l) => `Finish Level ${levelNumber(pack, l - 1)} to open this${canTry(pack.id, l) ? ', or tap to skip ahead' : ''}.`;

function popRow(progress, pack, l, current, shine) {
  const state = levelState(progress, pack.id, l);
  const open = isLevelUnlocked(progress, pack.id, l) || state !== 'none';
  const num = levelNumber(pack, l);
  const name = pack.levelNames[l - 1];
  const words = `Level ${num}, ${name}${LEVEL_WORDS[state] ?? (open ? '' : `, locked. ${lockNote(pack, l)}`)}${l === current ? ', the level you are on' : ''}`;
  const cls = `pop-level is-${open ? state : 'locked'}${l === current ? ' is-current' : ''}${shine?.includes(l) ? ' is-shining' : ''}`;
  return h('li', { role: 'none' },
    h('button', {
      type: 'button', role: 'menuitem', tabindex: '-1', class: cls, 'aria-label': words, 'aria-disabled': open || canTry(pack.id, l) ? false : 'true',
      dataset: open ? { pack: pack.id, level: String(l) } : { locked: String(l), lockPack: pack.id, ...(canTry(pack.id, l) ? { tryPack: pack.id, tryLevel: String(l) } : {}) },
      ...(!open && canTry(pack.id, l) ? { 'aria-haspopup': 'dialog' } : {}),
    },
    h('span', { class: 'pop-mark' }, state === 'earned' ? icon('gold', 'pop-icon') : state === 'placed' ? icon('silver', 'pop-icon') : open ? h('span', { class: 'pop-dot' }) : icon('lock', 'pop-icon is-lock')),
    h('span', { class: 'pop-num' }, `Level ${num}`),
    h('span', { class: 'pop-name' }, name),
    state === 'placed' ? h('span', { class: 'pop-note' }, 'One problem earns it') : null,
    open ? null : h('span', { class: 'pop-tip', role: 'tooltip' }, lockNote(pack, l))));
}

function levelPopup(progress, pack, shine, grew) {
  const c = cardStatus(progress, pack);
  const current = currentLevel(progress, pack);
  const rows = [];
  for (let l = firstOf(pack); l <= lastLevelOf(pack); l++) rows.push(popRow(progress, pack, l, current, shine));
  if (pack.whyLevel) {
    const done = isLevelDone(progress, pack.id, pack.whyLevel);
    rows.push(h('li', { role: 'none', class: 'pop-why-item' }, h('button', {
      type: 'button', role: 'menuitem', tabindex: '-1', class: `pop-level pop-why${done ? ' is-seen' : ''}`,
      dataset: { pack: pack.id, level: String(pack.whyLevel) }, 'aria-label': `${WHY_LABEL}${done ? ', seen' : ''}`,
    }, h('span', { class: 'pop-mark', 'aria-hidden': 'true' }, done ? '✓' : '?'), h('span', { class: 'pop-name' }, WHY_LABEL))));
  }
  return h('div', { class: 'lv-pop', id: `pop-${pack.id}`, role: 'menu', 'aria-label': `${pack.title} levels`, hidden: true, dataset: { pop: pack.id } },
    h('div', { class: 'pop-head', 'aria-hidden': 'true' }, h('span', { class: 'pop-title' }, pack.title), badge(c)),
    grew ? h('p', { class: 'new-levels' }, 'New levels added!') : null,
    h('ul', { class: 'pop-list', role: 'none' }, ...rows));
}

// ---------- The menu: four panels ----------

function cardName(progress, pack, shine) {
  if (pack.comingSoon) {
    return h('li', { class: 'card-item is-soon' }, h('span', { class: 'card-name is-soon' }, h('span', { class: 'card-label' }, pack.title), h('span', { class: 'card-count' }, 'soon')));
  }
  const c = cardStatus(progress, pack);
  const grew = shine.grew.has(pack.id);
  return h('li', { class: 'card-item' },
    h('div', { class: 'card-row', dataset: { row: pack.id } },
      h('button', {
        type: 'button', class: `card-name st-${c.status}${shine.cards.has(pack.id) ? ' is-shining' : ''}`, dataset: { card: pack.id },
        'aria-label': `${pack.title}: ${countText(c)} levels, ${STATUS_WORDS[c.status]}${grew ? '. New levels added!' : ''}`,
      },
      icon(c.status),
      h('span', { class: 'card-label' }, pack.title),
      h('span', { class: 'card-count' }, countText(c))),
      h('button', {
        type: 'button', class: `card-chev st-${c.status}`, dataset: { chev: pack.id }, 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': `pop-${pack.id}`,
        'aria-label': `${pack.title}: show its levels`,
      }, icon('chevron', 'chev-icon'))),
    grew ? h('span', { class: 'new-levels' }, 'New levels added!') : null,
    levelPopup(progress, pack, shine.levels[pack.id], grew));
}

// The footer's "Find my level": the section's placement quiz, to take, to pick up where it was left, or to see its results.
function findMyLevel(section, diag) {
  const long = diag.status === 'done' ? `See my ${section.title} diagnostic results`
    : diag.status === 'partial' ? `Continue the ${section.title} diagnostic (${diag.index} of ${diag.total} done)`
      : `Take the ${section.title} diagnostic to find your levels`;
  const more = diag.status === 'done' ? 'see results' : diag.status === 'partial' ? `${diag.index} of ${diag.total} done` : null;
  return h('button', { type: 'button', class: `btn foot-btn foot-quiz${diag.status === 'done' ? ' is-done' : ''}`, 'data-home': 'diagnostic', 'data-section': section.id, 'aria-label': `Find my level: ${long}` },
    'Find my level', more ? h('span', { class: 'foot-more' }, ` · ${more}`) : null);
}

// The footer's "Timed challenges": a small list of the section's challenges, each with its best score on this device.
function timedChallenges(section, ids, bests) {
  const popId = `chal-${section.id}`;
  return h('span', { class: 'foot-chal' },
    h('button', { type: 'button', class: 'btn foot-btn foot-chal-btn', dataset: { chal: section.id }, 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': popId }, '⏱ Timed challenges'),
    h('div', { class: 'lv-pop chal-pop', id: popId, role: 'menu', 'aria-label': `${section.title} timed challenges`, hidden: true, dataset: { pop: popId } },
      h('div', { class: 'pop-head', 'aria-hidden': 'true' }, h('span', { class: 'pop-title' }, 'Timed challenges')),
      h('ul', { class: 'pop-list', role: 'none' }, ...ids.map((id) => h('li', { role: 'none' },
        h('button', { type: 'button', role: 'menuitem', tabindex: '-1', class: 'pop-level pop-chal fluency-btn', dataset: { fluency: id }, 'aria-label': `${challengeById(id).title} fluency challenge${bests[id] ? `, best ${bests[id]}` : ''}` },
          h('span', { class: 'pop-mark', 'aria-hidden': 'true' }, '⏱'),
          h('span', { class: 'pop-name' }, challengeById(id).title),
          bests[id] ? h('span', { class: 'pop-best' }, `best ${bests[id]}`) : null))))));
}

function sectionPanel(sec, packs, progress, bests, diag, shine) {
  const mine = sec.packs.map((id) => packs.find((p) => p.id === id)).filter(Boolean);
  const st = sectionStatus(progress, sec, packs);
  const chal = SECTION_CHALLENGES[sec.id] ?? [];
  return h('section', { class: `section-panel sec-${sec.id}${st.status === 'gold' ? ' is-gold' : ''}${shine.sections.has(sec.id) ? ' is-shining' : ''}`, 'data-section': sec.id, 'aria-label': `${sec.title}${sec.grade ? `, ${sec.grade}` : ''}` },
    h('div', { class: 'section-head' },
      h('h2', { class: 'section-title' }, sec.title),
      sec.grade ? h('span', { class: 'section-grade' }, sec.grade) : null,
      h('span', { class: 'section-blurb' }, sec.blurb),
      h('span', { class: `section-status${st.status === 'gold' ? ' st-gold' : ''}` }, st.status === 'gold' ? icon('gold') : null, sectionText(st))),
    h('ul', { class: 'card-list', 'aria-label': `${sec.title} cards` }, ...mine.map((p) => cardName(progress, p, shine))),
    diag || chal.length ? h('div', { class: 'section-foot' }, diag ? findMyLevel(sec, diag) : null, chal.length ? timedChallenges(sec, chal, bests) : null) : null);
}

// One card on its own: its level set, big (Build X: what a card name opens).
function cardView(card, packs, sections, progress, shine) {
  const pack = packs.find((p) => p.id === card);
  const sec = sections.find((s) => s.packs.includes(card));
  return h('section', { class: `card-view sec-${sec?.id ?? 'none'}`, 'aria-label': pack.title },
    h('div', { class: 'card-view-bar' },
      h('button', { type: 'button', class: 'btn card-back', 'data-back': '1' }, '← All sections'),
      sec ? h('span', { class: 'card-crumb' }, sec.title, sec.grade ? ` · ${sec.grade}` : '') : null),
    h('div', { class: `pack-grid packs-1 sec-${sec?.id ?? 'none'}` }, packCard(progress, pack, { shine: shine.levels[pack.id], grew: shine.grew.has(pack.id) })));
}

// ---------- Rendering, and what the menu remembers between redraws ----------

const NO_SHINE = () => ({ cards: new Set(), levels: {}, sections: new Set(), grew: new Set() });
let view = { card: null };        // the card view open, if any (only while the home screen is up: a level or a reload starts at the panels)
let pending = NO_SHINE();          // what still shines: each thing shines once, the first time it is drawn
let last = null;                   // the last call, to redraw for the card view and back
export const HOVER_DELAY = 250;    // resting on a card name this long (ms) opens its popup
const LEAVE_GRACE = 200;           // the pointer may cross the small gap between a name and its popup in this long (ms)

// What has been drawn no longer shines on the next draw (it shone once).
function consume(drawn) {
  if (drawn === 'menu') { pending.cards = new Set(); pending.sections = new Set(); }
  if (drawn === 'menu' || drawn === 'card') {
    for (const el of last.root.querySelectorAll('.dot.is-shining, .level-btn.is-shining, .pop-level.is-shining')) {
      const id = el.dataset.pack ?? el.closest('.pack-card')?.querySelector('[data-pack]')?.dataset.pack;
      if (id) delete pending.levels[id];
    }
  }
  pending.grew = new Set();
}

export function renderPackMap(root, progress, packs, opts = {}) {
  const {
    onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount, onTestOut, sections = [],
    account = { state: 'off' }, diags = {}, bests = {}, note, shine, keepView = false, openCard: cardToOpen = null,
  } = opts;
  if (!keepView) view = { card: null };
  if (cardToOpen) view = { card: cardToOpen };                      // (after a test-out passed: the card, with its levels in silver)
  canTry = opts.canTry ?? (() => false);
  if (shine) pending = { cards: new Set(shine.cards), levels: { ...shine.levels }, sections: new Set(shine.sections), grew: new Set(shine.grew) };
  last = { root, progress, packs, opts: { ...opts, shine: null, keepView: true, openCard: null } };
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
    h('p', { class: `home-note${opts.noteWarm ? ' is-warm' : ''}`, role: 'status', hidden: !note }, note ?? ''),
    installBar(h),
    card ? cardView(card, packs, sections, progress, pending)
      : h('nav', { class: 'landing', 'aria-label': 'Sections' }, ...sections.map((sec) => sectionPanel(sec, packs, progress, bests, diags[sec.id], pending))),
  ].filter(Boolean));
  consume(card ? 'card' : 'menu');
  bindMenu(root, { onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount, onTestOut });
}

const hoverDevice = () => matchMedia('(hover: hover)').matches;

// ---------- The popups: where one goes, opening, closing, the keyboard ----------

const GAP = 8;          // between a name and its popup, and from the window's edge

// Beside the anchor (the card's row: its name and chevron), on the right; on the left when the right has no room; under it when neither
// side has room (a narrow window). Kept inside the window; a popup taller than the window scrolls inside itself.
export function placePopup(anchor, pop, win = { w: window.innerWidth, h: window.innerHeight }) {
  pop.style.maxHeight = `${win.h - 2 * GAP}px`;
  const a = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  const ht = Math.min(pop.offsetHeight, win.h - 2 * GAP);
  let side = 'right';
  let left = a.right + GAP;
  let top = a.top - 6;
  if (left + w > win.w - GAP) {
    if (a.left - GAP - w >= GAP) { side = 'left'; left = a.left - GAP - w; }
    else { side = 'below'; left = Math.min(Math.max(GAP, a.left), win.w - GAP - w); top = a.bottom + 6; }
  }
  if (side === 'below' && top + ht > win.h - GAP && a.top - 6 - ht >= GAP) { side = 'above'; top = a.top - 6 - ht; }
  top = Math.max(GAP, Math.min(top, win.h - GAP - ht));
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
  pop.dataset.side = side;
  return side;
}

function bindMenu(root, { onPlay, onSaveCode, onEnterCode, onDiagnostic, onFluency, onAccount, onTestOut }) {
  let openPop = null;        // { pop, anchor, opener, by }
  let hoverTimer = null;
  let leaveTimer = null;

  const anchorOf = (pop) => {
    const id = pop.dataset.pop;
    return root.querySelector(`.card-row[data-row="${id}"]`) ?? root.querySelector(`[data-chal="${id.replace(/^chal-/, '')}"]`);
  };
  const openerOf = (pop) => root.querySelector(`[aria-controls="${pop.id}"]`);
  function close({ focus = false } = {}) {
    clearTimeout(hoverTimer); clearTimeout(leaveTimer);
    if (!openPop) return;
    const { pop, opener } = openPop;
    pop.hidden = true;
    pop.querySelectorAll('.is-tipping').forEach((e) => e.classList.remove('is-tipping'));
    opener?.setAttribute('aria-expanded', 'false');
    openPop = null;
    if (focus) opener?.focus({ preventScroll: true });
  }
  function open(pop, by) {
    if (openPop?.pop === pop) { openPop.by = by === 'pointer' ? openPop.by : by; return; }
    close();
    const anchor = anchorOf(pop);
    const opener = openerOf(pop);
    pop.hidden = false;
    placePopup(anchor, pop);
    opener?.setAttribute('aria-expanded', 'true');
    openPop = { pop, anchor, opener, by };
    if (by === 'keys') {
      const items = [...pop.querySelectorAll('[role="menuitem"]')];
      (pop.querySelector('.pop-level.is-current') ?? items[0])?.focus({ preventScroll: true });
    }
  }
  const items = () => [...(openPop?.pop.querySelectorAll('[role="menuitem"]') ?? [])];

  for (const row of root.querySelectorAll('.card-row')) {
    const pop = root.querySelector(`#pop-${row.dataset.row}`);
    // pointing: resting on the name (or its chevron) for a moment opens its popup; a quick pass on the way to another name does not
    row.addEventListener('mouseenter', () => {
      if (!hoverDevice()) return;
      clearTimeout(leaveTimer); clearTimeout(hoverTimer);
      if (openPop?.pop === pop) return;
      hoverTimer = setTimeout(() => open(pop, 'pointer'), HOVER_DELAY);
    });
    row.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); scheduleLeave(); });
  }
  for (const pop of root.querySelectorAll('.lv-pop')) {
    pop.addEventListener('mouseenter', () => clearTimeout(leaveTimer));
    pop.addEventListener('mouseleave', () => scheduleLeave());
    // the arrows move between its rows, Home and End to the ends; Escape closes it (and goes back to what opened it); Tab leaves it
    pop.addEventListener('keydown', (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      const go = (j) => { e.preventDefault(); list[(j + list.length) % list.length]?.focus({ preventScroll: true }); };
      if (e.key === 'ArrowDown') go(i + 1);
      else if (e.key === 'ArrowUp') go(i - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(list.length - 1);
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close({ focus: true }); }
      else if (e.key === 'Tab') { const opener = openPop?.opener; close(); if (opener) { e.preventDefault(); moveFocusFrom(opener, e.shiftKey ? -1 : 1); } }
    });
  }
  // the pointer has left a name or its popup: close it, unless it arrives in the other (or another name takes over) in a moment
  function scheduleLeave() {
    if (!openPop || openPop.by !== 'pointer' || !hoverDevice()) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (!openPop || openPop.by !== 'pointer') return;
      if (openPop.anchor.matches(':hover') || openPop.pop.matches(':hover')) return;
      close();
    }, LEAVE_GRACE);
  }
  // Tab from inside a popup goes on from what opened it, as if the popup were not there
  function moveFocusFrom(el, dir) {
    const all = [...root.querySelectorAll('button:not([disabled]), [href], input, select, textarea')].filter((x) => !x.closest('.lv-pop') && x.offsetParent !== null);
    const i = all.indexOf(el);
    all[i + dir]?.focus();
  }
  // a chevron (or Timed challenges): a click, a tap, Enter or Space opens its popup, a second one closes it; the arrow keys open it too
  for (const btn of root.querySelectorAll('[aria-haspopup="menu"]')) {
    const pop = root.querySelector(`#${btn.getAttribute('aria-controls')}`);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openPop?.pop === pop && openPop.by !== 'pointer') { close({ focus: e.detail === 0 }); return; }
      if (openPop?.pop === pop) { openPop.by = e.detail === 0 ? 'keys' : 'click'; if (e.detail === 0) open(pop, 'keys'); return; }
      open(pop, e.detail === 0 ? 'keys' : 'click');
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); close(); open(pop, 'keys'); if (e.key === 'ArrowUp') items().at(-1)?.focus(); }
    });
  }
  // a locked row: a click, a tap or Enter shows its note; on a Solve it card it asks to test out (Build Z)
  for (const row of root.querySelectorAll('.pop-level[data-locked]')) {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      if (row.dataset.tryPack && onTestOut) { const { tryPack, tryLevel } = row.dataset; close(); onTestOut(tryPack, Number(tryLevel)); return; }
      row.classList.add('is-tipping');
    });
    row.addEventListener('blur', () => row.classList.remove('is-tipping'));
  }
  // the page scrolls or the window changes size: the popup follows its name
  const follow = () => { if (openPop && root.isConnected) placePopup(openPop.anchor, openPop.pop); };
  window.removeEventListener('scroll', root._follow ?? follow);
  window.removeEventListener('resize', root._follow ?? follow);
  root._follow = follow;
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow);
  root._closePop = close;

  if (!root.dataset.menuBound) {
    root.dataset.menuBound = '1';
    // a tap or click outside an open popup closes it
    document.addEventListener('click', (e) => { if (!e.target.closest?.('.lv-pop, [aria-haspopup="menu"]')) root._closePop?.(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (root.querySelector('.lv-pop:not([hidden])')) { root._closePop?.({ focus: root.querySelector('.lv-pop:not([hidden])').contains(document.activeElement) }); return; }
      if (root.querySelector('.card-view') && !document.querySelector('dialog[open]')) goBack(root);
    });
    // the shine stops at any key or click (not in a popup still closed: it shines when it opens)
    const stop = () => root.querySelectorAll('.is-shining').forEach((el) => { if (!el.closest('.lv-pop[hidden]')) el.classList.remove('is-shining'); });
    document.addEventListener('keydown', stop, true);
    document.addEventListener('pointerdown', stop, true);
  }

  root.onclick = (e) => {
    const t = e.target.closest('button[data-try-pack]');
    if (t && onTestOut) { root._closePop?.(); return onTestOut(t.dataset.tryPack, Number(t.dataset.tryLevel)); }
    const b = e.target.closest('button[data-level]');
    if (b && !b.disabled) { root._closePop?.(); return onPlay(b.dataset.pack, Number(b.dataset.level)); }
    const f = e.target.closest('button[data-fluency]');
    if (f) { root._closePop?.(); return onFluency(f.dataset.fluency); }
    const c = e.target.closest('button[data-card]');
    if (c) { root._closePop?.(); return openCard(root, c.dataset.card); }
    if (e.target.closest('[data-back]')) return goBack(root);
    if (e.target.closest('.home-title')) { root._closePop?.(); if (root.querySelector('.card-view')) goBack(root); return; }
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
