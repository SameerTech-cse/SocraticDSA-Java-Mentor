/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coffee, ShieldCheck, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import { DsaProblemPreset } from '../mentor/types';

interface HeaderProps {
  presets: DsaProblemPreset[];
  selectedProblemId: string;
  onSelectProblem: (id: string) => void;
  onResetCode: () => void;
  iterationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  selectedProblemId,
  onSelectProblem,
  onResetCode,
  iterationCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight">SocraticDSA</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Java Mentor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-Spoiler Mentorship • Socratic Guidance
            </p>
          </div>
        </div>

        {/* Problem Selector */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <label htmlFor="problem-select" className="text-xs font-medium text-slate-400 whitespace-nowrap flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Problem:
          </label>
          <select
            id="problem-select"
            value={selectedProblemId}
            onChange={(e) => onSelectProblem(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/40 transition cursor-pointer"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title} ({preset.difficulty})
              </option>
            ))}
            <option value="custom">✏️ Custom Java Problem</option>
          </select>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {iterationCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Iteration #{iterationCount}
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Strict Anti-Spoiler Protocol</span>
          </div>

          <button
            onClick={onResetCode}
            title="Reset code to original attempt"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
