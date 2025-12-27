"""
Jarvis_BriefMe Supabase Integration Module

This package provides database and PDF generation capabilities for Jarvis briefings.

Usage:
    from jarvis_integration import SupabaseWriterSync, generate_pdf
    from datetime import date

    writer = SupabaseWriterSync()
    pdf_bytes = generate_pdf(html_content, "Daily Briefing", date.today())
    pdf_url = writer.upload_pdf(date.today(), pdf_bytes)
    briefing = writer.save_briefing(...)
"""

from .supabase_writer import SupabaseWriter, SupabaseWriterSync
from .pdf_generator import (
    generate_pdf,
    generate_pdf_from_sections,
    generate_pdf_with_cover,
    save_pdf_to_file
)

__version__ = "1.0.0"
__all__ = [
    "SupabaseWriter",
    "SupabaseWriterSync",
    "generate_pdf",
    "generate_pdf_from_sections",
    "generate_pdf_with_cover",
    "save_pdf_to_file"
]
