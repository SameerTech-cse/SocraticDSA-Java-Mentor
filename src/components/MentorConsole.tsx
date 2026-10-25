/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MentorAnalysis 
} from '../mentor/types';
import { ComplexityBadge } from './ComplexityBadge';
import { 
  Lightbulb, 
  HelpCircle, 
  AlertCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  FileCode
} from 'lucide-react';

interface MentorConsoleProps {
  analysis: MentorAnalysis | null;
  isLoading: boolean;
  onSelectLine: (line: number) => void;
  chatMessages: Array<{ role: 'user' | 'model'; text: string }>;
  onSendMessage: (msg: string) => void;
  isChatLoading: boolean;
  optimalTime?: string;
  optimalSpace?: string;
}

export const MentorConsole: React.FC<MentorConsoleProps> = ({
  analysis,
  isLoading,
  onSelectLine,
  chatMessages,
  onSendMessage,
  isChatLoading,
  optimalTime,
  optimalSpace
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt);
  };

  const handleCopyFormatted = () => {
    if (!analysis) return;
    const textToCopy = analysis.formattedOutput || `**Error Analysis:** ${analysis.errorAnalysis}\n\n**Hint:** ${analysis.hint} ${analysis.guidingQuestion}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Bot className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">Reviewing Java Code AST & Invariants...</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Analyzing exact line numbers, diagnosing technical root causes, and formulating Socratic hints without spoiling code.
          </p>
        </div>
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-orange-500 to-amber-400 animate-indeterminate" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-xl space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Socratic DSA Mentor Ready</h3>
              <p className="text-xs text-slate-400">Expert guidance for Java developers • Zero-Spoiler Guarantee</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs space-y-3">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standard Mentorship Output Format
            </span>
            <div className="space-y-2 text-slate-300 font-mono text-[11px] bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <p className="text-amber-400 font-bold">**Error Analysis:**</p>
              <p className="text-slate-400 italic">
                (State the exact line number and the technical root cause, such as StackOverflowError, infinite loop, or ConcurrentModificationException.)
              </p>
              <p className="text-orange-400 font-bold pt-2">**Hint:**</p>
              <p className="text-slate-400 italic">
                (Provide a 1-to-2 sentence hint pointing to the specific line or concept. End with a guiding question. NEVER output corrected code.)
              </p>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              ✓ No generic templates about "boundary checks" unless an array index error is present.
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-950/20 border border-orange-500/20 rounded-xl text-xs text-orange-200">
          <p className="font-medium">💡 Ready to inspect?</p>
          <p className="text-slate-400 text-[11px] mt-1">
            Select a Java problem preset or write custom code, then click <strong>"Ask Mentor for Guidance"</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pr-1">
      {/* 1. Complexity Badge */}
      <ComplexityBadge
        timeComplexity={analysis.timeComplexity}
        spaceComplexity={analysis.spaceComplexity}
        isOptimal={analysis.isOptimal}
        optimalTime={optimalTime}
        optimalSpace={optimalSpace}
      />

      {/* 2. EXACT FORMATTED MENTOR RESPONSE */}
      <div className="bg-slate-900/90 border border-orange-500/30 rounded-xl p-4 shadow-lg space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Official Mentor Analysis
            </span>
          </div>

          <div className="flex items-center gap-2">
            {analysis.targetedLineNumber && (
              <button
                onClick={() => onSelectLine(analysis.targetedLineNumber!)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition"
                title="Click to jump and highlight line in editor"
              >
                <Code2 className="w-3 h-3" />
                <span>Jump to Line {analysis.targetedLineNumber}</span>
              </button>
            )}

            <button
              onClick={handleCopyFormatted}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Copy formatted markdown response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Part A: **Error Analysis:** */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>**Error Analysis:**</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {analysis.errorAnalysis}
          </div>
        </div>

        {/* Part B: **Hint:** */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 font-mono">
            <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
            <span>**Hint:**</span>
          </div>
          <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
            <p>{analysis.hint}</p>
            <p className="text-orange-200 font-medium italic border-l-2 border-orange-500 pl-2">
              &ldquo;{analysis.guidingQuestion}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 3. Vulnerable Edge Cases */}
      {analysis.edgeCaseVulnerabilities && analysis.edgeCaseVulnerabilities.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Vulnerable Scenarios & Edge Cases:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.edgeCaseVulnerabilities.map((v, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Encouraging Note */}
      {analysis.encouragingNote && (
        <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{analysis.encouragingNote}</span>
        </div>
      )}

      {/* 5. Socratic Dialogue Thread */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="font-semibold text-slate-300">Socratic Dialogue</span>
          <span className="text-[11px]">Answer the mentor or test your thoughts</span>
        </div>

        {/* Chat Messages */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {chatMessages.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              Have a hypothesis or answer to the mentor's question? Type it below to discuss before editing your code.
            </p>
          ) : (
            chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-200 ml-4'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 mr-4'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold tracking-wider uppercase opacity-75">
                  {msg.role === 'user' ? (
                    <>
                      <User className="w-3 h-3" /> You
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-orange-400" /> Mentor
                    </>
                  )}
                </div>
                <div>{msg.text}</div>
              </div>
            ))
          )}

          {isChatLoading && (
            <div className="p-2.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700 text-slate-400 mr-4 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>Mentor is reflecting on your reasoning...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleQuickPrompt("What if the array has only negative numbers?")}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
          >
            "What if numbers are all negative?"
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("How do I avoid integer overflow in midpoint?")}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
          >
            "How to avoid midpoint overflow?"
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("How can I optimize this from O(n^2) to O(n)?")}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
          >
            "How to reach O(n)?"
          </button>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-1">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Reply to the mentor's guiding question..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isChatLoading}
            className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition"
            title="Send reply to mentor"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
