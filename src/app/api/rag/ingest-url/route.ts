import { NextRequest, NextResponse } from 'next/server';
import { fetchUrlContent } from '@/lib/rag/web-fetch';
import { chunkText } from '@/lib/rag/chunker';
import { saveIngestedDocument } from '@/lib/rag/server/appwrite-rag';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const { url, orgId, userId, title } = await req.json();
    if (!url || !orgId || !userId) {
      return NextResponse.json({ error: 'url, orgId, userId required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 });
    }

    const { text, title: fetchedTitle, mimeHint } = await fetchUrlContent(url);
    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'No readable text at URL' }, { status: 400 });
    }

    const chunks = chunkText(text);
    const { document, chunkCount } = await saveIngestedDocument({
      orgId,
      userId,
      title: title || fetchedTitle || url,
      filename: parsed.pathname.split('/').pop() || 'web-page',
      sourceType: 'web',
      mimeType: mimeHint,
      chunks,
    });

    return NextResponse.json({
      success: true,
      documentId: document.$id ?? '',
      chunkCount,
      message: `Indexed ${chunkCount} sections from web URL`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'URL ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
