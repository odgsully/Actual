#!/usr/bin/env python3
"""
Directory Jail Hook - Phase 2 (Warning Mode)

Prevents Claude from operating outside the project directory.
In warn mode: logs warning but allows operation.
In soft-block mode: blocks with bypass option.
In strict mode: hard block.

Environment variables:
- SAFETY_MODE: off | log | warn | soft-block | strict (default: warn)
- SAFETY_BYPASS: true to bypass soft-block (not strict)
"""
import json
import sys
import os

# Get project root from environment or current directory
PROJECT_ROOT = os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd())

# Safety mode
SAFETY_MODE = os.environ.get('SAFETY_MODE', 'warn')

# Allowed external paths (temp directories, etc.)
ALLOWED_EXTERNAL = [
    '/tmp/',
    '/var/folders/',  # macOS temp
    '/private/tmp/',  # macOS
]

# Forbidden path patterns - these should never be accessed
FORBIDDEN_PATTERNS = [
    '/Users/garrettsullivan/Desktop/BHRF',
    '/Users/garrettsullivan/Desktop/‼️',
    '../../..',  # Excessive parent traversal
]

def check_path_safety(path: str) -> tuple:
    """
    Check if path is safe to access.
    Returns: (is_safe: bool, reason: str, severity: str)
    """
    if not path:
        return True, "No path specified", "none"

    # Resolve the path
    try:
        resolved = os.path.abspath(os.path.expanduser(path))
    except Exception:
        resolved = path

    # Check forbidden patterns first
    for forbidden in FORBIDDEN_PATTERNS:
        if forbidden in path or forbidden in resolved:
            return False, f"Path contains forbidden pattern: {forbidden}", "critical"

    # Check if outside project
    if not resolved.startswith(PROJECT_ROOT):
        # Check if in allowed external paths
        for allowed in ALLOWED_EXTERNAL:
            if resolved.startswith(allowed):
                return True, "Allowed external path", "none"

        return False, f"Path outside project directory: {resolved}", "high"

    return True, "Safe path within project", "none"


def extract_paths_from_input(tool_name: str, tool_input: dict) -> list:
    """Extract file/directory paths from tool input."""
    paths = []

    # Direct path fields
    for key in ['file_path', 'path', 'directory', 'notebook_path']:
        if key in tool_input and tool_input[key]:
            paths.append(tool_input[key])

    # For Bash commands, extract paths
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        # Simple extraction of absolute paths
        import re
        found_paths = re.findall(r'(/[^\s"\'<>|;`]+)', command)
        paths.extend(found_paths)

    return paths


def handle_unsafe_path(reason: str, severity: str, path: str) -> dict:
    """Handle an unsafe path based on safety mode."""

    if SAFETY_MODE == 'off':
        return {"action": "allow"}

    if SAFETY_MODE == 'log':
        print(f"[directory_jail] LOG: {reason} - {path}", file=sys.stderr)
        return {"action": "allow"}

    if SAFETY_MODE == 'warn':
        print(f"[directory_jail] ⚠️  WARNING: {reason}", file=sys.stderr)
        print(f"[directory_jail]    Path: {path}", file=sys.stderr)
        print(f"[directory_jail]    Set SAFETY_MODE=off to suppress", file=sys.stderr)
        return {"action": "allow"}

    if SAFETY_MODE == 'soft-block':
        if os.environ.get('SAFETY_BYPASS') == 'true':
            print(f"[directory_jail] ⚠️  BYPASS ACTIVE: {reason}", file=sys.stderr)
            return {"action": "allow"}

        return {
            "action": "block",
            "reason": f"🛑 BLOCKED: {reason}\nPath: {path}\nOverride with: SAFETY_BYPASS=true"
        }

    if SAFETY_MODE == 'strict':
        return {
            "action": "block",
            "reason": f"🛑 STRICT BLOCK: {reason}\nPath: {path}\nNo bypass available in strict mode."
        }

    return {"action": "allow"}


if __name__ == '__main__':
    try:
        data = json.load(sys.stdin)
        tool_name = data.get('tool_name', '')
        tool_input = data.get('tool_input', {})

        # Extract paths from the tool input
        paths = extract_paths_from_input(tool_name, tool_input)

        # Check each path
        for path in paths:
            is_safe, reason, severity = check_path_safety(path)

            if not is_safe:
                result = handle_unsafe_path(reason, severity, path)

                if result["action"] == "block":
                    print(json.dumps({
                        "decision": "block",
                        "reason": result["reason"]
                    }))
                    sys.exit(2)

        # All paths safe, allow operation
        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"[directory_jail] Error: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on hook errors
