// Reading a sentence aloud with the browser's built-in speech (it works offline, which matters on Chromebooks).
// A student can turn the sound off, it's remembered on the device, and nothing breaks where speech isn't there.

const KEY = 'mat.sound.v1';

function read() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

let on = read();

export const soundOn = () => on;

export function setSound(value) {
  on = Boolean(value);
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage blocked: the choice lasts this visit */ }
  if (!on) stop();
}

function stop() {
  try { window.speechSynthesis?.cancel(); } catch { /* no speech here */ }
}

export function speak(text) {
  if (!on || !text) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    synth.speak(utterance);
  } catch { /* no speech here */ }
}
