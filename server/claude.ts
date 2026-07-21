import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { classificationSchema, extractionSchemas, SCREEN_TYPES, type ScreenType } from './schemas.js';

const MODEL = 'claude-sonnet-4-6';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
  if (!client) client = new Anthropic();
  return client;
}

const MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function imageBlock(imagePath: string): Anthropic.ImageBlockParam {
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType = MEDIA_TYPES[ext] ?? 'image/jpeg';
  const data = fs.readFileSync(imagePath).toString('base64');
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
}

function extractJson(text: string): unknown {
  // The prompts request bare JSON, but strip a code fence if one sneaks in.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found in model response');
  return JSON.parse(raw.slice(start));
}

function firstText(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === 'text') return block.text;
  }
  throw new Error('Model returned no text content');
}

const CLASSIFY_PROMPT = `You are looking at a photo of a TV or monitor showing a screen from the video game College Football 27. The photo may have glare, moiré, or be taken at an angle.

Classify which screen this is. Respond with ONLY a JSON object, no other text:
{"screen_type": "<type>", "confidence": "high" | "low", "reason": "<short reason>"}

Valid types: ${SCREEN_TYPES.join(', ')}.

Definitions:
- box_score: final/in-progress score of one game, two teams, possibly quarter-by-quarter scores and team stat comparisons
- player_game_stats: tables of individual player stats for one game (passing/rushing/receiving/defense etc.)
- season_stats: cumulative season statistics
- standings: conference standings or poll rankings (many teams ranked)
- schedule: list of games/weeks with opponents
- player_ratings: roster screen with player overall ratings/attributes
- recruiting_board: list of multiple recruits being pursued
- recruit_profile: detail page for one recruit
- team_stats: team-level stat comparison not tied to a single game box score
- unknown: cannot tell, or not a CFB 27 screen`;

export async function classifyImage(imagePath: string) {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      { role: 'user', content: [imageBlock(imagePath), { type: 'text', text: CLASSIFY_PROMPT }] },
    ],
  });
  return classificationSchema.parse(extractJson(firstText(message)));
}

const COMMON_RULES = `Rules — follow these exactly:
- Transcribe EXACTLY what is visible on screen. Never guess or infer values.
- Use null for any field you cannot read clearly (glare, blur, cut off).
- Preserve player and team name spelling exactly as shown on screen.
- Return numbers as JSON numbers, not strings. "1,204" becomes 1204.
- Set "confidence" to "low" on any row where you are not certain of every value, and on the top level if the whole image is hard to read.
- Respond with ONLY the JSON object. No prose, no markdown fences.`;

const EXTRACT_PROMPTS: Partial<Record<ScreenType, string>> = {
  box_score: `Extract the box score from this CFB 27 screenshot photo. JSON shape:
{"teams": [{"name": str, "score": num|null, "quarter_scores": [num|null,...]|null}, {..second team..}],
 "stats": [{"label": str, "values": [<first team value>, <second team value>], "confidence": "high"|"low"}],
 "confidence": "high"|"low"}
"stats" holds any team-comparison rows visible (Total Yards, Passing Yards, Turnovers, ...). List teams left/top team first.`,
  player_game_stats: `Extract every player stat table visible in this CFB 27 screenshot photo. JSON shape:
{"tables": [{"category": "passing"|"rushing"|"receiving"|"defense"|"kicking"|"punting"|"returns"|"other",
  "columns": [str, ...],
  "rows": [{"player": str, "team": str|null, "values": [num|str|null per column], "confidence": "high"|"low"}]}],
 "confidence": "high"|"low"}
"columns" are the stat column headers as shown (e.g. "CMP/ATT","YDS","TD","INT"). "values" must align 1:1 with "columns".`,
  season_stats: `Extract the season statistics from this CFB 27 screenshot photo as label/value pairs. JSON shape:
{"title": str|null, "rows": [{"label": str, "value": num|str|null, "confidence": "high"|"low"}], "confidence": "high"|"low"}`,
  standings: `Extract the standings or poll ranking from this CFB 27 screenshot photo. JSON shape:
{"kind": "conference"|"poll"|"other",
 "rows": [{"rank": num|null, "team": str, "conf_record": str|null, "overall_record": str|null, "extra": str|null, "confidence": "high"|"low"}],
 "confidence": "high"|"low"}
Records as shown, e.g. "5-1". "extra" holds any other column (points, streak).`,
  schedule: `Extract the schedule from this CFB 27 screenshot photo. JSON shape:
{"rows": [{"week": num|null, "opponent": str, "home": true|false|null, "result": "W"|"L"|"T"|null, "our_score": num|null, "opp_score": num|null, "confidence": "high"|"low"}],
 "confidence": "high"|"low"}
"home" is from the perspective of the team whose schedule this is (@ means away → home=false).`,
  player_ratings: `Extract player ratings from this CFB 27 screenshot photo. JSON shape:
{"rows": [{"player": str, "position": str|null, "class_year": str|null, "overall": num|null,
  "attributes": [{"name": str, "value": num|null}], "confidence": "high"|"low"}],
 "confidence": "high"|"low"}
"attributes" holds any visible attribute ratings (SPD, ACC, THP, ...). Empty array if only overalls are shown.`,
  recruiting_board: `Extract the recruiting board from this CFB 27 screenshot photo. JSON shape:
{"rows": [{"name": str, "position": str|null, "stars": num|null, "national_rank": num|null, "position_rank": num|null,
  "state": str|null, "archetype": str|null, "status": str|null, "competitors": str|null, "hours_spent": num|null,
  "confidence": "high"|"low"}],
 "confidence": "high"|"low"}
"competitors" is a comma-separated list of other schools shown pursuing the recruit, if visible.`,
  recruit_profile: `Extract this single recruit's profile from this CFB 27 screenshot photo. JSON shape:
{"name": str, "position": str|null, "stars": num|null, "national_rank": num|null, "position_rank": num|null,
 "state": str|null, "archetype": str|null, "dev_trait": str|null, "status": str|null,
 "competitors": [str, ...], "confidence": "high"|"low"}`,
  team_stats: `Extract the team statistics from this CFB 27 screenshot photo as label/value pairs. JSON shape:
{"title": str|null, "rows": [{"label": str, "value": num|str|null, "confidence": "high"|"low"}], "confidence": "high"|"low"}`,
};

export async function extractImage(imagePath: string, screenType: ScreenType) {
  const prompt = EXTRACT_PROMPTS[screenType];
  const schema = extractionSchemas[screenType];
  if (!prompt || !schema) throw new Error(`No extraction defined for screen type "${screenType}"`);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: [imageBlock(imagePath), { type: 'text', text: `${prompt}\n\n${COMMON_RULES}` }] },
  ];

  const attempt = async () => {
    const message = await getClient().messages.create({ model: MODEL, max_tokens: 8192, messages });
    return firstText(message);
  };

  let text = await attempt();
  try {
    return schema.parse(extractJson(text));
  } catch (err) {
    // One retry with the validation error appended, per the review pipeline design.
    const detail = err instanceof z.ZodError ? JSON.stringify(err.issues) : String(err);
    messages.push({ role: 'assistant', content: text });
    messages.push({
      role: 'user',
      content: `Your previous response failed validation: ${detail}\nRespond again with ONLY corrected JSON matching the required shape exactly.`,
    });
    text = await attempt();
    return schema.parse(extractJson(text));
  }
}
