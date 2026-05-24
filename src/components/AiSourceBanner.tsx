'use client';

import { Sparkles, BookOpen } from 'lucide-react';
import type { AiSource } from '@/lib/services/ai.service';

export function AiSourceBanner({ source }: { source: AiSource }) {
  if (source === 'llm') {
    return (
      <div
        className="ai-source-banner ai-source-llm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          marginBottom: 16,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-brand-light)',
        }}
      >
        <Sparkles size={16} />
        <span>
          <strong>Live AI</strong> — response from cloud LLM with your RAG sources and handbook context.
        </span>
      </div>
    );
  }

  return (
    <div
      className="ai-source-banner ai-source-offline"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        marginBottom: 16,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-accent-light)',
      }}
    >
      <BookOpen size={16} />
      <span>
        <strong>Handbook mode</strong> — cloud AI was unavailable. Answers use built-in knowledge only. Retry when online.
      </span>
    </div>
  );
}
