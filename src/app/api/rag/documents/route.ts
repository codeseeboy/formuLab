import { NextRequest, NextResponse } from 'next/server';
import { listOrgDocuments, deleteDocument } from '@/lib/rag/server/appwrite-rag';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  try {
    const documents = await listOrgDocuments(orgId);
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, documentId } = await req.json();
    if (!orgId || !documentId) {
      return NextResponse.json({ error: 'orgId and documentId required' }, { status: 400 });
    }
    await deleteDocument(orgId, documentId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
