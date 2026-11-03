// The no-help switch (Build Z, "test out"): while a student tests out of a locked level, the screen offers no help of any kind. The
// spotlight draws nothing (no error pop-up, no hint after Undo, no question), the nudges and I'm stuck's idle flash stay quiet, and the
// help buttons are hidden (style.css, `#play.is-testout`). The engine half of the session is cleaned in engine/testOut.js. One switch for
// the whole page, on only while a test-out is on the screen. Pure state, no DOM.

let on = false;
export const noHelp = () => on;
export function setNoHelp(value) { on = Boolean(value); }
