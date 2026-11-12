import type { CustomRule, RuleClause } from './engine/customRule';
import type { TileId } from './engine/tiles';

/** The photo server (Cloudflare Worker). It holds the API key; this app never does. */
export const SERVER: string = import.meta.env.VITE_SERVER ?? 'https://mahjong-magic.eileentjiang.workers.dev';

export interface Recognition {
  quality: 'ok' | 'blurry' | 'dark' | 'partial' | 'no_tiles';
  problem: string | null;
  tiles: { tile: TileId; sure: boolean; alternatives: TileId[] }[];
  flowers: { tile: TileId; sure: boolean }[];
}

export interface RuleReading {
  ok: boolean;
  problem: string | null;
  name: string;
  when: string;
  points: number;
  all: RuleClause[];
}

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(SERVER + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'The photo service didn’t respond.');
    return data as T;
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('That took too long. Check your connection and try again.');
    if (e instanceof TypeError) throw new Error('Couldn’t reach the photo service. Check your connection.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Shrink a photo to at most 1600px on the long side, as base64 JPEG. Photos are never stored. */
export async function photoToJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

export const recognize = (image: string) => post<Recognition>('/recognize', { image }, 90_000);
export const readRule = (text: string) => post<RuleReading>('/rule', { text }, 60_000);

export type { CustomRule };
