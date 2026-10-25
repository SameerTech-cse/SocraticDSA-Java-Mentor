/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Play, Sparkles, Bug, MessageSquare, Terminal } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  failingTestCase: string;
  onChangeFailingTestCase: (text: string) => void;
  studentDoubt: string;
  onChangeStudentDoubt: (text: string) => void;
  targetedLineNumber?: number | null;
  onSubmitAnalysis: () => void;
  isLoading: boolean;
  isRevision: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  failingTestCase,
  onChangeFailingTestCase,
  studentDoubt,
  onChangeStudentDoubt,
  targetedLineNumber,
  onSubmitAnalysis,
  isLoading,
  isRevision,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 4 spaces
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      onChangeCode(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading) {
        onSubmitAnalysis();
      }
    }
  };

  // Scroll to targeted line if pointed by mentor
  useEffect(() => {
    if (targetedLineNumber && textareaRef.current) {
      const lineHeight = 24; // approx px per line
      const targetScroll = Math.max(0, (targetedLineNumber - 3) * lineHeight);
      textareaRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [targetedLineNumber]);

  return (
    <div className="flex flex-col min-h-[460px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="font-mono text-slate-300 font-medium ml-2">Solution.java</span>
          <span className="text-slate-500 font-mono text-[11px]">({lineCount} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          {targetedLineNumber && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono flex items-center gap-1 animate-pulse">
              <span>Pointing to Line {targetedLineNumber}</span>
            </span>
          )}
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">Enter</kbd> to analyze
          </span>
        </div>
      </div>

      {/* Code Editor Surface */}
      <div className="relative flex overflow-hidden h-[380px] bg-slate-950 font-mono text-sm leading-6">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="select-none py-3 pl-3 pr-2 w-14 text-right bg-slate-950/60 border-r border-slate-800/80 text-slate-600 overflow-hidden font-mono text-xs h-full"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isTargeted = targetedLineNumber === lineNum;
            return (
              <div
                key={i}
                className={`h-6 transition-colors ${
                  isTargeted
                    ? 'text-amber-400 font-bold bg-amber-500/10 rounded-sm -mx-1 px-1'
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Area */}
        <textarea
          ref={textareaRef}
          value={code}
          rows={Math.max(16, lineCount)}
          onChange={(e) => onChangeCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 w-full resize-none p-3 bg-transparent text-slate-200 outline-none overflow-auto font-mono text-xs sm:text-sm leading-6 whitespace-pre tab-4 selection:bg-orange-500/30"
          placeholder="// Paste or write your Java algorithm here..."
        />
      </div>

      {/* Problem Test Case & Doubt Inputs */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Failing Test Case Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Bug className="w-3 h-3 text-rose-400" />
              Failing Test Case / Output or Error:
            </label>
            <input
              type="text"
              value={failingTestCase}
              onChange={(e) => onChangeFailingTestCase(e.target.value)}
              placeholder="e.g. Input: [-1], Expected: -1, Returned: 0"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-slate-700"
            />
          </div>

          {/* Student Doubt Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-orange-400" />
              Your Question / Hypothesis for the Mentor:
            </label>
            <input
              type="text"
              value={studentDoubt}
              onChange={(e) => onChangeStudentDoubt(e.target.value)}
              placeholder="e.g. Why does it fail when all numbers are negative?"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Terminal className="w-3 h-3" />
            <span>Guaranteed zero-spoiler: Mentor guides thinking, never supplies final code.</span>
          </div>

          <button
            onClick={onSubmitAnalysis}
            disabled={isLoading || !code.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-98"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Mentor Analyzing Complexity & Logic...</span>
              </>
            ) : isRevision ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit Code Revision</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Ask Mentor for Guidance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
