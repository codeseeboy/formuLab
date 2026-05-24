// Client-side RAG API helpers

export async function ingestDocument(params: {
  orgId: string;
  userId: string;
  file?: File;
  pasteText?: string;
  title?: string;
}) {
  const form = new FormData();
  form.append('orgId', params.orgId);
  form.append('userId', params.userId);
  if (params.title) form.append('title', params.title);
  if (params.file) form.append('file', params.file);
  if (params.pasteText) form.append('pasteText', params.pasteText);

  const res = await fetch('/api/rag/ingest', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function askKnowledge(query: string, orgId: string, userId: string) {
  const res = await fetch('/api/rag/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, orgId, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ask failed');
  return data as {
    answer: string;
    sources: { title: string; type: string; excerpt: string; score: number }[];
    usedLlm: boolean;
    verified: boolean;
    mode: string;
  };
}

export async function ingestUrl(params: {
  url: string;
  orgId: string;
  userId: string;
  title?: string;
}) {
  const res = await fetch('/api/rag/ingest-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'URL import failed');
  return data;
}

export async function seedWikipediaCorpus(orgId: string, userId: string) {
  const res = await fetch('/api/rag/seed-wikipedia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Wikipedia seed failed');
  return data as { articles: number; chunksIndexed: number; message: string };
}

export async function fetchRagContext(query: string, orgId: string, userId?: string) {
  const res = await fetch('/api/rag/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, orgId, userId, includeWikipedia: true, includeBuiltin: true }),
  });
  const data = await res.json();
  if (!res.ok) return { context: '', hits: [] };
  return data as { context: string; hits: { title: string; type: string; excerpt: string; score: number }[] };
}

export async function listRagDocuments(orgId: string) {
  const res = await fetch(`/api/rag/documents?orgId=${encodeURIComponent(orgId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to list documents');
  return data.documents as {
    $id: string;
    title: string;
    filename: string;
    source_type: string;
    chunk_count: number;
    created_at: string;
  }[];
}

export async function deleteRagDocument(orgId: string, documentId: string) {
  const res = await fetch('/api/rag/documents', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, documentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete failed');
  return data;
}
