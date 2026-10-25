/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DSA_PROBLEM_PRESETS } from './mentor/presets';
import { MentorAnalysis, DsaProblemPreset } from './mentor/types';
import { Header } from './components/Header';
import { ProblemDetails } from './components/ProblemDetails';
import { CodeEditor } from './components/CodeEditor';
import { MentorConsole } from './components/MentorConsole';
import { Code, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [selectedProblemId, setSelectedProblemId] = useState<string>('max-subarray');
  const [activePreset, setActivePreset] = useState<DsaProblemPreset | undefined>(
    DSA_PROBLEM_PRESETS[0]
  );

  // Custom problem inputs
  const [customTitle, setCustomTitle] = useState('Custom Java Problem');
  const [customDescription, setCustomDescription] = useState('');

  // Code and test inputs
  const [code, setCode] = useState<string>(DSA_PROBLEM_PRESETS[0].initialFailingCode);
  const [failingTestCase, setFailingTestCase] = useState<string>(
    DSA_PROBLEM_PRESETS[0].failingTestCase
  );
  const [studentDoubt, setStudentDoubt] = useState<string>('');

  // Mentor state
  const [analysis, setAnalysis] = useState<MentorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [targetedLineNumber, setTargetedLineNumber] = useState<number | null>(null);
  const [iterationCount, setIterationCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Socratic chat thread
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Mobile navigation tab: 'editor' | 'details' | 'mentor'
  const [mobileTab, setMobileTab] = useState<'editor' | 'details' | 'mentor'>('editor');

  const handleSelectProblem = (id: string) => {
    setSelectedProblemId(id);
    setAnalysis(null);
    setTargetedLineNumber(null);
    setChatMessages([]);
    setErrorMessage(null);
    setIterationCount(0);

    if (id === 'custom') {
      setActivePreset(undefined);
      setCode(`public class Solution {\n    // Write your Java algorithm here\n    \n}`);
      setFailingTestCase('');
      setStudentDoubt('');
    } else {
      const preset = DSA_PROBLEM_PRESETS.find((p) => p.id === id);
      if (preset) {
        setActivePreset(preset);
        setCode(preset.initialFailingCode);
        setFailingTestCase(preset.failingTestCase);
        setStudentDoubt('');
      }
    }
  };

  const handleResetCode = () => {
    if (activePreset) {
      setCode(activePreset.initialFailingCode);
      setFailingTestCase(activePreset.failingTestCase);
    } else {
      setCode(`public class Solution {\n    // Write your Java algorithm here\n    \n}`);
    }
    setAnalysis(null);
    setTargetedLineNumber(null);
    setChatMessages([]);
    setIterationCount(0);
    setErrorMessage(null);
  };

  const handleSubmitAnalysis = async () => {
    if (!code.trim()) {
      setErrorMessage('Please provide Java code before requesting mentor guidance.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const problemTitle = activePreset ? activePreset.title : customTitle;
    const problemDescription = activePreset ? activePreset.description : customDescription;

    try {
      const res = await fetch('/api/mentor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle,
          problemDescription,
          javaCode: code,
          failingTestCase,
          studentDoubt,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as MentorAnalysis;
      setAnalysis(data);
      setTargetedLineNumber(data.targetedLineNumber || null);
      setIterationCount((prev) => prev + 1);

      // On mobile, auto-switch to mentor tab so student sees results immediately
      setMobileTab('mentor');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(
        'Could not complete analysis. Check server connection or verify your Java code format.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (msg: string) => {
    const updatedMessages = [...chatMessages, { role: 'user' as const, text: msg }];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentMessage: msg,
          currentCode: code,
          problemTitle: activePreset?.title || customTitle,
          history: updatedMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Notice how your pointer or boundary changes with that step. What happens to the remaining elements?',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      {/* Top Navigation */}
      <Header
        presets={DSA_PROBLEM_PRESETS}
        selectedProblemId={selectedProblemId}
        onSelectProblem={handleSelectProblem}
        onResetCode={handleResetCode}
        iterationCount={iterationCount}
      />

      {/* Error Notice if any */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 w-full pt-3">
        <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMobileTab('editor')}
            className={`py-1.5 rounded-lg font-medium transition ${
              mobileTab === 'editor'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Java Code
          </button>
          <button
            onClick={() => setMobileTab('details')}
            className={`py-1.5 rounded-lg font-medium transition ${
              mobileTab === 'details'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Problem Info
          </button>
          <button
            onClick={() => setMobileTab('mentor')}
            className={`py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              mobileTab === 'mentor'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Mentor</span>
            {analysis && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Details & Code Editor (7 cols) */}
        <section
          className={`lg:col-span-7 flex flex-col space-y-4 ${
            mobileTab === 'mentor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Problem Details */}
          <div className={mobileTab === 'editor' ? 'hidden lg:block' : 'block'}>
            <ProblemDetails
              preset={activePreset}
              isCustom={selectedProblemId === 'custom'}
              customTitle={customTitle}
              onChangeCustomTitle={setCustomTitle}
              customDescription={customDescription}
              onChangeCustomDescription={setCustomDescription}
            />
          </div>

          {/* Java Code Editor */}
          <div className={mobileTab === 'details' ? 'hidden lg:block' : 'block'}>
            <CodeEditor
              code={code}
              onChangeCode={setCode}
              failingTestCase={failingTestCase}
              onChangeFailingTestCase={setFailingTestCase}
              studentDoubt={studentDoubt}
              onChangeStudentDoubt={setStudentDoubt}
              targetedLineNumber={targetedLineNumber}
              onSubmitAnalysis={handleSubmitAnalysis}
              isLoading={isLoading}
              isRevision={iterationCount > 0}
            />
          </div>
        </section>

        {/* Right Column: Socratic Mentor Console & Chat (5 cols) */}
        <section
          className={`lg:col-span-5 h-[calc(100vh-140px)] min-h-[550px] sticky top-20 ${
            mobileTab !== 'mentor' ? 'hidden lg:block' : 'block'
          }`}
        >
          <MentorConsole
            analysis={analysis}
            isLoading={isLoading}
            onSelectLine={(line) => setTargetedLineNumber(line)}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            isChatLoading={isChatLoading}
            optimalTime={activePreset?.optimalTime}
            optimalSpace={activePreset?.optimalSpace}
          />
        </section>
      </main>
    </div>
  );
}
