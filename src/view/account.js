import { showGoogleButton } from '../googleSignIn.js';

// The class-sheet dialog (SPEC-SYNC.md): paste the class link (once), then sign in with a period and a student number.
// Signed in, it shows who and when it last saved. No names anywhere.

const HELP = 'Your teacher gives you a period and a student number (no names). Your levels and scores are saved to your teacher’s class sheet, and you can get them back on any device.';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function dialog() {
  const d = document.getElementById('dialog');
  if (d.open) d.close();
  return d;
}

const ago = (t) => {
  if (!t) return 'not yet';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// `sync` is the object from sync.js. `onDone` runs when the dialog closes after a change (so the map redraws).
export function showAccount(sync, onDone = () => {}) {
  const d = dialog();
  let changed = false;
  const status = sync.status();

  const close = () => { d.close(); if (changed) onDone(); };
  const draw = (message = '', bad = false) => {
    const s = sync.status();
    let body;
    if (s.state === 'off') {
      body = `
        <form class="code-form" data-form="link">
          <h2>Sign in to save your progress</h2>
          <p>${HELP}</p>
          <label for="class-link">Paste the class link your teacher gave you.</label>
          <input id="class-link" name="link" autocomplete="off" spellcheck="false" placeholder="https://script.google.com/…" />
          <p class="code-error" role="alert" ${message ? '' : 'hidden'}>${esc(message)}</p>
          <div class="dialog-actions"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn btn-primary">Next</button></div>
        </form>`;
    } else if (s.state === 'signed-out') {
      const info = sync.classInfo();
      const google = info?.google;
      const numbers = !google || info?.numberSignin;
      const fields = `
          <label for="who-period">Period</label>
          <input id="who-period" name="period" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" inputmode="text" />
          <label for="who-number">Student number</label>
          <input id="who-number" name="number" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" inputmode="text" />`;
      body = info?.retired ? `
        <h2>This class sheet has retired</h2>
        <p>Your progress is still saved on this device. Use <b>Save code</b> to keep a copy.</p>
        <div class="dialog-actions"><button type="button" class="btn btn-primary" data-close>OK</button></div>` : `
        <form class="code-form" data-form="who">
          <h2>Sign in</h2>
          ${google ? '<p>Sign in with your school Google account. That is all: nothing to type. Your name and email are not saved.</p>' : ''}
          ${numbers ? fields : ''}
          ${google ? '<div class="google-holder" data-google></div>' : ''}
          <p class="code-error" role="alert" ${message ? '' : 'hidden'}>${esc(message)}</p>
          <div class="dialog-actions"><button type="button" class="btn" data-close>Cancel</button>${numbers ? `<button type="submit" class="btn ${google ? '' : 'btn-primary'}">${google ? 'Sign in with only my number' : 'Sign in'}</button>` : ''}</div>
        </form>`;
    } else {
      body = `
        <h2>Saved to your class</h2>
        <p>Signed in as <b>${esc(s.label)}</b>.</p>
        <p>Last saved: ${esc(ago(s.lastSync))}.${s.error ? ` <span class="code-error">${esc(s.error)}</span>` : ''}</p>
        <p class="code-error" role="alert" ${message ? '' : 'hidden'}>${esc(message)}</p>
        <div class="dialog-actions">
          <button type="button" class="btn" data-signout>Sign out</button>
          <button type="button" class="btn" data-now>Save now</button>
          <button type="button" class="btn btn-primary" data-close>Done</button>
        </div>`;
    }
    d.innerHTML = body;
    d.querySelector('[data-close]').onclick = close;
    const form = d.querySelector('form');
    if (form?.dataset.form === 'link') {
      form.onsubmit = (e) => {
        e.preventDefault();
        if (sync.setEndpoint(form.link.value)) { changed = true; draw(); } else draw('That doesn’t look like the class link. Paste the whole thing.', true);
      };
    }
    const holder = d.querySelector('[data-google]');
    if (holder) {
      showGoogleButton(holder, sync.classInfo().google, async (idToken) => {
        holder.textContent = 'Signing in…';
        const res = await sync.signIn({ mode: 'google', idToken });
        if (res.ok) { changed = true; d.close(); } else draw(res.error, true);   // signed in: the dialog closes by itself
      }).catch((e) => { holder.textContent = e.message; });
    }
    if (form?.dataset.form === 'who') {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const button = form.querySelector('[type=submit]');
        button.disabled = true;
        button.textContent = 'Signing in…';
        const res = await sync.signIn({ period: form.period.value, number: form.number.value });
        if (res.ok) { changed = true; d.close(); } else draw(res.error, true);
      };
    }
    d.querySelector('[data-signout]')?.addEventListener('click', () => { sync.signOut(); changed = true; draw(); });
    d.querySelector('[data-now]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Saving…';
      const res = await sync.now();
      changed = true;
      draw(res.ok ? '' : res.error, !res.ok);
    });
    d.querySelector('input')?.focus();
  };

  d.showModal();
  if (status.state === 'signed-out' && !sync.classInfo()) {
    d.innerHTML = '<p>Checking with your class…</p>';
    sync.probe().then(() => draw());
  } else draw();
  d.addEventListener('close', () => { if (changed) onDone(); }, { once: true });
  return status;
}

// The button's words on the pack map.
export function accountLabel(status) {
  if (status.state === 'ready' || status.state === 'syncing') return `✓ ${status.label}`;
  if (status.state === 'error') return `⚠ ${status.label}`;
  return 'Sign in';
}
