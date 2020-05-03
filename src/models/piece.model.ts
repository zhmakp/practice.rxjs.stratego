import { Square } from "./square.model";

export type PieceType = 'Bomb' 
| 'Marshal'
| 'General'
| 'Colonel'
| 'Major'
| 'Captain'
| 'Lieutenant'
| 'Sergeant' 
| 'Miner'
| 'Scout'
| 'Spy'
| 'Flag'

export type PieceColor = 'red' | 'blue';

export type Rank = 'B' | 'F' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Piece {
  type: PieceType;
  numberOfPieces: number;
  rank: Rank;
}

export interface GamePiece {
  type: PieceType,
  rank: Rank;
  color: PieceColor,
  square: Square,
  hidden: boolean,
  id: string
}

export const enum AttackResult {
  Victory,
  Defeat,
  Draw,
  FlagCaptured
}