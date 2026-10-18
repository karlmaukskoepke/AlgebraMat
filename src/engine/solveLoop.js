// The Solve it loop (SPEC-SOLVE-IT-LOOP.md), built once. Every card configures it and never re-implements it. The loop owns:
//   - the choice at every state where x is not alone (guess x, or use a move), and the greyed-out rules that follow;
//   - guesses and the final value: the substitution (the value placed on x, then worked out an operation at a time, a click a
//     line), a wrong guess checked in the CURRENT equation, a wrong value or a correct answer in the ORIGINAL one;
//   - the forced-move rule (a correct guess at the first state, with no move made, forces the next problem to be a move);
//   - committing a move: a helpful move writes the new equation and the choice returns at once, with the same prompt; the move
//     folds to one row the moment the student acts on the choice (guess, move, or help), and Undo reaches only an unfolded
//     move, returning to the same state with the choice showing; an unhelpful move waits for Undo;
//   - Undo (only the current, unfolded move), Start over (always live except on the untouched original), the help ladder
//     (rungs restart at each state), the stuck count, and the answer row's rules.
// A card (Add to both sides, Divide it, Flip it, ...) is a config: its board, its moves (`reduce`), its lights, its slips and
// its scaffold pictures. Pure logic, no DOM.

import { typeInto, isTyping } from './entry.js';
import { signed, substitutionLines, boardText } from './solveTerms.js';

// What a card supplies:
//   id                 'add-both'
//   startBoard(p)      the original equation's board
//   alone(board)       is x alone on its side (so the typing row goes live)?
//   extra(p, opts)     the card's own state fields
//   snapshotExtra(s)   the card's fields a move changes (restored by Undo)
//   resetState(s)      the card's fields back to a bare state (a new equation state, or Start over)
//   tag(p, typed)      the slip tag of a wrong typed value (null when right)
//   slip(s, typed, tag) the line for a wrong value: { key, params }
//   collapse(level)    does the substitution check collapse at this level? (never, on a single-step card)
//   reduce(s, action, api)  the card's own actions: undefined (not mine), 'ignore' (no change), or the changed state
//   rungs              [reminder, model, choose, guided]: each (s, api) => s, the n-th ask in a state
//   teach(s, api)      Teach me: the scaffold on a forced path
//   answerBlocked(s)   something of the card's is open that holds the typing row back (an amount, a pending deal)
//   answerOpen(s)      the card lets the typing row be live although x is not alone (a reminder scaffold, a diagram)
//   nextNeeded(s)      after a wrong guess is undone: mark the next needed move
//   waitingForUndo(s)  a try of the card's own waits for Undo outside `needUndo` (Divide's failed fraction); undoReason(s) says why
// The choice prompt: one string for every card and every state (loop §1A). No state may reword it.
export const CHOICE_PROMPT = 'Would you like to guess the solution (the value of x), or use a move to make the problem simpler?';
export const CHOICE_BUTTONS = [['Guess x', 'guess'], ['Use a move', 'move']];

// I'm stuck or Teach me while a move waits for Undo (Build A): the first rung is one sentence saying what happened, with Undo the
// one highlighted target, and no other help opens. It counts as the click it was, and the class sheet records it as a reminder
// ('hint'). Used by every card on the loop, and by Add to both sides, which is not on the loop yet.
export function undoFirst(s, say, reason) {
  s.helped = true;
  if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint');
  return say(s, 'aUndoFirstHelp', { reason });
}

export function createSolveLoop(card) {
  const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...(card.params?.(s) ?? {}), ...params }, bad }; return s; };

  // ---------- state ----------
  function newSession(problem, { level = 2, forceMove = false, ...opts } = {}) {
    const board = card.startBoard(problem);
    const s = {
      problem, level, stage: 'moves', step: 'moves', path: forceMove ? 'move' : null, mustMove: forceMove,
      board, base: board, rows: [{ type: 'eq', board }], moveStart: 1, history: [], menu: null, typing: null, entry: '', sub: null,
      lights: card.noLights(), reds: 0, hint: null, rung: 0, scaffold: false, forced: false, unfolded: false, foldLabel: '', needUndo: false,
      stuck: 0, taught: 0, wrongs: 0, tag: null, tags: [], answers: [], helped: false, clean: false, skipped: [], supportsShown: [],
      guessedFirst: false, finalText: null, feedback: null, ...card.extra(problem, { level, ...opts }),
    };
    return say(s, forceMove ? (card.mustMoveKey?.(s) ?? 'aMustMove') : 'aChoose');
  }

  const snapshot = (s) => ({ board: s.board, rows: [...s.rows], lights: s.lights, reds: s.reds, menu: s.menu, hint: s.hint, unfolded: false, needUndo: false, ...card.snapshotExtra(s) });
  const restore = (s, snap) => Object.assign(s, snap);
  const pushHistory = (s) => { s.history.push(snapshot(s)); };

  // The state is bare again: nothing chosen, no scaffold, the ladder back at its first rung. (The stuck count is kept.)
  function bareState(s) {
    Object.assign(s, { path: s.mustMove && s.rows.length === 1 ? 'move' : null, menu: null, typing: null, hint: null, rung: 0, scaffold: false, forced: false, needUndo: false });
    card.resetState(s);
    return s;
  }

  const alone = (s) => card.alone(s.board);
  // Has the student done anything on this problem? Start over is greyed on the untouched original.
  const touched = (s) => s.rows.length > 1 || s.history.length > 0 || s.path !== null || Boolean(s.sub) || s.entry !== '' || s.unfolded || card.touched?.(s) === true;
  const helpOk = (s) => s.stage !== 'done' && (!s.sub || (s.sub.step >= subTotal(s.sub) && !s.sub.ok));
  const startOverOk = (s) => s.stage !== 'done' && touched(s);

  // Is the x = [ ] row live? Greyed before the choice (while x is not alone), while a move waits for Next or Undo, while a
  // substitution is stepped, and when the problem is done.
  function answerLive(s) {
    if (s.stage === 'done' || s.needUndo) return false;
    if (s.sub) return s.sub.kind === 'value' && s.sub.step >= subTotal(s.sub) && !s.sub.ok;
    if (card.answerBlocked?.(s)) return false;
    if (s.unfolded) return alone(s);
    return s.path === 'guess' || alone(s) || card.answerOpen?.(s) === true;
  }

  // The substitution: lines, then the mark. Collapsed: the first line, then the mark (a wrong value is always full).
  const subTotal = (sub) => (sub.collapsed ? 2 : sub.lines.length + 1);
  // What of the check is on screen: the lines written so far (the first appears when the value is placed on x), and the mark.
  const subView = (sub) => ({ lines: sub.collapsed ? (sub.step >= 1 ? [sub.lines[0]] : []) : sub.lines.slice(0, Math.min(sub.step, sub.lines.length)), mark: sub.step >= subTotal(sub), last: sub.step - 1, landed: Boolean(sub.landed) });

  // ---------- committing a move ----------
  // A move that the card has worked out: `rows` are the work rows and the new equation, `next` the new board, `label` the folded
  // row's words, `helpful` whether the lights say it helped. Returns the state with its message left to the card.
  function commit(s, { rows, next, label, helpful, lights }) {
    s.rows.push(...rows);
    s.board = next;
    s.lights = lights ?? s.lights;
    s.menu = null;
    s.hint = null;
    s.typing = null;
    if (helpful) {
      s.reds = 0;
      s.needUndo = false;
      s.scaffold = false;                                                      // the new equation state starts bare
      s.rung = 0;
      s.forced = false;
      if (!alone(s)) { s.unfolded = true; s.foldLabel = label; s.path = null; } // a new equation state: the choice returns at once; the move folds when it is acted on
    } else {
      s.reds += 1;
      s.needUndo = true;                                                       // an unhelpful move waits for Undo
    }
    return s;
  }
  const tryStuck = (s) => s.reds >= 3;
  // A move (or the card's own try) waits for Undo.
  const waiting = (s) => !s.sub && (s.needUndo || card.waitingForUndo?.(s) === true);

  // A move gets in only on the move path, with nothing waiting on Next or Undo.
  function blockMove(s) {
    if (s.stage !== 'moves' || s.sub) return 'ignore';
    if (s.needUndo) return say(s, 'aUndoFirst', {}, true);
    if (!s.path) return say(s, 'aChooseFirst', {}, true);
    if (s.path === 'guess') return say(s, 'aGuessing');
    return null;
  }

  function finish(s, key) {
    s.stage = 'done';
    s.step = 'done';
    s.clean = s.wrongs === 0 && s.stuck === 0 && s.taught === 0 && !s.helped;
    s.finalText = signed(s.problem.x);
    return say(s, key, { answer: s.finalText });
  }

  // The move just made is folded to one row, and nothing before it can be undone: the equation state it led to is the new
  // starting point. (Acting on the choice, or asking for help, commits it.)
  function fold(s) {
    s.pic = null;                                                                       // the scaffold picture the move left behind goes with the fold
    if (!s.unfolded) return;
    s.rows = [...s.rows.slice(0, s.moveStart), { type: 'fold', label: s.foldLabel, board: s.board }];
    s.moveStart = s.rows.length;
    s.history = [];
    s.unfolded = false;
  }

  // Help from the guess path moves the state into move mode.
  function moveMode(s) {
    s.sub = null;
    if (s.path !== 'move') { s.path = 'move'; if (!alone(s)) s.entry = ''; s.typing = null; }
  }

  const api = { say, commit, pushHistory, snapshot, restore, blockMove, finish, alone, bareState, tryStuck, fold };

  // ---------- the reducer ----------
  function reduce(state, action) {
    if (state.stage === 'done') return state;
    const s = structuredClone(state);

    // the card's own actions first (its amount typing, its moves, its scaffold's taps)
    const mine = card.reduce(s, action, api);
    if (mine === 'ignore') return state;
    if (mine !== undefined) return mine;

    // typing the value: the row must be live; after a wrong value the first key clears the old substitution
    if (isTyping(action)) {
      if (s.sub) { if (!(s.sub.kind === 'value' && s.sub.step >= subTotal(s.sub) && !s.sub.ok)) return state; s.sub = null; }
      if (!answerLive(s) && !(s.sub === null && (s.path === 'guess' || alone(s) || card.answerOpen?.(s)) && !s.unfolded && !s.needUndo && !card.answerBlocked?.(s))) return state;
      const entry = typeInto(s.entry, action, 'integer');
      if (entry === s.entry) return state;
      s.entry = entry;
      return s;
    }

    switch (action.type) {
      case 'path': {
        if (s.stage !== 'moves' || s.path || alone(s) || s.needUndo) return state;
        fold(s);                                                                            // acting on the choice commits the move before it
        s.path = action.value === 'move' ? 'move' : 'guess';
        if (s.path === 'guess') { s.typing = 'answer'; return say(s, 'aGuessPrompt'); }
        s.typing = null;
        return say(s, card.movePromptKey?.(s) ?? 'aMovePrompt');
      }
      case 'focus':
        if (action.target !== 'answer' && action.target !== 'amount') return state;
        s.typing = action.target;
        return s;
      case 'greyMove':
        return say(s, 'aLater');

      // ----- the typed value: placed on x, then plugged in a line a click -----
      case 'check': {
        if (s.sub) return s;
        const typedText = s.entry.replace(/−/g, '-').trim();
        if (!/^-?\d+$/.test(typedText)) return say(s, s.entry === '' || s.entry === '-' ? 'typeAnswer' : 'answerUnreadable', {}, true);
        if (!answerLive(s)) return state;
        const typed = Number(typedText);
        const correct = typed === s.problem.x;
        const kind = alone(s) ? 'value' : 'guess';
        const tag = correct ? null : card.tag(s.problem, typed);
        if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
        // a correct guess at the first state, before any move, forces the next problem to be a move
        s.guessedFirst = correct && kind === 'guess' && s.rows.length === 1 && s.history.length === 0;
        // a wrong guess is checked in the CURRENT equation; a correct answer or a wrong value, in the ORIGINAL (decided 2026-10-12)
        const current = !correct && kind === 'guess';
        const target = current ? s.board : s.rows[0].board;
        const work = substitutionLines(target, typed);
        const collapsed = correct && card.collapse(s.level);
        s.sub = { kind, typed, ok: correct, tag, target: current ? 'current' : 'original', lines: work.lines, collapsed, placing: !collapsed, step: collapsed ? 1 : 0 };
        if (s.sub.placing) return say(s, 'aPlace', { typed: signed(typed), where: s.sub.target });
        return say(s, correct || kind === 'value' ? 'aPlugIn' : 'aPlugCurrent', { typed: signed(typed), where: s.sub.target });
      }
      // the value goes onto x (dragged, or tapped there)
      case 'placeValue': {
        if (!s.sub?.placing) return state;
        s.sub = { ...s.sub, placing: false, landed: true, step: 0 };               // the value lands on the x of that row, and stays there until Next
        return say(s, s.sub.ok || s.sub.kind === 'value' ? 'aPlugIn' : 'aPlugCurrent', { typed: signed(s.sub.typed), where: s.sub.target });
      }
      case 'nextLine': {
        if (!s.sub || s.sub.placing || s.sub.step >= subTotal(s.sub)) return state;
        if (s.sub.landed) { s.sub = { ...s.sub, landed: false, step: 1 }; return s; }   // the first check row is written; the top row goes back to x
        s.sub = { ...s.sub, step: s.sub.step + 1 };
        if (s.sub.step < subTotal(s.sub)) return s;
        const { kind, ok, typed, tag } = s.sub;
        if (ok) return finish(s, 'aCorrect');
        if (kind === 'guess') return say(s, 'aUndoGuess', { typed: signed(typed) });
        s.entry = '';                                                                       // a wrong value: the row clears so the student retypes
        const m = card.slip(s, typed, tag);
        return say(s, m.key, m.params, true);
      }

      // ----- Next: commits the move (folds it) and clears the picture it left on screen -----
      case 'foldNext': {
        if (!s.unfolded && !s.pic) return state;
        fold(s);
        if (!alone(s)) { bareState(s); return say(s, 'aChoose'); }
        return s;
      }

      // ----- Undo: only the current, unfolded move; the choice shows again -----
      case 'undo': {
        if (s.sub) {
          if (s.sub.kind !== 'guess' || s.sub.ok || s.sub.step < subTotal(s.sub)) return state;
          s.sub = null; s.entry = ''; s.path = 'move'; s.typing = null;                   // the guess is taken back; the next needed move is pointed at
          card.nextNeeded?.(s);
          return say(s, 'aSimplerFirst');
        }
        if (!s.history.length) return state;
        const wasScaffold = s.scaffold;
        const wasWaiting = waiting(s);
        restore(s, s.history.pop());
        if (wasWaiting && !wasScaffold) s.rung = 0;                                          // the ladder starts again for this state
        s.needUndo = false;
        s.unfolded = false;
        if (!wasScaffold) { s.path = null; s.menu = null; }                                 // the same state, with the choice showing again
        s.hint = null;
        card.afterUndo?.(s);
        return say(s, s.path ? (card.undoKey?.(s) ?? 'aUndone') : 'aChoose');                // the same state: the choice showing again
      }

      // ----- Start over: always live except on the untouched original; wipes the work, keeps the stuck count -----
      case 'startOver': {
        if (!startOverOk(s)) return state;
        Object.assign(s, { board: s.base, rows: [{ type: 'eq', board: s.base }], moveStart: 1, history: [], sub: null, entry: '', reds: 0, unfolded: false, lights: card.noLights() });
        bareState(s);
        s.path = s.mustMove ? 'move' : null;
        return say(s, s.path ? 'aStartedOver' : 'aChoose');
      }

      // ----- help -----
      case 'stuck': {
        if (!helpOk(s)) return state;
        if (waiting(s)) { s.stuck += 1; return undoFirst(s, say, card.undoReason?.(s) ?? 'red'); }
        fold(s);
        moveMode(s);
        s.stuck += 1;
        s.helped = true;
        const rung = Math.min(s.rung, card.rungs.length - 1);
        s.rung += 1;
        return card.rungs[rung](s, api);
      }
      case 'teach': {
        if (!helpOk(s)) return state;
        if (waiting(s)) { s.taught += 1; return undoFirst(s, say, card.undoReason?.(s) ?? 'red'); }
        fold(s);
        moveMode(s);
        s.taught += 1;
        s.forced = true;
        s.helped = true;
        if (!s.supportsShown.includes('forced')) s.supportsShown.push('forced');
        return card.teach(s, api);
      }
      default:
        return state;
    }
  }

  return { newSession, reduce, answerLive, helpOk, startOverOk, subTotal, subView, touched, alone: (s) => card.alone(s.board), owesMove: (s) => Boolean(s.guessedFirst) && s.stage === 'done', api };
}

export { boardText };
