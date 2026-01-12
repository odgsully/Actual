import type { MenuCategory } from '@/components/MenuFilter';

export type TileStatus = 'Not started' | 'In progress' | 'Done';

export type TilePhase = 'GS Site Standing' | 'Morning' | 'Evening';

export type ShadcnComponent =
  | 'Button'
  | 'React plugin'
  | 'Dropzone'
  | 'Calendar & Date Picker'
  | 'Graphic'
  | 'Chart'
  | 'Form'
  | 'Logic'
  | 'Toggle List'
  | 'Pop-up';

export type ThirdPartyIntegration =
  | 'GS Site Realty'
  | 'Wabbit'
  | 'Brother Printer'
  | 'YouTube 3rd P'
  | 'Scheduler 3rd P'
  | 'Whoop'
  | 'InBody'
  | 'Apple'
  | 'Google'
  | 'GitHub'
  | 'Notion'
  | 'Logic'
  | 'Datadog'
  | 'Twilio'
  | 'EXTRA LOGIC'
  | 'LIFX'
  | 'MyFitnessPal'
  | 'OpenAI';

export type TilePriority = '1' | '2' | '3' | null;

export type TypeIICategory =
  | 'Button'
  | 'Graph'
  | 'Metric'
  | 'Form'
  | 'Counter'
  | 'Calendar'
  | 'Dropzone'
  | 'Logic';

export interface Tile {
  id: string;
  name: string;
  menu: MenuCategory[];
  status: TileStatus;
  desc: string;
  shadcn: ShadcnComponent[];
  phase: TilePhase[];
  thirdParty: ThirdPartyIntegration[];
  actionWarning: boolean;
  actionDesc: string | null;
  priority: TilePriority;
  typeII: TypeIICategory | null;
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
  '3rd P': {
    multi_select: Array<{ name: string }>;
  };
  'Action warning?': {
    multi_select: Array<{ name: string }>;
  };
  'Action desc': {
    rich_text: Array<{ plain_text: string }>;
  };
  Select: {
    select: { name: string } | null;
  };
}

/**
 * Derive TypeII category from shadcn components
 * Priority-based: more specific types take precedence
 */
export function deriveTypeII(shadcn: ShadcnComponent[]): TypeIICategory | null {
  if (!shadcn || shadcn.length === 0) return null;

  // Priority-based derivation (matches update-dec28-notion.md)
  if (shadcn.includes('Dropzone')) return 'Dropzone';
  if (shadcn.includes('Calendar & Date Picker')) return 'Calendar';
  if (shadcn.includes('Form') || shadcn.includes('Pop-up')) return 'Form';
  // Chart and Graphic are both visualization types
  if (shadcn.includes('Graphic') || shadcn.includes('Chart')) {
    // Graphic/Chart + Logic = Metric (stats, counts, etc.)
    if (shadcn.includes('Logic')) return 'Metric';
    return 'Graph';
  }
  if (shadcn.includes('Logic')) return 'Logic';
  return 'Button'; // Default fallback
}

/**
 * Transform Notion API response to Tile interface
 */
export function notionToTile(page: { id: string; properties: NotionTileProperties }): Tile {
  const actionWarningValues = page.properties['Action warning?']?.multi_select || [];
  const actionDescText = (page.properties['Action desc']?.rich_text || [])
    .map((rt) => rt.plain_text)
    .join(' ')
    .trim();

  // Extract shadcn array first so we can derive typeII
  const shadcnArray = (page.properties.shadcn?.multi_select || []).map((s) => s.name) as ShadcnComponent[];

  return {
    id: page.id,
    name: (page.properties.Name?.title[0]?.plain_text || 'Untitled').replace(/\n/g, '').trim(),
    menu: (page.properties.MENU?.multi_select || []).map((m) => m.name) as MenuCategory[],
    status: (page.properties.Status?.status?.name || 'Not started') as TileStatus,
    desc: (page.properties.Desc?.rich_text || []).map((rt) => rt.plain_text).join(' ').trim(),
    shadcn: shadcnArray,
    phase: (page.properties.Phase?.multi_select || []).map((p) => p.name) as TilePhase[],
    thirdParty: (page.properties['3rd P']?.multi_select || []).map((t) => t.name) as ThirdPartyIntegration[],
    actionWarning: actionWarningValues.some((v) => v.name === 'Y'),
    actionDesc: actionDescText || null,
    priority: (page.properties.Select?.select?.name as TilePriority) || null,
    typeII: deriveTypeII(shadcnArray),
  };
}
