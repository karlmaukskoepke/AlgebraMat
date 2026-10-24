// The Solve it loop (SPEC-SOLVE-IT-LOOP.md), built once. Every card configures it and never re-implements it. The loop owns:
//   - the moves and the x = [ ] row, both live at every state (there is no choice to make: Build C, 2026-10-18); a value typed
//     while x is not alone is a guess;
//   - guesses and the final value: the substitution (the value placed on x, then worked out an operation at a time, a click a
//     line), a wrong guess checked in the CURRENT equation, a wrong value or a correct answer in the ORIGINAL one;
//   - the forced-move rule (a correct guess at the first state, with no move made, makes the next problem a move: its x = [ ]
//     is greyed until one helpful move is made);
//   - committing a move: a helpful move writes the new equation; the move folds to one row the moment the student goes on (a
//     guess, another move, or help), and Undo reaches only an unfolded move; an unhelpful move waits for Undo;
//   - Undo (only the current, unfolded move), Start over (always live except on the untouched original), the help ladder
//     (rungs restart at each state), the stuck count, and the answer row's rules.
// A card (Add to both sides, Divide it, Flip it, ...) is a config: its board, its moves (`reduce`), its lights, its slips and
// its scaffold pictures. Pure logic, no DOM.

import { typeInto, isTyping } from './entry.js';
import { signed, substitutionLines, boardText, xCount } from './solveTerms.js';
import { climb, remind, teach as teachShape } from './solveit/registry.js';

// What a card supplies:
//   id                 'add-both'
//   startBoard(p)      the original equation's board
//   alone(board)       is x alone on its side (so the typing row goes live)?
//   extra(p, opts)     the card's own state fields
//   snapshotExtra(s)   the card's fields a move changes (restored by Undo)
//   resetState(s)      the card's fields back to a bare state (a new equation state, or Start over)
//   tag(p, typed, s)   the slip tag of a wrong typed value (null when right); `s` is the state it was typed in
//   slip(s, typed, tag) the line for a wrong value: { key, params }
//   reduce(s, action, api)  the card's own actions: undefined (not mine), 'ignore' (no change), or the changed state
//   (the help rungs and Teach me are not the card's: they are the scaffold registry's, keyed by the shape of the equation on screen,
//   engine/solveit/registry.js; a card registers its entries there)
//   answerBlocked(s)   something of the card's is open that holds the typing row back (an amount, a pending deal)
//   nextNeeded(s)      after a wrong guess is undone: mark the next needed move
//   waitingForUndo(s)  a try of the card's own waits for Undo outside `needUndo` (Divide's failed fraction); undoReason(s) says why
//   helpBlocked(s)     the card holds help back for now (Add to both sides while its seesaw is being built)
//   afterUndo(s), undoKey(s)  the card's own clean-up after Undo, and what it says
//   reminderOnly       a card in basic form: I'm stuck gives the shape's reminder only, never its pictures (Two-step equations, Build K)
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
      problem, level, stage: 'moves', step: 'moves', mustMove: forceMove, movedOnce: false,
      board, base: board, rows: [{ type: 'eq', board }], moveStart: 1, history: [], menu: null, typing: null, entry: '', sub: null,
      lights: card.noLights(), reds: 0, hint: null, rung: 0, scaffold: false, forced: false, unfolded: false, foldLabel: '', needUndo: false,
      stuck: 0, taught: 0, wrongs: 0, tag: null, tags: [], answers: [], helped: false, clean: false, skipped: [], supportsShown: [],
      guessedFirst: false, finalText: null, feedback: null, ...card.extra(problem, { level, ...opts }),
    };
    return say(s, forceMove ? (card.mustMoveKey?.(s) ?? 'aMustMove') : 'aFindX');
  }

  const snapshot = (s) => ({ board: s.board, rows: [...s.rows], lights: s.lights, reds: s.reds, menu: s.menu, hint: s.hint, unfolded: false, needUndo: false, ...card.snapshotExtra(s) });
  const restore = (s, snap) => Object.assign(s, snap);
  const pushHistory = (s) => { s.history.push(snapshot(s)); };

  // The state is bare again: nothing chosen, no scaffold, the ladder back at its first rung. (The stuck count is kept.)
  function bareState(s) {
    Object.assign(s, { menu: null, typing: null, hint: null, rung: 0, scaffold: false, forced: false, needUndo: false });
    card.resetState(s);
    return s;
  }

  const alone = (s) => card.alone(s.board);
  // Has the student done anything on this problem? Start over is greyed on the untouched original.
  const touched = (s) => s.rows.length > 1 || s.history.length > 0 || s.stuck > 0 || s.taught > 0 || s.scaffold || Boolean(s.sub) || s.entry !== '' || s.unfolded || card.touched?.(s) === true;
  const helpOk = (s) => s.stage !== 'done' && !card.helpBlocked?.(s) && (!s.sub || (s.sub.step >= subTotal(s.sub) && !s.sub.ok));
  const startOverOk = (s) => s.stage !== 'done' && touched(s);

  // Is the x = [ ] row live? Always, except while a move waits for Undo, while a substitution is stepped, while something of the
  // card's holds it back, on a forced-move problem until one move is made, and when the problem is done.
  function answerLive(s) {
    if (s.stage === 'done' || s.needUndo) return false;
    if (s.sub) return s.sub.kind === 'value' && s.sub.step >= subTotal(s.sub) && !s.sub.ok;
    if (card.answerBlocked?.(s)) return false;
    return !moveOwed(s);
  }
  // The problem after a correct guess: shown with a move first.
  const moveOwed = (s) => Boolean(s.mustMove) && !s.movedOnce && s.stage === 'moves';

  // The substitution: every line, then the mark. No card collapses it (loop spec rev 2.5, §4: the student watches the order of operations).
  const subTotal = (sub) => sub.lines.length + 1;
  // What of the check is on screen: the lines written so far (the first appears when the value is placed on x), and the mark.
  const subView = (sub) => ({ lines: sub.lines.slice(0, Math.min(sub.step, sub.lines.length)), mark: sub.step >= subTotal(sub), last: sub.step - 1, landed: Boolean(sub.landed) });

  // ---------- committing a move ----------
  // A move that the card has worked out: `rows` are the work rows and the new equation, `next` the new board, `label` the folded
  // row's words, `helpful` whether the lights say it helped. Returns the state with its message left to the card.
  // `keepScaffold`: a move made in the card's scaffold keeps the scaffold up (Add to both sides' seesaw stays until the problem ends).
  function commit(s, { rows, next, label, helpful, lights, keepScaffold = false }) {
    s.rows.push(...rows);
    s.board = next;
    s.lights = lights ?? s.lights;
    s.menu = null;
    s.hint = null;
    s.typing = null;
    if (helpful) {
      s.movedOnce = true;
      s.reds = 0;
      s.needUndo = false;
      if (!keepScaffold) s.scaffold = false;                                   // the new equation state starts bare
      s.rung = 0;
      s.forced = false;
      if (!alone(s)) { s.unfolded = true; s.foldLabel = label; }               // a new equation state: the move folds when the student goes on
    } else {
      s.reds += 1;
      s.needUndo = true;                                                       // an unhelpful move waits for Undo
    }
    return s;
  }
  const tryStuck = (s) => s.reds >= 3;
  // A move (or the card's own try) waits for Undo.
  const waiting = (s) => !s.sub && (s.needUndo || card.waitingForUndo?.(s) === true);

  // A move gets in with nothing waiting on Undo.
  function blockMove(s) {
    if (s.stage !== 'moves' || s.sub) return 'ignore';
    if (s.needUndo) return say(s, 'aUndoFirst', {}, true);
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
  // starting point. (Going on, with a guess, another move or help, commits it.)
  function fold(s) {
    if (s.pic) s.pic = null;                                                            // the scaffold picture the move left behind goes with the fold
    if (!s.unfolded) return;
    s.rows = [...s.rows.slice(0, s.moveStart), { type: 'fold', label: s.foldLabel, board: s.board }];
    s.moveStart = s.rows.length;
    s.history = [];
    s.unfolded = false;
  }

  // Asking for help clears a finished substitution (the scaffolds are about moves).
  function moveMode(s) {
    s.sub = null;
  }

  const api = { say, commit, pushHistory, snapshot, restore, blockMove, finish, alone, bareState, tryStuck, fold };

  // ---------- the reducer ----------
  function reduce(state, action) {
    if (state.stage === 'done') return state;
    const s = structuredClone(state);

    // the card's own actions first (its amount typing, its moves, its scaffold's taps); choosing a move commits the move before it
    if (action.type === 'choose' && s.unfolded && !s.scaffold) fold(s);
    const mine = card.reduce(s, action, api);
    if (mine === 'ignore') return state;
    if (mine !== undefined) return mine;

    // typing the value: the row must be live; after a wrong value the first key clears the old substitution
    if (isTyping(action)) {
      if (s.sub) { if (!(s.sub.kind === 'value' && s.sub.step >= subTotal(s.sub) && !s.sub.ok)) return state; s.sub = null; }
      if (!answerLive(s)) return state;
      const entry = typeInto(s.entry, action, 'integer');
      if (entry === s.entry) return state;
      fold(s);                                                                              // typing a value commits the move before it
      s.entry = entry;
      s.typing = 'answer';                                    // the keys are going into x = now: it keeps the cursor (Build N)
      return s;
    }

    switch (action.type) {
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
        const tag = correct ? null : card.tag(s.problem, typed, s);
        if (!correct) { s.wrongs += 1; s.tag = tag; s.tags.push(tag); s.answers.push({ typed: s.entry, tag }); }
        // a correct guess at the first state, before any move, forces the next problem to be a move
        s.guessedFirst = correct && kind === 'guess' && s.rows.length === 1 && s.history.length === 0;
        // a wrong guess is checked in the CURRENT equation; a correct answer or a wrong value, in the ORIGINAL (decided 2026-10-12)
        const current = !correct && kind === 'guess';
        const target = current ? s.board : s.rows[0].board;
        const work = substitutionLines(target, typed);
        // the value is dropped into x; an equation with more than one x takes a drop in each, nothing fills itself (`xs` of them, `filled`
        // the ones that have it; Build H, Part 1; loop spec rev 2.5)
        s.sub = { kind, typed, ok: correct, tag, target: current ? 'current' : 'original', lines: work.lines, placing: true, step: 0, xs: xCount(target), filled: [] };
        return say(s, 'aPlace', { typed: signed(typed), where: s.sub.target });
      }
      // the value goes onto x (dragged, or tapped there)
      case 'placeValue': {
        if (!s.sub?.placing) return state;
        const xs = s.sub.xs ?? 1;
        if (xs > 1) {                                                              // a drop in each x: the one dropped on, or the next that is empty
          const at = Number.isInteger(action.index) && action.index >= 0 && action.index < xs ? action.index : [...Array(xs).keys()].find((i) => !s.sub.filled.includes(i));
          if (at === undefined) return state;
          if (!s.sub.filled.includes(at)) s.sub = { ...s.sub, filled: [...s.sub.filled, at] };
          if (s.sub.filled.length < xs) return say(s, 'aPlace', { typed: signed(s.sub.typed), where: s.sub.target });
        }
        s.sub = { ...s.sub, placing: false, step: 1 };                             // the copy of the equation is written beside it, its first line (Build D)
        return say(s, s.sub.ok || s.sub.kind === 'value' ? 'aPlugIn' : 'aPlugCurrent', { typed: signed(s.sub.typed), where: s.sub.target });
      }
      case 'nextLine': {
        if (!s.sub || s.sub.placing || s.sub.step >= subTotal(s.sub)) return state;
        s.sub = { ...s.sub, step: s.sub.step + 1 };
        if (s.sub.step < subTotal(s.sub)) return s;
        const { kind, ok, typed, tag } = s.sub;
        if (ok) return finish(s, 'aCorrect');
        if (kind === 'guess') return say(s, 'aUndoGuess', { typed: signed(typed), tag });
        s.entry = '';                                                                       // a wrong value: the row clears so the student retypes
        const m = card.slip(s, typed, tag);
        return say(s, m.key, m.params, true);
      }

      // ----- Next: commits the move (folds it) and clears the picture it left on screen -----
      case 'foldNext': {
        if (!s.unfolded && !s.pic) return state;
        fold(s);
        if (!alone(s)) { bareState(s); return say(s, 'aFindX'); }
        return s;
      }

      // ----- Undo: only the current, unfolded move; the choice shows again -----
      case 'undo': {
        if (s.sub) {
          if (s.sub.kind !== 'guess' || s.sub.ok || s.sub.step < subTotal(s.sub)) return state;
          s.sub = null; s.entry = ''; s.typing = null;                                     // the guess is taken back; the next needed move is pointed at
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
        if (!wasScaffold) s.menu = null;                                                    // the same state, as it was
        s.hint = null;
        card.afterUndo?.(s);
        return say(s, card.undoKey?.(s) ?? 'aUndone');
      }

      // ----- Start over: always live except on the untouched original; wipes the work, keeps the stuck count -----
      case 'startOver': {
        if (!startOverOk(s)) return state;
        Object.assign(s, { board: s.base, rows: [{ type: 'eq', board: s.base }], moveStart: 1, history: [], sub: null, entry: '', reds: 0, unfolded: false, lights: card.noLights() });
        bareState(s);
        return say(s, 'aStartedOver');
      }

      // ----- help -----
      case 'stuck': {
        if (!helpOk(s)) return state;
        if (waiting(s)) { s.stuck += 1; return undoFirst(s, say, card.undoReason?.(s) ?? 'red'); }
        fold(s);
        moveMode(s);
        s.stuck += 1;
        s.helped = true;
        return card.reminderOnly ? remind(s, api) : climb(s, api);                     // the shape's next rung (solveit/registry.js)
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
        return teachShape(s, api);                                                     // the shape's forced path (solveit/registry.js)
      }
      default:
        return state;
    }
  }

  return { newSession, reduce, answerLive, moveOwed, helpOk, startOverOk, subTotal, subView, touched, alone: (s) => card.alone(s.board), owesMove: (s) => Boolean(s.guessedFirst) && s.stage === 'done', api };
}

export { boardText };
