/**
 * AlgoArena — Challenge Import Sample Generator
 * Generates 2 sample Excel (.xlsx) challenge files for testing the import feature.
 *
 * Usage:
 *   node src/challenge-import-samples/generate-excel-samples.js
 *
 * Output:
 *   src/challenge-import-samples/binary-search-easy.xlsx
 *   src/challenge-import-samples/merge-intervals-hard.xlsx
 *
 * These files are for DEVELOPMENT/TESTING only.
 * Do NOT expose via public API or auto-load in production.
 */

const ExcelJS = require('exceljs');
const path = require('path');

const OUTPUT_DIR = __dirname;

// ── Challenge 1: Binary Search (Easy) ─────────────────────────────────────────
const binarySearchChallenge = {
    title: 'Binary Search',
    description: 'Given a sorted array of integers nums and a target value, return the index of target in the array. If target is not found, return -1. You must write an algorithm with O(log n) runtime complexity.',
    difficulty: 'Easy',
    topic: 'Arrays',
    xpReward: 50,
    estimatedTime: 15,
    constraints: JSON.stringify([
        '1 <= nums.length <= 10^4',
        '-10^4 < nums[i], target < 10^4',
        'All the integers in nums are unique',
        'nums is sorted in ascending order',
    ]),
    examples: JSON.stringify([
        { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
        { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
    ]),
    testCases: JSON.stringify([
        { input: '[-1,0,3,5,9,12] 9', output: '4' },
        { input: '[-1,0,3,5,9,12] 2', output: '-1' },
        { input: '[5] 5', output: '0' },
        { input: '[1,2,3,4,5] 3', output: '2' },
        { input: '[1,3,5,7,9] 7', output: '3' },
    ]),
    hints: JSON.stringify([
        'Initialize left = 0 and right = nums.length - 1.',
        'Calculate mid = Math.floor((left + right) / 2) to avoid overflow.',
        'Narrow the search space by comparing nums[mid] to target.',
    ]),
    starterCode_javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your solution here\n}\n',
};

// ── Challenge 2: Merge Intervals (Hard) ───────────────────────────────────────
const mergeIntervalsChallenge = {
    title: 'Merge Overlapping Intervals',
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    difficulty: 'Hard',
    topic: 'Arrays',
    xpReward: 250,
    estimatedTime: 40,
    constraints: JSON.stringify([
        '1 <= intervals.length <= 10^4',
        'intervals[i].length == 2',
        '0 <= starti <= endi <= 10^4',
    ]),
    examples: JSON.stringify([
        { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].' },
        { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping.' },
    ]),
    testCases: JSON.stringify([
        { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
        { input: '[[1,4],[4,5]]', output: '[[1,5]]' },
        { input: '[[1,4],[2,3]]', output: '[[1,4]]' },
        { input: '[[1,2],[3,4],[5,6]]', output: '[[1,2],[3,4],[5,6]]' },
        { input: '[[1,10],[2,3],[4,5],[6,7]]', output: '[[1,10]]' },
    ]),
    hints: JSON.stringify([
        'Sort the intervals by their start time.',
        'Iterate and check if the current interval overlaps with the last merged interval.',
        'Two intervals [a,b] and [c,d] overlap if c <= b.',
    ]),
    starterCode_javascript: '/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  // Write your solution here\n}\n',
};

// ── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
    { header: 'title', key: 'title', width: 30 },
    { header: 'description', key: 'description', width: 60 },
    { header: 'difficulty', key: 'difficulty', width: 12 },
    { header: 'topic', key: 'topic', width: 18 },
    { header: 'xpReward', key: 'xpReward', width: 12 },
    { header: 'estimatedTime', key: 'estimatedTime', width: 16 },
    { header: 'constraints', key: 'constraints', width: 60 },
    { header: 'examples', key: 'examples', width: 80 },
    { header: 'testCases', key: 'testCases', width: 80 },
    { header: 'hints', key: 'hints', width: 60 },
    { header: 'starterCode_javascript', key: 'starterCode_javascript', width: 80 },
];

async function generateExcel(challenge, filename) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Challenge');

    ws.columns = COLUMNS;

    // Style header row
    ws.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FF22D3EE' }, size: 11 };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E293B' } } };
    });

    ws.addRow(challenge);

    // Style data row
    ws.getRow(2).eachCell(cell => {
        cell.alignment = { wrapText: true, vertical: 'top' };
        cell.font = { size: 10 };
    });

    const filepath = path.join(OUTPUT_DIR, filename);
    await wb.xlsx.writeFile(filepath);
    console.log(`✅ Generated: ${filepath}`);
}

async function main() {
    console.log('🚀 Generating Excel challenge sample files...\n');
    await generateExcel(binarySearchChallenge, 'binary-search-easy.xlsx');
    await generateExcel(mergeIntervalsChallenge, 'merge-intervals-hard.xlsx');
    console.log('\n✅ Done! Files saved in src/challenge-import-samples/');
}

main().catch(err => {
    console.error('❌ Failed to generate files:', err.message);
    process.exit(1);
});
