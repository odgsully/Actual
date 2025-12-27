#!/bin/bash
#
# GS-Site Monthly Print Job
# Runs at 5:00 AM Arizona time on the 1st of each month
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$BASE_DIR/logs"
OUTPUT_DIR="$BASE_DIR/output/monthly"
PRINTER_NAME="GS_Brother_Printer"
GS_SITE_URL="${GS_SITE_URL:-http://localhost:3003}"

mkdir -p "$LOG_DIR" "$OUTPUT_DIR"

LOG_FILE="$LOG_DIR/monthly-$(date +%Y%m).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Monthly Print Job"
log "=========================================="

MONTH_STR=$(date +%Y-%m)
PDF_FILE="$OUTPUT_DIR/monthly-${MONTH_STR}.pdf"

log "Generating monthly report for ${MONTH_STR}..."
if curl -sf "${GS_SITE_URL}/api/reports/monthly/pdf" -o "$PDF_FILE"; then
    log "Report generated: $PDF_FILE"
else
    log "ERROR: Failed to generate report from API"
    exit 1
fi

if [[ ! -f "$PDF_FILE" ]] || [[ ! -s "$PDF_FILE" ]]; then
    log "ERROR: PDF file is missing or empty"
    exit 1
fi

log "Sending to printer: $PRINTER_NAME"
if lp -d "$PRINTER_NAME" -t "GS Monthly ${MONTH_STR}" "$PDF_FILE"; then
    log "Print job submitted successfully"
else
    log "ERROR: Failed to submit print job"
    exit 1
fi

# Keep last 12 months
find "$OUTPUT_DIR" -name "monthly-*.pdf" -mtime +365 -delete 2>/dev/null || true

log "Monthly print job completed successfully"
log "=========================================="
