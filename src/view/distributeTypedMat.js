// The Mat for Rounds 4 and 5 (SPEC-DISTRIBUTE.md §5): the problem, then the opened line, then the answer, each
// as it's typed. When help is showing (a hint, or Show me), its lines sit underneath. Inline SVG with HTML text,
// in the same 860×340 box as the other Mats.

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

function html(tag, cls, ...children) {
  const node = document.createElementNS(HTML_NS, tag);
  if (cls) node.setAttribute('class', cls);
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

// view: { problemText, step, typed, openedText, answerText, help } — help is a list of lines, or null.
export function renderTypedMat({ problemText, step, typed, openedText, answerText, help }) {
  const slot = (text, active) => html('span', `dist-typed${active ? '' : ' is-done'}${active && !text ? ' is-empty' : ''}`, text || '?');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mat dist-mat');
  svg.setAttribute('viewBox', '0 0 860 340');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Open the groups, then combine');
  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '16');
  fo.setAttribute('width', '860');
  fo.setAttribute('height', '310');
  fo.append(html('div', 'dist-line dist-typed-mat',
    html('div', 'dist-row dist-original', problemText),
    html('div', 'dist-row dist-opened', html('span', 'dist-eq', '='), step === 'open' ? slot(typed, true) : slot(openedText, false)),
    step === 'answer' || step === 'done'
      ? html('div', 'dist-row dist-opened', html('span', 'dist-eq', '='), step === 'answer' ? slot(typed, true) : slot(answerText, false))
      : null,
    help ? html('div', 'dist-help', ...help.map((line) => html('div', 'dist-help-line', line))) : null));
  svg.append(fo);
  return svg;
}
