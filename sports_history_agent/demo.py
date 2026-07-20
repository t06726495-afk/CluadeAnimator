"""A hand-written sample storyboard so the render stack can run with no API key."""

from .models import Scene, StatItem, Storyboard, TimelineEvent, VisualSpec


def demo_storyboard() -> Storyboard:
    return Storyboard(
        video_title="The Miracle on Ice: How College Kids Beat a Dynasty",
        accent_color="#C8102E",
        youtube_description=(
            "In 1980, a team of American college players faced the greatest hockey "
            "machine ever built — and pulled off the biggest upset in sports history."
        ),
        tags=["miracle on ice", "1980 olympics", "hockey", "sports history", "usa vs ussr"],
        scenes=[
            Scene(
                number=1,
                narration=(
                    "February 22nd, 1980. Lake Placid, New York. A team of American "
                    "college kids is about to face the greatest hockey machine ever built."
                ),
                visual=VisualSpec(
                    kind="title_card",
                    headline="Do You Believe in Miracles?",
                    subline="Lake Placid, February 22, 1980",
                    image_prompt="Dramatic wide illustration of a frozen olympic arena at night, spotlights, 1980 era, painterly",
                ),
            ),
            Scene(
                number=2,
                narration=(
                    "The Soviet national team hadn't lost an Olympic hockey game in twelve years. "
                    "They had won four straight gold medals. Two weeks earlier, they beat this same "
                    "American team ten to three."
                ),
                visual=VisualSpec(
                    kind="stat_card",
                    headline="The Soviet Machine",
                    stats=[
                        StatItem(label="straight Olympic golds", value="4"),
                        StatItem(label="years unbeaten at the Games", value="12"),
                        StatItem(label="exhibition rout, 13 days earlier", value="10-3"),
                    ],
                    image_prompt="Imposing red hockey jerseys in formation, cold industrial lighting, illustration",
                ),
            ),
            Scene(
                number=3,
                narration=(
                    "Coach Herb Brooks had a plan nobody believed in. Play the Soviets' own "
                    "style against them. Skate with them for sixty minutes. His players were "
                    "amateurs — average age, twenty-one."
                ),
                visual=VisualSpec(
                    kind="scene_card",
                    headline="Brooks' Impossible Plan",
                    subline="Average age of Team USA: 21 years old",
                    image_prompt="A determined coach at a chalkboard, dramatic side light, 1980 locker room, illustration",
                ),
            ),
            Scene(
                number=4,
                narration=(
                    "With ten minutes left, Mike Eruzione fired the shot that put America ahead. "
                    "Then the longest ten minutes in hockey history began."
                ),
                visual=VisualSpec(
                    kind="timeline_card",
                    headline="The Road to the Upset",
                    timeline=[
                        TimelineEvent(date="Feb 9", event="USSR crushes USA 10-3 at Madison Square Garden"),
                        TimelineEvent(date="Feb 22", event="Eruzione scores — USA leads 4-3 with 10:00 left"),
                        TimelineEvent(date="Feb 24", event="USA beats Finland to clinch the gold medal"),
                    ],
                    image_prompt="Hockey puck crossing goal line, motion blur, red goal light, illustration",
                ),
            ),
            Scene(
                number=5,
                narration=(
                    "As the clock hit zero, Al Michaels asked a question that became the most "
                    "famous call in American sports. The answer, that night, was yes."
                ),
                visual=VisualSpec(
                    kind="quote_card",
                    headline="The Call",
                    quote="Do you believe in miracles? YES!",
                    attribution="Al Michaels, ABC Sports",
                    image_prompt="Vintage broadcast booth overlooking a rink, warm tungsten light, illustration",
                ),
            ),
            Scene(
                number=6,
                narration=(
                    "Sports Illustrated named it the greatest sports moment of the twentieth "
                    "century. Which upset do you think comes second? Tell us in the comments."
                ),
                visual=VisualSpec(
                    kind="scene_card",
                    headline="The Greatest Upset Ever",
                    subline="Subscribe for more sports history",
                    image_prompt="Confetti over a celebrating team pile, golden hour, illustration",
                ),
            ),
        ],
    )
