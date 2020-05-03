import { PieceType, PieceColor } from '../models/piece.model';

import r12 from './red/12.png';
import r11 from './red/11.png';
import r10 from './red/10.png';
import r9 from './red/9.png';
import r8 from './red/8.png';
import r7 from './red/7.png';
import r6 from './red/6.png';
import r5 from './red/5.png';
import r4 from './red/4.png';
import r3 from './red/3.png';
import r2 from './red/2.png';
import r1 from './red/1.png';
import r0 from './red/0.png';

type Icons = {
  [K in PieceType]: string
};

export let red: Icons = {
  'Bomb': r11,
  'Marshal': r10,
  'General': r9,
  'Colonel': r8,
  'Major': r7,
  'Captain': r6,
  'Lieutenant': r5,
  'Sergeant': r4,
  'Miner': r3,
  'Scout': r2,
  'Spy': r1,
  'Flag': r12,
}

import b12 from './blue/12.png';
import b11 from './blue/11.png';
import b10 from './blue/10.png';
import b9 from './blue/9.png';
import b8 from './blue/8.png';
import b7 from './blue/7.png';
import b6 from './blue/6.png';
import b5 from './blue/5.png';
import b4 from './blue/4.png';
import b3 from './blue/3.png';
import b2 from './blue/2.png';
import b1 from './blue/1.png';
import b0 from './blue/0.png';

export const blue: Icons = {
  'Bomb': b11,
  'Marshal': b10,
  'General': b9,
  'Colonel': b8,
  'Major': b7,
  'Captain': b6,
  'Lieutenant': b5,
  'Sergeant': b4,
  'Miner': b3,
  'Scout': b2,
  'Spy': b1,
  'Flag': b12,
}

export const hiddenIcons: { [k in PieceColor]: string } = {
  blue: b0,
  red: r0
}

export const pieceIcons: { [k in PieceColor]: Icons }  = {
  blue: blue,
  red: red
}