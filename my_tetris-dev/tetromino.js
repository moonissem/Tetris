import { SIDES } from './constants.js';

const {
  LEFT, RIGHT, UP, DOWN,
} = SIDES;

export default class Tetromino {
  // defines the shapes, colors, and starting positions for the tetrominoes
  static tetrominoShapes = {
    l: {
      shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      color: '#FFA366',
      xPos: 3,
      yPos: -2,
    }, // Orange Ricky
    j: {
      shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      color: '#0099CC',
      xPos: 3,
      yPos: -2,
    }, // Blue Ricky
    z: {
      shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      color: '#FF5A5A',
      xPos: 3,
      yPos: -2,
    }, // Cleveland Z
    s: {
      shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      color: '#70C05A',
      xPos: 3,
      yPos: -2,
    }, // Rhode Island Z
    i: {
      shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      color: '#97FFFF',
      xPos: 3,
      yPos: -3,
    }, // Hero
    t: {
      shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      color: '#A667E7',
      xPos: 3,
      yPos: -2,
    }, // Teewee
    o: {
      shape: [[1, 1], [1, 1]],
      color: '#FFE066',
      xPos: 4,
      yPos: -2,
    }, // Smashboy
  };

  constructor() {
    this.nextTetrominoes = Tetromino.initTetrominoes();
    this.current = null;
    this.next = null;
    this.held = null;
    this.canHold = true;
    this.setCurrentAndNext();
  }

  // creates an array of 3 tetrominoes chosen at random
  static initTetrominoes() {
    return Array.from({ length: 3 }, Tetromino.selectRandomTetromino);
  }

  // selects one tetromino name at random
  static selectRandomTetromino() {
    const tetrominoNames = Object.keys(Tetromino.tetrominoShapes);
    const randomIndex = Math.floor(Math.random() * tetrominoNames.length);
    return tetrominoNames[randomIndex];
  }

  // sets the current tetromino and next tetromino
  // if a held tetromino is to be used, it will be swapped with the current tetromino
  // else take 1st tetromino in listOfNextTetrominoes as current, 2nd as next, add one the list
  setCurrentAndNext(useHeld = false) {
    if (useHeld && !this.held) {
      return;
    }
    const currentTetromino = useHeld ? this.held : Tetromino.tetrominoShapes[this.nextTetrominoes.shift()];
    if (!useHeld) {
      this.nextTetrominoes.push(Tetromino.selectRandomTetromino());
    }
    this.held = useHeld ? this.current : this.held;
    this.current = currentTetromino;
    this.next = Tetromino.tetrominoShapes[this.nextTetrominoes[0]];
  }

  // if a tetromino can be held, swap it with the current tetromino
  // if there was no held tetromino, then current becomes held and next becomes current
  // flag canHold appropriately
  setHeld() {
    if (!this.canHold) {
      return false;
    }
    if (this.held === null) {
      this.held = this.current;
      this.setCurrentAndNext();
    } else {
      this.setCurrentAndNext(true);
    }
    this.canHold = false;
    return true;
  }

  // tetrominoes, except for Smashboy, are surrounded by blocks that are not solid
  // calculates the offset due to those blocks for one side for wall kick and board boundary checks
  static getSolidBlockOnSideOffset(tetromino, side) {
    let position;
    switch (side) {
      case LEFT:
        position = tetromino.shape[0].length;
        tetromino.shape.forEach((row) => {
          const solidPos = row.indexOf(1);
          if (solidPos < position && solidPos >= 0) {
            position = solidPos;
          }
        });
        break;
      case RIGHT:
        position = 0;
        tetromino.shape.forEach((row) => {
          const solidPos = row.lastIndexOf(1);
          if (solidPos > position) {
            position = solidPos;
          }
        });
        break;
      case DOWN:
        position = 0;
        tetromino.shape.forEach((row, i) => {
          if (row.includes(1) && i > position) {
            position = i;
          }
        });
        break;
      case UP:
        position = tetromino.shape.length;
        tetromino.shape.forEach((row, i) => {
          if (row.includes(1) && i < position) {
            position = i;
          }
        });
        break;
      default:
        position = 0;
        break;
    }
    return position;
  }
}
