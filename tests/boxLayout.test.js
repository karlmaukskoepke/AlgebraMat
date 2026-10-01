import { describe, it, expect } from 'vitest';
import {
  BOX_VIEW, ROW_Y, SHAPE_TOP, SHAPE_HEIGHT, ANSWER_Y, PIECE_W, PIECE_H, HIT_W, COLUMN_GAP, MIN_GAP,
  textWidth, piecePositions, pieceRows, exprLayout, shapeBounds, partAt, dragRange,
} from '../src/view/boxLayout.js';
import { makeTerm, makeExpression, termParts } from '../src/engine/terms.js';
import { generateTermLevel } from '../src/engine/generateTerms.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);        // 3x − 5 + 7 − x
const EX2 = makeExpression([n('+', -5), x('-', 2), x('-', 1), n('-', -7)]);      // −5 − 2x − x − (−7)

const problems = [1, 2, 3, 4, 5].flatMap((level) => Array.from({ length: 40 }, (_, i) => generateTermLevel(level, i * 53 + 7)).flat());

describe('piece grids', () => {
  it('puts pieces two to a row, full rows on top and an odd piece alone at the bottom', () => {
    expect(piecePositions(0, 100)).toEqual([]);
    expect(piecePositions(1, 100)).toEqual([{ x: 100, y: 186 }]);
    const seven = piecePositions(7, 100);
    expect(seven).toHaveLength(7);
    expect(seven.slice(0, 2).map((p) => p.x)).toEqual([100 - PIECE_W / 2, 100 + PIECE_W / 2]);
    expect(seven[6]).toEqual({ x: 100, y: 186 });          // the odd one, bottom center
    expect(new Set(seven.map((p) => p.y)).size).toBe(4);   // 2 + 2 + 2 + 1
    expect(pieceRows(7)).toBe(4);
    expect(pieceRows(8)).toBe(4);
  });

  it('never overlaps pieces, and keeps a column clear of the shapes below and the top edge above', () => {
    for (let count = 1; count <= 9; count++) {
      const ps = piecePositions(count, 0);
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const apart = Math.abs(ps[i].x - ps[j].x) >= PIECE_W || Math.abs(ps[i].y - ps[j].y) >= PIECE_H;
        expect(apart, `${count} pieces: ${i} and ${j}`).toBe(true);
      }
      expect(Math.min(...ps.map((p) => p.y)) - PIECE_H / 2).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ps.map((p) => p.y)) + PIECE_H / 2).toBeLessThan(SHAPE_TOP);
    }
  });
});

describe('the expression row', () => {
  it('gives each term a column, left to right, centered, with a gap between', () => {
    const layout = exprLayout(EX1);
    expect(layout.columns).toHaveLength(4);
    expect(layout.gap).toBe(COLUMN_GAP);
    layout.columns.slice(1).forEach((c, i) => {
      expect(c.left).toBeCloseTo(layout.columns[i].left + layout.columns[i].width + layout.gap);
    });
    const first = layout.columns[0];
    const last = layout.columns[3];
    expect(first.left + (last.left + last.width - first.left) / 2).toBeCloseTo(BOX_VIEW.width / 2);
  });

  it('splits terms into the same parts as the engine, the first term having only a number', () => {
    for (const e of [EX1, EX2]) {
      const layout = exprLayout(e);
      expect(layout.parts.map((p) => [p.term, p.part, p.text])).toEqual(termParts(e).map((p) => [p.term, p.part, p.text]));
      expect(layout.parts.map((p) => p.index)).toEqual(layout.parts.map((_, i) => i));
      expect(layout.columns[0].parts).toHaveLength(1);
    }
  });

  it('keeps every part\'s tap target at least 46 wide, and the targets apart (every generated problem)', () => {
    for (const e of [EX1, EX2, ...problems]) {
      const { parts } = exprLayout(e);
      for (const p of parts) expect(p.hitRight - p.hitLeft).toBeGreaterThanOrEqual(HIT_W - 0.001);
      for (let i = 1; i < parts.length; i++) expect(parts[i].hitLeft).toBeGreaterThanOrEqual(parts[i - 1].hitRight - 0.001);
    }
  });

  it('fits every generated problem in the drawing, columns and pieces', () => {
    let widest = 0;
    for (const e of problems) {
      const layout = exprLayout(e);
      widest = Math.max(widest, layout.width);
      expect(layout.gap).toBeGreaterThanOrEqual(MIN_GAP);
      expect(layout.left).toBeGreaterThanOrEqual(11.99);
      expect(layout.left + layout.width).toBeLessThanOrEqual(BOX_VIEW.width - 11.99);
      for (const c of layout.columns) {
        expect(c.pieces).toBeLessThanOrEqual(9);
        const ps = piecePositions(c.pieces, c.cx);
        for (const p of ps) {
          expect(p.x - PIECE_W / 2).toBeGreaterThanOrEqual(c.left - 0.001);
          expect(p.x + PIECE_W / 2).toBeLessThanOrEqual(c.left + c.width + 0.001);
        }
      }
    }
    expect(widest).toBeLessThanOrEqual(BOX_VIEW.width - 24);
  });

  it('keeps the answer line below the row and inside the drawing', () => {
    expect(ROW_Y).toBeLessThan(ANSWER_Y);
    expect(ANSWER_Y).toBeLessThan(BOX_VIEW.height);
    expect(SHAPE_TOP + SHAPE_HEIGHT).toBeLessThan(ANSWER_Y - 30);
  });

  it('estimates text width, wider for more characters', () => {
    expect(textWidth('12')).toBeGreaterThan(textWidth('1'));
    expect(textWidth('(−7)')).toBeLessThan(textWidth('−777'));
    expect(textWidth('')).toBe(0);
  });
});

describe('shapes and drags', () => {
  it('draws a shape around a term\'s operation and number, clear of the next term\'s shape', () => {
    for (const e of [EX1, EX2, ...problems]) {
      const layout = exprLayout(e);
      const bounds = layout.columns.map((c) => shapeBounds(layout, c.parts[0].index, c.parts[c.parts.length - 1].index));
      bounds.forEach((b, i) => {
        expect(b.height).toBe(SHAPE_HEIGHT);
        expect(b.x).toBeLessThan(layout.columns[i].parts[0].left);
        if (i > 0) expect(b.x).toBeGreaterThanOrEqual(bounds[i - 1].x + bounds[i - 1].width);
      });
    }
  });

  it('reads a drag as the parts between its two ends, either direction', () => {
    const layout = exprLayout(EX1);               // parts: 3x | − 5 | + 7 | − x
    const [, op1, num1, op2, num2] = layout.parts;
    const mid = (p) => (p.hitLeft + p.hitRight) / 2;
    expect(dragRange(layout, mid(op1), mid(num1))).toEqual({ from: op1.index, to: num1.index });
    expect(dragRange(layout, mid(num1), mid(op1))).toEqual({ from: op1.index, to: num1.index });
    expect(dragRange(layout, mid(num2), mid(num2))).toEqual({ from: num2.index, to: num2.index });
    expect(dragRange(layout, mid(op2), mid(num2))).toEqual({ from: op2.index, to: num2.index });
    expect(dragRange(layout, -50, -20)).toBeNull();
  });

  it('finds the part under a point', () => {
    const layout = exprLayout(EX1);
    const p = layout.parts[2];
    expect(partAt(layout, p.cx)).toBe(2);
    expect(partAt(layout, -10)).toBe(-1);
  });
});
