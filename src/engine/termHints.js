// Boxes & Circles hints after 3 wrong tries on the same step (SPEC-BOXES.md §6).
// Like the other packs', a hint shows the move and never makes it. Pure logic,
// no DOM: termHintFor(state) → null | { key, params, show }.
//
// show: { parts: part indexes that wiggle (Rewrite), terms: term indexes whose text
//         blinks (Box & Circle), ghosts: [{ term, type, sign, count }] faint pieces
//         (Draw), pieces: [{ term, index }] that blink (Cancel, Answer),
//         button: the palette button to pulse, as 'nothingToRewrite' or 'pickPiece:box:+' }

import { HINT_AFTER } from './hints.js';
import { termParts, isX, pieceCount, pieceSign } from './terms.js';
import { canCancel, remaining } from './termPieces.js';
import { shapeInfo } from './termMoves.js';
import { rewritable, fullyFlipped, flipKey } from './termSession.js';

const typeOf = (term) => (isX(term) ? 'box' : 'counter');

export function termHintFor(s) {
  if (!s || s.step === 'done' || (s.tries[s.step] ?? 0) < HINT_AFTER) return null;
  const { problem } = s;

  switch (s.step) {
    case 'rewrite': {
      const todo = rewritable(problem).filter((t) => !fullyFlipped(s, t));
      if (rewritable(problem).length === 0) return { key: 'hintNothing', show: { button: 'nothingToRewrite' } };
      const parts = termParts(problem).flatMap((p, i) => (todo.includes(p.term) && !s.flips[flipKey(p.term, p.part)] ? [i] : []));
      return { key: 'hintRewrite', show: { parts } };
    }

    case 'boxcircle': {
      const done = new Set();
      for (const shape of s.shapes) {
        const info = shapeInfo(problem, shape);
        if (info.complete && shape.kind === (isX(problem.terms[info.term]) ? 'box' : 'circle')) done.add(info.term);
      }
      const terms = problem.terms.map((_, i) => i).filter((i) => !done.has(i));
      return { key: 'hintBoxCircle', show: { terms } };
    }

    case 'draw': {
      const ghosts = [];
      problem.terms.forEach((term, i) => {
        const type = typeOf(term);
        const sign = pieceSign(term);
        const column = s.pieces[i];
        const right = column.length === pieceCount(term) && column.every((p) => p.type === type && p.sign === sign);
        if (!right) ghosts.push({ term: i, type, sign, count: pieceCount(term) });
      });
      const first = ghosts[0];
      return {
        key: 'hintDraw',
        show: { ghosts, button: first ? `pickPiece:${first.type}:${first.sign}` : null },
      };
    }

    case 'cancel': {
      const live = s.pieces.flatMap((col, term) => col.map((piece, index) => ({ term, index, piece })))
        .filter((x) => !x.piece.canceled);
      const first = s.selected ? live.find((x) => x.term === s.selected.term && x.index === s.selected.index) : null;
      const a = first ?? live.find((x) => live.some((y) => canCancel(x.piece, y.piece)));
      const b = a && live.find((y) => canCancel(a.piece, y.piece));
      if (!a || !b) return null;
      return {
        key: 'hintCancel',
        params: { kind: a.piece.type },
        show: { pieces: [a, b].map(({ term, index }) => ({ term, index })) },
      };
    }

    case 'answer': {
      const left = remaining(s.pieces);
      const sign = (n) => (n > 0 ? '+' : n < 0 ? '-' : null);
      const pieces = s.pieces.flatMap((col, term) => col.map((p, index) => (p.canceled ? null : { term, index })).filter(Boolean));
      return { key: 'hintAnswer', params: { x: sign(left.x), n: sign(left.n) }, show: { pieces } };
    }

    default:
      return null;
  }
}
