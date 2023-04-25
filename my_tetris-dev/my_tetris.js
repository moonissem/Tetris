import Board from './board.js';
import SoundPlayer from './sound_player.js';
import { GAME_STATES, SOUNDS, STACK_STATES } from './constants.js';

const {
  NEW, RUNNING, PAUSED, ENDING, ENDED,
} = GAME_STATES;
const { NOT_UPDATABLE } = STACK_STATES;
const {
  BACKGROUND_MUSIC, LEVEL_UP_SOUND, ON_EDGE_SOUND, GAME_OVER_SOUND,
} = SOUNDS;

export default class MyTetris {
  constructor(gameCanvas, nextCanvas1, nextCanvas2, nextCanvas3, holdCanvas, blockSize, playButton) {
    this.gameField = new Board(gameCanvas, nextCanvas1, nextCanvas2, nextCanvas3, holdCanvas, blockSize);
    this.playButton = playButton;
    this.gameState = NEW;
    this.countdownCount = 3;
    this.baseSpeed = 1000;
    this.speedMultiplier = 0;
    this.speed = this.baseSpeed + (0.2 * this.baseSpeed * this.speedMultiplier);
    this.clearedRows = 0;
    this.level = 1;
    this.points = 0;
    this.animationActive = false;
    this.animationReference = null;
    this.lastRender = -1;
  }

  // executes game functions depending on the gameState
  runGame(key) {
    switch (this.gameState) {
      case NEW: {
        SoundPlayer.playSound(BACKGROUND_MUSIC, true, 0.5);
        const countdownFinished = this.gameField.drawCountdown(this.countdownCount);
        this.countdownCount -= 1;
        if (countdownFinished) {
          this.gameState = RUNNING;
        }
        break;
      }
      case RUNNING:
        SoundPlayer.playSound(BACKGROUND_MUSIC, true, 0.5);
        this.gameField.updatePos(key);
        this.gameField.updateField();
        if (this.gameField.stackState === NOT_UPDATABLE) {
          this.switchGameStates(ENDING);
        } else {
          this.updatePoints();
          const canLevelUp = this.clearedRows >= (10 * this.level);
          if (canLevelUp) {
            this.level = this.increaseLevel(this.level);
            document.getElementById('level').innerHTML = (this.level).toString().padStart(2, '0');
            this.speed = MyTetris.calculateSpeed(this.baseSpeed, this.speedMultiplier, this.level);
          }
        }
        break;
      case PAUSED:
        SoundPlayer.fadeSoundOut(BACKGROUND_MUSIC);
        SoundPlayer.fadeSoundOut(ON_EDGE_SOUND);
        this.gameField.drawPausedMessage();
        break;
      case ENDING:
        SoundPlayer.pauseSound(ON_EDGE_SOUND);
        SoundPlayer.fadeSoundOut(BACKGROUND_MUSIC);
        this.gameField.drawGameOverMessage();
        SoundPlayer.playSound(GAME_OVER_SOUND);
        this.gameState = ENDED;
        this.changePlayButton();
        this.switchAnimationState(false);
        break;
      default:
        break;
    }
  }

  // changes the state of the game and restarts the animation
  switchGameStates(newState) {
    this.switchAnimationState(false);
    this.lastRender = -1;
    this.gameState = newState;
    this.changePlayButton();
    this.switchAnimationState(true);
  }

  // changes the text and color of the button on the page
  changePlayButton() {
    switch (this.gameState) {
      case ENDED:
        this.playButton.innerText = 'Try again';
        this.playButton.classList.remove('btn-danger');
        this.playButton.classList.add('btn-light');
        break;
      case PAUSED:
        this.playButton.innerText = 'Continue';
        this.playButton.classList.remove('btn-danger');
        this.playButton.classList.add('btn-success');
        break;
      default:
        this.playButton.innerText = 'Pause';
        this.playButton.classList.remove('btn-primary');
        this.playButton.classList.add('btn-danger');
    }
  }

  // starts or stops the animation
  switchAnimationState(startAnimation) {
    if (startAnimation === false) {
      this.animationActive = false;
      cancelAnimationFrame(this.animationReference);
    } else {
      this.animationActive = true;
      this.animationReference = requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
  }

  // renders a new animation frame after a time period specified by this.speed
  animate(timestamp) {
    if (this.animationActive) {
      if (this.gameState !== ENDED) {
        if (timestamp - this.lastRender >= this.speed) {
          this.lastRender = timestamp;
          this.runGame();
        }
        this.animationReference = requestAnimationFrame((timestamp) => this.animate(timestamp));
      }
    } else {
      cancelAnimationFrame(this.animationReference);
    }
  }

  // increases the value of points if rows were cleared
  updatePoints() {
    const newlyClearedRows = this.gameField.checkCompleteRows();
    if (newlyClearedRows > 0) {
      this.clearedRows += newlyClearedRows;
      document.getElementById('lines').innerText = (this.clearedRows).toString().padStart(4, '0');
      this.points += MyTetris.calculatePoints(newlyClearedRows, this.level);
      document.getElementById('score').innerText = (this.points).toString().padStart(6, '0');
    }
  }

  // whe the level increases: play a sound, print a message on the board, and increase level
  increaseLevel(level) {
    SoundPlayer.playSound(LEVEL_UP_SOUND);
    Board.addTextToCanvas(this.gameField.ctxMain, 'Level up!', this.gameField.blockSize * 0.8);
    return level + 1;
  }

  // updates the game speed due to event (e.g. change in difficulty)
  updateSpeed() {
    this.speed = MyTetris.calculateSpeed(this.baseSpeed, this.speedMultiplier, this.level);
  }

  // calculates the speed of the game depending on the level and a multiplier specified by the chosen difficulty
  static calculateSpeed(baseSpeed, multiplier, level) {
    const speedByLevel = baseSpeed * (0.9 - (level - 1) * 0.007) ** (level - 1);
    const speedByMultiplier = 0.2 * speedByLevel * multiplier;
    return speedByLevel + speedByMultiplier;
  }

  // calculates the score that's displayed to the user
  static calculatePoints(clearedRowNum, level) {
    const pointsPerClearedRow = {
      1: 40, 2: 100, 3: 300, 4: 1200,
    };
    return pointsPerClearedRow[clearedRowNum] * level;
  }
}
