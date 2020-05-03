import { Square } from "./square.model";
import { Piece } from "./piece.model";

export interface PieceMove {
  square: Square;
  piece: Piece;
  squaresToMove: Square[],
}