import type { Category } from "../models/Category";
import type { Expense } from "../models/Expense";

class IndexedDBService {
  private dbName = "BudgetAppDB";
  private version = 1;
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create categories store
        if (!db.objectStoreNames.contains("categories")) {
          const categoriesStore = db.createObjectStore("categories", {
            keyPath: "id",
            autoIncrement: true,
          });
          categoriesStore.createIndex("isActive", "isActive", {
            unique: false,
          });
          categoriesStore.createIndex("name", "name", { unique: false });
        }

        // Create expenses store
        if (!db.objectStoreNames.contains("expenses")) {
          const expensesStore = db.createObjectStore("expenses", {
            keyPath: "id",
            autoIncrement: true,
          });
          expensesStore.createIndex("categoryId", "categoryId", {
            unique: false,
          });
          expensesStore.createIndex("type", "type", { unique: false });
          expensesStore.createIndex("date", "date", { unique: false });
          expensesStore.createIndex("month", "month", { unique: false });
          expensesStore.createIndex("year", "year", { unique: false });
        }
      };
    });
  }

  // Generic CRUD operations for categories
  async getAllCategories(): Promise<Category[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get categories"));
      };
    });
  }

  async getCategoryById(id: number): Promise<Category | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to get category"));
      };
    });
  }

  async createCategory(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Promise<Category> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");

      const newCategory = {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const request = store.add(newCategory);

      request.onsuccess = () => {
        const id = request.result as number;
        resolve({ ...newCategory, id } as Category);
      };

      request.onerror = () => {
        reject(new Error("Failed to create category"));
      };
    });
  }

  async updateCategory(
    id: number,
    updates: Partial<Category>
  ): Promise<Category | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");

      // First get the existing category
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingCategory = getRequest.result;
        if (!existingCategory) {
          resolve(null);
          return;
        }

        const updatedCategory: Category = {
          ...existingCategory,
          ...updates,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updatedCategory);

        putRequest.onsuccess = () => {
          resolve(updatedCategory);
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update category"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get category for update"));
      };
    });
  }

  async deleteCategory(id: number): Promise<boolean> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to delete category"));
      };
    });
  }

  // Generic CRUD operations for expenses
  async getAllExpenses(): Promise<Expense[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expenses"));
      };
    });
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expense"));
      };
    });
  }

  async createExpense(
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");

      const newExpense = {
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const request = store.add(newExpense);

      request.onsuccess = () => {
        const id = request.result as number;
        resolve({ ...newExpense, id } as Expense);
      };

      request.onerror = () => {
        reject(new Error("Failed to create expense"));
      };
    });
  }

  async updateExpense(
    id: number,
    updates: Partial<Expense>
  ): Promise<Expense | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");

      // First get the existing expense
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingExpense = getRequest.result;
        if (!existingExpense) {
          resolve(null);
          return;
        }

        const updatedExpense: Expense = {
          ...existingExpense,
          ...updates,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updatedExpense);

        putRequest.onsuccess = () => {
          resolve(updatedExpense);
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update expense"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get expense for update"));
      };
    });
  }

  async deleteExpense(id: number): Promise<boolean> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to delete expense"));
      };
    });
  }

  // Query methods for expenses
  async getExpensesByCategory(categoryId: number): Promise<Expense[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const index = store.index("categoryId");
      const request = index.getAll(categoryId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expenses by category"));
      };
    });
  }

  async getExpensesByType(type: "income" | "expense"): Promise<Expense[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const index = store.index("type");
      const request = index.getAll(type);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expenses by type"));
      };
    });
  }

  async getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const request = store.getAll();

      request.onsuccess = () => {
        const allExpenses = request.result;
        const filteredExpenses = allExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getFullYear() === year &&
            expenseDate.getMonth() + 1 === month
          );
        });
        resolve(filteredExpenses);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expenses by month"));
      };
    });
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["categories", "expenses"],
        "readwrite"
      );

      const categoriesStore = transaction.objectStore("categories");
      const expensesStore = transaction.objectStore("expenses");

      const categoriesRequest = categoriesStore.clear();
      const expensesRequest = expensesStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      categoriesRequest.onsuccess = checkComplete;
      expensesRequest.onsuccess = checkComplete;

      categoriesRequest.onerror = () =>
        reject(new Error("Failed to clear categories"));
      expensesRequest.onerror = () =>
        reject(new Error("Failed to clear expenses"));
    });
  }

  // Ensure database is initialized
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

export const indexedDBService = new IndexedDBService();
