"""CLI: parse a file and print the resulting Graph as JSON.

Usage: python -m app.scripts.parse_cli <file> [--pretty]
"""
import argparse
import json
import mimetypes
import sys
from pathlib import Path

# Ensure the backend/ directory is on sys.path when run as a script
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.ingest.loader import load
from app.pipeline.parse import parse


def main():
    parser = argparse.ArgumentParser(description="Parse an architecture diagram/doc to JSON graph")
    parser.add_argument("file", help="Path to input file")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    args = parser.parse_args()

    file_path = args.file
    mime, _ = mimetypes.guess_type(file_path)
    if not mime:
        # Fallback by extension
        ext = file_path.rsplit(".", 1)[-1].lower()
        ext_map = {"pdf": "application/pdf", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                   "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                   "txt": "text/plain", "md": "text/markdown"}
        mime = ext_map.get(ext, "text/plain")

    ingest_result = load(file_path, mime)
    graph = parse(ingest_result)

    indent = 2 if args.pretty else None
    print(json.dumps(graph.model_dump(mode="json"), indent=indent))


if __name__ == "__main__":
    main()
