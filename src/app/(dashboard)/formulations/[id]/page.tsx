'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FORMULATION_TYPE_LABELS, STATUS_CONFIG, INGREDIENT_ROLE_LABELS, UNIT_LABELS } from '@/lib/constants';
import { safeJsonParse, formatDate } from '@/lib/utils';
import * as formulationService from '@/lib/services/formulation.service';
import * as reportService from '@/lib/services/report.service';
import type { Formulation, ActiveIngredient, FormulationRecommendation, SurfactantSuggestion, StabilityRisk, GeneratedRecipe } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { StabilityTestsPanel } from '@/components/StabilityTestsPanel';
import {
  ArrowLeft, FlaskConical, Download, Trash2, Edit, CheckCircle2,
  Clock, Sparkles, Shield, Brain, FileText,
} from 'lucide-react';

export default function FormulationDetailPage() {
  const { id } = useParams();
  const { user, org } = useAuth();
  const router = useRouter();
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [ingredient, setIngredient] = useState<ActiveIngredient | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) loadFormulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadFormulation = async () => {
    try {
      const form = await formulationService.getFormulation(id as string);
      setFormulation(form);
      if (form.ai_id) {
        const ai = await formulationService.getActiveIngredient(form.ai_id);
        setIngredient(ai);
      }
    } catch (error) {
      console.error('Failed to load formulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will permanently delete this formulation.')) return;
    try {
      await formulationService.deleteFormulation(id as string);
      router.push('/formulations');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!formulation || !ingredient) return;
    setIsGeneratingPDF(true);
    try {
      const blob = await reportService.generateFormulationPDF(formulation, ingredient);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formulation.name.replace(/\s+/g, '_')}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!formulation) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Formulation not found</h3>
        <button className="btn btn-primary" onClick={() => router.push('/formulations')}>
          Back to Formulations
        </button>
      </div>
    );
  }

  const recommendations = safeJsonParse<FormulationRecommendation[]>(formulation.recommended_types, []);
  const surfactants = safeJsonParse<SurfactantSuggestion[]>(formulation.surfactant_strategy, []);
  const risks = safeJsonParse<StabilityRisk[]>(formulation.stability_assessment, []);
  const recipe = safeJsonParse<GeneratedRecipe | null>(formulation.recipe_json, null);
  const statusConfig = STATUS_CONFIG[formulation.status];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FlaskConical size={14} /> },
    { id: 'recipe', label: 'Recipe', icon: <Brain size={14} /> },
    { id: 'surfactants', label: 'Surfactants', icon: <Sparkles size={14} /> },
    { id: 'stability', label: 'Stability', icon: <Shield size={14} /> },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 className="page-title">{formulation.name}</h1>
            <span className="badge" style={{
              background: `${statusConfig?.color}20`,
              color: statusConfig?.color,
              borderColor: `${statusConfig?.color}40`,
            }}>
              {statusConfig?.label}
            </span>
          </div>
          <p className="page-subtitle">
            {FORMULATION_TYPE_LABELS[formulation.formulation_type]} · Version {formulation.version} · {formatDate(formulation.created_at)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={14} />}
            Export PDF
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-brand)' }}>
            <FlaskConical size={20} />
          </div>
          <div className="stat-card-value">{formulation.formulation_type}</div>
          <div className="stat-card-label">{FORMULATION_TYPE_LABELS[formulation.formulation_type]}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Brain size={20} />
          </div>
          <div className="stat-card-value">{formulation.target_ai_loading}%</div>
          <div className="stat-card-label">AI Loading (w/w)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Sparkles size={20} />
          </div>
          <div className="stat-card-value">{surfactants.length}</div>
          <div className="stat-card-label">Surfactants</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Shield size={20} />
          </div>
          <div className="stat-card-value">{risks.filter(r => r.severity === 'high' || r.severity === 'critical').length}</div>
          <div className="stat-card-label">High Risks</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'overview' && (
          <div className="content-grid-2">
            <div className="card">
              <h4 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Active Ingredient</h4>
              {ingredient ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[
                    ['Name', ingredient.name],
                    ['CAS', ingredient.cas_number],
                    ['MW', `${ingredient.molecular_weight} g/mol`],
                    ['m.p.', `${ingredient.melting_point}°C`],
                    ['Solubility', `${ingredient.solubility_water} mg/L`],
                    ['Log P', ingredient.log_p],
                    ['Form', ingredient.physical_form],
                    ['Purity', `${ingredient.technical_purity}%`],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ padding: 'var(--space-2)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{String(value)}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)' }}>No ingredient linked</p>}
            </div>

            <div className="card">
              <h4 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>AI Recommendations</h4>
              {recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: rec.type === formulation.formulation_type ? 'var(--color-brand-subtle)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {rec.type === formulation.formulation_type && <CheckCircle2 size={14} style={{ color: 'var(--color-brand)' }} />}
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{rec.type}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{FORMULATION_TYPE_LABELS[rec.type]}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{rec.score}%</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)' }}>No recommendations available</p>}
            </div>
          </div>
        )}

        {activeTab === 'recipe' && recipe && (
          <div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Ingredient</th><th>Role</th><th>Qty</th><th>Unit</th><th>Purpose</th></tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ing.name}</td>
                      <td><span className="badge badge-brand">{INGREDIENT_ROLE_LABELS[ing.role] || ing.role}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{ing.quantity}</td>
                      <td>{UNIT_LABELS[ing.unit] || ing.unit}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{ing.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recipe.processing_notes.length > 0 && (
              <div className="card">
                <h4 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Processing Notes</h4>
                <ol style={{ paddingLeft: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {recipe.processing_notes.map((note, i) => (
                    <li key={i} style={{ marginBottom: 'var(--space-2)', listStyleType: 'decimal' }}>{note}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {activeTab === 'surfactants' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {surfactants.map((surf, i) => (
              <div key={i} className="card">
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{surf.category}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>{surf.chemical_class}</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{surf.function}</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {surf.trade_names.map((tn, j) => <span key={j} className="badge badge-info">{tn}</span>)}
                </div>
                <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  Level: {surf.recommended_level} {surf.hlb_range && `· HLB: ${surf.hlb_range}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stability' && (
          <div>
            <h4 className="card-title" style={{ marginBottom: 12 }}>AI stability risk assessment</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {risks.length === 0 ? (
                <p className="text-muted">No AI risk assessment stored for this formulation.</p>
              ) : (
                risks.map((risk, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--space-3)' }}>
                      <span className={`risk-indicator risk-${risk.severity}`}>{risk.severity.toUpperCase()}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{risk.risk_type}</div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-2) 0' }}>{risk.description}</p>
                        <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          {risk.mitigation.map((m, j) => <li key={j}>• {m}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {user && <StabilityTestsPanel formulationId={formulation.$id} userId={user.$id} />}
          </div>
        )}
      </div>
    </div>
  );
}
