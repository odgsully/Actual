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
  | 'EXTRA LOGIC';

export type TilePriority = '1' | '2' | '3' | null;

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
 * Transform Notion API response to Tile interface
 */
export function notionToTile(page: { id: string; properties: NotionTileProperties }): Tile {
  const actionWarningValues = page.properties['Action warning?']?.multi_select || [];
  const actionDescText = (page.properties['Action desc']?.rich_text || [])
    .map((rt) => rt.plain_text)
    .join(' ')
    .trim();

  return {
    id: page.id,
    name: (page.properties.Name?.title[0]?.plain_text || 'Untitled').replace(/\n/g, '').trim(),
    menu: (page.properties.MENU?.multi_select || []).map((m) => m.name) as MenuCategory[],
    status: (page.properties.Status?.status?.name || 'Not started') as TileStatus,
    desc: (page.properties.Desc?.rich_text || []).map((rt) => rt.plain_text).join(' ').trim(),
    shadcn: (page.properties.shadcn?.multi_select || []).map((s) => s.name) as ShadcnComponent[],
    phase: (page.properties.Phase?.multi_select || []).map((p) => p.name) as TilePhase[],
    thirdParty: (page.properties['3rd P']?.multi_select || []).map((t) => t.name) as ThirdPartyIntegration[],
    actionWarning: actionWarningValues.some((v) => v.name === 'Y'),
    actionDesc: actionDescText || null,
    priority: (page.properties.Select?.select?.name as TilePriority) || null,
  };
}
