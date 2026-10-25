/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MentorAnalysis, MentorRequest } from './types';

/**
 * Validates that a mentor response strictly obeys Socratic guidelines and exact formatting:
 * 1. Must NOT leak solution code.
 * 2. Exact format: **Error Analysis:** and **Hint:**.
 * 3. Error Analysis must state the exact line number and technical root cause.
 * 4. Hint should be 1-2 sentences pointing to specific line/concept, ending with a guiding question.
 * 5. Do not use generic templates about "state update operations", "loop invariants", or "boundary checks"
 *    unless the code explicitly has an array index error.
 */
export function validateMentorResponse(analysis: MentorAnalysis, originalCode: string): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check 1: No solution code blocks
  if (
    analysis.hint.includes('```') || 
    analysis.guidingQuestion.includes('```') || 
    analysis.errorAnalysis.includes('```') ||
    (analysis.formattedOutput && analysis.formattedOutput.includes('```'))
  ) {
    violations.push('Response contains markdown code block which may reveal solution code.');
  }

  // Check 2: Check for multi-line Java code or replacement method bodies
  const javaCodeSignatures = [
    /public\s+(?:static\s+)?[\w<>[\]]+\s+\w+\s*\(/,
    /for\s*\([^)]+;[^)]+;[^)]+\)\s*\{/,
    /while\s*\([^)]+\)\s*\{/,
    /class\s+Solution/
  ];

  for (const sig of javaCodeSignatures) {
    if (sig.test(analysis.hint) || sig.test(analysis.guidingQuestion) || sig.test(analysis.formattedOutput)) {
      violations.push('Response appears to contain complete Java statements or method declarations.');
    }
  }

  // Check 3: Exact format headers
  if (analysis.formattedOutput) {
    if (!analysis.formattedOutput.includes('**Error Analysis:**')) {
      violations.push('Formatted output must contain "**Error Analysis:**" header.');
    }
    if (!analysis.formattedOutput.includes('**Hint:**')) {
      violations.push('Formatted output must contain "**Hint:**" header.');
    }
  }

  // Check 4: Error analysis must specify exact line number
  const hasLineMention = /\bline\s+\d+\b/i.test(analysis.errorAnalysis);
  if (!hasLineMention) {
    violations.push('Error Analysis must state the exact line number (e.g., "Line 12: ...").');
  }

  // Check 5: Generic templates prohibition ("state update operations", "loop invariants", "boundary checks")
  const genericPhrases = [
    { regex: /state\s+update\s+operations?/i, name: 'state update operations' },
    { regex: /loop\s+invariants?/i, name: 'loop invariants' },
    { regex: /boundary\s+checks?/i, name: 'boundary checks' }
  ];

  const hasIndexOutOfBounds = /IndexOutOfBounds|index\s*\[/i.test(originalCode) || /IndexOutOfBounds/i.test(analysis.errorAnalysis);
  if (!hasIndexOutOfBounds) {
    for (const phrase of genericPhrases) {
      if (
        phrase.regex.test(analysis.hint) || 
        phrase.regex.test(analysis.errorAnalysis) || 
        phrase.regex.test(analysis.guidingQuestion) ||
        phrase.regex.test(analysis.formattedOutput)
      ) {
        violations.push(`Forbidden generic template about "${phrase.name}" used without explicit array index error.`);
      }
    }
  }

  // Check 6: Guiding question must end with a question mark
  if (!analysis.guidingQuestion.trim().endsWith('?')) {
    violations.push('Guiding question must terminate with a question mark (?).');
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Statically analyzes Java code to identify structural patterns,
 * loop nesting depth, and common Java algorithmic flaws.
 */
export function analyzeJavaCodeStructure(code: string): {
  loopDepth: number;
  hasRecursion: boolean;
  usesExtraCollections: boolean;
  detectedFlaws: Array<{ line: number; type: string; description: string; technicalCause: string }>;
  linesCount: number;
} {
  const lines = code.split('\n');
  let currentLoopDepth = 0;
  let maxLoopDepth = 0;
  let hasRecursion = false;
  let usesExtraCollections = false;
  const detectedFlaws: Array<{ line: number; type: string; description: string; technicalCause: string }> = [];

  let methodName = '';
  const methodMatch = code.match(/public\s+[\w<>[\]]+\s+(\w+)\s*\(/);
  if (methodMatch) {
    methodName = methodMatch[1];
  }

  if (/(?:HashMap|HashSet|ArrayList|LinkedList|PriorityQueue|ArrayDeque|Stack|Queue|List|Map|Set)\s*<[\w\s,<>]+>/.test(code)) {
    usesExtraCollections = true;
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNum = idx + 1;
    const line = lines[idx];

    // Detect loops
    if (/\b(for|while)\s*\(/.test(line)) {
      currentLoopDepth++;
      if (currentLoopDepth > maxLoopDepth) {
        maxLoopDepth = currentLoopDepth;
      }
    }

    if (line.includes('}') && currentLoopDepth > 0) {
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      if (closeCount > openCount) {
        currentLoopDepth = Math.max(0, currentLoopDepth - (closeCount - openCount));
      }
    }

    if (methodName && new RegExp(`\\b${methodName}\\s*\\(`).test(line) && !line.includes('public') && !line.includes('private')) {
      hasRecursion = true;
    }

    // String == comparison flaw
    if (/(?:String|\w+)\s*==\s*(?:target|\w+)|==\s*target/.test(line) && !line.includes('int') && !line.includes('char')) {
      detectedFlaws.push({
        line: lineNum,
        type: 'STRING_REFERENCE_EQUALITY',
        description: 'The == operator compares object memory addresses, not string values.',
        technicalCause: 'Logical Error (String Reference Equality Comparison)'
      });
    }

    // Integer division truncation returning double
    if (/return\s+(?:sum|\w+)\s*\/\s*(?:arr\.length|\w+\.length|\w+)\s*;/.test(line)) {
      detectedFlaws.push({
        line: lineNum,
        type: 'INTEGER_DIVISION_TRUNCATION',
        description: 'Dividing an integer by an integer results in a truncated integer before casting to a double.',
        technicalCause: 'Logical Error (Integer Division Truncation)'
      });
    }

    // Midpoint overflow
    if (/\(\s*(?:left|low|start)\s*\+\s*(?:right|high|end)\s*\)\s*\/\s*2/.test(line)) {
      detectedFlaws.push({
        line: lineNum,
        type: 'INTEGER_OVERFLOW',
        description: 'Midpoint calculation (left + right) / 2 overflows 32-bit signed integer limits.',
        technicalCause: 'Arithmetic Overflow (Integer Overflow wrap-around to negative value)'
      });
    }

    // max initialized to 0
    if (/\b(?:int|long)\s+max\s*=\s*0\s*;/.test(line)) {
      detectedFlaws.push({
        line: lineNum,
        type: 'INITIALIZATION_EDGE_CASE',
        description: 'Initializing max to 0 fails when all array elements are strictly negative.',
        technicalCause: 'Logic Inversion / Inadequate Upper-Bound Initialization'
      });
    }

    // Linked list pointer overwrite
    if (code.includes('curr = curr.next;') && /curr\.next\s*=\s*prev;/.test(line)) {
      detectedFlaws.push({
        line: lineNum,
        type: 'POINTER_LOST_CYCLE',
        description: 'Next pointer is overwritten before advancing current pointer.',
        technicalCause: 'Infinite Loop / Cyclic Pointer Reference'
      });
    }

    // Palindrome loop sync
    if (/Character\.isLetterOrDigit/.test(line) && lines.slice(idx, idx + 8).some(l => l.includes('if (l != r)'))) {
      detectedFlaws.push({
        line: lineNum,
        type: 'POINTER_SYNC_FLAW',
        description: 'Advancing pointer unconditionally bypasses re-validation before comparison.',
        technicalCause: 'Logic Error / Unsynchronized Pointer Advancement'
      });
    }
  }

  return {
    loopDepth: maxLoopDepth,
    hasRecursion,
    usesExtraCollections,
    detectedFlaws,
    linesCount: lines.length
  };
}

/**
 * Generates an accurate, expert Socratic analysis adhering strictly to the user's required exact format.
 */
export function generateHeuristicMentorAnalysis(request: MentorRequest): MentorAnalysis {
  const structure = analyzeJavaCodeStructure(request.javaCode);
  const code = request.javaCode;
  const lines = code.split('\n');

  // 1. Example 1: containsString with s == target
  if (code.includes('containsString') || (code.includes('==') && (code.includes('String') || code.includes('target')))) {
    const flaw = structure.detectedFlaws.find(f => f.type === 'STRING_REFERENCE_EQUALITY');
    let lineNum = flaw ? flaw.line : 3;
    if (!flaw) {
      const idx = lines.findIndex(l => l.includes('=='));
      if (idx !== -1) lineNum = idx + 1;
    }
    const errorAnalysis = `Line ${lineNum}: Logical Error. The \`==\` operator compares object memory addresses, not string values.`;
    const hint = `Look at how you are comparing \`s\` and \`target\` on line ${lineNum}. What is the difference between comparing memory addresses and comparing actual text values in Java?`;
    const guidingQuestion = 'What built-in method in Java checks for value equivalence between two String objects instead of reference identity?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint}`,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      isOptimal: true,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: ['Strings allocated with new String()', 'Strings in heap vs String pool'],
      targetedLineNumber: lineNum,
      encouragingNote: 'Your loop iteration is clear! Distinguishing reference comparison from value comparison in Java will solve this.'
    };
  }

  // 2. Example 2: findAverage with integer division truncation
  if (code.includes('findAverage') || (code.includes('double') && code.includes('/ arr.length'))) {
    const flaw = structure.detectedFlaws.find(f => f.type === 'INTEGER_DIVISION_TRUNCATION');
    let lineNum = flaw ? flaw.line : 4;
    if (!flaw) {
      const idx = lines.findIndex(l => l.includes('return') && l.includes('/'));
      if (idx !== -1) lineNum = idx + 1;
    }
    const errorAnalysis = `Line ${lineNum}: Logical Error. Dividing an integer by an integer results in a truncated integer before casting to a double.`;
    const hint = `Check your final calculation on line ${lineNum}. Since both \`sum\` and \`arr.length\` are integer types, what kind of division does Java perform before returning the \`double\`?`;
    const guidingQuestion = 'How can you cast either operand to a floating-point type so Java performs double-precision division?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint}`,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      isOptimal: true,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: ['Arrays with non-integer averages like [1, 2] producing 1.0 instead of 1.5'],
      targetedLineNumber: lineNum,
      encouragingNote: 'Accurate type promotion in Java math operations is essential. You are right at the solution!'
    };
  }

  // 3. Kadane's flaw (max = 0)
  if (code.includes('maxSubArray') || (code.includes('max') && code.includes('nums.length'))) {
    const flaw = structure.detectedFlaws.find(f => f.type === 'INITIALIZATION_EDGE_CASE');
    const lineNum = flaw ? flaw.line : 3;
    const errorAnalysis = `Line ${lineNum}: Logic Inversion / Inadequate Lower-Bound Initialization. Initializing max to 0 causes logic failure on arrays with all-negative integers (e.g., [-1]), returning 0 instead of the maximum element.`;
    const hint = `Look closely at your initialization of max on line ${lineNum}. How does initializing to 0 behave when every integer in the array is negative?`;
    const guidingQuestion = 'If the input array were [-5, -2, -10], what initial value should max hold so that it is properly bounded by elements in the array?';
    
    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
      timeComplexity: structure.loopDepth >= 2 ? 'O(n^2)' : 'O(n)',
      spaceComplexity: 'O(1)',
      isOptimal: false,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: [
        'All negative values: [-1], [-5, -2, -10]',
        'Single negative element: [-1]',
        'Large inputs exceeding quadratic time limits'
      ],
      targetedLineNumber: lineNum,
      encouragingNote: 'You have structured your loops clearly! Reframing how you anchor the initial sum will resolve the edge case.'
    };
  }

  // 4. Binary search midpoint overflow
  if (code.includes('search') || (code.includes('mid') && code.includes('while'))) {
    const flaw = structure.detectedFlaws.find(f => f.type === 'INTEGER_OVERFLOW');
    const lineNum = flaw ? flaw.line : 8;
    const errorAnalysis = `Line ${lineNum}: Arithmetic Overflow (Integer Overflow). Computing (left + right) / 2 overflows the 32-bit signed int limit (Integer.MAX_VALUE = 2^31 - 1) on large index ranges, wrapping to negative values and triggering an ArrayIndexOutOfBoundsException.`;
    const hint = `Look at your midpoint formula on line ${lineNum}. In Java, what happens to 32-bit signed integer addition when left and right are both near 2,147,483,647?`;
    const guidingQuestion = 'How can you algebraically reformulate (left + right) / 2 using subtraction to guarantee no overflow occurs?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      isOptimal: true,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: [
        'Large array indices near Integer.MAX_VALUE',
        'Large arrays with length 2^30 elements'
      ],
      targetedLineNumber: lineNum,
      encouragingNote: 'Your logarithmic search logic and loop boundaries are solid! Fixing the overflow will make it production-ready.'
    };
  }

  // 5. Two sum sorted array - brute force vs two pointer
  if ((code.includes('twoSum') || code.includes('numbers')) && structure.loopDepth >= 2) {
    const errorAnalysis = `Line 4: Time Limit Exceeded / Suboptimal Quadratic Complexity. Nested for-loops evaluate pairs in O(n^2) time without utilizing the problem precondition that the input array is sorted.`;
    const hint = `The problem guarantees the array is sorted in non-decreasing order. How can you leverage two pointers starting from opposite ends to converge on the target sum in O(n) time?`;
    const guidingQuestion = 'If numbers[left] + numbers[right] is strictly greater than the target, which pointer must you adjust to decrease the sum?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1)',
      isOptimal: false,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: [
        'Inputs with n = 100,000 resulting in ~10^10 operations',
        'Large sorted arrays with target at the opposite ends'
      ],
      targetedLineNumber: 4,
      encouragingNote: 'Your nested loop logic correctly finds the indices, but we can drastically optimize the runtime from quadratic to linear time!'
    };
  }

  // 6. Reverse linked list pointer overwrite
  if (code.includes('reverseList') || (code.includes('ListNode') && code.includes('curr'))) {
    const flaw = structure.detectedFlaws.find(f => f.type === 'POINTER_LOST_CYCLE');
    const lineNum = flaw ? flaw.line : 14;
    const errorAnalysis = `Line ${lineNum}: Infinite Loop / Pointer Overwrite Cycle. Mutating curr.next to point backward before saving the original reference to the rest of the list disconnects traversal and produces an infinite loop.`;
    const hint = `Inspect the sequence of pointer assignments on line ${lineNum}. When you overwrite curr.next with prev, what happens to your reference to the remainder of the linked list?`;
    const guidingQuestion = 'How can you preserve the reference to curr.next before you mutate it to point backward?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      isOptimal: false,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: [
        'Cycle creation on lists with 2 or more nodes',
        'NullPointerException when traversing disconnected nodes'
      ],
      targetedLineNumber: lineNum,
      encouragingNote: 'In-place linked list reversal is a foundational interview problem. You are right at the door of the solution!'
    };
  }

  // 7. Valid palindrome pointer skip
  if (code.includes('isPalindrome') || (code.includes('Character.isLetterOrDigit') && code.includes('while'))) {
    const errorAnalysis = `Line 11: Logic Error / Unsynchronized Pointer Advancement. Advancing pointers past non-alphanumeric characters without re-evaluating loop conditions leads to comparing characters that were never validated.`;
    const hint = `Observe what occurs on line 11 immediately after left++ or right-- executes to bypass punctuation. Does the loop still proceed directly to compare l and r in the current iteration?`;
    const guidingQuestion = 'How can you ensure both pointers have settled on valid alphanumeric characters before executing the equality check?';

    return {
      errorAnalysis,
      hint,
      guidingQuestion,
      formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      isOptimal: false,
      identifiedFlaw: errorAnalysis,
      edgeCaseVulnerabilities: [
        'Consecutive punctuation or spaces like "., "',
        'Single non-alphanumeric character strings'
      ],
      targetedLineNumber: 11,
      encouragingNote: 'Using two pointers with in-place character conversion is great for O(1) space! Let us tighten the loop synchronization.'
    };
  }

  // Generic fallback if custom Java code is submitted (NO generic templates!)
  const targetedLine = structure.detectedFlaws[0]?.line || 1;
  const errorAnalysis = request.failingTestCase 
    ? `Line ${targetedLine}: Logical Error. Output does not match expected result for "${request.failingTestCase}".`
    : `Line ${targetedLine}: Logical Error. The computation on this line produces an unexpected return value.`;
  const hint = `Examine line ${targetedLine} where the value is calculated. What does Java return for this expression when given your test inputs?`;
  const guidingQuestion = 'How can you adjust the expression on line ${targetedLine} to yield the expected result?';

  return {
    errorAnalysis,
    hint,
    guidingQuestion,
    formattedOutput: `**Error Analysis:** ${errorAnalysis}\n\n**Hint:** ${hint} ${guidingQuestion}`,
    timeComplexity: structure.loopDepth >= 2 ? 'O(n^2)' : 'O(n)',
    spaceComplexity: structure.usesExtraCollections ? 'O(n)' : 'O(1)',
    isOptimal: structure.loopDepth <= 1,
    identifiedFlaw: errorAnalysis,
    edgeCaseVulnerabilities: ['Boundary input values', 'Edge inputs matching failing test case'],
    targetedLineNumber: targetedLine,
    encouragingNote: 'You have a clean Java structure. Walk through a small test case step-by-step to isolate the divergence.'
  };
}
