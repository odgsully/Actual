/**
 * React Query Hooks for Calendar
 *
 * Provides hooks for fetching, creating, updating, and deleting calendar tasks
 * with automatic caching and invalidation
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CalendarTask, CreateTaskInput, UpdateTaskInput } from '@/lib/notion/calendar'

const CALENDAR_QUERY_KEY = 'calendar-tasks'

interface FetchTasksResponse {
  tasks: CalendarTask[]
  error?: string
  code?: string
}

interface MutationResponse {
  task?: CalendarTask
  success?: boolean
  error?: string
  code?: string
}

/**
 * Fetch tasks from the API
 */
async function fetchTasks(startDate: string, endDate: string): Promise<CalendarTask[]> {
  const res = await fetch(`/api/admin/calendar?start=${startDate}&end=${endDate}`)
  const data: FetchTasksResponse = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch tasks')
  }

  return data.tasks
}

/**
 * Create a task via the API
 */
async function createTask(input: CreateTaskInput): Promise<CalendarTask> {
  const res = await fetch('/api/admin/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data: MutationResponse = await res.json()

  if (!res.ok || !data.task) {
    throw new Error(data.error || 'Failed to create task')
  }

  return data.task
}

/**
 * Update a task via the API
 */
async function updateTask(input: UpdateTaskInput): Promise<CalendarTask> {
  const res = await fetch('/api/admin/calendar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data: MutationResponse = await res.json()

  if (!res.ok || !data.task) {
    throw new Error(data.error || 'Failed to update task')
  }

  return data.task
}

/**
 * Delete a task via the API
 */
async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/admin/calendar?id=${taskId}`, {
    method: 'DELETE',
  })
  const data: MutationResponse = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete task')
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch tasks for a date range
 */
export function useCalendarTasks(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, startDate, endDate],
    queryFn: () => fetchTasks(startDate, endDate),
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
    enabled: Boolean(startDate && endDate),
  })
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // Invalidate all calendar queries to refresh
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}

/**
 * Hook to prefetch tasks for adjacent months
 */
export function usePrefetchAdjacentMonths(currentDate: Date) {
  const queryClient = useQueryClient()

  const prefetchMonth = async (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`

    await queryClient.prefetchQuery({
      queryKey: [CALENDAR_QUERY_KEY, startDate, endDate],
      queryFn: () => fetchTasks(startDate, endDate),
      staleTime: 60_000,
    })
  }

  return {
    prefetchPrevMonth: () => {
      const prevMonth = new Date(currentDate)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      prefetchMonth(prevMonth)
    },
    prefetchNextMonth: () => {
      const nextMonth = new Date(currentDate)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      prefetchMonth(nextMonth)
    },
  }
}
