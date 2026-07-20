"""Claude API calls for the research and storyboard stages."""

from __future__ import annotations

import anthropic

from .models import ResearchBrief, Storyboard
from . import prompts

MODEL = "claude-opus-4-8"
MAX_TOKENS = 16000
MAX_CONTINUATIONS = 5

WEB_SEARCH_TOOL = {"type": "web_search_20260209", "name": "web_search", "max_uses": 10}


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic()


def run_research(topic: str) -> ResearchBrief:
    """Research the topic with web search, then structure the findings."""
    client = _client()

    messages = [{"role": "user", "content": prompts.RESEARCH_USER.format(topic=topic)}]
    continuations = 0
    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=prompts.RESEARCH_SYSTEM,
            thinking={"type": "adaptive"},
            tools=[WEB_SEARCH_TOOL],
            messages=messages,
        )
        if response.stop_reason != "pause_turn":
            break
        # Server-side tool loop paused; re-send to let it resume.
        continuations += 1
        if continuations > MAX_CONTINUATIONS:
            break
        messages = [
            messages[0],
            {"role": "assistant", "content": response.content},
        ]

    notes = "\n".join(block.text for block in response.content if block.type == "text")
    if not notes.strip():
        raise RuntimeError(f"Research produced no text (stop_reason={response.stop_reason})")

    structured = client.messages.parse(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        thinking={"type": "adaptive"},
        messages=[
            {
                "role": "user",
                "content": prompts.STRUCTURE_RESEARCH_USER.format(notes=notes),
            }
        ],
        output_format=ResearchBrief,
    )
    brief = structured.parsed_output
    if brief is None:
        raise RuntimeError("Failed to structure research notes")
    brief.topic = topic
    return brief


def run_storyboard(brief: ResearchBrief, scene_count: int = 12) -> Storyboard:
    """Turn a research brief into a full scene-by-scene storyboard."""
    client = _client()
    response = client.messages.parse(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=prompts.STORYBOARD_SYSTEM,
        thinking={"type": "adaptive"},
        messages=[
            {
                "role": "user",
                "content": prompts.STORYBOARD_USER.format(
                    scene_count=scene_count,
                    brief=brief.model_dump_json(indent=2),
                ),
            }
        ],
        output_format=Storyboard,
    )
    storyboard = response.parsed_output
    if storyboard is None:
        raise RuntimeError("Failed to generate storyboard")
    return storyboard
