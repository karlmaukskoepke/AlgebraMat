// The Divide it screen (SPEC-DIVIDE-IT.md rev 2.1) on the shared Solve it loop, in the light design (Build D, 2026-10-18), laid out
// like Add to both sides: the work on the left (the equation, each earlier move folded to one row, the current move's work), the
// checking space on the right (the substitution; the group diagram while the counters are up), the fractions row while the move is
// chosen, x = [ ] with the one green button beside it, Undo and the quiet help in the corners, and the narrow moves panel with its
// collapsed lights. No banner: what the card says is a pop-up (view/spotlight.js); the line is kept for screen readers only.

import { html } from './addBothMat.js';
import { stackRows, substBlock, forwardButton, srLine, notePopup, sideTerms, FORCED_TEXT, FIRST_TEXT, placeText } from './solveScreen.js';
import { equationRow } from './lightScreen.js';
import { fracOpen, canPreview, fracOf } from '../engine/divideBlank.js';
import { groupDiagram } from './groupDiagram.js';
import { divideFeedbackText } from './divideFeedback.js';
import { narrowPanel } from './narrowPanel.js';
import { solve, xAlone, coefOf, pileSize, DEAL_ROUND_LEVEL, DIVIDE_SPOT } from '../engine/divideMoves.js';
import { spotOf } from '../engine/spotlight.js';
import { spotlightLayer, findSolveTarget } from './spotlight.js';
import { FRACTIONS } from '../engine/divide.js';
import { fractionText } from '../engine/solveTerms.js';
import { MINUS } from '../engine/expr.js';
import { firstOpen } from './visit.js';

const btn = (label, action, cls, attrs = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...attrs });
const valid = (t) => /^-?\d+$/.test(t ?? '');

// The move's row under the newest equation (Build D, Part 4): its preview while the move is hovered (dashed, grey), then the blank, a
// fraction of both sides (top and bottom; "1/5" typed), the right side's fraction mirroring the left's.
function fracBox(s, mirror) {
  const fb = s.fb ?? { num: '', den: '', part: 'num' };
  const open = fracOpen(s);
  const part = (p) => {
    const text = fb[p];
    const focus = open && !mirror && fb.part === p;
    return html(mirror ? 'span' : 'button', `lx-box dv-fracpart${focus ? ' is-focus' : ''}${text ? '' : ' is-empty'}${focus && !text ? ' is-blink' : ''}${mirror ? ' is-mirror' : ''}`, [text || ' '],
      mirror ? { 'aria-hidden': 'true' } : { type: 'button', 'data-action': 'focus', 'data-target': p, 'data-lx-field': '1', 'aria-label': p === 'num' ? 'The top of the fraction' : 'The bottom of the fraction', ...(open ? {} : { tabindex: '-1' }) });
  };
  return html('span', `dv-fracblank${mirror ? ' is-mirror' : ''}`, [part('num'), html('span', 'dv-fracbar'), part('den')]);
}
function moveRow(s) {
  const open = fracOpen(s);
  const preview = !open && canPreview(s) && s.ui?.preview;
  const slot = html('div', `lx-ghost dv-ghost${open ? ' is-chosen' : preview ? ' is-preview' : ''}`);
  if (!open && !preview) return slot;
  const side = (terms, mirror) => [fracBox(s, mirror), html('span', 'lb-plus', ['(']), ...sideTerms(terms, s), html('span', 'lb-plus', [')'])];
  slot.append(equationRow(side(s.board.left, false), side(s.board.right, true), 'lx-ghosteq'));
  if (!open) slot.setAttribute('aria-hidden', 'true');
  return slot;
}

// After a fraction that did not split, the hint shows the boxes and the counters, the boxes bracketed, and the fractions to choose from:
// the ones already tried are crossed off and greyed (Build D, Part 4).
function fractionChoices(s) {
  const b = s.board;
  const size = pileSize(b);
  const wrap = html('div', 'dv-choose');
  const [want, ask] = divideFeedbackText({ key: 'dWhichFraction', params: { boxes: coefOf(b) } }).split('\n');
  wrap.append(groupDiagram({ n: 1, boxes: coefOf(b), size, neg: b.right[0].kind === 'num' && b.right[0].v < 0, groups: null, pile: size, kept: null, tap: null, bracketBoxes: true }),
    html('p', 'spot-text', [want]), html('p', 'spot-text', [ask]));
  const row = html('div', 'dv-choices');
  for (const n of FRACTIONS) {
    const tried = s.tried.includes(n);
    const btn = html('button', `btn dv-choice${tried ? ' is-tried' : ''}`, [fractionText(n)], { type: 'button', 'data-action': 'take', 'data-n': n, 'data-from': 'list', 'aria-label': `${fractionText(n)}${tried ? ', tried already' : ''}` });
    btn.disabled = tried;
    row.append(btn);
  }
  wrap.append(row);
  return wrap;
}

// ---------- the group diagram, in the checking space while the counters are up ----------

function diagramOptions(s) {
  if (s.diag) {
    const d = s.diag;
    const got = d.groups ? d.groups.reduce((a, b) => a + b, 0) : 0;
    const even = d.groups && got === d.size && d.groups.every((c) => c === d.groups[0]);
    return {
      n: d.n, boxes: 0, size: d.size, neg: d.neg, groups: d.groups, pile: d.groups ? d.size - got : 0, kept: d.kept,
      tap: d.groups && d.kept === null ? (even ? 'keep' : 'deal') : null, dealt: got, even, round: d.groups && d.kept === null && got < d.size,
    };
  }
  const b = s.board;
  const size = pileSize(b);
  const neg = b.right[0].kind === 'num' && b.right[0].v < 0;
  if (s.deal) {
    const d = s.deal;
    const got = d.groups.reduce((a, c) => a + c, 0);
    const even = got === size && d.groups.every((c) => c === d.groups[0]);
    return { n: d.n, boxes: coefOf(b), size, neg, groups: d.groups, pile: size - got, kept: null, tap: even ? 'keep' : 'deal', dealt: got, even, round: got < size };
  }
  return { n: 1, boxes: coefOf(b), size, neg, groups: null, pile: size, kept: null, tap: null, outline: s.hint?.kind === 'coef' || s.scaffold, dealt: 0, even: false, round: false };
}

function diagramBlock(s) {
  const area = html('div', 'sv-diagram');
  // what the student made stays after the fraction is applied, the kept group marked, until Next folds the move (loop §6)
  if (s.pic && !s.scaffold) {
    const pc = s.pic;
    area.append(groupDiagram({ n: pc.n, boxes: pc.boxes, size: pc.size, neg: pc.neg, groups: pc.groups, pile: 0, kept: pc.kept, tap: null, caption: `You kept 1 of the ${pc.n} groups.` }));
    return area;
  }
  if (!s.scaffold) return null;
  const o = diagramOptions(s);
  // the groups' sizes are printed only while they are uneven; once they are even, the size of a group is what the student finds
  const readout = !o.groups || s.diag?.guided ? '' : (o.even || s.diag ? `${o.dealt} of ${o.size} shared` : `${o.dealt} of ${o.size} shared · groups hold ${o.groups.join(', ')}`);
  area.append(groupDiagram({ ...o, caption: readout }));
  const row = html('div', 'dv-actions');
  if (o.groups && o.even && o.tap === 'keep') row.append(html('p', 'dv-hint', ['Tap a group to keep it.']));
  else if (o.round && s.level >= DEAL_ROUND_LEVEL && o.size - o.dealt >= o.n) row.append(html('button', 'btn', ['Deal a round'], { type: 'button', 'data-action': 'dealRound' }));
  area.append(row);
  return area;
}

// ---------- the one green button ----------

export const introOpen = (s) => solve.moveOwed(s) && !s.introSeen;
const firstUp = (s) => firstOpen() && !s.mustMove && s.rows.length === 1 && s.history.length === 0 && !s.sub && !s.entry && s.stage === 'moves' && !s.scaffold;

export function forwardOf(s) {
  const sp = spotOf(s, DIVIDE_SPOT);
  if (s.stage === 'done') return { label: 'Next problem', action: 'next', enabled: true };
  if (sp?.kind === 'error') return { label: 'Check', action: 'check', enabled: false };
  if (introOpen(s)) return { label: 'Next', action: 'introNext', enabled: true };
  if (sp?.kind === 'hint') {
    const f = forwardCore(s);
    return f.enabled ? f : { label: 'Got it', action: 'spotDismiss', enabled: true };
  }
  return forwardCore(s);
}
function forwardCore(s) {
  if (fracOpen(s)) return { label: 'Go', action: 'go', enabled: Boolean(fracOf(s.fb)) };
  if (s.sub?.placing) return { label: 'Next', action: 'nextLine', enabled: false };
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) return { label: 'Next', action: 'nextLine', enabled: true };
  if (!s.sub && (s.unfolded || s.pic)) return { label: 'Next', action: 'foldNext', enabled: true };
  return { label: 'Check', action: 'check', enabled: solve.answerLive(s) && valid(s.entry) };
}

// x = [ ] and the green button. While the value waits to be placed on x, the field is the chip that is dragged.
function answerRow(s) {
  const live = solve.answerLive(s);
  const placing = Boolean(s.sub?.placing);
  const text = s.sub && !live ? String(s.sub.typed) : s.entry;
  const last = live && (xAlone(s.board) || Boolean(s.ui?.fieldCursor));   // x = blinks once clicked, and at the last step: x alone
  const typed = html('button', `ab-typed lb-typed lx-field${text ? '' : ' is-empty'}${last ? ' is-focus' : ''}${last && !text ? ' is-blink' : ''}${placing ? ' is-chip' : ''}${live || placing ? '' : ' is-off'}`, [text ? text.replace('-', MINUS) : ' '], {
    type: 'button', 'data-fk': 'answer', 'data-lx-field': '1',
    ...(placing ? { 'data-chip': '1', 'data-lx-field': '1', 'aria-label': `Your value ${text}: drag it onto x` } : { 'data-action': 'focus', 'data-target': 'answer', 'aria-label': 'Your answer for x' }),
  });
  typed.disabled = !live && !placing;
  const f = forwardButton(forwardOf(s));
  if (!f.disabled && ['next', 'nextLine', 'foldNext', 'introNext'].includes(f.dataset.action)) f.dataset.lxFocus = '1';
  return html('div', 'lb-answerrow lx-answer', [html('strong', `lb-prompt${live || placing ? '' : ' is-off'}`, ['x =']), typed, f]);
}

// The corners: Undo; Start over and the quiet help (Teach me after a second error; I'm stuck flashes after 10 seconds idle).
function corners(s) {
  const done = s.stage === 'done';
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= solve.subTotal(s.sub);
  const undo = btn('↶ Undo', 'undo', 'btn lx-corner lx-undo btn-undo', { 'data-key': 'u', 'data-fk': 'undo' });
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (s.fail || wrongGuess)) undo.classList.add('is-target');
  const over = btn('Start over', 'startOver', 'btn lx-corner lx-startover', { 'data-fk': 'startOver' });
  over.disabled = done || !solve.startOverOk(s);
  const off = done || !solve.helpOk(s);
  const stuck = btn('I’m stuck', 'stuck', 'btn lx-corner lx-help', { 'data-key': 's', 'data-fk': 'stuck' });
  stuck.disabled = off;
  const help = [stuck];
  if ((s.errors ?? 0) >= 2 || s.taught > 0) {
    const teach = btn('Teach me', 'teach', `btn lx-corner lx-help${s.taught > 0 ? '' : ' is-new'}`, { 'data-key': 't', 'data-fk': 'teach' });
    teach.disabled = off;
    help.push(teach);
  }
  return html('div', 'lx-corners', [undo, html('div', 'lx-cornerright', [over, ...help])]);
}

// The narrow panel: Multiply (Take a fraction) is the live move; its lights are Smaller numbers and One box.
function panel(s) {
  const mapLight = (v) => (v === 'neutral' ? 'off' : v);
  const owed = solve.moveOwed(s) && !s.menu && !s.sub && !xAlone(s.board) && !s.scaffold;
  const el = narrowPanel({ multiply: { live: true, move: 'fraction', label: 'Multiply both sides by a fraction', pressed: s.menu === 'fraction', ring: owed, preview: canPreview(s) && s.ui?.preview } }, {
    disabled: s.stage === 'done' || Boolean(s.sub),
    lights: { smaller: mapLight(s.lights.smaller), onebox: mapLight(s.lights.onebox), solved: xAlone(s.board) ? 'green' : 'off' },
  });
  if (solve.moveOwed(s)) el.classList.add('is-owed');
  return el;
}

// ---------- the pop-ups ----------

const SILENT = new Set(['aPlace', 'aFindX', 'aMustMove', 'dPickFraction', 'aPlugIn', 'aPlugCurrent', 'aSolvedBoard', 'dUndone', 'aCorrect', 'aStartedOver',
  'aUndone', 'aSimplerFirst', 'aUndoGuess']);
const NUDGE = {
  dBlankBad: 'answer',
  typeAnswer: 'answer', answerUnreadable: 'answer', aUndoFirst: 'answer', aFinishMoveFirst: 'answer',
  aLater: 'panel', aNotNeeded: 'panel', dForced: 'fractions',
};

function popups(s, wrap) {
  const sp = spotOf(s, DIVIDE_SPOT);
  const o = { root: wrap, find: (root, target) => findSolveTarget(root, target, s), undo: '.lx-undo', moveSel: (m) => `[data-move="${m}"]`, work: '.lb-main' };
  if (sp) { wrap.append(spotlightLayer(sp.choose ? { ...sp, place: 'beside' } : sp, { ...o, text: sp.choose ? '' : divideFeedbackText(s.feedback), extra: sp.choose ? fractionChoices(s) : null })); return; }
  if (introOpen(s)) { wrap.append(spotlightLayer({ kind: 'intro', lit: ['newest', 'panel', 'forward'] }, { ...o, text: FORCED_TEXT })); return; }
  // checking a value: everything greys out but the equation being checked and the checking space
  if (s.sub && s.sub.step < solve.subTotal(s.sub)) {
    wrap.append(spotlightLayer({ kind: 'intro', lit: ['plugrow', 'check', s.sub.placing ? 'answer' : 'forward'] }, { ...o, text: s.sub.placing ? placeText(s.sub.typed) : null }));
    return;
  }
  const note = notePopup(s, { silent: SILENT, nudge: NUDGE, text: divideFeedbackText, scaffold: s.scaffold || s.pic ? 'board' : null });
  if (note) { wrap.append(spotlightLayer(note.spot, { ...o, text: note.text })); return; }
  if (firstUp(s)) wrap.append(spotlightLayer({ kind: 'note', place: 'below' }, { ...o, text: FIRST_TEXT }));
}

export function renderDivideScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard dv-light ui-light');
  const sp = spotOf(s, DIVIDE_SPOT);
  wrap.append(srLine(divideFeedbackText(sp ? { key: DIVIDE_SPOT.prompt(s), params: {} } : s.feedback)));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  const check = html('div', 'sv-check', s.sub ? [substBlock(s, solve)] : [diagramBlock(s)].filter(Boolean));
  main.append(html('div', `sv-work${s.sub ? ' is-checking' : ''}${s.scaffold || s.pic ? ' has-diagram' : ''}`, [html('div', 'sv-solve', [html('div', 'lb-stack', [html('div', 'lb-rows', [...stackRows(s), moveRow(s)])])]), check]));
  main.append(answerRow(s), corners(s));
  body.append(main, panel(s));
  wrap.append(body);
  popups(s, wrap);
  return wrap;
}
