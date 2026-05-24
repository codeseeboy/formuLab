'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ISSUE_CATEGORY_LABELS, FORMULATION_TYPE_LABELS } from '@/lib/constants';
import * as aiService from '@/lib/services/ai.service';
import type { AiSource } from '@/lib/services/ai.service';
import { KNOWLEDGE_INGREDIENTS, getFormulationCodeOptions } from '@/lib/knowledge';
import { SmartCombobox } from '@/components/SmartCombobox';
import { AiSourceBanner } from '@/components/AiSourceBanner';
import * as troubleshootService from '@/lib/services/troubleshoot.service';
import { logAudit } from '@/lib/services/audit.service';
import { safeJsonParse } from '@/lib/utils';
import type { TroubleshootDiagnosis, IssueCategory, TroubleshootingSession } from '@/lib/types';
import {
  Bug, Send, AlertCircle, CheckCircle2, Lightbulb, Shield, RefreshCw, History,
} from 'lucide-react';

export default function TroubleshootPage() {
  const { org, user } = useAuth();
  const ragCtx = org && user ? { orgId: org.$id, userId: user.$id } : undefined;
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [description, setDescription] = useState('');
  const [formulationType, setFormulationType] = useState('');
  const [ingredientName, setIngredientName] = useState('');
  const [diagnosis, setDiagnosis] = useState<TroubleshootDiagnosis | null>(null);
  const [aiSource, setAiSource] = useState<AiSource>('llm');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<TroubleshootingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!org?.$id) return;
    try {
      const sessions = await troubleshootService.listTroubleshootSessions(org.$id);
      setHistory(sessions);
    } catch {
      setHistory([]);
    }
  }, [org?.$id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  const formulationOptions = useMemo(
    () =>
      getFormulationCodeOptions(formulationType, 12).map((c) => ({
        id: c.id,
        label: `${c.label} — ${FORMULATION_TYPE_LABELS[c.label] || c.label}`,
      })),
    [formulationType]
  );

  const ingredientOptions = useMemo(
    () =>
      KNOWLEDGE_INGREDIENTS.map((ing) => ({
        id: ing.id,
        label: ing.name,
        sublabel: ing.cas_number,
      })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) return;

    setIsLoading(true);
    setError('');
    setDiagnosis(null);

    try {
      const result = await aiService.diagnoseIssue(
        category,
        description,
        formulationType || undefined,
        ingredientName || undefined,
        ragCtx
      );
      setDiagnosis(result.data);
      setAiSource(result.source);

      if (org && user) {
        const session = await troubleshootService.saveTroubleshootSession({
          orgId: org.$id,
          userId: user.$id,
          issueCategory: category,
          description,
          diagnosis: result.data,
        });
        setSessionId(session.$id);
        await logAudit({
          orgId: org.$id,
          userId: user.$id,
          action: 'troubleshoot.diagnose',
          entityType: 'troubleshooting_session',
          entityId: session.$id,
          details: category,
        });
        await loadHistory();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get diagnosis. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCategory('');
    setDescription('');
    setFormulationType('');
    setIngredientName('');
    setDiagnosis(null);
    setSessionId(null);
    setError('');
  };

  const openHistorySession = (s: TroubleshootingSession) => {
    const empty: TroubleshootDiagnosis = { root_causes: [], remedies: [], preventive_measures: [] };
    const d = safeJsonParse<TroubleshootDiagnosis>(s.ai_diagnosis, empty);
    if (d.root_causes.length > 0 || d.remedies.length > 0) {
      setDiagnosis(d);
      setCategory(s.issue_category);
      setDescription(s.description);
      setSessionId(s.$id);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Troubleshoot</h1>
          <p className="page-subtitle">AI-powered formulation issue diagnosis and remediation</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            <History size={14} /> History ({history.length})
          </button>
          {diagnosis && (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              <RefreshCw size={14} /> New Session
            </button>
          )}
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="card-title" style={{ marginBottom: 12 }}>Past sessions</h3>
          {history.slice(0, 10).map((s) => (
            <button
              key={s.$id}
              type="button"
              className="sidebar-nav-item"
              style={{ width: '100%', textAlign: 'left', marginBottom: 4 }}
              onClick={() => {
                openHistorySession(s);
                setShowHistory(false);
              }}
            >
              <span>{ISSUE_CATEGORY_LABELS[s.issue_category] || s.issue_category}</span>
              <span className="text-muted" style={{ marginLeft: 8, fontSize: 'var(--text-xs)' }}>
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {!diagnosis && !isLoading && (
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bug size={20} />
              </div>
              <div>
                <h3 className="card-title">Describe Your Issue</h3>
                <p className="card-subtitle">The more detail you provide, the better the diagnosis</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label">Issue Category <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  required
                >
                  <option value="">Select a category...</option>
                  {Object.entries(ISSUE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Problem Description <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the issue in detail. Include observations like: when it occurs, batch conditions, visual appearance, any measurements (viscosity, pH, particle size), and what you've already tried..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="form-row">
                <SmartCombobox
                  label="Formulation Type (optional)"
                  value={formulationType}
                  onChange={setFormulationType}
                  options={formulationOptions}
                  placeholder="e.g. SC, EC, WDG"
                />
                <SmartCombobox
                  label="Active Ingredient (optional)"
                  value={ingredientName}
                  onChange={setIngredientName}
                  options={ingredientOptions}
                  placeholder="e.g. Chlorpyrifos"
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-4)', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)', color: 'var(--color-danger)',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!category || !description}>
              <Send size={16} /> Get AI Diagnosis
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="ai-thinking">
          <div className="ai-thinking-brain">🔬</div>
          <div className="ai-thinking-dots">
            <span /><span /><span />
          </div>
          <div className="ai-thinking-text">Analyzing your formulation issue...</div>
        </div>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <div className="animate-fadeInUp">
          <AiSourceBanner source={aiSource} />
          {sessionId && (
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 12 }}>
              Session saved to your organization history.
            </p>
          )}
          {/* Root Causes */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <AlertCircle size={20} style={{ color: '#f59e0b' }} />
              <h3 className="card-title">Root Cause Analysis</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {diagnosis.root_causes.map((cause, i) => {
                const likelihoodColors: Record<string, string> = {
                  high: 'var(--color-danger)',
                  medium: 'var(--color-warning)',
                  low: 'var(--color-success)',
                };
                return (
                  <div key={i} style={{
                    padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-lg)', borderLeft: `3px solid ${likelihoodColors[cause.likelihood]}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{cause.cause}</span>
                      <span className={`badge ${cause.likelihood === 'high' ? 'badge-danger' : cause.likelihood === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                        {cause.likelihood} likelihood
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{cause.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remedies */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <Lightbulb size={20} style={{ color: 'var(--color-brand)' }} />
              <h3 className="card-title">Recommended Remedies</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {diagnosis.remedies.map((remedy, i) => (
                <div key={i} style={{
                  padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--color-brand-subtle)', color: 'var(--color-brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 800,
                    }}>
                      {remedy.priority}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{remedy.action}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>{remedy.details}</p>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Expected: {remedy.expected_outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preventive Measures */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <Shield size={20} style={{ color: '#3b82f6' }} />
              <h3 className="card-title">Preventive Measures</h3>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {diagnosis.preventive_measures.map((measure, i) => (
                <li key={i} style={{
                  padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                }}>
                  <span style={{ color: '#3b82f6' }}>→</span> {measure}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
