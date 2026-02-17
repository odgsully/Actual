# Quick Start Guide: Adding Supabase to Jarvis_BriefMe

This guide will help you integrate Supabase storage into your Jarvis_BriefMe project in under 10 minutes.

## Prerequisites

- Python 3.12+ installed
- Active Supabase account and project
- Jarvis_BriefMe repository cloned locally

## Step 1: Copy Files to Jarvis_BriefMe (2 minutes)

Copy this entire `jarvis-integration` directory into your Jarvis_BriefMe repository:

```bash
# Navigate to your Jarvis_BriefMe repo
cd /path/to/Jarvis_BriefMe

# Create a lib directory if it doesn't exist
mkdir -p lib

# Copy the integration module
cp -r /path/to/jarvis-integration lib/supabase_integration
```

Your directory structure should look like:
```
Jarvis_BriefMe/
├── main.py
├── lib/
│   └── supabase_integration/
│       ├── __init__.py
│       ├── supabase_writer.py
│       ├── pdf_generator.py
│       ├── requirements.txt
│       ├── schema.sql
│       └── example_integration.py
└── .env
```

## Step 2: Install Dependencies (2 minutes)

```bash
# Install Python packages
pip install -r lib/supabase_integration/requirements.txt

# Install system dependencies (choose your OS)

# macOS:
brew install cairo pango gdk-pixbuf libffi

# Ubuntu/Debian:
sudo apt-get update && sudo apt-get install -y \
  libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
```

## Step 3: Set Up Supabase Database (3 minutes)

1. **Log into Supabase Dashboard**: https://app.supabase.com
2. **Open SQL Editor**: Dashboard → SQL Editor
3. **Run the schema**:
   - Copy contents of `lib/supabase_integration/schema.sql`
   - Paste into SQL Editor
   - Click "Run"
4. **Create Storage Bucket**:
   - Go to Storage → Create bucket
   - Name: `jarvis-briefings`
   - Set to Public (for PDF access)
   - Click "Create bucket"

## Step 4: Configure Environment Variables (1 minute)

Create or edit `.env` in your Jarvis_BriefMe root:

```bash
# Copy example
cp lib/supabase_integration/.env.example .env

# Edit with your credentials
nano .env
```

Add your Supabase credentials:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key-here
```

**Finding your credentials:**
- Dashboard → Settings → API
- Project URL = `SUPABASE_URL`
- `service_role` key (⚠️ NOT anon key) = `SUPABASE_SERVICE_KEY`

## Step 5: Update Your Main Script (2 minutes)

Add this to your `main.py` or wherever you generate briefings:

```python
import os
from datetime import date
from dotenv import load_dotenv

# Import Supabase integration
from lib.supabase_integration import SupabaseWriterSync, generate_pdf

# Load environment variables
load_dotenv()

def save_to_supabase(briefing_data):
    """Save briefing to Supabase database and storage."""
    if not os.getenv('SUPABASE_URL'):
        print("⚠️  Supabase not configured, skipping...")
        return None

    try:
        writer = SupabaseWriterSync()

        # Generate PDF
        pdf_bytes = generate_pdf(
            content_html=briefing_data['html'],
            title=briefing_data['title'],
            briefing_date=date.today()
        )

        # Upload PDF
        pdf_url = writer.upload_pdf(date.today(), pdf_bytes)

        # Save to database
        result = writer.save_briefing(
            briefing_date=date.today(),
            title=briefing_data['title'],
            content_json=briefing_data.get('structured_data', {}),
            content_html=briefing_data['html'],
            content_text=briefing_data['text'],
            metadata={
                'sources': briefing_data.get('sources', []),
                'categories': briefing_data.get('categories', [])
            },
            pdf_url=pdf_url
        )

        print(f"✅ Saved to Supabase! PDF: {pdf_url}")
        return result

    except Exception as e:
        print(f"❌ Supabase save failed: {e}")
        return None

# Then in your main briefing generation function:
def generate_daily_briefing():
    # ... your existing briefing generation code ...

    briefing_data = {
        'title': 'Daily Briefing',
        'html': generated_html,
        'text': generated_text,
        'structured_data': {},
        'sources': [],
        'categories': []
    }

    # Send via email (existing)
    send_email(briefing_data)

    # NEW: Save to Supabase
    save_to_supabase(briefing_data)

    return briefing_data
```

## Step 6: Test It! (1 minute)

```bash
# Run the example integration script
python lib/supabase_integration/example_integration.py

# Or run your main script
python main.py
```

**Expected output:**
```
✅ Briefing saved successfully! ID: 123e4567-e89b-12d3-a456-426614174000
   Date: 2025-12-25
   Title: Daily Intelligence Briefing - December 25, 2025
   PDF: https://your-project.supabase.co/storage/v1/object/public/jarvis-briefings/...
```

## Verify in Supabase Dashboard

1. **Check Database**:
   - Table Editor → `jarvis_briefings`
   - Should see your briefing entry

2. **Check Storage**:
   - Storage → `jarvis-briefings` bucket
   - Should see PDF file

## Troubleshooting

### "Missing Supabase credentials" error
- Check `.env` file exists and has correct variables
- Make sure you're using `SUPABASE_SERVICE_KEY`, not anon key

### WeasyPrint installation fails
- **macOS**: `brew reinstall cairo pango gdk-pixbuf`
- **Linux**: Install all `libcairo2`, `libpango` packages
- **Windows**: Download GTK3 runtime installer

### PDF upload fails
- Verify `jarvis-briefings` bucket exists
- Check bucket is set to "Public" (or adjust RLS policies)
- Confirm you're using service role key

### Table doesn't exist
- Re-run `schema.sql` in Supabase SQL Editor
- Check for error messages during schema creation

## Next Steps

- Review `README.md` for full API documentation
- Check `example_integration.py` for advanced usage
- Customize PDF styling in `pdf_generator.py`
- Add retrieval functions to query past briefings

## Support

- Full documentation: `README.md`
- Example code: `example_integration.py`
- SQL schema: `schema.sql`

Happy briefing! 📰
