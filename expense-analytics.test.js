import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addExpenseRecord,
  calculateSummary,
  calculateMonthlyTrend,
  getTopCategories,
  filterExpenses,
} from './expense-analytics.js';

const expenses = [
  { id: 1, date: '2026-01-05', category: 'Food', amount: 45.5 },
  { id: 2, date: '2026-01-18', category: 'Transport', amount: 30 },
  { id: 3, date: '2026-02-07', category: 'Food', amount: 60 },
  { id: 4, date: '2026-02-15', category: 'Housing', amount: 1200 },
  { id: 5, date: '2026-03-10', category: 'Entertainment', amount: 75 },
];

test('calculates totals and spending share', () => {
  const summary = calculateSummary(expenses);

  assert.equal(summary.total, 1410.5);
  assert.equal(summary.average, 282.1);
  assert.deepEqual(summary.byCategory, [
    { category: 'Housing', amount: 1200, percentage: 85.1 },
    { category: 'Food', amount: 105.5, percentage: 7.5 },
    { category: 'Entertainment', amount: 75, percentage: 5.3 },
    { category: 'Transport', amount: 30, percentage: 2.1 },
  ]);
});

test('calculates monthly totals in chronological order', () => {
  assert.deepEqual(calculateMonthlyTrend(expenses), [
    { month: 'Jan 2026', total: 75.5 },
    { month: 'Feb 2026', total: 1260 },
    { month: 'Mar 2026', total: 75 },
  ]);
});

test('selects the highest spending categories', () => {
  assert.deepEqual(getTopCategories(expenses, 2), [
    { category: 'Housing', amount: 1200 },
    { category: 'Food', amount: 105.5 },
  ]);
});

test('filters expenses by category and date range', () => {
  const filtered = filterExpenses(expenses, {
    category: 'Food',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  });

  assert.deepEqual(filtered, [expenses[2]]);
});

test('adds a valid expense record and rejects invalid input', () => {
  const record = addExpenseRecord(expenses, {
    date: '2026-07-12',
    category: 'Food',
    description: 'Groceries',
    amount: 125.5,
  });

  assert.equal(record.id, 6);
  assert.equal(record.amount, 125.5);
  assert.equal(record.description, 'Groceries');
  assert.throws(() => addExpenseRecord(expenses, {
    date: '',
    category: 'Food',
    description: 'Missing date',
    amount: 25,
  }), /date/i);
  assert.throws(() => addExpenseRecord(expenses, {
    date: '2026-07-12',
    category: '',
    description: 'Missing category',
    amount: 25,
  }), /category/i);
  assert.throws(() => addExpenseRecord(expenses, {
    date: '2026-07-12',
    category: 'Food',
    description: 'Invalid amount',
    amount: 0,
  }), /amount/i);
});
