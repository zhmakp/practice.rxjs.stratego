import { Square } from "./models/square.model";
import { SQUARE_SIZE, MAX_HEIGHT, MAX_WIDTH } from "./config";
import { PieceType, GamePiece } from "./models/piece.model";
import { intersect } from "./utils";

const notMoveable: PieceType[] = ['Bomb', 'Flag'];

function getAnyNumberInStraigntLine(position: Square, occupied: Square[]) {
  let squaresToMove: Square[] = [];

  const moveUntilEnemy = (xDelta: number, yDelta: number) => {
    let lineSquare: Square[] = [];
    let current = { ...position, x: position.x + xDelta, y: position.y + yDelta };
    
    const nextOcuppied = (next: Square) => occupied.some(intersect(next))
    const isAxisXValid = () => current.x >= 0  && current.x < MAX_WIDTH;
    const isAxisYValid = () => current.y >= 0 && current.y < MAX_HEIGHT;

    while (!nextOcuppied(current) && isAxisXValid() && isAxisYValid()) {
      lineSquare.push(current);
      current = { ...current, x: current.x + xDelta, y: current.y + yDelta };
    }

    return lineSquare;
  }

  if (position.x > 0) {
    squaresToMove = squaresToMove.concat(moveUntilEnemy(-SQUARE_SIZE, 0));
  }

  if (position.y > 0) {
    squaresToMove = squaresToMove.concat(moveUntilEnemy(0, -SQUARE_SIZE));
  }

  if (position.x + SQUARE_SIZE <= 500) {
    squaresToMove = squaresToMove.concat(moveUntilEnemy(SQUARE_SIZE, 0));
  }

  if (position.y + SQUARE_SIZE <= 500) {
    squaresToMove = squaresToMove.concat(moveUntilEnemy(0, SQUARE_SIZE));
  }

  return squaresToMove;
}

function getSingleSquareToMove(position: Square, occupied: Square[]) {
  let squaresToMove: Square[] = [];

  if (position.x > 0) {
    squaresToMove.push({ ...position, x: position.x - SQUARE_SIZE });
  }

  if (position.y > 0) {
    squaresToMove.push({ ...position, y: position.y - SQUARE_SIZE });
  }

  if (position.x + SQUARE_SIZE <= 500) {
    squaresToMove.push({ ...position, x: position.x + SQUARE_SIZE });
  }

  if (position.y + SQUARE_SIZE <= 500) {
    squaresToMove.push({ ...position, y: position.y + SQUARE_SIZE });
  }

  return squaresToMove.filter(move => {
    return !occupied.some(square => square.x == move.x && square.y == move.y);
  })
}

export const getMovements = (gamePiece: GamePiece, occupied: Square[]) => {
  
  if (notMoveable.includes(gamePiece.type)) return [];

  if (gamePiece.type === 'Scout') {
    return getAnyNumberInStraigntLine(gamePiece.square, occupied);
  }

  return getSingleSquareToMove(gamePiece.square, occupied);
}