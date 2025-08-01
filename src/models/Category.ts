export interface Category {
  id: number;
  name: string;
  budget: number;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  show: boolean;
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
  show?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  budget?: number;
  color?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  show?: boolean;
}

export interface CategoryFilters {
  isActive?: boolean;
  show?: boolean;
  search?: string;
}
