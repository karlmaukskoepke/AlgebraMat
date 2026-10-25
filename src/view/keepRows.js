// Redrawing a Solve it card's Mat without redrawing what is already on screen (Build S, Part 2). Every change of state draws the whole
// Mat again as a new tree; drawn in place of the old one, every row of the work stack would be a new element, and a new element plays
// its entrance animation (a cross-off, a fade-in) again. So the new tree is laid onto the old one instead: the rows of the work stack
// (and the elements that hold them) stay the same elements, and only what differs changes in them; everything else is the new tree's.
//
//   redrawMat(container, next)   draws `next` into `container`, keeping the rows already there (by their data-rk); returns the root on screen
//   liveOf(el)                   the element on screen that a node of a tree drawn this way stands for (itself if it went on screen)
//   onMounted(tree, fn)          runs fn once the tree is on screen (a picture measured from the screen: the distribute arcs)
//   onRedraw(root, fn)           calls fn after every redraw of root's Mat, kept or not (instead of watching its children)
//
// The rules for a row (data-rk is its index, its kind and what it says, so a row that says something else is a new row):
//   - an animation plays once: a row on screen that is settled (is-settled) stays settled, and a row that is not is settled once its
//     animations are over (data-settle-ms after it first appeared, 2.4 s unless the row says otherwise), so no redraw starts one again;
//   - inside a row, elements are matched by data-tok or data-fk, else by place and tag, so a term held or typed into stays the same element.

const live = new WeakMap();            // node of a drawn tree -> the element on screen it was laid onto
const born = new WeakMap();            // row on screen -> when it appeared (performance.now())
const mounted = new WeakMap();         // tree -> what to run once it is on screen
const SETTLE_MS = 2400;
const REDRAW = 'mat:redraw';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const first = (el) => el.classList?.[0] ?? '';

export const liveOf = (el) => live.get(el) ?? el;

export function onMounted(tree, fn) {
  const list = mounted.get(tree) ?? [];
  list.push(fn);
  mounted.set(tree, list);
}

export function onRedraw(root, fn) {
  const obs = new MutationObserver(fn);
  obs.observe(root, { childList: true });
  const on = () => queueMicrotask(fn);
  root.addEventListener(REDRAW, on);
  return () => { obs.disconnect(); root.removeEventListener(REDRAW, on); };
}

export function redrawMat(container, next) {
  const old = container.firstElementChild;
  const holder = next.querySelector?.('.lb-rowwrap')?.parentElement ?? null;
  if (!old || container.children.length !== 1 || !holder || old.tagName !== next.tagName || first(old) !== first(next)) {
    container.replaceChildren(next);
    stamp(container);
    runMounted(next, next);
    return next;
  }
  const path = new Set();
  for (let n = holder; n && n !== next; n = n.parentElement) path.add(n);
  path.add(next);
  layPath(old, next, path, holder);
  runMounted(next, old);
  container.dispatchEvent(new Event(REDRAW));
  return old;
}

function runMounted(tree, root) {
  const list = mounted.get(tree);
  if (!list) return;
  mounted.delete(tree);
  for (const fn of list) fn(root);
}

// a row that has just appeared remembers when (to know when its animations are over)
function stamp(scope) {
  const t = now();
  for (const r of scope.querySelectorAll?.('.lb-rowwrap[data-rk]') ?? []) if (!born.has(r)) born.set(r, t);
}

// the elements that hold the rows, from the root down: kept, with the new tree's attributes; their other children are the new tree's
function layPath(a, b, path, holder) {
  attrs(a, b);
  live.set(b, a);
  if (b === holder) { layRows(a, b); return; }
  const used = new Set();
  const want = [...b.childNodes].map((c) => {
    if (!path.has(c)) return c;
    const o = [...a.children].find((x) => !used.has(x) && x.tagName === c.tagName && first(x) === first(c));
    if (!o) return c;
    used.add(o);
    layPath(o, c, path, holder);
    return o;
  });
  place(a, want);
}

function layRows(a, b) {
  const old = new Map();
  for (const r of a.children) if (r.dataset?.rk && !old.has(r.dataset.rk)) old.set(r.dataset.rk, r);
  const t = now();
  const want = [...b.childNodes].map((c) => {
    const o = c.nodeType === 1 && c.dataset.rk ? old.get(c.dataset.rk) : null;
    if (!o || o.tagName !== c.tagName) return c;
    old.delete(c.dataset.rk);
    const settleAfter = Number(c.dataset.settleMs ?? SETTLE_MS);
    if (o.classList.contains('is-settled') || t - (born.get(o) ?? t) >= settleAfter) c.classList.add('is-settled');
    morph(o, c);
    return o;
  });
  place(a, want);
  stamp(a);
}

// lay b onto a (the same tag): a gets b's attributes and, child by child, b's children
function morph(a, b) {
  attrs(a, b);
  live.set(b, a);
  const keyed = new Map();
  const loose = [];
  for (const n of a.childNodes) {
    const k = keyOf(n);
    if (k && !keyed.has(k)) keyed.set(k, n); else loose.push(n);
  }
  let j = 0;
  const want = [...b.childNodes].map((c) => {
    const k = keyOf(c);
    if (k) {
      const o = keyed.get(k);
      if (o && o.tagName === c.tagName) { keyed.delete(k); morph(o, c); return o; }
      return c;
    }
    const o = loose[j];
    if (o && o.nodeType === c.nodeType && (o.nodeType !== 1 || (o.tagName === c.tagName && !keyOf(o)))) {
      j += 1;
      if (o.nodeType === 1) morph(o, c);
      else if (o.nodeValue !== c.nodeValue) o.nodeValue = c.nodeValue;
      return o;
    }
    return c;
  });
  place(a, want);
}

const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-tok') ?? n.getAttribute('data-fk') : null);

function attrs(a, b) {
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of b.attributes) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  if ('disabled' in b && a.disabled !== b.disabled) a.disabled = b.disabled;
}

// a's children become `want` (its own children kept, in order, never moved when they are already in order: a moved element would
// start its animations again)
function place(a, want) {
  const keep = new Set(want.filter((n) => n.parentNode === a));
  for (const n of [...a.childNodes]) if (!keep.has(n)) n.remove();
  let at = a.firstChild;
  for (const n of want) {
    if (n === at) { at = at.nextSibling; continue; }
    a.insertBefore(n, at);
  }
}
