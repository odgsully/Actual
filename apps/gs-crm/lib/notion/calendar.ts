/**
 * Notion Calendar API Wrapper
 *
 * Provides functions to interact with the Notion "Task List" database
 * filtered by Project = "RealtyOne"
 */

import { Client } from '@notionhq/client'
import { withRetry } from './retry'
import { parseNotionError, NotionError } from './errors'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Database and project IDs
// data_source_id is used for querying, database_id is used for creating pages
const TASK_LIST_DATA_SOURCE_ID = process.env.NOTION_TASKS_DATABASE_ID || '1c1cf08f-4499-803d-b5df-000b0d8c6e11'
// The parent database_id (inline database block) - required for pages.create()
const TASK_LIST_DATABASE_ID = '1c1cf08f-4499-8062-bfd5-c04320e11aba'
const REALTYONE_PROJECT = 'RealtyOne'

// ============================================
// Types
// ============================================

export interface CalendarTask {
  id: string
  title: string
  start: string | null        // ISO datetime
  end: string | null          // ISO datetime (optional)
  allDay: boolean
  priority: 'S Tier' | 'A Tier' | 'B Tier' | 'C tier' | null
  tags: string[]
  notes: string
  minsExpected: number | null
  notionUrl: string
  createdAt: string
}

export interface CreateTaskInput {
  title: string
  start: string               // ISO datetime or YYYY-MM-DD
  end?: string                // Optional end time
  priority?: 'S Tier' | 'A Tier' | 'B Tier' | 'C tier'
  tags?: string[]
  notes?: string
  minsExpected?: number
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract plain text from Notion rich text array
 */
function extractPlainText(richText: Array<{ plain_text: string }>): string {
  return richText.map(rt => rt.plain_text).join('')
}

/**
 * Transform Notion page to CalendarTask
 */
function transformNotionPage(page: any): CalendarTask {
  const properties = page.properties

  // Extract date information
  const dateProperty = properties.Date?.date
  const start = dateProperty?.start || null
  const end = dateProperty?.end || null
  const allDay = start ? !start.includes('T') : true

  // Extract title - try multiple common property names
  const titleProperty = properties.Task?.title || properties.Name?.title || properties.Title?.title || []
  const title = extractPlainText(titleProperty)

  // Extract priority
  const priorityProperty = properties.Priority?.select
  const priority = priorityProperty?.name || null

  // Extract tags
  const tagsProperty = properties.Tags?.multi_select || []
  const tags = tagsProperty.map((tag: { name: string }) => tag.name)

  // Extract notes
  const notesProperty = properties.Notes?.rich_text || []
  const notes = extractPlainText(notesProperty)

  // Extract mins expected
  const minsExpected = properties['Mins Exp']?.number || null

  // Extract created at
  const createdAt = properties['Created At']?.created_time || page.created_time

  return {
    id: page.id,
    title,
    start,
    end,
    allDay,
    priority: priority as CalendarTask['priority'],
    tags,
    notes,
    minsExpected,
    notionUrl: page.url,
    createdAt,
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch RealtyOne tasks within a date range
 */
export async function fetchRealtyOneTasks(
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<{ tasks: CalendarTask[]; error: NotionError | null }> {
  try {
    console.log('[Calendar] Fetching tasks from:', TASK_LIST_DATA_SOURCE_ID, 'between', startDate, 'and', endDate)

    const response = await withRetry(async () => {
      return await notion.dataSources.query({
        data_source_id: TASK_LIST_DATA_SOURCE_ID,
        filter: {
          and: [
            {
              property: 'Project',
              select: {
                equals: REALTYONE_PROJECT,
              },
            },
            {
              property: 'Date',
              date: {
                is_not_empty: true,
              },
            },
            {
              property: 'Date',
              date: {
                on_or_after: startDate,
              },
            },
            {
              property: 'Date',
              date: {
                on_or_before: endDate,
              },
            },
          ],
        },
        sorts: [
          {
            property: 'Date',
            direction: 'ascending',
          },
        ],
        page_size: 100,
      } as any) // Type assertion for SDK v5 compatibility
    })

    const tasks = response.results.map(transformNotionPage)
    return { tasks, error: null }
  } catch (error) {
    return { tasks: [], error: parseNotionError(error) }
  }
}

/**
 * Create a new task in Notion
 * Auto-sets Project to "RealtyOne"
 */
export async function createNotionTask(
  input: CreateTaskInput
): Promise<{ task: CalendarTask | null; error: NotionError | null }> {
  try {
    // Build properties object
    // Note: Title property name varies by database - "Name" is default, "Task" is used in some DBs
    const properties: Record<string, any> = {
      // Date (required)
      Date: {
        date: {
          start: input.start,
          ...(input.end && { end: input.end }),
        },
      },
    }

    // Title property is "Task" in this database
    properties.Task = {
      title: [{ text: { content: input.title } }],
    }

    // Auto-set Project to RealtyOne
    properties.Project = {
      select: { name: REALTYONE_PROJECT },
    }

    // Optional: Priority
    if (input.priority) {
      properties.Priority = {
        select: { name: input.priority },
      }
    }

    // Optional: Tags
    if (input.tags && input.tags.length > 0) {
      properties.Tags = {
        multi_select: input.tags.map(name => ({ name })),
      }
    }

    // Optional: Notes
    if (input.notes) {
      properties.Notes = {
        rich_text: [
          {
            text: { content: input.notes },
          },
        ],
      }
    }

    // Optional: Duration
    if (input.minsExpected !== undefined) {
      properties['Mins Exp'] = {
        number: input.minsExpected,
      }
    }

    // Log for debugging
    if (!process.env.NOTION_API_KEY) {
      console.error('[Calendar] NOTION_API_KEY is not set')
      throw new Error('Notion API key is not configured')
    }

    console.log('[Calendar] Creating task in database:', TASK_LIST_DATABASE_ID)

    const response = await withRetry(async () => {
      return await notion.pages.create({
        parent: {
          database_id: TASK_LIST_DATABASE_ID
        },
        properties,
      } as any) // Type assertion needed due to SDK v5 type complexity
    })

    const task = transformNotionPage(response)
    return { task, error: null }
  } catch (error) {
    return { task: null, error: parseNotionError(error) }
  }
}

/**
 * Update an existing task
 */
export async function updateNotionTask(
  input: UpdateTaskInput
): Promise<{ task: CalendarTask | null; error: NotionError | null }> {
  try {
    // Build properties object with only provided fields
    const properties: Record<string, any> = {}

    if (input.title !== undefined) {
      // Title property is "Task" in this database
      properties.Task = {
        title: [
          {
            text: { content: input.title },
          },
        ],
      }
    }

    if (input.start !== undefined) {
      properties.Date = {
        date: {
          start: input.start,
          ...(input.end && { end: input.end }),
        },
      }
    }

    if (input.priority !== undefined) {
      properties.Priority = {
        select: input.priority ? { name: input.priority } : null,
      }
    }

    if (input.tags !== undefined) {
      properties.Tags = {
        multi_select: input.tags.map(name => ({ name })),
      }
    }

    if (input.notes !== undefined) {
      properties.Notes = {
        rich_text: [
          {
            text: { content: input.notes },
          },
        ],
      }
    }

    if (input.minsExpected !== undefined) {
      properties['Mins Exp'] = {
        number: input.minsExpected,
      }
    }

    const response = await withRetry(async () => {
      return await notion.pages.update({
        page_id: input.id,
        properties,
      })
    })

    const task = transformNotionPage(response)
    return { task, error: null }
  } catch (error) {
    return { task: null, error: parseNotionError(error) }
  }
}

/**
 * Delete a task (archive in Notion)
 */
export async function deleteNotionTask(
  taskId: string
): Promise<{ success: boolean; error: NotionError | null }> {
  try {
    await withRetry(async () => {
      return await notion.pages.update({
        page_id: taskId,
        archived: true,
      })
    })

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: parseNotionError(error) }
  }
}

/**
 * Get a single task by ID
 */
export async function getNotionTask(
  taskId: string
): Promise<{ task: CalendarTask | null; error: NotionError | null }> {
  try {
    const response = await withRetry(async () => {
      return await notion.pages.retrieve({
        page_id: taskId,
      })
    })

    const task = transformNotionPage(response)
    return { task, error: null }
  } catch (error) {
    return { task: null, error: parseNotionError(error) }
  }
}
