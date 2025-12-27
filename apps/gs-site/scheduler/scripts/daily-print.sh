#!/bin/bash
#
# GS-Site Daily Print Job
# Runs at 5:00 AM Arizona time every day
#
# This script:
# 1. Generates the daily report PDF via the gs-site API
# 2. Sends it to the GS Brother printer
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$BASE_DIR/logs"
OUTPUT_DIR="$BASE_DIR/output/daily"
PRINTER_NAME="GS_Brother_Printer"
GS_SITE_URL="${GS_SITE_URL:-http://localhost:3003}"

# Ensure directories exist
mkdir -p "$LOG_DIR" "$OUTPUT_DIR"

# Log file
LOG_FILE="$LOG_DIR/daily-$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Daily Print Job"
log "=========================================="

# Generate filename
DATE_STR=$(date +%Y-%m-%d)
PDF_FILE="$OUTPUT_DIR/daily-${DATE_STR}.pdf"

# Generate the report PDF
log "Generating daily report..."
if curl -sf "${GS_SITE_URL}/api/reports/daily/pdf" -o "$PDF_FILE"; then
    log "Report generated: $PDF_FILE"
else
    log "ERROR: Failed to generate report from API"
    log "Attempting fallback to local generation..."

    # Fallback: Use wkhtmltopdf or similar
    if command -v wkhtmltopdf &> /dev/null; then
        curl -sf "${GS_SITE_URL}/reports/daily/preview" | wkhtmltopdf - "$PDF_FILE"
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
if lp -d "$PRINTER_NAME" -t "GS Daily ${DATE_STR}" "$PDF_FILE"; then
    log "Print job submitted successfully"
else
    log "ERROR: Failed to submit print job"
    exit 1
fi

# Cleanup old files (keep last 30 days)
log "Cleaning up old reports..."
find "$OUTPUT_DIR" -name "daily-*.pdf" -mtime +30 -delete 2>/dev/null || true

log "Daily print job completed successfully"
log "=========================================="
