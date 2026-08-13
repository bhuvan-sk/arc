"""Plain text/markdown ingestion."""


def read_text(raw_bytes: bytes, encoding: str = "utf-8") -> str:
    """Decode bytes to string, fallback to latin-1 on UnicodeDecodeError."""
    try:
        return raw_bytes.decode(encoding)
    except UnicodeDecodeError:
        return raw_bytes.decode("latin-1", errors="replace")
