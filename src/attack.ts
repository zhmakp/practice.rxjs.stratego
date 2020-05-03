import { Piece, PieceType, GamePiece, AttackResult } from "./models/piece.model";
import { Square } from "./models/square.model";
import { SQUARE_SIZE } from "./config";

export function canAttack(piece: GamePiece, pieceUnderAttack: GamePiece, occupied: Square[]) {
  const { type, square } = piece;

  if (piece.color === pieceUnderAttack.color) {
    return false;
  }

  if (type === 'Flag' || type === 'Bomb') {
    return false;
  }

  if (type === 'Scout') {
    const deltaX = (first: Square, second: Square) => {
      return Math.abs(Math.abs(first.x) - Math.abs(second.x));
    }
    
    const deltaY = (first: Square, second: Square) => {
      return Math.abs(Math.abs(first.y) - Math.abs(second.y));
    }

    const dx = Math.abs(pieceUnderAttack.square.x) - Math.abs(square.x);
    const dy = Math.abs(pieceUnderAttack.square.y) - Math.abs(square.y);

    return (dx === 0 || dy === 0) && !occupied.some(s => {
      return (dx > 0 && deltaY(s, piece.square) === 0 && s.x > piece.square.x && s.x < (pieceUnderAttack.square.x)) ||
        (dx < 0 && deltaY(s, piece.square) === 0 && s.x < piece.square.x && s.x > (pieceUnderAttack.square.x)) ||
        (dy > 0 && deltaX(s, piece.square) === 0 && s.y > piece.square.y && s.y < (pieceUnderAttack.square.y)) ||
        (dy < 0 && deltaX(s, piece.square) === 0 && s.y < piece.square.y && s.y > (pieceUnderAttack.square.y))
    })
  }

  const dx = Math.abs(Math.abs(square.x) - Math.abs(pieceUnderAttack.square.x));
  const dy = Math.abs(Math.abs(square.y) - Math.abs(pieceUnderAttack.square.y));

  return (dx === SQUARE_SIZE && dy === 0) || (dy === SQUARE_SIZE && dx === 0)
}

export function attack(piece: GamePiece, target: GamePiece) {

  const winWhenRole = (role: PieceType) => {
    return piece.type === role ? AttackResult.Victory : AttackResult.Defeat;
  }

  switch (target.rank) {
    case 'B':
      return winWhenRole('Miner');
    case 10:
      return winWhenRole('Spy');
    case 'F':
      return AttackResult.FlagCaptured;
    default: {

      if (piece.rank > target.rank) {
        return AttackResult.Victory;
      }

      if (piece.rank === target.rank) {
        return AttackResult.Draw;
      }

      return AttackResult.Defeat;
    }
  }
}