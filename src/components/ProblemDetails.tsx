/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DsaProblemPreset } from '../mentor/types';
import { Target, Layers, CheckSquare, HelpCircle } from 'lucide-react';

interface ProblemDetailsProps {
  preset?: DsaProblemPreset;
  isCustom: boolean;
  customTitle: string;
  onChangeCustomTitle: (title: string) => void;
  customDescription: string;
  onChangeCustomDescription: (desc: string) => void;
}

export const ProblemDetails: React.FC<ProblemDetailsProps> = ({
  preset,
  isCustom,
  customTitle,
  onChangeCustomTitle,
  customDescription,
  onChangeCustomDescription
}) => {
  if (isCustom) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Custom Problem Title
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => onChangeCustomTitle(e.target.value)}
            placeholder="e.g. 3Sum / LRU Cache / Cycle Detection"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Problem Statement / Constraints
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => onChangeCustomDescription(e.target.value)}
            placeholder="Describe what the method should accomplish and input constraints..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-orange-500"
          />
        </div>
      </div>
    );
  }

  if (!preset) return null;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Title & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">{preset.title}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              preset.difficulty === 'Easy' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : preset.difficulty === 'Medium'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {preset.difficulty}
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> {preset.category}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-400">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Optimal: <strong className="text-emerald-400">{preset.optimalTime}</strong> / <strong className="text-cyan-400">{preset.optimalSpace}</strong></span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-300 leading-relaxed">
        {preset.description}
      </div>

      {/* Edge Cases Matrix */}
      {preset.edgeCasesToTest && preset.edgeCasesToTest.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            Critical Edge Cases to Consider:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {preset.edgeCasesToTest.map((ec, i) => (
              <div
                key={i}
                className="text-[11px] font-mono text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded px-2.5 py-1.5 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
                <span>{ec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
