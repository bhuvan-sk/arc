"""PDF exporter using WeasyPrint."""
import os
import weasyprint
from typing import Any
from app.export.html_template import render_session_html


def generate_pdf(session: dict[str, Any], output_path: str, svg_by_layer: dict[str, str] | None = None) -> int:
    """Generate PDF export at output_path. Returns file size in bytes."""
    html_str = render_session_html(session, svg_by_layer)
    doc = weasyprint.HTML(string=html_str)
    doc.write_pdf(output_path)
    return os.path.getsize(output_path)
