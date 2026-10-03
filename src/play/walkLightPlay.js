// Light mode's play adapter for the cards without targeted supports (SPEC-SCAFFOLD.md §8): the student types the
// answer, and a wrong answer or I'm stuck hands the problem to the card's own full walk. One factory serves every
// card, given the card's existing play adapter (its walk), its palette, and its light pieces (engine/lightCards.js).

import { newWalkLight, reduceWalkLight } from '../engine/walkLight.js';
import { CARDS } from '../engine/lightCards.js';
import { buildLightPlayControls } from './lightPlay.js';
import { buildWalkLightControls } from '../view/walkLightControls.js';
import { renderLightMat } from '../view/lightMat.js';
import { walkLightFeedbackText } from '../view/walkLightFeedback.js';
import { prettyAnswer } from '../engine/terms.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';

const LIGHT_STEPS = [{ id: 'answer', label: 'Answer' }];
const CLOZE_STEPS = [{ id: 'cloze', label: 'Say it' }, { id: 'answer', label: 'Answer' }];

export function makeWalkLightPlay({ packId, cardId, walkPlay }) {
  const base = CARDS[cardId];
  const card = { ...base, newWalk: walkPlay.newSession, reduceWalk: walkPlay.reduce };
  return {
    steps: (s) => (s.stage === 'walk' ? walkPlay.steps(s.walk) : s.stage === 'support' ? CLOZE_STEPS : LIGHT_STEPS),
    phaseLabel: (s) => (s.stage === 'walk' ? walkPlay.phaseLabel?.(s.walk) : null),
    newSession: (problem) => newWalkLight(problem, card),
    reduce: (state, action) => reduceWalkLight(state, action, card),
    feedbackText: (fb) => walkLightFeedbackText(fb, walkPlay.feedbackText),
    buildControls: (root, dispatch) =>
      buildLightPlayControls(root, dispatch, walkPlay.buildControls, (r, d) => buildWalkLightControls(r, d, base.pad), walkPlay.newSession),
    effects(before, s) {
      if (!before && s.stage !== 'done') startIntro({ algebra: base.pad === 'algebra' });
      // A finished problem goes in the log (once: the step turns to done once).
      if (before && before.step !== 'done' && s.step === 'done') {
        recordProblem(s, { pack: packId, level: s.problem.logLevel ?? s.problem.level ?? null, problem: base.problemText(s.problem) });
      }
      if (s.stage !== 'walk') return { hint: null };
      return walkPlay.effects(before?.stage === 'walk' ? before.walk : null, s.walk);
    },
    renderMat(s, fx = {}) {
      if (s.stage === 'walk') return walkPlay.renderMat(s.walk, fx);
      return renderLightMat({
        problemText: base.problemText(s.problem),
        cloze: s.stage === 'support' ? s.cloze : null,
        said: s.said,
        typed: s.entry,
        shown: base.pad === 'algebra' ? prettyAnswer(s.entry) : undefined,
        done: s.stage === 'done',
      });
    },
    matAction: (d) => (d.action === 'choice' ? { type: 'pickChoice', index: Number(d.index) } : walkPlay.matAction(d)),
    // The walk's pointer handling (Box & Circle is dragged) sees the walk's session, or an idle one before it starts.
    bindMat: walkPlay.bindMat && ((root, dispatch, getSession) => walkPlay.bindMat(root, dispatch, () => {
      const s = getSession();
      return s?.stage === 'walk' ? s.walk : { step: 'inactive', shapes: [], problem: s?.problem };
    })),
  };
}

import { integerPlay } from './integerPlay.js';
import { bigPlay } from './bigPlay.js';
import { lassoPlay } from './lassoPlay.js';
import { boxPlay } from './boxPlay.js';
import { termGroupPlay } from './termGroupPlay.js';
import { distributePlay } from './distributePlay.js';

export const combineIntegerLightPlay = makeWalkLightPlay({ packId: 'combineit', cardId: 'integers', walkPlay: integerPlay });
export const flipIntegerLightPlay = makeWalkLightPlay({ packId: 'flipit', cardId: 'integers', walkPlay: integerPlay });
export const bigLightPlay = makeWalkLightPlay({ packId: 'combineit', cardId: 'integers', walkPlay: bigPlay });
export const lassoLightPlay = makeWalkLightPlay({ packId: 'lasso', cardId: 'group', walkPlay: lassoPlay });
export const termGroupLightPlay = makeWalkLightPlay({ packId: 'groups-of-terms', cardId: 'termGroups', walkPlay: termGroupPlay });
export const distributeLightPlay = makeWalkLightPlay({ packId: 'distribute-combine', cardId: 'distribute', walkPlay: distributePlay });
