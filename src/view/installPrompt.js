// "Full screen on your phone": a web page can't hide a phone browser's bars, but a home-screen app has none. On a phone
// (not already installed, not dismissed) the pack map shows a bar. Android's Chrome can install with one tap; iPhone's
// Safari has no such button, so the bar shows the two taps (Share, Add to Home Screen).

const DISMISSED = 'mat.install.v1';
let deferred = null;   // Chrome's install prompt, kept until the button is pressed

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { deferred = null; });
}

const read = () => { try { return localStorage.getItem(DISMISSED); } catch { return null; } };
const write = () => { try { localStorage.setItem(DISMISSED, '1'); } catch { /* private window: it just shows again */ } };

const installed = () => window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
const onPhone = () => window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;

// The bar, or null when it isn't wanted. `h` is the pack map's element helper.
export function installBar(h) {
  if (installed() || !onPhone() || read()) return null;
  const steps = h('p', { class: 'install-steps', hidden: true },
    'In Safari, tap the Share button, then “Add to Home Screen”. Open The Mat from your home screen and the browser’s bars are gone. The home-screen app keeps its own progress, so tap Save code here first and use Enter code there.');
  const bar = h('section', { class: 'install-bar', 'aria-label': 'Full screen' },
    h('p', { class: 'install-text' }, 'Want more room? Put The Mat on your home screen to use the whole screen.'),
    h('div', { class: 'install-actions' },
      h('button', { type: 'button', class: 'btn btn-primary', 'data-install': 'go' }, 'Go full screen'),
      h('button', { type: 'button', class: 'btn', 'data-install': 'no' }, 'Not now')),
    steps);
  bar.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-install]')?.dataset.install;
    if (act === 'no') { write(); bar.remove(); }
    if (act === 'go') {
      if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; bar.remove(); } else steps.hidden = !steps.hidden;
    }
  });
  return bar;
}
