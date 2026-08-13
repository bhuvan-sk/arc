"""CLI: answer a question against a graph fixture JSON.

Usage: python -m app.scripts.ask_cli <graph.json> "<question>"
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.pipeline.grounding import scoped_context
from app.pipeline.explain import answer


def main():
    parser = argparse.ArgumentParser(description="Ask a question about an architecture graph")
    parser.add_argument("graph_json", help="Path to a graph JSON fixture")
    parser.add_argument("question", help="Question to ask")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print output")
    args = parser.parse_args()

    with open(args.graph_json) as f:
        graph_data = json.load(f)

    session = {"graph": graph_data}
    # Unlock everything for CLI usage
    scoped = scoped_context(session, unlocked_index=999)
    result = answer(args.question, scoped)

    indent = 2 if args.pretty else None
    print(json.dumps(result, indent=indent))


if __name__ == "__main__":
    main()
