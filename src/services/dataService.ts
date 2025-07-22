import { indexedDBService } from "../dao/indexedDBService";
import type { Category } from "../models/Category";
import type { Expense, CreateExpenseRequest, UpdateExpenseRequest } from "../models/Expense";

class DataService {
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await indexedDBService.getAllCategories();
  }

  async getCategoryById(id: number): Promise<Category | null> {
    return await indexedDBService.getCategoryById(id);
  }

  async createCategory(categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    return await indexedDBService.createCategory(categoryData);
  }

  async updateCategory(id: number, updateData: Partial<Category>): Promise<Category | null> {
    return await indexedDBService.updateCategory(id, updateData);
  }

  async deleteCategory(id: number): Promise<boolean> {
    return await indexedDBService.deleteCategory(id);
  }

  // Expense operations
  async getAllExpenses(): Promise<Expense[]> {
    return await indexedDBService.getAllExpenses();
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    return await indexedDBService.getExpenseById(id);
  }

  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    return await indexedDBService.createExpense(expenseData);
  }

  async updateExpense(id: number, updateData: UpdateExpenseRequest): Promise<Expense | null> {
    return await indexedDBService.updateExpense(id, updateData);
  }

  async deleteExpense(id: number): Promise<boolean> {
    return await indexedDBService.deleteExpense(id);
  }

  // Database management operations
  async clearAllData(): Promise<void> {
    return await indexedDBService.clearAllData();
  }

  async exportData(): Promise<{
    version: string;
    exportDate: string;
    categories: Category[];
    expenses: Expense[];
  }> {
    const categories = await this.getAllCategories();
    const expenses = await this.getAllExpenses();

    return {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      categories,
      expenses,
    };
  }

  async importData(importData: {
    version: string;
    categories: Category[];
    expenses: Expense[];
  }): Promise<void> {
    // Clear existing data
    await this.clearAllData();

    // Create a mapping of old category IDs to new category IDs
    const categoryIdMapping: Record<number, number> = {};

    // Import categories and build the ID mapping
    for (const category of importData.categories) {
      // Create new category without id, createdAt, updatedAt
      const categoryData = {
        name: category.name,
        budget: category.budget,
        color: category.color,
        icon: category.icon,
        description: category.description,
        isActive: category.isActive,
      };
      const newCategory = await this.createCategory(categoryData);

      // Store the mapping from old ID to new ID
      categoryIdMapping[category.id] = newCategory.id;
    }

    // Import expenses with updated categoryId references
    for (const expense of importData.expenses) {
      // Get the new category ID from the mapping
      const newCategoryId = categoryIdMapping[expense.categoryId];

      if (!newCategoryId) {
        console.warn(
          `Category ID ${expense.categoryId} not found in mapping, skipping expense: ${expense.title}`
        );
        continue;
      }

      // Create new expense without id, createdAt, updatedAt
      const expenseData = {
        title: expense.title,
        amount: expense.amount,
        categoryId: newCategoryId, // Use the new category ID
        categoryName: expense.categoryName,
        description: expense.description,
        date: new Date(expense.date),
        type: expense.type,
        paymentMethod: expense.paymentMethod,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        recurringFrequency: expense.recurringFrequency,
      };
      await this.createExpense(expenseData);
    }
  }
}

export const dataService = new DataService(); 