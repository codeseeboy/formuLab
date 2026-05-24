import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext } from '@/lib/rag/server/retrieve';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, orgId, userId, includeWikipedia = true, includeBuiltin = true } = body;

    if (!query || !orgId) {
      return NextResponse.json({ error: 'query and orgId required' }, { status: 400 });
    }

    const result = await retrieveContext({
      query,
      orgId,
      userId,
      includeWikipedia,
      includeBuiltin,
      cacheWiki: true,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Retrieve failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
