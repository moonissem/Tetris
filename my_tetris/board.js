import Tetromino from './tetromino.js';
import {
  SIDES, SOUNDS, STACK_STATES, TURNS,
} from './constants.js';
import SoundPlayer from './sound_player.js';

const { OK, NOT_UPDATABLE } = STACK_STATES;
const {
  LEFT, RIGHT, UP, DOWN,
} = SIDES;
const { CLOCKWISE_TURN, COUNTERCLOCKWISE_TURN } = TURNS;
const {
  CLEARED_ROW_SOUND, HARD_DROP_SOUND, TETROMINO_LOCKED_SOUND, ON_EDGE_SOUND,
} = SOUNDS;

export default class Board {
  static columns = 10;

  static rows = 22;

  constructor(gameCanvas, nextCanvas1, nextCanvas2, nextCanvas3, holdCanvas, blockSize) {
    this.blockSize = blockSize;
    this.ctxMain = gameCanvas.getContext('2d');
    this.ctxNext1 = nextCanvas1.getContext('2d');
    this.ctxNext2 = nextCanvas2.getContext('2d');
    this.ctxNext3 = nextCanvas3.getContext('2d');
    this.ctxHold = holdCanvas.getContext('2d');
    this.gameField = Board.createEmptyGameField();
    this.tetrominoes = new Tetromino();
    this.tetrominoOnBoard = Board.setTetrominoOnBoard(this.tetrominoes.current);
    this.displayGhostTetromino = true;
    this.displayNextTetrominoes = true;
    this.holdAllowed = true;
    this.stackNeedsUpdate = false;
    this.stackState = OK;
  }

  // returns a 2D array representing an empty game field
  // each cell has an integer (0: empty, 1: filled) and a string (the color at that position)
  static createEmptyGameField() {
    return Array.from({ length: Board.rows }, () => Array(Board.columns).fill([0, '']));
  }

  // creates a copy of the current tetromino to avoid changing its initial values permanently
  static setTetrominoOnBoard(tetromino) {
    return { ...tetromino };
  }

  // redraws the canvases and if the tetromino cannot move further it locks it in the stack
  updateField() {
    this.clearCanvas();
    const {
      stack, currentTetromino, ghostTetromino, nextTetromino1, nextTetromino2, nextTetromino3, heldTetromino,
    } = this.getUpdatableObjects();

    // draw the current stack
    Board.drawBlocks(stack);

    // draw current tetromino
    Board.drawBlocks(currentTetromino);

    // draw ghost tetromino, unless the user has chosen to hide it
    if (this.displayGhostTetromino) {
      Board.drawBlocks(ghostTetromino);
    }

    // draw next tetrominoes, unless the user chose to hide them
    if (this.displayNextTetrominoes) {
      Board.drawBlocks(nextTetromino1);
      Board.drawBlocks(nextTetromino2);
      Board.drawBlocks(nextTetromino3);
    }

    // draw held tetromino, if applicable
    if (this.tetrominoes.held) {
      Board.drawBlocks(heldTetromino);
    }

    // check if the tetromino needs to be locked in the stack, if so lock it and set new tetrominoes
    if (this.stackNeedsUpdate) {
      this.updateStack();
      this.tetrominoes.setCurrentAndNext();
      this.tetrominoOnBoard = Board.setTetrominoOnBoard(this.tetrominoes.current);

      // when the number of empty rows gets low play a sound effect
      const topOccupiedRow = Board.getTopOccupiedRow(this.gameField);
      if (topOccupiedRow <= 7) {
        SoundPlayer.playOnEdgeSoundFX(ON_EDGE_SOUND, topOccupiedRow);
      } else {
        SoundPlayer.pauseSound(ON_EDGE_SOUND);
      }
      this.stackNeedsUpdate = false;
    }
  }

  // returns an object that holds properties for different objects that might need to be updated when a new frame is rendered
  getUpdatableObjects() {
    const stack = {
      location: this.ctxMain,
      size: this.blockSize,
      shape: this.gameField,
      xPos: 0,
      yPos: 0,
      isStack: true,
    };
    const currentTetromino = {
      location: this.ctxMain,
      size: this.blockSize,
      shape: this.tetrominoOnBoard.shape,
      color: this.tetrominoOnBoard.color,
      xPos: this.tetrominoOnBoard.xPos,
      yPos: this.tetrominoOnBoard.yPos,
    };
    const ghostPos = this.calculateHardDrop(this.tetrominoOnBoard);
    const ghostTetromino = {
      location: this.ctxMain,
      size: this.blockSize,
      shape: this.tetrominoOnBoard.shape,
      xPos: ghostPos.finalXPos,
      yPos: ghostPos.finalYPos,
      isGhost: true,
    };
    const { shape: shape1, color: color1 } = Tetromino.tetrominoShapes[this.tetrominoes.nextTetrominoes[0]];
    let [offsetX, offsetY] = Board.getPosOffsetForSideCanvas(shape1);
    const nextTetromino1 = {
      location: this.ctxNext1,
      size: this.blockSize,
      shape: shape1,
      color: color1,
      xPos: offsetX,
      yPos: offsetY,
    };
    const { shape: shape2, color: color2 } = Tetromino.tetrominoShapes[this.tetrominoes.nextTetrominoes[1]];
    [offsetX, offsetY] = Board.getPosOffsetForSideCanvas(shape2);
    const nextTetromino2 = {
      location: this.ctxNext2,
      size: this.blockSize,
      shape: shape2,
      color: color2,
      xPos: offsetX,
      yPos: offsetY,
    };
    const { shape: shape3, color: color3 } = Tetromino.tetrominoShapes[this.tetrominoes.nextTetrominoes[2]];
    [offsetX, offsetY] = Board.getPosOffsetForSideCanvas(shape3);
    const nextTetromino3 = {
      location: this.ctxNext3,
      size: this.blockSize,
      shape: shape3,
      color: color3,
      xPos: offsetX,
      yPos: offsetY,
    };
    let heldTetromino;
    if (this.tetrominoes.held) {
      [offsetX, offsetY] = Board.getPosOffsetForSideCanvas(this.tetrominoes.held.shape);
      heldTetromino = {
        location: this.ctxHold,
        size: this.blockSize,
        shape: this.tetrominoes.held.shape,
        color: this.tetrominoes.held.color,
        xPos: offsetX,
        yPos: offsetY,
      };
    }
    return {
      stack, currentTetromino, ghostTetromino, nextTetromino1, nextTetromino2, nextTetromino3, heldTetromino,
    };
  }

  // draws the different types of tetrominoes and the blocks on the stack
  static drawBlocks(object2draw) {
    const {
      location, size, shape, xPos, yPos, isGhost, isStack,
    } = object2draw;
    let { color } = object2draw;
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (isStack ? cell[0] === 1 : cell === 1) {
          location.beginPath();
          location.roundRect((xPos + x) * size, (yPos + y) * size, size, size, [3]);
          if (!isGhost) {
            const gradient = location.createLinearGradient((xPos + x) * size, (yPos + y) * size, (xPos + x + 1) * size, (yPos + y + 1) * size);
            if (isStack) {
              color = cell[1];
            }
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, Board.getShadeOfColor(color, -10));
            gradient.addColorStop(1, Board.getShadeOfColor(color, -40));
            location.fillStyle = gradient;
            location.fill();
          }
          location.strokeStyle = '#FFFFFF';
          location.lineWidth = 1;
          location.stroke();
        }
      });
    });
  }

  // locks a tetromino in the stack
  updateStack() {
    this.tetrominoOnBoard.shape.forEach((row, y) => {
      row.forEach((cellValue, x) => {
        if (cellValue === 1) {
          if ((this.tetrominoOnBoard.yPos + y) < 0) {
            this.stackState = NOT_UPDATABLE;
            return;
          }
          this.gameField[this.tetrominoOnBoard.yPos + y][this.tetrominoOnBoard.xPos + x] = [1, this.tetrominoOnBoard.color];
        }
      });
    });
  }

  // checks if the tetromino position/state can be changed, either due to user input or automatic downward movement
  // if so update its position
  updatePos(direction = 'default') {
    const { yPos, xPos } = this.tetrominoOnBoard;
    switch (direction) {
      case 'ArrowLeft': {
        const newXPos = xPos - 1;
        if (this.isPositionValid(yPos, newXPos)) {
          this.tetrominoOnBoard.xPos = newXPos;
        }
        break;
      }
      case 'ArrowRight': {
        const newXPos = xPos + 1;
        if (this.isPositionValid(yPos, newXPos)) {
          this.tetrominoOnBoard.xPos = newXPos;
        }
        break;
      }
      case 'KeyX':
      case 'ArrowUp':
        this.calculateAndVerifyRotation(CLOCKWISE_TURN);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.calculateAndVerifyRotation(COUNTERCLOCKWISE_TURN);
        break;
      case 'Space': {
        this.tetrominoOnBoard.yPos = this.calculateHardDrop(this.tetrominoOnBoard).finalYPos;
        this.stackNeedsUpdate = true;
        this.tetrominoes.canHold = true;
        SoundPlayer.playSound(HARD_DROP_SOUND);
        break;
      }
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        if (this.holdAllowed) {
          const canHold = this.tetrominoes.setHeld();
          if (canHold) {
            this.tetrominoOnBoard = Board.setTetrominoOnBoard(this.tetrominoes.current);
          }
        }
        break;
      case 'ArrowDown':
      case 'default': {
        const newYPos = yPos + 1;
        if (this.isPositionValid(newYPos, xPos)) {
          this.tetrominoOnBoard.yPos = newYPos;
          break;
        }
        SoundPlayer.playSound(TETROMINO_LOCKED_SOUND);
        this.stackNeedsUpdate = true;
        this.tetrominoes.canHold = true;
        return false;
      }
      default:
        break;
    }
    return true;
  }

  // since tetrominoes can have blocks that are not solid, this returns the start and end of relevant blocks to compare it to the stack
  getTetrominoPosRelativeToField(xPos, yPos) {
    const colStart = xPos + Tetromino.getSolidBlockOnSideOffset(this.tetrominoOnBoard, LEFT);
    const colEnd = xPos + Tetromino.getSolidBlockOnSideOffset(this.tetrominoOnBoard, RIGHT);
    const rowStart = yPos + Tetromino.getSolidBlockOnSideOffset(this.tetrominoOnBoard, UP);
    const rowEnd = yPos + Tetromino.getSolidBlockOnSideOffset(this.tetrominoOnBoard, DOWN);
    return {
      colStart, colEnd, rowStart, rowEnd,
    };
  }

  // checks if a position is within bounds and if it's in conflict with the stack
  isPositionValid(yPos = this.tetrominoOnBoard.yPos, xPos = this.tetrominoOnBoard.xPos) {
    const posRelativeToField = this.getTetrominoPosRelativeToField(xPos, yPos);
    const {
      colStart, colEnd, rowStart, rowEnd,
    } = posRelativeToField;
    // checks that the tetromino is within game area
    if (colStart < 0 || colEnd >= Board.columns || rowEnd >= Board.rows) {
      return false;
    }
    // checks if the tetromino would be in a space that's already occupied
    for (let yBoard = rowStart, yTetromino = rowStart - yPos; yBoard <= rowEnd; yBoard++, yTetromino++) {
      for (let xBoard = colStart, xTetromino = colStart - xPos; xBoard <= colEnd; xBoard++, xTetromino++) {
        if (yBoard < Board.rows && yBoard >= 0 && xBoard < Board.columns && xBoard >= 0) {
          if (this.gameField[yBoard][xBoard][0] === 1 && this.tetrominoOnBoard.shape[yTetromino][xTetromino] === 1) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // calculates the final x and y positions after performing a hard drop
  calculateHardDrop(tetromino) {
    let validPosition = true;
    const finalXPos = tetromino.xPos;
    let finalYPos = tetromino.yPos;
    while (validPosition) {
      validPosition = this.isPositionValid(finalYPos + 1, finalXPos);
      if (validPosition) {
        finalYPos += 1;
      }
    }
    return { finalXPos, finalYPos };
  }

  // calculates a new tetromino shape when it's rotated
  // tests if the position of the new shape is valid, if not try to do a wall kick
  // if that's not possible either, revert to the original orientation
  calculateAndVerifyRotation(direction) {
    const { shape: originalShape } = this.tetrominoOnBoard;
    switch (direction) {
      case CLOCKWISE_TURN:
        this.tetrominoOnBoard.shape = originalShape[0].map((value, index) => originalShape.map((row) => row[index]).reverse());
        break;
      case COUNTERCLOCKWISE_TURN:
        this.tetrominoOnBoard.shape = originalShape[0].map((value, index) => originalShape.map((row) => row[row.length - index - 1]));
        break;
      default:
        break;
    }
    if (!this.isPositionValid() && !this.canKickWall()) {
      this.tetrominoOnBoard.shape = originalShape;
    }
  }

  // checks if a rotated tetromino that's in an invalid position can kick the wall/stack
  // if so update it's position
  canKickWall() {
    const [yPos, xPos] = [this.tetrominoOnBoard.yPos, this.tetrominoOnBoard.xPos];

    // move one row up, move one row down, move one column left, move one column right
    const posChanges = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // the i tetromino can move one or two positions depending on which side makes the kick
    // the following block adds two spaces to each direction if the tetromino is i
    // if not, all moves are already present in posChanges
    let allPosChanges = posChanges;
    if (this.tetrominoOnBoard.color === Tetromino.tetrominoShapes.i.color) {
      allPosChanges = posChanges.concat(posChanges.map(([y, x]) => [y * 2, x * 2]));
    }

    // check if kick positions are valid
    // if so set new x and y positions, if not return false
    let canKickWall = false;
    allPosChanges.some(([changeY, changeX]) => {
      const [newY, newX] = [yPos + changeY, xPos + changeX];
      if (this.isPositionValid(newY, newX)) {
        this.tetrominoOnBoard.yPos = newY;
        this.tetrominoOnBoard.xPos = newX;
        canKickWall = true;
        return true;
      }
      return false;
    });

    return canKickWall;
  }

  // clears a row in the game field and inserts a new, empty row at the top
  clearRow(row2clear) {
    for (let row = row2clear; row > 0; row--) {
      this.gameField[row] = this.gameField[row - 1];
    }
    this.gameField[0] = Array(Board.columns).fill([0, '']);
  }

  // checks if a row is complete (if so call clearRow) finally return the number of cleared rows
  checkCompleteRows() {
    let clearedRows = 0;
    const { gameField } = this;
    for (let row = 0; row < Board.rows; row++) {
      const rowIsComplete = gameField[row].every((cell) => cell[0] !== 0);
      if (rowIsComplete) {
        this.clearRow(row);
        SoundPlayer.playSound(CLEARED_ROW_SOUND);
        clearedRows += 1;
      }
    }
    return clearedRows;
  }

  // clears a given canvas or all of them
  clearCanvas(providedLocation) {
    if (providedLocation) {
      providedLocation.clearRect(0, 0, providedLocation.canvas.width, providedLocation.canvas.height);
    } else {
      this.ctxMain.clearRect(0, 0, this.ctxMain.canvas.width, this.ctxMain.canvas.height);
      this.ctxNext1.clearRect(0, 0, this.ctxNext1.canvas.width, this.ctxNext1.canvas.height);
      this.ctxNext2.clearRect(0, 0, this.ctxNext2.canvas.width, this.ctxNext2.canvas.height);
      this.ctxNext3.clearRect(0, 0, this.ctxNext3.canvas.width, this.ctxNext3.canvas.height);
      this.ctxHold.clearRect(0, 0, this.ctxHold.canvas.width, this.ctxHold.canvas.height);
    }
  }

  // draws a countdown when a new game starts
  drawCountdown(count) {
    this.clearCanvas(this.ctxMain);
    const fontSize = this.blockSize * 5;
    Board.addTextToCanvas(this.ctxMain, count, fontSize);
    return count === 1;
  }

  // sets a fontSize and calls a method to draw a phrase on a canvas
  drawGameOverMessage() {
    const fontSize = this.blockSize * 1.8;
    Board.addTextToCanvas(this.ctxMain, 'Game Over', fontSize, '#FF0000');
  }

  // sets a fontSize and calls a method to draw a phrase on a canvas, but first clear it
  drawPausedMessage() {
    this.clearCanvas(this.ctxMain);
    const fontSize = this.blockSize * 2;
    Board.addTextToCanvas(this.ctxMain, 'Paused', fontSize);
  }

  // gets the highest row that's occupied
  static getTopOccupiedRow(gameField) {
    return gameField.findIndex((row) => row.some((cell) => cell[0] === 1));
  }

  // gets x and y offesets to center tetrominoes in the next and hold canvases
  static getPosOffsetForSideCanvas(shape) {
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;
    let xPosOffset;
    if (shapeWidth > 3) {
      xPosOffset = 0;
    } else if (shapeWidth > 2) {
      xPosOffset = 0.5;
    } else {
      xPosOffset = 1;
    }
    let yPosOffset;
    if (shapeHeight > 3) {
      yPosOffset = 0.5;
    } else {
      yPosOffset = 1;
    }
    return [xPosOffset, yPosOffset];
  }

  // draws text in a given canvas
  static addTextToCanvas(ctx, text, fontSize, color = '#FFFFFF') {
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    const xPos = ctx.canvas.width / 2;
    const yPos = ctx.canvas.height / 2;
    ctx.fillText(text, xPos, yPos);
  }

  // returns a hex color code that's a percent darker or lighter than an input hex color code
  static getShadeOfColor(color, percent) { // adapted from https://stackoverflow.com/a/13532993
    const redDec = Board.hex2Dec(color.substring(1, 3));
    const greenDec = Board.hex2Dec(color.substring(3, 5));
    const blueDec = Board.hex2Dec(color.substring(5, 7));

    const newRed = Board.calculateNewShade(redDec, percent);
    const newGreen = Board.calculateNewShade(greenDec, percent);
    const newBlue = Board.calculateNewShade(blueDec, percent);

    const redHex = Board.dec2hex(newRed);
    const greenHex = Board.dec2hex(newGreen);
    const blueHex = Board.dec2hex(newBlue);

    return `#${redHex}${greenHex}${blueHex}`;
  }

  // returns a color value that's percentChange higher or lower than startValue
  static calculateNewShade(startValue, percentChange) {
    return Math.min(255, Math.round((startValue * (100 + percentChange)) / 100));
  }

  // converts a hexadecimal to decimal
  static hex2Dec(hexadecimal) {
    return parseInt(hexadecimal, 16);
  }

  // converts a decimal to hexadecimal
  static dec2hex(decimal) {
    return decimal.toString(16).padStart(2, '0');
  }
}
