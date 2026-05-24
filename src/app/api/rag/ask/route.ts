import { NextRequest, NextResponse } from 'next/server';
import { deepResearch } from '@/lib/rag/server/deep-research';
import {
  STRICT_SYSTEM_PROMPT,
  buildExtractiveVerifiedAnswer,
  formatHitsForLlm,
  MIN_TRUST_SCORE,
  isAnswerVerified,
} from '@/lib/rag/strict-answer';

export const runtime = 'nodejs';
export const maxDuration = 120;

const LLM_ENDPOINT = 'https://llm-backend-635x.onrender.com/api/generate/json';

export async function POST(req: NextRequest) {
  try {
    const { query, orgId, userId } = await req.json();
    if (!query || !orgId) {
      return NextResponse.json({ error: 'query and orgId required' }, { status: 400 });
    }

    const { hits } = await deepResearch(orgId, userId, query);

    const extractive = buildExtractiveVerifiedAnswer(query, hits);

    if (!extractive.verified) {
      return NextResponse.json({
        answer: extractive.answer,
        sources: hits.slice(0, 8),
        usedLlm: false,
        verified: false,
        mode: 'strict',
      });
    }

    const sourceBlock = formatHitsForLlm(hits);
    const userPrompt = `QUESTION:\n${query}\n\nSOURCES:\n${sourceBlock}\n\nRewrite as a clear answer. Every sentence must end with [Source N]. Use only source facts.`;

    let answer = extractive.answer;
    let usedLlm = false;

    try {
      const res = await fetch(LLM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          system: STRICT_SYSTEM_PROMPT,
          preferred_provider: 'gemini',
          temperature: 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.response) {
        const text = String(data.response).trim();
        if (!text.toLowerCase().includes('not found in verified')) {
          answer = text;
          usedLlm = true;
        }
      }
    } catch {
      /* keep extractive */
    }

    const verified = isAnswerVerified(answer) && hits.some((h) => h.score >= MIN_TRUST_SCORE);

    return NextResponse.json({
      answer,
      sources: hits.filter((h) => h.score >= MIN_TRUST_SCORE).slice(0, 12),
      usedLlm,
      verified,
      mode: 'strict',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ask failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
