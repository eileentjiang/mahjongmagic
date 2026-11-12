// Mahjong Magic photo server (Cloudflare Worker).
// Holds the Anthropic API key so the public web app never sees it.
//   POST /recognize  { image: base64 JPEG }   -> tiles read from a photo of a winning hand
//   POST /rule       { text: string }          -> a plain-language house rule turned into a checkable rule
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export interface Env {
  ANTHROPIC_API_KEY: string;
}

const MODEL = 'claude-opus-5-5';
const ALLOWED_ORIGINS = [
  'https://eileentjiang.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];
const MAX_IMAGE_BYTES = 5_000_000;

const SUITED = ['m', 'p', 's'].flatMap((s) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => s + n));
const TILE_IDS = ['we', 'ws', 'ww', 'wn', 'dr', 'dg', 'dw', ...SUITED] as [string, ...string[]];
const FLOWER_IDS = ['f1', 'f2', 'f3', 'f4', 'x1', 'x2', 'x3', 'x4'] as [string, ...string[]];

const TILE_GUIDE = `Tile ids:
- Characters (萬 wan, a number character over 萬): m1-m9. 五 and 伍 both mean 5.
- Dots (circles / 筒): p1-p9, counted by the number of circles.
- Bamboo (sticks / 條): s1-s9, counted by the number of sticks. The 1 of bamboo is usually a bird or a single decorated stick.
- Winds: we 東 East, ws 南 South, ww 西 West, wn 北 North.
- Dragons: dr 中 red, dg 發 green, dw white (blank, or a blue/black frame).
- Flowers (plum 梅 1, orchid 蘭 2, chrysanthemum 菊 3, bamboo 竹 4): f1-f4. Seasons (spring 春 1, summer 夏 2, autumn 秋 3, winter 冬 4): x1-x4. They usually carry a small number in a corner.`;

// ---------- /recognize
const RecognizeSchema = z.object({
  quality: z.enum(['ok', 'blurry', 'dark', 'partial', 'no_tiles']),
  problem: z.string().nullable(),
  tiles: z.array(z.object({
    tile: z.enum(TILE_IDS),
    sure: z.boolean(),
    alternatives: z.array(z.enum(TILE_IDS)),
  })),
  flowers: z.array(z.object({ tile: z.enum(FLOWER_IDS), sure: z.boolean() })),
});

const RECOGNIZE_PROMPT = `This is a photo of a winning mahjong hand (Hong Kong / Chinese style, 144-tile set), laid out on a table so it can be scored.

${TILE_GUIDE}

List every tile in the hand, left to right and row by row: concealed tiles and melded sets alike, all four tiles of any kong, and the winning tile. A normal hand has 14 tiles plus one extra per kong. Put flower and season tiles in "flowers", not "tiles". Ignore tiles that are clearly not part of this hand (discards, the wall, other players' tiles).

For each tile, set "sure" to false if you can't be certain (blur, glare, angle, partly covered, unusual artwork), and give your next most likely readings in "alternatives". Never guess silently: a wrong confident read costs someone money.

Set "quality":
- "ok" when every tile can be read, even if one or two are unsure.
- "blurry" or "dark" when the photo is too blurred or dark to read the tiles reliably.
- "partial" when tiles are cut off or covered, and say which in "problem".
- "no_tiles" when there is no mahjong hand in the photo.
When quality isn't "ok", "problem" is one short, friendly sentence for the player; otherwise null.`;

// ---------- /rule
const Clause = z.object({
  kind: z.enum(['set', 'pair', 'tileCount', 'suitsUsed', 'winMethod', 'winnerIsDealer', 'concealed', 'flowerCount', 'pattern']),
  set: z.enum(['pung', 'kong', 'pungOrKong', 'chow', 'any']).nullable(),
  tile: z.enum(TILE_IDS).nullable(),
  suit: z.enum(['m', 'p', 's', 'wind', 'dragon', 'honor']).nullable(),
  rank: z.number().int().nullable(),
  min: z.number().int().nullable(),
  max: z.number().int().nullable(),
  method: z.enum(['selfDraw', 'discard']).nullable(),
  flag: z.boolean().nullable(),
  pattern: z.string().nullable(),
});
const RuleSchema = z.object({
  ok: z.boolean(),
  problem: z.string().nullable(),
  name: z.string(),
  when: z.string(),
  points: z.number().int(),
  all: z.array(Clause),
});

const RULE_PROMPT = (text: string) => `A mahjong group wrote this house rule in their own words. Turn it into a rule the app can check automatically against every winning hand.

<rule>${text}</rule>

${TILE_GUIDE}

What the app knows about a winning hand: its tiles, how they split into sets (chows, pungs, kongs) and a pair, its flowers, whether the winner self-drew or won off a discard, whether the winner is the dealer, whether the hand was concealed, and which standard MCR scoring patterns it scored (e.g. "Full Flush", "All Pungs", "Seven Pairs").

Express the rule as "all": a list of conditions that must ALL be true. Each condition has a "kind"; fill only the fields that kind uses and set the rest to null:
- set: the hand has at least "min" (default 1) and at most "max" sets of type "set" (pung, kong, pungOrKong, chow, any), optionally limited to a "tile", a "suit" (m, p, s, wind, dragon, honor) or a "rank" (1-9).
- pair: the pair matches "tile", "suit" or "rank".
- tileCount: the number of tiles matching "tile"/"suit"/"rank" is between "min" and "max".
- suitsUsed: the number of different number suits (m, p, s) used is between "min" and "max".
- winMethod: "method" is selfDraw or discard.
- winnerIsDealer: "flag" true or false.
- concealed: "flag" true or false.
- flowerCount: the number of flowers held is between "min" and "max".
- pattern: the hand scored the MCR pattern named in "pattern".

"points" is how many points the rule adds (a whole number, at least 1). "name" is a short title, 2-5 words. "when" restates the condition in one plain sentence a player would understand, without the points.

If the rule depends on something the app can't know from the hand and these game details (who is wearing what, the time, money outside the game, which tile was discarded earlier, how long a turn took) or doesn't say how many points it's worth, set "ok" to false and explain in one friendly sentence in "problem" what to add or change; otherwise "ok" is true and "problem" is null.`;

function cors(origin: string | null): Record<string, string> {
  return origin && ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' }
    : {};
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}

async function ask<T>(env: Env, schema: z.ZodType<T>, content: Anthropic.Beta.BetaContentBlockParam[]): Promise<T> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(schema) },
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new UserError('The photo couldn’t be read. Try again, or enter the tiles by hand.');
  if (!response.parsed_output) throw new Error(`No parsed output (stop_reason ${response.stop_reason})`);
  return response.parsed_output as T;
}

class UserError extends Error {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Not allowed' }, 403, origin);
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, origin);
    const path = new URL(request.url).pathname;

    try {
      const body = (await request.json()) as { image?: unknown; text?: unknown };
      if (path === '/recognize') {
        if (typeof body.image !== 'string' || !body.image) return json({ error: 'Missing image' }, 400, origin);
        if (body.image.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'Photo too large' }, 413, origin);
        const result = await ask(env, RecognizeSchema, [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: body.image } },
          { type: 'text', text: RECOGNIZE_PROMPT },
        ]);
        return json(result, 200, origin);
      }
      if (path === '/rule') {
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 600) return json({ error: 'Describe the rule in up to 600 characters.' }, 400, origin);
        const result = await ask(env, RuleSchema, [{ type: 'text', text: RULE_PROMPT(body.text.trim()) }]);
        return json(result, 200, origin);
      }
      return json({ error: 'Not found' }, 404, origin);
    } catch (e) {
      if (e instanceof UserError) return json({ error: e.message }, 422, origin);
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'Too many requests right now. Try again in a minute.' }, 429, origin);
      if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The server’s API key isn’t working.' }, 500, origin);
      if (e instanceof Anthropic.APIError) return json({ error: 'The recognition service had a problem. Try again.' }, 502, origin);
      return json({ error: 'Something went wrong. Try again.' }, 500, origin);
    }
  },
};
