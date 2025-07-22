import type {
  Category,
  CategoryWithSpending,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryFilters,
} from "../models/Category";
import type { Expense } from "../models/Expense";
import { indexedDBService } from "../dao/indexedDBService";

class CategoryService {
  // Get all categories
  async getAllCategories(filters?: CategoryFilters): Promise<Category[]> {
    const allCategories = await indexedDBService.getAllCategories();
    let filteredCategories = [...allCategories];

    if (filters) {
      if (filters.isActive !== undefined) {
        filteredCategories = filteredCategories.filter(
          (cat) => cat.isActive === filters.isActive
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes(searchLower) ||
            cat.description?.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredCategories;
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category | null> {
    return await indexedDBService.getCategoryById(id);
  }

  // Create new category
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    return await indexedDBService.createCategory({
      ...categoryData,
      isActive: true,
    });
  }

  // Update category
  async updateCategory(
    id: number,
    updateData: UpdateCategoryRequest
  ): Promise<Category | null> {
    return await indexedDBService.updateCategory(id, updateData);
  }

  // Delete category (hard delete)
  async deleteCategory(id: number): Promise<boolean> {
    return await indexedDBService.deleteCategory(id);
  }

  // Get categories with spending information
  async getCategoriesWithSpending(
    expenses: Expense[]
  ): Promise<CategoryWithSpending[]> {
    const categories = await this.getAllCategories({ isActive: true });

    return categories.map((category) => {
      const categoryExpenses = expenses.filter(
        (exp) => exp.categoryId === category.id && exp.type === "expense"
      );

      const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = category.budget - spent;
      const percentageUsed = (spent / category.budget) * 100;
      const isOverBudget = spent > category.budget;
      const isCloseToBudget = percentageUsed >= 80 && percentageUsed <= 100;

      return {
        ...category,
        spent,
        remaining,
        percentageUsed,
        isOverBudget,
        isCloseToBudget,
      };
    });
  }

  // Get category spending for a specific period
  async getCategorySpendingForPeriod(
    categoryId: number,
    startDate: Date,
    endDate: Date,
    expenses: Expense[]
  ): Promise<number> {
    const categoryExpenses = expenses.filter(
      (exp) =>
        exp.categoryId === categoryId &&
        exp.type === "expense" &&
        exp.date >= startDate &&
        exp.date <= endDate
    );

    return categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  // Get budget utilization summary
  async getBudgetUtilizationSummary(expenses: Expense[]): Promise<{
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    utilizationPercentage: number;
    overBudgetCategories: number;
  }> {
    const categoriesWithSpending = await this.getCategoriesWithSpending(
      expenses
    );

    const totalBudget = categoriesWithSpending.reduce(
      (sum, cat) => sum + cat.budget,
      0
    );
    const totalSpent = categoriesWithSpending.reduce(
      (sum, cat) => sum + cat.spent,
      0
    );
    const totalRemaining = totalBudget - totalSpent;
    const utilizationPercentage = (totalSpent / totalBudget) * 100;
    const overBudgetCategories = categoriesWithSpending.filter(
      (cat) => cat.isOverBudget
    ).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationPercentage,
      overBudgetCategories,
    };
  }
}

export const categoryService = new CategoryService();
