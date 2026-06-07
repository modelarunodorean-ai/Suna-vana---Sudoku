/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'excellent';

export interface Cell {
  row: number;
  col: number;
  value: number; // 0 represents empty
  originalValue: number; // The correct solved value for this cell
  given: boolean; // True if populated by game generator initially
  notes: number[]; // Pencil marks (1-9)
  error: boolean; // If value is filled and incorrect
}

export type Board = Cell[][];

export interface DifficultyStats {
  played: number;
  won: number;
  bestTime: number | null; // in seconds
}

export interface GameStats {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
  excellent: DifficultyStats;
  unlockedLevels: Difficulty[]; // levels unlocked so far
}

export interface Move {
  row: number;
  col: number;
  prevValue: number;
  newValue: number;
  prevNotes: number[];
  newNotes: number[];
}

export type ThemeType = 'classic' | 'midnight' | 'sepia';
export type Language = 'en' | 'ta';
