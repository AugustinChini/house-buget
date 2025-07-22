import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseSummary,
  MonthlyExpenseSummary,
} from "../models/Expense";
import { indexedDBService } from "../dao/indexedDBService";
class ExpenseService {
  // Get all expenses
  async getAllExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    const allExpenses = await indexedDBService.getAllExpenses();
    let filteredExpenses = [...allExpenses];

    if (filters) {
      if (filters.categoryId) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.categoryId === filters.categoryId
        );
      }

      if (filters.type) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.type === filters.type
        );
      }

      if (filters.dateFrom) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.date >= filters.dateFrom!
        );
      }

      if (filters.dateTo) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.date <= filters.dateTo!
        );
      }

      if (filters.minAmount) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.amount >= filters.minAmount!
        );
      }

      if (filters.maxAmount) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.amount <= filters.maxAmount!
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredExpenses = filteredExpenses.filter(
          (exp) =>
            exp.title.toLowerCase().includes(searchLower) ||
            exp.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredExpenses = filteredExpenses.filter((exp) =>
          exp.tags?.some((tag: string) => filters.tags!.includes(tag))
        );
      }

      if (filters.isRecurring !== undefined) {
        filteredExpenses = filteredExpenses.filter(
          (exp) => exp.isRecurring === filters.isRecurring
        );
      }
    }

    return filteredExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Get expense by ID
  async getExpenseById(id: number): Promise<Expense | null> {
    return await indexedDBService.getExpenseById(id);
  }

  // Create new expense
  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    return await indexedDBService.createExpense(expenseData);
  }

  // Update expense
  async updateExpense(
    id: number,
    updateData: UpdateExpenseRequest
  ): Promise<Expense | null> {
    return await indexedDBService.updateExpense(id, updateData);
  }

  // Delete expense
  async deleteExpense(id: number): Promise<boolean> {
    return await indexedDBService.deleteExpense(id);
  }

  // Get expense summary
  async getExpenseSummary(filters?: ExpenseFilters): Promise<ExpenseSummary> {
    const expenses = await this.getAllExpenses(filters);

    const expensesOnly = expenses.filter((exp) => exp.type === "expense");
    const incomeOnly = expenses.filter((exp) => exp.type === "income");

    const totalExpenses = expensesOnly.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const totalIncome = incomeOnly.reduce((sum, exp) => sum + exp.amount, 0);
    const netAmount = totalIncome - totalExpenses;

    const averageExpense =
      expensesOnly.length > 0 ? totalExpenses / expensesOnly.length : 0;
    const averageIncome =
      incomeOnly.length > 0 ? totalIncome / incomeOnly.length : 0;

    return {
      totalExpenses,
      totalIncome,
      netAmount,
      expenseCount: expensesOnly.length,
      incomeCount: incomeOnly.length,
      averageExpense,
      averageIncome,
    };
  }

  // Get monthly expense summary
  async getMonthlyExpenseSummary(
    year: number,
    month: number
  ): Promise<MonthlyExpenseSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyExpenses = await this.getAllExpenses({
      dateFrom: startDate,
      dateTo: endDate,
    });

    const expensesOnly = monthlyExpenses.filter(
      (exp) => exp.type === "expense"
    );
    const incomeOnly = monthlyExpenses.filter((exp) => exp.type === "income");

    const totalExpenses = expensesOnly.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const totalIncome = incomeOnly.reduce((sum, exp) => sum + exp.amount, 0);
    const netAmount = totalIncome - totalExpenses;

    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    return {
      month: monthNames[month - 1],
      year,
      totalExpenses,
      totalIncome,
      netAmount,
      expenses: monthlyExpenses,
    };
  }

  // Get expenses by category
  async getExpensesByCategory(
    categoryId: number,
    filters?: ExpenseFilters
  ): Promise<Expense[]> {
    return this.getAllExpenses({
      ...filters,
      categoryId,
    });
  }

  // Get recurring expenses
  async getRecurringExpenses(): Promise<Expense[]> {
    return this.getAllExpenses({ isRecurring: true });
  }

  // Get expenses for a specific date range
  async getExpensesForDateRange(
    startDate: Date,
    endDate: Date,
    filters?: ExpenseFilters
  ): Promise<Expense[]> {
    return this.getAllExpenses({
      ...filters,
      dateFrom: startDate,
      dateTo: endDate,
    });
  }

  // Get top spending categories
  async getTopSpendingCategories(limit: number = 5): Promise<
    Array<{
      categoryId: number;
      categoryName: string;
      totalSpent: number;
      expenseCount: number;
    }>
  > {
    const expenses = await this.getAllExpenses({ type: "expense" });

    const categoryTotals = expenses.reduce(
      (acc, exp) => {
        const key = exp.categoryId;
        if (!acc[key]) {
          acc[key] = {
            categoryId: exp.categoryId,
            categoryName: exp.categoryName || "Unknown",
            totalSpent: 0,
            expenseCount: 0,
          };
        }
        acc[key].totalSpent += exp.amount;
        acc[key].expenseCount += 1;
        return acc;
      },
      {} as Record<
        number,
        {
          categoryId: number;
          categoryName: string;
          totalSpent: number;
          expenseCount: number;
        }
      >
    );

    return Object.values(categoryTotals)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }
}

export const expenseService = new ExpenseService();
