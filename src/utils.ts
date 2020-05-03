import { Square } from "./models/square.model";
import { PieceColor } from "./models/piece.model";
import { SQUARE_SIZE, pieces } from "./config";

export const intersect = (first: Square) => (second: Square) => first.x === second.x && first.y === second.y;

export const range = (n: number) => Array.from(Array(n).keys());

export const rangeFrom = (n: number, from: number) => range(n).splice(from);

const mapXY = (width: number, height: number, square: (x: number, y: number) => Square) => {
  return range(width)
    .map(x => range(height).map(y => square(x, y)))
    .reduce((x, y) => x.concat(y))
}

export const generateMap = () => {
  return mapXY(10, 10, (x: number, y: number) => {
    return { x: x * SQUARE_SIZE, y: y * SQUARE_SIZE, size: SQUARE_SIZE };
  });
}

export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const quickSetUp = (color: PieceColor, startY: number, dy: number) => {

  const placeForGamePiece: Square[] = mapXY(10, 4, (x: number, y: number) => {
    return { x: x * SQUARE_SIZE, y: y * dy + startY, size: SQUARE_SIZE };
  });

  const rndIndex = (array: any[]) => Math.floor(Math.random() * array.length);

  const gamePieces = pieces.map((piece) => range(piece.numberOfPieces).map(() => ({
    color: color,
    id: uuidv4(),
    rank: piece.rank,
    type: piece.type,
    square: placeForGamePiece.splice(rndIndex(placeForGamePiece), 1)[0],
    hidden: true
  }))).reduce((prev, cur) => prev.concat(cur))

  return gamePieces;
}