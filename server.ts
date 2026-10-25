/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { generateHeuristicMentorAnalysis, validateMentorResponse } from './src/mentor/parser.ts';
import { MentorRequest, MentorAnalysis } from './src/mentor/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MENTOR_SYSTEM_INSTRUCTION = `You are an expert Data Structures and Algorithms (DSA) mentor for Java developers. Your goal is to guide students to the correct answer without ever writing the final solution for them.

When a user submits code, you must analyze it and respond using this exact format:

**Error Analysis:** (State the exact line number and the technical root cause, such as StackOverflowError, infinite loop, or ConcurrentModificationException. Do not skip this step.)

**Hint:** (Provide a 1-to-2 sentence hint pointing to the specific line or concept. End with a guiding question to prompt their independent reasoning. NEVER output the corrected code.)

Do not use generic templates about "state update operations" or "loop invariants" unless the code explicitly has an array index error.

### EXAMPLES

**User Submission:**
public boolean containsString(String[] arr, String target) {
    for (String s : arr) {
        if (s == target) { return true; }
    }
    return false;
}

**Model Response:**
**Error Analysis:** Line 3: Logical Error. The \`==\` operator compares object memory addresses, not string values. 
**Hint:** Look at how you are comparing \`s\` and \`target\` on line 3. What is the difference between comparing memory addresses and comparing actual text values in Java?

**User Submission:**
public double findAverage(int[] arr) {
    int sum = 0;
    for (int num : arr) { sum += num; }
    return sum / arr.length;
}

**Model Response:**
**Error Analysis:** Line 4: Logical Error. Dividing an integer by an integer results in a truncated integer before casting to a double.
**Hint:** Check your final calculation on line 4. Since both \`sum\` and \`arr.length\` are integer types, what kind of division does Java perform before returning the \`double\`?`;

// API Route: Analyze Java code submission
app.post('/api/mentor/analyze', async (req, res) => {
  const mentorRequest = req.body as MentorRequest;

  if (!mentorRequest || !mentorRequest.javaCode) {
    return res.status(400).json({ error: 'Java code is required for mentor analysis.' });
  }

  // If Gemini client is available, attempt Gemini API with a timeout
  if (aiClient) {
    try {
      const prompt = `Student Java DSA Code Submission:
Problem: ${mentorRequest.problemTitle || 'DSA Problem'}
Description: ${mentorRequest.problemDescription || 'N/A'}
Failing Test Case / Error reported by student: ${mentorRequest.failingTestCase || 'None specified'}
Student's Doubt/Question: ${mentorRequest.studentDoubt || 'Why is this failing / sub-optimal?'}

Java Code:
\`\`\`java
${mentorRequest.javaCode}
\`\`\`

Analyze the code and respond using this EXACT format:
**Error Analysis:** (State the exact line number and the technical root cause, such as StackOverflowError, infinite loop, or ConcurrentModificationException. Do not skip this step.)
**Hint:** (Provide a 1-to-2 sentence hint pointing to the specific line or concept. End with a guiding question to prompt their independent reasoning. NEVER output the corrected code.)

Do not use generic templates about "state update operations" or "loop invariants" unless the code explicitly has an array index error.`;

      const aiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              errorAnalysis: {
                type: Type.STRING,
                description: 'Exact line number and technical root cause (e.g. StackOverflowError, infinite loop, Arithmetic Overflow).'
              },
              hint: {
                type: Type.STRING,
                description: '1-to-2 sentence hint pointing to specific line or concept. NO SOLUTION CODE.'
              },
              guidingQuestion: {
                type: Type.STRING,
                description: 'A question ending in ? to prompt independent reasoning.'
              },
              formattedOutput: {
                type: Type.STRING,
                description: 'The exact markdown format: **Error Analysis:** ...\\n\\n**Hint:** ...'
              },
              targetedLineNumber: {
                type: Type.INTEGER,
                description: 'Exact line number where flaw originates.'
              },
              timeComplexity: {
                type: Type.STRING,
                description: 'Time complexity in Big-O notation, e.g., O(n^2), O(n), O(log n)'
              },
              spaceComplexity: {
                type: Type.STRING,
                description: 'Auxiliary space complexity in Big-O notation, e.g., O(1), O(n)'
              },
              isOptimal: {
                type: Type.BOOLEAN,
                description: 'Whether current code matches optimal complexity'
              },
              identifiedFlaw: {
                type: Type.STRING,
                description: 'Brief technical description of flaw'
              },
              edgeCaseVulnerabilities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of edge cases where this specific code fails'
              },
              encouragingNote: {
                type: Type.STRING,
                description: 'Encouraging technical note'
              }
            },
            required: ['errorAnalysis', 'hint', 'guidingQuestion', 'timeComplexity', 'spaceComplexity', 'isOptimal']
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI API timeout, utilizing deterministic Socratic engine')), 2500)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}') as MentorAnalysis;
      if (!parsed.formattedOutput) {
        parsed.formattedOutput = `**Error Analysis:** ${parsed.errorAnalysis}\n\n**Hint:** ${parsed.hint} ${parsed.guidingQuestion}`;
      }
      const validation = validateMentorResponse(parsed, mentorRequest.javaCode);

      if (!validation.isValid) {
        console.warn('Gemini response had rule violations, applying heuristic safeguard:', validation.violations);
        const heuristic = generateHeuristicMentorAnalysis(mentorRequest);
        return res.json({
          ...heuristic,
          source: 'hybrid-verified'
        });
      }

      return res.json({
        ...parsed,
        source: 'gemini-3.8-flash'
      });
    } catch (err: any) {
      console.log('Using deterministic Socratic reasoning engine:', err.message);
      const fallback = generateHeuristicMentorAnalysis(mentorRequest);
      return res.json({
        ...fallback,
        source: 'socratic-engine'
      });
    }
  }

  // Fallback heuristic engine if no API key is provided
  const fallback = generateHeuristicMentorAnalysis(mentorRequest);
  return res.json({
    ...fallback,
    source: 'heuristic-engine',
    notice: 'Analyzed via Java DSA static reasoning engine.'
  });
});

// API Route: Interactive Socratic follow-up dialogue
app.post('/api/mentor/chat', async (req, res) => {
  const { studentMessage, currentCode, problemTitle, history } = req.body;

  if (!studentMessage) {
    return res.status(400).json({ error: 'studentMessage is required.' });
  }

  if (aiClient) {
    try {
      const chatPrompt = `The student is discussing their Java DSA code for "${problemTitle || 'Problem'}":
Current Student Code:
\`\`\`java
${currentCode || '// N/A'}
\`\`\`

Conversation History:
${(history || []).map((h: any) => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${h.text}`).join('\n')}

Student just said:
"${studentMessage}"

Respond as the expert Java DSA mentor:
- Check if their reasoning is correct or flawed.
- Keep encouraging, concise, highly technical.
- NEVER provide the final Java solution code.
- Provide a targeted hint or confirmation, followed by the next guiding question.`;

      const aiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatPrompt,
        config: {
          systemInstruction: MENTOR_SYSTEM_INSTRUCTION,
          temperature: 0.3,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI chat timeout')), 2500)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      return res.json({ reply: response.text });
    } catch (err: any) {
      console.log('Chat fallback triggered:', err.message);
    }
  }

  // Fallback response tailored to Java algorithmic reasoning
  let fallbackReply = `Great technical observation! Walk that logic forward: once you observe how the values change, what specific adjustment in your Java loop or variable bounds ensures that condition holds true?`;
  if (studentMessage.toLowerCase().includes('negative')) {
    fallbackReply = `Precisely! When all numbers are negative, initializing max to 0 causes 0 to exceed all negative sums. What initial value exists inside the array itself that would provide a valid starting bound?`;
  } else if (studentMessage.toLowerCase().includes('overflow')) {
    fallbackReply = `Spot on. Adding two large positive 32-bit signed integers wraps around to negative values. What algebraic rearrangement of (left + right) / 2 using (right - left) avoids exceeding Integer.MAX_VALUE?`;
  } else if (studentMessage.toLowerCase().includes('o(n)')) {
    fallbackReply = `Exactly what we want! In an already sorted array, if nums[left] + nums[right] is greater than target, which element is too large and which pointer should you move?`;
  }

  return res.json({ reply: fallbackReply });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
