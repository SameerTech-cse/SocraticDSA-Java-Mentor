/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DsaProblemPreset } from './types';

export const DSA_PROBLEM_PRESETS: DsaProblemPreset[] = [
  {
    id: 'max-subarray',
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    difficulty: 'Medium',
    category: 'Arrays & Dynamic Programming',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    initialFailingCode: `public class Solution {
    public int maxSubArray(int[] nums) {
        int max = 0;
        for (int i = 0; i < nums.length; i++) {
            int sum = 0;
            for (int j = i; j < nums.length; j++) {
                sum += nums[j];
                if (sum > max) {
                    max = sum;
                }
            }
        }
        return max;
    }
}`,
    failingTestCase: 'Input: nums = [-1]\nExpected: -1\nActual output: 0',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'All negative values: [-5, -2, -10]',
      'Single negative element: [-1]',
      'Mixed values: [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
      'All positive values: [1, 2, 3]'
    ]
  },
  {
    id: 'two-sum-sorted',
    title: 'Two Sum II - Input Array Is Sorted',
    difficulty: 'Medium',
    category: 'Two Pointers',
    description: 'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return indices [index1, index2] (1-indexed). You must use O(1) additional space.',
    initialFailingCode: `public class Solution {
    public int[] twoSum(int[] numbers, int target) {
        // Brute force nested loop approach
        for (int i = 0; i < numbers.length; i++) {
            for (int j = i + 1; j < numbers.length; j++) {
                if (numbers[i] + numbers[j] == target) {
                    return new int[]{i + 1, j + 1};
                }
            }
        }
        return new int[]{-1, -1};
    }
}`,
    failingTestCase: 'Time Limit Exceeded on large sorted input array (n = 100,000)',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Target at extreme ends: numbers = [2, 7, 11, 15], target = 17',
      'Negative values: numbers = [-3, 3, 4, 90], target = 0',
      'Array with duplicates: numbers = [0, 0, 3, 4], target = 0'
    ]
  },
  {
    id: 'binary-search-overflow',
    title: 'Binary Search (Integer Overflow Bug)',
    difficulty: 'Easy',
    category: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index; otherwise, return -1.',
    initialFailingCode: `public class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;

        while (left <= right) {
            // Calculate midpoint
            int mid = (left + right) / 2;

            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}`,
    failingTestCase: 'Runtime Error / Integer Overflow when left and right are large (left + right > Integer.MAX_VALUE)',
    optimalTime: 'O(log n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Huge array index range: left + right exceeds 2^31 - 1',
      'Target not in array: returns -1',
      'Target at boundaries: first or last element',
      'Single element array: nums = [5], target = 5'
    ]
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Strings & Two Pointers',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.',
    initialFailingCode: `public class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;

        while (left < right) {
            char l = Character.toLowerCase(s.charAt(left));
            char r = Character.toLowerCase(s.charAt(right));

            if (!Character.isLetterOrDigit(l)) {
                left++;
            }
            if (!Character.isLetterOrDigit(r)) {
                right--;
            }
            if (l != r) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}`,
    failingTestCase: 'Input: s = "A man, a plan, a canal: Panama"\nExpected: true\nActual output: false (Fails because both left and right continue advancing when non-alphanumeric chars are found without re-checking)',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Consecutive punctuation: ".,"',
      'Single non-alphanumeric: " "',
      'Mixed case with numbers: "0P"',
      'True palindrome with commas: "A man, a plan, a canal: Panama"'
    ]
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    initialFailingCode: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int val) { this.val = val; }
 * }
 */
public class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            // Reversing pointer
            curr.next = prev;
            prev = curr;
            curr = curr.next; // Potential bug: curr.next was already overwritten!
        }
        return prev;
    }
}`,
    failingTestCase: 'Infinite loop / NullPointerException: curr loops on itself because curr.next was overwritten before advancing curr.',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Empty list: head = null',
      'Single node: head = [1]',
      'Two nodes: [1, 2] -> [2, 1]',
      'Multiple nodes: [1, 2, 3, 4, 5]'
    ]
  },
  {
    id: 'contains-string',
    title: 'Contains String (Reference Equality Bug)',
    difficulty: 'Easy',
    category: 'Strings & Object Equality',
    description: 'Given an array of Strings and a target String, return true if the array contains the target string, otherwise false.',
    initialFailingCode: `public class Solution {
    public boolean containsString(String[] arr, String target) {
        for (String s : arr) {
            if (s == target) { return true; }
        }
        return false;
    }
}`,
    failingTestCase: 'Input: arr = ["hello", "world"], target = new String("hello")\nExpected: true\nActual output: false',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Target constructed with new String("hello")',
      'Target is null: arr = ["test", null], target = null',
      'Empty array: arr = [], target = "a"',
      'Matching interned vs heap strings'
    ]
  },
  {
    id: 'find-average',
    title: 'Find Average (Integer Division Truncation)',
    difficulty: 'Easy',
    category: 'Math & Type Casting',
    description: 'Calculate and return the average of all integers in the array as a double precision floating point number.',
    initialFailingCode: `public class Solution {
    public double findAverage(int[] arr) {
        int sum = 0;
        for (int num : arr) { sum += num; }
        return sum / arr.length;
    }
}`,
    failingTestCase: 'Input: arr = [1, 2]\nExpected: 1.5\nActual output: 1.0 (Truncated integer division)',
    optimalTime: 'O(n)',
    optimalSpace: 'O(1)',
    edgeCasesToTest: [
      'Fractional result: arr = [1, 2] -> 1.5',
      'Single element: arr = [5] -> 5.0',
      'Odd sum / even length: arr = [3, 4] -> 3.5'
    ]
  }
];

