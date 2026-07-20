"""Pydantic models shared across pipeline stages.

These double as the structured-output schemas for Claude API calls.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

VisualKind = Literal["title_card", "scene_card", "stat_card", "quote_card", "timeline_card"]


class TimelineEvent(BaseModel):
    date: str = Field(description="Date or year of the event, e.g. 'Feb 22, 1980'")
    event: str = Field(description="One-sentence description of what happened")


class KeyFact(BaseModel):
    fact: str = Field(description="A verified, specific fact")
    source: str = Field(description="Where this fact comes from (publication or site name)")


class ResearchBrief(BaseModel):
    """Verified research about a sports history topic."""

    topic: str
    summary: str = Field(description="2-3 paragraph overview of the story")
    timeline: List[TimelineEvent] = Field(description="Chronological key events")
    key_facts: List[KeyFact] = Field(description="8-15 specific verified facts with sources")
    notable_quotes: List[str] = Field(description="Real quotes from participants or broadcasters")
    key_figures: List[str] = Field(description="The people central to the story")
    why_it_matters: str = Field(description="The historical significance / emotional core")


class StatItem(BaseModel):
    label: str = Field(description="Short stat label, e.g. 'Final score'")
    value: str = Field(description="The stat value, e.g. '4-3'")


class VisualSpec(BaseModel):
    kind: VisualKind = Field(
        description=(
            "title_card: big headline opener. scene_card: headline + supporting line for a "
            "story beat. stat_card: numbers-driven moment. quote_card: a real quote. "
            "timeline_card: sequence of dated events."
        )
    )
    headline: str = Field(description="Main on-screen text, under 8 words")
    subline: str = Field(default="", description="Supporting on-screen text, under 14 words")
    stats: List[StatItem] = Field(default_factory=list, description="For stat_card: 2-4 stats")
    quote: str = Field(default="", description="For quote_card: the quote text")
    attribution: str = Field(default="", description="For quote_card: who said it")
    timeline: List[TimelineEvent] = Field(
        default_factory=list, description="For timeline_card: 3-5 dated events"
    )
    image_prompt: str = Field(
        description=(
            "A detailed prompt for an AI image generator depicting this scene "
            "(used when an image provider is configured)"
        )
    )


class Scene(BaseModel):
    number: int
    narration: str = Field(
        description="Voiceover text for this scene, 2-4 conversational sentences"
    )
    visual: VisualSpec


class Storyboard(BaseModel):
    """A complete video plan: script + scene visuals + YouTube metadata."""

    video_title: str = Field(description="Click-worthy but accurate YouTube title")
    scenes: List[Scene] = Field(description="10-16 scenes; scene 1 is the cold-open hook")
    youtube_description: str = Field(description="YouTube description with a brief summary")
    tags: List[str] = Field(description="10-15 YouTube tags")
    accent_color: str = Field(
        description="Hex accent color matching the team/era, e.g. '#C8102E'"
    )


class SceneTiming(BaseModel):
    """Computed at voiceover time: how long each scene runs."""

    number: int
    duration: float
    audio_file: Optional[str] = None


class TimingManifest(BaseModel):
    scenes: List[SceneTiming]
    total_duration: float
