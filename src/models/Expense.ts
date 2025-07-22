export interface Expense {
  id: number;
  title: string;
  amount: number;
  categoryId: number;
  categoryName?: string;
  date: Date;
  type: "expense" | "income";
  paymentMethod?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  title: string;
  amount: number;
  categoryId: number;
  date: Date;
  type: "expense" | "income";
  paymentMethod?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
}

export interface UpdateExpenseRequest {
  title?: string;
  amount?: number;
  categoryId?: number;
  date?: Date;
  type?: "expense" | "income";
  paymentMethod?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
}

export interface ExpenseFilters {
  categoryId?: number;
  type?: "expense" | "income";
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string[];
  isRecurring?: boolean;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  expenseCount: number;
  incomeCount: number;
  averageExpense: number;
  averageIncome: number;
}

export interface MonthlyExpenseSummary {
  month: string;
  year: number;
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  expenses: Expense[];
}
