'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Tasks data hooks for React Query
 *
 * These hooks fetch task data from the Notion API via our server-side
 * endpoints to avoid exposing the Notion token.
 */

export type TaskRank = 0 | 1 | 2 | 3;
export type TaskStatus = 'Not started' | 'In progress' | 'Done';

export interface Task {
  id: string;
  name: string;
  rank: TaskRank | null;
  status: TaskStatus;
  dueDate: string | null;
  wabbed: boolean;
  categories: string[];
}

export interface TaskCompletionStats {
  total: number;
  completed: number;
  wabbed: number;
  wabbedPercentage: number;
  completionPercentage: number;
  byRank: Record<TaskRank, { total: number; completed: number; wabbed: number }>;
}

export interface OverdueTask extends Task {
  daysOverdue: number;
}

/**
 * Fetch task completion stats from API
 */
async function fetchTaskCompletion(): Promise<TaskCompletionStats> {
  const response = await fetch('/api/notion/tasks/completion');

  if (!response.ok) {
    throw new Error('Failed to fetch task completion stats');
  }

  return response.json();
}

/**
 * Fetch tasks by rank from API
 */
async function fetchTasksByRank(rank: TaskRank): Promise<Task[]> {
  const response = await fetch(`/api/notion/tasks/by-rank?rank=${rank}`);

  if (!response.ok) {
    throw new Error('Failed to fetch tasks by rank');
  }

  return response.json();
}

/**
 * Fetch overdue tasks from API
 */
async function fetchOverdueTasks(): Promise<OverdueTask[]> {
  const response = await fetch('/api/notion/tasks/overdue');

  if (!response.ok) {
    throw new Error('Failed to fetch overdue tasks');
  }

  return response.json();
}

/**
 * Fetch high priority tasks from API
 */
async function fetchHighPriorityTasks(): Promise<Task[]> {
  const response = await fetch('/api/notion/tasks/high-priority');

  if (!response.ok) {
    throw new Error('Failed to fetch high priority tasks');
  }

  return response.json();
}

/**
 * Hook to fetch task completion stats (Wabbed %)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTaskCompletion();
 * // data.wabbedPercentage = 75
 * // data.completionPercentage = 60
 * ```
 */
export function useTaskCompletion() {
  return useQuery({
    queryKey: ['tasks', 'completion'],
    queryFn: fetchTaskCompletion,
    staleTime: 2 * 60 * 1000, // 2 minutes (tasks change more often)
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}

/**
 * Hook to fetch tasks by rank
 *
 * @param rank The priority rank (0-3)
 *
 * @example
 * ```tsx
 * const { data: urgentTasks } = useTasksByRank(0);
 * ```
 */
export function useTasksByRank(rank: TaskRank) {
  return useQuery({
    queryKey: ['tasks', 'by-rank', rank],
    queryFn: () => fetchTasksByRank(rank),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch overdue tasks
 *
 * @example
 * ```tsx
 * const { data: overdue, isLoading } = useOverdueTasks();
 * // overdue[0].daysOverdue = 3
 * ```
 */
export function useOverdueTasks() {
  return useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: fetchOverdueTasks,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch high priority tasks (rank 0 and 1)
 *
 * @example
 * ```tsx
 * const { data: priority } = useHighPriorityTasks();
 * ```
 */
export function useHighPriorityTasks() {
  return useQuery({
    queryKey: ['tasks', 'high-priority'],
    queryFn: fetchHighPriorityTasks,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for Wabbed percentage display
 *
 * Simplified version that returns just the percentage and counts
 */
export function useWabbedPercentage() {
  const { data, ...rest } = useTaskCompletion();

  return {
    data: data
      ? {
          percentage: data.wabbedPercentage,
          wabbed: data.wabbed,
          total: data.total,
        }
      : null,
    ...rest,
  };
}
