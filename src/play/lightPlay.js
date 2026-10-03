// Light mode's play adapter for two-term integer problems (SPEC-SCAFFOLD.md): the same interface as the other packs',
// so the shared play screen runs it. The student types the answer; supports come in when a wrong answer or I'm stuck
// calls for them, and the full walk is the last rung. One factory serves Combine it (additions: the walk without
// Rewrite) and Flip It (subtractions: the walk from Rewrite).

import { newLightSession, reduceLight } from '../engine/lightSession.js';
import { combinePlay, buildCombineControls } from './combinePlay.js';
import { flipitPlay } from './flipitPlay.js';
import { buildControls as buildFlipControls } from '../view/controls.js';
import { buildLightControls } from '../view/lightControls.js';
import { bigPlay } from './bigPlay.js';
import { bindBoxMat } from '../view/boxPointer.js';
import { renderLightMat } from '../view/lightMat.js';
import { lightFeedbackText } from '../view/lightFeedback.js';
import { formatProblem, rewrite, MINUS } from '../engine/expr.js';
import { speak } from '../view/speech.js';
import { loadSkills, recordProblem } from '../lightStore.js';
import { startTourIfFirst } from '../view/tour.js';
import { readInteger } from '../engine/scaffold.js';

const LIGHT_STEPS = [{ id: 'answer', label: 'Answer' }];
const SUPPORT_STEPS = {
  circle: [{ id: 'circle', label: 'Circle' }, { id: 'answer', label: 'Answer' }],
  rewrite: [{ id: 'rewrite', label: 'Rewrite' }, { id: 'answer', label: 'Answer' }],
  partyBattle: [{ id: 'partyBattle', label: 'Party or Battle?' }, { id: 'answer', label: 'Answer' }],
  cloze: [{ id: 'cloze', label: 'Say it' }, { id: 'answer', label: 'Answer' }],
};

// Both palettes live in the footer, one shown at a time: light mode's, or the full walk's. `idleWalk(problem)` gives
// the walk's palette a session to draw while light mode is showing (it's hidden, and all its buttons are off, so a
// key can't reach it); without it a bare "off" session does, which the two-term palettes accept.
export function buildLightPlayControls(root, dispatch, buildWalkControls = buildCombineControls, buildPalette = buildLightControls, idleWalk = null) {
  root.innerHTML = '';
  const lightRoot = document.createElement('div');
  const walkRoot = document.createElement('div');
  lightRoot.className = walkRoot.className = 'dist-controls';
  root.append(lightRoot, walkRoot);
  const light = buildPalette(lightRoot, dispatch);
  const walk = buildWalkControls(walkRoot, dispatch);
  const OFF = { step: 'inactive', stage: 'inactive', zones: [], skipped: [] };
  const walkButtons = () => walkRoot.querySelectorAll('button');
  return {
    update(s, hint = null) {
      const walking = s.stage === 'walk';
      lightRoot.hidden = walking;
      walkRoot.hidden = !walking;
      if (s.step === 'levelDone') { light.update(s); walk.update(idleWalk ? { ...idleWalk(s.problem), step: 'levelDone' } : { ...OFF, step: 'levelDone' }); return; }
      light.update(walking ? { ...OFF } : s);
      if (walking) {
        walkButtons().forEach((b) => { b.disabled = false; });
        walk.update(s.walk, hint);
      } else {
        walk.update(idleWalk ? idleWalk(s.problem) : { ...OFF }, null);
        if (idleWalk) walkButtons().forEach((b) => { b.disabled = true; });
      }
    },
  };
}

// The typed answer in words, for the support that makes the sign heard: "-2" → "negative 2".
// The two numbers with the sign in front of each, for the Mat once they've been circled: −11 and + 2.
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const circledTexts = (problem) => [signed(problem.left.value),
  `${problem.op === '-' ? MINUS : '+'} ${problem.right.value < 0 ? `(${signed(problem.right.value)})` : problem.right.value}`];

const readback = (entry) => {
  const n = readInteger(entry);
  return n === null ? null : `${n < 0 ? 'negative' : 'positive'} ${Math.abs(n)}`;
};

function makeLightPlay({ packId, walkPlay, buildWalkControls }) {
  return {
    steps: (s) => (s.stage === 'walk' ? walkPlay.steps(s.walk) : s.stage === 'support' ? SUPPORT_STEPS[s.support] : LIGHT_STEPS),
    // The supports that are on for this student come with each new problem.
    newSession: (problem) => newLightSession(problem, loadSkills()),
    reduce: reduceLight,
    feedbackText: lightFeedbackText,
    buildControls: (root, dispatch) => buildLightPlayControls(root, dispatch, buildWalkControls),
    effects(before, s) {
      // The first light problem on a device opens with the spotlight tour (once the Mat is on the screen).
      if (!before && s.stage !== 'done') startTourIfFirst();
      // A finished problem updates which supports are on and goes in the log (once: the step turns to done once).
      if (before && before.step !== 'done' && s.step === 'done') {
        recordProblem(s, { pack: packId, level: s.problem.logLevel ?? s.problem.level ?? null, problem: formatProblem(s.problem) });
      }
      // A picked choice is read aloud (once: the id changes each time).
      if (before && s.spoken && s.spoken.id !== before.spoken?.id) speak(s.spoken.text);
      if (s.stage === 'support' && s.support === 'circle') {
        return { ...bigPlay.effects(before?.circle ?? null, s.circle), hint: null };   // the newest circle fades in
      }
      if (s.stage === 'support' && s.support === 'rewrite') return { ...flipitPlay.effects(before?.rewrite ?? null, s.rewrite), hint: null };
      if (s.stage !== 'walk') return { hint: null };
      return walkPlay.effects(before?.stage === 'walk' ? before.walk : null, s.walk);
    },
    renderMat(s, fx = {}) {
      if (s.stage === 'walk') return walkPlay.renderMat(s.walk, fx);
      if (s.stage === 'support' && s.support === 'circle') return bigPlay.renderMat(s.circle, fx);
      if (s.stage === 'support' && s.support === 'rewrite') return flipitPlay.renderMat(s.rewrite, fx);
      const cloze = s.stage === 'support' && s.cloze ? s.cloze : null;
      return renderLightMat({
        problemText: formatProblem(s.problem),
        circled: s.circled ? circledTexts(s.problem) : null,
        rewritten: s.rewritten ? formatProblem(rewrite(s.problem)) : null,
        choices: s.stage === 'support' && s.support === 'partyBattle',
        typed: s.entry, done: s.stage === 'done', cloze, said: s.said, readback: s.on.sign ? readback(s.entry) : null });
    },
    matAction: (d) => {
      if (d.action === 'choice') return { type: 'pickChoice', index: Number(d.index) };
      if (d.action === 'choose') return { type: 'choose', choice: d.choice };   // Party! / Battle! on the Mat
      if (d.action === 'flip') return flipitPlay.matAction(d);                  // a Rewrite tap is Flip It's
      return walkPlay.matAction(d);
    },
    // The circle support is dragged (Boxes & Circles' pointer): it sees the circling session, or an idle one.
    bindMat: (root, dispatch, getSession) => bindBoxMat(root, dispatch, () => {
      const s = getSession();
      return s?.stage === 'support' && s.support === 'circle' ? s.circle : { step: 'inactive', shapes: [], problem: s?.problem };
    }),
  };
}

export const lightPlay = makeLightPlay({ packId: 'combineit', walkPlay: combinePlay, buildWalkControls: buildCombineControls });
// Flip It's two-term levels: a wrong answer can go to the full walk, which starts at Rewrite.
export const flipLightPlay = makeLightPlay({ packId: 'flipit', walkPlay: flipitPlay, buildWalkControls: buildFlipControls });
