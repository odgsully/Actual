# ReportIt Health Check System

**Project:** GSRealty Client Management System - ReportIt Feature
**Purpose:** MLS field header validation and change detection system
**Created:** October 23, 2024
**Version:** 1.0

---

## System Overview

The Health Check System automatically validates MLS field headers on every upload to ensure data consistency and prevent processing errors. When MLS export formats change, the system detects discrepancies and notifies users, allowing for manual review and configuration updates.

**Key Features:**
- Automatic execution on every MLS upload
- Real-time discrepancy detection
- UI notifications with detailed reports
- Configuration update capability
- Historical change tracking

---

## Expected MLS Field Headers

### Standard ARMLS Export Fields

**Current Version:** ARMLS 2024.10

```javascript
const expectedMLSHeaders = {
  version: "2024.10",
  lastUpdated: "2024-10-01",
  fields: [
    // Property Identification
    "ML#",
    "Listing ID",
    "House Number",
    "Street Direction",
    "Street Name",
    "Street Type",
    "Unit #",
    "City/Town Code",
    "State/Province",
    "Zip Code",
    "County",

    // Property Details
    "Property Type",
    "Property Subtype",
    "Year Built",
    "# Bedrooms",
    "Total Bathrooms",
    "Approx SQFT",
    "Lot Dimensions",
    "Lot Square Footage",
    "Number of Garages",
    "Number of Carports",

    // Listing Information
    "Status",
    "List Date",
    "List Price",
    "Original List Price",
    "Status Change Date",
    "Days on Market",
    "Cumulative Days on Market",

    // Sale Information
    "Under Contract Date",
    "Close of Escrow Date",
    "Cancel Date",
    "Sold Price",
    "Sold Price per SQFT",

    // Location Data
    "Geo Lat",
    "Geo Lon",
    "Subdivision Name",
    "HOA Name",
    "HOA Fee",
    "HOA Fee Frequency",

    // Agency Information
    "Listing Office Name",
    "Listing Agent Name",
    "Agency Phone",
    "Agent Email",

    // Additional Fields
    "Assessor Number",
    "Tax Year",
    "Taxes",
    "Legal Description",
    "Zoning",
    "Pool YN",
    "Spa YN",
    "Fireplace YN",
    "Features"
  ]
};
```

---

## Health Check Implementation

### Validation Logic

```javascript
class MLSHealthCheck {
  constructor() {
    this.expectedHeaders = expectedMLSHeaders.fields;
    this.discrepancies = [];
    this.warnings = [];
  }

  async validateUpload(file) {
    const headers = await this.extractHeaders(file);
    const validation = this.compareHeaders(headers);

    if (!validation.isValid) {
      await this.notifyUser(validation);
      await this.logDiscrepancy(validation);
    }

    return validation;
  }

  extractHeaders(file) {
    // Parse first row of CSV
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const firstLine = text.split('\n')[0];
        const headers = this.parseCSVLine(firstLine);
        resolve(headers);
      };
      reader.readAsText(file);
    });
  }

  compareHeaders(actualHeaders) {
    const validation = {
      isValid: true,
      missing: [],
      unexpected: [],
      reordered: [],
      renamed: []
    };

    // Check for missing expected headers
    this.expectedHeaders.forEach(expected => {
      if (!actualHeaders.includes(expected)) {
        validation.missing.push(expected);
        validation.isValid = false;
      }
    });

    // Check for unexpected headers
    actualHeaders.forEach(actual => {
      if (!this.expectedHeaders.includes(actual)) {
        // Check for potential renames
        const possibleMatch = this.findSimilarHeader(actual);
        if (possibleMatch) {
          validation.renamed.push({
            old: possibleMatch,
            new: actual
          });
        } else {
          validation.unexpected.push(actual);
        }
      }
    });

    // Check for reordered headers
    const orderChanges = this.detectOrderChanges(actualHeaders);
    if (orderChanges.length > 0) {
      validation.reordered = orderChanges;
    }

    return validation;
  }

  findSimilarHeader(header) {
    // Use Levenshtein distance to find similar headers
    const threshold = 3; // Maximum edit distance

    for (const expected of this.expectedHeaders) {
      const distance = this.levenshteinDistance(header, expected);
      if (distance <= threshold) {
        return expected;
      }
    }

    return null;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
```

---

## User Notification System

### UI Notification Component

```typescript
interface HealthCheckNotification {
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  details: DiscrepancyDetails;
  actions: NotificationAction[];
}

interface DiscrepancyDetails {
  missing: string[];
  unexpected: string[];
  renamed: RenamedField[];
  reordered: string[];
}

interface NotificationAction {
  label: string;
  action: 'proceed' | 'abort' | 'update' | 'review';
  handler: () => void;
}
```

### Notification Examples

#### Minor Changes (Warning)
```javascript
{
  severity: 'warning',
  title: 'MLS Field Headers Changed',
  message: '3 fields have been renamed. Review changes before proceeding.',
  details: {
    renamed: [
      { old: 'Approx SQFT', new: 'Approximate Sq Ft' },
      { old: '# Bedrooms', new: 'Bedrooms Total' },
      { old: 'HOA Fee', new: 'HOA Monthly Fee' }
    ]
  },
  actions: [
    { label: 'Update Mapping', action: 'update' },
    { label: 'Proceed Anyway', action: 'proceed' },
    { label: 'Cancel Upload', action: 'abort' }
  ]
}
```

#### Critical Changes (Error)
```javascript
{
  severity: 'error',
  title: 'Critical MLS Fields Missing',
  message: '5 required fields are missing. Cannot proceed without update.',
  details: {
    missing: [
      'Sold Price',
      'Status',
      'List Date',
      'Assessor Number',
      'Year Built'
    ]
  },
  actions: [
    { label: 'View Documentation', action: 'review' },
    { label: 'Contact Support', action: 'support' },
    { label: 'Cancel Upload', action: 'abort' }
  ]
}
```

---

## Configuration Management

### Field Mapping Configuration

```javascript
// config/mls-field-mapping.js
const fieldMappingConfig = {
  version: "2024.10",
  mappings: {
    // Template Field -> MLS Field(s)
    "Address": ["House Number", "Street Name", "Unit #"],
    "City": ["City/Town Code"],
    "State": ["State/Province"],
    "ZIP": ["Zip Code"],
    "APN": ["Assessor Number"],
    "Sale_Price": ["Sold Price"],
    "Sale_Date": ["Close of Escrow Date", "Status Change Date"],
    "List_Date": ["List Date"],
    "List_Price": ["Original List Price", "List Price"],
    "Bedrooms": ["# Bedrooms", "Bedrooms Total"],
    "Bathrooms": ["Total Bathrooms", "Bathrooms"],
    "Square_Feet": ["Approx SQFT", "Approximate Sq Ft", "Living Area"],
    "Year_Built": ["Year Built", "Construction Year"],
    "Status": ["Status", "Listing Status"],
    "Days_On_Market": ["Days on Market", "DOM", "Cumulative Days on Market"]
  },

  aliases: {
    // Alternative names for the same field
    "Approx SQFT": ["Approximate Sq Ft", "Living Area", "Square Footage"],
    "# Bedrooms": ["Bedrooms Total", "Beds", "BR"],
    "Total Bathrooms": ["Bathrooms", "Baths", "BA"],
    "HOA Fee": ["HOA Monthly Fee", "Association Fee", "HOA Dues"]
  },

  required: [
    // Fields that must be present
    "Status",
    "Assessor Number",
    "City/Town Code",
    "State/Province",
    "Zip Code"
  ],

  optional: [
    // Fields that can be missing
    "Pool YN",
    "Spa YN",
    "Fireplace YN",
    "HOA Name",
    "HOA Fee"
  ]
};
```

### Update Mechanism

```javascript
class FieldMappingUpdater {
  async updateMapping(discrepancy) {
    const currentConfig = await this.loadConfig();
    const updates = this.generateUpdates(discrepancy);

    // Show preview to user
    const approved = await this.showUpdatePreview(updates);

    if (approved) {
      // Apply updates
      const newConfig = this.applyUpdates(currentConfig, updates);

      // Save new configuration
      await this.saveConfig(newConfig);

      // Update version
      newConfig.version = this.incrementVersion(currentConfig.version);

      // Log change
      await this.logConfigChange(currentConfig, newConfig, discrepancy);

      return newConfig;
    }

    return currentConfig;
  }

  generateUpdates(discrepancy) {
    const updates = {
      newAliases: {},
      updatedMappings: {},
      removedFields: []
    };

    // Handle renamed fields
    discrepancy.renamed.forEach(rename => {
      if (!updates.newAliases[rename.old]) {
        updates.newAliases[rename.old] = [];
      }
      updates.newAliases[rename.old].push(rename.new);
    });

    // Handle missing fields
    discrepancy.missing.forEach(field => {
      updates.removedFields.push(field);
    });

    return updates;
  }

  showUpdatePreview(updates) {
    // Display UI dialog with proposed changes
    return new Promise((resolve) => {
      const dialog = {
        title: 'Review Configuration Updates',
        content: this.formatUpdates(updates),
        actions: [
          { label: 'Apply Updates', onClick: () => resolve(true) },
          { label: 'Cancel', onClick: () => resolve(false) }
        ]
      };

      showDialog(dialog);
    });
  }
}
```

---

## Historical Tracking

### Change Log Database

```sql
CREATE TABLE mls_field_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES gsrealty_users(id),
  change_type VARCHAR(50), -- 'rename', 'add', 'remove', 'reorder'
  field_name VARCHAR(100),
  old_value VARCHAR(100),
  new_value VARCHAR(100),
  mls_version VARCHAR(20),
  action_taken VARCHAR(50), -- 'updated', 'ignored', 'manual_review'
  notes TEXT
);

CREATE INDEX idx_mls_changes_timestamp ON mls_field_changes(timestamp);
CREATE INDEX idx_mls_changes_field ON mls_field_changes(field_name);
```

### Change Report Generation

```javascript
class MLSChangeReporter {
  async generateReport(startDate, endDate) {
    const changes = await this.fetchChanges(startDate, endDate);

    const report = {
      period: { start: startDate, end: endDate },
      totalChanges: changes.length,
      byType: this.groupByType(changes),
      byField: this.groupByField(changes),
      trends: this.analyzeTrends(changes),
      recommendations: this.generateRecommendations(changes)
    };

    return report;
  }

  groupByType(changes) {
    return changes.reduce((acc, change) => {
      if (!acc[change.change_type]) {
        acc[change.change_type] = [];
      }
      acc[change.change_type].push(change);
      return acc;
    }, {});
  }

  analyzeTrends(changes) {
    return {
      mostChangedFields: this.getMostChanged(changes),
      changeFrequency: this.calculateFrequency(changes),
      stability: this.assessStability(changes)
    };
  }
}
```

---

## Error Recovery

### Handling Upload Failures

```javascript
class HealthCheckErrorHandler {
  async handleValidationFailure(validation, file) {
    const severity = this.assessSeverity(validation);

    switch (severity) {
      case 'critical':
        // Block upload, require configuration update
        await this.blockUpload(file);
        await this.promptConfigUpdate(validation);
        break;

      case 'warning':
        // Allow proceed with warning
        const proceed = await this.showWarningDialog(validation);
        if (proceed) {
          await this.proceedWithMapping(file, validation);
        }
        break;

      case 'info':
        // Log and continue
        await this.logMinorChange(validation);
        await this.continueUpload(file);
        break;
    }
  }

  assessSeverity(validation) {
    if (validation.missing.some(field => requiredFields.includes(field))) {
      return 'critical';
    }

    if (validation.missing.length > 5 || validation.renamed.length > 10) {
      return 'warning';
    }

    return 'info';
  }

  async proceedWithMapping(file, validation) {
    // Create temporary mapping for this session
    const tempMapping = this.createTempMapping(validation);

    // Process file with temporary mapping
    return await this.processWithMapping(file, tempMapping);
  }
}
```

---

## Testing & Validation

### Test Scenarios

```javascript
describe('MLS Health Check System', () => {
  describe('Header Validation', () => {
    test('detects missing required fields', async () => {
      const headers = [...expectedHeaders];
      headers.splice(5, 2); // Remove 2 required fields

      const validation = healthCheck.compareHeaders(headers);
      expect(validation.isValid).toBe(false);
      expect(validation.missing.length).toBe(2);
    });

    test('detects renamed fields', async () => {
      const headers = [...expectedHeaders];
      headers[3] = 'Bedrooms Total'; // Rename from '# Bedrooms'

      const validation = healthCheck.compareHeaders(headers);
      expect(validation.renamed.length).toBe(1);
      expect(validation.renamed[0].new).toBe('Bedrooms Total');
    });

    test('handles completely different format', async () => {
      const headers = ['Field1', 'Field2', 'Field3'];

      const validation = healthCheck.compareHeaders(headers);
      expect(validation.isValid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(40);
    });
  });

  describe('User Notification', () => {
    test('shows appropriate severity', () => {
      const criticalValidation = {
        missing: ['Status', 'Sold Price'],
        unexpected: [],
        renamed: []
      };

      const notification = createNotification(criticalValidation);
      expect(notification.severity).toBe('error');
    });
  });

  describe('Configuration Update', () => {
    test('updates aliases correctly', async () => {
      const discrepancy = {
        renamed: [{ old: 'Approx SQFT', new: 'Square Footage' }]
      };

      const updatedConfig = await updater.updateMapping(discrepancy);
      expect(updatedConfig.aliases['Approx SQFT']).toContain('Square Footage');
    });
  });
});
```

---

## Monitoring & Alerts

### Dashboard Metrics

```javascript
const healthCheckMetrics = {
  daily: {
    totalUploads: 0,
    successfulValidations: 0,
    failedValidations: 0,
    configUpdates: 0
  },

  weekly: {
    averageDiscrepancies: 0,
    mostCommonIssues: [],
    stabilityScore: 100
  },

  alerts: {
    thresholds: {
      failureRate: 0.1, // Alert if >10% fail
      changeFrequency: 5 // Alert if >5 changes per week
    }
  }
};
```

### Alert Configuration

```javascript
const alertConfig = {
  email: {
    enabled: true,
    recipients: ['admin@gsrealty.com'],
    frequency: 'immediate'
  },

  ui: {
    enabled: true,
    position: 'top-right',
    duration: 10000
  },

  log: {
    enabled: true,
    level: 'warn',
    file: '/logs/health-check.log'
  }
};
```

---

## Best Practices

### For Administrators

1. **Regular Review**
   - Check health check logs weekly
   - Review field change trends monthly
   - Update configurations promptly

2. **Proactive Monitoring**
   - Set up alerts for critical fields
   - Monitor MLS provider announcements
   - Test with sample files before bulk uploads

3. **Documentation**
   - Document all configuration changes
   - Maintain field mapping history
   - Create user guides for common issues

### For Users

1. **Upload Process**
   - Always review health check notifications
   - Don't bypass warnings without understanding
   - Report persistent issues to admin

2. **Data Quality**
   - Verify MLS export settings
   - Use latest export templates
   - Check for complete data before upload

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Constant field mismatches | Outdated export template | Update MLS export settings |
| Missing required fields | Incomplete export | Check MLS search parameters |
| Renamed field warnings | MLS system update | Update field mapping config |
| Upload blocked | Critical fields missing | Contact admin for config update |

### Debug Mode

```javascript
// Enable verbose logging
localStorage.setItem('healthCheckDebug', 'true');

// View detailed validation results
console.log(healthCheck.getLastValidation());

// Export configuration for review
healthCheck.exportConfig();
```

---

## Integration Points

### With ReportIt Pipeline
- Step 2: Validates 1.5-mile comps upload
- Step 3: Validates direct comps upload
- Blocks processing if critical issues
- Logs all validations for audit

### With Admin Dashboard
- Health check status widget
- Recent validation history
- Configuration management interface
- Alert notifications

---

## Future Enhancements

### Planned Features
- Machine learning for field matching
- Automated configuration updates
- Multi-MLS support
- API integration with MLS providers
- Predictive change detection

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2024-10-23 | Initial health check system specification | GSRealty Team |

---

**Next Document:** REPORTIT_NOI_CALCULATIONS.md