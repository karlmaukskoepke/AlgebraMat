// What this visit (this page load) has already shown: the one-time "Find the value of x." on the very first problem (Build D, Part 1).

let first = true;
export const firstOpen = () => first;
export const closeFirst = () => { first = false; };
// Something played ahead and thrown away (the honest path that chooses a problem's text size, Build S) leaves this visit as it was.
export function asItWas(fn) {
  const was = first;
  try { return fn(); } finally { first = was; }
}
