// Divide it's Multiply move (Build D, Part 4; Build D-2, Part 4): the shared Multiply menu and fraction blank (engine/multiplyMenu.js,
// lifted out of this file in Build J), configured for Divide it: the fraction is the move; a whole number or −1 is applied to nothing
// here, and Go says why it does not get one x. The engine, its rows, its save bits and its class-sheet words are unchanged. No DOM here.

import { xAlone, coefOf } from './divideBoard.js';
import { makeMultiplyMenu } from './multiplyMenu.js';

export { MULT_KINDS, multOpen } from './multiplyMenu.js';

const menu = makeMultiplyMenu({ xAlone, coefOf });
export const { canPreview, fracOpen, fracOf, typingOpen } = menu;
export const withFractionBlank = menu.withMenu;
