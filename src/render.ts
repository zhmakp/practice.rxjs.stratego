import { fromEvent, Subject, Observable, of } from "rxjs";
import { Piece, GamePiece, PieceColor } from "./models/piece.model";
import { blue, red, hiddenIcons, pieceIcons } from "./img";
import { Square } from "./models/square.model";
import { map, distinctUntilChanged } from "rxjs/operators";
import { generateMap } from "./utils";
import { MAX_WIDTH, MAX_HEIGHT, SQUARE_SIZE } from "./config";

let createHiDPICanvas = function (id: string, w: number, h: number, ratio: number) {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
  return canvas;
}

const fieldCanvas = createHiDPICanvas("field", MAX_WIDTH, MAX_HEIGHT, window.devicePixelRatio);
const fieldCtx = fieldCanvas.getContext('2d');

const gamePiecesCanvas = createHiDPICanvas("game-pieces", MAX_WIDTH, MAX_HEIGHT, window.devicePixelRatio)
const gamePiecesCtx = gamePiecesCanvas.getContext("2d");

const boundaries = gamePiecesCanvas.getBoundingClientRect();

export const field: Square[] = generateMap();

const strokeRect = (ctx2d: CanvasRenderingContext2D) => (square: Square) => {
  ctx2d.lineWidth = 1;
  ctx2d.strokeStyle = "black";
  ctx2d.strokeRect(square.x, square.y, square.size, square.size);
}

field.map(strokeRect(fieldCtx));

export const selectedSquare$: Observable<Square> = fromEvent(gamePiecesCanvas, 'mousedown')
  .pipe(map((e: MouseEvent) => {
    const mx = e.clientX - boundaries.left;
    const my = e.clientY - boundaries.top;

    return field.find((square) =>
      mx >= square.x && mx <= square.x + square.size &&
      my >= square.y && my <= square.y + square.size
    )
  }), distinctUntilChanged())

export const clearRect = ((ctx2d: CanvasRenderingContext2D) => (square: Square) => {
  ctx2d.clearRect(square.x, square.y, square.size, square.size);
})(gamePiecesCtx)

export const fillRect = ((ctx2d: CanvasRenderingContext2D) => (square: Square, color: string) => {
  ctx2d.clearRect(square.x, square.y, square.size, square.size);
  ctx2d.fillStyle = color;
  ctx2d.fillRect(square.x, square.y, square.size, square.size);
})(gamePiecesCtx)

const drawImageWithCache =
  (cache: { [key: string]: HTMLImageElement }) =>
    (square: Square, src: string) => {
      if (src in cache) {
        gamePiecesCtx.drawImage(cache[src], Math.round(square.x), Math.round(square.y), square.size, square.size)
      }

      const img = new Image(square.size, square.size);

      img.onload = () => {
        gamePiecesCtx.drawImage(img, Math.round(square.x), Math.round(square.y), square.size, square.size)
        cache[src] = img;
      }
      img.src = src;
    }

const drawImage = drawImageWithCache({});

export const drawPlayerGamePiece = (gamePiece: GamePiece) => {
  const { square, color, type } = gamePiece;

  drawImage(square, pieceIcons[color][type]);
}

export const drawOponentGamePiece = (gamePiece: GamePiece) => {
  drawImage(gamePiece.square, hiddenIcons[gamePiece.color]);
} 