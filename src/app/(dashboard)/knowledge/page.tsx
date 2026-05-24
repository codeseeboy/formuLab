'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { searchKnowledge, getKnowledgeStats } from '@/lib/knowledge';
import {
  ingestDocument,
  askKnowledge,
  listRagDocuments,
  deleteRagDocument,
  ingestUrl,
  seedWikipediaCorpus,
} from '@/lib/services/rag.service';
import type { KnowledgeEntry } from '@/lib/knowledge/types';
import {
  BookOpen, Search, Upload, MessageCircle, Trash2,
  Globe, Database, Sparkles, AlertCircle, CheckCircle2,
} from 'lucide-react';

type Tab = 'ask' | 'sources' | 'library';

export default function KnowledgePage() {
  const { user, org } = useAuth();
  const [tab, setTab] = useState<Tab>('ask');
  const [libraryQuery, setLibraryQuery] = useState('');
  const stats = useMemo(() => getKnowledgeStats(), []);

  // —— Ask (RAG) ——
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<{ title: string; type: string; excerpt: string; score: number }[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);

  // —— Sources (upload) ——
  const [pasteText, setPasteText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [seedingWiki, setSeedingWiki] = useState(false);
  const [documents, setDocuments] = useState<
    { $id: string; title: string; filename: string; source_type: string; chunk_count: number; created_at: string }[]
  >([]);

  const libraryResults: KnowledgeEntry[] = useMemo(() => {
    if (!libraryQuery.trim()) return searchKnowledge('', 25);
    return searchKnowledge(libraryQuery, 40);
  }, [libraryQuery]);

  const loadDocs = useCallback(async () => {
    if (!org?.$id) return;
    try {
      const docs = await listRagDocuments(org.$id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    }
  }, [org?.$id]);

  useEffect(() => {
    if (tab === 'sources') loadDocs();
  }, [tab, loadDocs]);

  const handleAsk = async () => {
    if (!question.trim() || !org || !user) return;
    setAskLoading(true);
    setAskError('');
    setAnswer('');
    setSources([]);
    setVerified(null);
    try {
      const res = await askKnowledge(question, org.$id, user.$id);
      setAnswer(res.answer);
      setSources(res.sources);
      setVerified(res.verified ?? false);
    } catch (e: unknown) {
      setAskError(e instanceof Error ? e.message : 'Failed to get answer');
    } finally {
      setAskLoading(false);
    }
  };

  const handleUpload = async (file?: File) => {
    if (!org || !user) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const res = await ingestDocument({
        orgId: org.$id,
        userId: user.$id,
        file,
        pasteText: file ? undefined : pasteText,
        title: docTitle || file?.name,
      });
      setUploadMsg(`✅ ${res.message}`);
      setPasteText('');
      setDocTitle('');
      await loadDocs();
      setTab('ask');
    } catch (e: unknown) {
      setUploadMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!org || !user) {
    return <div className="card p-6">Please log in to use the knowledge brain.</div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Brain (RAG)</h1>
          <p className="page-subtitle">
            Verified mode — answers only from indexed sources (your files, Wikipedia corpus, PubChem, URLs). No guessing.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--color-brand)" />
          Do you have lab documents?
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          SOPs, PDFs, PPTX, pasted notes, web URLs, and bulk Wikipedia — add under <strong>Sources</strong>.
          Every answer is citation-only from those sources (strict verified mode).
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('sources')}>
          <Upload size={14} /> Add my documents
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {(['ask', 'sources', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'ask' && <MessageCircle size={14} />}
            {t === 'sources' && <Upload size={14} />}
            {t === 'library' && <BookOpen size={14} />}
            {t === 'ask' ? 'Ask AI' : t === 'sources' ? 'My sources' : 'Handbook'}
          </button>
        ))}
      </div>

      {tab === 'ask' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">Ask anything (formulation, AI, stability, regulations…)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why is my chlorpyrifos SC settling after 2 weeks? What HLB for lambda-cyhalothrin EC?"
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={handleAsk} disabled={askLoading}>
                {askLoading ? 'Deep research (docs + Wiki + PubChem)…' : 'Get verified answer'}
              </button>
              <span className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Globe size={12} /> Wikipedia · <Database size={12} /> Uploads · PubChem
              </span>
            </div>
            {askError && (
              <p style={{ color: 'var(--color-danger)', marginTop: 8, display: 'flex', gap: 6 }}>
                <AlertCircle size={16} /> {askError}
              </p>
            )}
          </div>

          {answer && (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Answer
                {verified === true && (
                  <span className="badge" style={{ background: 'var(--color-success)', color: '#fff' }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Verified
                  </span>
                )}
                {verified === false && (
                  <span className="badge" style={{ background: 'var(--color-warning)' }}>Needs more sources</span>
                )}
              </h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 'var(--text-sm)' }}>{answer}</div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>Sources used</h3>
              {sources.map((s, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    [{s.type}] {s.title} <span className="text-muted">· score {s.score}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', marginTop: 4, color: 'var(--color-text-secondary)' }}>{s.excerpt}…</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sources' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Upload document</h3>
            <div className="form-group">
              <label className="form-label">Title (optional)</label>
              <input className="form-input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Lab SOP – SC milling" />
            </div>
            <div className="form-group">
              <label className="form-label">Import from web (PDF, HTML page, PPTX URL)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 200 }}
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://example.com/report.pdf"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={uploading || !importUrl.trim()}
                  onClick={async () => {
                    if (!org || !user) return;
                    setUploading(true);
                    setUploadMsg('');
                    try {
                      const res = await ingestUrl({
                        url: importUrl.trim(),
                        orgId: org.$id,
                        userId: user.$id,
                        title: docTitle || undefined,
                      });
                      setUploadMsg(`✅ ${res.message}`);
                      setImportUrl('');
                      await loadDocs();
                    } catch (e: unknown) {
                      setUploadMsg(e instanceof Error ? e.message : 'URL import failed');
                    } finally {
                      setUploading(false);
                    }
                  }}
                >
                  Import URL
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">PDF, PPTX, TXT, MD, CSV, JSON</label>
              <input
                type="file"
                accept=".pdf,.pptx,.txt,.md,.csv,.json,text/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Or paste notes / article text</label>
              <textarea
                className="form-textarea"
                rows={8}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste notebook text, email, or article content here…"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={uploading || !pasteText.trim()}
              onClick={() => handleUpload()}
            >
              {uploading ? 'Indexing…' : 'Index pasted text'}
            </button>
            {uploadMsg && (
              <p style={{ marginTop: 12, color: uploadMsg.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {uploadMsg.startsWith('✅') ? <CheckCircle2 size={14} style={{ display: 'inline' }} /> : <AlertCircle size={14} style={{ display: 'inline' }} />}{' '}
                {uploadMsg}
              </p>
            )}
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 className="card-title" style={{ marginBottom: 8 }}>Wikipedia corpus (bulk download)</h3>
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 12 }}>
              Indexes ~50 agrochemical Wikipedia articles into your org (pesticides, formulations, surfactants). Run once, then answers use your local copy + live lookup.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={seedingWiki}
              onClick={async () => {
                if (!org || !user) return;
                setSeedingWiki(true);
                setUploadMsg('');
                try {
                  const res = await seedWikipediaCorpus(org.$id, user.$id);
                  setUploadMsg(`✅ ${res.message}`);
                  await loadDocs();
                } catch (e: unknown) {
                  setUploadMsg(e instanceof Error ? e.message : 'Wikipedia seed failed');
                } finally {
                  setSeedingWiki(false);
                }
              }}
            >
              {seedingWiki ? 'Downloading Wikipedia corpus…' : 'Expand Wikipedia corpus'}
            </button>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Your indexed documents ({documents.length})</h3>
            {documents.length === 0 ? (
              <p className="text-muted">No uploads yet. Add PDFs or notes so RAG can answer from your real data.</p>
            ) : (
              documents.map((d) => (
                <div key={d.$id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.title}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {d.filename} · {d.chunk_count} chunks · {d.source_type}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      await deleteRagDocument(org.$id, d.$id);
                      loadDocs();
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div>
          <div className="knowledge-stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="knowledge-stat-card">
              <div className="knowledge-stat-value">{stats.ingredients}</div>
              <div className="knowledge-stat-label">Built-in AIs</div>
            </div>
            <div className="knowledge-stat-card">
              <div className="knowledge-stat-value">{documents.length}</div>
              <div className="knowledge-stat-label">Your uploads</div>
            </div>
            <div className="knowledge-stat-card">
              <div className="knowledge-stat-value">{documents.filter((d) => d.source_type === 'wikipedia').length}</div>
              <div className="knowledge-stat-label">Wikipedia indexed</div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search handbook…"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
              />
            </div>
          </div>
          {libraryResults.map((entry) => (
            <div key={`${entry.type}-${entry.id}`} className="card" style={{ marginBottom: 8, padding: 16 }}>
              <strong>{entry.title}</strong>
              <span className="badge" style={{ marginLeft: 8 }}>{entry.type}</span>
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>{entry.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
