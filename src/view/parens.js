// Parentheses that match what is inside them (Build AC, Part 4; loop spec rev 2.16, §3B): a pair of parentheses is as tall as the tallest
// thing inside it (a stacked fraction, a fraction of x, a division), with the weight of the text beside it. One shared piece, used by every
// place in Solve it that writes parentheses round a side, a term or a value (work rows, the Multiply and Divide previews, the check).
//
//   parens(kids, { glyph })   the kids in parentheses: an array to spread into the parent's children. Round plain text (nothing stacked
//                             inside) it is the font's own ( and ), exactly as before (`glyph` wraps each, as a caller drew them); round
//                             anything stacked it is one group whose two parentheses are drawn as tall as the group, the glyph kept
//                             (transparent) for the width, the words and screen readers.

import { html } from './addBothMat.js';

// what makes a pair of parentheses tall: a fraction drawn stacked (a fraction of x, a fraction factor, a fraction value), a division
export const TALL = '.lx-sfrac, .lb-divfrac, .lb-ratio';
const tall = (k) => k?.nodeType === 1 && (k.matches(TALL) || Boolean(k.querySelector(TALL)));
const SVG = 'http://www.w3.org/2000/svg';

// One parenthesis, drawn to the height of its group: a curve that keeps its stroke weight however tall it is stretched
function bracket(side) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'lb-pp-ink');
  svg.setAttribute('viewBox', '0 0 10 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', side === 'open' ? 'M8.5 2 C 1 22, 1 78, 8.5 98' : 'M1.5 2 C 9 22, 9 78, 1.5 98');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(path);
  return html('span', `lb-pp is-${side}`, [html('span', 'lb-ppg', [side === 'open' ? '(' : ')']), svg]);
}

export function parens(kids, { glyph = (t) => t } = {}) {
  const list = [].concat(kids);
  if (!list.some(tall)) return [glyph('('), ...list, glyph(')')];
  return [html('span', 'lb-pgroup', [bracket('open'), html('span', 'lb-pin', list), bracket('close')])];
}

// A line of the check written as pieces (`2(`, a stacked value, `)`: Strange solutions, Build V): the pair round a stacked value becomes
// one tall pair, its color the opening piece's (an operation about to happen stays in its accent). Every other piece is left as it is.
const textOf = (n) => (typeof n === 'string' ? n : n?.nodeType === 1 && n.childNodes.length === 1 && n.firstChild.nodeType === 3 ? n.textContent : null);
const setText = (nodes, i, t) => { if (typeof nodes[i] === 'string') nodes[i] = t; else nodes[i].textContent = t; };
export function tallParensIn(kids) {
  const out = [].concat(kids);
  for (let i = 0; i + 2 < out.length; i++) {
    const a = textOf(out[i]);
    const z = textOf(out[i + 2]);
    if (a === null || z === null || !a.endsWith('(') || !z.startsWith(')') || !tall(out[i + 1])) continue;
    const cls = typeof out[i] === 'string' ? '' : out[i].className;
    setText(out, i, a.slice(0, -1));
    setText(out, i + 2, z.slice(1));
    const [group] = parens([out[i + 1]]);
    if (cls) group.className += ` ${cls}`;
    out.splice(i + 1, 1, group);
  }
  return out;
}
