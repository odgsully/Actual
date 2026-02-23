#!/usr/bin/env node
/**
 * Generate Renovation_Calibration_55_Template.xlsx
 * v2 calibration template with 55 slots + rubric + room weights sheets
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'docs', 'calibration', 'v2', 'Renovation_Calibration_55_Template.xlsx');

// ── V2 Matrix (55 calibration slots) ──────────────────────────────────
const slots = [
  // Apartment (12)
  { slot: 1,  type: 'Apartment', price: '$100K-$200K', scoreRange: '1-2', tier: 'T1', anchor: '',  purpose: 'Garden-style baseline' },
  { slot: 2,  type: 'Apartment', price: '$100K-$200K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Cheap investor flip' },
  { slot: 3,  type: 'Apartment', price: '$100K-$200K', scoreRange: '7-8', tier: 'T4', anchor: 'Y', purpose: 'Over-improved cheap unit' },
  { slot: 4,  type: 'Apartment', price: '$200K-$350K', scoreRange: '3-4', tier: 'T2', anchor: '',  purpose: 'Mid garden, partial update' },
  { slot: 5,  type: 'Apartment', price: '$200K-$350K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Garden standard flip' },
  { slot: 6,  type: 'Apartment', price: '$350K-$550K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Mid-market attached flip' },
  { slot: 7,  type: 'Apartment', price: '$350K-$550K', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Mid-market designer reno' },
  { slot: 8,  type: 'Apartment', price: '$550K-$900K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Premium attached, builder-grade' },
  { slot: 9,  type: 'Apartment', price: '$550K-$900K', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Premium attached, quality reno' },
  { slot: 10, type: 'Apartment', price: '$900K-$1.5M', scoreRange: '1-2', tier: 'T1', anchor: 'Y', purpose: 'Dated luxury high-rise' },
  { slot: 11, type: 'Apartment', price: '$900K-$1.5M', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Luxury high-rise, quality reno' },
  { slot: 12, type: 'Apartment', price: '$1.5M-$2M+',  scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Luxury penthouse' },
  // SFR (18)
  { slot: 13, type: 'SFR', price: '$250K-$350K', scoreRange: '1-2', tier: 'T1', anchor: '',  purpose: 'Entry SFR baseline' },
  { slot: 14, type: 'SFR', price: '$250K-$350K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Entry flip (example 1)' },
  { slot: 15, type: 'SFR', price: '$250K-$350K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Entry flip (example 2 - variance)' },
  { slot: 16, type: 'SFR', price: '$350K-$500K', scoreRange: '3-4', tier: 'T2', anchor: '',  purpose: 'Mid-entry partial update' },
  { slot: 17, type: 'SFR', price: '$350K-$500K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Mid-entry flip' },
  { slot: 18, type: 'SFR', price: '$350K-$500K', scoreRange: '7-8', tier: 'T4', anchor: 'Y', purpose: 'Over-improved entry SFR' },
  { slot: 19, type: 'SFR', price: '$500K-$700K', scoreRange: '3-4', tier: 'T2', anchor: '',  purpose: 'Mid-market original' },
  { slot: 20, type: 'SFR', price: '$500K-$700K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Mid-market flip' },
  { slot: 21, type: 'SFR', price: '$500K-$700K', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Mid-market quality reno' },
  { slot: 22, type: 'SFR', price: '$700K-$1.2M', scoreRange: '3-4', tier: 'T2', anchor: 'Y', purpose: 'Under-improved upper-mid' },
  { slot: 23, type: 'SFR', price: '$700K-$1.2M', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Upper-mid standard flip (gap-fill)' },
  { slot: 24, type: 'SFR', price: '$700K-$1.2M', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Upper-mid quality reno' },
  { slot: 25, type: 'SFR', price: '$700K-$1.2M', scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Upper-mid magazine-quality' },
  { slot: 26, type: 'SFR', price: '$1.2M-$2.5M', scoreRange: '1-2', tier: 'T1', anchor: 'Y', purpose: 'Dated expensive home' },
  { slot: 27, type: 'SFR', price: '$1.2M-$2.5M', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Luxury standard flip (gap-fill)' },
  { slot: 28, type: 'SFR', price: '$1.2M-$2.5M', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Luxury quality reno' },
  { slot: 29, type: 'SFR', price: '$1.2M-$2.5M', scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Luxury full custom' },
  { slot: 30, type: 'SFR', price: '$1.2M-$2.5M', scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Luxury full custom (different style)' },
  // Townhouse (6)
  { slot: 31, type: 'Townhouse', price: '$250K-$400K', scoreRange: '1-2', tier: 'T1', anchor: '',  purpose: 'Entry TH baseline' },
  { slot: 32, type: 'Townhouse', price: '$250K-$400K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Entry TH flip' },
  { slot: 33, type: 'Townhouse', price: '$250K-$400K', scoreRange: '7-8', tier: 'T4', anchor: 'Y', purpose: 'Over-improved entry TH' },
  { slot: 34, type: 'Townhouse', price: '$400K-$550K', scoreRange: '3-4', tier: 'T2', anchor: '',  purpose: 'Mid TH partial update' },
  { slot: 35, type: 'Townhouse', price: '$400K-$550K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Mid TH flip' },
  { slot: 36, type: 'Townhouse', price: '$550K-$650K', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Upper TH quality reno' },
  // Ultra-Lux (5)
  { slot: 37, type: 'Ultra-Lux', price: '$2.5M-$3.5M', scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Ultra-lux renovated/new' },
  { slot: 38, type: 'Ultra-Lux', price: '$2.5M-$3.5M', scoreRange: '1-2', tier: 'T1', anchor: 'Y', purpose: 'Dated PV estate (king anchor)' },
  { slot: 39, type: 'Ultra-Lux', price: '$2.5M-$3.5M', scoreRange: '7-8', tier: 'T4', anchor: '',  purpose: 'Entry ultra-lux quality reno' },
  { slot: 40, type: 'Ultra-Lux', price: '$3.5M-$5M',   scoreRange: '9-10', tier: 'T5', anchor: '',  purpose: 'Ultra-lux architectural statement' },
  { slot: 41, type: 'Ultra-Lux', price: '$3.5M-$5M',   scoreRange: '7-8', tier: 'T4', anchor: 'Y', purpose: 'Nice but not bespoke at $4M' },
  // Multifamily (12)
  { slot: 42, type: 'Duplex',        price: '$250K-$350K', perDoor: '$125K-$175K', scoreRange: '1-2', tier: 'T1', anchor: '',  purpose: 'Multifamily baseline (1960s original)' },
  { slot: 43, type: 'Duplex',        price: '$300K-$400K', perDoor: '$150K-$200K', scoreRange: '3-4', tier: 'T2', anchor: '',  purpose: 'Paint-and-patch minimum' },
  { slot: 44, type: 'Fourplex',      price: '$350K-$500K', perDoor: '$88K-$125K',  scoreRange: '1-3', tier: 'T1', anchor: '',  purpose: 'Distressed fourplex' },
  { slot: 45, type: 'Fourplex',      price: '$500K-$750K', perDoor: '$125K-$188K', scoreRange: '4-5', tier: 'T2-3', anchor: '', purpose: 'Standard rental flip (highest volume)' },
  { slot: 46, type: 'Duplex',        price: '$350K-$500K', perDoor: '$175K-$250K', scoreRange: '5-6', tier: 'T3', anchor: '',  purpose: 'Owner vs. rental split (5-6 boundary)' },
  { slot: 47, type: 'Fourplex',      price: '$800K-$1.2M', perDoor: '$200K-$300K', scoreRange: '1-3', tier: 'T1', anchor: 'Y', purpose: 'Expensive fourplex, terrible interiors' },
  { slot: 48, type: 'Duplex',        price: '$250K-$325K', perDoor: '$125K-$163K', scoreRange: '6-7', tier: 'T3-4', anchor: 'Y', purpose: 'Cheap duplex, surprisingly nice' },
  { slot: 49, type: 'Triplex',       price: '$450K-$700K', perDoor: '$150K-$233K', scoreRange: '6-7', tier: 'T3', anchor: '',  purpose: 'Triplex coverage / 6-7 boundary' },
  { slot: 50, type: 'Fourplex',      price: '$550K-$900K', perDoor: '$138K-$225K', scoreRange: '4-5', tier: 'T2-3', anchor: '', purpose: 'Exterior-only renovation' },
  { slot: 51, type: 'Sm. Apt Bldg',  price: '$800K-$2M',   perDoor: '$100K-$200K', scoreRange: '4-5', tier: 'T2-3', anchor: '', purpose: 'Bulk renovation repetition test' },
  { slot: 52, type: 'Duplex (custom)', price: '$500K-$800K', perDoor: '$250K-$400K', scoreRange: '7-9', tier: 'T4-5', anchor: '', purpose: 'Multifamily luxury ceiling' },
  { slot: 53, type: 'Fourplex',      price: '$550K-$900K', perDoor: '$138K-$225K', scoreRange: '2-5', tier: 'Mixed', anchor: '', purpose: 'Mixed condition per-unit scoring' },
];

// ── Styling constants ─────────────────────────────────────────────────
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const ANCHOR_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
const TIER_COLORS = {
  T1:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } },
  T2:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } },
  T3:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } },
  T4:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } },
  T5:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } },
};
const GROUND_TRUTH_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
const THIN_BORDER = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GS CRM - Calibration v2';
  wb.created = new Date();

  // ════════════════════════════════════════════════════════════════════
  // Sheet 1: Calibration Data (55 slots)
  // ════════════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Calibration Data', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  // Column definitions matching v1 structure, expanded for multifamily
  ws.columns = [
    { header: 'A', key: 'slot',         width: 6 },
    { header: 'B', key: 'dwellingType', width: 16 },
    { header: 'C', key: 'priceRange',   width: 16 },
    { header: 'D', key: 'targetTier',   width: 10 },
    { header: 'E', key: 'targetScore',  width: 12 },
    { header: 'F', key: 'purpose',      width: 42 },
    { header: 'G', key: 'biasAnchor',   width: 10 },
    // MLS data (user fills)
    { header: 'H', key: 'mlsNumber',    width: 14 },
    { header: 'I', key: 'address',      width: 36 },
    { header: 'J', key: 'city',         width: 16 },
    { header: 'K', key: 'zip',          width: 10 },
    { header: 'L', key: 'listPrice',    width: 14 },
    { header: 'M', key: 'perDoor',      width: 14 },
    { header: 'N', key: 'sqft',         width: 10 },
    { header: 'O', key: 'yearBuilt',    width: 10 },
    { header: 'P', key: 'bedsBaths',    width: 12 },
    { header: 'Q', key: 'units',        width: 8 },
    // Ground truth (rater fills)
    { header: 'R', key: 'renoScore',    width: 14 },
    { header: 'S', key: 'renoYearEst',  width: 14 },
    { header: 'T', key: 'kitchenScore', width: 14 },
    { header: 'U', key: 'bathScore',    width: 14 },
    { header: 'V', key: 'exteriorScore', width: 14 },
    { header: 'W', key: 'designCohesion', width: 16 },
    // Notes
    { header: 'X', key: 'keyIndicators', width: 48 },
    { header: 'Y', key: 'photoKitchen', width: 12 },
    { header: 'Z', key: 'photoBath',    width: 12 },
    { header: 'AA', key: 'photoExterior', width: 12 },
    { header: 'AB', key: 'photoOther',  width: 12 },
    { header: 'AC', key: 'url',         width: 36 },
  ];

  // Row 1: Group headers
  const groupRow = ws.getRow(1);
  const groups = [
    { start: 1, end: 7, label: 'SHOPPING LIST (Pre-filled)', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } } },
    { start: 8, end: 17, label: 'MLS DATA (User fills from FlexMLS)', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } } },
    { start: 18, end: 23, label: 'GROUND TRUTH (Rater scores)', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } } },
    { start: 24, end: 29, label: 'NOTES & VALIDATION', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } } },
  ];
  for (const g of groups) {
    ws.mergeCells(1, g.start, 1, g.end);
    const cell = ws.getCell(1, g.start);
    cell.value = g.label;
    cell.fill = g.fill;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  groupRow.height = 28;

  // Row 2: Column headers
  const headers = [
    'Slot', 'Dwelling Type', 'Price Range', 'Target Tier', 'Target Score', 'Purpose', 'Bias Anchor?',
    'MLS #', 'Full Address', 'City', 'ZIP', 'List Price', 'Per Door', 'SqFt', 'Year Built', 'Beds/Baths', 'Units',
    'RENO SCORE (1-10)', 'Reno Year Est.', 'Kitchen (1-10)', 'Bath (1-10)', 'Exterior (1-10)', 'Design Cohesion (1-10)',
    'Key Indicators / Notes', 'Photo: Kitchen?', 'Photo: Bath?', 'Photo: Exterior?', 'Photo: Other?', 'Listing URL',
  ];
  const headerRow = ws.getRow(2);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 36;

  // Data rows (starting row 3)
  let currentSection = '';
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const rowNum = i + 3;
    const isMultifamily = ['Duplex', 'Triplex', 'Fourplex', 'Sm. Apt Bldg', 'Duplex (custom)'].includes(s.type);
    const dwellingGroup = isMultifamily ? 'Multifamily' : s.type;

    // Section separator
    if (dwellingGroup !== currentSection) {
      currentSection = dwellingGroup;
    }

    const row = ws.getRow(rowNum);
    row.getCell(1).value = s.slot;
    row.getCell(2).value = s.type;
    row.getCell(3).value = s.price;
    row.getCell(4).value = s.tier;
    row.getCell(5).value = s.scoreRange;
    row.getCell(6).value = s.purpose;
    row.getCell(7).value = s.anchor || '';
    // MLS columns (8-17) left blank for user
    if (isMultifamily && s.perDoor) {
      row.getCell(13).value = s.perDoor; // Per Door hint
    }

    // Tier color for the tier column
    const baseTier = s.tier.split('-')[0]; // handle T2-3, T3-4, T4-5
    if (TIER_COLORS[baseTier]) {
      row.getCell(4).fill = TIER_COLORS[baseTier];
    }

    // Anchor highlight
    if (s.anchor === 'Y') {
      row.getCell(7).fill = ANCHOR_FILL;
      row.getCell(7).font = { bold: true };
    }

    // Ground truth columns get green tint
    for (let c = 18; c <= 23; c++) {
      row.getCell(c).fill = GROUND_TRUTH_FILL;
    }

    // Photo checklist columns — Y/N dropdowns
    for (let c = 25; c <= 28; c++) {
      row.getCell(c).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Y,N"'],
      };
    }

    // Score validation (1-10) for R, T, U, V, W
    for (const c of [18, 20, 21, 22, 23]) {
      row.getCell(c).dataValidation = {
        type: 'whole',
        operator: 'between',
        allowBlank: true,
        formulae: [1, 10],
        showErrorMessage: true,
        errorTitle: 'Invalid Score',
        error: 'Score must be an integer between 1 and 10',
      };
    }

    // Year validation for S (reno year est)
    row.getCell(19).dataValidation = {
      type: 'whole',
      operator: 'between',
      allowBlank: true,
      formulae: [1950, 2030],
      showErrorMessage: true,
      errorTitle: 'Invalid Year',
      error: 'Year must be between 1950 and 2030',
    };

    // Borders for all cells
    for (let c = 1; c <= 29; c++) {
      row.getCell(c).border = THIN_BORDER;
      row.getCell(c).alignment = { vertical: 'middle', wrapText: c === 6 || c === 24 };
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // Sheet 2: Scoring Rubric
  // ════════════════════════════════════════════════════════════════════
  const rubric = wb.addWorksheet('Scoring Rubric');

  const rubricData = [
    ['Score', 'Label', 'Key Visual Markers'],
    ['1-2', 'Original / Dated', 'Honey oak cabinets, brass fixtures, popcorn ceilings, post-form laminate counters, almond fiberglass tub surround, 12x12 almond ceramic tile, coil-top range'],
    ['3-4', 'Partial Update', '1-2 rooms updated (usually kitchen), mismatched finishes, new paint but original cabinets/fixtures, fresh carpet over original tile'],
    ['5-6', 'Full Cosmetic Flip', 'White shaker cabinets (builder-grade), quartz or granite counters, LVP flooring throughout, subway tile backsplash, brushed nickel fixtures, stainless appliances'],
    ['7-8', 'High-Quality Reno', 'Custom cabinets, designer tile (zellige, large-format), upgraded appliances (5-burner, French door), frameless glass shower, matte black or brushed brass fixtures'],
    ['9-10', 'Luxury / Custom', 'Architect-designed, waterfall edge counters, professional-range appliances, smart home visible, premium natural stone, custom millwork'],
  ];

  rubricData.forEach((rowData, ri) => {
    const row = rubric.getRow(ri + 1);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
      }
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
  rubric.getColumn(1).width = 10;
  rubric.getColumn(2).width = 22;
  rubric.getColumn(3).width = 90;

  // Era fingerprints
  rubric.getRow(9).getCell(1).value = 'ERA FINGERPRINTS';
  rubric.getRow(9).getCell(1).font = { bold: true, size: 12 };

  const eras = [
    ['Era', 'Period', 'Visual Signature'],
    ['Brass Era', 'Pre-1998', 'Honey oak, brass hardware, almond tile, laminate counters, popcorn ceilings'],
    ['Travertine Era', '1999-2008', 'Espresso cabinets, granite counters, travertine floors, oil-rubbed bronze'],
    ['Gray Transition', '2009-2015', 'White shaker begins, quartz begins, gray ceramic tile, brushed nickel'],
    ['Current Flip', '2016-present', 'White/gray shaker, quartz, LVP, matte black hardware, subway tile'],
    ['Emerging Luxury', '2023+', 'White oak, brushed brass/gold, fluted details, natural stone, smart home'],
  ];

  eras.forEach((rowData, ri) => {
    const row = rubric.getRow(ri + 10);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
      }
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // Anti-bias warnings
  rubric.getRow(18).getCell(1).value = 'ANTI-BIAS RULES';
  rubric.getRow(18).getCell(1).font = { bold: true, size: 12 };
  const rules = [
    'Score ONLY hard finishes. Ignore staging, furniture, art, decor.',
    'Same materials = same score regardless of property price.',
    'A $1.3M home with builder-grade finishes scores the same as a $300K home with identical finishes.',
    'Do not inflate scores for HDR photography or wide-angle lens distortion.',
    'If fewer than 4 rooms visible: confidence = "low". No kitchen shown: reduce confidence.',
  ];
  rules.forEach((r, i) => {
    rubric.getRow(19 + i).getCell(1).value = `${i + 1}.`;
    rubric.getRow(19 + i).getCell(2).value = r;
    rubric.mergeCells(19 + i, 2, 19 + i, 3);
  });

  // ════════════════════════════════════════════════════════════════════
  // Sheet 3: Room Weights & NOI Table
  // ════════════════════════════════════════════════════════════════════
  const weights = wb.addWorksheet('Room Weights & NOI');

  // Room weights - residential
  weights.getRow(1).getCell(1).value = 'RESIDENTIAL ROOM WEIGHTS';
  weights.getRow(1).getCell(1).font = { bold: true, size: 12 };

  const resWeights = [
    ['Room', 'Weight', 'Notes'],
    ['Kitchen', '35%', 'Highest impact on perceived value'],
    ['Primary Bath', '25%', 'Second most impactful room'],
    ['Flooring', '15%', 'Throughout — consistency matters'],
    ['Exterior', '10%', 'Curb appeal, roof condition'],
    ['Secondary Bath', '10%', 'Often neglected in partial flips'],
    ['General Finishes', '5%', 'Light fixtures, hardware, paint'],
  ];
  resWeights.forEach((rowData, ri) => {
    const row = weights.getRow(ri + 2);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; }
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // Room weights - multifamily
  weights.getRow(10).getCell(1).value = 'MULTIFAMILY ROOM WEIGHTS';
  weights.getRow(10).getCell(1).font = { bold: true, size: 12 };

  const mfWeights = [
    ['Room', 'Weight', 'Notes'],
    ['Kitchen', '30%', 'Slightly lower — rental-grade is expected'],
    ['Primary Bath', '20%', 'Functional matters more than luxury'],
    ['Flooring', '15%', 'Durability matters (LVP > carpet)'],
    ['Exterior', '25%', 'Higher weight — shared curb appeal, parking, roof'],
    ['Secondary Bath', '5%', 'Often identical to primary in rentals'],
    ['General Finishes', '5%', 'Light fixtures, hardware, paint'],
  ];
  mfWeights.forEach((rowData, ri) => {
    const row = weights.getRow(ri + 11);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; }
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // NOI Multiplier Table
  weights.getRow(20).getCell(1).value = 'NOI 2D MULTIPLIER TABLE (Score x Renovation Recency)';
  weights.getRow(20).getCell(1).font = { bold: true, size: 12 };
  weights.mergeCells(20, 1, 20, 4);

  const noiData = [
    ['Score', 'Fresh (0-3yr)', 'Mid (4-10yr)', 'Dated (11+yr)'],
    ['1-2', '0.45%', '0.45%', '0.45%'],
    ['3-4', '0.50%', '0.48%', '0.46%'],
    ['5-6', '0.58%', '0.55%', '0.50%'],
    ['7-8', '0.65%', '0.60%', '0.53%'],
    ['9-10', '0.70%', '0.65%', '0.55%'],
  ];
  noiData.forEach((rowData, ri) => {
    const row = weights.getRow(ri + 21);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; }
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  // Renovation cost table
  weights.getRow(29).getCell(1).value = 'SCALED IMPROVEMENT COSTS';
  weights.getRow(29).getCell(1).font = { bold: true, size: 12 };

  const costData = [
    ['Starting Score', 'Cost Per Point', 'Example: +3 points'],
    ['1-2', '$4,000-$5,000/pt', 'Score 2->5: ~$16K'],
    ['3-4', '$7,000-$10,000/pt', 'Score 4->7: ~$27K'],
    ['5-6', '$15,000-$20,000/pt', 'Score 5->8: ~$55K'],
    ['7-8', '$30,000-$45,000/pt', 'Score 7->10: ~$135K'],
  ];
  costData.forEach((rowData, ri) => {
    const row = weights.getRow(ri + 30);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; }
      cell.alignment = { vertical: 'middle' };
    });
  });

  weights.getColumn(1).width = 20;
  weights.getColumn(2).width = 20;
  weights.getColumn(3).width = 20;
  weights.getColumn(4).width = 30;

  // ════════════════════════════════════════════════════════════════════
  // Sheet 4: Bias Anchors Reference
  // ════════════════════════════════════════════════════════════════════
  const anchors = wb.addWorksheet('Bias Anchors (10)');

  const anchorData = [
    ['Slot', 'Type', 'Price / Tier', 'Tests', 'Trap'],
    [3,  'Apartment', '$100K-$200K, T4', 'Over-improved cheap unit', '"Nice for the price"'],
    [10, 'Apartment', '$900K-$1.5M, T1', 'Dated luxury high-rise', '"Expensive high-rise must be nice"'],
    [18, 'SFR', '$350K-$500K, T4', 'Over-improved entry SFR', '"Cheap house can\'t be nice"'],
    [22, 'SFR', '$700K-$1.2M, T2', 'Under-improved upper-mid', '"Expensive = renovated"'],
    [26, 'SFR', '$1.2M-$2.5M, T1', 'Dated expensive home', '"Million-dollar home must be nice"'],
    [33, 'Townhouse', '$250K-$400K, T4', 'Over-improved entry TH', '"Townhouse can\'t be high-quality"'],
    [38, 'Ultra-Lux', '$2.5M-$3.5M, T1', 'Dated PV estate', 'King anchor: estate != interior quality'],
    [41, 'Ultra-Lux', '$3.5M-$5M, T4', 'Nice but not bespoke at $4M', '"Everything at $4M is a 10"'],
    [47, 'Fourplex', '$800K-$1.2M, T1', 'Expensive fourplex, terrible interiors', '"High price = renovated" in multifamily'],
    [48, 'Duplex', '$250K-$325K, T3-4', 'Cheap duplex, nice finishes', '"Cheap multifamily can\'t score well"'],
  ];

  anchorData.forEach((rowData, ri) => {
    const row = anchors.getRow(ri + 1);
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = THIN_BORDER;
      if (ri === 0) {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
      } else {
        cell.fill = ANCHOR_FILL;
      }
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
  anchors.getColumn(1).width = 8;
  anchors.getColumn(2).width = 16;
  anchors.getColumn(3).width = 22;
  anchors.getColumn(4).width = 42;
  anchors.getColumn(5).width = 42;

  // ════════════════════════════════════════════════════════════════════
  // Write file
  // ════════════════════════════════════════════════════════════════════
  await wb.xlsx.writeFile(OUTPUT);
  console.log(`Written: ${OUTPUT}`);
  console.log(`Slots: ${slots.length}`);
  console.log(`Bias anchors: ${slots.filter(s => s.anchor === 'Y').length}`);
  console.log(`Sheets: ${wb.worksheets.map(s => s.name).join(', ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
