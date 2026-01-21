/**
 * Calendar API Route
 *
 * Handles CRUD operations for calendar tasks via Notion
 *
 * GET /api/admin/calendar?start=2026-01-01&end=2026-01-31
 * POST /api/admin/calendar (body: CreateTaskInput)
 * PATCH /api/admin/calendar (body: UpdateTaskInput)
 * DELETE /api/admin/calendar?id=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchRealtyOneTasks,
  createNotionTask,
  updateNotionTask,
  deleteNotionTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/lib/notion/calendar'
import { requireAdmin } from '@/lib/api/admin-auth'

/**
 * GET - Fetch tasks for a date range
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Missing required parameters: start and end dates' },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const { tasks, error } = await fetchRealtyOneTasks(start, end)

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode || 500 }
    )
  }

  return NextResponse.json(
    { tasks },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
      },
    }
  )
}

/**
 * POST - Create a new task
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  let body: CreateTaskInput

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate required fields
  if (!body.title || !body.start) {
    return NextResponse.json(
      { error: 'Missing required fields: title and start' },
      { status: 400 }
    )
  }

  // Validate priority if provided
  const validPriorities = ['S Tier', 'A Tier', 'B Tier', 'C tier']
  if (body.priority && !validPriorities.includes(body.priority)) {
    return NextResponse.json(
      { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
      { status: 400 }
    )
  }

  const { task, error } = await createNotionTask(body)

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode || 500 }
    )
  }

  return NextResponse.json({ task }, { status: 201 })
}

/**
 * PATCH - Update an existing task
 */
export async function PATCH(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  let body: UpdateTaskInput

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate required field
  if (!body.id) {
    return NextResponse.json(
      { error: 'Missing required field: id' },
      { status: 400 }
    )
  }

  // Validate priority if provided
  const validPriorities = ['S Tier', 'A Tier', 'B Tier', 'C tier']
  if (body.priority && !validPriorities.includes(body.priority)) {
    return NextResponse.json(
      { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
      { status: 400 }
    )
  }

  const { task, error } = await updateNotionTask(body)

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode || 500 }
    )
  }

  return NextResponse.json({ task }, { status: 200 })
}

/**
 * DELETE - Delete (archive) a task
 */
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required parameter: id' },
      { status: 400 }
    )
  }

  const { success, error } = await deleteNotionTask(id)

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode || 500 }
    )
  }

  return NextResponse.json({ success }, { status: 200 })
}
