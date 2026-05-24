'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { WIZARD_STEPS, FORMULATION_TYPE_LABELS, INGREDIENT_ROLE_LABELS, UNIT_LABELS } from '@/lib/constants';
import * as formulationService from '@/lib/services/formulation.service';
import * as aiService from '@/lib/services/ai.service';
import type { AiSource } from '@/lib/services/ai.service';
import { AiSourceBanner } from '@/components/AiSourceBanner';
import { logAudit } from '@/lib/services/audit.service';
import type {
  ActiveIngredient,
  FormulationRecommendation,
  SurfactantSuggestion,
  StabilityRisk,
  GeneratedRecipe,
  FormulationType,
  WizardState,
} from '@/lib/types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Brain,
  Sparkles,
  Shield,
  FlaskConical,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function NewFormulationPage() {
  const { user, org } = useAuth();
  const router = useRouter();
  const ragCtx = org && user ? { orgId: org.$id, userId: user.$id } : undefined;

  const [wizard, setWizard] = useState<WizardState>({
    currentStep: 1,
    activeIngredient: null,
    formulationName: '',
    targetLoading: 0,
    selectedType: null,
    recommendations: [],
    surfactants: [],
    risks: [],
    recipe: null,
    isLoading: false,
    error: null,
  });

  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([]);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [aiSource, setAiSource] = useState<AiSource>('llm');

  useEffect(() => {
    if (org?.$id) loadIngredients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const loadIngredients = async () => {
    try {
      const result = await formulationService.listActiveIngredients(org!.$id, undefined, 100);
      setIngredients(result.items);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const setStep = (step: number) => {
    setWizard((prev) => ({ ...prev, currentStep: step, error: null }));
  };

  const setLoading = (isLoading: boolean) => {
    setWizard((prev) => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setWizard((prev) => ({ ...prev, error }));
  };

  // ======================== STEP 2: Get Recommendations ========================
  const getRecommendations = async () => {
    if (!wizard.activeIngredient) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.recommendFormulationType(wizard.activeIngredient, ragCtx);
      setAiSource(res.source);
      setWizard((prev) => ({ ...prev, recommendations: res.data, isLoading: false }));
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get AI recommendations';
      setError(message);
      setLoading(false);
    }
  };

  // ======================== STEP 3: Get Surfactants ========================
  const getSurfactants = async () => {
    if (!wizard.activeIngredient || !wizard.selectedType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.suggestSurfactants(wizard.activeIngredient, wizard.selectedType, ragCtx);
      setAiSource(res.source);
      setWizard((prev) => ({ ...prev, surfactants: res.data, isLoading: false }));
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get surfactant suggestions';
      setError(message);
      setLoading(false);
    }
  };

  // ======================== STEP 4: Stability Assessment ========================
  const getStabilityAssessment = async () => {
    if (!wizard.activeIngredient || !wizard.selectedType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.assessStability(wizard.activeIngredient, wizard.selectedType, ragCtx);
      setAiSource(res.source);
      setWizard((prev) => ({ ...prev, risks: res.data, isLoading: false }));
      setStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assess stability';
      setError(message);
      setLoading(false);
    }
  };

  // ======================== STEP 5: Generate Recipe ========================
  const generateRecipe = async () => {
    if (!wizard.activeIngredient || !wizard.selectedType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.generateRecipe(
        wizard.activeIngredient,
        wizard.selectedType,
        wizard.targetLoading,
        wizard.surfactants,
        ragCtx
      );
      setAiSource(res.source);
      setWizard((prev) => ({ ...prev, recipe: res.data, isLoading: false }));
      setStep(5);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate recipe';
      setError(message);
      setLoading(false);
    }
  };

  // ======================== STEP 6: Save Formulation ========================
  const saveFormulation = async () => {
    if (!wizard.activeIngredient || !wizard.selectedType || !wizard.formulationName) return;
    setLoading(true);
    setError(null);
    try {
      const form = await formulationService.createFormulation({
        org_id: org!.$id,
        ai_id: wizard.activeIngredient.$id,
        name: wizard.formulationName,
        status: 'draft',
        formulation_type: wizard.selectedType,
        target_ai_loading: wizard.targetLoading,
        recommended_types: JSON.stringify(wizard.recommendations),
        surfactant_strategy: JSON.stringify(wizard.surfactants),
        stability_assessment: JSON.stringify(wizard.risks),
        recipe_json: JSON.stringify(wizard.recipe),
        version: 1,
        created_by: user!.$id,
      });
      await logAudit({
        orgId: org!.$id,
        userId: user!.$id,
        action: 'formulation.create',
        entityType: 'formulation',
        entityId: form.$id,
        details: wizard.formulationName,
      });
      router.push('/formulations');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save formulation';
      setError(message);
      setLoading(false);
    }
  };

  // ======================== AI Thinking Component ========================
  const AIThinking = ({ text }: { text: string }) => (
    <div className="ai-thinking">
      <div className="ai-thinking-brain">🧠</div>
      <div className="ai-thinking-dots">
        <span /><span /><span />
      </div>
      <div className="ai-thinking-text">{text}</div>
    </div>
  );

  // ======================== Render Steps ========================
  const renderStep = () => {
    if (wizard.isLoading) {
      const loadingTexts: Record<number, string> = {
        1: 'Analyzing active ingredient properties...',
        2: 'Evaluating formulation families...',
        3: 'Identifying optimal surfactant strategies...',
        4: 'Assessing stability risks...',
        5: 'Generating development recipe...',
      };
      return <AIThinking text={loadingTexts[wizard.currentStep] || 'Processing...'} />;
    }

    switch (wizard.currentStep) {
      // ===== STEP 1: Select Active Ingredient =====
      case 1:
        return (
          <div className="card animate-fadeInUp">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-6)' }}>
              Select Active Ingredient
            </h3>

            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label">Formulation Name <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="e.g. Chlorpyrifos 480 SC"
                value={wizard.formulationName}
                onChange={(e) => setWizard((prev) => ({ ...prev, formulationName: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label">Target AI Loading (% w/w) <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 48"
                value={wizard.targetLoading || ''}
                onChange={(e) => setWizard((prev) => ({ ...prev, targetLoading: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            {ingredients.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
                <p className="empty-state-description">
                  No active ingredients found. Add one first.
                </p>
                <button className="btn btn-primary" onClick={() => router.push('/ingredients/new')}>
                  Add Ingredient
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label className="form-label">Choose an Active Ingredient <span className="required">*</span></label>
                {ingredients.map((ing) => (
                  <div
                    key={ing.$id}
                    onClick={() => setWizard((prev) => ({ ...prev, activeIngredient: ing }))}
                    className="card card-hover"
                    style={{
                      padding: 'var(--space-4)',
                      cursor: 'pointer',
                      borderColor: wizard.activeIngredient?.$id === ing.$id ? 'var(--color-brand)' : undefined,
                      background: wizard.activeIngredient?.$id === ing.$id ? 'var(--color-brand-subtle)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ing.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          CAS: {ing.cas_number} · {ing.physical_form} · Log P: {ing.log_p} · Solubility: {ing.solubility_water} mg/L
                        </div>
                      </div>
                      {wizard.activeIngredient?.$id === ing.$id && (
                        <CheckCircle2 size={20} style={{ color: 'var(--color-brand)' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <button
                className="btn btn-primary btn-lg"
                disabled={!wizard.activeIngredient || !wizard.formulationName || !wizard.targetLoading}
                onClick={getRecommendations}
              >
                <Brain size={16} /> Analyze & Recommend <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      // ===== STEP 2: Formulation Type Recommendation =====
      case 2:
        return (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <Brain size={20} style={{ color: 'var(--color-brand)' }} />
                <h3 className="card-title">AI Formulation Recommendations</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Based on the properties of <strong>{wizard.activeIngredient?.name}</strong>, our AI recommends the following formulation types.
                Select one to proceed.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {wizard.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="card card-hover"
                  style={{
                    cursor: 'pointer',
                    borderColor: wizard.selectedType === rec.type ? 'var(--color-brand)' : undefined,
                    background: wizard.selectedType === rec.type ? 'var(--color-brand-subtle)' : undefined,
                  }}
                  onClick={() => setWizard((prev) => ({ ...prev, selectedType: rec.type as FormulationType }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-brand-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
                        color: 'var(--color-brand)',
                      }}>
                        {rec.type}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {FORMULATION_TYPE_LABELS[rec.type] || rec.type}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          Typical loading: {rec.typical_loading_range}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div className="confidence-bar" style={{ width: 160 }}>
                        <div className="confidence-bar-track">
                          <div
                            className="confidence-bar-fill"
                            style={{
                              width: `${rec.score}%`,
                              background: rec.score >= 80 ? 'var(--color-success)' :
                                rec.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                            }}
                          />
                        </div>
                        <span className="confidence-bar-value">{rec.score}%</span>
                      </div>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRec(expandedRec === index ? null : index);
                        }}
                      >
                        {expandedRec === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {expandedRec === index && (
                    <div style={{
                      marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--color-border-card)',
                    }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                        {rec.rationale}
                      </p>
                      <div className="form-row">
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
                            ✓ Advantages
                          </div>
                          <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {rec.advantages.map((adv, i) => (
                              <li key={i} style={{ marginBottom: 4 }}>• {adv}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
                            ⚠ Limitations
                          </div>
                          <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {rec.limitations.map((lim, i) => (
                              <li key={i} style={{ marginBottom: 4 }}>• {lim}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={!wizard.selectedType}
                onClick={getSurfactants}
              >
                <Sparkles size={16} /> Get Surfactant Strategy <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      // ===== STEP 3: Surfactant & Additive Strategy =====
      case 3:
        return (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <Sparkles size={20} style={{ color: '#f59e0b' }} />
                <h3 className="card-title">Surfactant & Additive Strategy</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Recommended surfactants and additives for your <strong>{wizard.selectedType}</strong> formulation of <strong>{wizard.activeIngredient?.name}</strong>.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {wizard.surfactants.map((surf, index) => (
                <div key={index} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, #f59e0b, #f97316)`,
                  }} />
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                    {surf.category}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
                    {surf.chemical_class}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {surf.function}
                  </div>

                  <div style={{ marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>Trade Names:</span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 4 }}>
                      {surf.trade_names.map((name, i) => (
                        <span key={i} className="badge badge-info">{name}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-card)',
                    marginTop: 'var(--space-3)',
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      Level: {surf.recommended_level}
                    </span>
                    {surf.hlb_range && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        HLB: {surf.hlb_range}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={getStabilityAssessment}>
                <Shield size={16} /> Assess Stability <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      // ===== STEP 4: Stability & Risk Assessment =====
      case 4:
        return (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <Shield size={20} style={{ color: '#ef4444' }} />
                <h3 className="card-title">Stability & Risk Assessment</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Potential stability risks identified for your formulation. Address high-severity risks before proceeding to lab trials.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {wizard.risks.map((risk, index) => {
                const severityColors: Record<string, string> = {
                  low: 'var(--color-success)',
                  medium: 'var(--color-warning)',
                  high: 'var(--color-danger)',
                  critical: 'var(--color-critical)',
                };
                const color = severityColors[risk.severity] || 'var(--color-muted)';

                return (
                  <div key={index} className="card">
                    <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--space-4)' }}>
                      <div className={`risk-indicator risk-${risk.severity}`}>
                        {risk.severity.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                          {risk.risk_type}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                          {risk.description}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
                          Probability: {risk.probability}
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color, marginBottom: 'var(--space-1)' }}>
                            Mitigation Strategies:
                          </div>
                          <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {risk.mitigation.map((m, i) => (
                              <li key={i} style={{ marginBottom: 2 }}>• {m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={generateRecipe}>
                <FlaskConical size={16} /> Generate Recipe <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      // ===== STEP 5: Recipe Generation =====
      case 5:
        return (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <FlaskConical size={20} style={{ color: '#3b82f6' }} />
                <h3 className="card-title">Development Recipe</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                AI-generated recipe for <strong>{wizard.formulationName}</strong>. Review and adjust as needed before saving.
              </p>
            </div>

            {/* Recipe Table */}
            {wizard.recipe && (
              <>
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ingredient</th>
                        <th>Role</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wizard.recipe.ingredients.map((ing, index) => (
                        <tr key={index}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                            {index + 1}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {ing.name}
                          </td>
                          <td>
                            <span className="badge badge-brand">
                              {INGREDIENT_ROLE_LABELS[ing.role] || ing.role}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {ing.quantity}
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>
                            {UNIT_LABELS[ing.unit] || ing.unit}
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                            {ing.purpose}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Processing Notes */}
                {wizard.recipe.processing_notes.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
                      Processing Notes
                    </h4>
                    <ol style={{ paddingLeft: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      {wizard.recipe.processing_notes.map((note, i) => (
                        <li key={i} style={{ marginBottom: 'var(--space-2)', listStyleType: 'decimal' }}>{note}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Expected Properties */}
                {wizard.recipe.expected_properties.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
                      Expected Properties
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                      {wizard.recipe.expected_properties.map((prop, i) => (
                        <div key={i} style={{
                          padding: 'var(--space-3)',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                        }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                            {prop.property}
                          </div>
                          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                            {prop.value} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>{prop.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(4)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(6)}>
                Review & Save <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      // ===== STEP 6: Review & Save =====
      case 6:
        return (
          <div className="animate-fadeInUp">
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Review & Save</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
                Review your formulation before saving. You can always edit it later.
              </p>

              {/* Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Name</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{wizard.formulationName}</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Active Ingredient</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{wizard.activeIngredient?.name}</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Type</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-brand)' }}>
                    {wizard.selectedType} — {FORMULATION_TYPE_LABELS[wizard.selectedType || '']}
                  </div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>AI Loading</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{wizard.targetLoading}% w/w</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Surfactants</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{wizard.surfactants.length} recommended</div>
                </div>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Stability Risks</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {wizard.risks.filter(r => r.severity === 'high' || r.severity === 'critical').length} high-risk,{' '}
                    {wizard.risks.length} total
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(5)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={saveFormulation}>
                <Save size={16} /> Save Formulation
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="page-title">New Formulation</h1>
          <p className="page-subtitle">AI-guided formulation wizard</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="wizard-stepper">
        {WIZARD_STEPS.map((step) => (
          <div
            key={step.id}
            className={`wizard-step ${
              wizard.currentStep === step.id ? 'active' :
              wizard.currentStep > step.id ? 'completed' : ''
            }`}
          >
            <div className="wizard-step-dot">
              {wizard.currentStep > step.id ? <CheckCircle2 size={16} /> : step.id}
            </div>
            <span className="wizard-step-label">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {wizard.error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-4)', background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)', color: 'var(--color-danger)',
          fontSize: 'var(--text-sm)',
        }}>
          <AlertCircle size={18} /> {wizard.error}
        </div>
      )}

      {wizard.currentStep >= 2 && !wizard.isLoading && <AiSourceBanner source={aiSource} />}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
