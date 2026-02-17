# Jarvis_BriefMe Supabase Integration

This module provides Supabase database and storage integration for the [Jarvis_BriefMe](https://github.com/odgsully/Jarvis_BriefMe) project, enabling briefings to be stored in a database and accessed via web applications.

## Features

- 📝 **Database Storage**: Save briefings with JSON, HTML, and text formats
- 📄 **PDF Generation**: Convert HTML briefings to professionally styled PDFs
- ☁️ **Cloud Storage**: Upload PDFs to Supabase Storage buckets
- 🔍 **Query Interface**: Retrieve and list briefings by date
- 🔄 **Async Support**: Both async and sync API options

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. System Dependencies (for WeasyPrint PDF generation)

**macOS:**
```bash
brew install cairo pango gdk-pixbuf libffi
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential python3-dev python3-pip \
  libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
```

**Windows:**
- Download GTK3 runtime from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases

## Supabase Setup

### 1. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE jarvis_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster date queries
CREATE INDEX idx_jarvis_briefings_date ON jarvis_briefings(briefing_date DESC);

-- Index for metadata searches
CREATE INDEX idx_jarvis_briefings_metadata ON jarvis_briefings USING GIN (metadata);

-- Enable Row Level Security (optional)
ALTER TABLE jarvis_briefings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (optional)
CREATE POLICY "Allow authenticated users to read briefings"
  ON jarvis_briefings FOR SELECT
  TO authenticated
  USING (true);
```

### 2. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `jarvis-briefings`
3. Set to **Public** if you want PDFs accessible via URL
4. Set policies as needed

### 3. Environment Variables

Create a `.env` file in your Jarvis_BriefMe project:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Note: Use SERVICE_ROLE_KEY (not anon key) for storage uploads
```

**Finding your credentials:**
- URL: Supabase Dashboard → Settings → API → Project URL
- Service Key: Supabase Dashboard → Settings → API → `service_role` key (⚠️ Keep secret!)

## Usage

### Basic Example

```python
from datetime import date
from supabase_writer import SupabaseWriterSync
from pdf_generator import generate_pdf

# Initialize writer
writer = SupabaseWriterSync()

# Your briefing data
briefing_date = date.today()
title = "Daily Intelligence Briefing"
content_html = "<h2>Executive Summary</h2><p>Market analysis...</p>"
content_text = "Executive Summary\nMarket analysis..."
content_json = {
    "sections": [
        {"heading": "Executive Summary", "content": "Market analysis..."}
    ]
}
metadata = {
    "sources": ["Reuters", "Bloomberg"],
    "categories": ["Markets", "Tech"],
    "word_count": 1500
}

# Generate PDF
pdf_bytes = generate_pdf(content_html, title, briefing_date)

# Upload PDF to storage
pdf_url = writer.upload_pdf(briefing_date, pdf_bytes)

# Save briefing to database
briefing = writer.save_briefing(
    briefing_date=briefing_date,
    title=title,
    content_json=content_json,
    content_html=content_html,
    content_text=content_text,
    metadata=metadata,
    pdf_url=pdf_url
)

print(f"Briefing saved with ID: {briefing['id']}")
print(f"PDF available at: {pdf_url}")
```

### Integration with Jarvis_BriefMe

Add this to your Jarvis main script (e.g., `main.py`):

```python
import os
from datetime import date
from dotenv import load_dotenv
from supabase_writer import SupabaseWriterSync
from pdf_generator import generate_pdf

# Load environment variables
load_dotenv()

def save_briefing_to_supabase(briefing_data):
    """
    Save generated briefing to Supabase.

    Args:
        briefing_data: Dict containing briefing content
    """
    try:
        # Initialize Supabase writer
        writer = SupabaseWriterSync()

        # Extract data
        today = date.today()
        title = briefing_data.get('title', f'Daily Briefing - {today}')
        content_html = briefing_data.get('html')
        content_text = briefing_data.get('text')
        content_json = briefing_data.get('structured_data', {})
        metadata = {
            'sources': briefing_data.get('sources', []),
            'categories': briefing_data.get('categories', []),
            'generated_at': briefing_data.get('timestamp'),
            'version': briefing_data.get('version', '1.0')
        }

        # Generate PDF
        print("Generating PDF...")
        pdf_bytes = generate_pdf(content_html, title, today)

        # Upload PDF
        print("Uploading PDF to Supabase Storage...")
        pdf_url = writer.upload_pdf(today, pdf_bytes)

        # Save to database
        print("Saving briefing to Supabase database...")
        result = writer.save_briefing(
            briefing_date=today,
            title=title,
            content_json=content_json,
            content_html=content_html,
            content_text=content_text,
            metadata=metadata,
            pdf_url=pdf_url
        )

        print(f"✅ Briefing saved successfully!")
        print(f"   ID: {result['id']}")
        print(f"   PDF: {pdf_url}")

        return result

    except Exception as e:
        print(f"❌ Failed to save briefing to Supabase: {e}")
        raise

# Then in your main briefing generation function:
def generate_daily_briefing():
    # ... your existing briefing generation code ...

    briefing_data = {
        'title': 'Daily Intelligence Briefing',
        'html': generated_html,
        'text': generated_text,
        'structured_data': structured_data,
        'sources': sources_list,
        'categories': categories_list,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0'
    }

    # Send via email (existing functionality)
    send_email_briefing(briefing_data)

    # NEW: Save to Supabase
    if os.getenv('SUPABASE_URL'):
        save_briefing_to_supabase(briefing_data)
    else:
        print("⚠️  Supabase not configured, skipping database save")

    return briefing_data
```

### Async Example (for async applications)

```python
import asyncio
from supabase_writer import SupabaseWriter
from pdf_generator import generate_pdf

async def save_briefing_async():
    writer = SupabaseWriter()

    # Generate PDF (sync operation)
    pdf_bytes = generate_pdf(content_html, title, briefing_date)

    # Upload and save (async)
    pdf_url = await writer.upload_pdf(briefing_date, pdf_bytes)
    briefing = await writer.save_briefing(
        briefing_date=briefing_date,
        title=title,
        content_json=content_json,
        content_html=content_html,
        content_text=content_text,
        metadata=metadata,
        pdf_url=pdf_url
    )

    return briefing

# Run async function
asyncio.run(save_briefing_async())
```

### Retrieving Briefings

```python
from datetime import date, timedelta
from supabase_writer import SupabaseWriterSync

writer = SupabaseWriterSync()

# Get today's briefing
today = date.today()
briefing = writer.get_briefing(today)
if briefing:
    print(f"Title: {briefing['title']}")
    print(f"PDF: {briefing['pdf_url']}")

# Get last 30 days of briefings
recent_briefings = writer.list_briefings(limit=30)
for b in recent_briefings:
    print(f"{b['briefing_date']}: {b['title']}")
```

### Advanced PDF Generation

```python
from pdf_generator import (
    generate_pdf,
    generate_pdf_from_sections,
    generate_pdf_with_cover
)

# Generate PDF from structured sections
sections = [
    {'heading': 'Executive Summary', 'content': '<p>Summary...</p>'},
    {'heading': 'Market Analysis', 'content': '<p>Analysis...</p>'},
    {'heading': 'Technology News', 'content': '<p>Tech news...</p>'}
]
pdf_bytes = generate_pdf_from_sections(sections, title, date.today())

# Generate PDF with custom cover page
pdf_bytes = generate_pdf_with_cover(
    content_html=content_html,
    title="Daily Intelligence Briefing",
    briefing_date=date.today(),
    subtitle="Market Analysis & Technology Insights",
    author="Jarvis AI",
    cover_image_url="https://example.com/logo.png"
)

# Custom CSS styling
custom_css = """
h1 { color: #1a1a1a; font-size: 28pt; }
.custom-section { background-color: #f0f0f0; padding: 1em; }
"""
pdf_bytes = generate_pdf(content_html, title, date.today(), custom_css=custom_css)
```

## API Reference

### SupabaseWriter

**Constructor:**
- `SupabaseWriter(supabase_url=None, supabase_key=None)` - Initialize client (reads from env vars if not provided)

**Methods:**
- `save_briefing(date, title, content_json, content_html, content_text, metadata, pdf_url)` - Save briefing
- `upload_pdf(date, pdf_bytes, filename=None)` - Upload PDF to storage
- `get_briefing(date)` - Retrieve briefing by date
- `list_briefings(limit=30, offset=0, order_by='briefing_date', ascending=False)` - List briefings
- `delete_briefing(date)` - Delete briefing
- `update_pdf_url(date, pdf_url)` - Update PDF URL for existing briefing

### PDF Generator

**Functions:**
- `generate_pdf(content_html, title, date, custom_css=None)` - Generate basic PDF
- `generate_pdf_from_sections(sections, title, date, custom_css=None)` - Generate from section list
- `generate_pdf_with_cover(content_html, title, date, cover_image_url, subtitle, author)` - Generate with cover
- `save_pdf_to_file(pdf_bytes, filepath)` - Save PDF to local file

## Error Handling

```python
from supabase_writer import SupabaseWriterSync
import logging

logging.basicConfig(level=logging.INFO)
writer = SupabaseWriterSync()

try:
    result = writer.save_briefing(...)
except ValueError as e:
    print(f"Configuration error: {e}")
except Exception as e:
    print(f"Database error: {e}")
```

## Testing

```python
# Test Supabase connection
from supabase_writer import SupabaseWriterSync
from datetime import date

writer = SupabaseWriterSync()
briefings = writer.list_briefings(limit=1)
print(f"✅ Supabase connected! Found {len(briefings)} briefing(s)")

# Test PDF generation
from pdf_generator import generate_pdf

pdf = generate_pdf("<h1>Test</h1><p>Hello world</p>", "Test", date.today())
print(f"✅ PDF generated! Size: {len(pdf)} bytes")
```

## Security Notes

- 🔐 **Never commit** `.env` files or service role keys to Git
- 🔒 Use **service_role** key (not anon key) for storage uploads
- 🛡️ Enable Row Level Security (RLS) on production databases
- 📝 Consider implementing user-specific access policies
- 🔑 Rotate service keys periodically

## Troubleshooting

### "Missing Supabase credentials" Error
- Check `.env` file exists and has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Run `source .env` or use `python-dotenv` to load variables

### WeasyPrint Installation Issues
- Ensure system dependencies are installed (Cairo, Pango, etc.)
- On macOS: Try `brew reinstall cairo pango gdk-pixbuf`
- On Linux: Check all `libcairo2` and `libpango` packages are installed

### PDF Upload Fails
- Verify bucket `jarvis-briefings` exists in Supabase Storage
- Check bucket permissions (public vs. private)
- Ensure using **service_role** key, not anon key

### Database Insert Fails
- Verify table `jarvis_briefings` exists
- Check all required columns are present
- Review RLS policies if enabled

## License

This integration module inherits the license from the main Jarvis_BriefMe project.

## Support

For issues specific to this integration:
1. Check the troubleshooting section above
2. Review Supabase logs in the Dashboard
3. Open an issue in the Jarvis_BriefMe repository

## Version History

- **v1.0.0** (2025-12-25): Initial release
  - Supabase database integration
  - PDF generation with WeasyPrint
  - Storage bucket uploads
  - Async and sync API support
