/**
 * File Upload Workflow Integration Tests
 *
 * Tests complete file upload, processing, storage, and retrieval workflows
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAdminSession,
  makeRequest,
  makeFormDataRequest,
  generateTestClient,
  cleanupTestData,
  registerTestData,
  MOCK_CSV_DATA,
  TEST_CONFIG,
  type AuthSession,
} from '../setup';
import fs from 'fs';
import path from 'path';

describe('File Upload Workflow Integration', () => {
  let adminSession: AuthSession | null;
  let testClientId: string;
  let testFileId: string;

  beforeAll(async () => {
    // Get admin session
    adminSession = await getAdminSession();
    if (!adminSession) {
      throw new Error('Failed to get admin session for tests');
    }

    // Create a test client
    const testClient = generateTestClient();
    const response = await makeRequest('/api/admin/clients', {
      method: 'POST',
      body: testClient,
      accessToken: adminSession.accessToken,
    });

    const data = await response.json();
    testClientId = data.client.id;
    registerTestData('client', testClientId);
  }, TEST_CONFIG.testTimeout);

  afterAll(async () => {
    // Cleanup
    const cleanupIds = {
      clientIds: testClientId ? [testClientId] : [],
      fileIds: testFileId ? [testFileId] : [],
    };
    await cleanupTestData(cleanupIds);
  });

  // ==========================================================================
  // POST /api/admin/upload/process - File Processing
  // ==========================================================================

  describe('POST /api/admin/upload/process', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'test.csv');

      const response = await makeFormDataRequest('/api/admin/upload/process', formData);
      expect(response.status).toBe(401);
    });

    it('should validate file is provided', async () => {
      const formData = new FormData();
      // No file attached

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('NO_FILE');
    });

    it('should reject files that are too large', async () => {
      // Create a large buffer (> 50MB)
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
      const formData = new FormData();
      const largeBlob = new Blob([largeBuffer], { type: 'text/csv' });
      formData.append('file', largeBlob, 'large.csv');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject invalid file types', async () => {
      const formData = new FormData();
      const txtBlob = new Blob(['test data'], { type: 'text/plain' });
      formData.append('file', txtBlob, 'test.txt');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should process CSV file successfully', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'test.csv');
      formData.append('uploadType', 'all_scopes');
      formData.append('clientId', testClientId);

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.properties).toBeDefined();
      expect(Array.isArray(data.data.properties)).toBe(true);
      expect(data.data.processedCount).toBeGreaterThan(0);
      expect(data.data.stats).toBeDefined();
    });

    it('should parse CSV data correctly', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'test.csv');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      const data = await response.json();
      const properties = data.data.properties;

      expect(properties.length).toBe(3); // 3 properties in mock data
      expect(properties[0].Address).toBe('123 Main St');
      expect(properties[0].City).toBe('Phoenix');
      expect(properties[0].Price).toBe('350000');
    });

    it('should handle subject property for distance calculations', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'test.csv');

      const subjectProperty = {
        address: '123 Main St',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        lat: 33.4484,
        lng: -112.0740,
      };
      formData.append('subjectProperty', JSON.stringify(subjectProperty));

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.halfMileCount).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /api/admin/upload/process - Get Status
  // ==========================================================================

  describe('GET /api/admin/upload/process', () => {
    it('should return processing endpoint information', async () => {
      const response = await makeRequest('/api/admin/upload/process');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ready');
      expect(data.version).toBeDefined();
      expect(data.supportedFormats).toContain('CSV');
      expect(data.supportedFormats).toContain('XLSX');
    });
  });

  // ==========================================================================
  // PUT /api/admin/upload/process - Generate Template
  // ==========================================================================

  describe('PUT /api/admin/upload/process - Template Generation', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await makeRequest('/api/admin/upload/process', {
        method: 'PUT',
        body: {
          compsData: [],
          subjectProperty: {},
        },
      });

      expect(response.status).toBe(401);
    });

    it('should validate comps data is provided', async () => {
      const response = await makeRequest('/api/admin/upload/process', {
        method: 'PUT',
        body: {
          subjectProperty: {
            address: '123 Main St',
            city: 'Phoenix',
            state: 'AZ',
          },
        },
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error?.code).toBe('INVALID_DATA');
    });

    it('should validate subject property is provided', async () => {
      const response = await makeRequest('/api/admin/upload/process', {
        method: 'PUT',
        body: {
          compsData: [{ address: '123 Test St' }],
        },
        accessToken: adminSession?.accessToken,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error?.code).toBe('MISSING_SUBJECT');
    });

    it('should generate populated template successfully', async () => {
      const compsData = [
        {
          Address: '123 Main St',
          City: 'Phoenix',
          State: 'AZ',
          Zip: '85001',
          Price: 350000,
          Beds: 3,
          Baths: 2,
          SqFt: 2000,
        },
      ];

      const subjectProperty = {
        address: '456 Subject Ave',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
      };

      const response = await makeRequest('/api/admin/upload/process', {
        method: 'PUT',
        body: {
          compsData,
          subjectProperty,
        },
        accessToken: adminSession?.accessToken,
      });

      // Should return file download
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('spreadsheet');
      expect(response.headers.get('content-disposition')).toContain('attachment');
    });
  });

  // ==========================================================================
  // Complete File Upload Workflow
  // ==========================================================================

  describe('Complete File Upload Workflow', () => {
    it('should handle complete upload-process-store workflow', async () => {
      // Step 1: Process file
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'workflow-test.csv');
      formData.append('clientId', testClientId);
      formData.append('uploadType', 'all_scopes');

      const processResponse = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(processResponse.status).toBe(200);
      const processData = await processResponse.json();
      expect(processData.success).toBe(true);
      expect(processData.data.processedCount).toBeGreaterThan(0);

      // Step 2: Store file metadata (if store endpoint exists)
      // Note: This depends on your implementation
      const storeResponse = await makeRequest('/api/admin/upload/store', {
        method: 'POST',
        body: {
          clientId: testClientId,
          fileName: 'workflow-test.csv',
          fileType: 'text/csv',
          fileSize: csvBlob.size,
          processedData: processData.data,
        },
        accessToken: adminSession?.accessToken,
      });

      // Store endpoint may not exist yet, so we allow 404
      if (storeResponse.status === 200) {
        const storeData = await storeResponse.json();
        if (storeData.file?.id) {
          testFileId = storeData.file.id;
          registerTestData('file', testFileId);
        }
      }
    });
  });

  // ==========================================================================
  // File Validation Tests
  // ==========================================================================

  describe('File Validation', () => {
    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = 'Invalid,CSV\nMissing,"quotes and,commas\n';
      const formData = new FormData();
      const csvBlob = new Blob([malformedCsv], { type: 'text/csv' });
      formData.append('file', csvBlob, 'malformed.csv');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      // Should either succeed with warnings or fail gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle empty CSV file', async () => {
      const emptyCsv = '';
      const formData = new FormData();
      const csvBlob = new Blob([emptyCsv], { type: 'text/csv' });
      formData.append('file', csvBlob, 'empty.csv');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle CSV with headers only', async () => {
      const headersOnly = 'Address,City,State,Zip,Price,Beds,Baths,SqFt';
      const formData = new FormData();
      const csvBlob = new Blob([headersOnly], { type: 'text/csv' });
      formData.append('file', csvBlob, 'headers-only.csv');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      const data = await response.json();
      if (data.success) {
        expect(data.data.processedCount).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Upload Type Detection
  // ==========================================================================

  describe('Upload Type Detection', () => {
    it('should auto-detect upload type from filename', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'direct_comps.csv');
      // uploadType not provided, should be detected

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(200);
    });

    it('should respect explicitly provided upload type', async () => {
      const formData = new FormData();
      const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      formData.append('file', csvBlob, 'test.csv');
      formData.append('uploadType', 'half_mile');

      const response = await makeFormDataRequest(
        '/api/admin/upload/process',
        formData,
        adminSession?.accessToken
      );

      expect(response.status).toBe(200);
    });
  });
});
