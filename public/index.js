import {
  Cell,
  Universe as WasmUniverse
} from "wasm-cgol";

import { memory } from 'wasm-cgol/wasm_cgol_bg';

export class JsUniverse {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height);

    this.setCells([
      [36, 2],
      [37, 3],
      [38, 1],
      [38, 2],
      [38, 3]
    ]);
  }

  aliveNeighborCount(row, col) {
    let count = 0;

    for (const deltaRow of [this.height - 1, 0, 1]) {
      for (const deltaCol of [this.width - 1, 0, 1]) {
        if (deltaRow === 0 && deltaCol === 0) {
          continue;
        }

        const neighborRow = (row + deltaRow) % this.height;
        const neighborCol = (col + deltaCol) % this.width;

        const index = this.index(neighborRow, neighborCol);

        count += this.cells[index];
      }
    }

    return count;
  }

  getCells() {
    return this.cells;
  }

  index(row, col) {
    return row * this.width + col;
  }

  setCells(cells) {
    for (const [row, col] of cells) {
      const index = this.index(row, col);

      this.cells[index] = 1;
    }
  }

  tick() {
    let next = this.cells.slice();

    for (let row = 0; row < this.height; ++row) {
      for (let col = 0; col < this.width; ++col) {
        const index = this.index(row, col);
        const cell = this.cells[index];
        const aliveNeighbors = this.aliveNeighborCount(row, col);

        let nextCell;

        // Rule 1: Any alive cell with fewer than two alive neighbors dies, as if by underpopulation
        if (cell === 1 && aliveNeighbors < 2) {
          nextCell = 0;
        // Rule 2: Any alive cell with two or three alive neighbors lives on
        } else if (cell === 1 && (aliveNeighbors === 2 || aliveNeighbors === 3)) {
          nextCell = 1;
        // Rule 3: Any alive cell with more than three alive neighbors dies, as if by overpopulation
        } else if (cell === 1 && aliveNeighbors > 3) {
          nextCell = 0;
        // Rule 4: Any dead cell with exactly three alive neighbors becomes alive, as if by reproduction
        } else if (cell === 0 && aliveNeighbors === 3) {
          nextCell = 1;
        // All other cells remain the same
        } else {
          nextCell = cell;
        }

        next[index] = nextCell;
      }
    }

    this.cells = next;
  }

  toggleCell(row, col) {
    const index = this.index(row, col);

    this.cells[index] = (this.cells[index] + 1) % 2;
  }

  static new(width, height) {
    return new JsUniverse(width, height);
  }
}

const CELL_SIZE = 2; // px
const GRID_COLOR = '#CCCCCC';
const DEAD_CELL_COLOR = '#FFFFFF';
const ALIVE_CELL_COLOR = '#000000';

const wasmUniverse = WasmUniverse.new();
const width = wasmUniverse.width();
const height = wasmUniverse.height();
const jsUniverse = JsUniverse.new(width, height);

const jsCanvas = document.getElementById('cgol-canvas-js');

jsCanvas.height = (CELL_SIZE + 1) * height + 1;
jsCanvas.width = (CELL_SIZE + 1) * width + 1;

jsCanvas.addEventListener('click', event => {
  const boundingRect = jsCanvas.getBoundingClientRect();

  const scaleX = jsCanvas.width / boundingRect.width;
  const scaleY = jsCanvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  jsUniverse.toggleCell(row, col);

  jsDrawGrid();
  jsDrawCells();
});

const jsContext = jsCanvas.getContext('2d');

const wasmCanvas = document.getElementById('cgol-canvas-wasm');

wasmCanvas.height = (CELL_SIZE + 1) * height + 1;
wasmCanvas.width = (CELL_SIZE + 1) * width + 1;

wasmCanvas.addEventListener('click', event => {
  const boundingRect = wasmCanvas.getBoundingClientRect();

  const scaleX = wasmCanvas.width / boundingRect.width;
  const scaleY = wasmCanvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  wasmUniverse.toggle_cell(row, col);

  wasmDrawGrid();
  wasmDrawCells();
});

const wasmContext = wasmCanvas.getContext('2d');

const playPauseButton = document.getElementById('play-pause');

playPauseButton.textContent = '▶';

playPauseButton.addEventListener('click', _ => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

let jsAnimationId = null;
let wasmAnimationId = null;

function getIndex(row, col) {
  return row * width + col;
}

function jsDrawCells() {
  const cells = jsUniverse.cells;

  jsContext.beginPath();

  for (let row = 0; row < height; ++row) {
    for (let col = 0; col < width; ++col) {
      const index = getIndex(row, col);

      jsContext.fillStyle = cells[index] === 0
        ? DEAD_CELL_COLOR
        : ALIVE_CELL_COLOR;
      
        jsContext.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  jsContext.stroke();
}

function jsDrawGrid() {
  jsContext.beginPath();
  jsContext.strokeStyle = GRID_COLOR;

  // Vertical lines
  for (let i = 0; i <= width; ++i) {
    jsContext.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    jsContext.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines
  for (let j = 0; j <= height; ++j) {
    jsContext.moveTo(0, j * (CELL_SIZE + 1) + 1);
    jsContext.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  jsContext.stroke();
}

function wasmDrawCells() {
  const cells = new Uint8Array(memory.buffer, wasmUniverse.byte_offset(), width * height);

  wasmContext.beginPath();

  for (let row = 0; row < height; ++row) {
    for (let col = 0; col < width; ++col) {
      const index = getIndex(row, col);

      wasmContext.fillStyle = cells[index] === Cell.Dead
        ? DEAD_CELL_COLOR
        : ALIVE_CELL_COLOR;
      
      wasmContext.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  wasmContext.stroke();
}

function wasmDrawGrid() {
  wasmContext.beginPath();
  wasmContext.strokeStyle = GRID_COLOR;

  // Vertical lines
  for (let i = 0; i <= width; ++i) {
    wasmContext.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    wasmContext.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines
  for (let j = 0; j <= height; ++j) {
    wasmContext.moveTo(0, j * (CELL_SIZE + 1) + 1);
    wasmContext.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  wasmContext.stroke();
}

function isPaused() {
  return jsAnimationId === null;
}

function pause() {
  cancelAnimationFrame(jsAnimationId);
  cancelAnimationFrame(wasmAnimationId);

  jsAnimationId = null;
  wasmAnimationId = null;

  playPauseButton.textContent = '▶';
}

function play() {
  playPauseButton.textContent = '||';

  renderJsLoop();
  renderWasmLoop();
}

function renderJsLoop() {
  jsUniverse.tick();

  jsDrawGrid();
  jsDrawCells();

  jsAnimationId = requestAnimationFrame(renderJsLoop);
};

function renderWasmLoop() {
  wasmUniverse.tick();

  wasmDrawGrid();
  wasmDrawCells();

  wasmAnimationId = requestAnimationFrame(renderWasmLoop);
};

jsDrawGrid();
jsDrawCells();

wasmDrawGrid();
wasmDrawCells();
