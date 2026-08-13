# Edit Grammar

Visual rules. `series-profile.md` covers structure and voice; this covers what
appears on screen and when to change it.

---

## The one rule everything else derives from

**Narration is the master timeline. Cut when the information changes, not when a
timer expires.**

Every visual change must do at least one job: illustrate what's being said, provide
evidence for a claim, emphasize a moment, introduce a topic, add variety, land a
joke, or bridge two information-heavy sections. A cut that does none of these is a
cut that shouldn't happen.

Corollary, and it's the one most auto-editors get wrong: **never force a change
while the current visual is still useful.** A roster screen that the narrator is
still explaining stays up. There is no maximum shot length.

---

## Footage classes

Classify every span of raw footage as one of:

| Class | Handling |
|---|---|
| `gameplay_action` | Snap to whistle. Keep the meaningful part. |
| `gameplay_presnap` | Trim hard — this is the biggest single source of dead time. |
| `gameplay_postplay` | Keep only if a reaction or replay matters. |
| `cinematic` | Madden cutscenes. Use as transitions and breathing room. |
| `roster` / `player_card` / `depth_chart` | Let it breathe while narration explains. |
| `stats` / `box_score` | Keep on screen long enough to actually read. |
| `contract` / `free_agency` | Keep while the decision is explained. |
| `schedule` / `standings` | Usually next-episode setup. |
| `menu_navigation` | Cut. Nobody needs to watch menus being traversed. |
| `commentary` | Narration with no specific visual demand — candidate for b-roll. |
| `dead` | Silence, restarts, fumbling. Cut. |

The distinction between `menu_navigation` (cut) and `roster`/`stats` (keep) is the
skill's core judgment call. The test: **is the narrator explaining what's on this
screen, or is he getting to another screen?** Explaining → keep. Traversing → cut.

---

## Pacing

No fixed shot length. Observed behavior:

- **Montages and emphasis** — very short shots, sub-second is fine.
- **Gameplay examples** — condensed to the useful part of the play.
- **Menu/stat screens** — can run 10s+ when the information warrants it.
- **Cinematics** — allowed to breathe.
- **Rapid narration making several points** — visuals change faster to keep up.
- **Dense on-screen information** — visuals hold longer so it can be read.

Pace follows narration density, not a metronome.

---

## Player-focused editing

When the narrator names a specific player, the screen should identify or explain
*that* player. Options, roughly in order of preference:

player card → ratings → gameplay featuring them → stats → contract →
depth chart → injury status → Madden cinematic featuring them

A useful default sequence when a player gets an extended beat:

```
player card → ratings → gameplay evidence → stats → next player
```

**Never leave unrelated gameplay running while a different player is discussed** —
if better visual evidence exists in the footage, use it.

---

## Gameplay

Gameplay is evidence and payoff, never filler. Use it to prove a claim about a
player, pay off a discussion, break up information, or show a genuinely important
play.

Trim: dead time, pre-snap waiting, repetitive sequences, play selection, menus
between drives.

Keep: the meaningful action, the reaction when it matters, and **any play the
narration is specifically discussing** — even a slow one. Relevance beats
excitement.

---

## Captions

Not subtitles. The whole video should not be a wall of text.

- Large, bold, generally bottom-centered.
- Most words neutral; **one or two key words get an accent color.**
- In sync with narration; gone when no longer useful.
- Deploy on: jokes, key statements, names, numbers, conclusions, dramatic beats.

Prefer `normal sentence with one IMPORTANT WORD emphasized` over captioning
everything. See `caption_emphasis.json` in the output for the per-word accent map.

---

## Zooms

Zooms say "look here." Good targets: a player's face or card, an important stat, a
funny detail, a key UI element, a decisive gameplay moment, detail inside a
screenshot.

Do not zoom constantly. A zoom on everything is a zoom on nothing.

---

## Screenshots, news and social overlays

Use when narration references a post, a news report, an announcement, an outside
claim, a historical event, or anything better shown as an image. Can be
full-screen or an overlay over Madden footage, then return to the game.

Remove the moment the narration moves on.

---

## Comedic inserts

A short unrelated-but-thematically-relevant clip when the narration lands a joke,
a ridiculous comparison, or an obvious comedic opportunity.

**Selective.** Comedy works here precisely because it interrupts an otherwise
information-driven edit. Constant memes destroy the effect. The cue lexicon flags
four comedy types (`ea_bug`, `fourth_wall`, `real_world_tangent`, `self_roast`) —
treat flagged moments as *candidates*, and expect to use only a fraction.

---

## Transitions, music, sound

Clean cuts. The energy comes from changing content, narration, captions, gameplay,
screenshots and pacing — not from transition effects. Avoid flashy wipes.

Music supports mood, drives montages, and ducks under important narration. Sound
effects for jokes, emphasis, UI moments, big plays. **Never drown out commentary.**

---

## QA checklist

Before delivery, verify:

- No ad or sponsor material left in unless intentional
- No repeated clips unless deliberate
- Captions match narration
- No visual contradicts what's being said
- Important gameplay not cut too early
- Audio intelligible throughout
- Pacing varies naturally — not metronomic
- No excessive effects
- Reads as a story, not a raw recording

---

## Explicitly do not

Cut every 1–2 seconds · show unrelated gameplay during player discussion · leave
menus up after the topic changed · caption every word in giant text · zoom on
everything · use flashy transitions constantly · remove every slow moment · treat
preseason like regular season · insert memes constantly · copy a reference
episode shot-for-shot · invent visual information not present in the footage
