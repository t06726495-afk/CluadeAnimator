"""CLI entry point.

    python -m sports_history_agent create "The 1980 Miracle on Ice"
    python -m sports_history_agent demo
"""

from __future__ import annotations

import argparse
import os
import sys

from . import pipeline
from .demo import demo_storyboard


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="sports_history_agent",
        description="AI agent that produces animated sports history YouTube videos.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    create = sub.add_parser("create", help="Research a topic and produce a full video")
    create.add_argument("topic", help="e.g. 'The 1980 Miracle on Ice'")
    create.add_argument("--scenes", type=int, default=12, help="Number of scenes (default 12)")
    create.add_argument("--project", help="Project directory (default projects/<topic-slug>)")
    create.add_argument("--music", help="Path to a background music file to mix in")
    create.add_argument("--burn-captions", action="store_true", help="Burn captions into the video")
    create.add_argument("--force", action="store_true", help="Re-run stages even if artifacts exist")

    demo = sub.add_parser("demo", help="Render a built-in sample video (no API key needed)")
    demo.add_argument("--project", default=os.path.join("projects", "demo"))
    demo.add_argument("--music", help="Path to a background music file to mix in")
    demo.add_argument("--burn-captions", action="store_true")

    args = parser.parse_args(argv)

    if args.command == "demo":
        final = pipeline.run(
            topic="demo",
            project_dir=args.project,
            burn_captions=args.burn_captions,
            music=args.music,
            storyboard_override=demo_storyboard(),
        )
    else:
        project_dir = args.project or os.path.join("projects", pipeline.slugify(args.topic))
        final = pipeline.run(
            topic=args.topic,
            project_dir=project_dir,
            scene_count=args.scenes,
            burn_captions=args.burn_captions,
            music=args.music,
            force=args.force,
        )
    print(f"\nFinal video: {final}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
