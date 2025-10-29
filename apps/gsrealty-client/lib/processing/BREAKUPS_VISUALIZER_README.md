# ReportIt Break-ups Visualizer

## Overview

The Break-ups Visualizer generates PNG charts for all 22 comparative property analyses defined in the ReportIt Break-ups Analysis specification. It converts structured analysis data into professional, high-quality visualizations suitable for client reports.

## Quick Start

### Basic Usage

```typescript
import { generateAllVisualizations } from '@/lib/processing/breakups-visualizer';
import { BreakupsAnalysisResult } from '@/lib/types/breakups-analysis';

// Get analysis results from breakups-generator.ts
const analysisResults: BreakupsAnalysisResult = await generateBreakupsAnalysis(properties);

// Generate all 22 visualizations
const outputDir = `/tmp/reportit/breakups/${fileId}/charts`;
const result = await generateAllVisualizations(analysisResults, outputDir);

console.log(`Generated ${result.successfulCharts} of ${result.totalCharts} charts`);
```

### Individual Chart Generation

```typescript
import {
  generatePieChart,
  generateBarChart,
  generateLineChart,
  generateScatterPlot,
} from '@/lib/processing/breakups-visualizer';

// Pie chart
await generatePieChart(
  { labels: ['2 BR', '3 BR', '4 BR'], values: [5, 15, 20] },
  'Bedroom Distribution',
  '/tmp/pie-chart.png'
);

// Bar chart
await generateBarChart(
  {
    labels: ['Active', 'Pending', 'Closed'],
    datasets: [{ label: 'Count', data: [25, 10, 40] }],
  },
  'Market Status',
  '/tmp/bar-chart.png'
);

// Line chart
await generateLineChart(
  {
    labels: ['T-36', 'T-24', 'T-12', 'Now'],
    datasets: [{ label: 'Avg Price', data: [330000, 345000, 360000, 375000] }],
  },
  'Price Trend',
  '/tmp/line-chart.png'
);

// Scatter plot
await generateScatterPlot(
  {
    datasets: [
      { label: 'Comps', data: [{ x: 350000, y: 2000 }, { x: 375000, y: 2100 }] },
    ],
  },
  'Comps Analysis',
  '/tmp/scatter-plot.png',
  'Price ($)',
  'Square Feet'
);
```

## Technology Stack

### QuickChart.js

The visualizer uses **QuickChart.js** for server-side chart generation:

- **No browser required**: Generates charts via API
- **Chart.js compatible**: Uses familiar Chart.js configuration
- **PNG export**: Saves directly to file
- **High quality**: Configurable dimensions and resolution

### Why QuickChart?

1. **Simple**: No native dependencies to compile (unlike node-canvas)
2. **Reliable**: Battle-tested API with excellent uptime
3. **Compatible**: Works with Chart.js syntax developers already know
4. **Flexible**: Supports all required chart types

## Chart Specifications

### Dimensions & Quality

```typescript
const CHART_CONFIG = {
  width: 1200,
  height: 800,
  dpi: 300, // High-quality for printing
  backgroundColor: '#FFFFFF',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 14,
};
```

### Color Scheme

```typescript
const CHART_COLORS = {
  positive: '#059669',  // Green - positive metrics
  negative: '#DC2626',  // Red - negative metrics
  neutral: '#64748B',   // Gray - neutral data
  primary: '#1E40AF',   // Blue - primary data
  secondary: '#F59E0B', // Amber - secondary data
};
```

### File Naming Convention

Charts are saved with the following naming pattern:

```
analysis_{number}_{name}.png
```

Examples:
- `analysis_01_br_distribution.png`
- `analysis_02_hoa_vs_non_hoa.png`
- `analysis_12_time_frame_analysis.png`
- `analysis_21_expected_noi.png`

## 22 Analysis Visualizations

| # | Analysis Name | Chart Type | Description |
|---|---------------|------------|-------------|
| 1 | BR Distribution | Pie | Bedroom count distribution |
| 2 | HOA vs Non-HOA | Bar | HOA impact comparison |
| 3 | STR vs Non-STR | Pie | Short-term rental eligibility |
| 4 | Renovation Impact | Bar | Renovation score analysis |
| 5 | Comps Classification | Scatter | Comp vs non-comp clustering |
| 6 | SQFT Variance | Scatter | Square footage variance |
| 7 | Price Variance | Bar | Price variance distribution |
| 8 | Lease vs Sale | Bar | Rental vs sale pricing |
| 9 | PropertyRadar Comps | Bar | PropertyRadar comp comparison |
| 10 | Individual PR Comps | Bar | Individual comp similarity |
| 11 | BR Precision | Bar | Bedroom match precision |
| 12 | Time Frame Analysis | Line | T-36 vs T-12 trends |
| 13 | Direct vs Indirect | Bar | Direct vs 1.5mi comps |
| 14 | Recent Direct/Indirect | Line | Recent comp activity |
| 15 | Active vs Closed | Bar | Market inventory status |
| 16 | Active vs Pending | Bar | Market pipeline |
| 17 | Renovation Delta | Bar (Waterfall) | Renovation ROI |
| 18 | Partial Renovation Delta | Bar (Waterfall) | Partial renovation ROI |
| 19 | Interquartile Range | Bar (BoxPlot) | Middle 50% analysis |
| 20 | Distribution Tails | Bar (BoxPlot) | Extreme value analysis |
| 21 | Expected NOI | Bar (Dashboard) | NOI projections |
| 22 | Improved NOI | Bar (Dashboard) | Improvement ROI |

## API Reference

### `generateAllVisualizations()`

Generates all 22 visualizations from complete analysis results.

**Parameters:**
- `analysisResults: BreakupsAnalysisResult` - Complete analysis results
- `outputDir: string` - Directory to save PNG files

**Returns:** `Promise<VisualizationResult>`

**Example:**
```typescript
const result = await generateAllVisualizations(analysisResults, outputDir);
```

### `generatePieChart()`

Generate a pie chart.

**Parameters:**
- `data: { labels: string[]; values: number[] }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

### `generateBarChart()`

Generate a bar chart.

**Parameters:**
- `data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

### `generateLineChart()`

Generate a line chart.

**Parameters:**
- `data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

### `generateScatterPlot()`

Generate a scatter plot.

**Parameters:**
- `data: { datasets: Array<{ label: string; data: Array<{ x: number; y: number }> }> }`
- `title: string`
- `outputPath: string`
- `xLabel: string` (optional)
- `yLabel: string` (optional)

**Returns:** `Promise<boolean>`

### `generateBoxPlot()`

Generate a box plot (approximated with bar chart).

**Parameters:**
- `data: { labels: string[]; quartiles: Array<{ q25: number; median: number; q75: number }> }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

### `generateWaterfallChart()`

Generate a waterfall chart (approximated with bar chart).

**Parameters:**
- `data: { labels: string[]; values: number[] }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

### `generateDashboard()`

Generate a dashboard (multi-metric display as grouped bar chart).

**Parameters:**
- `data: { metrics: Array<{ label: string; value: number; color?: string }> }`
- `title: string`
- `outputPath: string`

**Returns:** `Promise<boolean>`

## Data Types

### `VisualizationResult`

```typescript
interface VisualizationResult {
  success: boolean;
  outputDir: string;
  charts: SingleVisualizationResult[];
  totalCharts: number;
  successfulCharts: number;
  failedCharts: number;
  errors: string[];
  processingTime: number; // milliseconds
}
```

### `SingleVisualizationResult`

```typescript
interface SingleVisualizationResult {
  analysisNumber: number;
  analysisName: string;
  chartType: string;
  filePath: string;
  width: number;
  height: number;
  dpi: number;
  success: boolean;
  error?: string;
}
```

## Error Handling

The visualizer handles errors gracefully:

1. **Individual failures**: If one chart fails, others continue
2. **Detailed errors**: Each failure includes analysis number and error message
3. **Partial success**: Returns success metrics even with some failures

**Example error handling:**
```typescript
const result = await generateAllVisualizations(analysisResults, outputDir);

if (!result.success) {
  console.error(`Failed to generate ${result.failedCharts} charts:`);
  result.errors.forEach(error => console.error(`  - ${error}`));
}

// Process successful charts
result.charts
  .filter(chart => chart.success)
  .forEach(chart => {
    console.log(`Generated: ${chart.filePath}`);
  });
```

## Integration with ReportIt Pipeline

### Pipeline Flow

```
1. Upload CSV/Excel files
   ↓
2. Parse and validate data
   ↓
3. Generate analysis (breakups-generator.ts)
   ↓
4. Generate visualizations (breakups-visualizer.ts) ← YOU ARE HERE
   ↓
5. Create Excel report
   ↓
6. Package as .zip
   ↓
7. Deliver to client
```

### Usage in API Route

```typescript
// app/api/admin/reportit/generate/route.ts
import { generateBreakupsAnalysis } from '@/lib/processing/breakups-generator';
import { generateAllVisualizations } from '@/lib/processing/breakups-visualizer';

export async function POST(request: Request) {
  const { fileId, properties } = await request.json();

  // Step 1: Generate analyses
  const analysisResults = await generateBreakupsAnalysis(properties);

  // Step 2: Generate visualizations
  const outputDir = `/tmp/reportit/breakups/${fileId}/charts`;
  const vizResult = await generateAllVisualizations(analysisResults, outputDir);

  if (!vizResult.success) {
    return Response.json({
      error: 'Failed to generate some visualizations',
      details: vizResult.errors,
    }, { status: 500 });
  }

  // Step 3: Continue with report generation...
  return Response.json({
    success: true,
    chartCount: vizResult.successfulCharts,
    outputDir: vizResult.outputDir,
  });
}
```

## Testing

### Run Examples

```bash
# In your app directory
cd apps/gsrealty-client

# Run example test
npx tsx lib/processing/__tests__/breakups-visualizer.example.ts
```

### Manual Testing

```typescript
import { exampleGenerateAll } from './lib/processing/__tests__/breakups-visualizer.example';

// Generate all charts with sample data
const result = await exampleGenerateAll();
console.log(`Generated ${result.successfulCharts} charts`);
```

## Troubleshooting

### Charts not generating

1. **Check network connectivity**: QuickChart requires internet access
2. **Verify data structure**: Ensure analysis results match expected types
3. **Check output directory**: Ensure write permissions

### Poor chart quality

1. **Increase dimensions**: Adjust `CHART_CONFIG.width` and `CHART_CONFIG.height`
2. **Font size**: Increase `fontSize` in chart options
3. **DPI setting**: Note that DPI is informational; actual quality depends on pixel dimensions

### API rate limits

QuickChart.js free tier has rate limits. For production:
1. Consider upgrading to QuickChart Pro
2. Implement caching for repeated charts
3. Add retry logic with exponential backoff

## Performance

### Benchmarks

- **Single chart**: ~500-1000ms (network dependent)
- **All 22 charts**: ~15-20 seconds
- **File size**: ~50-200KB per PNG

### Optimization Tips

1. **Parallel generation**: Generate multiple charts concurrently
2. **Caching**: Cache charts for identical data
3. **Progressive loading**: Generate critical charts first

## Future Enhancements

Potential improvements for future versions:

1. **Offline rendering**: Migrate to node-canvas for no-network operation
2. **SVG export**: Add vector format option for scalability
3. **Interactive charts**: Generate HTML/JavaScript versions
4. **Custom themes**: Support multiple color schemes
5. **Animation**: Add animated GIF/MP4 export for presentations
6. **Batch optimization**: Parallel chart generation

## Dependencies

```json
{
  "quickchart-js": "^3.1.3"
}
```

## Related Files

- **Type definitions**: `lib/types/breakups-analysis.ts`
- **Analysis generator**: `lib/processing/breakups-generator.ts` (to be created)
- **Specification**: `DOCUMENTATION/REPORTIT_BREAKUPS_ANALYSIS.md`
- **Examples**: `lib/processing/__tests__/breakups-visualizer.example.ts`

## Support

For questions or issues:
1. Check the specification: `REPORTIT_BREAKUPS_ANALYSIS.md`
2. Review examples in `__tests__/breakups-visualizer.example.ts`
3. Consult QuickChart documentation: https://quickchart.io/documentation/

## License

Part of the GSRealty Client Management System - ReportIt Feature.
