#!/bin/bash
#
# GS-Site Weekly Print Job
# Runs at 5:00 AM Arizona time every Sunday
#
# This script:
# 1. Generates the weekly report PDF via the gs-site API
# 2. Sends it to the GS Brother printer
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$BASE_DIR/logs"
OUTPUT_DIR="$BASE_DIR/output/weekly"
PRINTER_NAME="GS_Brother_Printer"
GS_SITE_URL="${GS_SITE_URL:-http://localhost:3003}"

# Ensure directories exist
mkdir -p "$LOG_DIR" "$OUTPUT_DIR"

# Log file
LOG_FILE="$LOG_DIR/weekly-$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Weekly Print Job"
log "=========================================="

# Generate filename (week starting date)
WEEK_START=$(date -v-sun +%Y-%m-%d 2>/dev/null || date -d "last sunday" +%Y-%m-%d)
PDF_FILE="$OUTPUT_DIR/weekly-${WEEK_START}.pdf"

# Generate the report PDF
log "Generating weekly report for week of ${WEEK_START}..."
if curl -sf "${GS_SITE_URL}/api/reports/weekly/pdf" -o "$PDF_FILE"; then
    log "Report generated: $PDF_FILE"
else
    log "ERROR: Failed to generate report from API"
    log "Attempting fallback to local generation..."

    if command -v wkhtmltopdf &> /dev/null; then
        curl -sf "${GS_SITE_URL}/reports/weekly/preview" | wkhtmltopdf - "$PDF_FILE"
        log "Fallback PDF generated"
    else
        log "ERROR: No fallback PDF generator available"
        exit 1
    fi
fi

# Check if PDF was created and has content
if [[ ! -f "$PDF_FILE" ]] || [[ ! -s "$PDF_FILE" ]]; then
    log "ERROR: PDF file is missing or empty"
    exit 1
fi

# Print the PDF
log "Sending to printer: $PRINTER_NAME"
if lp -d "$PRINTER_NAME" -t "GS Weekly ${WEEK_START}" "$PDF_FILE"; then
    log "Print job submitted successfully"
else
    log "ERROR: Failed to submit print job"
    exit 1
fi

# Cleanup old files (keep last 12 weeks)
log "Cleaning up old reports..."
find "$OUTPUT_DIR" -name "weekly-*.pdf" -mtime +84 -delete 2>/dev/null || true

log "Weekly print job completed successfully"
log "=========================================="
