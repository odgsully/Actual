import { MLSRow } from '@/lib/types/mls-data';
import { DwellingTypeInfo, DwellingSubType, DwellingCategory } from './types';

const PROJECT_TYPE_MAP: Record<string, DwellingSubType> = {
  'Duplex': 'duplex',
  'Triplex': 'triplex',
  'Four Plex': 'fourplex',
  '5 - 12 Units': 'small_apt',
  '13 - 24 Units': 'small_apt',
};

const DWELLING_TYPE_MAP: Record<string, DwellingSubType> = {
  'Single Family - Detached': 'sfr',
  'Patio Home': 'patio_home',
  'Apartment': 'apartment',
  'Condo': 'apartment',
  'Townhouse': 'townhouse',
};

const MULTIFAMILY_REMARKS_REGEX = /\b(duplex|triplex|fourplex|4-plex|tri-plex|four\s*plex)\b/i;

function subTypeFromUnitCount(count: number): DwellingSubType {
  if (count <= 2) return 'duplex';
  if (count === 3) return 'triplex';
  if (count === 4) return 'fourplex';
  return 'small_apt';
}

/**
 * Detect dwelling type from MLSRow structured fields.
 * Uses extraction-based detection — no LLM call needed.
 * Structured CSV fields (Property Type, Total # of Units, Project Type)
 * are reliable FlexMLS enums covering 95%+ of cases.
 */
export function detectDwellingType(row: MLSRow): DwellingTypeInfo {
  // === MULTIFAMILY PATH ===
  if (row.propertyType === 'MultiFamily') {
    const unitCount = row.totalUnits || 2;
    const perDoorPrice = row.listPrice ? Math.round(row.listPrice / unitCount) : undefined;

    // Try Project Type first for sub-type
    if (row.projectType) {
      const mapped = PROJECT_TYPE_MAP[row.projectType];
      if (mapped) {
        return {
          category: 'multifamily',
          subType: mapped,
          unitCount,
          perDoorPrice,
          detectionSource: 'project_type',
        };
      }
    }

    // Derive from unit count
    if (row.totalUnits) {
      return {
        category: 'multifamily',
        subType: subTypeFromUnitCount(row.totalUnits),
        unitCount,
        perDoorPrice,
        detectionSource: 'unit_count',
      };
    }

    // Property Type alone confirms multifamily
    return {
      category: 'multifamily',
      subType: 'duplex',  // Default for unknown multifamily
      unitCount,
      perDoorPrice,
      detectionSource: 'property_type',
    };
  }

  // === CHECK REMARKS FOR HIDDEN MULTIFAMILY ===
  if (row.remarks) {
    const match = row.remarks.match(MULTIFAMILY_REMARKS_REGEX);
    if (match) {
      const keyword = match[1].toLowerCase().replace(/[\s-]/g, '');
      let subType: DwellingSubType = 'duplex';
      if (keyword.includes('triplex') || keyword.includes('tri')) subType = 'triplex';
      else if (keyword.includes('fourplex') || keyword.includes('4plex') || keyword.includes('fourplex')) subType = 'fourplex';

      const unitCount = subType === 'duplex' ? 2 : subType === 'triplex' ? 3 : 4;
      const perDoorPrice = row.listPrice ? Math.round(row.listPrice / unitCount) : undefined;

      return {
        category: 'multifamily',
        subType,
        unitCount,
        perDoorPrice,
        dwellingTypeRaw: row.dwellingType,
        detectionSource: 'remarks_regex',
      };
    }
  }

  // === RESIDENTIAL PATH ===
  if (row.dwellingType) {
    const mapped = DWELLING_TYPE_MAP[row.dwellingType];
    if (mapped) {
      return {
        category: 'residential',
        subType: mapped,
        unitCount: 1,
        dwellingTypeRaw: row.dwellingType,
        detectionSource: 'property_type',
      };
    }
  }

  // Default: residential SFR
  return {
    category: 'residential',
    subType: 'sfr',
    unitCount: 1,
    dwellingTypeRaw: row.dwellingType,
    detectionSource: 'default',
  };
}

/**
 * Detect dwelling types for all properties in a batch.
 */
export function detectDwellingTypes(rows: MLSRow[]): Map<string, DwellingTypeInfo> {
  const results = new Map<string, DwellingTypeInfo>();
  for (const row of rows) {
    results.set(row.address, detectDwellingType(row));
  }
  return results;
}
