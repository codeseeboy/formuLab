import type { RagSourceType } from './types';

export const MIN_TRUST_SCORE = 10;

export const STRICT_SYSTEM_PROMPT = `You are FormuLab Verified Answer Engine — citation-only mode.

MANDATORY RULES:
1. Use ONLY facts explicitly present in SOURCES. Do not use training data.
2. Every factual statement MUST end with [Source N] matching the source number.
3. Forbidden words: might, may, possibly, probably, likely, uncertain, I think, perhaps, could be, seems.
4. If SOURCES do not contain enough information, output exactly: NOT FOUND IN VERIFIED SOURCES
5. If two sources disagree on a number, report both with sources: CONFLICT [Source A] vs [Source B]
6. Use exact numbers and units from sources — do not round unless source rounds.
7. Do not add introductions or conclusions not supported by sources.`;

export interface VerifiedHit {
  title: string;
  type: RagSourceType;
  excerpt: string;
  fullText: string;
  score: number;
}

export function buildExtractiveVerifiedAnswer(
  query: string,
  hits: VerifiedHit[]
): { answer: string; verified: boolean; sourceCount: number } {
  const qualified = hits.filter((h) => h.score >= MIN_TRUST_SCORE).slice(0, 8);

  if (qualified.length === 0) {
    return {
      answer:
        'NOT FOUND IN VERIFIED SOURCES.\n\nNo source met the minimum trust score. Upload documents, import a URL, or run “Expand Wikipedia corpus” under Knowledge → Sources.',
      verified: false,
      sourceCount: 0,
    };
  }

  const lines = [
    `Verified answer for: ${query}`,
    `(Only from ${qualified.length} source(s) above trust threshold — score ≥ ${MIN_TRUST_SCORE})`,
    '',
  ];

  qualified.forEach((h, i) => {
    const n = i + 1;
    lines.push(`[Source ${n}: ${h.title} | ${h.type} | trust score ${h.score}]`);
    lines.push(h.fullText.slice(0, 1200));
    lines.push('');
  });

  return {
    answer: lines.join('\n'),
    verified: true,
    sourceCount: qualified.length,
  };
}

export function formatHitsForLlm(hits: VerifiedHit[]): string {
  return hits
    .filter((h) => h.score >= MIN_TRUST_SCORE)
    .slice(0, 10)
    .map(
      (h, i) =>
        `[Source ${i + 1}] ${h.title} (${h.type}, score ${h.score})\n${h.fullText.slice(0, 1500)}`
    )
    .join('\n\n---\n\n');
}

export function isAnswerVerified(text: string): boolean {
  return !text.includes('NOT FOUND IN VERIFIED SOURCES');
}
