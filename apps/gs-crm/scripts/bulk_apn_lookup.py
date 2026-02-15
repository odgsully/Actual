#!/usr/bin/env python3
"""
Wrapper script for bulk APN lookup from Next.js API
Accepts CSV input via file path, outputs JSON progress updates
"""
import sys
import json
import argparse
import importlib.util
from pathlib import Path
import datetime

def main():
    parser = argparse.ArgumentParser(description='Bulk APN lookup for Next.js API')
    parser.add_argument('input_file', type=str, help='Path to input CSV/Excel file')
    parser.add_argument('--output-dir', type=str, default='./output', help='Output directory')
    parser.add_argument('--rate', type=float, default=5.0, help='Requests per second')
    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Import the actual APN lookup module (with space in name)
    script_dir = Path(__file__).parent
    apn_lookup_path = script_dir / "apn_lookup copy.py"

    # Load the module dynamically because of the space in the filename
    spec = importlib.util.spec_from_file_location("apn_lookup", apn_lookup_path)
    apn_lookup = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(apn_lookup)

    # Import pandas for CSV to Excel conversion
    import pandas as pd

    # Generate output filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    output_path = output_dir / f"APN_Complete_{timestamp}.xlsx"

    # Handle CSV files by converting to Excel first
    actual_input_path = input_path
    if str(input_path).lower().endswith('.csv'):
        # Convert CSV to Excel
        df = pd.read_csv(input_path)
        excel_path = output_dir / f"temp_input_{timestamp}.xlsx"
        df.to_excel(excel_path, index=False, engine='openpyxl')
        actual_input_path = excel_path

    try:
        # Count rows in input file for progress tracking
        row_count = 0
        if str(actual_input_path).lower().endswith('.xlsx'):
            df_count = pd.read_excel(actual_input_path, engine='openpyxl')
            row_count = len(df_count)

        # Send initial progress update
        print(json.dumps({
            'status': 'processing',
            'message': f'Starting APN lookup for {input_path.name}',
            'total_rows': row_count
        }), flush=True)

        # Process the file using the imported function
        result_path = apn_lookup.process_file(
            input_path=actual_input_path,
            sheet=None,
            output_path=output_path,
            rps=args.rate,
            max_retries=3,
            city_whitelist=None,
            debug=False
        )

        # Send success update
        print(json.dumps({
            'status': 'complete',
            'output_file': str(result_path),
            'message': f'Successfully processed {input_path.name}'
        }), flush=True)

        sys.exit(0)

    except Exception as e:
        # Send error update
        print(json.dumps({
            'status': 'error',
            'error': str(e),
            'message': f'Failed to process {input_path.name}'
        }), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    main()