// The "Lights" experiment on Add to both sides (SPEC-LIGHTS-EXPERIMENT-ADD.md, behind ?ui=lights, Levels 2–3 only). A wrapper round
// the card's own reducer (addBothMoves.js), which runs unchanged: the move still goes through its `go`, Undo through its `undo`.
// What the wrapper adds:
//   (A) a preview of the move on the equation: pure view state, `s.ui.preview` (the tuckedLayout.js pattern);
//   (B) the amount typed into a blank in that equation row, applied with Enter or ✓, then a rule line and a green Next that commits
//       the move (Undo no longer reaches it); typing in x = or Check commits it too;
//   (C) no Guess x / Use a move choice: the engine's `path` is set just in time from "is x alone on the newest row?", so x = [ ] and
//       the Add move are both live from the first frame. A correct guess on the original asks for the move on the same problem.
// It also counts what the first classroom test needs (`s.lx.log`). No DOM here.

import { reduceAddBoth, newAddBoth, xAlone, xSideOf } from './addBothMoves.js';
import { isTyping } from './entry.js';

const UI0 = { preview: false, focus: null, shake: false };
const ui = (s) => s.ui ?? UI0;
const withUi = (s, patch) => ({ ...s, ui: { ...ui(s), ...patch } });
const sameUi = (a, b) => JSON.stringify(ui(a)) === JSON.stringify(ui(b));

const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...(s.feedback?.params ?? {}), ...params }, bad }; return s; };

export function newLightsSession(problem, opts = {}) {
  const s = newAddBoth(problem, { ...opts, forceMove: false });
  s.allowZero = true;                     // a 0 in the blank is allowed (it simply does not help)
  s.lx = {
    awaitNext: null,                      // the row a just-applied move left, waiting for its Next
    rules: [],                            // rows whose move was committed (a solid rule line under each)
    guessedRight: false,                  // a correct guess on the original: the problem is still done with a move
    lastSub: null,                        // that guess's substitution, still shown while the move is owed
    moves: 0,                             // moves applied (Undo does not take them back off this count)
    log: { previews: 0, chosenAfterPreview: 0, chosenCold: 0, typedBeforeMove: false, sameSignRed: 0, nextPressed: 0, implicitCommits: 0, stuck: 0, teach: 0 },
  };
  s.ui = { ...UI0 };
  return say(s, 'lxFindX');
}

// Is the bare move open (S2/S3): the blank in the equation row holds the cursor?
export const blankOpen = (s) => s.menu === 'add' && !s.scaffold && s.stage === 'moves' && !s.sub && !s.pending && !s.combining;
// Can the Add move be previewed or chosen right now (S0)?
export const canChoose = (s) => s.stage === 'moves' && !s.scaffold && !s.sub && !s.pending && !s.combining && !s.resolving && s.menu !== 'add';
// The move is owed (a correct guess on the original) and x is not alone yet: x = [ ] is greyed and Add pulses.
export const moveOwed = (s) => Boolean(s.lx?.guessedRight) && s.stage === 'moves' && !xAlone(s.board);
// Do keys go to the blank (true) or to x = (false)? The open blank wins until it is applied or cancelled, or x = is tapped.
export const amountMode = (s) => s.menu === 'add' && s.typing !== 'answer' && (!s.pending || s.pending.second) && !s.combining;

// Is x = [ ] live? Always, from the first frame, except while a substitution is stepped, while the move is owed, and in the
// scaffold until x is alone (as built).
export function lightsAnswerLive(s) {
  if (s.stage === 'done' || s.stage === 'build') return false;
  if (s.combining) return s.combining.step === 'count';
  if (s.sub) return s.sub.kind === 'value' && s.sub.step >= 3 && !s.sub.ok;
  if (moveOwed(s)) return false;
  if (s.scaffold) return xAlone(s.board) && !s.pending && !s.resolving;
  return !s.pending && !s.resolving;
}

const amountOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : null);
const xConstant = (board) => board[xSideOf(board)].filter((t) => t.kind === 'num').reduce((a, t) => a + t.v, 0);

// The move waiting for its Next is committed: Undo no longer reaches it and its rule line goes solid.
function commit(s, how) {
  if (s.lx.awaitNext === null) return s;
  s.lx.rules = [...s.lx.rules, s.lx.awaitNext];
  s.lx.awaitNext = null;
  s.history = [];
  if (how === 'next') s.lx.log.nextPressed += 1; else s.lx.log.implicitCommits += 1;
  return s;
}

// The engine's path, set just in time: a typed value is a guess while x is not alone on the newest row, a final value once it is.
const pathFor = (s, answer) => (s.scaffold || !answer ? 'move' : xAlone(s.board) ? 'move' : 'guess');

export function withLights(reduce = reduceAddBoth) {
  return (state, action) => {
    // ----- view state only -----
    if (action.type === 'ui') {
      const patch = { ...action.patch };
      if (patch.preview && !canChoose(state)) return state;
      const next = withUi(state, patch);
      if (sameUi(next, state)) return state;
      return patch.preview ? countPreview(next) : next;
    }
    if (state.stage === 'done') return state;

    // Esc (or a second tap on the icon): S2 goes back to S0; a preview just goes away.
    const cancel = (st) => {
      const s = structuredClone(st);
      s.menu = null; s.amountEntry = ''; s.typing = null; s.hint = null;
      s.ui = { ...UI0, focus: 'add' };                              // focus goes back to the Add icon
      return say(s, moveOwed(s) ? 'lxShowMove' : 'lxFindX');
    };
    if (action.type === 'lxCancel') {
      if (blankOpen(state)) return cancel(state);
      return ui(state).preview ? withUi(state, { preview: false }) : state;
    }

    // ----- Next: the move just applied is committed -----
    if (action.type === 'lxNext') {
      if (state.lx.awaitNext === null) return state;
      const s = commit(structuredClone(state), 'next');
      s.ui = { ...UI0, focus: 'answer' };
      return s;
    }

    // ----- choosing the move: preview first on touch, a second tap (or Esc) cancels -----
    if (action.type === 'choose' && action.move === 'add') {
      if (blankOpen(state)) return cancel(state);
      if (action.touch && !ui(state).preview && canChoose(state)) return reduceUi(state, { preview: true });
    }

    // ----- apply with an empty or unreadable blank: the box shakes, nothing else -----
    if (action.type === 'go' && blankOpen(state) && amountOf(state.amountEntry) === null) return withUi(state, { shake: true, preview: false, focus: 'blank' });

    const typingAnswer = isTyping(action) && !amountMode(state);
    if ((typingAnswer || (action.type === 'focus' && action.target === 'answer')) && moveOwed(state)) return state;   // greyed

    // the input to the engine: the path set just in time, the waiting move committed when the student goes on without Next
    let input = state;
    const prep = () => { if (input === state) input = structuredClone(state); return input; };
    if (state.lx.awaitNext !== null && (typingAnswer || ['check', 'choose', 'stuck', 'teach'].includes(action.type))) {
      commit(prep(), 'implicit');
    }
    if (!state.sub) {
      const answer = typingAnswer || action.type === 'check' || (action.type === 'focus' && action.target === 'answer');
      const path = pathFor(state, answer);
      if (state.path !== path) prep().path = path;
    }

    const s = reduce(input, action);
    if (s === input) return input;                                  // the engine did nothing (an implicit commit still counts)
    s.ui = { ...UI0 };
    const lx = s.lx;
    lx.previewed = false;                                           // the next preview is a new look

    switch (action.type) {
      case 'choose':
        if (s.menu === 'add' && !state.menu) {
          if (ui(state).preview) lx.log.chosenAfterPreview += 1; else lx.log.chosenCold += 1;
          s.ui.focus = 'blank';
          say(s, 'aPickAmount');
        }
        break;
      case 'setAmount':
        s.ui.focus = 'blank';
        break;
      case 'go': {
        if (s.history.length <= state.history.length && !s.scaffold) break;    // the engine said no (too big, say)
        if (s.scaffold) break;
        lx.moves += 1;
        const before = state.board;
        const amount = s.lastAmount;
        if (s.lights.fewer === 'red' && state.history.length === 0 && Math.sign(amount) === Math.sign(xConstant(before))) lx.log.sameSignRed += 1;
        if (amount === 0) say(s, 'lxZero', {}, false);
        if (s.lights.fewer === 'green' && !s.zeroOther) {
          lx.awaitNext = s.rows.length - 1;
          s.ui.focus = 'next';
        }
        break;
      }
      case 'undo':
        if (lx.awaitNext !== null && lx.awaitNext >= s.rows.length) lx.awaitNext = null;
        lx.rules = lx.rules.filter((r) => r < s.rows.length);
        if (blankOpen(s)) s.ui.focus = 'blank';                                     // back to S2: the box cleared and focused
        break;
      case 'startOver':
        lx.awaitNext = null;
        lx.rules = [];
        say(s, moveOwed(s) ? 'lxShowMove' : 'lxFindX');
        break;
      case 'nextLine':
        // a correct guess on the original: not done yet, the move is owed on this problem (the field greys, Add pulses)
        if (s.stage === 'done' && s.sub?.kind === 'guess' && s.sub.ok) {
          lx.guessedRight = true;
          lx.lastSub = s.sub;
          Object.assign(s, { stage: 'moves', step: 'moves', sub: null, entry: '', path: 'move', menu: null, typing: null, finalText: null });
          say(s, 'lxShowMove');
        }
        break;
      case 'stuck':
        lx.log.stuck += 1;
        if (blankOpen(s)) s.ui.focus = 'blank';
        break;
      case 'teach':
        lx.log.teach += 1;
        break;
      case 'check':
        break;
      default:
        break;
    }
    if (typingAnswer && s.entry !== state.entry && lx.moves === 0 && !s.scaffold) lx.log.typedBeforeMove = true;
    if (!moveOwed(s)) lx.lastSub = null;
    if (s.feedback?.key === 'aChoose') say(s, 'lxFindX');
    return s;
  };
}

// A preview is counted once per episode: hovering on and off the icon again before doing anything else is the same look.
function countPreview(s) {
  if (s.lx.previewed) return s;
  return { ...s, lx: { ...s.lx, previewed: true, log: { ...s.lx.log, previews: s.lx.log.previews + 1 } } };
}
const reduceUi = (state, patch) => countPreview(withUi(state, patch));

// One line per finished problem, for the first test (§6).
export function lightsSummary(s) {
  const l = s.lx.log;
  return {
    t: Date.now(), level: s.problem.logLevel ?? s.level, previews: l.previews, previewedBeforeChoose: l.chosenAfterPreview > 0,
    chosenCold: l.chosenCold, typedBeforeMove: l.typedBeforeMove, sameSignRed: l.sameSignRed,
    nextPressed: l.nextPressed, implicitCommits: l.implicitCommits, stuck: l.stuck, teach: l.teach, guessedRight: s.lx.guessedRight,
  };
}
