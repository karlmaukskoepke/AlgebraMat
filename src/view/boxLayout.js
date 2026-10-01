// Pure geometry for the Boxes & Circles Mat (SPEC-BOXES.md §2). No DOM, so it can be tested.
//
// The expression is one row near the bottom of a 860 × 340 drawing. Each term
// has its own column, spaced out so its pieces can stand straight above it,
// as in the notes:
//
//        □ □          + + +
//          □            + +
//   [ 3x ]  ( − 5 )  ( + 7 )   [ − x ]
//   = 2x + 2
//
// A term after the first has two parts, its operation and its number. Each part
// has a glyph box (where it's drawn) and a hit box (at least 46 wide, so it is a
// 44px tap target on a Chromebook, and what a drag selects).

import { termParts, pieceCount } from '../engine/terms.js';
import { maxPieces } from '../engine/termMoves.js';

export const BOX_VIEW = { width: 860, height: 340 };
export const ROW_Y = 250;            // baseline of the expression row
export const SHAPE_TOP = ROW_Y - 40; // the box or pill around a term
export const SHAPE_HEIGHT = 54;
export const ANSWER_Y = 322;         // baseline of "= 2x + 2"
export const LABEL_Y = 292;          // "is +7" under a rewritten term
export const FONT = 40;              // expression text, in drawing units

export const PIECE_W = 46;           // one cell of the piece grid (about 44px on a Chromebook)
export const PIECE_H = 47;
export const PIECES_BOTTOM_Y = 182;  // center of the grid's bottom row
export const COLUMN_GAP = 20;       // between columns; closes up to MIN_GAP for a wide problem
export const MIN_GAP = 4;
const EDGE = 12;                     // the row never comes closer than this to the drawing's edge
const PAD_X = 12;                    // room between a term's text and its column edge
const OP_W = 30;                     // the operation's glyph box
const IN_GAP = 12;                   // between a term's operation and its number
export const HIT_W = 46;             // tap targets are at least this wide
export const HIT_H = 56;
export const SHAPE_PAD = 9;          // a shape stands off the text by this much

// Estimated width of text in the expression font (Lexend). Pieces and shapes are
// placed from this, so it errs wide; the text itself is drawn centered in its box.
export function textWidth(text, size = FONT) {
  let w = 0;
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') w += 0.66;
    else if (ch === 'x') w += 0.62;
    else if (ch === '(' || ch === ')') w += 0.4;
    else if (ch === ' ') w += 0.28;
    else w += 0.7; // + and −
  }
  return Math.ceil(w * size);
}

// Pieces sit two to a row, filled rows on top and an odd piece alone at the bottom,
// as in the notes (7 counters are 2 + 2 + 2 + 1). A term that needs 7 or more
// goes three to a row instead, so a tall column never shrinks the whole Mat below
// a 44px tap target. Positions are in reading order, centered on cx. Returns [{ x, y }].
export const BIG_COLUMN = 7;
export const perRowFor = (term) => (pieceCount(term) >= BIG_COLUMN ? 3 : 2);

export function piecePositions(count, cx, perRow = 2) {
  if (count <= 0) return [];
  const full = Math.floor(count / perRow);
  const rest = count % perRow;
  const rows = full + (rest ? 1 : 0);
  const topY = PIECES_BOTTOM_Y - (rows - 1) * PIECE_H;
  const across = (k, y) => Array.from({ length: k }, (_, j) => ({ x: cx + (j - (k - 1) / 2) * PIECE_W, y }));
  const out = [];
  for (let r = 0; r < full; r++) out.push(...across(perRow, topY + r * PIECE_H));
  if (rest) out.push(...across(rest, PIECES_BOTTOM_Y));
  return out;
}

export const pieceRows = (count, perRow = 2) => Math.ceil(count / perRow);

// The part of the drawing to show: the top is cropped (or made taller) to fit the
// tallest column a term can hold, so a small problem gets a bigger Mat and a big
// one still has room above it. Returns { y, height } for the viewBox.
export function viewFor(expr) {
  const rows = Math.max(1, ...expr.terms.map((t) => pieceRows(maxPieces(t), perRowFor(t))));
  const topEdge = PIECES_BOTTOM_Y - (rows - 1) * PIECE_H - PIECE_H / 2;
  const y = Math.max(-40, Math.floor(topEdge - 10));
  return { y, height: BOX_VIEW.height - y };
}

// Where everything goes for an expression: one column per term, centered in the
// drawing. Each column has `cx`, `left`, `width`, and its text parts.
export function exprLayout(expr) {
  const parts = termParts(expr);
  const columns = expr.terms.map((term, i) => {
    const mine = parts.filter((p) => p.term === i);
    const hasOp = mine.some((p) => p.part === 'op');
    const numText = mine.find((p) => p.part === 'num').text;
    const numW = textWidth(numText);
    const textW = (hasOp ? OP_W + IN_GAP : 0) + numW;
    const pieces = pieceCount(term);
    const perRow = perRowFor(term);
    const piecesW = pieces === 0 ? 0 : Math.min(pieces, perRow) * PIECE_W;
    return { term: i, hasOp, numText, numW, textW, pieces, perRow, width: Math.max(textW + 2 * PAD_X, piecesW + 6) };
  });
  const widths = columns.reduce((sum, c) => sum + c.width, 0);
  const gaps = Math.max(1, columns.length - 1);
  const gap = Math.max(MIN_GAP, Math.min(COLUMN_GAP, Math.floor((BOX_VIEW.width - 2 * EDGE - widths) / gaps)));
  const total = widths + gap * (columns.length - 1);
  let left = (BOX_VIEW.width - total) / 2;
  let partIndex = 0;
  const out = columns.map((c) => {
    const cx = left + c.width / 2;
    const textLeft = cx - c.textW / 2;
    const mine = [];
    if (c.hasOp) {
      mine.push({
        index: partIndex++, term: c.term, part: 'op', text: parts[partIndex - 1].text,
        left: textLeft, right: textLeft + OP_W, cx: textLeft + OP_W / 2,
      });
    }
    const numLeft = textLeft + (c.hasOp ? OP_W + IN_GAP : 0);
    mine.push({
      index: partIndex++, term: c.term, part: 'num', text: c.numText,
      left: numLeft, right: numLeft + c.numW, cx: numLeft + c.numW / 2,
    });
    // Hit boxes: at least HIT_W wide, never reaching into the neighboring part.
    for (const p of mine) {
      const w = Math.max(p.right - p.left, HIT_W);
      p.hitLeft = p.cx - w / 2;
      p.hitRight = p.cx + w / 2;
    }
    if (mine.length === 2) {
      const [op, num] = mine;
      const mid = (op.right + num.left) / 2;
      op.hitRight = Math.min(op.hitRight, mid);
      op.hitLeft = Math.min(op.hitLeft, op.hitRight - HIT_W);      // grow outward, away from the number
      num.hitLeft = Math.max(num.hitLeft, mid);
      num.hitRight = Math.max(num.hitRight, num.hitLeft + HIT_W);
    }
    const col = { term: c.term, cx, left, width: c.width, pieces: c.pieces, perRow: c.perRow, parts: mine };
    left += c.width + gap;
    return col;
  });
  return { columns: out, parts: out.flatMap((c) => c.parts), left: (BOX_VIEW.width - total) / 2, width: total, gap };
}

// The rectangle for a shape drawn around parts `from` to `to` (inclusive indexes
// into the expression's parts). Boxes and pills share it; the view rounds the corners.
export function shapeBounds(layout, from, to) {
  const a = layout.parts[Math.min(from, to)];
  const b = layout.parts[Math.max(from, to)];
  return { x: a.left - SHAPE_PAD, y: SHAPE_TOP, width: b.right - a.left + 2 * SHAPE_PAD, height: SHAPE_HEIGHT };
}

// Which part is at this x (hit boxes), or -1.
export function partAt(layout, x) {
  return layout.parts.findIndex((p) => x >= p.hitLeft && x <= p.hitRight);
}

// The part nearest x, if one is within `slack` of its hit box (so a press in the
// small gaps between terms still lands). -1 if none.
export function partNear(layout, x, slack = 18) {
  let best = -1;
  let bestDistance = slack + 1;
  for (const p of layout.parts) {
    const distance = x < p.hitLeft ? p.hitLeft - x : x > p.hitRight ? x - p.hitRight : 0;
    if (distance < bestDistance) { best = p.index; bestDistance = distance; }
  }
  return best;
}

// The parts a drag from x1 to x2 covers: everything between the two ends.
export function dragRange(layout, x1, x2) {
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  const covered = layout.parts.filter((p) => p.hitRight >= lo && p.hitLeft <= hi);
  if (!covered.length) return null;
  return { from: covered[0].index, to: covered[covered.length - 1].index };
}
