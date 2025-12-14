import type { Category } from "../models/Category";
import type { Expense } from "../models/Expense";
import type { Note } from "../models/Note";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const AUTH_TOKEN_KEY = "budget_app_auth_token";

// Event dispatched when authentication fails (403)
export const AUTH_REQUIRED_EVENT = "authRequired";

export interface AuthToken {
  token: string;
  expiresAt: string;
}

// Helper functions for token management
export const getAuthToken = (): AuthToken | null => {
  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!stored) return null;
  try {
    const authToken = JSON.parse(stored) as AuthToken;
    // Check if token is expired
    if (new Date(authToken.expiresAt) <= new Date()) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    return authToken;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
};

export const setAuthToken = (authToken: AuthToken): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authToken));
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if authenticated and auth is required
    if (requiresAuth) {
      const authToken = getAuthToken();
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken.token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 403 Forbidden - dispatch event to show PIN modal
      if (response.status === 403) {
        removeAuthToken();
        window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
      }

      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Authentication methods
  async login(pin: string): Promise<AuthToken> {
    const response = await this.request<AuthToken>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ pin }),
      },
      false // No auth required for login
    );
    setAuthToken(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ message: string }>(
        "/auth/logout",
        { method: "POST" },
        true
      );
    } finally {
      removeAuthToken();
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.request<{ valid: boolean }>(
        "/auth/verify",
        {},
        true
      );
      return response.valid;
    } catch {
      return false;
    }
  }

  // Category methods
  async getAllCategories(filters?: {
    isActive?: boolean;
    show?: boolean;
    search?: string;
  }): Promise<Category[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append("isActive", filters.isActive.toString());
    }
    if (filters?.show !== undefined) {
      params.append("show", filters.show.toString());
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/categories?${queryString}` : "/categories";

    return this.request<Category[]>(endpoint);
  }

  async getCategoryById(id: number): Promise<Category | null> {
    try {
      return await this.request<Category>(`/categories/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createCategory(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Promise<Category> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: number,
    updates: Partial<Category>
  ): Promise<Category | null> {
    try {
      return await this.request<Category>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await this.request(`/categories/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      throw error;
    }
  }

  async getExpensesByCategory(categoryId: number): Promise<Expense[]> {
    return this.request<Expense[]>(`/categories/${categoryId}/expenses`);
  }

  // Expense methods
  async getAllExpenses(filters?: {
    categoryId?: number;
    type?: "expense" | "income";
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    tags?: string[];
    isRecurring?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Expense[]> {
    const params = new URLSearchParams();

    if (filters?.categoryId) {
      params.append("categoryId", filters.categoryId.toString());
    }
    if (filters?.type) {
      params.append("type", filters.type);
    }
    if (filters?.dateFrom) {
      params.append("dateFrom", filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append("dateTo", filters.dateTo.toISOString());
    }
    if (filters?.minAmount !== undefined) {
      params.append("minAmount", filters.minAmount.toString());
    }
    if (filters?.maxAmount !== undefined) {
      params.append("maxAmount", filters.maxAmount.toString());
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.isRecurring !== undefined) {
      params.append("isRecurring", filters.isRecurring.toString());
    }
    if (filters?.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters?.offset) {
      params.append("offset", filters.offset.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/expenses?${queryString}` : "/expenses";

    let expenses = await this.request<Expense[]>(endpoint);

    // Filter by tags on the client side since it's an array
    if (filters?.tags && filters.tags.length > 0) {
      expenses = expenses.filter((expense) =>
        expense.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    return expenses;
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    try {
      return await this.request<Expense>(`/expenses/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async createExpense(
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> {
    return this.request<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(
    id: number,
    updates: Partial<Expense>
  ): Promise<Expense | null> {
    try {
      return await this.request<Expense>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<boolean> {
    try {
      await this.request(`/expenses/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      throw error;
    }
  }

  async getExpensesByType(type: "expense" | "income"): Promise<Expense[]> {
    return this.request<Expense[]>(`/expenses/type/${type}`);
  }

  async getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    return this.request<Expense[]>(
      `/expenses/month/${year}/${month.toString().padStart(2, "0")}`
    );
  }

  async getExpenseSummary(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalExpenses: number;
    totalIncome: number;
    netAmount: number;
    expenseCount: number;
    incomeCount: number;
    averageExpense: number;
    averageIncome: number;
  }> {
    const params = new URLSearchParams();

    if (filters?.dateFrom) {
      params.append("dateFrom", filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append("dateTo", filters.dateTo.toISOString());
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/expenses/summary?${queryString}`
      : "/expenses/summary";

    return this.request(endpoint);
  }

  async getRecurringExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>("/expenses/recurring");
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }

  // Category methods
  async getAllNotes(): Promise<Note[]> {
    const endpoint = "/notes";

    return this.request<Note[]>(endpoint);
  }

  async createNote(
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ): Promise<Note> {
    return this.request<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(note),
    });
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note | null> {
    try {
      return await this.request<Note>(`/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async deleteNote(id: number): Promise<boolean> {
    try {
      await this.request(`/notes/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
