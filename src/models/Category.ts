export interface Category {
  id: number;
  name: string;
  budget: number;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithSpending extends Category {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isCloseToBudget: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  budget: number;
  color: string;
  icon?: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  budget?: number;
  color?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoryFilters {
  isActive?: boolean;
  search?: string;
}
