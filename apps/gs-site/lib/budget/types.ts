/**
 * Budget Tracking Types
 *
 * Types for personal budget tracking with categories and monthly targets.
 */

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number | null;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface BudgetEntry {
  id: string;
  categoryId: string;
  categoryName?: string; // Joined from category
  amount: number;
  description: string | null;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface MonthlyTarget {
  id: string;
  month: string; // YYYY-MM-01 format
  totalBudget: number;
  createdAt: string;
}

export interface BudgetSummary {
  month: string; // YYYY-MM format
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  byCategory: CategorySummary[];
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  icon: string | null;
  color: string | null;
  monthlyLimit: number | null;
  spent: number;
  percentUsed: number;
  isOverLimit: boolean;
}

// API Response Types
export interface EntriesResponse {
  entries: BudgetEntry[];
  totalCount: number;
  month: string;
}

export interface SummaryResponse {
  summary: BudgetSummary;
}

export interface CategoriesResponse {
  categories: BudgetCategory[];
}

// Mutation Payloads
export interface CreateEntryPayload {
  categoryId: string;
  amount: number;
  description?: string;
  date?: string; // defaults to today
}

export interface CreateCategoryPayload {
  name: string;
  monthlyLimit?: number;
  icon?: string;
  color?: string;
}

export interface SetMonthlyTargetPayload {
  month: string; // YYYY-MM format
  totalBudget: number;
}

// Default categories for initial setup
export const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'id' | 'createdAt'>[] = [
  { name: 'Food & Dining', monthlyLimit: 800, icon: '🍔', color: 'orange' },
  { name: 'Transportation', monthlyLimit: 300, icon: '🚗', color: 'blue' },
  { name: 'Entertainment', monthlyLimit: 200, icon: '🎬', color: 'purple' },
  { name: 'Shopping', monthlyLimit: 400, icon: '🛍️', color: 'pink' },
  { name: 'Bills & Utilities', monthlyLimit: 500, icon: '📱', color: 'gray' },
  { name: 'Health & Fitness', monthlyLimit: 150, icon: '💪', color: 'green' },
  { name: 'Personal Care', monthlyLimit: 100, icon: '✨', color: 'yellow' },
  { name: 'Other', monthlyLimit: null, icon: '📦', color: 'slate' },
];
