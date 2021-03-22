mod utils;

use std::fmt;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
  Dead = 0,
  Alive = 1
}

impl Cell {
  fn toggle(&mut self) {
    *self = match *self {
      Cell::Dead => Cell::Alive,
      Cell::Alive => Cell::Dead
    }
  }
}

#[wasm_bindgen]
pub struct Universe {
  width: u32,
  height: u32,
  cells: Vec<Cell>
}

impl Universe {
  fn alive_neighbor_count(&self, row: u32, col: u32) -> u8 {
    let mut count = 0;

    for delta_row in [self.height - 1, 0, 1].iter().cloned() {
      for delta_col in [self.width - 1, 0, 1].iter().cloned() {
        if delta_row == 0 && delta_col == 0 {
          continue;
        }

        let neighbor_row = (row + delta_row) % self.height;
        let neighbor_col = (col + delta_col) % self.width;

        let index = self.index(neighbor_row, neighbor_col);

        count += self.cells[index] as u8;
      }
    }

    count
  }

  pub fn get_cells(&self) -> &[Cell] {
    &self.cells
  }

  fn index(&self, row: u32, col: u32) -> usize {
    (row * self.width + col) as usize
  }

  pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
    for (row, col) in cells.iter().cloned() {
      let index = self.index(row, col);
      
      self.cells[index] = Cell::Alive;
    }
  }
}

impl fmt::Display for Universe {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    for line in self.cells.as_slice().chunks(self.width as usize) {
      for &cell in line {
        let symbol = if cell == Cell::Dead { '◻' } else { '◼' };

        write!(f, "{}", symbol)?;
      }

      write!(f, "\n")?;
    }

    Ok(())
  }
}

#[wasm_bindgen]
impl Universe {
  pub fn byte_offset(&self) -> *const Cell {
    self.cells.as_ptr()
  }

  pub fn height(&self) -> u32 {
    self.height
  }

  pub fn new() -> Universe {
    utils::set_panic_hook();

    let width = 80;
    let height = 80;

    let cells: Vec<Cell> = (0..width * height)
      .map(|_| Cell::Dead)
      .collect();

    let mut universe = Universe { width, height, cells };

    // Glider
    universe.set_cells(&[
      (36, 2),
      (37, 3),
      (38, 1),
      (38, 2),
      (38, 3)
    ]);

    universe
  }

  pub fn render(&self) -> String {
    self.to_string()
  }

  pub fn set_height(&mut self, height: u32) {
    self.height = height;
    self.cells = (0..self.width * height).map(|_| Cell::Dead).collect();
  }

  pub fn set_width(&mut self, width: u32) {
    self.width = width;
    self.cells = (0..width * self.height).map(|_| Cell::Dead).collect();
  }

  pub fn tick(&mut self) {
    let mut next = self.cells.clone();

    for row in 0..self.height {
      for col in 0..self.width {
        let index = self.index(row, col);
        let cell = self.cells[index];
        let alive_neighbors = self.alive_neighbor_count(row, col);

        let next_cell = match (cell, alive_neighbors) {
          // Rule 1: Any alive cell with fewer than two alive neighbors dies, as if by underpopulation
          (Cell::Alive, x) if x < 2 => Cell::Dead,
          // Rule 2: Any alive cell with two or three alive neighbors lives on
          (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
          // Rule 3: Any alive cell with more than three alive neighbors dies, as if by overpopulation
          (Cell::Alive, x) if x > 3 => Cell::Dead,
          // Rule 4: Any dead cell with exactly three alive neighbors becomes alive, as if by reproduction
          (Cell::Dead, 3) => Cell::Alive,
          // All other cells remain the same
          (otherwise, _) => otherwise
        };

        next[index] = next_cell;
      }
    }

    self.cells = next;
  }

  pub fn toggle_cell(&mut self, row: u32, col: u32) {
    let index = self.index(row, col);

    self.cells[index].toggle();
  }

  pub fn width(&self) -> u32 {
    self.width
  }
}
