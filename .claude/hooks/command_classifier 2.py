#!/usr/bin/env python3
"""
Command Classifier Hook - Phase 2 (Warning Mode)

Classifies and potentially blocks dangerous bash commands.

Severity Levels:
- CRITICAL: Always blocked (rm -rf /, DROP DATABASE, etc.)
- HIGH: Blocked in soft-block/strict mode (rm -rf, DROP TABLE, etc.)
- MEDIUM: Warning only (DELETE FROM, UPDATE, etc.)
- LOW: Logged only

Environment variables:
- SAFETY_MODE: off | log | warn | soft-block | strict (default: warn)
- SAFETY_BYPASS: true to bypass soft-block (not strict or critical)
"""
import json
import sys
import os
import re

# Safety mode
SAFETY_MODE = os.environ.get('SAFETY_MODE', 'warn')

# Pattern definitions by severity
SEVERITY_PATTERNS = {
    'CRITICAL': [
        (r'rm\s+-[rf]*\s+/', 'Recursive delete from root'),
        (r'rm\s+-[rf]*\s+~', 'Recursive delete from home'),
        (r'rm\s+-[rf]*\s+\$HOME', 'Recursive delete from home'),
        (r'DROP\s+DATABASE', 'Drop entire database'),
        (r'DROP\s+SCHEMA.*CASCADE', 'Drop schema with cascade'),
        (r'>\s*/dev/sd', 'Write to disk device'),
        (r'mkfs\.', 'Format filesystem'),
        (r'dd\s+if=.*of=/dev', 'Direct disk write'),
        (r':\(\)\s*\{\s*:\|:&\s*\}\s*;:', 'Fork bomb'),
    ],
    'HIGH': [
        (r'rm\s+-[rf]+', 'Recursive/force delete'),
        (r'DROP\s+TABLE', 'Drop table'),
        (r'TRUNCATE\s+TABLE', 'Truncate table'),
        (r'DELETE\s+FROM\s+\w+\s*;', 'Delete all rows (no WHERE)'),
        (r'DELETE\s+FROM\s+\w+\s*$', 'Delete all rows (no WHERE)'),
        (r'git\s+push.*--force', 'Force push to git'),
        (r'git\s+reset\s+--hard', 'Hard reset git'),
        (r'chmod\s+-R\s+777', 'Recursive world-writable permissions'),
        (r'curl.*\|\s*(ba)?sh', 'Pipe curl to shell'),
        (r'wget.*\|\s*(ba)?sh', 'Pipe wget to shell'),
    ],
    'MEDIUM': [
        (r'DELETE\s+FROM', 'Delete from table'),
        (r'UPDATE\s+\w+\s+SET', 'Update table'),
        (r'npm\s+uninstall', 'Uninstall npm package'),
        (r'pip\s+uninstall', 'Uninstall pip package'),
        (r'git\s+checkout\s+--', 'Discard git changes'),
        (r'git\s+clean\s+-[fd]+', 'Clean git working directory'),
        (r'rm\s+', 'Delete files'),
    ],
}


def classify_command(command: str) -> tuple:
    """
    Classify a command by severity.
    Returns: (severity, pattern_name, pattern_matched)
    """
    for severity in ['CRITICAL', 'HIGH', 'MEDIUM']:
        for pattern, name in SEVERITY_PATTERNS[severity]:
            if re.search(pattern, command, re.IGNORECASE):
                return severity, name, pattern

    return 'LOW', '', ''


def handle_dangerous_command(severity: str, name: str, command: str) -> dict:
    """Handle a dangerous command based on safety mode and severity."""

    # CRITICAL commands are always blocked regardless of mode
    if severity == 'CRITICAL':
        return {
            "action": "block",
            "reason": f"🛑 CRITICAL: {name}\nCommand: {command[:100]}...\nThis command is ALWAYS blocked for safety."
        }

    if SAFETY_MODE == 'off':
        return {"action": "allow"}

    if SAFETY_MODE == 'log':
        print(f"[command_classifier] LOG [{severity}]: {name}", file=sys.stderr)
        return {"action": "allow"}

    if SAFETY_MODE == 'warn':
        print(f"[command_classifier] ⚠️  WARNING [{severity}]: {name}", file=sys.stderr)
        print(f"[command_classifier]    Command: {command[:80]}...", file=sys.stderr)
        print(f"[command_classifier]    Set SAFETY_MODE=off to suppress", file=sys.stderr)
        return {"action": "allow"}

    if SAFETY_MODE == 'soft-block':
        if severity == 'HIGH':
            if os.environ.get('SAFETY_BYPASS') == 'true':
                print(f"[command_classifier] ⚠️  BYPASS ACTIVE [{severity}]: {name}", file=sys.stderr)
                return {"action": "allow"}

            return {
                "action": "block",
                "reason": f"🛑 BLOCKED [{severity}]: {name}\nCommand: {command[:100]}...\nOverride with: SAFETY_BYPASS=true"
            }
        else:
            # MEDIUM severity - warn only in soft-block
            print(f"[command_classifier] ⚠️  WARNING [{severity}]: {name}", file=sys.stderr)
            return {"action": "allow"}

    if SAFETY_MODE == 'strict':
        if severity in ['HIGH', 'CRITICAL']:
            return {
                "action": "block",
                "reason": f"🛑 STRICT BLOCK [{severity}]: {name}\nCommand: {command[:100]}...\nNo bypass available in strict mode."
            }
        else:
            # MEDIUM severity - warn in strict mode
            print(f"[command_classifier] ⚠️  WARNING [{severity}]: {name}", file=sys.stderr)
            return {"action": "allow"}

    return {"action": "allow"}


if __name__ == '__main__':
    try:
        data = json.load(sys.stdin)
        tool_name = data.get('tool_name', '')

        # Only check Bash commands
        if tool_name != 'Bash':
            sys.exit(0)

        command = data.get('tool_input', {}).get('command', '')

        if not command:
            sys.exit(0)

        # Classify the command
        severity, name, pattern = classify_command(command)

        # If not LOW severity, handle it
        if severity != 'LOW':
            result = handle_dangerous_command(severity, name, command)

            if result["action"] == "block":
                print(json.dumps({
                    "decision": "block",
                    "reason": result["reason"]
                }))
                sys.exit(2)

        # Allow the command
        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"[command_classifier] Error: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on hook errors
