import './style.css';
import { makeProblem } from './engine/expr.js';
import { renderMat } from './view/mat.js';

// Step 3: one hard-coded problem, shown partway through the Cancel step.
// 2 − 6  →  2 + (−6): two ink pluses, six magenta minuses, one pair canceled.
const demo = {
  problem: makeProblem(2, '-', 6),
  rewritten: { op: '+', right: -6 },
  zones: [
    { sign: '+', count: 2, magenta: false, canceled: 1 },
    { sign: '-', count: 6, magenta: true, canceled: 1 },
  ],
};

document.getElementById('mat').append(renderMat(demo));
