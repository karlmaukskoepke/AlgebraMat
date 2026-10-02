// The Mat for light mode (SPEC-SCAFFOLD.md §2): the problem and the answer being typed. Inline SVG with HTML text,
// in the same 860×340 box as the other Mats.

import { MINUS } from '../engine/expr.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

function html(tag, cls, ...children) {
  const node = document.createElementNS(HTML_NS, tag);
  if (cls) node.setAttribute('class', cls);
  node.append(...children.filter((c) => c !== null));
  return node;
}

// view: { problemText, typed, done, wordHint } — typed is what's been typed (with the keyboard's "-"),
// done says it's right, and wordHint (optional) is a line under the answer.
export function renderLightMat({ problemText, typed, done, wordHint }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mat dist-mat light-mat');
  svg.setAttribute('viewBox', '0 0 860 340');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Type the answer');
  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '70');
  fo.setAttribute('width', '860');
  fo.setAttribute('height', '230');
  const shown = typed.replace('-', MINUS);
  fo.append(html('div', 'dist-line',
    html('div', 'dist-row dist-original', problemText),
    html('div', 'dist-row dist-opened',
      html('span', 'dist-eq', '='),
      html('span', `dist-typed${done ? ' is-done' : ''}${!done && !shown ? ' is-empty' : ''}`, shown || '?')),
    wordHint ? html('div', 'dist-note', wordHint) : null));
  svg.append(fo);
  return svg;
}
