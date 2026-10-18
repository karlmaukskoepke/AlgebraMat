// The spotlight message (Build C, Part 2), the logic half; the view half is view/spotlight.js. Shared by every Solve it card.
//   - An ERROR (a move that made things worse or only partly worked, a guess that does not balance, a wrong value, a fraction that
//     does not split, help asked while a move waits for Undo) is shown as a pop-up next to the thing that is wrong, with the rest
//     of the page dimmed. Undo is the only way out: every other action is ignored while it is up.
//   - After that Undo, a HINT pops up at the number or move it is about (the card's existing reminder for the state Undo returned
//     to), with the move highlighted. It goes when the student starts the move, or taps Got it.
// A card supplies `error(s)` → { target, label, clear? } | null (what to light and its small label; `clear` when the card's own Undo has
// nothing to take back, as after a wrong value, so Undo only closes the pop-up), and `hint(s)` → { target, key, params, move } | null,
// applied to the state Undo returned to (it may also set the card's own outline, `s.hint`). The pop-up's text is the line's message
// (`s.feedback`); the line itself then shows the prompt. No DOM here.

const STARTS_THE_MOVE = new Set(['choose', 'go', 'take', 'stuck', 'teach', 'check', 'digit', 'toggleSign', 'backspace', 'setAmount']);

// The spotlight the screen draws for this state, or null.
export function spotOf(s, card) {
  if (s.stage === 'done') return null;
  const err = card.error(s);
  if (err) return { kind: 'error', ...err };
  if (s.spot?.kind === 'hint') return s.spot;
  return card.ask?.(s) ?? null;                     // a question the card is asking at a place on the screen (light dim, no gate)
}

export function withSpotlight(reduce, card) {
  return (state, action) => {
    const err = state.stage === 'done' ? null : card.error(state);
    if (err) {
      if (action.type !== 'undo') return state;                                  // Undo is the only way out
      const before = state.reds ?? 0;
      let s = err.clear ? structuredClone(state) : reduce(state, action);
      if (s === state) s = structuredClone(state);
      if (err.clear) card.clear(s);
      // the red count survives the Undo it asks for, so three reds in a row still offer Start over
      if (!err.clear && typeof s.reds === 'number' && card.keepsReds?.(state)) {
        s.reds = before;
        if (card.startOverAt && before >= card.startOverAt) s.startOver = true;
      }
      const h = card.hint(s);
      s.spot = h ? { kind: 'hint', target: h.target, move: h.move ?? null } : null;
      if (h) s.feedback = { key: h.key, params: { ...(s.feedback?.params ?? {}), ...(h.params ?? {}) }, bad: false };
      return s;
    }
    if (state.spot && action.type === 'spotDismiss') return { ...state, spot: null, feedback: { key: card.prompt(state), params: state.feedback?.params ?? {}, bad: false } };
    let s = reduce(state, action);
    // errors on this problem are counted (Teach me appears after the second: Build D, Part 1)
    if (s !== state && s.stage !== 'done' && card.error(s)) s = { ...s, errors: (state.errors ?? 0) + 1 };
    if (s === state || !s.spot) return s;
    // the hint goes once the student starts the move (a hover on the highlighted move counts) or does anything else
    const preview = action.type === 'ui' && action.patch?.preview === true;
    if (preview || STARTS_THE_MOVE.has(action.type) || action.type === 'undo' || action.type === 'startOver') {
      // the hint's words go with it: the line goes back to the prompt, unless the action said something of its own
      const said = JSON.stringify(s.feedback) !== JSON.stringify(state.feedback);
      return { ...s, spot: null, ...(said ? {} : { feedback: { key: card.prompt(s), params: s.feedback?.params ?? {}, bad: false } }) };
    }
    return s;
  };
}
