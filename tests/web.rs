//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
extern crate wasm_cgol;

use wasm_bindgen_test::*;
use wasm_cgol::Universe;

wasm_bindgen_test_configure!(run_in_browser);

#[cfg(test)]
pub fn initial_spaceship() -> Universe {
  let mut universe = Universe::new();

  universe.set_width(6);
  universe.set_height(6);

  // Glider
  universe.set_cells(&[
    (1, 2),
    (2, 3),
    (3, 1),
    (3, 2),
    (3, 3)
  ]);

  universe
}

#[cfg(test)]
pub fn expected_spaceship() -> Universe {
  let mut universe = Universe::new();

  universe.set_width(6);
  universe.set_height(6);
  
  // Glider after 1 tick
  universe.set_cells(&[
    (2, 1),
    (2, 3),
    (3, 2),
    (3, 3),
    (4, 2)
  ]);

  universe
}

#[wasm_bindgen_test]
pub fn test_tick() {
  let mut initial_universe = initial_spaceship();
  let expected_universe = expected_spaceship();

  initial_universe.tick();

  assert_eq!(&initial_universe.get_cells(), &expected_universe.get_cells());
}
