// The diagnostic screens: a problem at a time (typed, nothing said about right or wrong), and the readout with a
// recommended level for each card. Built once; `render(...)` updates it.

import { h, buildPad, bindKeys, shown } from './quiz.js';
import { itemText, itemPad, itemLead, STANDING, packTitle } from '../engine/diagnostic.js';
import { packById, sectionById } from '../packs/index.js';

export function createDiagnosticView(root, { onAction, onStop, onPlay, onMap, onRetake }) {
  let items = [];
  let state = null;
  let padKind = 'integer';
  let pad = null;

  const stop = h('button', { type: 'button', class: 'btn btn-quiet', dataset: { go: 'stop' } }, '← Stop for now');
  const title = h('div', { class: 'title' }, 'DIAGNOSTIC');
  const count = h('div', { class: 'quiz-stats' });
  const top = h('header', { class: 'topbar quiz-top' }, stop, title, count);
  const dots = h('div', { class: 'diag-dots', 'aria-hidden': 'true' });

  const cardName = h('div', { class: 'quiz-tier' });
  const problem = h('div', { class: 'quiz-problem' });
  const answer = h('div', { class: 'quiz-answer' });
  const asking = h('div', { class: 'quiz-play' }, cardName, problem, answer);
  const results = h('div', { class: 'diag-results' });
  const stage = h('div', { class: 'quiz-stage' }, asking, results);

  const skip = h('button', { type: 'button', class: 'btn', dataset: { go: 'skip' } }, 'I don’t know');
  const next = h('button', { type: 'button', class: 'btn btn-primary', dataset: { go: 'next' } }, 'Next →');
  const padHost = h('div', { class: 'pad-host' });
  const footer = h('footer', { class: 'palette quiz-palette' }, h('div', { class: 'palette-row' }, skip, next), padHost);
  root.replaceChildren(top, dots, stage, footer);
  root.classList.add('is-quiz');

  root.onclick = (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (go === 'stop') return onStop();
    if (go === 'skip') return onAction({ type: 'skip' });
    if (go === 'next') return onAction({ type: 'next' });
    if (go === 'map') return onMap();
    if (go === 'retake') return onRetake();
    const play = e.target.closest('[data-play]');
    if (play) onPlay(play.dataset.pack, Number(play.dataset.level));
  };
  const unbind = bindKeys(() => padKind, (a) => onAction(a.type === 'enter' ? { type: 'next' } : a));

  function showResults(rows, openedNote) {
    results.replaceChildren(
      h('h2', {}, 'Your diagnostic'),
      h('p', { class: 'quiz-blurb' }, openedNote),
      ...rows.map((r) => {
        const pack = packById(r.pack);
        return h('article', { class: `diag-row is-${r.standing}` },
          h('div', { class: 'diag-row-head' },
            h('h3', {}, packTitle(r.pack)),
            h('span', { class: 'diag-chip' }, STANDING[r.standing])),
          h('ul', { class: 'diag-problems' }, ...r.problems.map((p) => h('li', { class: p.right ? 'is-right' : 'is-wrong' },
            h('span', { class: 'diag-mark', 'aria-label': p.right ? 'right' : 'not right' }, p.right ? '✓' : '✗'),
            h('span', { class: 'diag-text' }, p.lead === '=' ? `${p.text} = ${p.answer}` : `${p.text}, ${p.lead} ${p.answer}`),
            p.right ? null : h('span', { class: 'diag-typed' }, p.skipped ? 'skipped' : `you typed ${shown(p.typed)}`)))),
          h('button', { type: 'button', class: 'btn diag-go', dataset: { play: '1', pack: r.pack, level: String(r.rec) } },
            `Start at Level ${r.rec}: ${pack.levelNames[r.rec - 1]}`));
      }),
      h('div', { class: 'quiz-actions' },
        h('button', { type: 'button', class: 'btn btn-primary', dataset: { go: 'map' } }, 'Back to the cards'),
        h('button', { type: 'button', class: 'btn', dataset: { go: 'retake' } }, 'Retake the diagnostic')));
  }

  return {
    // state: the diagnostic's state; items: its problems. With a readout, shows the results instead.
    render(s, its, readoutRows = null, openedNote = '') {
      state = s;
      items = its;
      const taking = !readoutRows;
      asking.hidden = !taking;
      results.hidden = taking;
      skip.hidden = next.hidden = !taking;
      footer.hidden = !taking;
      const name = sectionById(s.section)?.title.toUpperCase();
      title.textContent = `DIAGNOSTIC${name ? ` · ${name}` : ''}${taking ? '' : ' · RESULTS'}`;
      if (dots.children.length !== items.length) dots.replaceChildren(...items.map(() => h('span', { class: 'dot' })));
      stop.textContent = taking ? '← Stop for now' : '← Pack map';
      stop.dataset.go = taking ? 'stop' : 'map';
      dots.hidden = !taking;
      if (!taking) {
        count.textContent = '';
        padHost.replaceChildren();
        pad = null;
        showResults(readoutRows, openedNote);
        return;
      }
      const item = items[s.index];
      count.textContent = `${s.index + 1} of ${items.length}`;
      dots.querySelectorAll('.dot').forEach((d, i) => { d.classList.toggle('done', i < s.index); d.classList.toggle('current', i === s.index); });
      const kind = itemPad(item);
      if (!pad || kind !== padKind) {
        padKind = kind;
        pad = buildPad((a) => onAction(a), kind);
        padHost.replaceChildren(pad.el);
      }
      cardName.textContent = packTitle(item.pack);
      problem.textContent = itemText(item);
      answer.textContent = '';
      answer.append(h('span', { class: 'dist-eq' }, itemLead(item)), h('span', { class: `quiz-typed${s.entry ? '' : ' is-empty'}` }, shown(s.entry) || '?'));
      next.textContent = s.index === items.length - 1 ? 'Finish ✓' : 'Next →';
      next.disabled = s.entry === '';
    },
    destroy() { unbind(); root.classList.remove('is-quiz'); root.onclick = null; },
  };
}
