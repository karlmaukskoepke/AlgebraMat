// Renders the Boxes & Circles Mat as inline SVG (SPEC-BOXES.md §2–3), from a view state:
//
//   { expr,                                   the expression (engine/terms.js)
//     shapes:   [{ kind: 'box' | 'circle', from, to, complete }],  around parts from..to
//     selecting: { from, to } | null,         the drag in progress, highlighted live
//     rewritten: [term index, ...],           terms rewritten (− (−7) "is +7")
//     pieces:   [[piece, ...], ...],          one column of pieces per term
//     answer:   { text, done } | null,        the typed line after "="
//     key: boolean,                           show the mystery-box key (Draw step)
//     selected: { term, index } | null,       a piece picked to cancel
//     tap: 'parts' | 'zones' | 'pieces' | null,
//     fx: { hint } }
//
// Shapes carry the kind, not color: a rounded-square box around a variable term
// and a pill around a number. A mystery box □ is x and −□ is −x (a short dash
// at its left). Pieces are ink; canceled pairs get vermillion slashes; magenta
// means opposite (a rewritten term's pieces and its "is +7"). The live drag
// selection is highlighter yellow.

import { MINUS } from '../engine/expr.js';
import { effective } from '../engine/terms.js';
import {
  BOX_VIEW, ROW_Y, SHAPE_HEIGHT, ANSWER_Y, LABEL_Y, PIECE_W, PIECE_H, HIT_H, SHAPE_TOP,
  exprLayout, piecePositions, shapeBounds,
} from './boxLayout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

const line = (x1, y1, x2, y2, cls) => el('line', { x1, y1, x2, y2, class: cls });
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `+${v}`);

// ---------- Pieces ----------

const MARK = 10; // half the width of a counter's mark

function counterMarks(sign) {
  const g = el('g', { class: 'bm-mark' });
  g.append(line(-MARK, 0, MARK, 0, 'mark'));
  if (sign === '+') g.append(line(0, -MARK, 0, MARK, 'mark'));
  return g;
}

// □ is x. −□ is −x: the same square with a short dash touching its left side.
function boxMarks(sign) {
  const g = el('g', { class: 'bm-mark' });
  const left = sign === '-' ? -5 : -11;
  g.append(el('rect', { x: left, y: -11, width: 22, height: 22, rx: 2, class: 'mark box-outline' }));
  if (sign === '-') g.append(line(-19, 0, -5, 0, 'mark'));
  return g;
}

function pieceNode(piece, x, y, { selected = false, hinted = false, tap = null } = {}) {
  const cls = ['bm-piece', piece.type, piece.opposite ? 'is-opposite' : '', piece.canceled ? 'is-canceled' : '',
    selected ? 'is-selected' : '', hinted ? 'hint-blink-piece' : '', tap ? 'tappable' : ''].filter(Boolean).join(' ');
  const g = el('g', {
    class: cls, transform: `translate(${x} ${y})`, 'data-sign': piece.sign,
    'data-action': tap?.action ?? null, 'data-term': tap?.term ?? null, 'data-index': tap?.index ?? null,
  });
  g.append(el('rect', { x: -PIECE_W / 2, y: -PIECE_H / 2, width: PIECE_W, height: PIECE_H, class: 'bm-hit' }));
  g.append(piece.type === 'box' ? boxMarks(piece.sign) : counterMarks(piece.sign));
  if (piece.canceled) g.append(line(-16, 14, 16, -14, 'bm-slash'));
  if (selected) g.append(el('rect', { x: -21, y: -17, width: 42, height: 34, rx: 8, class: 'bm-ring' }));
  return g;
}

// ---------- The expression row ----------

function shapeNode(layout, shape) {
  const b = shapeBounds(layout, shape.from, shape.to);
  const pill = shape.kind === 'circle';
  return el('rect', {
    x: b.x, y: b.y, width: b.width, height: b.height,
    rx: pill ? SHAPE_HEIGHT / 2 : 10,
    class: `bm-shape is-${shape.kind}${shape.complete === false ? ' is-incomplete' : ''}`,
    'data-from': shape.from, 'data-to': shape.to,
  });
}

export function renderBoxMat(s) {
  const svg = el('svg', {
    class: 'mat box-mat', viewBox: `0 0 ${BOX_VIEW.width} ${BOX_VIEW.height}`,
    role: 'group', 'aria-label': 'The Boxes and Circles Mat',
  });
  const layout = exprLayout(s.expr);
  const hint = s.fx?.hint?.show ?? {};

  // The live selection sits behind the text.
  if (s.selecting) {
    const b = shapeBounds(layout, s.selecting.from, s.selecting.to);
    svg.append(el('rect', { x: b.x, y: b.y + 4, width: b.width, height: b.height - 8, rx: 8, class: 'bm-selecting' }));
  }

  // Pieces above each term, and the tappable column behind them (Draw).
  layout.columns.forEach((col) => {
    const column = s.pieces?.[col.term] ?? [];
    if (s.tap === 'zones') {
      svg.append(el('rect', {
        x: col.left, y: 4, width: col.width, height: SHAPE_TOP - 8, class: 'bm-zone tappable',
        'data-action': 'zone', 'data-term': col.term,
      }));
    }
    piecePositions(column.length, col.cx).forEach((pos, i) => {
      const selected = s.selected?.term === col.term && s.selected?.index === i;
      const tap = (s.tap === 'pieces' || s.tap === 'zones') && !column[i].canceled ? { action: 'piece', term: col.term, index: i } : null;
      svg.append(pieceNode(column[i], pos.x, pos.y, { selected, hinted: hint.pieces?.some((p) => p.term === col.term && p.index === i), tap }));
    });
  });

  // Shapes, then the text on top.
  for (const shape of s.shapes ?? []) svg.append(shapeNode(layout, shape));
  const selected = (i) => s.selecting && i >= Math.min(s.selecting.from, s.selecting.to) && i <= Math.max(s.selecting.from, s.selecting.to);
  for (const p of layout.parts) {
    svg.append(el('text', {
      x: p.cx, y: ROW_Y, 'text-anchor': 'middle',
      class: `bm-text ${p.part === 'op' ? 'is-op' : 'is-num'}${selected(p.index) ? ' is-selecting' : ''}`,
      'data-part': p.index,
    }, [p.text]));
    if (s.tap === 'parts') {
      svg.append(el('rect', {
        x: p.hitLeft, y: ROW_Y - HIT_H + 18, width: p.hitRight - p.hitLeft, height: HIT_H, class: 'bm-parthit tappable',
        'data-action': 'part', 'data-part': p.index,
      }));
    }
  }

  // A rewritten term says what it is worth: "is +7", in magenta with an underline.
  for (const i of s.rewritten ?? []) {
    const col = layout.columns[i];
    const text = `is ${signed(effective(s.expr.terms[i]))}`;
    svg.append(el('text', { x: col.cx, y: LABEL_Y, 'text-anchor': 'middle', class: 'bm-label' }, [text]));
    svg.append(line(col.cx - 26, LABEL_Y + 7, col.cx + 26, LABEL_Y + 7, 'bm-label-line'));
  }

  // The student's line under the problem: = 2x + 2
  if (s.answer) {
    svg.append(el('text', {
      x: Math.max(24, layout.left), y: ANSWER_Y, class: `bm-answer${s.answer.done ? '' : ' is-typing'}`,
    }, [`= ${s.answer.text || '?'}`]));
  }

  // The key from the notes: □ = x and −□ = −x.
  if (s.key) {
    const k = el('g', { class: 'bm-key', transform: `translate(${BOX_VIEW.width - 214} ${ANSWER_Y - 8})` });
    k.append(pieceNode({ type: 'box', sign: '+' }, 12, 0));
    k.append(el('text', { x: 30, y: 8, class: 'bm-key-text' }, ['= x']));
    k.append(pieceNode({ type: 'box', sign: '-' }, 118, 0));
    k.append(el('text', { x: 142, y: 8, class: 'bm-key-text' }, [`= ${MINUS}x`]));
    svg.append(k);
  }
  return svg;
}
