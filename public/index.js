import {
  Cell,
  Universe
} from "wasm-cgol";

import { memory } from 'wasm-cgol/wasm_cgol_bg';

const CELL_SIZE = 5; // px
const GRID_COLOR = '#CCCCCC';
const DEAD_CELL_COLOR = '#FFFFFF';
const ALIVE_CELL_COLOR = '#000000';

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById('cgol-canvas');
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

canvas.addEventListener('click', event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);

  drawGrid();
  drawCells();
});

const ctx = canvas.getContext('2d');

const playPauseButton = document.getElementById('play-pause');

playPauseButton.textContent = '▶';

playPauseButton.addEventListener('click', _ => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

let animationId = null;

function drawCells() {
  const cells = new Uint8Array(memory.buffer, universe.byte_offset(), width * height);

  ctx.beginPath();

  for (let row = 0; row < height; ++row) {
    for (let col = 0; col < width; ++ col) {
      const index = getIndex(row, col);

      ctx.fillStyle = cells[index] === Cell.Dead
        ? DEAD_CELL_COLOR
        : ALIVE_CELL_COLOR;
      
      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
}

function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines
  for (let i = 0; i <= width; ++i) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines
  for (let j = 0; j <= height; ++j) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
}

function getIndex(row, col) {
  return row * width + col;
}

function isPaused() {
  return animationId === null;
}

function pause() {
  playPauseButton.textContent = '▶';

  cancelAnimationFrame(animationId);

  animationId = null;
}

function play() {
  playPauseButton.textContent = '||';

  renderLoop();
}

function renderLoop() {
  universe.tick();

  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
};

drawGrid();
drawCells();
