// The group diagram of the Solve it unit (SPEC-DIVIDE-IT.md §3D): a quantity drawn as counters (or boxes), split into n equal groups,
// with a bracket round the kept group and the others faded. It is the fraction-of-a-group drawing of Count it / Group It
// (view/lassoMat.js: the same counter drawing, the same bar of connected groups, the same "take" bracket and fade, the same
// colours), made one shared component so every card that deals a fraction of a group uses this one drawing. It is used by
//   - the counters scaffold (I'm stuck, Teach me): boxes on the left, the pile on the right, dealt into n groups, one kept;
//   - "I'm stuck" at x alone with an unevaluated side (`x = ⅓(6)`): the right side only;
//   - the watched Level 1 walkthrough: three groups of x and six counters in three groups of two.
// In a real problem it never prints the answer as a numeral: the student counts the kept group and types the number.
//
// o: { n, boxes (the number in front of x; 0 or omitted draws no left side), size (counters on the right), neg (counters are −),
//      groups (counters dealt into each of n parts, or null for one undivided pile), pile (loose counters still to deal),
//      kept (index of the kept part), only (draw just the kept part of each side), tap ('deal' | 'keep' | null),
//      wide (a bigger drawing), caption (words under the drawing), outline (ring the boxes' number) }

import { el, counter } from './lassoMat.js';

const html = (tag, cls, kids = []) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids); return n; };

const PITCH = 18;
const GLYPH = 13;
const PAD = 8;
const BOX = 26;

function counterGrid(svg, count, x, y, w, neg, glyph = GLYPH, pitch = PITCH) {
  const perRow = Math.max(1, Math.floor((w - 2 * PAD) / pitch));
  const rows = Math.ceil(count / perRow);
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - r * perRow);
    const cx = x + (w - inRow * pitch) / 2 + (i % perRow) * pitch + pitch / 2;
    svg.append(counter(neg ? '-' : '+', cx, y + PAD / 2 + r * pitch + pitch / 2 + 1, neg ? 'is-opposite' : 'is-inside', glyph));
  }
  return rows;
}
const rowsFor = (count, w, pitch = PITCH) => Math.max(1, Math.ceil(count / Math.max(1, Math.floor((w - 2 * PAD) / pitch))));

function boxGrid(svg, count, x, y, w) {
  const perRow = Math.max(1, Math.floor((w - 2 * PAD) / (BOX + 6)));
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - r * perRow);
    const bx = x + (w - inRow * (BOX + 6) + 6) / 2 + (i % perRow) * (BOX + 6);
    const by = y + PAD / 2 + r * (BOX + 6);
    const g = el('g', { class: 'gd-box' });
    g.append(el('rect', { x: bx, y: by, width: BOX, height: BOX, rx: 6, class: 'gd-box-rect' }), el('text', { x: bx + BOX / 2, y: by + BOX / 2 + 6, 'text-anchor': 'middle', class: 'gd-box-x' }, ['x']));
    svg.append(g);
  }
}
const boxRowsFor = (count, w) => Math.max(1, Math.ceil(count / Math.max(1, Math.floor((w - 2 * PAD) / (BOX + 6)))));

export function groupDiagram(o) {
  const split = Array.isArray(o.groups);
  const n = o.n;
  const wide = Boolean(o.wide);
  const hasLeft = (o.boxes ?? 0) > 0;
  const BW = wide ? 300 : 150;
  const LW = wide ? 190 : 104;
  const parts = split ? o.groups.map((c, i) => ({ i, count: c })) : [{ i: 0, count: o.size }];
  const shown = o.only && o.kept !== null && o.kept !== undefined ? [parts[o.kept]] : parts;
  const perBoxes = split ? o.boxes / n : o.boxes;
  const rightH = Math.max(...shown.map((p) => rowsFor(split ? p.count : o.size, BW) * PITCH + PAD), 34);
  const leftH = hasLeft ? boxRowsFor(perBoxes, LW) * (BOX + 6) + PAD : 0;
  const h = Math.max(rightH, leftH, 34);
  const total = shown.length * h;
  const pile = split ? Math.max(0, o.pile ?? 0) : 0;
  const PW = pile ? (wide ? 150 : 96) : 0;
  const pileRows = pile ? rowsFor(pile, PW, 16) : 0;
  const H = Math.max(total, pileRows * 16 + PAD * 2) + 28;
  const top = (H - total) / 2;
  const x0 = 12;
  const border = hasLeft ? x0 + LW + 30 : 0;
  const pileX = hasLeft ? border + 14 : x0;
  const barX = pileX + (pile ? PW + 12 : 0);
  const W = barX + BW + 84;

  const svg = el('svg', { class: 'lasso-mat group-diagram gd-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Counters shared into equal groups' });
  const keptIdx = o.kept ?? null;
  const tap = o.tap ?? null;

  // the boxes (the number in front of x), in as many clusters as there are groups
  if (hasLeft) {
    shown.forEach((p, k) => {
      const y = top + k * h;
      const g = el('g', { class: `part gd-lpart${keptIdx !== null && p.i !== keptIdx && !o.only ? ' is-left' : ''}${keptIdx === p.i ? ' is-taken' : ''}` });
      g.append(el('rect', { x: x0, y, width: LW, height: h, class: 'bar-part' }));
      boxGrid(g, perBoxes, x0, y + (h - (boxRowsFor(perBoxes, LW) * (BOX + 6) + PAD)) / 2, LW);
      svg.append(g);
    });
    svg.append(el('rect', { x: x0, y: top, width: LW, height: total, rx: 4, class: 'bar-outline' }));
    if (o.outline && !split) svg.append(el('rect', { x: x0 - 5, y: top - 5, width: LW + 10, height: total + 10, rx: 8, class: 'gd-ring' }));
    svg.append(el('line', { x1: border, y1: 6, x2: border, y2: H - 6, class: 'gd-border' }));
  }

  // the loose pile, still to deal
  if (pile) {
    const g = el('g', { class: 'gd-pile' });
    counterGrid(g, pile, pileX, (H - (pileRows * 16 + PAD)) / 2, PW, Boolean(o.neg), 12, 16);
    svg.append(g);
  }

  // the groups on the right
  shown.forEach((p, k) => {
    const y = top + k * h;
    const next = tap === 'deal' && o.next === p.i;
    const cls = ['part', keptIdx === p.i ? 'is-taken' : '', keptIdx !== null && p.i !== keptIdx && !o.only ? 'is-left' : '', tap ? 'tappable' : ''].filter(Boolean).join(' ');
    const g = el('g', { class: cls, 'data-part': p.i, ...(tap ? { 'data-action': tap === 'keep' ? 'keep' : 'deal', 'data-group': p.i, role: 'button', tabindex: '0', 'aria-label': `Group ${p.i + 1}: ${p.count} counters` } : {}) });
    g.append(el('rect', { x: barX, y, width: BW, height: h, class: 'bar-part' }));
    if (next) g.append(el('rect', { x: barX + 4, y: y + 4, width: BW - 8, height: h - 8, rx: 6, class: 'next-ring' }));
    counterGrid(g, p.count, barX, y + (h - (rowsFor(p.count, BW) * PITCH + PAD)) / 2, BW, Boolean(o.neg));
    svg.append(g);
  });
  svg.append(el('rect', { x: barX, y: top, width: BW, height: total, rx: 4, class: 'bar-outline' }));

  // the bracket round the kept group, on both sides, with "take 1" (as in Group It)
  if (keptIdx !== null && keptIdx !== undefined) {
    const k = o.only ? 0 : keptIdx;
    const y1 = top + k * h;
    const y2 = y1 + h;
    const bracket = (bx) => svg.append(el('path', { d: `M ${bx - 8} ${y1 + 3} H ${bx} V ${y2 - 3} H ${bx - 8}`, class: 'take-bracket' }));
    bracket(barX + BW + 14);
    svg.append(el('text', { x: barX + BW + 24, y: (y1 + y2) / 2 + 8, class: 'take-label' }, ['take 1']));
    if (hasLeft) bracket(x0 + LW + 14);
  }

  const wrap = html('div', `gd${wide ? ' is-wide' : ''}`, [svg]);
  if (o.caption) wrap.append(html('p', 'gd-caption', [o.caption]));
  return wrap;
}
