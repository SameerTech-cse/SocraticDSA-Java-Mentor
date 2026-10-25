/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Database, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ComplexityBadgeProps {
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  optimalTime?: string;
  optimalSpace?: string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({
  timeComplexity,
  spaceComplexity,
  isOptimal,
  optimalTime,
  optimalSpace
}) => {
  const isHighTime = timeComplexity.includes('n^2') || timeComplexity.includes('n^3') || timeComplexity.includes('2^n');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Complexity Analysis
        </span>
        <div className="flex items-center gap-1.5">
          {isOptimal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Target Met
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" /> Sub-optimal Approach
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${
          isHighTime 
            ? 'bg-amber-950/20 border-amber-500/30' 
            : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Time Complexity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-mono font-bold ${
              isHighTime ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {timeComplexity}
            </span>
            {optimalTime && (
              <span className="text-xs text-slate-400 font-mono">
                (target: {optimalTime})
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-slate-800/60 border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Space Complexity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold text-cyan-400">
              {spaceComplexity}
            </span>
            {optimalSpace && (
              <span className="text-xs text-slate-400 font-mono">
                (target: {optimalSpace})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
