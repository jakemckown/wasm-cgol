/* tslint:disable */
/* eslint-disable */
/**
*/
export enum Cell {
  Dead,
  Alive,
}
/**
*/
export class Universe {
  free(): void;
/**
* @returns {number}
*/
  byte_offset(): number;
/**
* @returns {number}
*/
  height(): number;
/**
* @returns {Universe}
*/
  static new(): Universe;
/**
* @returns {string}
*/
  render(): string;
/**
* @param {number} height
*/
  set_height(height: number): void;
/**
* @param {number} width
*/
  set_width(width: number): void;
/**
*/
  tick(): void;
/**
* @param {number} row
* @param {number} col
*/
  toggle_cell(row: number, col: number): void;
/**
* @returns {number}
*/
  width(): number;
}
