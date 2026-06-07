/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, HelpCircle, Award, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { getT } from '../utils/localization';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export default function RulesModal({ isOpen, onClose, language }: RulesModalProps) {
  if (!isOpen) return null;

  const t = getT(language);

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
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-sans text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t.howToPlay}
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
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          <div className="space-y-3.5">
            <h4 className="flex items-center text-sm font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400 font-sans">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {t.rulesTitle}
            </h4>
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.rule1}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.rule2}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.rule3}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.rule4}</p>
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Unlock Flow illustration */}
          <div className="space-y-3.5">
            <h4 className="flex items-center text-sm font-semibold tracking-wide uppercase text-amber-600 dark:text-amber-400 font-sans">
              <Award className="w-4 h-4 mr-1.5" />
              {t.unlockCriteria}
            </h4>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-305">
              {t.ruleUnlock}
            </p>

            {/* Visual ladder */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="flex flex-col items-center p-3 text-center border rounded-xl bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/30">
                <span className="text-xs font-bold text-green-700 dark:text-green-400">Easy</span>
                <span className="text-[10px] mt-1 font-mono text-green-600">Start</span>
              </div>
              <div className="flex flex-col items-center p-3 text-center border rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Medium</span>
                <span className="text-[10px] mt-1 font-mono text-zinc-500">Win 1 Easy</span>
              </div>
              <div className="flex flex-col items-center p-3 text-center border rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/30">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Hard</span>
                <span className="text-[10px] mt-1 font-mono text-zinc-500">Win 1 Med</span>
              </div>
              <div className="flex flex-col items-center p-3 text-center border rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Excellent</span>
                <span className="text-[10px] mt-1 font-mono text-zinc-500">Win 1 Hard</span>
              </div>
            </div>
          </div>
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
