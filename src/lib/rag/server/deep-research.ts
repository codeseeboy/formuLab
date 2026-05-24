import { searchWikipedia, fetchWikipediaArticle } from '../wikipedia';
import { chunkText } from '../chunker';
import { rankChunks } from '../scoring';
import { searchKnowledge, getKnowledgeContextForPrompt } from '@/lib/knowledge';
import {
  extractChemicalHints,
  fetchPubChemByName,
  fetchPubChemByCas,
  pubChemToText,
} from '../pubchem';
import { listOrgChunks, saveIngestedDocument, saveWikipediaChunks } from './appwrite-rag';
import type { RagChunk, RagSourceType } from '../types';
import type { VerifiedHit } from '../strict-answer';

export interface DeepResearchResult {
  context: string;
  hits: VerifiedHit[];
}

export async function deepResearch(
  orgId: string,
  userId: string | undefined,
  query: string
): Promise<DeepResearchResult> {
  const hits: VerifiedHit[] = [];
  const extraChunks: RagChunk[] = [];

  const orgChunks = await listOrgChunks(orgId, 800);
  let ranked = rankChunks(query, orgChunks, 12);
  for (const r of ranked) {
    hits.push(toVerifiedHit(r.chunk, r.score));
  }

  const hints = extractChemicalHints(query);
  for (const cas of hints.cas) {
    const pc = await fetchPubChemByCas(cas);
    if (pc) {
      const text = pubChemToText(pc);
      extraChunks.push(makeChunk(orgId, `PubChem: ${cas}`, 'reference', text));
    }
  }
  for (const name of hints.names.slice(0, 3)) {
    const pc = await fetchPubChemByName(name);
    if (pc) {
      extraChunks.push(makeChunk(orgId, `PubChem: ${name}`, 'reference', pubChemToText(pc)));
    }
  }

  const wiki = await searchWikipedia(query, 4);
  for (const w of wiki) {
    const chunks = chunkText(w.extract);
    for (let i = 0; i < chunks.length; i++) {
      extraChunks.push(
        makeChunk(orgId, `Wikipedia: ${w.title}`, 'wikipedia', chunks[i], w.url)
      );
    }
    if (userId && chunks.length) {
      saveWikipediaChunks(orgId, userId, w.title, chunks).catch(() => {});
    }
  }

  if (extraChunks.length) {
    const extraRanked = rankChunks(query, extraChunks, 12);
    for (const r of extraRanked) {
      if (!hits.some((h) => h.title === r.chunk.source_title)) {
        hits.push(toVerifiedHit(r.chunk, r.score + 8));
      }
    }
  }

  const builtin = searchKnowledge(query, 6);
  for (const e of builtin) {
    hits.push({
      title: e.title,
      type: 'builtin',
      excerpt: e.snippet,
      fullText: e.snippet,
      score: (e.score ?? 0) + 6,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 14);
  const contextParts = top.map(
    (h, i) => `[Source ${i + 1}: ${h.title}]\n${h.fullText.slice(0, 1800)}`
  );
  const handbook = getKnowledgeContextForPrompt(query, 4);
  if (handbook) contextParts.push(`[Handbook]\n${handbook}`);

  return {
    context: contextParts.join('\n\n---\n\n'),
    hits: top,
  };
}

export async function bulkSeedWikipedia(orgId: string, userId: string): Promise<{ indexed: number; articles: number }> {
  const { WIKIPEDIA_CORPUS_TITLES } = await import('../wikipedia-corpus');
  let articles = 0;
  let indexed = 0;

  for (const title of WIKIPEDIA_CORPUS_TITLES) {
    try {
      let page = await fetchWikipediaArticle(title);
      if (!page?.extract) {
        const results = await searchWikipedia(title, 1);
        page = results[0] ?? null;
      }
      if (!page?.extract) continue;
      const chunks = chunkText(page.extract);
      if (chunks.length === 0) continue;
      await saveIngestedDocument({
        orgId,
        userId,
        title: `Wikipedia: ${page.title}`,
        filename: 'wikipedia-corpus.txt',
        sourceType: 'wikipedia',
        mimeType: 'text/plain',
        chunks,
      });
      articles++;
      indexed += chunks.length;
      await sleep(350);
    } catch {
      /* skip failed title */
    }
  }

  return { indexed, articles };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeChunk(
  orgId: string,
  title: string,
  type: RagSourceType,
  content: string,
  url?: string
): RagChunk {
  return {
    id: `live-${title}`,
    org_id: orgId,
    document_id: 'live',
    chunk_index: 0,
    content: url ? `${content}\nURL: ${url}` : content,
    source_title: title,
    source_type: type,
    created_at: new Date().toISOString(),
  };
}

function toVerifiedHit(chunk: RagChunk, score: number): VerifiedHit {
  return {
    title: chunk.source_title,
    type: chunk.source_type,
    excerpt: chunk.content.slice(0, 280),
    fullText: chunk.content,
    score,
  };
}
