import { expenseService } from "./expenseService";

class RecurringExpenseService {
  // Check if it's the first time opening the app in a new month
  async shouldShowRecurringModal(): Promise<boolean> {
    const lastShownKey = 'lastRecurringModalShown';
    const lastShown = localStorage.getItem(lastShownKey);
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // If we've already shown the modal this month, don't show it again
    if (lastShown === currentMonth) {
      return false;
    }
    
    // Check if there are any recurring expenses from last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    const lastMonthExpenses = await expenseService.getExpensesForDateRange(
      lastMonthStart,
      lastMonthEnd
    );
    
    const recurringExpenses = lastMonthExpenses.filter(exp => exp.isRecurring);
    
    return recurringExpenses.length > 0;
  }

  // Get recurring expenses from last month
  async getLastMonthRecurringExpenses(): Promise<any[]> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    const lastMonthExpenses = await expenseService.getExpensesForDateRange(
      lastMonthStart,
      lastMonthEnd
    );
    
    return lastMonthExpenses.filter(exp => exp.isRecurring);
  }

  // Create recurring expenses for current month
  async createRecurringExpensesForCurrentMonth(): Promise<void> {
    const recurringExpenses = await this.getLastMonthRecurringExpenses();
    const now = new Date();
    
    for (const expense of recurringExpenses) {
      // Create new expense with current month's date
      const newExpense = {
        title: expense.title,
        amount: expense.amount,
        categoryId: expense.categoryId,
        date: new Date(now.getFullYear(), now.getMonth(), expense.date.getDate()),
        type: expense.type,
        paymentMethod: expense.paymentMethod,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        recurringFrequency: expense.recurringFrequency,
      };
      
      await expenseService.createExpense(newExpense);
    }
  }

  // Mark that the modal has been shown for this month
  markModalAsShown(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    localStorage.setItem('lastRecurringModalShown', currentMonth);
  }
}

export const recurringExpenseService = new RecurringExpenseService(); 