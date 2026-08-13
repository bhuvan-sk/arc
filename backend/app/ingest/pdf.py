"""PDF ingestion — rasterize each page to PNG via PyMuPDF at configured DPI."""
import io
import fitz  # PyMuPDF
from app.config import settings


def rasterize_pdf(pdf_bytes: bytes, dpi: int | None = None) -> list[bytes]:
    """Rasterize each page of a PDF to PNG bytes."""
    if dpi is None:
        dpi = settings.PDF_RASTER_DPI
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[bytes] = []
    for page in doc:
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB, alpha=False)
        png_bytes = pix.tobytes("png")
        pages.append(png_bytes)
    doc.close()
    return pages
