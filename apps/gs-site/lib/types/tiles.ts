import type { MenuCategory } from '@/components/MenuFilter';

export type TileStatus = 'Not started' | 'In progress' | 'Done';

export type TilePhase = 'GS Site Standing' | 'Morning' | 'Evening';

export type ShadcnComponent =
  | 'Button'
  | 'React plugin'
  | 'Dropzone'
  | 'Calendar & Date Picker'
  | 'Graphic'
  | 'Form'
  | 'Logic'
  | 'Toggle List'
  | 'Pop-up';

export interface Tile {
  id: string;
  name: string;
  menu: MenuCategory[];
  status: TileStatus;
  desc: string;
  shadcn: ShadcnComponent[];
  phase: TilePhase[];
}

export interface NotionTileProperties {
  Name: {
    title: Array<{ plain_text: string }>;
  };
  MENU: {
    multi_select: Array<{ name: string }>;
  };
  Status: {
    status: { name: string };
  };
  Desc: {
    rich_text: Array<{ plain_text: string }>;
  };
  shadcn: {
    multi_select: Array<{ name: string }>;
  };
  Phase: {
    multi_select: Array<{ name: string }>;
  };
}

/**
 * Transform Notion API response to Tile interface
 */
export function notionToTile(page: { id: string; properties: NotionTileProperties }): Tile {
  return {
    id: page.id,
    name: page.properties.Name?.title[0]?.plain_text || 'Untitled',
    menu: (page.properties.MENU?.multi_select || []).map((m) => m.name) as MenuCategory[],
    status: (page.properties.Status?.status?.name || 'Not started') as TileStatus,
    desc: page.properties.Desc?.rich_text[0]?.plain_text || '',
    shadcn: (page.properties.shadcn?.multi_select || []).map((s) => s.name) as ShadcnComponent[],
    phase: (page.properties.Phase?.multi_select || []).map((p) => p.name) as TilePhase[],
  };
}
