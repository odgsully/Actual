#!/bin/bash
#
# Setup script for Claude Code Stats Collector
#
# This installs a macOS LaunchAgent that runs the stats collector every hour.
# The collector parses ~/.claude/projects/ session files and writes stats
# to apps/gs-site/data/claude-stats/ for the MAX 20x dashboard tile.
#
# Usage:
#   ./setup-claude-stats-cron.sh install   - Install and start the agent
#   ./setup-claude-stats-cron.sh uninstall - Stop and remove the agent
#   ./setup-claude-stats-cron.sh status    - Check if agent is running
#   ./setup-claude-stats-cron.sh run       - Run collector once manually
#   ./setup-claude-stats-cron.sh logs      - View recent logs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.gssite.claude-stats.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
COLLECTOR="$SCRIPT_DIR/claude-stats-collector.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

install_agent() {
    echo "Installing Claude Stats Collector LaunchAgent..."

    # Check if plist source exists
    if [ ! -f "$PLIST_SRC" ]; then
        print_error "Plist file not found: $PLIST_SRC"
        exit 1
    fi

    # Check if collector exists
    if [ ! -f "$COLLECTOR" ]; then
        print_error "Collector script not found: $COLLECTOR"
        exit 1
    fi

    # Create LaunchAgents directory if needed
    mkdir -p "$HOME/Library/LaunchAgents"

    # Unload existing agent if present
    if launchctl list | grep -q "com.gssite.claude-stats"; then
        print_warning "Existing agent found, unloading..."
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
    fi

    # Copy plist to LaunchAgents
    cp "$PLIST_SRC" "$PLIST_DEST"
    print_status "Copied plist to $PLIST_DEST"

    # Load the agent
    launchctl load "$PLIST_DEST"
    print_status "Loaded LaunchAgent"

    # Run once immediately
    echo "Running initial collection..."
    python3 "$COLLECTOR" --days 30
    print_status "Initial data collected"

    echo ""
    print_status "Installation complete!"
    echo "  - Stats will update every hour"
    echo "  - Logs: /tmp/claude-stats.log"
    echo "  - Errors: /tmp/claude-stats.err"
    echo ""
    echo "Run './setup-claude-stats-cron.sh status' to verify"
}

uninstall_agent() {
    echo "Uninstalling Claude Stats Collector LaunchAgent..."

    if [ -f "$PLIST_DEST" ]; then
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
        rm "$PLIST_DEST"
        print_status "Removed LaunchAgent"
    else
        print_warning "LaunchAgent not installed"
    fi

    print_status "Uninstallation complete"
}

check_status() {
    echo "Claude Stats Collector Status"
    echo "=============================="

    if launchctl list | grep -q "com.gssite.claude-stats"; then
        print_status "LaunchAgent is loaded and running"

        # Get last run info
        if [ -f "/tmp/claude-stats.log" ]; then
            echo ""
            echo "Last run output:"
            tail -5 /tmp/claude-stats.log
        fi

        # Check data freshness
        DATA_FILE="$SCRIPT_DIR/../data/claude-stats/aggregates.json"
        if [ -f "$DATA_FILE" ]; then
            echo ""
            LAST_UPDATED=$(python3 -c "import json; print(json.load(open('$DATA_FILE'))['last_updated'])" 2>/dev/null || echo "unknown")
            print_status "Last data update: $LAST_UPDATED"
        fi
    else
        print_error "LaunchAgent is NOT running"
        echo ""
        echo "Run './setup-claude-stats-cron.sh install' to start"
    fi
}

run_manual() {
    echo "Running stats collector manually..."
    python3 "$COLLECTOR" --verbose --days 30
}

show_logs() {
    echo "=== Recent Logs ==="
    if [ -f "/tmp/claude-stats.log" ]; then
        tail -30 /tmp/claude-stats.log
    else
        echo "No logs found"
    fi

    echo ""
    echo "=== Recent Errors ==="
    if [ -f "/tmp/claude-stats.err" ]; then
        tail -20 /tmp/claude-stats.err
    else
        echo "No errors"
    fi
}

# Main command handler
case "${1:-}" in
    install)
        install_agent
        ;;
    uninstall)
        uninstall_agent
        ;;
    status)
        check_status
        ;;
    run)
        run_manual
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Claude Code Stats Collector Setup"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  install   - Install LaunchAgent (runs every hour)"
        echo "  uninstall - Remove LaunchAgent"
        echo "  status    - Check if collector is running"
        echo "  run       - Run collector once manually"
        echo "  logs      - View recent logs"
        echo ""
        echo "The collector parses Claude Code session files and generates"
        echo "usage stats for the GS Site MAX 20x dashboard tile."
        ;;
esac
