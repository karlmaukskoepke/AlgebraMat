// The two save-code dialogs: showing a code, and typing one in.

const BAD_CODE = 'That code doesn’t look right — check each letter.';

function dialog() {
  const d = document.getElementById('dialog');
  if (d.open) d.close();
  return d;
}

export function showSaveCode(code) {
  const d = dialog();
  d.innerHTML = `
    <h2>Your save code</h2>
    <p class="code" aria-label="${[...code].join(' ')}">${code}</p>
    <p>Write it down. On any device, tap <b>Enter code</b> and type it to get your levels back.</p>
    <div class="dialog-actions"><button type="button" class="btn btn-primary" data-close>Done</button></div>`;
  d.querySelector('[data-close]').onclick = () => d.close();
  d.showModal();
}

// onCode(text) returns true if the code was accepted.
export function askForCode(onCode) {
  const d = dialog();
  d.innerHTML = `
    <form class="code-form">
      <h2>Enter a save code</h2>
      <label for="code-input">Type the code exactly as it was written.</label>
      <input id="code-input" name="code" autocomplete="off" autocapitalize="characters"
        spellcheck="false" maxlength="12" placeholder="MAT-····" />
      <p class="code-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="btn" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Restore</button>
      </div>
    </form>`;
  const form = d.querySelector('form');
  const input = d.querySelector('input');
  const error = d.querySelector('.code-error');
  d.querySelector('[data-close]').onclick = () => d.close();
  input.oninput = () => { error.hidden = true; };
  form.onsubmit = (e) => {
    e.preventDefault();
    if (onCode(input.value)) {
      d.close();
    } else {
      error.textContent = BAD_CODE;
      error.hidden = false;
      input.select();
    }
  };
  d.showModal();
  input.focus();
}
