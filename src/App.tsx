/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, HelpCircle, Volume2, VolumeX, Globe, Sun, Moon, Sparkles, 
  Play, RotateCcw, Undo2, Redo2, Eraser, PencilLine, Lightbulb, 
  Lock, ArrowLeft, RefreshCw, X, ShieldCheck, AlertCircle, ArrowRight
} from 'lucide-react';

import { Difficulty, Board, Cell, GameStats, Move, ThemeType, Language } from './types';
import { generateSudoku, checkWin, getHint } from './utils/sudoku';
import { playClick, playErase, playError, playWinSound, toggleMuteSound, initializeMuteState } from './utils/sound';
import { getT } from './utils/localization';
import RulesModal from './components/RulesModal';
import StatsModal from './components/StatsModal';

const DEFAULT_STATS: GameStats = {
  easy: { played: 0, won: 0, bestTime: null },
  medium: { played: 0, won: 0, bestTime: null },
  hard: { played: 0, won: 0, bestTime: null },
  excellent: { played: 0, won: 0, bestTime: null },
  unlockedLevels: ['easy']
};

export default function App() {
  // Navigation & Preferences state
  const [view, setView] = useState<'menu' | 'game'>('menu');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeType>('classic');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  
  // Game Play state
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [pencilMode, setPencilMode] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [autoCheckErrors, setAutoCheckErrors] = useState<boolean>(true);
  
  // Stats & Progress tracking
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [hasActiveGame, setHasActiveGame] = useState<boolean>(false);

  // Undo / Redo history
  const [undoHistory, setUndoHistory] = useState<Move[]>([]);
  const [redoHistory, setRedoHistory] = useState<Move[]>([]);

  // Modals
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Status Modals (Win / Lose)
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; color: string; left: string; delay: string; duration: string }[]>([]);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial configuration mount
  useEffect(() => {
    // Sound mute check
    const mutedStatus = initializeMuteState();
    setSoundMuted(mutedStatus);

    // Language check
    const savedLang = localStorage.getItem('sudoku_lang') as Language;
    if (savedLang === 'en' || savedLang === 'ta') {
      setLanguage(savedLang);
    }

    // Theme check
    const savedTheme = localStorage.getItem('sudoku_theme') as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Load statistics
    const savedStats = localStorage.getItem('sudoku_stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats) as GameStats;
        // Verify we have all fields
        const hydrated = {
          ...DEFAULT_STATS,
          ...parsed,
          unlockedLevels: parsed.unlockedLevels || ['easy']
        };
        setStats(hydrated);
      } catch (e) {
        setStats(DEFAULT_STATS);
      }
    } else {
      setStats(DEFAULT_STATS);
    }

    // Check if there is an active suspended game in LS
    const savedActiveGame = localStorage.getItem('sudoku_active_game');
    if (savedActiveGame) {
      setHasActiveGame(true);
    }
  }, []);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'sepia-theme');
    
    if (theme === 'midnight') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia-theme');
    }
  }, [theme]);

  // Handle timer update
  useEffect(() => {
    if (isTimerActive && !isGameWon && !isGameOver) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerActive, isGameWon, isGameOver]);

  // Save active game to localStorage on modification if in game progress
  useEffect(() => {
    if (view === 'game' && board.length > 0 && !isGameWon && !isGameOver) {
      const stateToSave = {
        board,
        difficulty,
        timer,
        hintsUsed,
        errorsCount,
        undoHistory,
        redoHistory,
        autoCheckErrors,
      };
      localStorage.setItem('sudoku_active_game', JSON.stringify(stateToSave));
      setHasActiveGame(true);
    }
  }, [board, timer, view, hintsUsed, errorsCount, undoHistory, redoHistory, autoCheckErrors, isGameWon, isGameOver, difficulty]);

  // Toggle Preferences helpers
  const handleToggleMute = () => {
    const muted = toggleMuteSound();
    setSoundMuted(muted);
  };

  const handleToggleLang = () => {
    const nextLang = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
    localStorage.setItem('sudoku_lang', nextLang);
  };

  const handleToggleTheme = () => {
    let nextTheme: ThemeType = 'classic';
    if (theme === 'classic') nextTheme = 'midnight';
    else if (theme === 'midnight') nextTheme = 'sepia';
    setTheme(nextTheme);
    localStorage.setItem('sudoku_theme', nextTheme);
  };

  // Reset Statistics API
  const handleResetStats = () => {
    localStorage.removeItem('sudoku_stats');
    localStorage.removeItem('sudoku_active_game');
    setStats(DEFAULT_STATS);
    setHasActiveGame(false);
  };

  // Start new game action
  const handleStartNewGame = (selectedDiff: Difficulty) => {
    playClick();
    
    // Generate board based on difficulty
    const { puzzle } = generateSudoku(selectedDiff);
    
    setDifficulty(selectedDiff);
    setBoard(puzzle);
    setSelectedCell(null);
    setPencilMode(false);
    setTimer(0);
    setHintsUsed(0);
    setErrorsCount(0);
    setUndoHistory([]);
    setRedoHistory([]);
    setIsGameWon(false);
    setIsGameOver(false);
    
    // Track play statistics
    const updatedStats = { ...stats };
    updatedStats[selectedDiff].played += 1;
    setStats(updatedStats);
    localStorage.setItem('sudoku_stats', JSON.stringify(updatedStats));

    // Clear saved active game for new session overwrites
    localStorage.removeItem('sudoku_active_game');

    setView('game');
    setIsTimerActive(true);
  };

  // Resume active game action
  const handleResumeGame = () => {
    playClick();
    const savedActiveGame = localStorage.getItem('sudoku_active_game');
    if (savedActiveGame) {
      try {
        const state = JSON.parse(savedActiveGame);
        setBoard(state.board);
        setDifficulty(state.difficulty);
        setTimer(state.timer);
        setHintsUsed(state.hintsUsed);
        setErrorsCount(state.errorsCount);
        setUndoHistory(state.undoHistory || []);
        setRedoHistory(state.redoHistory || []);
        setAutoCheckErrors(state.autoCheckErrors !== undefined ? state.autoCheckErrors : true);
        
        setSelectedCell(null);
        setPencilMode(false);
        setIsGameWon(false);
        setIsGameOver(false);
        
        setView('game');
        setIsTimerActive(true);
      } catch (e) {
        // Corrupt save: start fresh easy game
        handleStartNewGame('easy');
      }
    } else {
      handleStartNewGame('easy');
    }
  };

  // Cell Selection Action
  const handleSelectCell = (row: number, col: number) => {
    const cell = board[row][col];
    if (cell.given && cell.value !== 0) {
      // Just select
      setSelectedCell({ row, col });
      playClick();
      return;
    }
    setSelectedCell({ row, col });
    playClick();
  };

  // Handle digit or keyboard interaction to update active cell
  const handleKeyEntry = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    // Cannot modify preloaded given cells
    if (cell.given) return;

    const previousMove: Move = {
      row,
      col,
      prevValue: cell.value,
      newValue: num,
      prevNotes: [...cell.notes],
      newNotes: []
    };

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const targetCell = newBoard[row][col];

    if (pencilMode) {
      // Notes mode - toggle number inside pencil list
      playClick();
      if (num === 0) {
        targetCell.notes = [];
      } else {
        if (targetCell.notes.includes(num)) {
          targetCell.notes = targetCell.notes.filter(n => n !== num);
        } else {
          targetCell.notes = [...targetCell.notes, num].sort((a, b) => a - b);
        }
      }
      targetCell.value = 0; // Clear any active value if adding notes
      targetCell.error = false;
      previousMove.newNotes = [...targetCell.notes];
      previousMove.newValue = 0;
    } else {
      // Value selection mode
      if (targetCell.value === num) {
        // If same value entered, treat as clearing it
        targetCell.value = 0;
        targetCell.error = false;
        playErase();
      } else {
        targetCell.value = num;
        targetCell.notes = []; // Clear pencil notes when hard-setting value
        
        if (num === 0) {
          playErase();
          targetCell.error = false;
        } else {
          // Check correctness
          const isError = num !== targetCell.originalValue;
          targetCell.error = autoCheckErrors ? isError : false;
          
          if (isError && autoCheckErrors) {
            playError();
            setErrorsCount(prev => {
              const next = prev + 1;
              if (next >= 3) {
                setIsGameOver(true);
                setIsTimerActive(false);
              }
              return next;
            });
          } else {
            playClick();
          }
        }
      }
      previousMove.newValue = targetCell.value;
    }

    setBoard(newBoard);
    
    // Add to Undo History, wipe redo history
    setUndoHistory(prev => [...prev, previousMove]);
    setRedoHistory([]);

    // Check if game is completed
    const isWin = checkWin(newBoard);
    if (isWin) {
      handleGameWin();
    }
  };

  // Erase button click
  const handleErase = () => {
    if (!selectedCell) return;
    handleKeyEntry(0);
  };

  // Game Victory Process
  const handleGameWin = () => {
    setIsTimerActive(false);
    setIsGameWon(true);
    playWinSound();

    // Trigger local JS/HTML confetti animation
    triggerConfetti();

    // Clear saved active game because it is won
    localStorage.removeItem('sudoku_active_game');
    setHasActiveGame(false);

    // Update player statistics
    const nextStats = { ...stats };
    const statBlock = nextStats[difficulty];
    statBlock.won += 1;

    // Track best time completed
    if (statBlock.bestTime === null || timer < statBlock.bestTime) {
      statBlock.bestTime = timer;
    }

    // Sequence unlock mechanism:
    // If Easy won, unlock Medium
    // If Medium won, unlock Hard
    // If Hard won, unlock Excellent
    const currentlyUnlocked = [...nextStats.unlockedLevels];
    if (difficulty === 'easy' && !currentlyUnlocked.includes('medium')) {
      currentlyUnlocked.push('medium');
    } else if (difficulty === 'medium' && !currentlyUnlocked.includes('hard')) {
      currentlyUnlocked.push('hard');
    } else if (difficulty === 'hard' && !currentlyUnlocked.includes('excellent')) {
      currentlyUnlocked.push('excellent');
    }
    
    nextStats.unlockedLevels = currentlyUnlocked;
    setStats(nextStats);
    localStorage.setItem('sudoku_stats', JSON.stringify(nextStats));
  };

  // Confetti generator
  const triggerConfetti = () => {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const particles = Array.from({ length: 65 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      duration: `${2.5 + Math.random() * 1.5}s`
    }));
    setConfetti(particles);
    // Cleanup particle state after animation
    setTimeout(() => {
      setConfetti([]);
    }, 5500);
  };

  // Get Hint button action
  const handleGetHint = () => {
    if (isGameWon || isGameOver || hintsUsed >= 3) return;
    
    const suggestion = getHint(board);
    if (suggestion) {
      playClick();
      const { row, col, value } = suggestion;

      // Select that cell to show correct value
      setSelectedCell({ row, col });
      
      const previousMove: Move = {
        row,
        col,
        prevValue: board[row][col].value,
        newValue: value,
        prevNotes: [...board[row][col].notes],
        newNotes: []
      };

      const newBoard = board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].value = value;
      newBoard[row][col].notes = [];
      newBoard[row][col].error = false;
      
      setBoard(newBoard);
      setHintsUsed(prev => prev + 1);
      
      setUndoHistory(prev => [...prev, previousMove]);
      setRedoHistory([]);

      const isWin = checkWin(newBoard);
      if (isWin) {
        handleGameWin();
      }
    }
  };

  // Undo button action
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    playClick();

    const lastMove = undoHistory[undoHistory.length - 1];
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const target = newBoard[lastMove.row][lastMove.col];

    target.value = lastMove.prevValue;
    target.notes = lastMove.prevNotes;
    target.error = false;

    // Moving move from Undo list to Redo list
    setUndoHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, lastMove]);
    setBoard(newBoard);
  };

  // Redo button action
  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    playClick();

    const targetMove = redoHistory[redoHistory.length - 1];
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const target = newBoard[targetMove.row][targetMove.col];

    target.value = targetMove.newValue;
    target.notes = targetMove.newNotes;
    target.error = false;

    // Moving move from Redo list to Undo list
    setRedoHistory(prev => prev.slice(0, -1));
    setUndoHistory(prev => [...prev, targetMove]);
    setBoard(newBoard);

    const isWin = checkWin(newBoard);
    if (isWin) {
      handleGameWin();
    }
  };

  // Exit current active game and return to dashboard
  const handleQuitGameAction = () => {
    playClick();
    const t = getT(language);
    if (window.confirm(t.quitConfirm)) {
      // Store current progress state but clear selected cell
      setIsTimerActive(false);
      setSelectedCell(null);
      setView('menu');
    }
  };

  // Formatting utility for stopwatch timer
  const formatStopwatch = (totalSeconds: number): string => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Helper arrays for keyboard input triggers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events if writing inside modal/overlay or views
      if (view !== 'game' || isGameWon || isGameOver) return;
      
      const key = event.key;
      if (key >= '1' && key <= '9') {
        handleKeyEntry(parseInt(key));
      } else if (key === 'Backspace' || key === 'Delete') {
        handleErase();
      } else if (key === 'n' || key === 'N') {
        setPencilMode(prev => !prev);
      } else if (key === 'ArrowUp' && selectedCell) {
        event.preventDefault();
        setSelectedCell(prev => prev ? { row: Math.max(0, prev.row - 1), col: prev.col } : null);
      } else if (key === 'ArrowDown' && selectedCell) {
        event.preventDefault();
        setSelectedCell(prev => prev ? { row: Math.min(8, prev.row + 1), col: prev.col } : null);
      } else if (key === 'ArrowLeft' && selectedCell) {
        event.preventDefault();
        setSelectedCell(prev => prev ? { row: prev.row, col: Math.max(0, prev.col - 1) } : null);
      } else if (key === 'ArrowRight' && selectedCell) {
        event.preventDefault();
        setSelectedCell(prev => prev ? { row: prev.row, col: Math.min(8, prev.col + 1) } : null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, view, board, pencilMode, isGameWon, isGameOver, autoCheckErrors]);

  const t = getT(language);

  // CSS mappings for layout classes depending on selected custom theme
  const getAppBgClass = () => {
    if (theme === 'midnight') return 'bg-zinc-950 text-zinc-50';
    if (theme === 'sepia') return 'sepia-theme text-amber-950';
    return 'bg-zinc-50 text-zinc-900';
  };

  const getContainerClass = () => {
    if (theme === 'midnight') return 'bg-zinc-900/60 border-zinc-800';
    if (theme === 'sepia') return 'bg-orange-50/20 border-orange-200/50';
    return 'bg-white border-zinc-200';
  };

  const getCardClass = () => {
    if (theme === 'midnight') return 'bg-zinc-900 border-zinc-800';
    if (theme === 'sepia') return 'bg-[#f4ecd8] border-[#dfd2be] text-amber-950';
    return 'bg-white border-zinc-100 shadow-sm';
  };

  const getInputButtonClass = () => {
    if (theme === 'midnight') return 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-750';
    if (theme === 'sepia') return 'bg-orange-100/50 hover:bg-[#ebdcb9] text-[#433422] border-[#ebdcb9]';
    return 'bg-zinc-100/80 hover:bg-zinc-200 text-zinc-800 border-zinc-200/60 shadow-xs';
  };

  return (
    <div className={`min-h-screen font-sans ${getAppBgClass()} transition-colors duration-300 flex flex-col items-center`}>
      {/* 2. Particle win animation if won */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti-particle"
          style={{
            backgroundColor: c.color,
            left: c.left,
            animationDelay: c.delay,
            animationDuration: c.duration,
          }}
        />
      ))}

      {/* 3. Header Action Ribbon */}
      <header className="w-full max-w-6xl px-4 py-4 flex items-center justify-between border-b border-zinc-500/10 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-teal-400">
              {t.title}
            </h1>
            <p className="text-[10px] opacity-80 max-sm:hidden">{t.subtitle}</p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Globe/Language */}
          <button
            onClick={handleToggleLang}
            className="p-2 rounded-xl transition-all border border-zinc-500/10 hover:bg-zinc-500/10 cursor-pointer flex items-center space-x-1"
            title="Translate (English / தமிழ்)"
          >
            <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-[10px] font-bold font-mono">
              {language === 'en' ? 'TA' : 'EN'}
            </span>
          </button>

          {/* Sound trigger */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl transition-all border border-zinc-500/10 hover:bg-zinc-500/10 cursor-pointer"
            title={soundMuted ? t.musicOff : t.musicOn}
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            )}
          </button>

          {/* Theme switcher */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl transition-all border border-zinc-500/10 hover:bg-zinc-500/10 cursor-pointer"
            title="Cycle Theme (Classic / Midnight / Sepia)"
          >
            {theme === 'classic' && <Sun className="w-4 h-4 text-amber-500" />}
            {theme === 'midnight' && <Moon className="w-4 h-4 text-blue-400" />}
            {theme === 'sepia' && <Sparkles className="w-4 h-4 text-orange-600" />}
          </button>

          {/* Dashboard Rules Modal Button */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl transition-all border border-zinc-500/10 hover:bg-zinc-500/10 cursor-pointer"
            title={t.howToPlay}
          >
            <HelpCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>

          {/* Statistics Button */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="p-2 rounded-xl transition-all border border-zinc-500/10 hover:bg-zinc-500/10 cursor-pointer"
            title={t.stats}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </header>

      {/* 4. Active Main Content Body */}
      <main className="w-full max-w-4xl px-4 flex-grow flex flex-col justify-center items-center pb-12">
        {view === 'menu' ? (
          /* ==================================== MENU VIEW ==================================== */
          <div className="w-full max-w-2xl space-y-6">
            
            {/* Quick Resume banner if incomplete game cached */}
            {hasActiveGame && (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center space-x-3 text-center sm:text-left">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm font-sans text-indigo-900 dark:text-indigo-200">
                      Ongoing Play Session Saved
                    </h4>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300">
                      Pick up exactly where you left off on your Sudoku board!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResumeGame}
                  className="px-4.5 py-1.5 md:py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer inline-flex items-center space-x-1"
                >
                  <span>{t.resumeGame}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Dashboard level lock presentation */}
            <div className={`p-6 border rounded-2xl ${getContainerClass()} shadow-md space-y-5`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
                <div>
                  <h3 className="text-lg font-bold font-sans text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    {language === 'en' ? 'Select Difficulty Level' : 'கடின நிலையைத் தேர்ந்தெடுக்கவும்'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.subtitle}
                  </p>
                </div>
                
                {/* Stats badge summarizing progress */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 self-start">
                  🥇 Level: {stats.unlockedLevels.length} / 4 Unlocked
                </div>
              </div>

              {/* Grid of difficulties with sequential unlocking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Level 1: EASY */}
                <div className={`p-4 border rounded-xl relative overflow-hidden flex flex-col justify-between h-44 ${getCardClass()}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider text-green-600 uppercase">Level 1</span>
                      <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-green-50 dark:bg-green-950/30 text-green-600">
                        {t.easy}
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-base mt-2">{t.easy}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t.locksEasyInfo}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-500/5">
                    <div className="text-[10px] font-mono text-zinc-400">
                      🏆 Won: {stats.easy.won}
                    </div>
                    <button
                      onClick={() => handleStartNewGame('easy')}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 transition-colors rounded-lg cursor-pointer"
                    >
                      Play
                    </button>
                  </div>
                </div>

                {/* Level 2: MEDIUM */}
                {(() => {
                  const isUnlocked = stats.unlockedLevels.includes('medium') || stats.easy.won >= 1;
                  return (
                    <div className={`p-4 border rounded-xl relative overflow-hidden flex flex-col justify-between h-44 ${getCardClass()} ${!isUnlocked ? 'opacity-80' : ''}`}>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                          <Lock className="w-6 h-6 text-white mb-2" />
                          <span className="text-xs font-bold text-white tracking-wide uppercase">{t.locked}</span>
                          <span className="text-[10px] text-zinc-200 mt-1 max-w-[160px] leading-tight">
                            {t.locksMediumInfo}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono tracking-wider text-blue-600 uppercase">Level 2</span>
                          <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                            {t.medium}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-base mt-2">{t.medium}</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t.locksMediumInfo}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-500/5">
                        <div className="text-[10px] font-mono text-zinc-400">
                          🏆 Won: {stats.medium.won}
                        </div>
                        <button
                          onClick={() => handleStartNewGame('medium')}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg cursor-pointer"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Level 3: HARD */}
                {(() => {
                  const isUnlocked = stats.unlockedLevels.includes('hard') || stats.medium.won >= 1;
                  return (
                    <div className={`p-4 border rounded-xl relative overflow-hidden flex flex-col justify-between h-44 ${getCardClass()} ${!isUnlocked ? 'opacity-80' : ''}`}>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                          <Lock className="w-6 h-6 text-white mb-2" />
                          <span className="text-xs font-bold text-white tracking-wide uppercase">{t.locked}</span>
                          <span className="text-[10px] text-zinc-200 mt-1 max-w-[160px] leading-tight font-sans">
                            {t.locksHardInfo}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono tracking-wider text-purple-600 uppercase">Level 3</span>
                          <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600">
                            {t.hard}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-base mt-2">{t.hard}</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t.locksHardInfo}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-500/5">
                        <div className="text-[10px] font-mono text-zinc-400">
                          🏆 Won: {stats.hard.won}
                        </div>
                        <button
                          onClick={() => handleStartNewGame('hard')}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors rounded-lg cursor-pointer"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Level 4: EXCELLENT */}
                {(() => {
                  const isUnlocked = stats.unlockedLevels.includes('excellent') || stats.hard.won >= 1;
                  return (
                    <div className={`p-4 border rounded-xl relative overflow-hidden flex flex-col justify-between h-44 ${getCardClass()} ${!isUnlocked ? 'opacity-80' : ''}`}>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                          <Lock className="w-6 h-6 text-white mb-2" />
                          <span className="text-xs font-bold text-white tracking-wide uppercase">{t.locked}</span>
                          <span className="text-[10px] text-zinc-200 mt-1 max-w-[160px] leading-tight font-sans">
                            {t.locksExcellentInfo}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono tracking-wider text-rose-600 uppercase">Level 4</span>
                          <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600">
                            {t.excellent}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-base mt-2">{t.excellent}</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t.locksExcellentInfo}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-500/5">
                        <div className="text-[10px] font-mono text-zinc-400">
                          🏆 Won: {stats.excellent.won}
                        </div>
                        <button
                          onClick={() => handleStartNewGame('excellent')}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors rounded-lg cursor-pointer"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Explanatory rules block underneath */}
            <div className={`p-5 rounded-2xl border ${getCardClass()} flex items-start space-x-3.5`}>
              <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold font-sans">{language === 'en' ? 'Sequential Unlock Rule' : 'பூட்டு திறப்பு விதிமுறை:'}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {language === 'en' 
                    ? "Start playing at Easy level. Winning a game unlocks Medium. Subsequently, winning at Medium unlocks Hard, and Hard unlocks the ultimate 'Excellent' challenge! Each step records your best completion timers." 
                    : "விளையாடத் தொடங்கும் போது 'எளியது' மட்டுமே திறந்திருக்கும். அதில் 1 முறை வென்றால் 'நடுத்தரம்' திறக்கும். நடுத்தர ஆட்டத்தில் வெல்லும் போது 'கடினம்' திறக்கும், கடின ஆட்டத்தில் வெல்லும் போது சவாலான 'மிகச்சிறப்பு' நிலை அன்லாக் செய்யபடும்!"
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ==================================== ACTIVE GAME VIEW ==================================== */
          <div className="w-full flex flex-col items-center space-y-4">
            
            {/* Nav Row & Stop Watch header ribbon */}
            <div className={`w-full max-w-lg p-3.5 border rounded-xl flex items-center justify-between ${getCardClass()}`}>
              <button
                onClick={handleQuitGameAction}
                className="flex items-center space-x-1.5 text-xs font-semibold hover:opacity-80 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.back}</span>
              </button>

              {/* Central Details */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="font-medium text-zinc-400 uppercase tracking-widest text-[9px]">{t.difficulty}:</span>
                <span className={`font-extrabold font-sans ${difficulty === 'easy' ? 'text-green-600 dark:text-green-400' : difficulty === 'medium' ? 'text-blue-600 dark:text-blue-400' : difficulty === 'hard' ? 'text-purple-600' : 'text-rose-600'}`}>
                  {difficulty === 'easy' ? t.easy : difficulty === 'medium' ? t.medium : difficulty === 'hard' ? t.hard : t.excellent}
                </span>
              </div>

              {/* Stopwatch & Pause controller */}
              <div className="flex items-center space-x-2 bg-zinc-500/5 px-2.5 py-1 rounded-lg">
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 min-w-[42px] text-right">
                  {formatStopwatch(timer)}
                </span>
                <button
                  onClick={() => setIsTimerActive(prev => !prev)}
                  className="p-1 rounded-md hover:bg-zinc-500/10 cursor-pointer text-zinc-500 dark:text-zinc-400"
                  title="Pause/Play timer"
                >
                  {isTimerActive ? (
                    <span className="block w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-xs animate-pulse" />
                  ) : (
                    <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Tracker Counter */}
            <div className="w-full max-w-md flex justify-between items-center px-2">
              <div className="text-[11px] font-medium text-zinc-550 dark:text-zinc-400 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.errors}:</span>
                <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${errorsCount > 0 ? 'bg-rose-500/10 text-rose-500' : 'text-green-500'}`}>
                  {errorsCount} / 3
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px]">
                <label className="text-zinc-400 cursor-pointer select-none" htmlFor="autoCheckToggle">
                  {t.checkErrors}
                </label>
                <input
                  id="autoCheckToggle"
                  type="checkbox"
                  checked={autoCheckErrors}
                  onChange={(e) => setAutoCheckErrors(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* ==================== SUDOKU 9x9 GRID ==================== */}
            <div className="relative">
              {/* Suspended/Paused Backdrop */}
              {!isTimerActive && !isGameWon && !isGameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20">
                  <Play className="w-12 h-12 text-white fill-white cursor-pointer active:scale-95 transition-all mb-3 animate-bounce" onClick={() => setIsTimerActive(true)} />
                  <h4 className="font-sans font-extrabold text-white text-lg tracking-wide uppercase">{t.paused}</h4>
                  <button
                    onClick={() => setIsTimerActive(true)}
                    className="mt-3.5 px-5 py-2 font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg cursor-pointer"
                  >
                    Resume Board
                  </button>
                </div>
              )}

              {/* The Sudoku Board itself */}
              <div 
                id="sudoku-board-grid"
                className={`p-1.5 border-2 rounded-2xl shadow-xl overflow-hidden grid grid-cols-9 gap-0.5 ${theme === 'midnight' ? 'border-zinc-700 bg-zinc-900' : theme === 'sepia' ? 'border-[#bca990] bg-[#ebdcb9]' : 'border-zinc-300 bg-zinc-200'}`}
                style={{ width: '100%', maxWidth: '390px', aspectRatio: '1/1' }}
              >
                {board.map((row, rIdx) => 
                  row.map((cell, cIdx) => {
                    const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                    
                    // Highlights for corresponding grids
                    let isSecondaryHighlight = false;
                    let isMatchValueHighlight = false;

                    if (selectedCell) {
                      const selCell = board[selectedCell.row][selectedCell.col];
                      // Highlight row / col / 3x3 block
                      const sameRow = selectedCell.row === rIdx;
                      const sameCol = selectedCell.col === cIdx;
                      const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(rIdx / 3) && 
                                      Math.floor(selectedCell.col / 3) === Math.floor(cIdx / 3);
                      if (sameRow || sameCol || sameBox) {
                        isSecondaryHighlight = true;
                      }

                      // Highlight matching values
                      if (selCell.value !== 0 && selCell.value === cell.value && !isSelected) {
                        isMatchValueHighlight = true;
                      }
                    }

                    // Bottom/Right thick border divisions for 3x3 blocks
                    const hasThickRight = (cIdx === 2 || cIdx === 5);
                    const hasThickBottom = (rIdx === 2 || rIdx === 5);

                    // Cell Backgrounds Class Calculation
                    let cellBg = theme === 'midnight' ? 'bg-zinc-850' : theme === 'sepia' ? 'bg-[#fcf5e9]' : 'bg-white';
                    
                    if (isSelected) {
                      cellBg = theme === 'midnight' ? 'bg-indigo-850 text-white' : 'bg-indigo-100 text-indigo-950 font-semibold';
                    } else if (isMatchValueHighlight) {
                      cellBg = theme === 'midnight' ? 'bg-emerald-950/50 text-emerald-300 font-bold' : 'bg-emerald-100 text-emerald-950 font-bold';
                    } else if (isSecondaryHighlight) {
                      cellBg = theme === 'midnight' ? 'bg-zinc-800' : theme === 'sepia' ? 'bg-[#ebdcb9]/40' : 'bg-zinc-100';
                    }

                    if (cell.error && autoCheckErrors) {
                      cellBg = theme === 'midnight' ? 'bg-rose-950/60' : 'bg-rose-100';
                    }

                    return (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => handleSelectCell(rIdx, cIdx)}
                        className={`
                          relative select-none text-center flex flex-col justify-center items-center cursor-pointer font-sans transition-all duration-100
                          ${cellBg}
                          ${hasThickRight ? 'sudoku-border-thick-r' : ''}
                          ${hasThickBottom ? 'sudoku-border-thick-b' : ''}
                        `}
                        style={{ aspectRatio: '1/1' }}
                      >
                        {cell.value !== 0 ? (
                          /* Render filled number value */
                          <span className={`
                            text-base sm:text-lg md:text-xl font-bold font-sans selection:bg-transparent
                            ${cell.given ? 'text-zinc-900 dark:text-zinc-50' : (cell.error && autoCheckErrors) ? 'text-rose-600 font-extrabold' : 'text-indigo-650 dark:text-indigo-400 font-semibold'}
                          `}>
                            {cell.value}
                          </span>
                        ) : (
                          /* Render empty cell with pencil micro grid notes */
                          cell.notes.length > 0 && (
                            <div className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5 text-[8px] font-mono leading-none text-zinc-400/90 dark:text-zinc-500 font-bold">
                              {Array.from({ length: 9 }, (_, idx) => {
                                const n = idx + 1;
                                return (
                                  <div key={n} className="flex justify-center items-center">
                                    {cell.notes.includes(n) ? n : ''}
                                  </div>
                                );
                              })}
                            </div>
                          )
                        )}
                        
                        {/* Selected overlay pin dot */}
                        {isSelected && (
                          <div className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ==================== PLAY UTILITIES ACTIONS BAR ==================== */}
            <div className="w-full max-w-sm grid grid-cols-4 gap-2 pt-2 text-center">
              {/* Undo action */}
              <button
                onClick={handleUndo}
                disabled={undoHistory.length === 0}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all text-[11px] font-medium font-sans cursor-pointer ${undoHistory.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'} ${getCardClass()}`}
              >
                <Undo2 className="w-4 h-4 mb-1 text-zinc-500" />
                <span>{t.undo}</span>
              </button>

              {/* Redo action */}
              <button
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all text-[11px] font-medium font-sans cursor-pointer ${redoHistory.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'} ${getCardClass()}`}
              >
                <Redo2 className="w-4 h-4 mb-1 text-zinc-500" />
                <span>{t.redo}</span>
              </button>

              {/* Note state trigger toggler */}
              <button
                onClick={() => {
                  playClick();
                  setPencilMode(prev => !prev);
                }}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all text-[11px] font-medium font-sans relative cursor-pointer hover:opacity-80 active:scale-95 ${pencilMode ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' : ''} ${getCardClass()}`}
              >
                <PencilLine className="w-4 h-4 mb-1" />
                <span>{t.pencilMode}</span>
                <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${pencilMode ? 'bg-emerald-500' : 'bg-transparent'}`} />
              </button>

              {/* Eraser functionality */}
              <button
                onClick={handleErase}
                disabled={!selectedCell || board[selectedCell.row][selectedCell.col].given}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all text-[11px] font-medium font-sans cursor-pointer ${(!selectedCell || board[selectedCell.row][selectedCell.col].given) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'} ${getCardClass()}`}
              >
                <Eraser className="w-4 h-4 mb-1 text-rose-500" />
                <span>{t.erase}</span>
              </button>
            </div>

            {/* ==================== BUTTON NUMBER PAD (1 to 9) ==================== */}
            <div className="w-full max-w-sm space-y-2">
              <div className="grid grid-cols-9 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  // Figure out instances/clues of num on the board to grey out if maximum reached
                  let count = 0;
                  board.forEach(r => r.forEach(c => {
                    if (c.value === num) count++;
                  }));
                  const allPlaced = count >= 9;

                  return (
                    <button
                      key={num}
                      onClick={() => handleKeyEntry(num)}
                      disabled={!selectedCell}
                      className={`
                        aspect-square flex flex-col justify-center items-center content-center rounded-xl font-extrabold text-base border transition-all cursor-pointer select-none font-sans
                        ${allPlaced ? 'opacity-40 line-through' : 'active:scale-90 hover:scale-105'}
                        ${!selectedCell ? 'opacity-50 cursor-not-allowed' : ''}
                        ${getInputButtonClass()}
                      `}
                    >
                      <span>{num}</span>
                      <span className="text-[7px] font-normal leading-none font-mono opacity-60 text-zinc-400 mt-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint and Quick Restart triggers */}
              <div className="flex justify-between items-center px-1">
                <button
                  onClick={handleGetHint}
                  disabled={hintsUsed >= 3 || isGameWon || isGameOver}
                  className="flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline py-1 px-2.5 rounded-lg hover:bg-indigo-500/5 transition-all cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{t.hint} ({3 - hintsUsed} left)</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(language === 'en' ? 'Restart this level puzzle?' : 'இந்த ஆட்டத்தை மீண்டும் தொடங்க வேண்டுமா?')) {
                      handleStartNewGame(difficulty);
                    }
                  }}
                  className="flex items-center space-x-1 text-xs text-zinc-500 dark:text-zinc-400 hover:underline py-1 px-2.5 rounded-lg hover:bg-zinc-500/5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Restart' : 'மீண்டும்'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ==================== SYSTEM OVERLAY MODALS ==================== */}

      {/* 5. Victory Congrats Banner Backdrop */}
      {isGameWon && (
        <div className="fixed inset-0 z-45 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                {t.solvedMessage}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                {t.solvedSub}
              </p>
            </div>

            {/* Showcase completed speed statistics */}
            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-sans text-zinc-450 uppercase tracking-widest">{language === 'en' ? 'Completion Time' : 'பூர்த்தி செய்த நேரம்'}</p>
                <p className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatStopwatch(timer)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-450 uppercase tracking-widest">{language === 'en' ? 'Difficulty Completed' : 'வென்ற கடின நிலை'}</p>
                <p className="font-bold text-base mt-1 text-green-600 uppercase tracking-wider">{difficulty}</p>
              </div>
            </div>

            {/* Direct primary back list buttons */}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => {
                  playClick();
                  setIsGameWon(false);
                  setView('menu');
                }}
                className="w-full py-3 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer"
              >
                {t.back}
              </button>
              
              <button
                onClick={() => {
                  playClick();
                  setIsGameWon(false);
                  
                  // Sequential difficulty upgrade calculation
                  let nextDiff: Difficulty = 'easy';
                  if (difficulty === 'easy') nextDiff = 'medium';
                  else if (difficulty === 'medium') nextDiff = 'hard';
                  else if (difficulty === 'hard') nextDiff = 'excellent';
                  else nextDiff = 'easy';

                  handleStartNewGame(nextDiff);
                }}
                className="w-full py-3 px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-xl cursor-pointer"
              >
                {language === 'en' ? 'Go to Next Level' : 'அடுத்த மட்டம் விளையாடவும்'} ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Game Over / Mistake Limit Backdrop Over */}
      {isGameOver && (
        <div className="fixed inset-0 z-45 bg-rose-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-900/10 p-8 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-450 leading-tight">
                {t.errorLimitTitle}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                {t.errorLimitMsg}
              </p>
            </div>

            {/* Option Triggers */}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => handleStartNewGame(difficulty)}
                className="w-full py-3 px-4 font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer"
              >
                Retry Puzzle Level
              </button>
              
              <button
                onClick={() => {
                  playClick();
                  setIsGameOver(false);
                  setView('menu');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-550 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-xl cursor-pointer"
              >
                {t.back}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Shared Modal Windows */}
      <RulesModal 
        isOpen={showRulesModal} 
        onClose={() => setShowRulesModal(false)} 
        language={language} 
      />

      <StatsModal 
        isOpen={showStatsModal} 
        onClose={() => setShowStatsModal(false)} 
        stats={stats} 
        language={language}
        onResetStats={handleResetStats}
      />
    </div>
  );
}
