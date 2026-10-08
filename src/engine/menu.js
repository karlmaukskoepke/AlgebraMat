// What the top menu's dropdowns list (Karl, 2026-10-08): for each section, its cards and each card's level buttons, with
// which are finished and which are open. Pure logic, no DOM.

import { isLevelDone, isLevelUnlocked } from './progress.js';

export function menuEntries(sections, packs, progress) {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    cards: section.packs.map((id) => packs.find((p) => p.id === id)).filter(Boolean).map((pack) => (pack.comingSoon
      ? { id: pack.id, title: pack.title, soon: true, levels: [] }
      : {
        id: pack.id,
        title: pack.title,
        soon: false,
        levels: Array.from({ length: pack.levels }, (_, i) => ({
          level: i + 1,
          done: isLevelDone(progress, pack.id, i + 1),
          open: isLevelUnlocked(progress, pack.id, i + 1),
          name: pack.levelNames[i],
        })),
      })),
  }));
}
