#!/usr/bin/env python3
"""
Safety Logger Hook - Phase 1 (Visibility Mode)

Logs all tool uses for audit trail. Does NOT block any operations.
This provides visibility into what operations are being performed.

Log location: ~/.claude/safety_audit.jsonl
"""
import json
import sys
import os
from datetime import datetime

# Audit log location
AUDIT_LOG = os.path.expanduser('~/.claude/safety_audit.jsonl')

def log_operation(data: dict):
    """Append operation to audit log."""
    try:
        tool_name = data.get('tool_name', 'unknown')
        tool_input = data.get('tool_input', {})

        # Create summary based on tool type
        if tool_name == 'Bash':
            summary = tool_input.get('command', '')[:200]
        elif tool_name in ('Read', 'Write', 'Edit', 'MultiEdit'):
            summary = tool_input.get('file_path', '')
        elif tool_name == 'Glob':
            summary = tool_input.get('pattern', '')
        elif tool_name == 'Grep':
            summary = tool_input.get('pattern', '')
        else:
            summary = str(tool_input)[:200]

        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'tool': tool_name,
            'summary': summary,
            'session': os.environ.get('CLAUDE_SESSION_ID', 'unknown'),
            'project': os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd()),
        }

        # Ensure directory exists
        os.makedirs(os.path.dirname(AUDIT_LOG), exist_ok=True)

        # Append to log file
        with open(AUDIT_LOG, 'a') as f:
            f.write(json.dumps(entry) + '\n')

    except Exception as e:
        # Don't fail on logging errors - just print to stderr
        print(f"[safety_logger] Warning: Could not log operation: {e}", file=sys.stderr)

if __name__ == '__main__':
    try:
        # Read input from stdin
        data = json.load(sys.stdin)

        # Log the operation
        log_operation(data)

        # Always exit 0 - this hook never blocks
        sys.exit(0)

    except json.JSONDecodeError:
        # If we can't parse input, just exit cleanly
        sys.exit(0)
    except Exception as e:
        # Never fail - this is just logging
        print(f"[safety_logger] Error: {e}", file=sys.stderr)
        sys.exit(0)
