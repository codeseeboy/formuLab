'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import * as formulationService from '@/lib/services/formulation.service';
import { logAudit } from '@/lib/services/audit.service';
import type { PhysicalForm, PestCategory } from '@/lib/types';
import type { KnowledgeIngredient } from '@/lib/knowledge/types';
import { KNOWLEDGE_INGREDIENTS, getHazardClassSuggestions } from '@/lib/knowledge';
import { SmartCombobox } from '@/components/SmartCombobox';
import { Save, ArrowLeft, Atom, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

export default function NewIngredientPage() {
  const { user, org } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    iupac_name: '',
    cas_number: '',
    molecular_weight: '',
    melting_point: '',
    solubility_water: '',
    log_p: '',
    vapor_pressure: '',
    pka: '',
    technical_purity: '',
    physical_form: 'solid' as PhysicalForm,
    particle_size_d50: '',
    hazard_class: '',
    target_pest_category: 'insecticide' as PestCategory,
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const ingredientOptions = useMemo(() => {
    return KNOWLEDGE_INGREDIENTS.map((ing) => ({
      id: ing.id,
      label: ing.name,
      sublabel: `CAS ${ing.cas_number} · ${ing.target_pest_category}`,
      hint: ing.aliases[0],
    }));
  }, []);

  const hazardOptions = useMemo(() => {
    return getHazardClassSuggestions(formData.hazard_class, 20).map((h) => ({
      id: h.id,
      label: h.label,
    }));
  }, [formData.hazard_class]);

  const applyKnowledgeIngredient = (ing: KnowledgeIngredient) => {
    setFormData({
      name: ing.name,
      iupac_name: ing.iupac_name,
      cas_number: ing.cas_number,
      molecular_weight: String(ing.molecular_weight),
      melting_point: String(ing.melting_point),
      solubility_water: String(ing.solubility_water),
      log_p: String(ing.log_p),
      vapor_pressure: String(ing.vapor_pressure),
      pka: String(ing.pka),
      technical_purity: String(ing.technical_purity),
      physical_form: ing.physical_form as PhysicalForm,
      particle_size_d50: String(ing.particle_size_d50),
      hazard_class: ing.hazard_class,
      target_pest_category: ing.target_pest_category as PestCategory,
      notes: `${ing.notes}\n\nRefs: ${ing.references.join('; ')}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const created = await formulationService.createActiveIngredient({
        org_id: org!.$id,
        name: formData.name,
        iupac_name: formData.iupac_name,
        cas_number: formData.cas_number,
        molecular_weight: parseFloat(formData.molecular_weight) || 0,
        melting_point: parseFloat(formData.melting_point) || 0,
        solubility_water: parseFloat(formData.solubility_water) || 0,
        log_p: parseFloat(formData.log_p) || 0,
        vapor_pressure: parseFloat(formData.vapor_pressure) || 0,
        pka: parseFloat(formData.pka) || 0,
        technical_purity: parseFloat(formData.technical_purity) || 0,
        physical_form: formData.physical_form,
        particle_size_d50: parseFloat(formData.particle_size_d50) || 0,
        hazard_class: formData.hazard_class,
        target_pest_category: formData.target_pest_category,
        notes: formData.notes,
        created_by: user!.$id,
      });

      await logAudit({
        orgId: org!.$id,
        userId: user!.$id,
        action: 'ingredient.create',
        entityType: 'active_ingredient',
        entityId: created.$id,
        details: formData.name,
      });

      setSuccess(true);
      setTimeout(() => router.push('/ingredients'), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ingredient. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-2)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="page-title">Add Active Ingredient</h1>
          <p className="page-subtitle">Register the physico-chemical properties of your active ingredient</p>
        </div>
      </div>

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-4)', background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)', color: 'var(--color-success)',
        }}>
          <CheckCircle2 size={18} /> Ingredient created successfully! Redirecting...
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-4)', background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)', color: 'var(--color-danger)',
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identity Section */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Atom size={18} />
              </div>
              <h3 className="card-title">Identity</h3>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
            background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)', color: 'var(--color-brand)',
          }}>
            <BookOpen size={16} />
            Start typing a name — pick from the knowledge library to auto-fill all properties
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-row">
              <SmartCombobox
                id="name"
                label="Common Name"
                required
                value={formData.name}
                onChange={(v) => updateField('name', v)}
                options={ingredientOptions}
                onSelectOption={(opt) => {
                  const ing = KNOWLEDGE_INGREDIENTS.find((i) => i.id === opt.id);
                  if (ing) applyKnowledgeIngredient(ing);
                }}
                placeholder="e.g. Chlorpyrifos, Glyphosate…"
              />
              <SmartCombobox
                id="cas_number"
                label="CAS Number"
                required
                value={formData.cas_number}
                onChange={(v) => updateField('cas_number', v)}
                options={ingredientOptions.map((o) => ({
                  ...o,
                  label: KNOWLEDGE_INGREDIENTS.find((i) => i.id === o.id)?.cas_number ?? o.label,
                  sublabel: KNOWLEDGE_INGREDIENTS.find((i) => i.id === o.id)?.name,
                }))}
                onSelectOption={(opt) => {
                  const ing = KNOWLEDGE_INGREDIENTS.find((i) => i.id === opt.id);
                  if (ing) applyKnowledgeIngredient(ing);
                }}
                placeholder="e.g. 2921-88-2"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="iupac_name">IUPAC Name</label>
              <input id="iupac_name" className="form-input" placeholder="Full IUPAC nomenclature" value={formData.iupac_name} onChange={(e) => updateField('iupac_name', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="target_pest_category">Category <span className="required">*</span></label>
                <select id="target_pest_category" className="form-select" value={formData.target_pest_category} onChange={(e) => updateField('target_pest_category', e.target.value)}>
                  <option value="insecticide">Insecticide</option>
                  <option value="herbicide">Herbicide</option>
                  <option value="fungicide">Fungicide</option>
                  <option value="acaricide">Acaricide</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <SmartCombobox
                id="hazard_class"
                label="GHS Hazard Class"
                value={formData.hazard_class}
                onChange={(v) => updateField('hazard_class', v)}
                options={hazardOptions}
                placeholder="e.g. Acute Tox. 3"
              />
            </div>
          </div>
        </div>

        {/* Physical Properties */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Physical Properties</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="physical_form">Physical Form <span className="required">*</span></label>
                <select id="physical_form" className="form-select" value={formData.physical_form} onChange={(e) => updateField('physical_form', e.target.value)}>
                  <option value="solid">Solid</option>
                  <option value="liquid">Liquid</option>
                  <option value="waxy">Waxy / Semi-solid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="molecular_weight">Molecular Weight (g/mol) <span className="required">*</span></label>
                <input id="molecular_weight" type="number" step="0.01" className="form-input" placeholder="e.g. 350.59" value={formData.molecular_weight} onChange={(e) => updateField('molecular_weight', e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="melting_point">Melting Point (°C) <span className="required">*</span></label>
                <input id="melting_point" type="number" step="0.1" className="form-input" placeholder="e.g. 42.0" value={formData.melting_point} onChange={(e) => updateField('melting_point', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="particle_size_d50">Particle Size D50 (μm)</label>
                <input id="particle_size_d50" type="number" step="0.01" className="form-input" placeholder="e.g. 5.0 (for solids)" value={formData.particle_size_d50} onChange={(e) => updateField('particle_size_d50', e.target.value)} />
                <span className="form-hint">Median particle diameter for solid AIs</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="technical_purity">Technical Purity (% w/w) <span className="required">*</span></label>
              <input id="technical_purity" type="number" step="0.1" className="form-input" placeholder="e.g. 96.5" value={formData.technical_purity} onChange={(e) => updateField('technical_purity', e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Chemical Properties */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Chemical Properties</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="solubility_water">Water Solubility (mg/L at 20°C) <span className="required">*</span></label>
                <input id="solubility_water" type="number" step="0.001" className="form-input" placeholder="e.g. 1.4" value={formData.solubility_water} onChange={(e) => updateField('solubility_water', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="log_p">Log P (octanol-water) <span className="required">*</span></label>
                <input id="log_p" type="number" step="0.01" className="form-input" placeholder="e.g. 4.7" value={formData.log_p} onChange={(e) => updateField('log_p', e.target.value)} required />
                <span className="form-hint">Partition coefficient — higher = more hydrophobic</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="vapor_pressure">Vapor Pressure (mPa at 25°C)</label>
                <input id="vapor_pressure" type="number" step="0.0001" className="form-input" placeholder="e.g. 2.5" value={formData.vapor_pressure} onChange={(e) => updateField('vapor_pressure', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pka">pKa</label>
                <input id="pka" type="number" step="0.01" className="form-input" placeholder="e.g. 3.5" value={formData.pka} onChange={(e) => updateField('pka', e.target.value)} />
                <span className="form-hint">Acid dissociation constant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Notes</h3>
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="Any additional notes about this active ingredient..."
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</>
            ) : (
              <><Save size={16} /> Save Ingredient</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
