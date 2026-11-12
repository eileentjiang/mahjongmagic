// Mahjong Magic photo server (Cloudflare Worker).
// Holds the Anthropic API key so the public web app never sees it.
//   POST /recognize  { image: base64 JPEG }   -> tiles read from a photo of a winning hand
//   POST /rule       { text: string }          -> a plain-language house rule turned into a checkable rule
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { DurableObject } from 'cloudflare:workers';
import { apply, expireLock, newRoom, Op, RoomSession, RoomState } from './room';
import { addTo, compare, emptyStats, Feedback, ModelStats } from './feedback';
import { parseCompact } from './compact';

export interface Env {
  ANTHROPIC_API_KEY: string;
  ROOMS: DurableObjectNamespace<SessionRoom>;
  STATS: DurableObjectNamespace<PhotoStats>;
  /** Cloudflare Workers AI: free daily allowance, used for photos. */
  AI: Ai;
  /** Who reads photos: "claude" (default), "gemini" or "workers-ai" (set in wrangler.toml). No silent fallback. */
  PHOTO_READER?: string;
  /** Which Workers AI model reads photos when PHOTO_READER is "workers-ai". */
  PHOTO_MODEL: string;
  /** Google Gemini: the main photo reader when a key is set. */
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
}

// Custom rules: Sonnet 5.5 at low effort (text only, a fraction of a cent).
const MODEL = 'claude-sonnet-5-5';
// Photos: Opus 5.5 at low effort. The cheaper readers tried (Sonnet low, Workers AI, Gemini Flash) misread this set confidently.
const PHOTO_CLAUDE_MODEL = 'claude-opus-5-5';
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
// Field order matters: models write the answer top to bottom, so this order makes them
// count first, set flowers aside, then read each tile's suit before its number.
const RecognizeSchema = z.object({
  quality: z.enum(['ok', 'blurry', 'dark', 'partial', 'no_tiles']),
  problem: z.string().nullable(),
  totalTiles: z.number().int(),
  flowers: z.array(z.object({ tile: z.enum(FLOWER_IDS), sure: z.boolean() })),
  tiles: z.array(z.object({
    suit: z.enum(['characters', 'dots', 'bamboo', 'wind', 'dragon']),
    number: z.number().int().nullable(),
    tile: z.enum(TILE_IDS),
    sure: z.boolean(),
    alternatives: z.array(z.enum(TILE_IDS)),
  })),
});

// Compact answer for Claude: one short line of tiles instead of an object per tile (far fewer output tokens).
//   "m4 m4 p3 p4 p5?p3/p6 s1"  →  a ? marks an unsure tile; anything after it (split by /) are the next-best readings.
const CompactSchema = z.object({
  quality: z.enum(['ok', 'blurry', 'dark', 'partial', 'no_tiles']),
  problem: z.string().nullable(),
  tiles: z.string(),
  flowers: z.string(),
});

const COMPACT_PROMPT = `Photo of a winning mahjong hand (Hong Kong / Chinese style, 144-tile set) to be scored. The photo is cropped to the hand.

Tile ids: characters m1-m9 (number over 萬; 五 and 伍 are 5), dots p1-p9 (count circles), bamboo s1-s9 (count sticks; the 1 is a bird or decorated stalk), winds we ws ww wn (東南西北), dragons dr 中, dg 發, dw white (blank or framed). Flowers f1-f4 (plum, orchid, chrysanthemum, bamboo) and seasons x1-x4 (spring, summer, autumn, winter) show a plant or season picture and a small number 1-4. Tiles may be upside down.

Work carefully: count the tiles, set flowers aside, then for each tile decide the suit first and the number second (count marks one by one). A hand is 14 tiles plus one per kong, not counting flowers.

Answer:
- tiles: every non-flower tile, left to right and row by row, separated by spaces, e.g. "m4 m4 p3 p4 p5 s1". If you aren't certain of a tile, add ? and your next-best readings separated by /, e.g. "p5?p3/p6". Never guess silently.
- flowers: the flower and season tiles, e.g. "x1", or "" if none.
- quality: ok, blurry, dark, partial (tiles cut off or covered) or no_tiles. problem: one short friendly sentence when quality isn't ok, else null.`;

/** Anthropic prices per million tokens, for the cost-per-photo figure. */
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
};

const RECOGNIZE_PROMPT = `This is a photo of a winning mahjong hand (Hong Kong / Chinese style, 144-tile set), laid out on a table so it can be scored.

${TILE_GUIDE}

Work through the photo in this order:
1. Count. Count every tile in the hand: concealed tiles and melded sets alike, all four tiles of any kong, the winning tile, and any flowers or seasons. Put that number in "totalTiles". Ignore tiles that are clearly not part of this hand (discards, the wall, other players' tiles).
2. Set flowers aside. Find the flower and season tiles (a plant or season picture, usually with a small number 1-4 in a corner) and list them in "flowers". They don't go in "tiles".
3. Read each remaining tile, left to right and row by row, in two steps:
   a. Suit first: "characters" (a character over 萬), "dots" (circles), "bamboo" (sticks, or a bird or decorated stalk for the 1), "wind" (東 南 西 北) or "dragon" (中, 發, or a blank or framed tile).
   b. Then the number: for dots and bamboo, count the circles or sticks one by one; for characters, read the number character above 萬 (一二三四五/伍六七八九). Put it in "number" (null for winds and dragons), then give the tile id in "tile".
   A normal hand is 14 tiles plus one per kong, not counting flowers. If your list doesn't add up, look again before answering.

For each tile, set "sure" to false if you can't be certain (blur, glare, angle, partly covered, unusual artwork, or you counted marks and aren't sure of the count), and give your next most likely readings in "alternatives". Never guess silently: a wrong confident read costs someone money.

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
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' }
    : {};
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}

async function ask<T>(env: Env, schema: z.ZodType<T>, content: Anthropic.ContentBlockParam[], declined: string, model: string = MODEL): Promise<T> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  // No refusal fallback on purpose (owner's choice, to keep costs down): a declined request is shown to the player.
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    output_config: { effort: 'low', format: zodOutputFormat(schema) },
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new UserError(declined);
  if (!response.parsed_output) throw new Error(`No parsed output (stop_reason ${response.stop_reason})`);
  return response.parsed_output as T;
}

class UserError extends Error {}

// ---------- Photos on Cloudflare Workers AI (free allowance)
const TILE_SET = new Set<string>(TILE_IDS);
const FLOWER_SET = new Set<string>(FLOWER_IDS);

/** Pull the first JSON object out of a model reply (some models wrap it in ``` fences or add a sentence). */
function firstJson(text: string): unknown {
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error(`no JSON in reply: ${text.slice(0, 120)}`);
  return JSON.parse(text.slice(start, end + 1));
}

/** What the app receives: just the tiles, without the model's working (suit / number). */
interface Recognition {
  quality: z.infer<typeof RecognizeSchema>['quality'];
  problem: string | null;
  tiles: { tile: string; sure: boolean; alternatives: string[] }[];
  flowers: { tile: string; sure: boolean }[];
}

/** Tried in order: the configured model, then a smaller backup if it fails. */
const BACKUP_PHOTO_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

/** An error the player sees, with the technical reason underneath so it can be reported. */
class PhotoError extends Error { constructor(message: string, readonly detail: string) { super(message); } }

/** Read a photo with the configured reader. No silent fallback: a wrong confident read is worse than an honest failure. */
async function recognizePhoto(env: Env, image: string): Promise<Recognition & { model: string }> {
  const reader = env.PHOTO_READER ?? 'claude';
  if (reader === 'claude') {
    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
      const response = await client.messages.parse({
        model: PHOTO_CLAUDE_MODEL,
        max_tokens: 8000,
        output_config: { effort: 'low', format: zodOutputFormat(CompactSchema) },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: COMPACT_PROMPT },
        ] }],
      });
      if (response.stop_reason === 'refusal') throw new UserError('Claude declined to read this photo. Try another photo, or enter the tiles by hand.');
      if (!response.parsed_output) throw new Error(`No parsed output (stop_reason ${response.stop_reason})`);
      // Record exactly what this photo cost (input includes the image; output includes thinking).
      const price = PRICES[PHOTO_CLAUDE_MODEL];
      const u = response.usage;
      const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      const usd = (input * price.input + u.output_tokens * price.output) / 1_000_000;
      await env.STATS.get(env.STATS.idFromName('all')).fetch('https://stats/cost', {
        method: 'POST', body: JSON.stringify({ model: PHOTO_CLAUDE_MODEL, input, output: u.output_tokens, usd }),
      }).catch(() => undefined);
      return { ...parseCompact(response.parsed_output), model: PHOTO_CLAUDE_MODEL };
    } catch (e) {
      if (e instanceof UserError) throw e;
      throw new PhotoError('Couldn’t read the photo just now. Try again, or enter the tiles by hand.', `${PHOTO_CLAUDE_MODEL}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  if (reader === 'gemini') {
    try {
      return { ...(await readWithGemini(env, image)), model: `gemini/${env.GEMINI_MODEL}` };
    } catch (e) {
      throw new PhotoError('Couldn’t read the photo just now. Try again, or enter the tiles by hand.', `${env.GEMINI_MODEL}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  return recognizeWithWorkersAI(env, image);
}

async function recognizeWithWorkersAI(env: Env, image: string): Promise<Recognition & { model: string }> {
  const problems: string[] = [];
  const models = [...new Set([env.PHOTO_MODEL, BACKUP_PHOTO_MODEL])];
  for (const model of models) {
    try {
      return { ...(await readWith(env, model, image)), model };
    } catch (e) {
      problems.push(`${model.split('/').pop()}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  throw new PhotoError('Couldn’t read the photo just now. Try again, or enter the tiles by hand.', problems.join(' | '));
}

async function readWith(env: Env, model: string, image: string): Promise<Recognition> {
  type Out = { choices?: { message?: { content?: string | null } }[]; response?: unknown };
  const run = env.AI.run.bind(env.AI) as unknown as (model: string, inputs: unknown) => Promise<Out>;
  const inputs: Record<string, unknown> = {
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
        { type: 'text', text: RECOGNIZE_PROMPT + '\n\n' + ANSWER_FORMAT },
      ],
    }],
    max_tokens: 6000,
  };
  // Kimi thinks at length by default and can run out of room before answering; the step-by-step
  // answer format already makes it work through each tile.
  if (model.includes('kimi')) { inputs.reasoning_effort = 'none'; inputs.chat_template_kwargs = { enable_thinking: false }; }
  const out = await run(model, inputs);
  const reply = out.choices?.[0]?.message?.content ?? out.response ?? '';
  return toRecognition((typeof reply === 'object' && reply ? reply : firstJson(String(reply))) as Record<string, unknown>);
}

const ANSWER_FORMAT = 'Reply with only a JSON object with these keys, in this order: "quality", "problem", "totalTiles", "flowers" (each {"tile","sure"}), "tiles" (each {"suit","number","tile","sure","alternatives"}), using the tile ids above.';

/** Google Gemini via its REST API (the key stays on this server). */
async function readWithGemini(env: Env, image: string): Promise<Recognition> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: 'image/jpeg', data: image } },
        { text: RECOGNIZE_PROMPT + '\n\n' + ANSWER_FORMAT },
      ] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; status?: string };
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  if (!res.ok) throw new Error(`${res.status} ${data.error?.status ?? ''} ${data.error?.message ?? ''}`.trim());
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  if (!text) throw new Error(`empty reply (${data.candidates?.[0]?.finishReason ?? 'no candidates'})`);
  return toRecognition(firstJson(text) as Record<string, unknown>);
}

/** Turn a model's JSON into what the app needs, keeping only valid tile ids. */
function toRecognition(raw: Record<string, unknown>): Recognition {
  // Open models sometimes invent ids: keep what's valid, and flag the hand as unsure rather than failing.
  const tiles = (Array.isArray(raw.tiles) ? raw.tiles : []).flatMap((t: { tile?: string; sure?: boolean; alternatives?: string[] }) =>
    t && typeof t.tile === 'string' && TILE_SET.has(t.tile)
      ? [{ tile: t.tile, sure: t.sure !== false, alternatives: (t.alternatives ?? []).filter((a) => TILE_SET.has(a)) }]
      : []);
  const flowers = (Array.isArray(raw.flowers) ? raw.flowers : []).flatMap((f: { tile?: string; sure?: boolean }) =>
    f && typeof f.tile === 'string' && FLOWER_SET.has(f.tile) ? [{ tile: f.tile, sure: f.sure !== false }] : []);
  const quality = ['ok', 'blurry', 'dark', 'partial', 'no_tiles'].includes(raw.quality as string) ? raw.quality as Recognition['quality'] : 'ok';
  if (quality === 'ok' && tiles.length === 0) throw new Error('reply had no tiles');
  return { quality, problem: typeof raw.problem === 'string' ? raw.problem : null, tiles, flowers };
}

// ---------- Shared sessions
const CODE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // no I, O or Q: easy to read aloud and type

async function createRoom(request: Request, env: Env, origin: string | null): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { session?: RoomSession; device?: string; seat?: number | null } | null;
  if (!body?.session || typeof body.device !== 'string' || !Array.isArray(body.session.players) || body.session.players.length !== 4)
    return json({ error: 'Missing session' }, 400, origin);
  if (JSON.stringify(body.session).length > 1_500_000) return json({ error: 'This session is too long to share.' }, 413, origin);
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = Array.from({ length: 4 }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join('');
    const res = await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch('https://room/init', {
      method: 'POST', body: JSON.stringify({ code, session: body.session, device: body.device, seat: body.seat ?? null }),
    });
    if (res.status === 200) return json({ code }, 200, origin);
  }
  return json({ error: 'Couldn’t create a code. Try again.' }, 503, origin);
}

interface PhotoCost { photos: number; inputTokens: number; outputTokens: number; usd: number; last: { input: number; output: number; usd: number; at: number } | null }

/** Running photo-accuracy totals per model, plus the most recent comparisons and the cost of each photo. */
export class PhotoStats extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const byModel = (await this.ctx.storage.get<Record<string, ModelStats>>('byModel')) ?? {};
    const costs = (await this.ctx.storage.get<Record<string, PhotoCost>>('costs')) ?? {};
    if (url.pathname === '/get') {
      const recent = (await this.ctx.storage.get<unknown[]>('recent')) ?? [];
      return Response.json({ byModel, costs, recent: recent.slice(-50) });
    }
    if (url.pathname === '/cost') {
      const c = (await request.json()) as { model: string; input: number; output: number; usd: number };
      const prev = costs[c.model] ?? { photos: 0, inputTokens: 0, outputTokens: 0, usd: 0, last: null };
      costs[c.model] = {
        photos: prev.photos + 1, inputTokens: prev.inputTokens + c.input, outputTokens: prev.outputTokens + c.output, usd: prev.usd + c.usd,
        last: { input: c.input, output: c.output, usd: c.usd, at: Date.now() },
      };
      await this.ctx.storage.put('costs', costs);
      return Response.json({ ok: true });
    }
    let f: Feedback;
    try { f = await request.json(); } catch { return Response.json({ error: 'Bad feedback' }, { status: 400 }); }
    const isList = (v: unknown, n: number) => Array.isArray(v) && v.length <= n;
    if (typeof f?.model !== 'string' || f.model.length > 100 || !isList(f.read, 30) || !isList(f.final, 30) || !isList(f.flowersRead, 8) || !isList(f.flowersFinal, 8))
      return Response.json({ error: 'Bad feedback' }, { status: 400 });
    const c = compare(f);
    byModel[f.model] = addTo(byModel[f.model] ?? emptyStats(), c);
    const recent = (await this.ctx.storage.get<unknown[]>('recent')) ?? [];
    recent.push({ at: Date.now(), model: f.model, read: f.read, final: f.final, flowersRead: f.flowersRead, flowersFinal: f.flowersFinal, ...c });
    await this.ctx.storage.put({ byModel, recent: recent.slice(-500) });
    return Response.json({ ok: true, ...c });
  }
}

/** One shared session. Holds the authoritative copy and relays every change to every phone. */
export class SessionRoom extends DurableObject<Env> {
  private async load(): Promise<RoomState | undefined> { return this.ctx.storage.get<RoomState>('state'); }

  private devices(): Set<string> {
    return new Set(this.ctx.getWebSockets().map((w) => (w.deserializeAttachment() as { device: string }).device));
  }

  private broadcast(state: RoomState) {
    const msg = JSON.stringify({ type: 'state', state });
    for (const w of this.ctx.getWebSockets()) { try { w.send(msg); } catch { /* closed */ } }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/init') {
      if (await this.load()) return new Response('taken', { status: 409 });
      const b = (await request.json()) as { code: string; session: RoomSession; device: string; seat: number | null };
      await this.ctx.storage.put('state', newRoom(b.code, { ...b.session, events: b.session.events ?? [] }, b.device, b.seat));
      return new Response('ok');
    }
    const device = url.searchParams.get('device') ?? '';
    const state = await this.load();
    if (!state) return new Response(JSON.stringify({ error: 'No session with that code.' }), { status: 404 });
    if (!/^[a-z0-9]{6,32}$/i.test(device)) return new Response('bad device', { status: 400 });
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ device });
    server.send(JSON.stringify({ type: 'state', state }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || message.length > 300_000) return;
    const { device } = ws.deserializeAttachment() as { device: string };
    let op: Op & { id?: string };
    try { op = JSON.parse(message); } catch { return; }
    let state = await this.load();
    if (!state) return;
    state = expireLock(state, Date.now(), this.devices());
    const res = apply(state, device, op, Date.now());
    if (!res.ok) { ws.send(JSON.stringify({ type: 'error', id: op.id, error: res.error, state })); return; }
    if (res.state !== state || res.state.version !== state.version) {
      await this.ctx.storage.put('state', res.state);
      this.broadcast(res.state);
    }
    ws.send(JSON.stringify({ type: 'ack', id: op.id }));
  }

  async webSocketClose(ws: WebSocket) {
    const { device } = ws.deserializeAttachment() as { device: string };
    const state = await this.load();
    if (!state?.lock || state.lock.device !== device) return;
    const stillHere = this.ctx.getWebSockets().some((w) => w !== ws && (w.deserializeAttachment() as { device: string }).device === device);
    if (stillHere) return;
    const next = { ...state, lock: null, version: state.version + 1 };
    await this.ctx.storage.put('state', next);
    this.broadcast(next);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Not allowed' }, 403, origin);
    const path = new URL(request.url).pathname;

    // Shared sessions: GET /session/ABCD/ws?device=… opens a live connection to that room.
    const ws = path.match(/^\/session\/([A-Z]{4})\/ws$/);
    if (ws && request.headers.get('Upgrade') === 'websocket') {
      return env.ROOMS.get(env.ROOMS.idFromName(ws[1])).fetch(request);
    }
    if (path === '/session' && request.method === 'POST') return createRoom(request, env, origin);
    // Photo accuracy: corrections in (tile names only), totals out.
    const stats = env.STATS.get(env.STATS.idFromName('all'));
    if (path === '/feedback' && request.method === 'POST') {
      const res = await stats.fetch('https://stats/add', { method: 'POST', body: await request.text() });
      return json(await res.json(), res.status, origin);
    }
    if (path === '/stats' && request.method === 'GET') {
      const res = await stats.fetch('https://stats/get');
      return json(await res.json(), 200, origin);
    }

    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, origin);

    try {
      const body = (await request.json()) as { image?: unknown; text?: unknown };
      if (path === '/recognize') {
        if (typeof body.image !== 'string' || !body.image) return json({ error: 'Missing image' }, 400, origin);
        if (body.image.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'Photo too large' }, 413, origin);
        const result = await recognizePhoto(env, body.image);
        return json(result, 200, origin);
      }
      if (path === '/rule') {
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 600) return json({ error: 'Describe the rule in up to 600 characters.' }, 400, origin);
        const result = await ask(env, RuleSchema, [{ type: 'text', text: RULE_PROMPT(body.text.trim()) }], 'Claude declined to read this rule. Try wording it differently.');
        return json(result, 200, origin);
      }
      return json({ error: 'Not found' }, 404, origin);
    } catch (e) {
      if (e instanceof PhotoError) { console.error(e.detail); return json({ error: e.message, detail: e.detail }, 502, origin); }
      if (e instanceof UserError) return json({ error: e.message }, 422, origin);
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'Too many requests right now. Try again in a minute.' }, 429, origin);
      if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The server’s API key isn’t working.' }, 500, origin);
      if (e instanceof Anthropic.APIError) return json({ error: 'The recognition service had a problem. Try again.' }, 502, origin);
      console.error(e);
      return json({ error: 'Couldn’t read the photo just now. Try again, or enter the tiles by hand.' }, 500, origin);
    }
  },
};
