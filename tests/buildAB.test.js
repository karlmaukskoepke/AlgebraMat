// @vitest-environment happy-dom
// Build AB (Karl, 2026-11-01): the main menu's level popups and section footers (Parts 3 and 4), drawn with the app's own renderPackMap.
// The pointer, the keyboard, touch and where a popup lands on a real screen are in tests/menuSweep.test.js; here, what is drawn, the rule
// for where a popup goes (placePopup, with a stand-in window), and that no challenge or quiz was lost in the move.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderPackMap, placePopup } from '../src/view/packmap.js';
import { newProgress, completeLevel, placeLevels } from '../src/engine/progress.js';
import { PACKS, SECTIONS, packById, levelNumber, lastLevelOf } from '../src/packs/index.js';
import { CHALLENGES, CARD_CHALLENGES, SECTION_CHALLENGES } from '../src/engine/fluency.js';
import { DIAGNOSTIC_SECTIONS } from '../src/engine/diagnostic.js';

const earn = (p, id, levels) => levels.reduce((q, l) => completeLevel(q, id, l), p);
const none = { status: 'none', index: 0, total: 6 };

function draw(progress, extra = {}) {
  document.body.replaceChildren();
  const root = document.createElement('div');
  root.id = 'home';
  document.body.append(root);
  const calls = [];
  renderPackMap(root, progress, PACKS, {
    sections: SECTIONS,
    diags: Object.fromEntries(DIAGNOSTIC_SECTIONS.map((id) => [id, none])),
    bests: { add: 12 },
    onPlay: (pack, level) => calls.push(['play', pack, level]),
    onDiagnostic: (id) => calls.push(['quiz', id]),
    onFluency: (id) => calls.push(['fluency', id]),
    onAccount: () => {},
    ...extra,
  });
  return { root, calls };
}

describe('Build AB, Part 3: a popup of each card’s levels', () => {
  let progress;
  beforeEach(() => {
    progress = earn(placeLevels(newProgress(PACKS), 'divide-it', 5), 'divide-it', [2, 3]);   // Divide it: 1-2 earned, 3 placed, 4 open, 5 locked
  });

  it('every card name has a chevron and a popup; the name still opens the card', () => {
    const { root } = draw(progress);
    const names = [...root.querySelectorAll('.card-name[data-card]')];
    expect(names.length).toBe(16);
    for (const n of names) {
      const id = n.dataset.card;
      const chev = root.querySelector(`.card-chev[data-chev="${id}"]`);
      expect(chev, id).not.toBeNull();
      expect(chev.getAttribute('aria-haspopup')).toBe('menu');
      expect(chev.getAttribute('aria-expanded')).toBe('false');
      expect(chev.getAttribute('aria-controls')).toBe(`pop-${id}`);
      expect(chev.getAttribute('aria-label')).toBe(`${packById(id).title}: show its levels`);
      const pop = root.querySelector(`#pop-${id}`);
      expect(pop.getAttribute('role')).toBe('menu');
      expect(pop.hidden).toBe(true);
      // Tab order: the name, then its chevron
      expect(n.nextElementSibling).toBe(chev);
      // one row per displayed level, then See why it works where the card has it
      const p = packById(id);
      const rows = [...pop.querySelectorAll('.pop-level')];
      expect(rows.length).toBe(lastLevelOf(p) - (p.firstLevel ?? 1) + 1 + (p.whyLevel ? 1 : 0));
      expect(rows.every((r) => r.tagName === 'BUTTON' && r.getAttribute('role') === 'menuitem' && r.getAttribute('tabindex') === '-1')).toBe(true);
    }
    names[0].click();
    expect(root.querySelector('.card-view .pack-head h2').textContent).toBe('Combine it');
  });

  it('each row: the level’s name, its status (earned, placed with its note, current ringed, locked greyed with its note), and the card’s “3 of 5”', () => {
    const { root } = draw(progress);
    const pop = root.querySelector('#pop-divide-it');
    expect(pop.querySelector('.pop-head').textContent).toBe('Divide it3 of 5');
    const rows = [...pop.querySelectorAll('.pop-level')];
    const p = packById('divide-it');
    expect(rows.map((r) => r.className)).toEqual([
      'pop-level is-earned', 'pop-level is-earned', 'pop-level is-placed', 'pop-level is-none is-current', 'pop-level is-locked', 'pop-level pop-why']);
    expect(rows[0].querySelector('.pop-num').textContent).toBe('Level 1');
    expect(rows[0].querySelector('.pop-name').textContent).toBe(p.levelNames[1]);
    expect(rows[0].getAttribute('aria-label')).toBe(`Level 1, ${p.levelNames[1]}, earned`);
    expect(rows[2].querySelector('.pop-note').textContent).toBe('One problem earns it');
    expect(rows[3].getAttribute('aria-label')).toBe(`Level 4, ${p.levelNames[4]}, the level you are on`);
    expect(rows[4].getAttribute('aria-disabled')).toBe('true');
    expect(rows[4].querySelector('.pop-tip').textContent).toBe('Finish Level 4 to open this.');
    expect(rows[4].querySelector('.pop-name').textContent).toBe(p.levelNames[5]);     // (its name greyed, not hidden)
    expect(rows[5].textContent).toContain('See why it works');
    expect(rows[5].dataset.level).toBe(String(p.whyLevel));
  });

  it('an open row opens its level; a locked row does nothing yet but show its note (built so Build Z can give it an action)', () => {
    const { root, calls } = draw(progress);
    const pop = root.querySelector('#pop-divide-it');
    pop.querySelector('.pop-level[data-level="4"]').click();
    expect(calls).toEqual([['play', 'divide-it', 4]]);
    const locked = pop.querySelector('.pop-level.is-locked');
    expect(locked.dataset.level).toBeUndefined();
    expect(locked.dataset.locked).toBe('6');
    expect(locked.dataset.lockPack).toBe('divide-it');
    locked.click();
    expect(calls.length).toBe(1);
    expect(locked.classList.contains('is-tipping')).toBe(true);
  });

  it('a fresh student: the first level is current, every other is locked with “Finish Level N to open this.”', () => {
    const { root } = draw(newProgress(PACKS));
    for (const id of ['combineit', 'add-both', 'two-step-equations', 'strange-solutions']) {
      const p = packById(id);
      const rows = [...root.querySelectorAll(`#pop-${id} .pop-level:not(.pop-why)`)];
      expect(rows[0].className, id).toBe('pop-level is-none is-current');
      rows.slice(1).forEach((r, i) => {
        expect(r.className).toBe('pop-level is-locked');
        expect(r.querySelector('.pop-tip').textContent).toBe(`Finish Level ${levelNumber(p, (p.firstLevel ?? 1) + i)} to open this.`);
      });
    }
  });

  it('a level that went from placed to earned shines in the popup; a card that grew says “New levels added!” there too', () => {
    const { root } = draw(progress, { shine: { cards: new Set(), levels: { 'divide-it': [2] }, sections: new Set(), grew: new Set(['strange-solutions']) } });
    expect([...root.querySelectorAll('#pop-divide-it .pop-level.is-shining')].map((r) => r.dataset.level)).toEqual(['2']);
    expect(root.querySelector('#pop-strange-solutions .new-levels')?.textContent).toBe('New levels added!');
  });
});

describe('Build AB, Part 3: where a popup goes', () => {
  // a stand-in for an element on screen, at a given place
  const at = (left, top, width, height) => ({ getBoundingClientRect: () => ({ left, top, right: left + width, bottom: top + height, width, height }) });
  const pop = (w, h) => ({ offsetWidth: w, offsetHeight: h, style: {}, dataset: {} });
  const win = { w: 1366, h: 650 };

  it('beside the name, on the right, a little above its top', () => {
    const p = pop(340, 300);
    expect(placePopup(at(720, 300, 260, 40), p, win)).toBe('right');
    expect(p.style.left).toBe('988px');
    expect(p.style.top).toBe('294px');
  });
  it('on the left near the right edge (the last panel)', () => {
    const p = pop(340, 300);
    expect(placePopup(at(1040, 300, 260, 40), p, win)).toBe('left');
    expect(parseInt(p.style.left, 10) + 340).toBeLessThanOrEqual(1040 - 8);
  });
  it('never past the bottom of the window: moved up to fit', () => {
    const p = pop(340, 300);
    placePopup(at(720, 560, 260, 40), p, win);
    expect(parseInt(p.style.top, 10) + 300).toBeLessThanOrEqual(650 - 8);
  });
  it('a popup taller than the window scrolls inside itself', () => {
    const p = pop(340, 900);
    placePopup(at(720, 100, 260, 40), p, win);
    expect(p.style.maxHeight).toBe('634px');
    expect(p.style.top).toBe('8px');
  });
  it('on a narrow window: under the name (above it when there is no room below), inside the window', () => {
    const phone = { w: 390, h: 844 };
    const p = pop(340, 300);
    expect(placePopup(at(16, 200, 358, 40), p, phone)).toBe('below');
    expect(p.style.top).toBe('246px');
    expect(parseInt(p.style.left, 10)).toBeGreaterThanOrEqual(8);
    expect(parseInt(p.style.left, 10) + 340).toBeLessThanOrEqual(390 - 8);
    const q = pop(340, 300);
    expect(placePopup(at(16, 700, 358, 40), q, phone)).toBe('above');
    expect(parseInt(q.style.top, 10) + 300).toBeLessThanOrEqual(700);
  });
});

describe('Build AB, Part 4: each section’s footer', () => {
  it('Find my level on Count it, Build it and Solve it, not on Solve it Plus; the “no placement quiz” line is gone', () => {
    const { root, calls } = draw(newProgress(PACKS));
    const quiz = Object.fromEntries([...root.querySelectorAll('.section-panel')].map((p) => [p.dataset.section, p.querySelector('.section-foot .foot-quiz')?.textContent ?? null]));
    expect(quiz).toEqual({ count: 'Find my level', build: 'Find my level', solve: 'Find my level', 'solve-plus': null });
    expect(root.querySelector('.sec-solve-plus .section-foot')).toBeNull();
    expect(root.textContent).not.toContain('no placement quiz');
    root.querySelector('.sec-solve .foot-quiz').click();
    expect(calls).toEqual([['quiz', 'solve']]);
  });
  it('Find my level says where the quiz was left, or that its results are ready (as the old button did)', () => {
    const { root } = draw(newProgress(PACKS), { diags: { count: { status: 'partial', index: 3, total: 6 }, build: { status: 'done', index: 8, total: 8 }, solve: none } });
    expect(root.querySelector('.sec-count .foot-quiz').textContent).toBe('Find my level · 3 of 6 done');
    expect(root.querySelector('.sec-count .foot-quiz').getAttribute('aria-label')).toBe('Find my level: Continue the Count it diagnostic (3 of 6 done)');
    expect(root.querySelector('.sec-build .foot-quiz').textContent).toBe('Find my level · see results');
    expect(root.querySelector('.sec-solve .foot-quiz').getAttribute('aria-label')).toBe('Find my level: Take the Solve it diagnostic to find your levels');
  });
  it('Timed challenges on Count it only, listing every challenge that was on the home screen before (none lost, none added)', () => {
    const { root, calls } = draw(newProgress(PACKS));
    expect([...root.querySelectorAll('.foot-chal-btn')].map((b) => b.closest('.section-panel').dataset.section)).toEqual(['count']);
    const listed = [...root.querySelectorAll('#chal-count [data-fluency]')].map((b) => b.dataset.fluency);
    expect(listed).toEqual(SECTION_CHALLENGES.count);
    expect(new Set(listed)).toEqual(new Set(Object.values(CARD_CHALLENGES).flat()));
    expect(listed.every((id) => CHALLENGES.some((c) => c.id === id))).toBe(true);
    expect(CHALLENGES.length).toBe(6);
    expect(root.querySelector('#chal-count [data-fluency="add"]').textContent).toContain('best 12');
    root.querySelector('#chal-count [data-fluency="mixed"]').click();
    expect(calls).toEqual([['fluency', 'mixed']]);
  });
  it('the challenges and the quiz are no longer anywhere else on the home screen (the card view has neither)', () => {
    const { root } = draw(newProgress(PACKS));
    root.querySelector('.card-name[data-card="combineit"]').click();
    expect(root.querySelector('.card-view [data-fluency], .card-view .fluency-row, .card-view [data-home="diagnostic"]')).toBeNull();
  });
  it('the section titles are plain headings: nothing expands from them', () => {
    const { root } = draw(newProgress(PACKS));
    expect([...root.querySelectorAll('.section-title')].every((t) => t.tagName === 'H2' && !t.closest('button'))).toBe(true);
    expect(root.querySelector('.section-sheet, [data-expand], .sheet-close')).toBeNull();
  });
});
