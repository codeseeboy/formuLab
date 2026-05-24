import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/rag/extract';
import { chunkText } from '@/lib/rag/chunker';
import { saveIngestedDocument } from '@/lib/rag/server/appwrite-rag';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      return NextResponse.json({ error: 'Server missing APPWRITE_API_KEY' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const orgId = String(form.get('orgId') ?? '');
    const userId = String(form.get('userId') ?? '');
    const title = String(form.get('title') ?? file?.name ?? 'Untitled');
    const pasteText = form.get('pasteText') as string | null;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'orgId and userId required' }, { status: 400 });
    }

    let text = '';
    let filename = 'paste.txt';
    let mimeType = 'text/plain';
    let buffer: Buffer | undefined;

    if (pasteText && pasteText.trim()) {
      text = pasteText.trim();
      filename = 'pasted-notes.txt';
    } else if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
      filename = file.name;
      mimeType = file.type || 'application/octet-stream';
      text = await extractTextFromFile(buffer, filename, mimeType);
    } else {
      return NextResponse.json({ error: 'Upload a file or paste text' }, { status: 400 });
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Document too short or unreadable (min 50 characters)' }, { status: 400 });
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text chunks extracted' }, { status: 400 });
    }

    const { document, chunkCount } = await saveIngestedDocument({
      orgId,
      userId,
      title,
      filename,
      sourceType: pasteText ? 'paste' : 'upload',
      mimeType,
      chunks,
      fileBuffer: buffer,
    });

    return NextResponse.json({
      success: true,
      documentId: document.$id ?? '',
      title: document.title,
      chunkCount,
      message: `Indexed ${chunkCount} sections for RAG search`,
    });
  } catch (err: unknown) {
    console.error('RAG ingest error:', err);
    const message = err instanceof Error ? err.message : 'Ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
