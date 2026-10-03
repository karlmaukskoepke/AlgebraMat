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

// view: { problemText, typed, shown, done, cloze, said, readback }
//   shown  the typed text as it should read, when it isn't just the typed text with a real minus (terms: "2x + 3")
//   typed  what's been typed (with the keyboard's "-"), done says it's right
//   cloze  while the cloze is showing: { sentence, choices: [{ text, index }], tried: [index] }
//   readback  the typed answer in words ("negative 2"), under the answer, when the sign support is on
//   said   once the right choice is picked: { sentence, leftover: { sign, count } }, kept while the student types
export function renderLightMat({ problemText, typed, shown: shownText, done, cloze, said, readback }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mat dist-mat light-mat');
  svg.setAttribute('viewBox', '0 0 860 340');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', cloze ? 'Finish the sentence' : 'Type the answer');
  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', cloze || said ? '20' : '70');
  fo.setAttribute('width', '860');
  fo.setAttribute('height', cloze || said ? '300' : '230');
  const shown = shownText ?? typed.replace('-', MINUS);
  const parts = [html('div', 'dist-row dist-original', problemText)];
  if (cloze) {
    parts.push(html('div', 'cloze-sentence', cloze.sentence));
    parts.push(html('div', 'cloze-choices', ...cloze.choices.map((c) => {
      const b = html('button', `btn cloze-choice${cloze.tried.includes(c.index) ? ' is-tried' : ''}`, c.text);
      b.setAttribute('type', 'button');
      b.setAttribute('data-action', 'choice');
      b.setAttribute('data-index', String(c.index));
      if (cloze.tried.includes(c.index)) b.setAttribute('disabled', '');
      return b;
    })));
  } else {
    if (said) {
      parts.push(html('div', 'cloze-sentence is-said', said.sentence));
      parts.push(html('div', 'cloze-left', ...Array.from({ length: said.leftover.count }, () =>
        html('span', `light-counter is-${said.leftover.sign === '-' ? 'neg' : 'pos'}`, said.leftover.sign === '-' ? MINUS : '+'))));
    }
    parts.push(html('div', 'dist-row dist-opened',
      html('span', 'dist-eq', '='),
      html('span', `dist-typed${done ? ' is-done' : ''}${!done && !shown ? ' is-empty' : ''}`, shown || '?')));
    if (readback) parts.push(html('div', 'dist-note', readback));
  }
  fo.append(html('div', 'dist-line light-line', ...parts));
  svg.append(fo);
  return svg;
}
