import { apiService } from "./apiService";
import type { Category } from "../models/Category";
import type { Expense } from "../models/Expense";

class DataInitializationService {
  private isInitialized = false;

  async initializeData(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if data already exists
      const existingCategories = await apiService.getAllCategories();
      const existingExpenses = await apiService.getAllExpenses();

      if (existingCategories.length > 0 || existingExpenses.length > 0) {
        this.isInitialized = true;
        return; // Data already exists, don't initialize
      }

      // Initialize with default categories
      await this.initializeCategories();

      // Initialize with sample expenses
      await this.initializeExpenses();

      this.isInitialized = true;
      console.log("Database initialized with sample data");
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }

  private async initializeCategories(): Promise<void> {
    const defaultCategories: Omit<
      Category,
      "id" | "createdAt" | "updatedAt"
    >[] = [
      {
        name: "Alimentation",
        budget: 300,
        color: "#4caf50",
        icon: "restaurant",
        isActive: true,
        show:true
      },
      {
        name: "Divertissement",
        budget: 100,
        color: "#f44336",
        icon: "movie",
        isActive: true,
        show:true
      },
      {
        name: "Transport",
        budget: 100,
        color: "#ff9800",
        icon: "directions_car",
        isActive: true,
        show:true
      },
      {
        name: "Logement",
        budget: 750,
        color: "#2196f3",
        icon: "home",
        isActive: true,
        show:true
      },
      {
        name: "Santé",
        budget: 50,
        color: "#9c27b0",
        icon: "local_hospital",
        isActive: true,
        show:true
      },
      {
        name: "Shopping",
        budget: 150,
        color: "#e91e63",
        icon: "shopping_bag",
        isActive: true,
        show:true
      },
    ];

    for (const category of defaultCategories) {
      await apiService.createCategory(category);
    }
  }

  private async initializeExpenses(): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const sampleExpenses: Omit<Expense, "id" | "createdAt" | "updatedAt">[] = [
      {
        title: "Courses Carrefour",
        amount: 45.5,
        categoryId: 1,
        categoryName: "Alimentation",
        date: new Date(currentYear, currentMonth, 15),
        type: "expense",
        paymentMethod: "Carte bancaire",
        tags: ["courses", "alimentation"],
        isRecurring: false,
      },
      {
        title: "Cinéma - Dune",
        amount: 12.5,
        categoryId: 2,
        categoryName: "Divertissement",
        date: new Date(currentYear, currentMonth, 16),
        type: "expense",
        paymentMethod: "Espèces",
        tags: ["cinéma", "sortie"],
        isRecurring: false,
      },
      {
        title: "Essence",
        amount: 65.0,
        categoryId: 3,
        categoryName: "Transport",
        date: new Date(currentYear, currentMonth, 17),
        type: "expense",
        paymentMethod: "Carte bancaire",
        tags: ["essence", "voiture"],
        isRecurring: false,
      },
      {
        title: "Loyer",
        amount: 750.0,
        categoryId: 4,
        categoryName: "Logement",
        date: new Date(currentYear, currentMonth, 1),
        type: "expense",
        paymentMethod: "Virement",
        tags: ["loyer", "logement"],
        isRecurring: true,
        recurringFrequency: "monthly",
      },
      {
        title: "Salaire",
        amount: 3200.0,
        categoryId: 1,
        categoryName: "Alimentation",
        date: new Date(currentYear, currentMonth, 31),
        type: "income",
        paymentMethod: "Virement",
        tags: ["salaire", "revenu"],
        isRecurring: true,
        recurringFrequency: "monthly",
      },
      {
        title: "Restaurant Sushi",
        amount: 85.0,
        categoryId: 1,
        categoryName: "Alimentation",
        date: new Date(currentYear, currentMonth, 20),
        type: "expense",
        paymentMethod: "Carte bancaire",
        tags: ["restaurant", "sortie"],
        isRecurring: false,
      },
      {
        title: "Netflix",
        amount: 15.99,
        categoryId: 2,
        categoryName: "Divertissement",
        date: new Date(currentYear, currentMonth, 5),
        type: "expense",
        paymentMethod: "Carte bancaire",
        tags: ["streaming", "abonnement"],
        isRecurring: true,
        recurringFrequency: "monthly",
      },
      {
        title: "Électricité",
        amount: 120.0,
        categoryId: 4,
        categoryName: "Logement",
        date: new Date(currentYear, currentMonth, 10),
        type: "expense",
        paymentMethod: "Prélèvement",
        tags: ["électricité", "logement"],
        isRecurring: true,
        recurringFrequency: "monthly",
      },
    ];

    for (const expense of sampleExpenses) {
      await apiService.createExpense(expense);
    }
  }

  async resetData(): Promise<void> {
    try {
      // Note: The API doesn't have a clearAllData method, so we'll implement it by deleting all items
      const categories = await apiService.getAllCategories();
      const expenses = await apiService.getAllExpenses();
      
      // Delete all expenses first (due to foreign key constraints)
      for (const expense of expenses) {
        await apiService.deleteExpense(expense.id);
      }
      
      // Delete all categories
      for (const category of categories) {
        await apiService.deleteCategory(category.id);
      }
      
      this.isInitialized = false;
      await this.initializeData();
      console.log("Database reset and reinitialized");
    } catch (error) {
      console.error("Error resetting data:", error);
    }
  }
}

export const dataInitializationService = new DataInitializationService();
