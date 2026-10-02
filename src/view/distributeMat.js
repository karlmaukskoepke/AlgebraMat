// The Mat for Write it (SPEC-DISTRIBUTE.md §3): the problem on top, and the line being written under it.
// Inline SVG with HTML text, in the same 860×340 box as the Groups of Terms Mat.

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

function html(tag, cls, ...children) {
  const node = document.createElementNS(HTML_NS, tag);
  if (cls) node.setAttribute('class', cls);
  node.append(...children);
  return node;
}

// view: { problemText, groupText, typed } — typed is what's been written so far, set out as it reads.
export function renderLineMat({ problemText, groupText, typed }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mat dist-mat');
  svg.setAttribute('viewBox', '0 0 860 340');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Write the opened line');
  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '30');
  fo.setAttribute('width', '860');
  fo.setAttribute('height', '280');
  fo.append(html('div', 'dist-line',
    html('div', 'dist-row dist-original', problemText),
    html('div', 'dist-note', `the group opens to ${groupText}`),
    html('div', 'dist-row dist-opened', html('span', 'dist-eq', '='), html('span', `dist-typed${typed ? '' : ' is-empty'}`, typed || '?'))));
  svg.append(fo);
  return svg;
}
