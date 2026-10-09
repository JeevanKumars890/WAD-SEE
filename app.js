import {
  addExpenseRecord,
  calculateSummary,
  calculateMonthlyTrend,
  filterExpenses,
} from './expense-analytics.js';

const STORAGE_KEY = 'spendsense-expenses';

const expenses = loadExpenses();

const categories = [
  'Food',
  'Housing',
  'Transport',
  'Utilities',
  'Healthcare',
  'Education',
  'Shopping',
  'Entertainment',
  'Travel',
  'Other',
];

const categoryColors = {
  Housing: '#5b4bff',
  Food: '#2c8cff',
  Transport: '#17b26a',
  Entertainment: '#f79009',
  Utilities: '#ef4444',
  Shopping: '#a855f7',
  Healthcare: '#14b8a6',
  Education: '#f97316',
  Travel: '#ec4899',
  Other: '#94a3b8',
};

const elements = {
  totalSpent: document.querySelector('#totalSpent'),
  averageExpense: document.querySelector('#averageExpense'),
  largestCategory: document.querySelector('#largestCategory'),
  categoryFilter: document.querySelector('#categoryFilter'),
  startDate: document.querySelector('#startDate'),
  endDate: document.querySelector('#endDate'),
  resetFilters: document.querySelector('#resetFilters'),
  categoryList: document.querySelector('#categoryList'),
  transactionTable: document.querySelector('#transactionTable'),
  monthlyTarget: document.querySelector('#monthlyTarget'),
  targetProgress: document.querySelector('#targetProgress'),
  targetStatus: document.querySelector('#targetStatus'),
  openExpenseModal: document.querySelector('#openExpenseModal'),
  closeExpenseModal: document.querySelector('#closeExpenseModal'),
  cancelExpense: document.querySelector('#cancelExpense'),
  expenseModal: document.querySelector('#expenseModal'),
  expenseForm: document.querySelector('#expenseForm'),
  expenseDate: document.querySelector('#expenseDate'),
  expenseCategory: document.querySelector('#expenseCategory'),
  expenseDescription: document.querySelector('#expenseDescription'),
  expenseAmount: document.querySelector('#expenseAmount'),
  expenseError: document.querySelector('#expenseError'),
};

function loadExpenses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return [];

  const parsed = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error('Saved expenses data is invalid.');
  return parsed;
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function getFilteredExpenses() {
  return filterExpenses(expenses, {
    category: elements.categoryFilter.value || undefined,
    startDate: elements.startDate.value || undefined,
    endDate: elements.endDate.value || undefined,
  });
}

function setSummary(filtered) {
  const summary = calculateSummary(filtered);
  const [largestCategory] = summary.byCategory;

  elements.totalSpent.textContent = formatCurrency(summary.total);
  elements.averageExpense.textContent = formatCurrency(summary.average);
  elements.largestCategory.textContent = largestCategory ? largestCategory.category : '—';

  const monthlyTarget = 20000;
  const spentThisMonth = calculateMonthlyTrend(filtered).at(-1)?.total ?? 0;
  const remaining = Math.max(monthlyTarget - spentThisMonth, 0);
  const percent = Math.min((spentThisMonth / monthlyTarget) * 100, 100);

  elements.monthlyTarget.textContent = formatCurrency(monthlyTarget);
  elements.targetProgress.style.width = `${percent}%`;
  elements.targetStatus.textContent = `${formatCurrency(remaining)} left`;
}

function openExpenseDialog() {
  elements.expenseForm.reset();
  elements.expenseError.textContent = '';
  elements.expenseModal.classList.remove('hidden');
  elements.expenseDate.value = new Date().toISOString().slice(0, 10);
  elements.expenseDate.focus();
}

function closeExpenseDialog() {
  elements.expenseModal.classList.add('hidden');
}

function renderCategoryBreakdown(filtered) {
  const summary = calculateSummary(filtered);
  const maxAmount = Math.max(...summary.byCategory.map((item) => item.amount), 1);

  elements.categoryList.innerHTML = summary.byCategory.length
    ? summary.byCategory.map(({ category, amount, percentage }) => `
        <div class="category-row">
          <div class="category-meta">
            <span class="category-name"><span class="color-dot" style="background:${categoryColors[category] ?? '#94a3b8'}"></span>${category}</span>
            <span class="category-value">${formatCurrency(amount)}</span>
          </div>
          <div class="category-bar"><span style="width:${Math.max((amount / maxAmount) * 100, 8)}%; background:${categoryColors[category] ?? '#94a3b8'}"></span></div>
          <span class="category-value" style="font-size:12px;color:var(--text-soft)">${percentage}% of total</span>
        </div>
      `).join('')
    : '<div class="empty-state">No expenses match your filters.</div>';
}

function renderTransactions(filtered) {
  elements.transactionTable.innerHTML = filtered.length
    ? filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).map((expense) => `
        <tr>
          <td>${expense.description}</td>
          <td><span class="tag">${expense.category}</span></td>
          <td>${new Date(`${expense.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td class="money">${formatCurrency(expense.amount)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" class="empty-state">No transactions yet. Add your first expense.</td></tr>';
}

function updateDashboard() {
  const filtered = getFilteredExpenses();
  setSummary(filtered);
  renderCategoryBreakdown(filtered);
  renderTransactions(filtered);
}

for (const control of [elements.categoryFilter, elements.startDate, elements.endDate]) {
  control.addEventListener('change', updateDashboard);
}

elements.resetFilters.addEventListener('click', () => {
  elements.categoryFilter.value = '';
  elements.startDate.value = '';
  elements.endDate.value = '';
  updateDashboard();
});

function populateCategories() {
  const uniqueCategories = [...new Set([...categories, ...expenses.map((expense) => expense.category)])].sort();
  const options = uniqueCategories.map((category) => `<option value="${category}">${category}</option>`).join('');
  elements.categoryFilter.innerHTML = '<option value="">All categories</option>' + options;
  elements.expenseCategory.innerHTML = '<option value="">Select category</option>' + options;
}

elements.openExpenseModal.addEventListener('click', openExpenseDialog);
elements.closeExpenseModal.addEventListener('click', closeExpenseDialog);
elements.cancelExpense.addEventListener('click', closeExpenseDialog);
elements.expenseModal.addEventListener('click', (event) => {
  if (event.target.dataset.closeModal === 'true') closeExpenseDialog();
});

elements.expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  elements.expenseError.textContent = '';

  try {
    addExpenseRecord(expenses, {
      date: elements.expenseDate.value,
      category: elements.expenseCategory.value,
      description: elements.expenseDescription.value,
      amount: Number(elements.expenseAmount.value),
    });

    saveExpenses();
    populateCategories();
    updateDashboard();
    closeExpenseDialog();
  } catch (error) {
    elements.expenseError.textContent = error.message;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !elements.expenseModal.classList.contains('hidden')) {
    closeExpenseDialog();
  }
});

populateCategories();
updateDashboard();
