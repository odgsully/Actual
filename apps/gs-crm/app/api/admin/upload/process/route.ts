/**
 * File Processing API Route
 *
 * Handles uploaded MLS files (CSV/XLSX), processes them, and returns
 * structured data for client management.
 *
 * @route POST /api/admin/upload/process
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseMLSCSV,
  filterCompsByDistance,
  sortCompsByDistance,
} from '@/lib/processing/csv-processor';
import {
  processMLSExcel,
  detectUploadType,
} from '@/lib/processing/excel-processor';
import {
  populateTemplate,
  getDefaultTemplatePath,
  saveWorkbookToBuffer,
  loadTemplateFromBuffer,
} from '@/lib/processing/template-populator';
import {
  UploadType,
  SubjectProperty,
  PropertyData,
  MLSRow,
} from '@/lib/types/mls-data';
import { requireAdmin } from '@/lib/api/admin-auth';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[GSRealty API - Process]';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// ============================================================================
// Request Interface
// ============================================================================

interface ProcessRequest {
  file: File;
  uploadType: UploadType;
  subjectProperty?: SubjectProperty;
  clientId?: string;
}

// ============================================================================
// Response Interfaces
// ============================================================================

interface ProcessResponse {
  success: boolean;
  data?: {
    properties: PropertyData[] | MLSRow[];
    stats: any;
    processedCount: number;
    halfMileCount?: number;
  };
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

interface TemplateResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// POST Handler - Process Uploaded File
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log(`${LOG_PREFIX} Received file processing request`);

  try {
    // Verify admin authentication
    const auth = await requireAdmin();
    if (!auth.success) return auth.response;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadTypeStr = formData.get('uploadType') as string | null;
    const subjectPropertyStr = formData.get('subjectProperty') as string | null;
    const clientId = formData.get('clientId') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No file provided',
            code: 'NO_FILE',
          },
        } as ProcessResponse,
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            code: 'FILE_TOO_LARGE',
          },
        } as ProcessResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid file type. Only CSV and XLSX files are allowed.',
            code: 'INVALID_FILE_TYPE',
            details: { fileType: file.type },
          },
        } as ProcessResponse,
        { status: 400 }
      );
    }

    // Determine upload type
    const uploadType: UploadType = uploadTypeStr
      ? (uploadTypeStr as UploadType)
      : detectUploadType(file.name);

    // Parse subject property (if provided)
    let subjectProperty: SubjectProperty | undefined;
    if (subjectPropertyStr) {
      try {
        subjectProperty = JSON.parse(subjectPropertyStr);
      } catch (error) {
        console.warn(`${LOG_PREFIX} Invalid subject property JSON:`, error);
      }
    }

    console.log(`${LOG_PREFIX} Processing file:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadType,
      hasSubject: !!subjectProperty,
    });

    // Process file based on type
    let result: ProcessResponse;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      result = await processCSVFile(file, uploadType, subjectProperty);
    } else {
      result = await processExcelFile(file, uploadType, subjectProperty);
    }

    console.log(`${LOG_PREFIX} Processing complete:`, {
      success: result.success,
      processedCount: result.data?.processedCount || 0,
      errors: result.error ? 1 : 0,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'INTERNAL_ERROR',
        },
      } as ProcessResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// CSV Processing
// ============================================================================

async function processCSVFile(
  file: File,
  uploadType: UploadType,
  subjectProperty?: SubjectProperty
): Promise<ProcessResponse> {
  console.log(`${LOG_PREFIX} Processing CSV file`);

  const parseResult = await parseMLSCSV(file, subjectProperty);

  if (parseResult.error) {
    return {
      success: false,
      error: {
        message: parseResult.error.message,
        code: 'CSV_PARSE_ERROR',
        details: parseResult.stats,
      },
    };
  }

  // Sort by distance if available
  const sortedData = subjectProperty
    ? sortCompsByDistance(parseResult.data)
    : parseResult.data;

  // Count half-mile comps
  const halfMileComps = subjectProperty
    ? filterCompsByDistance(parseResult.data, 0.5)
    : [];

  return {
    success: true,
    data: {
      properties: sortedData,
      stats: parseResult.stats,
      processedCount: parseResult.data.length,
      halfMileCount: halfMileComps.length,
    },
  };
}

// ============================================================================
// Excel Processing
// ============================================================================

async function processExcelFile(
  file: File,
  uploadType: UploadType,
  subjectProperty?: SubjectProperty
): Promise<ProcessResponse> {
  console.log(`${LOG_PREFIX} Processing Excel file`);

  const processResult = await processMLSExcel(file, uploadType, subjectProperty);

  if (processResult.error) {
    return {
      success: false,
      error: {
        message: processResult.error.message,
        code: 'EXCEL_PROCESS_ERROR',
        details: processResult.stats,
      },
    };
  }

  return {
    success: true,
    data: {
      properties: processResult.properties,
      stats: processResult.stats,
      processedCount: processResult.properties.length,
    },
  };
}

// ============================================================================
// GET Handler - Get Processing Status (Optional)
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ready',
    version: '1.0.0',
    supportedFormats: ['CSV', 'XLSX'],
    maxFileSize: MAX_FILE_SIZE,
    uploadTypes: ['direct_comps', 'all_scopes', 'half_mile'],
  });
}

// ============================================================================
// PUT Handler - Generate Populated Template (Optional)
// ============================================================================

/**
 * Generate a populated template from processed data
 * This is separate from the main POST handler to keep concerns separated
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  console.log(`${LOG_PREFIX} Received template generation request`);

  try {
    // Verify admin authentication
    const auth = await requireAdmin();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { compsData, subjectProperty, mcaoData } = body;

    if (!compsData || !Array.isArray(compsData)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid comps data',
            code: 'INVALID_DATA',
          },
        } as TemplateResponse,
        { status: 400 }
      );
    }

    if (!subjectProperty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Subject property required',
            code: 'MISSING_SUBJECT',
          },
        } as TemplateResponse,
        { status: 400 }
      );
    }

    console.log(`${LOG_PREFIX} Generating template with ${compsData.length} comps`);

    // Get template path
    const templatePath = getDefaultTemplatePath();

    // Populate template
    const result = await populateTemplate(
      templatePath,
      compsData,
      subjectProperty,
      mcaoData
    );

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: result.error.message,
            code: 'TEMPLATE_ERROR',
          },
        } as TemplateResponse,
        { status: 500 }
      );
    }

    // Convert workbook to buffer
    const buffer = await saveWorkbookToBuffer(result.workbook);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `gsrealty-comps-${timestamp}.xlsx`;

    // Return file as download
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} Template generation error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'INTERNAL_ERROR',
        },
      } as TemplateResponse,
      { status: 500 }
    );
  }
}
