# ReportIt Pipeline Documentation

**Project:** GSRealty Client Management System - ReportIt Feature
**Purpose:** Complete 9-step pipeline workflow documentation
**Created:** October 23, 2024
**Version:** 1.0

---

## Pipeline Overview

The ReportIt pipeline transforms raw property data through a systematic 9-step process, from initial property identification to comprehensive analysis report generation. Each step builds upon the previous, creating a robust property evaluation system.

```
┌─────────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Step 1    │────▶│  Step 2  │────▶│  Step 3  │────▶│  Step 4  │
│Property ID  │     │MLS Upload│     │MLS Upload│     │ Download │
└─────────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
┌─────────────┐     ┌──────────┐     ┌──────────┐           ▼
│   Step 9    │◀────│  Step 8  │◀────│  Step 7  │◀────│  Step 6  │◀────│  Step 5  │
│  Download   │     │  Upload  │     │ ReportIt │     │  Place  │     │ Manual  │
│    .zip     │     │          │     │   Page   │     │  Local  │     │  Entry  │
└─────────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## Detailed Step Specifications

### Step 1: Subject Property Identification

**Purpose:** Establish the target property for analysis

**Process:**
1. **Admin Navigation:** `/admin/clients`
2. **Client Selection:** Choose client (e.g., "Mozingo")
3. **Property Input:**
   - Enter APN (Assessor Parcel Number)
   - OR enter Full Address
4. **UI Account Assignment:** Link property to client account

**Data Captured:**
```javascript
{
  clientId: "uuid-123",
  clientName: "Mozingo",
  propertyIdentifier: {
    apn: "173-35-524",
    fullAddress: "4600 N 68TH ST UNIT 371, SCOTTSDALE, AZ 85251"
  },
  timestamp: "2024-10-23T14:30:00Z"
}
```

**Validation:**
- APN format: XXX-XX-XXX(X)
- Address must be in Maricopa County
- Client must exist in system

**UI Elements:**
- Client dropdown selector
- APN input field with format validation
- Address autocomplete (Google Maps API)
- "Begin Analysis" button

---

### Step 2: MLS 1.5-Mile Comps Upload

**Purpose:** Upload comparable sales within 1.5-mile radius

**Process:**
1. **Navigate to Upload MLS Interface** (`/admin/upload`)
2. **Section 3: 1.5 Mile Comps**
3. **Upload Two Files:**
   - a. Residential 1.5mile-comps.csv
   - b. Residential Lease 1.5mile-comps.csv

**MLS Search Parameters:**
```
a. Residential 1.5mile-comps:
- Radius: 1.5 miles from subject
- Status: Closed, Active, Coming Soon, Pending, Cancelled, Accepting Backups
- Time: T-12 months
- Bedrooms: +/- 1 from subject
- Bathrooms: +/- 1 from subject
- Square Footage: +/- 20% from subject
- Lot Size: +/- 20% from subject

b. Residential Lease 1.5mile-comps:
- Same parameters as above
- Property type: Rental/Lease
```

**File Processing:**
```javascript
async function process15MileComps(residentialFile, leaseFile) {
  // Run health check
  const healthCheck = await validateMLSHeaders(residentialFile);
  if (!healthCheck.valid) {
    notifyUser(healthCheck.discrepancies);
  }

  // Parse CSV files
  const residentialData = await parseCSV(residentialFile);
  const leaseData = await parseCSV(leaseFile);

  // Combine and tag source
  const combined = [
    ...residentialData.map(row => ({...row, source: '1.5mi-residential'})),
    ...leaseData.map(row => ({...row, source: '1.5mi-lease'}))
  ];

  return combined;
}
```

**Health Check Alert:**
- Automatic validation on upload
- UI notification if field headers changed
- Option to proceed or abort

---

### Step 3: MLS Direct Subdivision Comps Upload

**Purpose:** Upload direct comparable sales from same subdivision

**Process:**
1. **Select Upload Type:** "3yr-direct-subdivision-comps"
2. **Upload Two Files:**
   - Residential 3yr-direct-subdivision-comps.csv
   - Residential Lease 3yr-direct-subdivision-comps.csv

**MLS Search Parameters:**
```
Residential:
- Location: Same HOA Name or Subdivision
- Status: All (Closed, Active, Coming Soon, Pending, Cancelled, Accepting Backups)
- Time: T-36 months (3 years)
- Bedrooms: +/- 1 from subject
- Bathrooms: +/- 1 from subject
- Square Footage: +/- 25% from subject
- Lot Size: +/- 25% from subject

Residential Lease:
- Same parameters as above
- Property type: Rental/Lease
```

**Data Integration:**
```javascript
async function processDirectComps(residentialFile, leaseFile) {
  const residentialData = await parseCSV(residentialFile);
  const leaseData = await parseCSV(leaseFile);

  // Tag with source identifier
  const combined = [
    ...residentialData.map(row => ({...row, source: 'direct-residential'})),
    ...leaseData.map(row => ({...row, source: 'direct-lease'}))
  ];

  // Merge with existing 1.5mi data
  return mergeWithExisting(combined);
}
```

---

### Step 4: Download Initial Excel

**Purpose:** Generate and download combined data Excel file

**Process:**
1. **System Processing:**
   - Combine all 4 MLS uploads
   - Fetch MCAO data via API
   - Generate Analysis sheet (40 columns)
   - Create Excel workbook

2. **File Generation:**
```javascript
async function generateInitialExcel(clientName) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename = `Upload_${clientName}_${timestamp}.xlsx`;

  const workbook = new ExcelJS.Workbook();

  // Add sheets
  const mlsSheet = workbook.addWorksheet('MLS-Comps');
  const mcaoSheet = workbook.addWorksheet('Full-MCAO-API');
  const analysisSheet = workbook.addWorksheet('Analysis');

  // Populate MLS-Comps
  mlsSheet.columns = MLSColumns;
  mlsSheet.addRows(combinedMLSData);

  // Populate Full-MCAO-API
  mcaoSheet.columns = MCAOColumns;
  mcaoSheet.addRows(mcaoAPIResponse);

  // Generate Analysis sheet
  analysisSheet.columns = AnalysisColumns;
  analysisSheet.addRows(generateAnalysisData());

  // Note: Column R (RENOVATE_SCORE) left blank
  // Note: Columns S-AO (Property Radar) left blank

  await workbook.xlsx.writeFile(filename);
  return filename;
}
```

**Downloaded File Structure:**
```
Upload_Mozingo_2024-10-23-1430.xlsx
├── MLS-Comps (all 4 uploads combined)
├── Full-MCAO-API (API response data)
└── Analysis (40 columns, A-AO)
    - Column R: RENOVATE_SCORE (blank)
    - Columns S-AO: Property Radar fields (blank)
```

---

### Step 5: Manual Data Entry

**Purpose:** User manually adds renovation scores and Property Radar comps

**Process:**
1. **Open Downloaded Excel** in Excel/Google Sheets
2. **Navigate to Analysis Sheet**
3. **Manual Entry Tasks:**

**RENOVATE_SCORE (Column R):**
- Review each property
- Assign score based on condition:
  - "Y" = Fully renovated
  - "0.5" = Partially renovated
  - "N" = Not renovated

**PROPERTY_RADAR-COMP-Y-N (Column S):**
- Mark "Y" if property is a valid comp
- Mark "N" if not a valid comp

**Property Radar Comps (Columns AD-AO):**
- Enter up to 12 Property Radar comp addresses/APNs
- Format: Full address or APN

**Example Manual Entry:**
```
Column R (RENOVATE_SCORE): Y, N, 0.5, Y, N, ...
Column S (PR-COMP-Y-N): Y, Y, N, Y, N, ...
Column AD (PR-comp-1): "4620 N 68TH ST 155"
Column AE (PR-comp-2): "173-35-362"
...
```

**Time Estimate:** 15-30 minutes depending on property count

---

### Step 6: Place File in Pending-Bin

**Purpose:** Stage completed file for ReportIt processing

**Process:**
1. **Save Enhanced Excel:**
   - File → Save As
   - Rename: `Complete_Mozingo_2024-10-23-1430.xlsx`

2. **Navigate to Local Directory:**
```bash
cd /Users/garrettsullivan/Desktop/‼️/RE/Pending-Bin/
```

3. **Place File:**
   - Copy/Move file to Pending-Bin folder
   - Verify file is saved correctly

**Directory Structure:**
```
/RE/
├── Pending-Bin/
│   ├── Complete_Mozingo_2024-10-23-1430.xlsx
│   ├── Complete_Smith_2024-10-22-1015.xlsx
│   └── ...
└── Completed/
    └── (processed files moved here)
```

**File Validation:**
- Ensure RENOVATE_SCORE column has values
- Verify at least some Property Radar comps entered
- Check file naming convention

---

### Step 7: Launch ReportIt UI Page

**Purpose:** Access the ReportIt processing interface

**Process:**
1. **Navigate to ReportIt:** `/admin/reportit`
2. **UI Elements Displayed:**
   - Upload zone for Complete_*.xlsx files
   - Processing status indicator
   - Recent reports list
   - Download completed reports

**UI Interface:**
```typescript
interface ReportItPageProps {
  uploadZone: {
    acceptedFormats: ['.xlsx'],
    maxFileSize: '50MB',
    dragAndDrop: true
  },
  statusIndicator: {
    idle: 'Ready for upload',
    processing: 'Analyzing data...',
    complete: 'Report ready for download'
  },
  recentReports: Report[]
}
```

**Page Features:**
- Drag-and-drop upload area
- File validation before processing
- Real-time processing status
- Historical report access

---

### Step 8: Upload Complete Excel File

**Purpose:** Submit enhanced Excel for final processing

**Process:**
1. **Select File:**
   - Click "Choose File" or drag-and-drop
   - Browse to Pending-Bin
   - Select `Complete_Mozingo_2024-10-23-1430.xlsx`

2. **Validation Checks:**
```javascript
async function validateCompleteFile(file) {
  const workbook = await readExcel(file);
  const analysis = workbook.getWorksheet('Analysis');

  const checks = {
    hasRenovateScores: checkColumn(analysis, 'R'),
    hasPropertyRadarData: checkColumns(analysis, ['S', 'AD-AO']),
    hasRequiredSheets: ['MLS-Comps', 'Full-MCAO-API', 'Analysis'],
    dataIntegrity: validateDataIntegrity(analysis)
  };

  return checks.all(check => check === true);
}
```

3. **Processing Pipeline:**
```javascript
async function processReportIt(file) {
  // Step 1: Parse enhanced data
  const data = await parseCompleteFile(file);

  // Step 2: Run 22 break-ups analyses
  const analyses = await runAllBreakupsAnalyses(data);

  // Step 3: Generate visualizations
  const charts = await generateVisualizations(analyses);

  // Step 4: Create reports
  const reports = await generateReports(analyses, charts);

  // Step 5: Package into .zip
  const zipFile = await packageOutput(data, analyses, charts, reports);

  // Step 6: Move to Completed folder
  await moveToCompleted(file);

  return zipFile;
}
```

**Processing Status Updates:**
- "Uploading..." (0-10%)
- "Validating data..." (10-20%)
- "Running analyses..." (20-60%)
- "Generating visualizations..." (60-80%)
- "Creating reports..." (80-95%)
- "Packaging output..." (95-100%)
- "Complete! Ready for download"

---

### Step 9: Download Report Package

**Purpose:** Download comprehensive analysis package

**Process:**
1. **Download Trigger:**
   - Processing complete notification
   - "Download Report" button appears
   - Click to download .zip

2. **Package Contents:**
```
Break-ups-Mozingo.zip
├── Complete_ReportIt_Mozingo_2024-10-23-1430.xlsx
│   ├── MLS-Comps (enhanced)
│   ├── Full-MCAO-API (complete)
│   ├── Analysis (all fields populated)
│   └── Break-ups Summary (new sheet with all 22 analyses)
│
├── visualizations/
│   ├── 01_br_distribution.png
│   ├── 02_hoa_comparison.png
│   ├── 03_str_analysis.png
│   ├── 04_renovation_impact.png
│   ├── 05_comps_classification.png
│   ├── 06_sqft_variance.png
│   ├── 07_price_variance.png
│   ├── 08_lease_vs_sale.png
│   ├── 09_pr_comps_comparison.png
│   ├── 10_pr_individual_analysis.png
│   ├── 11_br_precision.png
│   ├── 12_time_analysis.png
│   ├── 13_direct_vs_indirect.png
│   ├── 14_recent_direct_indirect.png
│   ├── 15_active_vs_closed.png
│   ├── 16_active_vs_pending.png
│   ├── 17_renovation_delta_y_n.png
│   ├── 18_renovation_delta_05_n.png
│   ├── 19_interquartile_range.png
│   ├── 20_distribution_tails.png
│   ├── 21_expected_noi.png
│   ├── 22_noi_improvements.png
│   └── summary_dashboard.png
│
├── reports/
│   ├── executive_summary.pdf
│   ├── comparative_analysis.pdf
│   ├── investment_metrics.pdf
│   ├── market_positioning.pdf
│   └── 360_property_report.pdf
│
└── data/
    ├── raw_mls_data.csv
    ├── mcao_response.json
    ├── calculation_details.xlsx
    ├── breakups_results.json
    └── metadata.json
```

3. **Post-Download Actions:**
   - File moved from Pending-Bin to Completed
   - Report logged in system
   - Available in report history

---

## Error Handling

### Common Error Scenarios

#### Step 2-3: MLS Upload Errors
```javascript
const errorHandlers = {
  invalidHeaders: {
    message: "MLS field headers don't match expected format",
    action: "Review health check report, update field mapping if needed"
  },
  missingRequired: {
    message: "Required fields missing from MLS data",
    action: "Ensure MLS export includes all required fields"
  },
  emptyFile: {
    message: "Uploaded file contains no data",
    action: "Verify MLS search returned results"
  }
};
```

#### Step 5: Manual Entry Validation
```javascript
const validationRules = {
  renovateScore: {
    values: ['Y', 'N', '0.5'],
    required: true,
    message: "RENOVATE_SCORE must be Y, N, or 0.5"
  },
  propertyRadarComp: {
    format: /^[\d\w\s,]+$/,
    required: false,
    message: "Invalid address format for Property Radar comp"
  }
};
```

#### Step 8: Processing Failures
```javascript
const processingErrors = {
  insufficientData: {
    minProperties: 10,
    message: "Minimum 10 properties required for analysis"
  },
  calculationError: {
    retry: true,
    message: "Analysis calculation failed, retrying..."
  },
  memoryLimit: {
    maxSize: 50 * 1024 * 1024, // 50MB
    message: "File too large, please split into smaller batches"
  }
};
```

---

## Performance Optimization

### Processing Benchmarks

| Step | Target Time | Max Time | Optimization Strategy |
|------|------------|----------|----------------------|
| Step 2-3 | 5s per file | 15s | Stream parsing for large files |
| Step 4 | 10s | 30s | Parallel MCAO API calls |
| Step 5 | Manual | N/A | Pre-fill suggestions where possible |
| Step 8 | 20s | 60s | Chunk processing, worker threads |
| Step 9 | 5s | 15s | Pre-compressed assets |

### Memory Management
```javascript
const memoryOptimizations = {
  chunkSize: 1000, // Process 1000 rows at a time
  streamParsing: true, // Use streams for CSV parsing
  garbageCollection: {
    interval: 5000, // Force GC every 5 seconds during processing
    threshold: 0.8 // Trigger when 80% memory used
  }
};
```

### Caching Strategy
```javascript
const cacheConfig = {
  mcaoData: {
    ttl: 86400, // 24 hours
    key: (apn) => `mcao:${apn}`
  },
  analysisResults: {
    ttl: 3600, // 1 hour
    key: (clientId, propertyId) => `analysis:${clientId}:${propertyId}`
  }
};
```

---

## Quality Assurance

### Pipeline Testing Checklist

#### Unit Tests
- [ ] Each step function independently
- [ ] File parsing accuracy
- [ ] Calculation correctness
- [ ] Validation rules

#### Integration Tests
- [ ] Complete pipeline flow
- [ ] Step transitions
- [ ] Error recovery
- [ ] Data persistence

#### End-to-End Tests
- [ ] Real MLS data processing
- [ ] Manual entry simulation
- [ ] Report generation
- [ ] .zip packaging

#### Performance Tests
- [ ] Large dataset handling (1000+ properties)
- [ ] Concurrent user processing
- [ ] Memory usage under load
- [ ] API rate limiting

---

## Monitoring & Logging

### Pipeline Metrics
```javascript
const pipelineMetrics = {
  stepDuration: {
    measure: 'time',
    unit: 'seconds',
    threshold: stepTimeLimit
  },
  dataVolume: {
    measure: 'rows',
    unit: 'count',
    threshold: 10000
  },
  errorRate: {
    measure: 'failures',
    unit: 'percentage',
    threshold: 0.05 // 5% error rate
  }
};
```

### Audit Trail
```javascript
const auditLog = {
  user: userId,
  client: clientId,
  property: propertyId,
  pipeline: {
    start: timestamp,
    steps: [
      {step: 1, status: 'complete', duration: 2.3},
      {step: 2, status: 'complete', duration: 5.1},
      // ... all steps
    ],
    end: timestamp,
    totalDuration: seconds,
    filesGenerated: ['Upload_*.xlsx', 'Break-ups-*.zip']
  }
};
```

---

## Pipeline Maintenance

### Regular Maintenance Tasks

#### Daily
- Check error logs
- Monitor processing queue
- Verify MCAO API connectivity

#### Weekly
- Clean Completed folder (archive old files)
- Review health check alerts
- Update MLS field mappings if needed

#### Monthly
- Performance analysis
- Storage cleanup
- User feedback review
- Documentation updates

### Version Control
```javascript
const pipelineVersion = {
  current: '1.0.0',
  mlsFieldsVersion: '2024.10',
  mcaoAPIVersion: '2.1',
  analysisEngineVersion: '1.0'
};
```

---

## Troubleshooting Guide

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| MLS headers changed | Health check alert | Update field mapping configuration |
| MCAO API timeout | Step 4 fails | Retry with exponential backoff |
| Large file processing | Memory errors | Enable streaming mode |
| Missing manual data | Validation fails | Prompt user to complete entries |
| .zip corruption | Download fails | Regenerate package |

### Debug Mode
```javascript
// Enable debug logging
process.env.REPORTIT_DEBUG = 'true';

// Verbose logging for each step
const debugConfig = {
  logLevel: 'verbose',
  saveIntermediateFiles: true,
  skipOptimizations: true,
  detailedErrors: true
};
```

---

## Security Considerations

### Data Protection
- All files encrypted at rest
- HTTPS for all transfers
- Client data isolation
- Audit logging for compliance

### Access Control
- Admin-only access to ReportIt
- Client-specific data boundaries
- Session timeout after 30 minutes
- Two-factor authentication (optional)

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2024-10-23 | Initial pipeline documentation | GSRealty Team |

---

**Next Document:** REPORTIT_ZIP_OUTPUT_SPEC.md