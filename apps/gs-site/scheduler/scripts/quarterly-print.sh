#!/bin/bash
#
# GS-Site Quarterly Print Job
# Runs at 5:00 AM Arizona time on Jan 1, Apr 1, Jul 1, Oct 1
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$BASE_DIR/logs"
OUTPUT_DIR="$BASE_DIR/output/quarterly"
PRINTER_NAME="GS_Brother_Printer"
GS_SITE_URL="${GS_SITE_URL:-http://localhost:3003}"

mkdir -p "$LOG_DIR" "$OUTPUT_DIR"

# Determine quarter
MONTH=$(date +%m)
YEAR=$(date +%Y)
case $MONTH in
    01|02|03) QUARTER="Q1" ;;
    04|05|06) QUARTER="Q2" ;;
    07|08|09) QUARTER="Q3" ;;
    10|11|12) QUARTER="Q4" ;;
esac

LOG_FILE="$LOG_DIR/quarterly-${YEAR}${QUARTER}.log"
PDF_FILE="$OUTPUT_DIR/quarterly-${YEAR}-${QUARTER}.pdf"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Quarterly Print Job"
log "=========================================="

log "Generating quarterly report for ${QUARTER} ${YEAR}..."
if curl -sf "${GS_SITE_URL}/api/reports/quarterly/pdf" -o "$PDF_FILE"; then
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
if lp -d "$PRINTER_NAME" -t "GS Quarterly ${QUARTER} ${YEAR}" "$PDF_FILE"; then
    log "Print job submitted successfully"
else
    log "ERROR: Failed to submit print job"
    exit 1
fi

log "Quarterly print job completed successfully"
log "=========================================="
