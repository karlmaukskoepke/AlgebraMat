// Testing only (Build X): fixed progress states for the test-links page, opened with ?demo=<name>, so Karl can see every status without
// playing for an hour. main.js merges the state into the device's progress (never lowering anything) and, for some, writes what the menu
// "saw last time", so the one-time shine or "New levels added!" shows. Not linked from the app.

import { newProgress, completeLevel, placeLevels } from './progress.js';
import { snapshot } from './status.js';

const earn = (p, id, levels) => levels.reduce((q, l) => completeLevel(q, id, l), p);

// Every status at once: plain, green, silver (earned, and placed), gold, and a gold section (Solve it Plus).
function menuState(packs) {
  let p = newProgress(packs);
  p = earn(p, 'combineit', [1, 2, 3, 4, 5]);                    // gold
  p = earn(p, 'flipit', [1, 2, 3]);                             // silver: 3 of 5 earned
  p = earn(p, 'lasso', [1]);                                    // green: 1 of 7
  p = placeLevels(p, 'boxes', 4);                               // silver: 3 of 6 placed (exactly half is silver)
  p = earn(p, 'add-both', [2, 3, 4, 5, 6]);                     // gold
  p = earn(placeLevels(p, 'divide-it', 5), 'divide-it', [2, 3]); // silver: 2 earned and 1 placed of 5
  p = placeLevels(p, 'flip-everything', 3);                     // green: 1 placed of 5
  p = earn(p, 'variables-both-sides', [1, 2, 3, 4, 5]);         // Solve it Plus: every card gold
  p = earn(p, 'distribute-more', [1, 2, 3, 4, 5]);
  p = earn(p, 'strange-solutions', [1, 2, 3]);
  return p;
}

export function demoProgress(name, packs) {
  if (name === 'menu' || name === 'shine') return menuState(packs);
  if (name === 'placed') return placeLevels(newProgress(packs), 'add-both', 5);    // Add to both sides Levels 1-3 placed
  if (name === 'grew') return earn(newProgress(packs), 'strange-solutions', [1, 2]);
  return null;
}

// What the menu "saw last time", or null to leave it as it is.
export function demoSeen(name, packs, sections) {
  if (name === 'shine') {
    // last time: Strange solutions had Level 3 still to do (silver, Solve it Plus not gold) and Divide it's Level 2 was only placed
    let before = earn(newProgress(packs), 'strange-solutions', [1, 2]);
    before = earn(before, 'variables-both-sides', [1, 2, 3, 4, 5]);
    before = earn(before, 'distribute-more', [1, 2, 3, 4, 5]);
    before = earn(placeLevels(before, 'divide-it', 5), 'divide-it', [3]);
    const now = snapshot(menuState(packs), packs, sections);
    const was = snapshot(before, packs, sections);
    return { packs: { ...now.packs, 'strange-solutions': was.packs['strange-solutions'], 'divide-it': was.packs['divide-it'] }, sections: { ...now.sections, 'solve-plus': was.sections['solve-plus'] } };
  }
  if (name === 'grew') {
    // last time Strange solutions showed two levels, both earned (gold): it shows three now
    const now = snapshot(demoProgress('grew', packs), packs, sections);
    return { ...now, packs: { ...now.packs, 'strange-solutions': { status: 'gold', shown: 2, states: 'EE' } } };
  }
  return null;
}
