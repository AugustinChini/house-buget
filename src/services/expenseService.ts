import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseSummary,
  MonthlyExpenseSummary,
} from "../models/Expense";
import { apiService } from "./apiService";
import { ensureDate } from "../utils/dateUtils";

class ExpenseService {
  // Get all expenses with optional filtering
  async getAllExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    const expenses = await apiService.getAllExpenses(filters);
    // Ensure all dates are properly converted to Date objects
    return expenses.map((expense) => ({
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    }));
  }

  // Get expense by ID
  async getExpenseById(id: number): Promise<Expense | null> {
    const expense = await apiService.getExpenseById(id);
    if (!expense) return null;

    return {
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    };
  }

  // Create new expense
  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    const expense = await apiService.createExpense(expenseData);
    return {
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    };
  }

  // Update expense
  async updateExpense(
    id: number,
    updateData: UpdateExpenseRequest
  ): Promise<Expense | null> {
    const expense = await apiService.updateExpense(id, updateData);
    if (!expense) return null;

    return {
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    };
  }

  // Delete expense
  async deleteExpense(id: number): Promise<boolean> {
    return await apiService.deleteExpense(id);
  }

  // Get expenses by type
  async getExpensesByType(type: "expense" | "income"): Promise<Expense[]> {
    const expenses = await apiService.getExpensesByType(type);
    return expenses.map((expense) => ({
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    }));
  }

  // Get expenses by month
  async getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    const expenses = await apiService.getExpensesByMonth(year, month);
    return expenses.map((expense) => ({
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    }));
  }

  // Get expenses for a specific date range
  async getExpensesForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Expense[]> {
    const expenses = await apiService.getAllExpenses({
      dateFrom: startDate,
      dateTo: endDate,
    });
    return expenses.map((expense) => ({
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    }));
  }

  // Get expense summary
  async getExpenseSummary(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ExpenseSummary> {
    return await apiService.getExpenseSummary(filters);
  }

  // Get monthly expense summary
  async getMonthlyExpenseSummary(
    year: number,
    month: number
  ): Promise<MonthlyExpenseSummary> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const expenses = await this.getExpensesForDateRange(startDate, endDate);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      month: new Date(year, month - 1).toLocaleDateString("fr-FR", {
        month: "long",
      }),
      year,
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      expenses,
    };
  }

  // Get recurring expenses
  async getRecurringExpenses(): Promise<Expense[]> {
    const expenses = await apiService.getRecurringExpenses();
    return expenses.map((expense) => ({
      ...expense,
      date: ensureDate(expense.date),
      createdAt: ensureDate(expense.createdAt),
      updatedAt: ensureDate(expense.updatedAt),
    }));
  }
}

export const expenseService = new ExpenseService();
