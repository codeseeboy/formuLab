import { NextRequest, NextResponse } from 'next/server';
import { bulkSeedWikipedia } from '@/lib/rag/server/deep-research';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await req.json();
    if (!orgId || !userId) {
      return NextResponse.json({ error: 'orgId and userId required' }, { status: 400 });
    }

    const result = await bulkSeedWikipedia(orgId, userId);

    return NextResponse.json({
      success: true,
      articles: result.articles,
      chunksIndexed: result.indexed,
      message: `Wikipedia corpus: ${result.articles} articles, ${result.indexed} chunks indexed`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
