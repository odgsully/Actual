/**
 * Notion Task List Database Client
 *
 * Queries the Task List database for task completion rates,
 * ranked tasks, and statistics. Used by various tiles.
 *
 * ACTUAL Database Schema (from Notion):
 * - Task: Title (task name)
 * - Date: Date (task date/deadline)
 * - Priority: Select (S Tier, A Tier, B Tier, C tier)
 * - Tags: Multi-select (HABIT, NETWORK, PROMPT, DEEP RESEARCH, PERSONAL, ORGANIZED)
 * - Project: Select (Truck Tailors, Trilogy, GenHQ, RealtyOne, SpaceAd)
 * - Notes: Rich text
 * - Mins Exp: Number (expected minutes)
 * - Mins Act: Formula (actual minutes)
 * - Part _ of Multiple?: Checkbox
 * - Created At: Created time
 * - "" (unnamed): Checkbox (completion status)
 *
 * Priority Mapping: S Tier=0, A Tier=1, B Tier=2, C tier=3
 * Status derived from unnamed checkbox (checked = Done)
 */

const NOTION_API_VERSION = '2022-06-28';

const TASKS_DATABASE_ID = process.env.NOTION_TASKS_DATABASE_ID || '';

/**
 * Priority tier mapping from Notion to numeric rank
 */
const PRIORITY_MAP: Record<string, number> = {
  'S Tier': 0,
  'A Tier': 1,
  'B Tier': 2,
  'C tier': 3, // Note: lowercase 't' in actual Notion
};

/**
 * Reverse mapping for display purposes
 */
const RANK_TO_PRIORITY: Record<number, string> = {
  0: 'S Tier',
  1: 'A Tier',
  2: 'B Tier',
  3: 'C tier',
};

/**
 * Get Notion API key from environment
 */
function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

/**
 * Make a request to Notion API
 */
async function notionFetch(endpoint: string, body?: object): Promise<any> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }

  const url = `https://api.notion.com/v1${endpoint}`;

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export type TaskRank = 0 | 1 | 2 | 3;
export type TaskStatus = 'Not started' | 'In progress' | 'Done';

export interface Task {
  id: string;
  name: string;
  rank: TaskRank | null;
  status: TaskStatus;
  dueDate: string | null;
  categories: string[];
  project?: string;
  notes?: string;
  createdAt: string;
  // Legacy field - always false since Wabbed column doesn't exist
  wabbed: boolean;
}

export interface TaskCompletionStats {
  total: number;
  completed: number;
  completionPercentage: number;
  byRank: Record<TaskRank, { total: number; completed: number }>;
  // Legacy fields - kept for backward compatibility but always 0
  wabbed: number;
  wabbedPercentage: number;
}

export interface OverdueTask extends Task {
  daysOverdue: number;
}

/**
 * Parse task from Notion page
 * Maps actual Notion properties to our Task interface
 */
function parseTask(page: any): Task {
  // Map Priority (S/A/B/C Tier) to rank (0/1/2/3)
  const priorityValue = page.properties.Priority?.select?.name;
  let rank: TaskRank | null = null;
  if (priorityValue && priorityValue in PRIORITY_MAP) {
    rank = PRIORITY_MAP[priorityValue] as TaskRank;
  }

  // Get completion status from unnamed checkbox
  // The checkbox column has empty name "", accessible via page.properties[""]
  const isCompleted = page.properties['']?.checkbox || false;

  // Derive status from checkbox
  const status: TaskStatus = isCompleted ? 'Done' : 'Not started';

  return {
    id: page.id,
    // Task title field (not "Name")
    name: page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
    rank,
    status,
    // Date field (not "Due Date")
    dueDate: page.properties.Date?.date?.start || null,
    // Tags field (not "Category")
    categories: (page.properties.Tags?.multi_select || []).map(
      (s: any) => s.name
    ),
    project: page.properties.Project?.select?.name,
    notes: page.properties.Notes?.rich_text?.[0]?.plain_text,
    createdAt: page.created_time,
    // Wabbed doesn't exist - always false
    wabbed: false,
  };
}

/**
 * Fetch all tasks from the database
 */
export async function getAllTasks(): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    console.warn('NOTION_TASKS_DATABASE_ID not configured');
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      sorts: [
        {
          property: 'Priority',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results.map(parseTask);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

/**
 * Fetch tasks filtered by rank
 */
export async function getTasksByRank(rank: TaskRank): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  const priorityName = RANK_TO_PRIORITY[rank];
  if (!priorityName) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        property: 'Priority',
        select: {
          equals: priorityName,
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results.map(parseTask);
  } catch (error) {
    console.error(`Error fetching tasks for rank ${rank}:`, error);
    throw error;
  }
}

/**
 * Get task completion statistics
 * Note: Wabbed functionality removed - returns 0 for wabbed fields
 */
export async function getWabbedPercentage(): Promise<TaskCompletionStats> {
  if (!TASKS_DATABASE_ID) {
    return {
      total: 0,
      completed: 0,
      wabbed: 0,
      wabbedPercentage: 0,
      completionPercentage: 0,
      byRank: {
        0: { total: 0, completed: 0 },
        1: { total: 0, completed: 0 },
        2: { total: 0, completed: 0 },
        3: { total: 0, completed: 0 },
      },
    };
  }

  try {
    const tasks = await getAllTasks();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;

    // Calculate by rank
    const byRank: Record<TaskRank, { total: number; completed: number }> = {
      0: { total: 0, completed: 0 },
      1: { total: 0, completed: 0 },
      2: { total: 0, completed: 0 },
      3: { total: 0, completed: 0 },
    };

    tasks.forEach((task) => {
      if (task.rank !== null) {
        byRank[task.rank].total++;
        if (task.status === 'Done') byRank[task.rank].completed++;
      }
    });

    return {
      total,
      completed,
      // Wabbed not available - return 0
      wabbed: 0,
      wabbedPercentage: 0,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      byRank,
    };
  } catch (error) {
    console.error('Error calculating task statistics:', error);
    throw error;
  }
}

/**
 * Get overdue tasks (tasks with past dates that aren't Done)
 */
export async function getOverdueTasks(): Promise<OverdueTask[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // We can't filter by the unnamed checkbox directly in the API,
    // so we'll filter client-side after fetching
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        property: 'Date',
        date: {
          before: todayStr,
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results
      .map(parseTask)
      .filter((task) => task.status !== 'Done')
      .map((task) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : today;
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...task,
          daysOverdue,
        };
      });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    throw error;
  }
}

/**
 * Get tasks that are not completed
 * Note: "In progress" status doesn't exist in Notion, so this returns
 * all tasks that aren't marked as Done (checkbox unchecked)
 */
export async function getInProgressTasks(): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    // Fetch all tasks and filter client-side since we can't filter
    // by the unnamed checkbox in the API
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      sorts: [
        {
          property: 'Priority',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results
      .map(parseTask)
      .filter((task) => task.status !== 'Done');
  } catch (error) {
    console.error('Error fetching in-progress tasks:', error);
    throw error;
  }
}

/**
 * Get task counts by status
 * Note: Only "Done" and "Not started" are available (no "In progress")
 */
export async function getTaskCountsByStatus(): Promise<Record<TaskStatus, number>> {
  if (!TASKS_DATABASE_ID) {
    return {
      'Not started': 0,
      'In progress': 0,
      'Done': 0,
    };
  }

  try {
    const tasks = await getAllTasks();

    const counts: Record<TaskStatus, number> = {
      'Not started': 0,
      'In progress': 0, // Always 0 - status derived from checkbox only
      'Done': 0,
    };

    tasks.forEach((task) => {
      counts[task.status]++;
    });

    return counts;
  } catch (error) {
    console.error('Error counting tasks by status:', error);
    throw error;
  }
}

/**
 * Get high-priority tasks (S Tier and A Tier) that aren't completed
 */
export async function getHighPriorityTasks(): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        or: [
          {
            property: 'Priority',
            select: { equals: 'S Tier' },
          },
          {
            property: 'Priority',
            select: { equals: 'A Tier' },
          },
        ],
      },
      sorts: [
        {
          property: 'Priority',
          direction: 'ascending',
        },
      ],
      page_size: 50,
    });

    // Filter out completed tasks client-side
    return response.results
      .map(parseTask)
      .filter((task) => task.status !== 'Done');
  } catch (error) {
    console.error('Error fetching high-priority tasks:', error);
    throw error;
  }
}

/**
 * Get tasks by project
 */
export async function getTasksByProject(projectName: string): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        property: 'Project',
        select: {
          equals: projectName,
        },
      },
      sorts: [
        {
          property: 'Priority',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results.map(parseTask);
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectName}:`, error);
    throw error;
  }
}

/**
 * Get available projects from the database
 */
export function getAvailableProjects(): string[] {
  return ['Truck Tailors', 'Trilogy', 'GenHQ', 'RealtyOne', 'SpaceAd'];
}

/**
 * Get available tags from the database
 */
export function getAvailableTags(): string[] {
  return ['HABIT', 'NETWORK', 'PROMPT', 'DEEP RESEARCH', 'PERSONAL', 'ORGANIZED'];
}

/**
 * Check if Tasks database is configured
 */
export function isTasksDatabaseConfigured(): boolean {
  return Boolean(TASKS_DATABASE_ID && getNotionApiKey());
}
