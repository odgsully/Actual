"""
Supabase Writer for Jarvis_BriefMe
Handles writing briefings and PDFs to Supabase database and storage.
"""

import os
import logging
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

logger = logging.getLogger(__name__)


class SupabaseWriter:
    """
    Manages writing Jarvis briefings to Supabase database and storage.

    Environment Variables Required:
        SUPABASE_URL: Your Supabase project URL
        SUPABASE_SERVICE_KEY: Service role key (not anon key - needs storage access)
    """

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        """
        Initialize Supabase client.

        Args:
            supabase_url: Supabase project URL (defaults to env var)
            supabase_key: Supabase service role key (defaults to env var)
        """
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_SERVICE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY "
                "environment variables or pass them to the constructor."
            )

        try:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    async def save_briefing(
        self,
        briefing_date: date,
        title: str,
        content_json: Dict[str, Any],
        content_html: str,
        content_text: str,
        metadata: Optional[Dict[str, Any]] = None,
        pdf_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save a briefing to the Supabase database.

        Args:
            briefing_date: Date of the briefing
            title: Briefing title
            content_json: Structured JSON content
            content_html: HTML-formatted content
            content_text: Plain text content
            metadata: Additional metadata (sources, categories, etc.)
            pdf_url: URL to PDF in storage (if already uploaded)

        Returns:
            The created briefing record

        Raises:
            Exception: If database operation fails
        """
        try:
            briefing_data = {
                'briefing_date': briefing_date.isoformat(),
                'title': title,
                'content_json': content_json,
                'content_html': content_html,
                'content_text': content_text,
                'metadata': metadata or {},
                'pdf_url': pdf_url,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            # Check if briefing already exists for this date
            existing = self.client.table('jarvis_briefings').select('id').eq(
                'briefing_date', briefing_date.isoformat()
            ).execute()

            if existing.data:
                # Update existing briefing
                logger.info(f"Updating existing briefing for {briefing_date}")
                result = self.client.table('jarvis_briefings').update(
                    briefing_data
                ).eq('briefing_date', briefing_date.isoformat()).execute()
            else:
                # Insert new briefing
                logger.info(f"Creating new briefing for {briefing_date}")
                result = self.client.table('jarvis_briefings').insert(
                    briefing_data
                ).execute()

            if result.data:
                logger.info(f"Successfully saved briefing for {briefing_date}")
                return result.data[0]
            else:
                raise Exception("No data returned from Supabase")

        except Exception as e:
            logger.error(f"Failed to save briefing for {briefing_date}: {e}")
            raise

    async def upload_pdf(
        self,
        briefing_date: date,
        pdf_bytes: bytes,
        filename: Optional[str] = None
    ) -> str:
        """
        Upload a PDF briefing to Supabase Storage.

        Args:
            briefing_date: Date of the briefing
            pdf_bytes: PDF file content as bytes
            filename: Optional custom filename (defaults to briefing-YYYY-MM-DD.pdf)

        Returns:
            Public URL of the uploaded PDF

        Raises:
            Exception: If upload fails
        """
        try:
            bucket_name = 'jarvis-briefings'

            # Generate filename if not provided
            if not filename:
                filename = f"briefing-{briefing_date.isoformat()}.pdf"

            # Path in storage: YYYY/MM/filename
            storage_path = f"{briefing_date.year}/{briefing_date.month:02d}/{filename}"

            logger.info(f"Uploading PDF to {bucket_name}/{storage_path}")

            # Upload to Supabase Storage
            result = self.client.storage.from_(bucket_name).upload(
                path=storage_path,
                file=pdf_bytes,
                file_options={
                    "content-type": "application/pdf",
                    "upsert": "true"  # Overwrite if exists
                }
            )

            # Get public URL
            public_url = self.client.storage.from_(bucket_name).get_public_url(storage_path)

            logger.info(f"PDF uploaded successfully: {public_url}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload PDF for {briefing_date}: {e}")
            raise

    async def get_briefing(self, briefing_date: date) -> Optional[Dict[str, Any]]:
        """
        Retrieve a briefing by date.

        Args:
            briefing_date: Date of the briefing to retrieve

        Returns:
            Briefing record or None if not found
        """
        try:
            result = self.client.table('jarvis_briefings').select('*').eq(
                'briefing_date', briefing_date.isoformat()
            ).execute()

            if result.data:
                logger.info(f"Retrieved briefing for {briefing_date}")
                return result.data[0]
            else:
                logger.info(f"No briefing found for {briefing_date}")
                return None

        except Exception as e:
            logger.error(f"Failed to retrieve briefing for {briefing_date}: {e}")
            raise

    async def list_briefings(
        self,
        limit: int = 30,
        offset: int = 0,
        order_by: str = 'briefing_date',
        ascending: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List recent briefings.

        Args:
            limit: Maximum number of briefings to return
            offset: Number of records to skip (for pagination)
            order_by: Column to sort by
            ascending: Sort order (False = descending/newest first)

        Returns:
            List of briefing records
        """
        try:
            query = self.client.table('jarvis_briefings').select('*')

            # Apply ordering
            query = query.order(order_by, desc=not ascending)

            # Apply pagination
            query = query.range(offset, offset + limit - 1)

            result = query.execute()

            logger.info(f"Retrieved {len(result.data)} briefings")
            return result.data

        except Exception as e:
            logger.error(f"Failed to list briefings: {e}")
            raise

    async def delete_briefing(self, briefing_date: date) -> bool:
        """
        Delete a briefing by date.

        Args:
            briefing_date: Date of the briefing to delete

        Returns:
            True if deleted, False if not found
        """
        try:
            result = self.client.table('jarvis_briefings').delete().eq(
                'briefing_date', briefing_date.isoformat()
            ).execute()

            if result.data:
                logger.info(f"Deleted briefing for {briefing_date}")
                return True
            else:
                logger.info(f"No briefing found to delete for {briefing_date}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete briefing for {briefing_date}: {e}")
            raise

    async def update_pdf_url(self, briefing_date: date, pdf_url: str) -> Dict[str, Any]:
        """
        Update the PDF URL for an existing briefing.

        Args:
            briefing_date: Date of the briefing
            pdf_url: New PDF URL

        Returns:
            Updated briefing record
        """
        try:
            result = self.client.table('jarvis_briefings').update({
                'pdf_url': pdf_url,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('briefing_date', briefing_date.isoformat()).execute()

            if result.data:
                logger.info(f"Updated PDF URL for briefing {briefing_date}")
                return result.data[0]
            else:
                raise Exception(f"No briefing found for {briefing_date}")

        except Exception as e:
            logger.error(f"Failed to update PDF URL for {briefing_date}: {e}")
            raise


# Synchronous wrapper for non-async environments
class SupabaseWriterSync(SupabaseWriter):
    """
    Synchronous version of SupabaseWriter for non-async environments.
    All methods are synchronous (no await needed).
    """

    def save_briefing(self, *args, **kwargs):
        """Synchronous version of save_briefing"""
        import asyncio
        return asyncio.run(super().save_briefing(*args, **kwargs))

    def upload_pdf(self, *args, **kwargs):
        """Synchronous version of upload_pdf"""
        import asyncio
        return asyncio.run(super().upload_pdf(*args, **kwargs))

    def get_briefing(self, *args, **kwargs):
        """Synchronous version of get_briefing"""
        import asyncio
        return asyncio.run(super().get_briefing(*args, **kwargs))

    def list_briefings(self, *args, **kwargs):
        """Synchronous version of list_briefings"""
        import asyncio
        return asyncio.run(super().list_briefings(*args, **kwargs))

    def delete_briefing(self, *args, **kwargs):
        """Synchronous version of delete_briefing"""
        import asyncio
        return asyncio.run(super().delete_briefing(*args, **kwargs))

    def update_pdf_url(self, *args, **kwargs):
        """Synchronous version of update_pdf_url"""
        import asyncio
        return asyncio.run(super().update_pdf_url(*args, **kwargs))
