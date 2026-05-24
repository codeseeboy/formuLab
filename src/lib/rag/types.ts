export type RagSourceType = 'upload' | 'wikipedia' | 'builtin' | 'paste' | 'reference' | 'web';

export interface RagChunk {
  id: string;
  org_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  source_title: string;
  source_type: RagSourceType;
  created_at: string;
}

export interface RagDocument {
  $id?: string;
  id?: string;
  org_id: string;
  title: string;
  filename: string;
  source_type: RagSourceType;
  mime_type: string;
  chunk_count: number;
  file_id?: string;
  created_by: string;
  created_at: string;
}

export interface RagSearchHit {
  chunk: RagChunk;
  score: number;
  highlight?: string;
}

export interface RagAskResult {
  answer: string;
  sources: { title: string; type: RagSourceType; excerpt: string; score: number }[];
  usedLlm: boolean;
}
