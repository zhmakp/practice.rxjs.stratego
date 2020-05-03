import { selectedSquare$, clearRect, fillRect, drawPlayerGamePiece, drawOponentGamePiece } from './render';
import { Subject, Observable, BehaviorSubject, merge, zip, of, concat, interval } from 'rxjs';
import { withLatestFrom, filter, pairwise, startWith, scan, takeWhile, map, skipUntil, distinctUntilChanged, switchMap, skipWhile, tap, take, flatMap, mergeMap, debounceTime, debounce, last, takeUntil } from 'rxjs/operators';
import { Piece, PieceColor, GamePiece, AttackResult } from './models/piece.model';
import { pieces, PIECES_PER_PLAYER, SQUARE_SIZE } from './config';
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

const isOccupaied = (selected: Square) => {
  return selected && gamePieces.some((x => intersect(x.square)(selected)));
}

const hasPiecesOfType = (selected: Piece, color: PieceColor, gamePieces: GamePiece[]) => {
  return gamePieces.filter(x => x.color === color && x.type == selected.type).length < selected.numberOfPieces
}

let gamePieces: GamePiece[] = [];

const piecesOnFieldChanged$: BehaviorSubject<GamePiece[]> = new BehaviorSubject(gamePieces);

const turnChanged$ = new Subject();

const armyWin$ = new Subject();

const currentColor$: Observable<PieceColor> = turnChanged$.pipe(
  startWith("red"),
  scan((color: PieceColor) => color === 'red' ? 'blue' : 'red'));

const gameStarted$ = piecesOnFieldChanged$.pipe(
  filter((pieces) => pieces.length === (PIECES_PER_PLAYER * 2)),
  take(1));

const posibleMovementsChanged$: Subject<Square[]> = new Subject();

const selectedGamePiece$ = selectedSquare$.pipe(
  skipUntil(gameStarted$),
  withLatestFrom(piecesOnFieldChanged$, currentColor$),
  filter(([square, pieces, color]) => pieces.some(x => intersect(x.square)(square) && x.color === color)),
  map(([square, pieces, color]) => pieces.find(x => intersect(x.square)(square) && x.color === color)),
)

selectedSquare$.pipe(
  withLatestFrom(selectedPieceMeta$, currentColor$, piecesOnFieldChanged$),
  filter(([selected, meta, color, gamePieces]) => !isOccupaied(selected) && hasPiecesOfType(meta.piece, color, gamePieces)),
  takeUntil(gameStarted$)
).subscribe(([selectedSquare, meta, color, gamePieces]) => {

  gamePieces = ([...gamePieces, {
    rank: meta.piece.rank,
    type: meta.piece.type,
    color: color,
    square: selectedSquare,
    id: uuidv4(),
    hidden: true
  }]);
  piecesOnFieldChanged$.next(gamePieces);

  if (!hasPiecesOfType(meta.piece, color, gamePieces)) {
    meta.node.remove();
  }

  if (gamePieces.length % PIECES_PER_PLAYER === 0) {
    turnChanged$.next();
  }
})

selectedGamePiece$
  .pipe(withLatestFrom(piecesOnFieldChanged$))
  .subscribe(([gamePiece, pieces]) => {

    const occupiedSquares = pieces.map((x => x.square));
    const movements: Square[] = getMovements(gamePiece, occupiedSquares);

    posibleMovementsChanged$.next(movements);
  })

posibleMovementsChanged$
  .pipe(startWith(null), pairwise())
  .subscribe(([prev, cur]) => {
    prev?.forEach(move => clearRect(move));
    cur?.forEach(move => fillRect(move, 'greenyellow'))
  });

selectedSquare$.pipe(
  skipUntil(gameStarted$),
  withLatestFrom(posibleMovementsChanged$, selectedGamePiece$),
  filter(([square, movements]) => movements && movements.some(intersect(square))),
).subscribe(([destination, , gamePiece]) => {

  gamePieces = gamePieces.map(x => {
    return x.id === gamePiece.id ? { ...x, square: destination } : x;
  });

  piecesOnFieldChanged$.next(gamePieces);
  turnChanged$.next();
})

const enemyUnderAttack$ = selectedSquare$.pipe(
  withLatestFrom(piecesOnFieldChanged$, currentColor$),
  map(([square, pieces, color]) => pieces.find(x => x.color !== color && intersect(x.square)(square))),
  filter(enemy => !!enemy),
)
const occupied$ = piecesOnFieldChanged$.pipe(map(x => x.map(y => y.square)));
enemyUnderAttack$.pipe(
  withLatestFrom(selectedGamePiece$, occupied$),
  filter(([enemy, player, occupied]) => canAttack(player, enemy, occupied)),
).subscribe(([enemy, player]) => {

  const result = attack(player, enemy);

  if (result === AttackResult.FlagCaptured) {
    armyWin$.next();
    return;
  }

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

  piecesOnFieldChanged$.next(gamePieces);
  turnChanged$.next();
})

piecesOnFieldChanged$.pipe(
  takeWhile(items => items.length < (PIECES_PER_PLAYER * 2))
).subscribe(items => items.forEach(drawPlayerGamePiece))

turnChanged$.pipe(
  tap(() => posibleMovementsChanged$.next([])),
  switchMap(() => piecesOnFieldChanged$.pipe(take(1))),
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

armyWin$.pipe(withLatestFrom(currentColor$)).subscribe(([_, color]) => {
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
// gamePieces = [...redPieces, ...bluePieces];
// piecesOnFieldChanged$.next(gamePieces);
// turnChanged$.next();
// turnChanged$.next();