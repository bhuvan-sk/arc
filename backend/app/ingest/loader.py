"""Ingestion dispatcher — routes file to the correct loader."""
from dataclasses import dataclass, field
from app.ingest.images import normalize_image
from app.ingest.pdf import rasterize_pdf
from app.ingest.docx_reader import extract_docx_text
from app.ingest.textfile import read_text


@dataclass
class IngestResult:
    images: list[bytes] = field(default_factory=list)   # PNG bytes
    texts: list[str] = field(default_factory=list)      # extracted text strings


IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}
PDF_MIMES = {"application/pdf"}
DOCX_MIMES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
TEXT_MIMES = {"text/plain", "text/markdown", "text/x-markdown", "text/md"}


def load(file_path: str, mime: str) -> IngestResult:
    """Load a file from disk and return an IngestResult."""
    with open(file_path, "rb") as f:
        raw = f.read()

    mime = mime.lower().strip()
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""

    if mime in IMAGE_MIMES or ext in {"png", "jpg", "jpeg", "webp"}:
        return IngestResult(images=[normalize_image(raw)])

    if mime in PDF_MIMES or ext == "pdf":
        pages = rasterize_pdf(raw)
        return IngestResult(images=pages)

    if mime in DOCX_MIMES or ext in {"docx", "doc"}:
        text = extract_docx_text(raw)
        return IngestResult(texts=[text])

    if mime in TEXT_MIMES or ext in {"txt", "md", "markdown"}:
        text = read_text(raw)
        return IngestResult(texts=[text])

    # Fallback: try text
    try:
        text = read_text(raw)
        return IngestResult(texts=[text])
    except Exception:
        raise ValueError(f"Unsupported file type: mime={mime}, ext={ext}")
