// Renders the Mat as inline SVG from a session state (engine/session.js):
// counter zones above their numbers, the problem (Lexend), and the student's
// rewritten line (Kalam) with the answer slot. Taps are reported through
// data-action attributes; the caller dispatches them.

import { MINUS, isSubtraction } from '../engine/expr.js';
import { entryValue } from '../engine/session.js';
import {
  COUNTER_SIZE, COUNTER_PITCH, MAX_PER_ROW, counterPositions, readingPositions,
} from './layout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// The drawing area. It starts at y = 44: nothing is drawn above the zones'
// dashed boxes, and trimming that strip makes everything bigger on short screens.
const VIEW = { top: 44, width: 740, height: 296 };
const COLUMN = { left: 210, op: 350, right: 490, eq: 595, answer: 672 };
const ZONE_BASE_Y = 170;   // center of the bottom counter row
const PROBLEM_Y = 245;     // baseline of the problem line
const REWRITE_Y = 320;     // baseline of the rewritten line

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

const stroke = (x1, y1, x2, y2, cls) => el('line', { x1, y1, x2, y2, class: cls });
const signed = (n, explicitPlus) => (n < 0 ? `${MINUS}${-n}` : explicitPlus ? `+${n}` : `${n}`);

// A counter is a stroked + or − (never a text glyph), with an optional cancel slash.
// fx: justCanceled (draw the slash in), hinted (blink as a hint), ghost (hint outline).
function counter(c, { x, y, zone, index, magenta, selected, shake, tappable, justCanceled, hinted, ghost }) {
  const h = COUNTER_SIZE / 2;
  const s = COUNTER_PITCH / 2 - 6;
  const outer = el('g', {
    transform: `translate(${x} ${y})`,
    'data-action': tappable ? 'counter' : null,
    'data-zone': zone,
    'data-index': index,
  });
  const g = el('g', {
    class: ['counter', magenta && 'is-opposite', c.canceled && 'is-canceled',
      selected && 'is-selected', shake && 'shake', tappable && 'tappable',
      hinted && 'hint-blink', ghost && 'ghost'].filter(Boolean).join(' '),
    'data-sign': c.sign,
  });
  if (!ghost) g.append(el('rect', { class: 'hit', x: -COUNTER_PITCH / 2, y: -COUNTER_PITCH / 2, width: COUNTER_PITCH, height: COUNTER_PITCH }));
  if (selected) g.append(el('circle', { class: 'ring', r: COUNTER_PITCH / 2 - 2 }));
  g.append(stroke(-h, 0, h, 0, 'mark'));
  if (c.sign === '+') g.append(stroke(0, -h, 0, h, 'mark'));
  if (c.canceled) {
    const slash = stroke(-s, s, s, -s, `slash${justCanceled ? ' slash-in' : ''}`);
    slash.setAttribute('pathLength', '1');
    g.append(slash);
  }
  outer.append(g);
  return outer;
}

function zone(s, i, cx, fx) {
  const g = el('g', { class: 'zone' });
  const drawing = s.step === 'draw';
  if (drawing) {
    // The tappable area: room for 3 rows of 4.
    const w = MAX_PER_ROW * COUNTER_PITCH + 16;
    const top = ZONE_BASE_Y - 2.5 * COUNTER_PITCH - 8;
    g.append(el('rect', {
      class: 'zone-area', 'data-action': 'zone', 'data-zone': i,
      x: cx - w / 2, y: top, width: w, height: ZONE_BASE_Y + COUNTER_PITCH / 2 + 4 - top, rx: 12,
    }));
  }
  const counters = s.zones[i];
  const place = s.tidy ? counterPositions : readingPositions;
  const magenta = i === 1 && isSubtraction(s.problem);
  const show = fx.hint?.show ?? {};

  // Draw hint: faint outlines where the right counters would go.
  const ghost = show.ghosts?.[i];
  if (ghost) {
    readingPositions(ghost.count).forEach((p) => {
      g.append(counter({ sign: ghost.sign }, { x: cx + p.x, y: ZONE_BASE_Y + p.y, zone: i, ghost: true }));
    });
  }

  const is = (list, index) => (list ?? []).some((c) => c.zone === i && c.index === index);
  place(counters.length).forEach((p, index) => {
    const c = counters[index];
    g.append(counter(c, {
      x: cx + p.x, y: ZONE_BASE_Y + p.y, zone: i, index, magenta,
      selected: s.selected?.zone === i && s.selected?.index === index,
      shake: s.shake?.zone === i && s.shake?.index === index,
      tappable: drawing || (s.step === 'cancel' && !c.canceled),
      justCanceled: is(fx.justCanceled, index),
      hinted: is(show.pair, index) || (show.survivors && !c.canceled),
    }));
  });
  return g;
}

function text(str, x, y, cls, attrs = {}) {
  return el('text', { x, y, class: cls, 'text-anchor': 'middle', ...attrs }, [str]);
}

// A tappable word on the rewritten line: text plus a 44px+ hit area.
function tappable(str, x, y, cls, action, part, width) {
  const g = el('g', { 'data-action': action, 'data-part': part, class: 'tap-text' });
  g.append(el('rect', { class: 'hit', x: x - width / 2, y: y - 48, width, height: 64, rx: 10 }));
  g.append(text(str, x, y, cls));
  return g;
}

function problemLine(p) {
  const g = el('g', { class: 'problem' });
  const r = p.right.value;
  g.append(text(signed(p.left.value), COLUMN.left, PROBLEM_Y, 'term'));
  g.append(text(p.op === '+' ? '+' : MINUS, COLUMN.op, PROBLEM_Y, 'op'));
  g.append(text(r < 0 ? `(${signed(r)})` : signed(r), COLUMN.right, PROBLEM_Y, 'term'));
  return g;
}

// Combine it: nothing to rewrite, so the line under the problem is only the answer, set out
// in the problem's columns:   5   +   (−8)
//                                 =   −3
function answerLine(s) {
  const g = el('g', { class: 'rewritten' });
  if (s.step === 'answer' || s.step === 'done') {
    g.append(text('=', COLUMN.op, REWRITE_Y, 'op'));
    const v = entryValue(s.entry);
    const shown = v === null ? (s.entry.negative ? MINUS : '?') : signed(v);
    g.append(text(shown, COLUMN.right, REWRITE_Y,
      `answer${v === null ? ' is-empty' : ''}${s.step === 'done' ? ' is-correct' : ''}`));
  }
  return g;
}

function rewrittenLine(s, fx) {
  if (s.combine) return answerLine(s);
  const { problem, flips } = s;
  const sub = isSubtraction(problem);
  const op = sub && !flips.op ? MINUS : '+';
  const b = problem.right.value;
  const r = flips.sign ? -b : b;
  const rightText = r < 0 || flips.sign ? `(${signed(r, true)})` : signed(r);
  const g = el('g', { class: 'rewritten' });
  const live = s.step === 'rewrite';
  g.append(text(signed(problem.left.value), COLUMN.left, REWRITE_Y, `term${fx.hint?.show?.signs ? ' hint-glow' : ''}`));
  const show = fx.hint?.show ?? {};
  const extra = (part) => [
    fx.justFlipped === part && 'flip-in',
    show.flip?.includes(part) && 'hint-flip',
    show.signs && part === 'sign' && 'hint-glow',
  ].filter(Boolean).map((c) => ` ${c}`).join('');
  const opCls = `op${flips.op ? ' is-opposite' : ''}${extra('op')}`;
  const rCls = `term${flips.sign ? ' is-opposite' : ''}${extra('sign')}`;
  if (live) {
    g.append(tappable(op, COLUMN.op, REWRITE_Y, opCls, 'flip', 'op', 64));
    g.append(tappable(rightText, COLUMN.right, REWRITE_Y, rCls, 'flip', 'sign', 130));
  } else {
    g.append(text(op, COLUMN.op, REWRITE_Y, opCls));
    g.append(text(rightText, COLUMN.right, REWRITE_Y, rCls));
  }
  if (s.step === 'answer' || s.step === 'done') {
    g.append(text('=', COLUMN.eq, REWRITE_Y, 'op'));
    const v = entryValue(s.entry);
    const shown = v === null ? (s.entry.negative ? MINUS : '?') : signed(v);
    g.append(text(shown, COLUMN.answer, REWRITE_Y,
      `answer${v === null ? ' is-empty' : ''}${s.step === 'done' ? ' is-correct' : ''}`));
  }
  return g;
}

// Magenta is always paired with an underline. Drawn from measured text, so
// they are re-placed once the web fonts have loaded.
function placeUnderlines(svg) {
  if (!svg.isConnected) return;
  svg.querySelectorAll('.underline').forEach((u) => u.remove());
  svg.querySelectorAll('text.is-opposite').forEach((t) => {
    const b = t.getBBox();
    const y = b.y + b.height + 2;
    t.after(stroke(b.x, y, b.x + b.width, y, 'underline'));
  });
}

// fx (view-only effects): { hint, justFlipped: 'op'|'sign'|null, justCanceled: [{zone,index}] }
export function renderMat(s, fx = {}) {
  const svg = el('svg', {
    class: `mat step-${s.step}`,
    viewBox: `0 ${VIEW.top} ${VIEW.width} ${VIEW.height}`,
    role: 'group',
    'aria-label': 'The Mat',
  });
  svg.append(zone(s, 0, COLUMN.left, fx), zone(s, 1, COLUMN.right, fx));
  svg.append(problemLine(s.problem));
  svg.append(rewrittenLine(s, fx));
  requestAnimationFrame(() => placeUnderlines(svg));
  document.fonts?.ready.then(() => placeUnderlines(svg));
  return svg;
}
