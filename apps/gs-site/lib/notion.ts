import { Client } from '@notionhq/client';

// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export interface NotionPage {
  id: string;
  title: string;
  lastEdited: Date;
  url: string;
  icon?: string;
  cover?: string;
  parent?: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  properties: Record<string, any>;
}

// Fetch recent pages from Notion
export async function fetchRecentPages(limit = 10): Promise<NotionPage[]> {
  try {
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      },
      page_size: limit
    });

    return response.results.map((page: any) => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.plain_text ||
             page.properties?.Name?.title?.[0]?.plain_text ||
             'Untitled',
      lastEdited: new Date(page.last_edited_time),
      url: page.url,
      icon: page.icon?.emoji || page.icon?.external?.url,
      cover: page.cover?.external?.url || page.cover?.file?.url,
      parent: page.parent?.page_id || page.parent?.database_id
    }));
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return [];
  }
}

// Fetch databases from Notion
export async function fetchDatabases(): Promise<NotionDatabase[]> {
  try {
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      } as any,
      page_size: 100
    });

    return response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || 'Untitled Database',
      description: db.description?.[0]?.plain_text,
      properties: db.properties || {}
    }));
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    return [];
  }
}

// Fetch a specific page content
export async function fetchPageContent(pageId: string) {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    return blocks.results;
  } catch (error) {
    console.error('Error fetching page content:', error);
    return [];
  }
}

// Search Notion content
export async function searchNotion(query: string, filter?: 'page' | 'database') {
  try {
    const searchParams: any = {
      query,
      page_size: 20
    };

    if (filter) {
      searchParams.filter = {
        property: 'object',
        value: filter
      };
    }

    const response = await notion.search(searchParams);

    return response.results;
  } catch (error) {
    console.error('Error searching Notion:', error);
    return [];
  }
}