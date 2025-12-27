"""
Example Integration Script for Jarvis_BriefMe

This demonstrates how to integrate the Supabase writer into your Jarvis_BriefMe workflow.
Copy and adapt this code into your main Jarvis script.
"""

import os
import logging
from datetime import date, datetime
from typing import Dict, Any, List
from dotenv import load_dotenv

# Import the Supabase integration modules
from supabase_writer import SupabaseWriterSync
from pdf_generator import generate_pdf, generate_pdf_from_sections

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def prepare_briefing_data(
    raw_briefing: Dict[str, Any],
    sources: List[str],
    categories: List[str]
) -> Dict[str, Any]:
    """
    Prepare briefing data for Supabase storage.

    Args:
        raw_briefing: Raw briefing data from your generation process
        sources: List of data sources used
        categories: List of content categories

    Returns:
        Formatted briefing data ready for Supabase
    """
    today = date.today()

    # Structure the JSON content
    content_json = {
        "sections": raw_briefing.get("sections", []),
        "summary": raw_briefing.get("summary", ""),
        "highlights": raw_briefing.get("highlights", []),
        "generated_at": datetime.now().isoformat(),
        "version": "1.0"
    }

    # Prepare metadata
    metadata = {
        "sources": sources,
        "categories": categories,
        "word_count": len(raw_briefing.get("text", "").split()),
        "section_count": len(raw_briefing.get("sections", [])),
        "generated_by": "Jarvis_BriefMe",
        "generation_timestamp": datetime.now().isoformat()
    }

    return {
        "briefing_date": today,
        "title": raw_briefing.get("title", f"Daily Briefing - {today.strftime('%B %d, %Y')}"),
        "content_json": content_json,
        "content_html": raw_briefing.get("html", ""),
        "content_text": raw_briefing.get("text", ""),
        "metadata": metadata
    }


def save_to_supabase(briefing_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save briefing to Supabase database and storage.

    Args:
        briefing_data: Prepared briefing data

    Returns:
        Saved briefing record with PDF URL

    Raises:
        Exception: If save operation fails
    """
    try:
        # Initialize Supabase writer
        writer = SupabaseWriterSync()

        # Extract data
        briefing_date = briefing_data["briefing_date"]
        title = briefing_data["title"]
        content_html = briefing_data["content_html"]

        logger.info(f"Generating PDF for briefing: {title}")

        # Generate PDF from HTML content
        pdf_bytes = generate_pdf(
            content_html=content_html,
            title=title,
            briefing_date=briefing_date
        )

        logger.info(f"PDF generated successfully ({len(pdf_bytes):,} bytes)")

        # Upload PDF to Supabase Storage
        logger.info("Uploading PDF to Supabase Storage...")
        pdf_url = writer.upload_pdf(
            briefing_date=briefing_date,
            pdf_bytes=pdf_bytes
        )

        logger.info(f"PDF uploaded: {pdf_url}")

        # Save briefing to database
        logger.info("Saving briefing to database...")
        result = writer.save_briefing(
            briefing_date=briefing_data["briefing_date"],
            title=briefing_data["title"],
            content_json=briefing_data["content_json"],
            content_html=briefing_data["content_html"],
            content_text=briefing_data["content_text"],
            metadata=briefing_data["metadata"],
            pdf_url=pdf_url
        )

        logger.info(f"✅ Briefing saved successfully! ID: {result['id']}")
        logger.info(f"   Date: {result['briefing_date']}")
        logger.info(f"   Title: {result['title']}")
        logger.info(f"   PDF: {result['pdf_url']}")

        return result

    except Exception as e:
        logger.error(f"❌ Failed to save briefing to Supabase: {e}", exc_info=True)
        raise


def generate_and_save_briefing():
    """
    Main function demonstrating full workflow:
    1. Generate briefing (your existing code)
    2. Save to Supabase (new functionality)
    """
    try:
        # ========================================
        # STEP 1: Generate Briefing
        # ========================================
        # Replace this with your actual briefing generation code

        logger.info("Generating daily briefing...")

        # Example briefing data structure
        # In your actual code, this would come from your briefing generation process
        raw_briefing = {
            "title": f"Daily Intelligence Briefing - {date.today().strftime('%B %d, %Y')}",
            "sections": [
                {
                    "heading": "Executive Summary",
                    "content": "<p>Key developments in technology, markets, and global affairs...</p>"
                },
                {
                    "heading": "Technology",
                    "content": "<p>Latest tech news and trends...</p>"
                },
                {
                    "heading": "Markets",
                    "content": "<p>Market analysis and economic indicators...</p>"
                }
            ],
            "html": """
                <h2>Executive Summary</h2>
                <p>Key developments in technology, markets, and global affairs...</p>

                <h2>Technology</h2>
                <p>Latest tech news and trends...</p>

                <h2>Markets</h2>
                <p>Market analysis and economic indicators...</p>
            """,
            "text": "Executive Summary\nKey developments...\n\nTechnology\nLatest tech news...",
            "summary": "Daily briefing covering tech, markets, and global affairs",
            "highlights": [
                "Tech sector shows strong growth",
                "Market indices reach new highs",
                "Global policy shifts impact trade"
            ]
        }

        # Data sources and categories
        sources = ["Reuters", "Bloomberg", "TechCrunch", "The Economist"]
        categories = ["Technology", "Markets", "Politics", "Business"]

        # ========================================
        # STEP 2: Prepare Data for Supabase
        # ========================================
        logger.info("Preparing briefing data...")
        briefing_data = prepare_briefing_data(raw_briefing, sources, categories)

        # ========================================
        # STEP 3: Save to Supabase
        # ========================================
        if os.getenv('SUPABASE_URL'):
            logger.info("Saving to Supabase...")
            result = save_to_supabase(briefing_data)
            logger.info("✅ Complete! Briefing saved to database and storage")
            return result
        else:
            logger.warning("⚠️  Supabase not configured (SUPABASE_URL not set)")
            logger.warning("    Briefing generated but not saved to database")
            return None

    except Exception as e:
        logger.error(f"❌ Error in briefing workflow: {e}", exc_info=True)
        raise


def retrieve_recent_briefings(days: int = 7):
    """
    Example: Retrieve recent briefings from Supabase.

    Args:
        days: Number of recent briefings to retrieve
    """
    try:
        writer = SupabaseWriterSync()

        logger.info(f"Retrieving last {days} briefings...")
        briefings = writer.list_briefings(limit=days)

        logger.info(f"Found {len(briefings)} briefings:")
        for b in briefings:
            logger.info(f"  📅 {b['briefing_date']}: {b['title']}")
            logger.info(f"     PDF: {b['pdf_url']}")

        return briefings

    except Exception as e:
        logger.error(f"Failed to retrieve briefings: {e}", exc_info=True)
        raise


def get_todays_briefing():
    """
    Example: Retrieve today's briefing if it exists.
    """
    try:
        writer = SupabaseWriterSync()
        today = date.today()

        logger.info(f"Checking for today's briefing ({today})...")
        briefing = writer.get_briefing(today)

        if briefing:
            logger.info(f"✅ Found briefing: {briefing['title']}")
            logger.info(f"   PDF: {briefing['pdf_url']}")
            return briefing
        else:
            logger.info(f"ℹ️  No briefing found for {today}")
            return None

    except Exception as e:
        logger.error(f"Failed to retrieve today's briefing: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    """
    Example usage - run this script to test the integration.
    """

    # Load environment variables from .env file
    load_dotenv()

    # Check configuration
    if not os.getenv('SUPABASE_URL'):
        print("\n⚠️  ERROR: SUPABASE_URL not set in environment")
        print("Please create a .env file with:")
        print("  SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_SERVICE_KEY=your-service-role-key")
        exit(1)

    print("\n" + "="*60)
    print("Jarvis_BriefMe Supabase Integration Example")
    print("="*60 + "\n")

    # Example 1: Generate and save today's briefing
    print("1️⃣  Generating and saving today's briefing...")
    try:
        result = generate_and_save_briefing()
        if result:
            print(f"\n✅ SUCCESS! Briefing saved with ID: {result['id']}")
            print(f"   View PDF: {result['pdf_url']}\n")
    except Exception as e:
        print(f"\n❌ FAILED: {e}\n")

    # Example 2: Retrieve today's briefing
    print("\n2️⃣  Retrieving today's briefing...")
    try:
        briefing = get_todays_briefing()
        print()
    except Exception as e:
        print(f"\n❌ FAILED: {e}\n")

    # Example 3: List recent briefings
    print("\n3️⃣  Listing recent briefings...")
    try:
        recent = retrieve_recent_briefings(days=7)
        print()
    except Exception as e:
        print(f"\n❌ FAILED: {e}\n")

    print("="*60)
    print("Examples complete!")
    print("="*60 + "\n")
