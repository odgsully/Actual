#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv", "httpx"]
# ///
"""
Claude Code Stats Collector Hook

Parses transcript files on session stop to extract:
- Token usage (input, output, cache)
- Model usage (Opus vs Sonnet)
- Tool call breakdown
- Session duration
- Estimated cost

Stores data for MAX plan usage insights in GS Site dashboard.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================
# Configuration
# ============================================================

# User's MAX plan type (set via env or defaults to 20x)
MAX_PLAN = os.getenv('CLAUDE_MAX_PLAN', '20x')

# Pricing per 1M tokens (Opus 4.5)
PRICING = {
    'input': 15.00,
    'output': 75.00,
    'cache_read': 1.50,
    'cache_creation': 18.75,
}

# MAX plan limits (based on Anthropic docs)
PLAN_LIMITS = {
    '5x': {
        'messages_per_5hr': 225,
        'opus_switch_threshold': 0.20,
        'weekly_opus_hours': 10,
        'weekly_sonnet_hours': 240,
    },
    '20x': {
        'messages_per_5hr': 900,
        'opus_switch_threshold': 0.50,
        'weekly_opus_hours': 40,
        'weekly_sonnet_hours': 480,
    }
}

# ============================================================
# Transcript Parser
# ============================================================

def parse_transcript(transcript_path: str) -> dict:
    """
    Parse a .jsonl transcript file and extract comprehensive metrics.

    Returns dict with:
    - Token counts (input, output, cache_read, cache_creation)
    - Model-specific token counts (opus, sonnet)
    - Message counts (user, assistant)
    - Tool usage breakdown
    - Timestamps and duration
    - Cache efficiency metrics
    - Estimated cost
    """
    stats = {
        # Token metrics
        'input_tokens': 0,
        'output_tokens': 0,
        'cache_read_tokens': 0,
        'cache_creation_tokens': 0,

        # Model-specific tokens
        'opus_input_tokens': 0,
        'opus_output_tokens': 0,
        'sonnet_input_tokens': 0,
        'sonnet_output_tokens': 0,

        # Message counts
        'user_messages': 0,
        'assistant_messages': 0,

        # Tool usage
        'tool_calls': 0,
        'tool_breakdown': defaultdict(int),

        # Models used
        'models_used': set(),
        'primary_model': None,

        # Timestamps
        'first_timestamp': None,
        'last_timestamp': None,
    }

    model_token_counts = defaultdict(int)

    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Track timestamps
                if 'timestamp' in entry:
                    ts = entry['timestamp']
                    if stats['first_timestamp'] is None:
                        stats['first_timestamp'] = ts
                    stats['last_timestamp'] = ts

                entry_type = entry.get('type', '')

                # Count user messages
                if entry_type == 'user':
                    stats['user_messages'] += 1

                # Process assistant messages
                elif entry_type == 'assistant':
                    stats['assistant_messages'] += 1

                    msg = entry.get('message', {})
                    usage = msg.get('usage', {})
                    model = msg.get('model', '')

                    if usage:
                        # Extract token counts
                        input_t = usage.get('input_tokens', 0)
                        output_t = usage.get('output_tokens', 0)
                        cache_read = usage.get('cache_read_input_tokens', 0)
                        cache_create = usage.get('cache_creation_input_tokens', 0)

                        stats['input_tokens'] += input_t
                        stats['output_tokens'] += output_t
                        stats['cache_read_tokens'] += cache_read
                        stats['cache_creation_tokens'] += cache_create

                        # Track by model type
                        if model:
                            model_lower = model.lower()
                            if 'opus' in model_lower:
                                stats['models_used'].add('opus')
                                stats['opus_input_tokens'] += input_t
                                stats['opus_output_tokens'] += output_t
                                model_token_counts['opus'] += input_t + output_t
                            elif 'sonnet' in model_lower:
                                stats['models_used'].add('sonnet')
                                stats['sonnet_input_tokens'] += input_t
                                stats['sonnet_output_tokens'] += output_t
                                model_token_counts['sonnet'] += input_t + output_t

                    # Count tool uses from content
                    content = msg.get('content', [])
                    if isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get('type') == 'tool_use':
                                stats['tool_calls'] += 1
                                tool_name = item.get('name', 'unknown')
                                stats['tool_breakdown'][tool_name] += 1

    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Error parsing transcript: {e}", file=sys.stderr)

    # Determine primary model
    if model_token_counts:
        stats['primary_model'] = max(model_token_counts, key=model_token_counts.get)

    # Calculate derived metrics
    stats['total_tokens'] = (
        stats['input_tokens'] +
        stats['output_tokens'] +
        stats['cache_read_tokens'] +
        stats['cache_creation_tokens']
    )

    # Cache efficiency
    total_input_context = stats['input_tokens'] + stats['cache_read_tokens']
    if total_input_context > 0:
        stats['cache_hit_rate'] = round(stats['cache_read_tokens'] / total_input_context, 4)
    else:
        stats['cache_hit_rate'] = 0.0

    # Duration calculation
    if stats['first_timestamp'] and stats['last_timestamp']:
        try:
            start = datetime.fromisoformat(stats['first_timestamp'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(stats['last_timestamp'].replace('Z', '+00:00'))
            stats['duration_seconds'] = int((end - start).total_seconds())
        except:
            stats['duration_seconds'] = 0
    else:
        stats['duration_seconds'] = 0

    # Estimated cost (USD)
    stats['estimated_cost_usd'] = round((
        (stats['input_tokens'] * PRICING['input']) +
        (stats['output_tokens'] * PRICING['output']) +
        (stats['cache_read_tokens'] * PRICING['cache_read']) +
        (stats['cache_creation_tokens'] * PRICING['cache_creation'])
    ) / 1_000_000, 4)

    # Cost saved by cache
    stats['cache_savings_usd'] = round(
        (stats['cache_read_tokens'] * (PRICING['input'] - PRICING['cache_read'])) / 1_000_000,
        4
    )

    # Convert sets/defaultdicts for JSON serialization
    stats['models_used'] = list(stats['models_used'])
    stats['tool_breakdown'] = dict(stats['tool_breakdown'])

    return stats


def save_session_stats(session_data: dict, stats: dict) -> None:
    """
    Save session stats to the GS Site data directory.
    Maintains a rolling log of sessions for dashboard display.
    """
    # Target directory in gs-site
    gs_site_data_dir = Path(__file__).parent.parent.parent / 'apps' / 'gs-site' / 'data' / 'claude-stats'
    gs_site_data_dir.mkdir(parents=True, exist_ok=True)

    # Also save to local logs for backup
    local_log_dir = Path.cwd() / 'logs' / 'claude-stats'
    local_log_dir.mkdir(parents=True, exist_ok=True)

    # Prepare session record
    session_record = {
        'session_id': session_data.get('session_id', 'unknown'),
        'project': session_data.get('cwd', '').split('/')[-1],  # Last dir component
        'project_path': session_data.get('cwd', ''),
        'recorded_at': datetime.now(timezone.utc).isoformat(),
        'max_plan': MAX_PLAN,
        **stats
    }

    # Save to daily log file (one file per day for easy aggregation)
    today = datetime.now().strftime('%Y-%m-%d')

    for data_dir in [gs_site_data_dir, local_log_dir]:
        daily_file = data_dir / f'sessions-{today}.json'

        # Load existing sessions for today
        if daily_file.exists():
            try:
                with open(daily_file, 'r') as f:
                    daily_sessions = json.load(f)
            except (json.JSONDecodeError, ValueError):
                daily_sessions = []
        else:
            daily_sessions = []

        # Append new session
        daily_sessions.append(session_record)

        # Write back
        with open(daily_file, 'w') as f:
            json.dump(daily_sessions, f, indent=2, default=str)

    # Also update aggregates file
    update_aggregates(gs_site_data_dir, session_record)


def update_aggregates(data_dir: Path, session: dict) -> None:
    """
    Update running aggregates for quick dashboard access.
    """
    agg_file = data_dir / 'aggregates.json'

    # Load existing aggregates
    if agg_file.exists():
        try:
            with open(agg_file, 'r') as f:
                agg = json.load(f)
        except:
            agg = {}
    else:
        agg = {}

    # Initialize structure if needed
    today = datetime.now().strftime('%Y-%m-%d')
    week_start = (datetime.now() - __import__('datetime').timedelta(days=datetime.now().weekday())).strftime('%Y-%m-%d')

    for period in ['today', 'this_week', 'all_time']:
        if period not in agg:
            agg[period] = {
                'date': today if period == 'today' else week_start if period == 'this_week' else '2025-01-01',
                'session_count': 0,
                'total_tokens': 0,
                'input_tokens': 0,
                'output_tokens': 0,
                'cache_read_tokens': 0,
                'cache_creation_tokens': 0,
                'opus_tokens': 0,
                'sonnet_tokens': 0,
                'user_messages': 0,
                'tool_calls': 0,
                'total_duration_seconds': 0,
                'estimated_cost_usd': 0,
                'cache_savings_usd': 0,
            }

    # Reset daily if date changed
    if agg['today'].get('date') != today:
        agg['today'] = {
            'date': today,
            'session_count': 0,
            'total_tokens': 0,
            'input_tokens': 0,
            'output_tokens': 0,
            'cache_read_tokens': 0,
            'cache_creation_tokens': 0,
            'opus_tokens': 0,
            'sonnet_tokens': 0,
            'user_messages': 0,
            'tool_calls': 0,
            'total_duration_seconds': 0,
            'estimated_cost_usd': 0,
            'cache_savings_usd': 0,
        }

    # Reset weekly if week changed
    if agg['this_week'].get('date') != week_start:
        agg['this_week'] = {
            'date': week_start,
            'session_count': 0,
            'total_tokens': 0,
            'input_tokens': 0,
            'output_tokens': 0,
            'cache_read_tokens': 0,
            'cache_creation_tokens': 0,
            'opus_tokens': 0,
            'sonnet_tokens': 0,
            'user_messages': 0,
            'tool_calls': 0,
            'total_duration_seconds': 0,
            'estimated_cost_usd': 0,
            'cache_savings_usd': 0,
        }

    # Update all periods
    for period in ['today', 'this_week', 'all_time']:
        agg[period]['session_count'] += 1
        agg[period]['total_tokens'] += session.get('total_tokens', 0)
        agg[period]['input_tokens'] += session.get('input_tokens', 0)
        agg[period]['output_tokens'] += session.get('output_tokens', 0)
        agg[period]['cache_read_tokens'] += session.get('cache_read_tokens', 0)
        agg[period]['cache_creation_tokens'] += session.get('cache_creation_tokens', 0)
        agg[period]['opus_tokens'] += session.get('opus_input_tokens', 0) + session.get('opus_output_tokens', 0)
        agg[period]['sonnet_tokens'] += session.get('sonnet_input_tokens', 0) + session.get('sonnet_output_tokens', 0)
        agg[period]['user_messages'] += session.get('user_messages', 0)
        agg[period]['tool_calls'] += session.get('tool_calls', 0)
        agg[period]['total_duration_seconds'] += session.get('duration_seconds', 0)
        agg[period]['estimated_cost_usd'] = round(
            agg[period]['estimated_cost_usd'] + session.get('estimated_cost_usd', 0), 4
        )
        agg[period]['cache_savings_usd'] = round(
            agg[period]['cache_savings_usd'] + session.get('cache_savings_usd', 0), 4
        )

    # Add last updated timestamp
    agg['last_updated'] = datetime.now(timezone.utc).isoformat()
    agg['max_plan'] = MAX_PLAN

    # Write aggregates
    with open(agg_file, 'w') as f:
        json.dump(agg, f, indent=2)


def main():
    """Main entry point for the stats collector hook."""
    try:
        parser = argparse.ArgumentParser(description='Claude Code Stats Collector')
        parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
        args = parser.parse_args()

        # Read hook input from stdin
        input_data = json.load(sys.stdin)

        # Extract transcript path
        transcript_path = input_data.get('transcript_path', '')

        if not transcript_path or not Path(transcript_path).exists():
            if args.verbose:
                print(f"No transcript found at: {transcript_path}", file=sys.stderr)
            sys.exit(0)

        # Parse transcript
        stats = parse_transcript(transcript_path)

        if args.verbose:
            print(f"Parsed session: {stats['user_messages']} prompts, {stats['total_tokens']} tokens", file=sys.stderr)

        # Save stats
        save_session_stats(input_data, stats)

        if args.verbose:
            print(f"Stats saved successfully", file=sys.stderr)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Stats collector error: {e}", file=sys.stderr)
        sys.exit(0)  # Exit cleanly to not block Claude Code


if __name__ == '__main__':
    main()
