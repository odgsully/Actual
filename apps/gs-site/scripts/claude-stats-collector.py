#!/usr/bin/env python3
"""
Claude Code Stats Collector

Parses Claude Code session files from ~/.claude/projects/ and generates
aggregated usage statistics for the GS Site MAX 20x dashboard tile.

Output files (written to apps/gs-site/data/claude-stats/):
  - aggregates.json: Today/this week/all-time totals
  - sessions-YYYY-MM-DD.json: Individual session records for each day

Usage:
  python claude-stats-collector.py [--days 7] [--output /path/to/data]

Requirements:
  - Python 3.8+
  - No external dependencies (uses only stdlib)
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
from typing import TypedDict, Optional
import hashlib


# Token pricing (USD per 1M tokens) - matches lib/config/claude-code.ts
TOKEN_PRICING = {
    "input": 15.0,
    "output": 75.0,
    "cache_read": 1.5,
    "cache_creation": 18.75,
}


class SessionStats(TypedDict):
    session_id: str
    project: str
    project_path: str
    recorded_at: str
    max_plan: str
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_creation_tokens: int
    total_tokens: int
    opus_input_tokens: int
    opus_output_tokens: int
    sonnet_input_tokens: int
    sonnet_output_tokens: int
    user_messages: int
    assistant_messages: int
    tool_calls: int
    tool_breakdown: dict
    models_used: list
    primary_model: Optional[str]
    duration_seconds: int
    cache_hit_rate: float
    estimated_cost_usd: float
    cache_savings_usd: float


class PeriodAggregates(TypedDict):
    date: str
    session_count: int
    total_tokens: int
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_creation_tokens: int
    opus_tokens: int
    sonnet_tokens: int
    user_messages: int
    tool_calls: int
    total_duration_seconds: int
    estimated_cost_usd: float
    cache_savings_usd: float


def get_claude_projects_dir() -> Path:
    """Get the Claude Code projects directory."""
    return Path.home() / ".claude" / "projects"


def parse_session_file(session_path: Path) -> Optional[SessionStats]:
    """Parse a single session JSONL file and extract stats."""
    try:
        session_id = session_path.stem
        project_dir = session_path.parent.name

        # Decode project path from directory name
        project_path = project_dir.replace("-", "/")
        if project_path.startswith("/"):
            project_path = project_path[1:]  # Remove leading slash from encoding

        # Extract project name (last component of path)
        project_parts = project_path.split("/")
        project_name = project_parts[-1] if project_parts else "unknown"

        # Initialize counters
        input_tokens = 0
        output_tokens = 0
        cache_read_tokens = 0
        cache_creation_tokens = 0
        opus_input = 0
        opus_output = 0
        sonnet_input = 0
        sonnet_output = 0
        user_messages = 0
        assistant_messages = 0
        tool_calls = 0
        tool_breakdown = defaultdict(int)
        models_used = set()
        first_timestamp = None
        last_timestamp = None

        with open(session_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                entry_type = entry.get("type")
                timestamp_str = entry.get("timestamp")

                # Track timestamps for duration calculation
                if timestamp_str:
                    try:
                        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                        if first_timestamp is None or ts < first_timestamp:
                            first_timestamp = ts
                        if last_timestamp is None or ts > last_timestamp:
                            last_timestamp = ts
                    except (ValueError, TypeError):
                        pass

                if entry_type == "user":
                    user_messages += 1

                elif entry_type == "assistant":
                    assistant_messages += 1
                    message = entry.get("message", {})
                    model = message.get("model", "")
                    usage = message.get("usage", {})

                    if model:
                        models_used.add(model)

                    # Extract token counts
                    msg_input = usage.get("input_tokens", 0)
                    msg_output = usage.get("output_tokens", 0)
                    msg_cache_read = usage.get("cache_read_input_tokens", 0)
                    msg_cache_creation = usage.get("cache_creation_input_tokens", 0)

                    input_tokens += msg_input
                    output_tokens += msg_output
                    cache_read_tokens += msg_cache_read
                    cache_creation_tokens += msg_cache_creation

                    # Track by model type
                    is_opus = "opus" in model.lower()
                    is_sonnet = "sonnet" in model.lower()

                    if is_opus:
                        opus_input += msg_input + msg_cache_read + msg_cache_creation
                        opus_output += msg_output
                    elif is_sonnet:
                        sonnet_input += msg_input + msg_cache_read + msg_cache_creation
                        sonnet_output += msg_output

                    # Count tool calls
                    content = message.get("content", [])
                    if isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get("type") == "tool_use":
                                tool_calls += 1
                                tool_name = item.get("name", "unknown")
                                tool_breakdown[tool_name] += 1

        # Calculate derived metrics
        total_tokens = input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens

        # Calculate duration
        duration_seconds = 0
        if first_timestamp and last_timestamp:
            duration_seconds = int((last_timestamp - first_timestamp).total_seconds())

        # Calculate cache hit rate
        total_input_context = input_tokens + cache_read_tokens
        cache_hit_rate = cache_read_tokens / total_input_context if total_input_context > 0 else 0.0

        # Calculate costs
        estimated_cost_usd = (
            (input_tokens * TOKEN_PRICING["input"]) +
            (output_tokens * TOKEN_PRICING["output"]) +
            (cache_read_tokens * TOKEN_PRICING["cache_read"]) +
            (cache_creation_tokens * TOKEN_PRICING["cache_creation"])
        ) / 1_000_000

        # Cache savings (what was saved by using cache vs full input pricing)
        savings_per_token = TOKEN_PRICING["input"] - TOKEN_PRICING["cache_read"]
        cache_savings_usd = (cache_read_tokens * savings_per_token) / 1_000_000

        # Determine primary model
        models_list = list(models_used)
        primary_model = None
        if models_list:
            # Prefer Opus if used
            for m in models_list:
                if "opus" in m.lower():
                    primary_model = m
                    break
            if not primary_model:
                primary_model = models_list[0]

        # Skip sessions with no meaningful data
        if total_tokens == 0 and user_messages == 0:
            return None

        return SessionStats(
            session_id=session_id,
            project=project_name,
            project_path=project_path,
            recorded_at=last_timestamp.isoformat() if last_timestamp else datetime.now().isoformat(),
            max_plan="20x",  # Default, can be configured
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cache_read_tokens=cache_read_tokens,
            cache_creation_tokens=cache_creation_tokens,
            total_tokens=total_tokens,
            opus_input_tokens=opus_input,
            opus_output_tokens=opus_output,
            sonnet_input_tokens=sonnet_input,
            sonnet_output_tokens=sonnet_output,
            user_messages=user_messages,
            assistant_messages=assistant_messages,
            tool_calls=tool_calls,
            tool_breakdown=dict(tool_breakdown),
            models_used=models_list,
            primary_model=primary_model,
            duration_seconds=duration_seconds,
            cache_hit_rate=round(cache_hit_rate, 4),
            estimated_cost_usd=round(estimated_cost_usd, 4),
            cache_savings_usd=round(cache_savings_usd, 4),
        )

    except Exception as e:
        print(f"Error parsing {session_path}: {e}", file=sys.stderr)
        return None


def collect_sessions(days: int = 7) -> dict[str, list[SessionStats]]:
    """Collect sessions from the past N days, grouped by date."""
    projects_dir = get_claude_projects_dir()

    if not projects_dir.exists():
        print(f"Claude projects directory not found: {projects_dir}", file=sys.stderr)
        return {}

    cutoff_date = datetime.now() - timedelta(days=days)
    sessions_by_date: dict[str, list[SessionStats]] = defaultdict(list)
    processed_sessions = set()  # Track processed session IDs to avoid duplicates

    # Scan all project directories
    for project_dir in projects_dir.iterdir():
        if not project_dir.is_dir():
            continue

        # Find all JSONL session files
        for session_file in project_dir.glob("*.jsonl"):
            # Check file modification time
            mtime = datetime.fromtimestamp(session_file.stat().st_mtime)
            if mtime < cutoff_date:
                continue

            session_id = session_file.stem
            if session_id in processed_sessions:
                continue

            stats = parse_session_file(session_file)
            if stats:
                # Get the session date from recorded_at
                try:
                    session_date = stats["recorded_at"][:10]  # YYYY-MM-DD
                except (KeyError, IndexError):
                    session_date = mtime.strftime("%Y-%m-%d")

                sessions_by_date[session_date].append(stats)
                processed_sessions.add(session_id)

    return sessions_by_date


def create_empty_aggregates(date_str: str) -> PeriodAggregates:
    """Create empty period aggregates."""
    return PeriodAggregates(
        date=date_str,
        session_count=0,
        total_tokens=0,
        input_tokens=0,
        output_tokens=0,
        cache_read_tokens=0,
        cache_creation_tokens=0,
        opus_tokens=0,
        sonnet_tokens=0,
        user_messages=0,
        tool_calls=0,
        total_duration_seconds=0,
        estimated_cost_usd=0.0,
        cache_savings_usd=0.0,
    )


def aggregate_sessions(sessions: list[SessionStats], date_str: str) -> PeriodAggregates:
    """Aggregate a list of sessions into period totals."""
    agg = create_empty_aggregates(date_str)

    for s in sessions:
        agg["session_count"] += 1
        agg["total_tokens"] += s["total_tokens"]
        agg["input_tokens"] += s["input_tokens"]
        agg["output_tokens"] += s["output_tokens"]
        agg["cache_read_tokens"] += s["cache_read_tokens"]
        agg["cache_creation_tokens"] += s["cache_creation_tokens"]
        agg["opus_tokens"] += s["opus_input_tokens"] + s["opus_output_tokens"]
        agg["sonnet_tokens"] += s["sonnet_input_tokens"] + s["sonnet_output_tokens"]
        agg["user_messages"] += s["user_messages"]
        agg["tool_calls"] += s["tool_calls"]
        agg["total_duration_seconds"] += s["duration_seconds"]
        agg["estimated_cost_usd"] += s["estimated_cost_usd"]
        agg["cache_savings_usd"] += s["cache_savings_usd"]

    # Round floats
    agg["estimated_cost_usd"] = round(agg["estimated_cost_usd"], 4)
    agg["cache_savings_usd"] = round(agg["cache_savings_usd"], 4)

    return agg


def get_week_start(date: datetime) -> datetime:
    """Get the start of the week (Monday) for a given date."""
    return date - timedelta(days=date.weekday())


def main():
    parser = argparse.ArgumentParser(description="Collect Claude Code usage statistics")
    parser.add_argument("--days", type=int, default=30, help="Number of days to scan (default: 30)")
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output directory (default: apps/gs-site/data/claude-stats relative to script)",
    )
    parser.add_argument("--plan", type=str, default="20x", choices=["5x", "20x"], help="MAX plan type")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()

    # Determine output directory
    if args.output:
        output_dir = Path(args.output)
    else:
        # Default: apps/gs-site/data/claude-stats relative to this script
        script_dir = Path(__file__).parent
        output_dir = script_dir.parent / "data" / "claude-stats"

    output_dir.mkdir(parents=True, exist_ok=True)

    if args.verbose:
        print(f"Collecting sessions from the past {args.days} days...")
        print(f"Output directory: {output_dir}")

    # Collect sessions
    sessions_by_date = collect_sessions(days=args.days)

    if args.verbose:
        total_sessions = sum(len(s) for s in sessions_by_date.values())
        print(f"Found {total_sessions} sessions across {len(sessions_by_date)} days")

    # Write daily session files
    for date_str, sessions in sessions_by_date.items():
        sessions_file = output_dir / f"sessions-{date_str}.json"
        with open(sessions_file, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=2, default=str)
        if args.verbose:
            print(f"  Wrote {len(sessions)} sessions to {sessions_file.name}")

    # Calculate aggregates
    today = datetime.now().strftime("%Y-%m-%d")
    week_start = get_week_start(datetime.now()).strftime("%Y-%m-%d")

    # Today's sessions
    today_sessions = sessions_by_date.get(today, [])
    today_agg = aggregate_sessions(today_sessions, today)

    # This week's sessions (Monday to today)
    week_sessions = []
    current = get_week_start(datetime.now())
    while current <= datetime.now():
        date_str = current.strftime("%Y-%m-%d")
        week_sessions.extend(sessions_by_date.get(date_str, []))
        current += timedelta(days=1)
    week_agg = aggregate_sessions(week_sessions, week_start)

    # All time (all collected sessions)
    all_sessions = []
    for sessions in sessions_by_date.values():
        all_sessions.extend(sessions)
    all_time_agg = aggregate_sessions(all_sessions, "all_time")

    # Build aggregates file
    aggregates = {
        "today": today_agg,
        "this_week": week_agg,
        "all_time": all_time_agg,
        "last_updated": datetime.now().isoformat(),
        "max_plan": args.plan,
    }

    # Write aggregates
    aggregates_file = output_dir / "aggregates.json"
    with open(aggregates_file, "w", encoding="utf-8") as f:
        json.dump(aggregates, f, indent=2)

    if args.verbose:
        print(f"\nAggregates written to {aggregates_file}")
        print(f"\n=== Summary ===")
        print(f"Today: {today_agg['session_count']} sessions, {today_agg['total_tokens']:,} tokens, ${today_agg['estimated_cost_usd']:.2f}")
        print(f"This Week: {week_agg['session_count']} sessions, {week_agg['total_tokens']:,} tokens, ${week_agg['estimated_cost_usd']:.2f}")
        print(f"All Time ({args.days} days): {all_time_agg['session_count']} sessions, {all_time_agg['total_tokens']:,} tokens, ${all_time_agg['estimated_cost_usd']:.2f}")

        if all_time_agg['opus_tokens'] + all_time_agg['sonnet_tokens'] > 0:
            opus_pct = all_time_agg['opus_tokens'] / (all_time_agg['opus_tokens'] + all_time_agg['sonnet_tokens']) * 100
            print(f"Model Split: {opus_pct:.1f}% Opus / {100-opus_pct:.1f}% Sonnet")

        if all_time_agg['input_tokens'] + all_time_agg['cache_read_tokens'] > 0:
            cache_rate = all_time_agg['cache_read_tokens'] / (all_time_agg['input_tokens'] + all_time_agg['cache_read_tokens']) * 100
            print(f"Cache Hit Rate: {cache_rate:.1f}%")
            print(f"Cache Savings: ${all_time_agg['cache_savings_usd']:.2f}")
    else:
        # Non-verbose: just print key stats
        print(f"Today: {today_agg['total_tokens']:,} tokens (${today_agg['estimated_cost_usd']:.2f})")
        print(f"Week: {week_agg['total_tokens']:,} tokens (${week_agg['estimated_cost_usd']:.2f})")
        print(f"Wrote aggregates to {aggregates_file}")


if __name__ == "__main__":
    main()
