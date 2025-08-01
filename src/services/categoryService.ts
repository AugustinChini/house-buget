import type {
  Category,
  CategoryWithSpending,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryFilters,
} from "../models/Category";
import type { Expense } from "../models/Expense";
import { apiService } from "./apiService";
import { ensureDate } from "../utils/dateUtils";

class CategoryService {
  // Get all categories
  async getAllCategories(filters?: CategoryFilters): Promise<Category[]> {
    const categories = await apiService.getAllCategories(filters);
    return categories.map(category => ({
      ...category,
      createdAt: ensureDate(category.createdAt),
      updatedAt: ensureDate(category.updatedAt)
    }));
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category | null> {
    const category = await apiService.getCategoryById(id);
    if (!category) return null;
    
    return {
      ...category,
      createdAt: ensureDate(category.createdAt),
      updatedAt: ensureDate(category.updatedAt)
    };
  }

  // Create new category
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    const category = await apiService.createCategory({
      ...categoryData,
      isActive: true,
      show: categoryData.show !== undefined ? categoryData.show : true,
    });
    return {
      ...category,
      createdAt: ensureDate(category.createdAt),
      updatedAt: ensureDate(category.updatedAt)
    };
  }

  // Update category
  async updateCategory(
    id: number,
    updateData: UpdateCategoryRequest
  ): Promise<Category | null> {
    const category = await apiService.updateCategory(id, updateData);
    if (!category) return null;
    
    return {
      ...category,
      createdAt: ensureDate(category.createdAt),
      updatedAt: ensureDate(category.updatedAt)
    };
  }

  // Delete category (hard delete)
  async deleteCategory(id: number): Promise<boolean> {
    return await apiService.deleteCategory(id);
  }

  // Get categories with spending information
  async getCategoriesWithSpending(
    expenses: Expense[]
  ): Promise<CategoryWithSpending[]> {
    const categories = await this.getAllCategories({ isActive: true, show: true });

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
