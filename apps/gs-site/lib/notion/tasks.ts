/**
 * Notion Task List Database Client
 *
 * Queries the Task List database for task completion rates,
 * ranked tasks, and Wabbed percentages. Used by various tiles.
 *
 * Database Schema (expected):
 * - Name: Title (task name)
 * - Rank: Select (0, 1, 2, 3 - priority levels)
 * - Status: Status (Not started, In progress, Done)
 * - Due Date: Date (optional deadline)
 * - Wabbed: Checkbox (whether task was "Wabbed" / processed)
 * - Category: Multi-select (optional grouping)
 */

const NOTION_API_VERSION = '2022-06-28';

// TODO: Replace with actual Task List database ID from Notion
const TASKS_DATABASE_ID = process.env.NOTION_TASKS_DATABASE_ID || '';

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
  wabbed: boolean;
  categories: string[];
  createdAt: string;
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
 * Parse task from Notion page
 */
function parseTask(page: any): Task {
  const rankValue = page.properties.Rank?.select?.name;
  let rank: TaskRank | null = null;
  if (rankValue !== undefined && rankValue !== null) {
    const parsed = parseInt(rankValue, 10);
    if ([0, 1, 2, 3].includes(parsed)) {
      rank = parsed as TaskRank;
    }
  }

  return {
    id: page.id,
    name: page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
    rank,
    status: (page.properties.Status?.status?.name || 'Not started') as TaskStatus,
    dueDate: page.properties['Due Date']?.date?.start || null,
    wabbed: page.properties.Wabbed?.checkbox || false,
    categories: (page.properties.Category?.multi_select || []).map(
      (s: any) => s.name
    ),
    createdAt: page.created_time,
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
          property: 'Rank',
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

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        property: 'Rank',
        select: {
          equals: rank.toString(),
        },
      },
      sorts: [
        {
          property: 'Status',
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
 * Get Wabbed percentage and task completion statistics
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
        0: { total: 0, completed: 0, wabbed: 0 },
        1: { total: 0, completed: 0, wabbed: 0 },
        2: { total: 0, completed: 0, wabbed: 0 },
        3: { total: 0, completed: 0, wabbed: 0 },
      },
    };
  }

  try {
    const tasks = await getAllTasks();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const wabbed = tasks.filter((t) => t.wabbed).length;

    // Calculate by rank
    const byRank: Record<TaskRank, { total: number; completed: number; wabbed: number }> = {
      0: { total: 0, completed: 0, wabbed: 0 },
      1: { total: 0, completed: 0, wabbed: 0 },
      2: { total: 0, completed: 0, wabbed: 0 },
      3: { total: 0, completed: 0, wabbed: 0 },
    };

    tasks.forEach((task) => {
      if (task.rank !== null) {
        byRank[task.rank].total++;
        if (task.status === 'Done') byRank[task.rank].completed++;
        if (task.wabbed) byRank[task.rank].wabbed++;
      }
    });

    return {
      total,
      completed,
      wabbed,
      wabbedPercentage: total > 0 ? Math.round((wabbed / total) * 100) : 0,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      byRank,
    };
  } catch (error) {
    console.error('Error calculating Wabbed percentage:', error);
    throw error;
  }
}

/**
 * Get overdue tasks (tasks with past due dates that aren't Done)
 */
export async function getOverdueTasks(): Promise<OverdueTask[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        and: [
          {
            property: 'Due Date',
            date: {
              before: todayStr,
            },
          },
          {
            property: 'Status',
            status: {
              does_not_equal: 'Done',
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Due Date',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results.map((page: any) => {
      const task = parseTask(page);
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
 * Get tasks in progress (not completed, not wabbed)
 */
export async function getInProgressTasks(): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        property: 'Status',
        status: {
          equals: 'In progress',
        },
      },
      sorts: [
        {
          property: 'Rank',
          direction: 'ascending',
        },
      ],
      page_size: 100,
    });

    return response.results.map(parseTask);
  } catch (error) {
    console.error('Error fetching in-progress tasks:', error);
    throw error;
  }
}

/**
 * Get task counts by status
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
      'In progress': 0,
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
 * Get high-priority tasks (rank 0 and 1) that aren't completed
 */
export async function getHighPriorityTasks(): Promise<Task[]> {
  if (!TASKS_DATABASE_ID) {
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${TASKS_DATABASE_ID}/query`, {
      filter: {
        and: [
          {
            or: [
              {
                property: 'Rank',
                select: { equals: '0' },
              },
              {
                property: 'Rank',
                select: { equals: '1' },
              },
            ],
          },
          {
            property: 'Status',
            status: { does_not_equal: 'Done' },
          },
        ],
      },
      sorts: [
        {
          property: 'Rank',
          direction: 'ascending',
        },
      ],
      page_size: 50,
    });

    return response.results.map(parseTask);
  } catch (error) {
    console.error('Error fetching high-priority tasks:', error);
    throw error;
  }
}

/**
 * Check if Tasks database is configured
 */
export function isTasksDatabaseConfigured(): boolean {
  return Boolean(TASKS_DATABASE_ID && getNotionApiKey());
}
