// Collects everything the parity harness compares, from the code as it is now (tests/parity/README.md):
//   problems   Add to both sides and Divide it, every level, seeds 1-30
//   savecodes  save-code strings for a set of progress states, and whether each decodes back to the same state
//   events     the class-sheet record (eventlog.js makeRecord) at the end of each scripted run
//   traces     the state after every action of each scripted run (rows, lights, message, help, typing)
// Pure: no DOM, no clock, no storage. Generated term ids (t12, d5) are removed, since they depend on how many runs came before.

import { PACKS, addBoth, divideIt } from '../../src/packs/index.js';
import { newProgress, completeLevel, encodeProgress, decodeProgress } from '../../src/engine/progress.js';
import { makeRecord } from '../../src/engine/eventlog.js';
import { newAddBoth, reduceAddBoth, boardText as addBoardText } from '../../src/engine/addBothMoves.js';
import { formatAddBoth } from '../../src/engine/addBoth.js';
import { newDivide, reduceDivide, boardText as divBoardText } from '../../src/engine/divideMoves.js';
import { formatDivide } from '../../src/engine/divide.js';
import { ADD_SCENARIOS, DIVIDE_SCENARIOS } from './scenarios.mjs';

const ID = /^[td]\d+$/;
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
  for (const pack of [addBoth, divideIt]) {
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
  const out = {};
  for (const [name, p] of Object.entries(states)) {
    const code = encodeProgress(p);
    const back = decodeProgress(code, PACKS);
    out[name] = { code, roundTrip: back ? encodeProgress(back) === code : false };
  }
  return out;
}

// What a trace keeps of a state: what the student sees and what help is doing, not the engine's bookkeeping.
const LOOK = ['stage', 'step', 'path', 'menu', 'typing', 'amountEntry', 'entry', 'scaffold', 'rung', 'hint', 'lights', 'reds', 'undoCue', 'zeroOther',
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

export function collect() {
  const add = run(ADD_SCENARIOS, newAddBoth, reduceAddBoth, addBoardText, 'add-both', formatAddBoth);
  const div = run(DIVIDE_SCENARIOS, (p, o) => newDivide(p, o), reduceDivide, divBoardText, 'divide-it', formatDivide);
  return {
    problems: problems(),
    savecodes: savecodes(),
    events: { ...add.events, ...div.events },
    traces: { ...add.traces, ...div.traces },
  };
}
