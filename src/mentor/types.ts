/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MentorAnalysis {
  errorAnalysis: string; // Exact line number and technical root cause
  hint: string; // 1-2 sentences strictly pointing to exact line/concept
  guidingQuestion: string; // Question to prompt student's independent reasoning
  formattedOutput: string; // Exact markdown format with **Error Analysis:** and **Hint:**
  targetedLineNumber?: number | null;
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  identifiedFlaw: string;
  edgeCaseVulnerabilities: string[];
  encouragingNote?: string;
  confidenceScore?: number;
}

export interface MentorRequest {
  problemTitle: string;
  problemDescription: string;
  javaCode: string;
  failingTestCase?: string;
  studentDoubt?: string;
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export interface DsaProblemPreset {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  initialFailingCode: string;
  failingTestCase: string;
  optimalTime: string;
  optimalSpace: string;
  edgeCasesToTest: string[];
}
