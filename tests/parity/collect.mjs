// Collects everything the parity harness compares, from the code as it is now (tests/parity/README.md):
//   problems   Add to both sides and Divide it, every level, seeds 1-30
//   savecodes  save-code strings for a set of progress states, and whether each decodes back to the same state
//   events     the class-sheet record (eventlog.js makeRecord) at the end of each scripted run
//   traces     the state after every action of each scripted run (rows, lights, message, help, typing)
// Pure: no DOM, no clock, no storage. Generated term ids (t12, d5) are removed, since they depend on how many runs came before.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKS, addBoth, divideIt } from '../../src/packs/index.js';
import { newProgress, completeLevel, encodeProgress, decodeProgress, placeLevels, mergeProgress } from '../../src/engine/progress.js';
import { makeRecord } from '../../src/engine/eventlog.js';
import { boardText as addBoardText } from '../../src/engine/addBothMoves.js';
import { reduceAddBoth } from '../../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../../src/engine/addBothLights.js';
import { withSpotlight } from '../../src/engine/spotlight.js';
import { formatAddBoth } from '../../src/engine/addBoth.js';
import { newDivide, reduceDivide, boardText as divBoardText, DIVIDE_SPOT } from '../../src/engine/divideMoves.js';
import { formatDivide } from '../../src/engine/divide.js';
import { ADD_SCENARIOS, DIVIDE_SCENARIOS } from './scenarios.mjs';
import { NEW_SCENARIOS } from './scenarios2.mjs';
import { packById } from '../../src/packs/index.js';
import { fractionsPlay, strangePlay, twoStepPlay } from '../../src/play/solveCards.js';
import { nextMove } from '../../src/engine/solveit/honest.js';
import { boardText as termBoardText } from '../../src/engine/solveTerms.js';
import { setNoHelp } from '../../src/engine/noHelp.js';
import { quiet, checkResult, HELP_ACTIONS, ALL_TAUGHT, attemptRecords, passCredit } from '../../src/engine/testOut.js';

const ID = /^[td]\d+$/;
const LEGACY_CODES = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'legacy-codes.json'), 'utf8'));
// Remove generated ids so a snapshot does not depend on run order.
export function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (k !== 'id' && k !== 'ids') out[k] = clean(x);
    return out;
  }
  return typeof v === 'string' && ID.test(v) ? '#' : v;
}

function problems() {
  const out = {};
  // (Fractions of x and Strange solutions since Build AF, Part 3)
  for (const pack of [addBoth, divideIt, packById('fractions-of-x'), packById('strange-solutions')]) {
    for (let level = 1; level <= pack.levels; level++) {
      for (let seed = 1; seed <= 30; seed++) out[`${pack.id}/L${level}/seed${seed}`] = clean(pack.generate(level, seed));
    }
  }
  return out;
}

function savecodes() {
  const states = { empty: newProgress(PACKS) };
  let all = newProgress(PACKS);
  for (const pack of PACKS) {
    if (!pack.levels || pack.comingSoon) continue;
    for (let level = 1; level <= pack.levels; level++) {
      states[`${pack.id}-L${level}`] = completeLevel(newProgress(PACKS), pack.id, level);
      all = completeLevel(all, pack.id, level);
    }
  }
  states.everything = all;
  // Build X: placed levels are not in a code (a code carries earned levels); a placed level earned by one problem is; two devices merged
  const placed = placeLevels(newProgress(PACKS), 'add-both', 5);
  states['x-placed'] = placed;
  states['x-placed-then-earned'] = completeLevel(placed, 'add-both', 3);
  states['x-merged'] = mergeProgress(placed, completeLevel(completeLevel(newProgress(PACKS), 'add-both', 4), 'divide-it', 2));
  // Build AF, Part 3: a placed level of each newer card, and a placed level finished (gold)
  states['af-placed-fractions-3'] = placeLevels(newProgress(PACKS), 'fractions-of-x', 3);
  states['af-placed-strange-4'] = placeLevels(newProgress(PACKS), 'strange-solutions', 4);
  states['af-placed-two-step-1-gold'] = completeLevel(passCredit(newProgress(PACKS), 'two-step-equations', 1), 'two-step-equations', 1);
  const out = {};
  // every older code still decodes, to the same progress as today (legacy-codes.json: the codes recorded on 2026-10-17, before Build A,
  // and the version-21 codes of 2026-11-07); kept as the code it decodes to now
  for (const [name, code] of Object.entries(LEGACY_CODES)) {
    const back = decodeProgress(code, PACKS);
    out[`legacy:${name}`] = { decodes: Boolean(back), now: back ? encodeProgress(back) : null };
  }
  for (const [name, p] of Object.entries(states)) {
    const code = encodeProgress(p);
    const back = decodeProgress(code, PACKS);
    out[name] = { code, roundTrip: back ? encodeProgress(back) === code : false };
  }
  return out;
}

// What a trace keeps of a state: what the student sees and what help is doing, not the engine's bookkeeping.
const LOOK = ['stage', 'step', 'menu', 'typing', 'amountEntry', 'entry', 'scaffold', 'rung', 'hint', 'lights', 'reds', 'undoCue', 'zeroOther',
  'needUndo', 'unfolded', 'forced', 'pending', 'combining', 'diag', 'deal', 'fail', 'pic', 'stuck', 'taught', 'wrongs', 'tags', 'supportsShown'];

function view(s, boardText) {
  const out = { board: boardText(s.board), rows: s.rows.map((r) => (r.board ? `${r.type}: ${boardText(r.board)}` : `${r.type}: ${JSON.stringify(clean(r.work ?? r.label ?? null))}`)), feedback: clean(s.feedback) };
  for (const k of LOOK) if (s[k] !== undefined) out[k] = clean(s[k]);
  if (s.sub) out.sub = { kind: s.sub.kind, step: s.sub.step, ok: s.sub.ok, typed: s.sub.typed, tag: s.sub.tag, target: s.sub.target ?? null };
  return out;
}

function run(scenarios, start, reduce, boardText, pack, format) {
  const traces = {};
  const events = {};
  for (const [name, sc] of Object.entries(scenarios)) {
    let s = start(sc.problem, sc.opts);
    const trace = [{ action: 'start', state: view(s, boardText) }];
    for (const action of sc.actions) {
      s = reduce(s, action);
      trace.push({ action: JSON.stringify(action), state: view(s, boardText) });
    }
    traces[`${pack}/${name}`] = trace;
    events[`${pack}/${name}`] = { done: s.stage === 'done', record: makeRecord(s, { t: 0, pack, level: sc.opts.level, problem: format(s.problem) }) };
  }
  return { traces, events };
}

// ---------- Build AF, Part 3: the newer cards' scripted runs (scenarios2.mjs) ----------
const GID = /^[a-z]\d+$/;                                          // (these cards' generated ids: g12, t3)
const cleanNew = (v) => {
  if (Array.isArray(v)) return v.map(cleanNew);
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) if (k !== 'id' && k !== 'ids') o[k] = cleanNew(x); return o; }
  return typeof v === 'string' && GID.test(v) ? '#' : v;
};
const PLAYS = { 'fractions-of-x': fractionsPlay, 'strange-solutions': strangePlay, 'two-step-equations': twoStepPlay };
const NEW_LOOK = [...LOOK, 'concluded', 'model', 'part', 'den', 'simplifyTries'];
function viewNew(s) {
  const out = { board: s.board ? termBoardText(s.board) : null, rows: (s.rows ?? []).map((r) => (r.board ? `${r.type}: ${termBoardText(r.board)}` : `${r.type}: ${JSON.stringify(cleanNew(r.work ?? r.label ?? null))}`)), feedback: cleanNew(s.feedback) };
  for (const k of NEW_LOOK) if (s[k] !== undefined && s[k] !== null) out[k] = cleanNew(k === 'model' ? { step: s[k].step, auto: s[k].auto } : s[k]);
  if (s.sub) out.sub = { kind: s.sub.kind, step: s.sub.step, ok: s.sub.ok, typed: s.sub.typed, tag: s.sub.tag, target: s.sub.target ?? null, lines: s.sub.lines?.length ?? 0 };
  return out;
}
// a token worked out from the state, as actions
function expand(step, s) {
  if (step === 'ANSWER' || Array.isArray(step)) {
    const f = s.problem.ans;
    const t = Array.isArray(step) ? step[1] : f ? `${f.n}${f.d > 1 ? `/${f.d}` : ''}` : String(s.problem.x);
    const [top, bottom] = t.replace(/^-/, '').split('/');
    const digits = (d) => [...d].map((c) => ({ type: 'digit', digit: Number(c) }));
    return [{ type: 'focus', target: 'answer' }, ...digits(top), ...(t.startsWith('-') ? [{ type: 'toggleSign' }] : []), ...(bottom ? [{ type: 'typeChar', ch: '/' }, ...digits(bottom)] : []), { type: 'check' }];
  }
  if (step === 'PLACE') return [0, 1, 2, 3].map((index) => ({ type: 'placeValue', index }));
  if (step === 'LINES') return Array.from({ length: 14 }, () => ({ type: 'nextLine' }));
  return [step];
}
function runNew() {
  const traces = {};
  const events = {};
  for (const [name, sc] of Object.entries(NEW_SCENARIOS)) {
    const play = PLAYS[sc.pack];
    const problem = { ...packById(sc.pack).generate(sc.level, sc.seed)[(sc.problem ?? 1) - 1], logLevel: sc.level };
    setNoHelp(Boolean(sc.noHelp));
    let helping = !sc.noHelp;
    let s = play.newSession(problem, { flags: sc.noHelp ? ALL_TAUGHT() : {}, forceMove: false });
    if (sc.noHelp) s = quiet(s);
    const trace = [{ action: 'start', state: viewNew(s) }];
    const first = trace[0].state.board;
    let over = false;
    const act = (a) => {
      if (over) { trace.push({ action: JSON.stringify(cleanNew(a)), state: 'held (the attempt is over)' }); return; }
      if (!helping && HELP_ACTIONS.has(a.type)) { trace.push({ action: JSON.stringify(cleanNew(a)), state: 'held (no help)' }); return; }
      const n = play.reduce(s, a);
      if (n === s) return;                                              // (a step that does nothing is not written)
      s = helping ? n : quiet(n);
      const result = sc.noHelp ? checkResult(s) : null;
      trace.push({ action: JSON.stringify(cleanNew(a)), state: viewNew(s), ...(result ? { result } : {}) });
      // a miss on an open level: help comes on, the same problem (main.js helpOn)
      // (on a locked level the attempt ends there: the fail panel)
      if (!helping && result === 'wrong') { if (sc.locked) over = true; else { helping = true; setNoHelp(false); s = n; } }
    };
    for (const step of sc.steps) {
      if (step === 'MOVES') {                                           // (each move worked out from the state as it is: ids are fresh)
        for (let k = 0; k < 16; k++) {
          const m = nextMove(s);
          if (!m) break;
          for (const a of m) act(a);
          if (s.unfolded) act({ type: 'foldNext' });
        }
        continue;
      }
      for (const a of expand(step, s)) act(a);
    }
    setNoHelp(false);
    const meta = { t: 0, pack: sc.pack, level: sc.level, problem: first };
    const record = sc.attempt ? attemptRecords([{ session: s, meta }], sc.attempt)[0] : makeRecord(s, meta);
    traces[name] = trace;
    events[name] = { done: s.stage === 'done', record: cleanNew(record) };
  }
  return { traces, events };
}

export function collect() {
  // Add to both sides as students play it since Build C: the card's layer (preview, blank, Next, forced move) round the engine
  const add = run(ADD_SCENARIOS, newLightsSession, withSpotlight(withLights(reduceAddBoth), ADD_SPOT), addBoardText, 'add-both', formatAddBoth);
  const div = run(DIVIDE_SCENARIOS, (p, o) => newDivide(p, o), withSpotlight(reduceDivide, DIVIDE_SPOT), divBoardText, 'divide-it', formatDivide);
  const more = runNew();                                            // (Build AF, Part 3)
  return {
    problems: problems(),
    savecodes: savecodes(),
    events: { ...add.events, ...div.events, ...more.events },
    traces: { ...add.traces, ...div.traces, ...more.traces },
  };
}
