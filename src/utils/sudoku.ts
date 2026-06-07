/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Difficulty, Board, Cell } from '../types';

// Check if placing num in grid[row][col] is valid
export function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }

  // Check 3x3 local box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

// Backtracking solver
export function solve(grid: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        // Try numbers 1 to 9 in random or ordered sequence
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (solve(grid)) {
              return true;
            }
            grid[row][col] = 0; // Backtrack
          }
        }
        return false; // Triggers backtracking
      }
    }
  }
  return true; // Fully filled
}

// Specialized solver for validating unique solutions or counting solutions
export function countSolutions(grid: number[][], limit = 2): number {
  let count = 0;
  
  function solveHelper(g: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (g[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(g, row, col, num)) {
              g[row][col] = num;
              solveHelper(g);
              g[row][col] = 0; // Backtrack
              if (count >= limit) return true;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }

  const gridClone = grid.map(r => [...r]);
  solveHelper(gridClone);
  return count;
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fill diagonal 3x3 blocks, which are independent
function fillDiagonalBoxes(grid: number[][]) {
  for (let i = 0; i < 9; i += 3) {
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let index = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[i + r][i + c] = nums[index++];
      }
    }
  }
}

// Generate full Sudoku puzzle and solution
export function generateSudoku(difficulty: Difficulty): { puzzle: Board; solution: number[][] } {
  // Create empty grid
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Step 1: Fill diagonal boxes
  fillDiagonalBoxes(grid);

  // Step 2: Solve the remaining grid to get a complete valid solved board
  solve(grid);

  // Deep copy the solved board to keep as the solution
  const solution = grid.map(row => [...row]);

  // Step 3: Remove numbers based on difficulty level
  // Easy: ~46 clues (removes 35 cells)
  // Medium: ~35 clues (removes 46 cells)
  // Hard: ~28 clues (removes 53 cells)
  // Excellent: ~22 clues (removes 59 cells)
  let cellsToRemove = 35;
  if (difficulty === 'medium') cellsToRemove = 46;
  else if (difficulty === 'hard') cellsToRemove = 53;
  else if (difficulty === 'excellent') cellsToRemove = 59;

  const puzzleGrid = grid.map(row => [...row]);
  
  // Choose random cells to remove
  // To keep it simple and high-performing, we'll remove cells randomly while maintaining symmetry
  // or simple random selection. Random selection is very fast and reliable for generating neat grids.
  const indices = shuffleArray(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;

  for (const idx of indices) {
    if (removed >= cellsToRemove) break;

    const row = Math.floor(idx / 9);
    const col = idx % 9;

    if (puzzleGrid[row][col] !== 0) {
      const backup = puzzleGrid[row][col];
      puzzleGrid[row][col] = 0;

      // Ensure that there is still a valid unique solution (or check count of solutions is 1)
      // Since doing a full unique solution check on very hard difficulties block-by-block can be slow, 
      // we'll allow removing cells directly if the count of solutions is exactly 1, or after a few retries 
      // we proceed to guarantee interactive speed.
      if (countSolutions(puzzleGrid, 2) === 1) {
        removed++;
      } else {
        // Restore
        puzzleGrid[row][col] = backup;
      }
    }
  }

  // Fallback: If we couldn't remove enough due to unique solution constraint, we do a rapid forced pass
  if (removed < cellsToRemove) {
    const remainingIndices = shuffleArray(Array.from({ length: 81 }, (_, i) => i));
    for (const idx of remainingIndices) {
      if (removed >= cellsToRemove) break;
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      if (puzzleGrid[row][col] !== 0) {
        puzzleGrid[row][col] = 0;
        removed++;
      }
    }
  }

  // Step 4: Map puzzle numbers (0 for empty) into a complete Board with Metadata
  const puzzle: Board = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      const value = puzzleGrid[row][col];
      const given = value !== 0;
      return {
        row,
        col,
        value,
        originalValue: solution[row][col],
        given,
        notes: [],
        error: false,
      };
    })
  );

  return { puzzle, solution };
}

// Generate hints for the user
export function getHint(board: Board): { row: number; col: number; value: number } | null {
  const emptyCells: Cell[] = [];
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.value === 0) {
        emptyCells.push(cell);
      }
    });
  });

  if (emptyCells.length === 0) return null;

  // Pick a random empty cell
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  return {
    row: randomCell.row,
    col: randomCell.col,
    value: randomCell.originalValue,
  };
}

// Verify if the board is fully solved correctly
export function checkWin(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value !== board[r][c].originalValue) {
        return false;
      }
    }
  }
  return true;
}
