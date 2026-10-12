// The Solve it loop (SPEC-SOLVE-IT-LOOP.md), built once. Every card configures it and never re-implements it. The loop owns:
//   - the choice at every state where x is not alone (guess x, or use a move), and the greyed-out rules that follow;
//   - guesses and the final value: the substitution (the value placed on x, then worked out an operation at a time, a click a
//     line), a wrong guess checked in the CURRENT equation, a wrong value or a correct answer in the ORIGINAL one;
//   - the forced-move rule (a correct guess at the first state, with no move made, forces the next problem to be a move);
//   - committing a move: a helpful move writes the new equation and waits for Next, which folds the move to one row and brings
//     the choice back; an unhelpful move waits for Undo, which returns to the same state with the choice showing;
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
//   nextNeeded(s)      after a wrong guess is undone: mark the next needed move
export function createSolveLoop(card) {
  const say = (s, key, params = {}, bad = false) => { s.feedback = { key, params: { ...(card.params?.(s) ?? {}), ...params }, bad }; return s; };

  // ---------- state ----------
  function newSession(problem, { level = 2, forceMove = false, ...opts } = {}) {
    const board = card.startBoard(problem);
    const s = {
      problem, level, stage: 'moves', step: 'moves', path: forceMove ? 'move' : null, mustMove: forceMove,
      board, base: board, rows: [{ type: 'eq', board }], moveStart: 1, history: [], menu: null, typing: null, entry: '', sub: null,
      lights: card.noLights(), reds: 0, hint: null, rung: 0, scaffold: false, forced: false, pendingFold: false, foldLabel: '', needUndo: false,
      stuck: 0, taught: 0, wrongs: 0, tag: null, tags: [], answers: [], helped: false, clean: false, skipped: [], supportsShown: [],
      guessedFirst: false, finalText: null, feedback: null, ...card.extra(problem, { level, ...opts }),
    };
    return say(s, forceMove ? (card.mustMoveKey?.(s) ?? 'aMustMove') : 'aChoose');
  }

  const snapshot = (s) => ({ board: s.board, rows: [...s.rows], lights: s.lights, reds: s.reds, menu: s.menu, hint: s.hint, pendingFold: false, needUndo: false, ...card.snapshotExtra(s) });
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
  const touched = (s) => s.rows.length > 1 || s.history.length > 0 || s.path !== null || Boolean(s.sub) || s.entry !== '' || s.pendingFold || card.touched?.(s) === true;
  const helpOk = (s) => s.stage !== 'done' && (!s.sub || (s.sub.step >= subTotal(s.sub) && !s.sub.ok)) && !s.pendingFold;
  const startOverOk = (s) => s.stage !== 'done' && touched(s);

  // Is the x = [ ] row live? Greyed before the choice (while x is not alone), while a move waits for Next or Undo, while a
  // substitution is stepped, and when the problem is done.
  function answerLive(s) {
    if (s.stage === 'done' || s.pendingFold || s.needUndo) return false;
    if (s.sub) return s.sub.kind === 'value' && s.sub.step >= subTotal(s.sub) && !s.sub.ok;
    if (card.answerBlocked?.(s)) return false;
    return s.path === 'guess' || alone(s);
  }

  // The substitution: lines, then the mark. Collapsed: the first line, then the mark (a wrong value is always full).
  const subTotal = (sub) => (sub.collapsed ? 2 : sub.lines.length + 1);

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
      if (!alone(s)) { s.pendingFold = true; s.foldLabel = label; }            // a new equation state: Next folds the move and brings the choice back
    } else {
      s.reds += 1;
      s.needUndo = true;                                                       // an unhelpful move waits for Undo
    }
    return s;
  }
  const tryStuck = (s) => s.reds >= 3;

  // A move gets in only on the move path, with nothing waiting on Next or Undo.
  function blockMove(s) {
    if (s.stage !== 'moves' || s.sub) return s;
    if (s.pendingFold) return say(s, 'aFoldFirst');
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

  // Help from the guess path moves the state into move mode.
  function moveMode(s) {
    s.sub = null;
    if (s.path !== 'move') { s.path = 'move'; s.entry = ''; s.typing = null; }
  }

  const api = { say, commit, pushHistory, snapshot, restore, blockMove, finish, alone, bareState, tryStuck };

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
      if (!answerLive(s) && !(s.sub === null && (s.path === 'guess' || alone(s)) && !s.pendingFold && !s.needUndo && !card.answerBlocked?.(s))) return state;
      const entry = typeInto(s.entry, action, 'integer');
      if (entry === s.entry) return state;
      s.entry = entry;
      return s;
    }

    switch (action.type) {
      case 'path': {
        if (s.stage !== 'moves' || s.path || alone(s) || s.pendingFold || s.needUndo) return state;
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
        s.sub = { kind, typed, ok: correct, tag, target: current ? 'current' : 'original', lines: work.lines, collapsed, placing: !collapsed, step: 0 };
        if (s.sub.placing) return say(s, 'aPlace', { typed: signed(typed) });
        return say(s, correct || kind === 'value' ? 'aPlugIn' : 'aGuessed', { typed: signed(typed), where: s.sub.target }, !correct && kind === 'guess');
      }
      // the value goes onto x (dragged, or tapped there)
      case 'placeValue': {
        if (!s.sub?.placing) return state;
        s.sub = { ...s.sub, placing: false };
        return say(s, s.sub.ok || s.sub.kind === 'value' ? 'aPlugIn' : 'aGuessed', { typed: signed(s.sub.typed), where: s.sub.target }, !s.sub.ok && s.sub.kind === 'guess');
      }
      case 'nextLine': {
        if (!s.sub || s.sub.placing || s.sub.step >= subTotal(s.sub)) return state;
        s.sub = { ...s.sub, step: s.sub.step + 1 };
        if (s.sub.step < subTotal(s.sub)) return s;
        const { kind, ok, typed, tag } = s.sub;
        if (ok) return finish(s, 'aCorrect');
        if (kind === 'guess') return say(s, 'aUndoGuess', { typed: signed(typed) });
        s.entry = '';                                                                       // a wrong value: the row clears so the student retypes
        const m = card.slip(s, typed, tag);
        return say(s, m.key, m.params, true);
      }

      // ----- a helpful move was made: Next commits and folds it, and the choice returns -----
      case 'foldNext': {
        if (!s.pendingFold) return state;
        s.rows = [...s.rows.slice(0, s.moveStart), { type: 'fold', label: s.foldLabel, board: s.board }];
        s.moveStart = s.rows.length;
        s.history = [];                                                                     // nothing is reversible after Next
        s.pendingFold = false;
        bareState(s);
        return say(s, 'aChoose');
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
        restore(s, s.history.pop());
        s.needUndo = false;
        if (!wasScaffold) { s.path = null; s.menu = null; }                                 // the same state, with the choice showing again
        s.hint = null;
        card.afterUndo?.(s);
        return say(s, 'aUndone');
      }

      // ----- Start over: always live except on the untouched original; wipes the work, keeps the stuck count -----
      case 'startOver': {
        if (!startOverOk(s)) return state;
        Object.assign(s, { board: s.base, rows: [{ type: 'eq', board: s.base }], moveStart: 1, history: [], sub: null, entry: '', reds: 0, pendingFold: false, lights: card.noLights() });
        bareState(s);
        s.path = s.mustMove ? 'move' : null;
        return say(s, s.path ? 'aStartedOver' : 'aChoose');
      }

      // ----- help -----
      case 'stuck': {
        if (!helpOk(s)) return state;
        moveMode(s);
        s.stuck += 1;
        s.helped = true;
        const rung = Math.min(s.rung, card.rungs.length - 1);
        s.rung += 1;
        return card.rungs[rung](s, api);
      }
      case 'teach': {
        if (!helpOk(s)) return state;
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

  return { newSession, reduce, answerLive, helpOk, startOverOk, subTotal, touched, owesMove: (s) => Boolean(s.guessedFirst) && s.stage === 'done', api };
}

export { boardText };
