import { Client, Databases, ID, Query, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import type { RagChunk, RagDocument, RagSourceType } from '../types';

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const DOCS_COLLECTION = 'knowledge_documents';
const CHUNKS_COLLECTION = 'knowledge_chunks';
const FILES_BUCKET = 'knowledge-files';

function getClient() {
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
}

export async function listOrgChunks(orgId: string, limit = 500): Promise<RagChunk[]> {
  const databases = new Databases(getClient());
  const res = await databases.listDocuments(DATABASE_ID, CHUNKS_COLLECTION, [
    Query.equal('org_id', orgId),
    Query.limit(limit),
    Query.orderDesc('$createdAt'),
  ]);
  return res.documents as unknown as RagChunk[];
}

export async function listOrgDocuments(orgId: string): Promise<RagDocument[]> {
  const databases = new Databases(getClient());
  const res = await databases.listDocuments(DATABASE_ID, DOCS_COLLECTION, [
    Query.equal('org_id', orgId),
    Query.orderDesc('created_at'),
    Query.limit(100),
  ]);
  return res.documents as unknown as RagDocument[];
}

export async function saveIngestedDocument(params: {
  orgId: string;
  userId: string;
  title: string;
  filename: string;
  sourceType: RagSourceType;
  mimeType: string;
  chunks: string[];
  fileBuffer?: Buffer;
}): Promise<{ document: RagDocument; chunkCount: number }> {
  const client = getClient();
  const databases = new Databases(client);
  const storage = new Storage(client);
  const docId = ID.unique();
  let fileId = '';

  if (params.fileBuffer) {
    const file = await storage.createFile(
      FILES_BUCKET,
      ID.unique(),
      InputFile.fromBuffer(params.fileBuffer, params.filename)
    );
    fileId = file.$id;
  }

  const document = (await databases.createDocument(DATABASE_ID, DOCS_COLLECTION, docId, {
    org_id: params.orgId,
    title: params.title,
    filename: params.filename,
    source_type: params.sourceType,
    mime_type: params.mimeType,
    chunk_count: params.chunks.length,
    file_id: fileId,
    created_by: params.userId,
    created_at: new Date().toISOString(),
  })) as unknown as RagDocument;

  for (let i = 0; i < params.chunks.length; i++) {
    await databases.createDocument(DATABASE_ID, CHUNKS_COLLECTION, ID.unique(), {
      org_id: params.orgId,
      document_id: docId,
      chunk_index: i,
      content: params.chunks[i].slice(0, 12000),
      source_title: params.title,
      source_type: params.sourceType,
      created_at: new Date().toISOString(),
    });
  }

  return { document, chunkCount: params.chunks.length };
}

export async function saveWikipediaChunks(
  orgId: string,
  userId: string,
  title: string,
  chunks: string[]
): Promise<number> {
  const { chunkCount } = await saveIngestedDocument({
    orgId,
    userId,
    title: `Wikipedia: ${title}`,
    filename: 'wikipedia.txt',
    sourceType: 'wikipedia',
    mimeType: 'text/plain',
    chunks,
  });
  return chunkCount;
}

export async function deleteDocument(orgId: string, documentId: string): Promise<void> {
  const databases = new Databases(getClient());
  const chunks = await databases.listDocuments(DATABASE_ID, CHUNKS_COLLECTION, [
    Query.equal('org_id', orgId),
    Query.equal('document_id', documentId),
    Query.limit(500),
  ]);
  for (const c of chunks.documents) {
    await databases.deleteDocument(DATABASE_ID, CHUNKS_COLLECTION, c.$id);
  }
  await databases.deleteDocument(DATABASE_ID, DOCS_COLLECTION, documentId);
}
