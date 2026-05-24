import type { RagChunk } from './types';

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

export function scoreChunk(query: string, chunk: RagChunk): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const hay = `${chunk.source_title} ${chunk.content}`.toLowerCase();
  let score = 0;

  for (const t of tokens) {
    if (hay.includes(t)) score += 10;
    const re = new RegExp(`\\b${t}`, 'gi');
    const matches = hay.match(re);
    if (matches) score += matches.length * 2;
  }

  if (chunk.source_type === 'upload') score += 3;
  if (chunk.source_type === 'wikipedia') score += 2;

  return score;
}

export function rankChunks(query: string, chunks: RagChunk[], limit = 8): { chunk: RagChunk; score: number }[] {
  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildContextFromHits(
  hits: { chunk: RagChunk; score: number }[]
): string {
  if (hits.length === 0) return '';
  return hits
    .map(
      (h, i) =>
        `[Source ${i + 1}: ${h.chunk.source_title} (${h.chunk.source_type}), relevance=${h.score}]\n${h.chunk.content}`
    )
    .join('\n\n---\n\n');
}
