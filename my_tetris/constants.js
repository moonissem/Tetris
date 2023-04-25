// Game state constants
const NEW = 'new';
const RUNNING = 'running';
const UPDATING = 'updating';
const PAUSED = 'paused';
const ENDING = 'ending';
const ENDED = 'ended';
const GAME_STATES = {
  NEW, RUNNING, UPDATING, PAUSED, ENDING, ENDED,
};

// Stack state constants
const OK = 'ok';
const NOT_UPDATABLE = 'not updatable';
const STACK_STATES = { OK, NOT_UPDATABLE };

// Side constants
const LEFT = 'left';
const RIGHT = 'right';
const UP = 'up';
const DOWN = 'down';
const SIDES = {
  LEFT, RIGHT, UP, DOWN,
};

// Rotation constants
const CLOCKWISE_TURN = 'clockwise turn';
const COUNTERCLOCKWISE_TURN = 'counter-clockwise turn';
const TURNS = { CLOCKWISE_TURN, COUNTERCLOCKWISE_TURN };

// Sound constants
const BACKGROUND_MUSIC = new Audio('resources/static/sounds/TwisterTetris_poinl.mp3'); // opengameart.org
const CLEARED_ROW_SOUND = new Audio('resources/static/sounds/button-46.mp3'); // gamesounds.xyz
const HARD_DROP_SOUND = new Audio('resources/static/sounds/switch-1.mp3'); // gamesounds.xyz
const TETROMINO_LOCKED_SOUND = new Audio('resources/static/sounds/button-50.mp3'); // gamesounds.xyz
const LEVEL_UP_SOUND = new Audio('resources/static/sounds/8bit_status_point_9.mp3'); // gamesounds.xyz
const ON_EDGE_SOUND = new Audio('resources/static/sounds/clock-ticking-4.mp3'); // gamesounds.xyz
const GAME_OVER_SOUND = new Audio('resources/static/sounds/ThisGameIsOver_mccartneytm.mp3'); // opengameart.org

const SOUNDS = {
  BACKGROUND_MUSIC,
  CLEARED_ROW_SOUND,
  HARD_DROP_SOUND,
  TETROMINO_LOCKED_SOUND,
  LEVEL_UP_SOUND,
  ON_EDGE_SOUND,
  GAME_OVER_SOUND,
};

export {
  GAME_STATES, STACK_STATES, SIDES, TURNS, SOUNDS,
};
