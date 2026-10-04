// Messages for light mode on Distribute, then combine (Karl, 2026-10-03). Its own messages are Groups of Terms' light
// mode's; while a step of the walk (or the hidden 1, or Box & Circle) is showing, that step's messages show, led by why
// it's there when the session says so.

import { distributeFeedbackText } from './distributeFeedback.js';
import { termGroupLightFeedbackText, TG_LIGHT } from './termGroupLightFeedback.js';

export function distributeLightFeedbackText(fb) {
  if (!fb) return '';
  if (fb.src === 'bc') return termGroupLightFeedbackText(fb);         // Box & Circle on the terms inside
  if (fb.src === 'tg' || fb.src === 'dist' || fb.src === 'ts') {
    const base = distributeFeedbackText(fb);
    return fb.lead ? `${TG_LIGHT[fb.lead]()} ${base}` : base;
  }
  return TG_LIGHT[fb.key] ? termGroupLightFeedbackText(fb) : distributeFeedbackText(fb);       // hints are the walk's
}

