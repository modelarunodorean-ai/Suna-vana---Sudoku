/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Clock, Play, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Language, GameStats } from '../types';
import { getT } from '../utils/localization';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  language: Language;
  onResetStats: () => void;
}

export default function StatsModal({ isOpen, onClose, stats, language, onResetStats }: StatsModalProps) {
  if (!isOpen) return null;

  const [showConfirmReset, setShowConfirmReset] = React.useState(false);
  const t = getT(language);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return t.noRecord;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetAll = () => {
    onResetStats();
    setShowConfirmReset(false);
  };

  const levels: { key: 'easy' | 'medium' | 'hard' | 'excellent'; label: string; color: string; badgeBg: string }[] = [
    { key: 'easy', label: t.easy, color: 'text-green-600 dark:text-green-400', badgeBg: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300' },
    { key: 'medium', label: t.medium, color: 'text-blue-600 dark:text-blue-400', badgeBg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
    { key: 'hard', label: t.hard, color: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
    { key: 'excellent', label: t.excellent, color: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg overflow-hidden border rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t.statsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 transition-colors rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {!showConfirmReset ? (
            <>
              {/* Level progress blocks */}
              <div className="grid gap-3">
                {levels.map((lvl) => {
                  const stat = stats[lvl.key];
                  const isUnlocked = stats.unlockedLevels.includes(lvl.key);

                  return (
                    <div
                      key={lvl.key}
                      className="p-4 transition-all border rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800/80"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-sans font-bold text-base ${lvl.color}`}>{lvl.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isUnlocked ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                          {isUnlocked ? t.unlockedBadge : t.lockedBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 border rounded-lg bg-white dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/40">
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-sans font-medium">{t.gamesPlayed}</p>
                          <p className="mt-1 font-mono text-base font-bold text-zinc-800 dark:text-zinc-200">{stat.played}</p>
                        </div>
                        <div className="p-2 border rounded-lg bg-white dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/40">
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-sans font-medium">{t.gamesWon}</p>
                          <p className="mt-1 font-mono text-base font-bold text-zinc-800 dark:text-zinc-200">{stat.won}</p>
                        </div>
                        <div className="p-2 border rounded-lg bg-white dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/40 col-span-1">
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-sans font-medium">{t.bestTime}</p>
                          <p className="mt-1 font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate" title={formatTime(stat.bestTime)}>
                            {formatTime(stat.bestTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset trigger */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center space-x-1.5 text-xs text-rose-500 hover:text-rose-600 hover:underline transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.clearAllStats}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-5 text-center border border-rose-200 dark:border-rose-900/40 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-rose-700 dark:text-rose-400">{t.clearAllStats}?</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t.clearStatsCheck}
                </p>
              </div>
              <div className="flex justify-center space-x-2.5 pt-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t.back}
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-500 hover:shadow-lg transition-all"
                >
                  {t.clearAllStats}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-xs"
          >
            {t.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
