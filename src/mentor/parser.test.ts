/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  analyzeJavaCodeStructure, 
  generateHeuristicMentorAnalysis, 
  validateMentorResponse 
} from './parser';
import { DSA_PROBLEM_PRESETS } from './presets';

test('analyzeJavaCodeStructure accurately measures loop depth and detects nested loops', () => {
  const code = `
  public int maxSubArray(int[] nums) {
      int max = 0;
      for (int i = 0; i < nums.length; i++) {
          int sum = 0;
          for (int j = i; j < nums.length; j++) {
              sum += nums[j];
              if (sum > max) max = sum;
          }
      }
      return max;
  }`;

  const structure = analyzeJavaCodeStructure(code);
  assert.equal(structure.loopDepth, 2, 'Should detect nested loops of depth 2');
  assert.equal(structure.usesExtraCollections, false, 'Does not use extra collections');
  
  const flaw = structure.detectedFlaws.find(f => f.type === 'INITIALIZATION_EDGE_CASE');
  assert.ok(flaw, 'Should detect max = 0 initialization flaw');
});

test('analyzeJavaCodeStructure detects binary search integer overflow formula', () => {
  const code = `
  public int search(int[] nums, int target) {
      int left = 0;
      int right = nums.length - 1;
      while (left <= right) {
          int mid = (left + right) / 2;
          if (nums[mid] == target) return mid;
      }
      return -1;
  }`;

  const structure = analyzeJavaCodeStructure(code);
  const overflowFlaw = structure.detectedFlaws.find(f => f.type === 'INTEGER_OVERFLOW');
  assert.ok(overflowFlaw, 'Should detect integer overflow in (left + right) / 2');
  assert.equal(overflowFlaw?.line, 6, 'Should identify correct line number');
  assert.ok(overflowFlaw?.technicalCause.includes('Overflow'));
});

test('generateHeuristicMentorAnalysis satisfies exact format for Maximum Subarray', () => {
  const maxSubarrayPreset = DSA_PROBLEM_PRESETS[0];
  const analysis = generateHeuristicMentorAnalysis({
    problemTitle: maxSubarrayPreset.title,
    problemDescription: maxSubarrayPreset.description,
    javaCode: maxSubarrayPreset.initialFailingCode,
    failingTestCase: maxSubarrayPreset.failingTestCase
  });

  assert.equal(analysis.timeComplexity, 'O(n^2)');
  assert.equal(analysis.spaceComplexity, 'O(1)');
  assert.ok(analysis.errorAnalysis.includes('Line 3'));
  assert.ok(analysis.formattedOutput.includes('**Error Analysis:**'));
  assert.ok(analysis.formattedOutput.includes('**Hint:**'));
  assert.ok(!analysis.formattedOutput.includes('class Solution'));
  assert.ok(analysis.guidingQuestion.trim().endsWith('?'));

  const validation = validateMentorResponse(analysis, maxSubarrayPreset.initialFailingCode);
  assert.equal(validation.isValid, true, `Validation failed: ${validation.violations.join(', ')}`);
});

test('generateHeuristicMentorAnalysis matches Example 1: containsString', () => {
  const containsStringCode = `public boolean containsString(String[] arr, String target) {
    for (String s : arr) {
        if (s == target) { return true; }
    }
    return false;
}`;

  const analysis = generateHeuristicMentorAnalysis({
    problemTitle: 'Contains String',
    problemDescription: 'Check if array contains target string',
    javaCode: containsStringCode
  });

  assert.ok(analysis.errorAnalysis.includes('Line 3'));
  assert.ok(analysis.errorAnalysis.includes('==') && analysis.errorAnalysis.includes('memory addresses'));
  assert.ok(analysis.hint.includes('memory addresses'));
  assert.ok(analysis.formattedOutput.includes('**Error Analysis:**'));
  assert.ok(analysis.formattedOutput.includes('**Hint:**'));

  const validation = validateMentorResponse(analysis, containsStringCode);
  assert.equal(validation.isValid, true, `Validation failed: ${validation.violations.join(', ')}`);
});

test('generateHeuristicMentorAnalysis matches Example 2: findAverage', () => {
  const findAverageCode = `public double findAverage(int[] arr) {
    int sum = 0;
    for (int num : arr) { sum += num; }
    return sum / arr.length;
}`;

  const analysis = generateHeuristicMentorAnalysis({
    problemTitle: 'Find Average',
    problemDescription: 'Calculate average as double',
    javaCode: findAverageCode
  });

  assert.ok(analysis.errorAnalysis.includes('Line 4'));
  assert.ok(analysis.errorAnalysis.includes('truncated integer'));
  assert.ok(analysis.hint.includes('double'));
  assert.ok(analysis.formattedOutput.includes('**Error Analysis:**'));
  assert.ok(analysis.formattedOutput.includes('**Hint:**'));

  const validation = validateMentorResponse(analysis, findAverageCode);
  assert.equal(validation.isValid, true, `Validation failed: ${validation.violations.join(', ')}`);
});

test('validateMentorResponse rejects generic templates about state update operations and loop invariants', () => {
  const analysisWithStateUpdate = {
    errorAnalysis: 'Line 2: Review your state update operations.',
    hint: 'Look at line 2 and review your state update operations.',
    guidingQuestion: 'What changes?',
    formattedOutput: '**Error Analysis:** Line 2: Review your state update operations.\n\n**Hint:** Check it?',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    isOptimal: false,
    identifiedFlaw: 'Generic',
    edgeCaseVulnerabilities: []
  };

  const validation1 = validateMentorResponse(analysisWithStateUpdate, 'int x = 5;');
  assert.equal(validation1.isValid, false);
  assert.ok(validation1.violations.some(v => v.includes('state update operations')));

  const analysisWithLoopInvariant = {
    errorAnalysis: 'Line 3: Maintain loop invariants.',
    hint: 'Look at line 3 and observe loop invariants.',
    guidingQuestion: 'What is true?',
    formattedOutput: '**Error Analysis:** Line 3: Maintain loop invariants.\n\n**Hint:** Observe it?',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    isOptimal: false,
    identifiedFlaw: 'Generic',
    edgeCaseVulnerabilities: []
  };

  const validation2 = validateMentorResponse(analysisWithLoopInvariant, 'int y = 10;');
  assert.equal(validation2.isValid, false);
  assert.ok(validation2.violations.some(v => v.includes('loop invariants')));
});
