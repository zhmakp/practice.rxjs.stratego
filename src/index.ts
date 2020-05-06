import { selectedSquare$, clearRect, fillRect, drawPlayerGamePiece, drawOponentGamePiece, drawPossibleMovements } from './render';
import { Subject, Observable, BehaviorSubject, merge, zip, of, concat, interval } from 'rxjs';
import { withLatestFrom, filter, pairwise, startWith, scan, takeWhile, map, skipUntil, distinctUntilChanged, switchMap, skipWhile, tap, take, flatMap, mergeMap, debounceTime, debounce, last, takeUntil } from 'rxjs/operators';
import { Piece, PieceColor, GamePiece, AttackResult } from './models/piece.model';
import { pieces, PIECES_PER_PLAYER, SQUARE_SIZE, END_ROW_TO_SETUP_RED, START_ROW_TO_SETUP_BLUE } from './config';
import { red, blue } from './img';
import { Square } from './models/square.model';
import { intersect, quickSetUp, uuidv4 } from './utils';
import { getMovements } from './movements';
import { canAttack, attack } from './attack';


const selectedPieceMeta$: Subject<{ piece: Piece, node: HTMLElement }> = new Subject();

const createPieceDiv = (piece: Piece, img: string) => {
  let pieceDiv = document.createElement('div') as HTMLDivElement;
  pieceDiv.id = piece.type;
  pieceDiv.style.backgroundImage = `url('${img}')`;
  pieceDiv.onclick = (e: any) => selectedPieceMeta$.next({ piece: piece, node: e.target })
  return pieceDiv;
}

const pieceTypesRed = document.getElementById('piece-types-red');
pieces.forEach((piece: Piece) => {
  const pieceDiv = createPieceDiv(piece, red[piece.type]);
  pieceTypesRed.appendChild(pieceDiv);
});

const pieceTypesBlue = document.getElementById('piece-types-blue');
pieces.forEach((piece: Piece) => {
  const pieceDiv = createPieceDiv(piece, blue[piece.type]);
  pieceTypesBlue.appendChild(pieceDiv);
});

const isOccupaied = (selected: Square, gamePieces: GamePiece[]) => {
  return selected && gamePieces.some((x => intersect(x.square)(selected)));
}

const hasPiecesOfType = (selected: Piece, color: PieceColor, gamePieces: GamePiece[]) => {
  return gamePieces.filter(x => x.color === color && x.type == selected.type).length < selected.numberOfPieces
}

const gamePiecesChanged$: BehaviorSubject<GamePiece[]> = new BehaviorSubject([]);

const occupiedSquares$ = gamePiecesChanged$.pipe(map(x => x.map(y => y.square)));

const turnChanged$ = new Subject();

const currentColor$: Observable<PieceColor> = turnChanged$.pipe(
  startWith("red"),
  scan((color: PieceColor) => color === 'red' ? 'blue' : 'red'));

const gameStarted$ = gamePiecesChanged$.pipe(
  filter((pieces) => pieces.length === (PIECES_PER_PLAYER * 2)),
  take(1));

const posibleMovementsChanged$: Subject<Square[]> = new Subject();

const selectedGamePiece$ = selectedSquare$.pipe(
  skipUntil(gameStarted$),
  withLatestFrom(gamePiecesChanged$, currentColor$),
  filter(([square, pieces, color]) => pieces.some(x => intersect(x.square)(square) && x.color === color)),
  map(([square, pieces, color]) => pieces.find(x => intersect(x.square)(square) && x.color === color)),
)

selectedSquare$.pipe(
  withLatestFrom(selectedPieceMeta$, currentColor$, gamePiecesChanged$),
  filter(([selected, meta, color, gamePieces]) => !isOccupaied(selected, gamePieces) && hasPiecesOfType(meta.piece, color, gamePieces)),
  takeUntil(gameStarted$)
).subscribe(([selectedSquare, meta, color, gamePieces]) => {

  if (color === 'red' && selectedSquare.y > (END_ROW_TO_SETUP_RED * SQUARE_SIZE)) return;
  if (color === 'blue' && selectedSquare.y < (START_ROW_TO_SETUP_BLUE * SQUARE_SIZE)) return;

  gamePieces = [...gamePieces, {
    rank: meta.piece.rank,
    type: meta.piece.type,
    color: color,
    square: selectedSquare,
    id: uuidv4(),
    hidden: true
  }];

  gamePiecesChanged$.next(gamePieces);

  if (!hasPiecesOfType(meta.piece, color, gamePieces)) {
    meta.node.remove();
  }

  if (gamePieces.length % PIECES_PER_PLAYER === 0) {
    turnChanged$.next();
  }
})

const possibleMovements$ = selectedGamePiece$.pipe(
  withLatestFrom(occupiedSquares$),
  map(([gamePiece, occupiedSquares]) => getMovements(gamePiece, occupiedSquares)),
  tap(movements => posibleMovementsChanged$.next(movements))
);

posibleMovementsChanged$
  .pipe(startWith(null), pairwise())
  .subscribe((movementsChange) => drawPossibleMovements(...movementsChange));

const pieceDestinationClick$ = selectedSquare$.pipe(
  withLatestFrom(possibleMovements$),
  filter(([square, movements]) => movements && movements.some(intersect(square))),
  map(([square]) => square)
)

pieceDestinationClick$.pipe(
  skipUntil(gameStarted$),
  withLatestFrom(selectedGamePiece$, gamePiecesChanged$),
  map(([destination, gamePiece, gamePieces]) => gamePieces.map(x => {
    return x.id === gamePiece.id ? { ...x, square: destination } : x;
  }))
).subscribe((gamePieces) => {
  gamePiecesChanged$.next(gamePieces);
  turnChanged$.next();
})

const enemyUnderAttack$ = selectedSquare$.pipe(
  withLatestFrom(gamePiecesChanged$, currentColor$),
  map(([square, pieces, color]) => pieces.find(x => x.color !== color && intersect(x.square)(square))),
  filter(enemy => !!enemy),
)

const battleResult$ = enemyUnderAttack$.pipe(
  withLatestFrom(selectedGamePiece$, occupiedSquares$),
  filter(([enemy, player, occupied]) => canAttack(player, enemy, occupied)),
  map(([enemy, player]) => ({ enemy, player, result: attack(player, enemy) }))
);

battleResult$.pipe(
  withLatestFrom(gamePiecesChanged$),
  filter(([battleResult]) => battleResult.result !== AttackResult.FlagCaptured)
).subscribe(([battleResult, gamePieces]) => {
  const { enemy, player, result } = battleResult;

  if (result === AttackResult.Victory) {
    gamePieces = gamePieces
      .filter(x => x !== enemy)
      .map(x => x.id === player.id ? { ...x, square: enemy.square, hidden: false } : x)
  }
  if (result === AttackResult.Draw) {
    gamePieces = gamePieces.filter(x => ![enemy, player].includes(x));
  }
  if (result == AttackResult.Defeat) {
    gamePieces = gamePieces
      .filter(x => x !== player)
      .map(x => x === enemy ? { ...x, hidden: false } : x);
  }

  gamePiecesChanged$.next(gamePieces);
  turnChanged$.next();
})

const flagCaptured$ = battleResult$.pipe(
  filter((battleResult) => battleResult.result === AttackResult.FlagCaptured),
);

gamePiecesChanged$.pipe(
  takeUntil(gameStarted$),
  withLatestFrom(currentColor$),
  map(([items, color]) => items.filter(x => x.color === color)),
).subscribe(items => items.forEach(drawPlayerGamePiece))

turnChanged$.pipe(
  tap(() => posibleMovementsChanged$.next([])),
  switchMap(() => gamePiecesChanged$.pipe(take(1))),
  startWith([] as GamePiece[]),
  pairwise(),
  withLatestFrom(currentColor$),
).subscribe(([[prev, cur], color]) => {
  prev.filter(x => !cur.includes(x)).forEach(x => clearRect(x.square));

  cur.forEach(gamePiece => {
    const prevVersion = prev && prev.find(x => x.id === gamePiece.id);

    if (prevVersion && !intersect(prevVersion.square)(gamePiece.square)) {
      clearRect(prevVersion.square);
    }

    if (gamePiece.color !== color && gamePiece.hidden) {
      drawOponentGamePiece(gamePiece);
    } else {
      drawPlayerGamePiece(gamePiece);
    }
  });
});

flagCaptured$.pipe(withLatestFrom(currentColor$)).subscribe(([_, color]) => {
  const modal = document.getElementsByClassName('modal')[0] as HTMLElement;
  modal.style.display = 'block';

  const content = document.getElementsByClassName('modal-content')[0] as HTMLElement;
  content.style.backgroundColor = color;

  const text = document.getElementsByClassName('text')[0] as HTMLElement;
  text.innerText = `${[color[0].toUpperCase(), ...color.slice(1)].join('')} army win!!!`;
})

// NOTE: quick set up for development
// const redPieces = quickSetUp('red', 0, SQUARE_SIZE);
// const bluePieces = quickSetUp('blue', 450, -SQUARE_SIZE);
// const gamePieces = [...redPieces, ...bluePieces];
// gamePiecesChanged$.next(gamePieces);
// turnChanged$.next();
// turnChanged$.next();