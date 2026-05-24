import { deepResearch } from './deep-research';
import type { RagSourceType } from '../types';

export interface RetrieveOptions {
  orgId: string;
  userId?: string;
  query: string;
  limit?: number;
  includeWikipedia?: boolean;
  includeBuiltin?: boolean;
  cacheWiki?: boolean;
}

export interface RetrieveResult {
  context: string;
  hits: { title: string; type: RagSourceType; excerpt: string; score: number }[];
}

export async function retrieveContext(opts: RetrieveOptions): Promise<RetrieveResult> {
  const { context, hits } = await deepResearch(opts.orgId, opts.userId, opts.query);
  const limit = opts.limit ?? 12;

  let filtered = hits;
  if (opts.includeWikipedia === false) {
    filtered = filtered.filter((h) => h.type !== 'wikipedia');
  }
  if (opts.includeBuiltin === false) {
    filtered = filtered.filter((h) => h.type !== 'builtin');
  }

  return {
    context: context.trim(),
    hits: filtered.slice(0, limit).map((h) => ({
      title: h.title,
      type: h.type,
      excerpt: h.excerpt,
      score: h.score,
    })),
  };
}
