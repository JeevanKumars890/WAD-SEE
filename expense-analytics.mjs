export function calculateSummary(expenses) {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = Object.entries(
    expenses.reduce((groups, expense) => {
      groups[expense.category] = (groups[expense.category] ?? 0) + Number(expense.amount);
      return groups;
    }, {})
  )
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total === 0 ? 0 : Number(((amount / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  return {
    total: Number(total.toFixed(2)),
    average: expenses.length ? Number((total / expenses.length).toFixed(2)) : 0,
    byCategory,
  };
}

export function calculateMonthlyTrend(expenses) {
  const byMonth = new Map();

  for (const expense of expenses) {
    const date = new Date(`${expense.date}T00:00:00`);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(date);

    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + Number(expense.amount));
    byMonth.set(`${monthKey}-label`, monthLabel);
  }

  return [...byMonth.entries()]
    .filter(([key]) => !key.endsWith('-label'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, total]) => ({
      month: byMonth.get(`${monthKey}-label`),
      total: Number(total.toFixed(2)),
    }));
}

export function getTopCategories(expenses, limit = 5) {
  return calculateSummary(expenses).byCategory
    .slice(0, limit)
    .map(({ category, amount }) => ({ category, amount: Number(amount.toFixed(2)) }));
}

export function filterExpenses(expenses, filters = {}) {
  const { category, startDate, endDate } = filters;

  return expenses.filter((expense) => {
    const matchesCategory = !category || expense.category === category;
    const matchesStartDate = !startDate || expense.date >= startDate;
    const matchesEndDate = !endDate || expense.date <= endDate;
    return matchesCategory && matchesStartDate && matchesEndDate;
  });
}

export function addExpenseRecord(expenses, input) {
  const date = String(input.date ?? '').trim();
  const category = String(input.category ?? '').trim();
  const description = String(input.description ?? '').trim();
  const amount = Number(input.amount);

  if (!date) throw new Error('Expense date is required.');
  if (!category) throw new Error('Expense category is required.');
  if (!description) throw new Error('Expense description is required.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Expense amount must be greater than zero.');

  const record = {
    id: expenses.reduce((largestId, expense) => Math.max(largestId, Number(expense.id) || 0), 0) + 1,
    date,
    category,
    description,
    amount: Number(amount.toFixed(2)),
  };

  expenses.push(record);
  return record;
}
