"""
PDF Generator for Jarvis_BriefMe
Converts HTML briefings to styled PDF documents.
"""

import logging
from datetime import date
from typing import Optional
from io import BytesIO
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

logger = logging.getLogger(__name__)


# Default CSS styling for briefing PDFs
DEFAULT_BRIEFING_CSS = """
@page {
    size: Letter;
    margin: 1in;
    @top-center {
        content: "Jarvis Intelligence Briefing";
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        color: #666;
    }
    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        color: #666;
    }
}

body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
    max-width: 100%;
}

h1 {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 24pt;
    font-weight: bold;
    color: #1a1a1a;
    margin-bottom: 0.5em;
    padding-bottom: 0.3em;
    border-bottom: 3px solid #2563eb;
}

h2 {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 18pt;
    font-weight: bold;
    color: #2563eb;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

h3 {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 14pt;
    font-weight: bold;
    color: #1e40af;
    margin-top: 1em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
}

h4 {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 12pt;
    font-weight: bold;
    color: #1e40af;
    margin-top: 0.8em;
    margin-bottom: 0.4em;
}

p {
    margin-bottom: 0.8em;
    text-align: justify;
}

ul, ol {
    margin-bottom: 1em;
    padding-left: 2em;
}

li {
    margin-bottom: 0.4em;
}

a {
    color: #2563eb;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

blockquote {
    margin: 1em 2em;
    padding: 0.5em 1em;
    border-left: 4px solid #2563eb;
    background-color: #f8fafc;
    font-style: italic;
}

code {
    font-family: 'Courier New', 'Courier', monospace;
    font-size: 10pt;
    background-color: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

pre {
    font-family: 'Courier New', 'Courier', monospace;
    font-size: 9pt;
    background-color: #f1f5f9;
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1em;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
    page-break-inside: avoid;
}

th {
    background-color: #2563eb;
    color: white;
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-weight: bold;
    padding: 0.5em;
    text-align: left;
    border: 1px solid #1e40af;
}

td {
    padding: 0.5em;
    border: 1px solid #cbd5e1;
}

tr:nth-child(even) {
    background-color: #f8fafc;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
    page-break-inside: avoid;
}

.briefing-header {
    text-align: center;
    margin-bottom: 2em;
    padding-bottom: 1em;
    border-bottom: 2px solid #cbd5e1;
}

.briefing-date {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 12pt;
    color: #666;
    margin-top: 0.5em;
}

.section {
    margin-bottom: 2em;
    page-break-inside: avoid;
}

.metadata {
    font-size: 9pt;
    color: #666;
    margin-top: 0.3em;
    font-style: italic;
}

.highlight {
    background-color: #fef3c7;
    padding: 0.1em 0.3em;
}

.warning {
    background-color: #fee2e2;
    border-left: 4px solid #dc2626;
    padding: 1em;
    margin: 1em 0;
}

.info {
    background-color: #dbeafe;
    border-left: 4px solid #2563eb;
    padding: 1em;
    margin: 1em 0;
}

.success {
    background-color: #d1fae5;
    border-left: 4px solid #10b981;
    padding: 1em;
    margin: 1em 0;
}

/* Prevent orphan headings */
h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
}

/* Keep tables and figures together */
table, figure {
    page-break-inside: avoid;
}
"""


def generate_pdf(
    content_html: str,
    title: str,
    briefing_date: date,
    custom_css: Optional[str] = None,
    include_toc: bool = False
) -> bytes:
    """
    Generate a PDF from HTML content with professional styling.

    Args:
        content_html: HTML content to convert
        title: Briefing title
        briefing_date: Date of the briefing
        custom_css: Optional additional CSS to apply
        include_toc: Whether to generate a table of contents

    Returns:
        PDF file content as bytes

    Raises:
        Exception: If PDF generation fails
    """
    try:
        # Wrap content with header and metadata
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
        </head>
        <body>
            <div class="briefing-header">
                <h1>{title}</h1>
                <div class="briefing-date">{briefing_date.strftime('%B %d, %Y')}</div>
            </div>
            <div class="briefing-content">
                {content_html}
            </div>
        </body>
        </html>
        """

        # Combine default CSS with custom CSS
        css_string = DEFAULT_BRIEFING_CSS
        if custom_css:
            css_string += "\n\n" + custom_css

        # Create font configuration
        font_config = FontConfiguration()

        # Create CSS object
        css = CSS(string=css_string, font_config=font_config)

        # Generate PDF
        logger.info(f"Generating PDF for briefing: {title} ({briefing_date})")
        html_obj = HTML(string=full_html)
        pdf_bytes = html_obj.write_pdf(stylesheets=[css], font_config=font_config)

        logger.info(f"PDF generated successfully ({len(pdf_bytes)} bytes)")
        return pdf_bytes

    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise


def generate_pdf_from_sections(
    sections: list,
    title: str,
    briefing_date: date,
    custom_css: Optional[str] = None
) -> bytes:
    """
    Generate a PDF from a list of content sections.

    Args:
        sections: List of dicts with 'heading' and 'content' keys
        title: Briefing title
        briefing_date: Date of the briefing
        custom_css: Optional additional CSS

    Returns:
        PDF file content as bytes

    Example:
        sections = [
            {'heading': 'Executive Summary', 'content': '<p>Summary text...</p>'},
            {'heading': 'Market Analysis', 'content': '<p>Analysis...</p>'}
        ]
    """
    try:
        # Build HTML from sections
        sections_html = ""
        for section in sections:
            heading = section.get('heading', 'Section')
            content = section.get('content', '')
            sections_html += f"""
            <div class="section">
                <h2>{heading}</h2>
                {content}
            </div>
            """

        return generate_pdf(sections_html, title, briefing_date, custom_css)

    except Exception as e:
        logger.error(f"Failed to generate PDF from sections: {e}")
        raise


def generate_pdf_with_cover(
    content_html: str,
    title: str,
    briefing_date: date,
    cover_image_url: Optional[str] = None,
    subtitle: Optional[str] = None,
    author: str = "Jarvis Intelligence",
    custom_css: Optional[str] = None
) -> bytes:
    """
    Generate a PDF with a cover page.

    Args:
        content_html: HTML content to convert
        title: Briefing title
        briefing_date: Date of the briefing
        cover_image_url: Optional URL to cover image
        subtitle: Optional subtitle text
        author: Author name
        custom_css: Optional additional CSS

    Returns:
        PDF file content as bytes
    """
    try:
        # Build cover page
        cover_html = f"""
        <div style="page-break-after: always; text-align: center; padding-top: 3in;">
        """

        if cover_image_url:
            cover_html += f'<img src="{cover_image_url}" style="max-width: 4in; margin-bottom: 2em;" />'

        cover_html += f"""
            <h1 style="font-size: 32pt; margin-bottom: 0.5em;">{title}</h1>
        """

        if subtitle:
            cover_html += f'<div style="font-size: 18pt; color: #666; margin-bottom: 1em;">{subtitle}</div>'

        cover_html += f"""
            <div style="font-size: 14pt; color: #666; margin-bottom: 0.5em;">
                {briefing_date.strftime('%B %d, %Y')}
            </div>
            <div style="font-size: 12pt; color: #999;">
                {author}
            </div>
        </div>
        """

        # Combine cover with content
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
        </head>
        <body>
            {cover_html}
            <div class="briefing-content">
                {content_html}
            </div>
        </body>
        </html>
        """

        # Generate PDF
        css_string = DEFAULT_BRIEFING_CSS
        if custom_css:
            css_string += "\n\n" + custom_css

        font_config = FontConfiguration()
        css = CSS(string=css_string, font_config=font_config)

        logger.info(f"Generating PDF with cover for: {title} ({briefing_date})")
        html_obj = HTML(string=full_html)
        pdf_bytes = html_obj.write_pdf(stylesheets=[css], font_config=font_config)

        logger.info(f"PDF with cover generated successfully ({len(pdf_bytes)} bytes)")
        return pdf_bytes

    except Exception as e:
        logger.error(f"Failed to generate PDF with cover: {e}")
        raise


def save_pdf_to_file(pdf_bytes: bytes, filepath: str) -> None:
    """
    Save PDF bytes to a file.

    Args:
        pdf_bytes: PDF content as bytes
        filepath: Path where to save the PDF

    Raises:
        Exception: If file write fails
    """
    try:
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
        logger.info(f"PDF saved to {filepath}")
    except Exception as e:
        logger.error(f"Failed to save PDF to {filepath}: {e}")
        raise
