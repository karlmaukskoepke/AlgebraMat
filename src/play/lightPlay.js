// Light mode's play adapter (SPEC-SCAFFOLD.md): the same interface as the other packs', so the shared play screen
// runs it. The student types the answer; supports come in when a wrong answer or I'm stuck calls for them, and the
// full walk (Combine it's Draw → Party or Battle → Cancel → Answer) is the last rung.

import { newLightSession, reduceLight } from '../engine/lightSession.js';
import { combinePlay, buildCombineControls } from './combinePlay.js';
import { buildLightControls } from '../view/lightControls.js';
import { renderLightMat } from '../view/lightMat.js';
import { lightFeedbackText } from '../view/lightFeedback.js';
import { formatProblem } from '../engine/expr.js';
import { speak } from '../view/speech.js';

const LIGHT_STEPS = [{ id: 'answer', label: 'Answer' }];
const SUPPORT_STEPS = {
  partyBattle: [{ id: 'partyBattle', label: 'Party or Battle?' }, { id: 'answer', label: 'Answer' }],
  cloze: [{ id: 'cloze', label: 'Say it' }, { id: 'answer', label: 'Answer' }],
};

// Both palettes live in the footer, one shown at a time: light mode's, or the full walk's.
export function buildLightPlayControls(root, dispatch) {
  root.innerHTML = '';
  const lightRoot = document.createElement('div');
  const walkRoot = document.createElement('div');
  lightRoot.className = walkRoot.className = 'dist-controls';
  root.append(lightRoot, walkRoot);
  const light = buildLightControls(lightRoot, dispatch);
  const walk = buildCombineControls(walkRoot, dispatch);
  const OFF = { step: 'inactive', stage: 'inactive', zones: [], skipped: [] };
  return {
    update(s, hint = null) {
      const walking = s.stage === 'walk';
      lightRoot.hidden = walking;
      walkRoot.hidden = !walking;
      if (s.step === 'levelDone') { light.update(s); walk.update({ ...OFF, step: 'levelDone' }); return; }
      light.update(walking ? { ...OFF } : s);
      walk.update(walking ? s.walk : { ...OFF }, walking ? hint : null);
    },
  };
}

export const lightPlay = {
  steps: (s) => (s.stage === 'walk' ? combinePlay.steps() : s.stage === 'support' ? SUPPORT_STEPS[s.support] : LIGHT_STEPS),
  newSession: newLightSession,
  reduce: reduceLight,
  feedbackText: lightFeedbackText,
  buildControls: buildLightPlayControls,
  effects(before, s) {
    // A picked choice is read aloud (once: the id changes each time).
    if (before && s.spoken && s.spoken.id !== before.spoken?.id) speak(s.spoken.text);
    if (s.stage !== 'walk') return { hint: null };
    return combinePlay.effects(before?.stage === 'walk' ? before.walk : null, s.walk);
  },
  renderMat(s, fx = {}) {
    if (s.stage === 'walk') return combinePlay.renderMat(s.walk, fx);
    const cloze = s.stage === 'support' && s.cloze ? s.cloze : null;
    return renderLightMat({ problemText: formatProblem(s.problem), typed: s.entry, done: s.stage === 'done', cloze, said: s.said });
  },
  matAction: (d) => (d.action === 'choice' ? { type: 'pickChoice', index: Number(d.index) } : combinePlay.matAction(d)),
};
