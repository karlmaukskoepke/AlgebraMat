// Normalizes the BASE_PATH env value into a Vite `base`.
// The site may live at a domain root or a sub-path (e.g. /AlgebraMat/ on
// GitHub Pages, or a sub-path of grafables.com later).
export function resolveBase(raw) {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}
