import { Piece } from "./models/piece.model";

export const pieces: Piece[] = [
  { type: 'Bomb', numberOfPieces: 6, rank: 'B' },
  { type: 'Marshal', numberOfPieces: 1, rank: 10 },
  { type: 'General', numberOfPieces: 1, rank: 9 },
  { type: 'Colonel', numberOfPieces: 2, rank: 8 },
  { type: 'Major', numberOfPieces: 3, rank: 7 },
  { type: 'Captain', numberOfPieces: 4, rank: 6 },
  { type: 'Lieutenant', numberOfPieces: 4, rank: 5 },
  { type: 'Sergeant', numberOfPieces: 4, rank: 4 },
  { type: 'Miner', numberOfPieces: 5, rank: 3 },
  { type: 'Scout', numberOfPieces: 8, rank: 2 },
  { type: 'Spy', numberOfPieces: 1, rank: 1 },
  { type: 'Flag', numberOfPieces: 1, rank: 'F' },
]

export const SQUARE_SIZE = 50;

export const PIECES_PER_PLAYER = 40

export const MAX_WIDTH = 500;

export const MAX_HEIGHT = 500;
