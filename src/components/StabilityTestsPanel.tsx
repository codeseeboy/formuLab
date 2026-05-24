'use client';

import { useState, useEffect, useCallback } from 'react';
import * as formulationService from '@/lib/services/formulation.service';
import { STABILITY_TEST_LABELS } from '@/lib/constants';
import type { StabilityTest, StabilityTestType, StabilityResult } from '@/lib/types';
import { Plus, Trash2, FlaskConical } from 'lucide-react';

interface Props {
  formulationId: string;
  userId: string;
}

export function StabilityTestsPanel({ formulationId, userId }: Props) {
  const [tests, setTests] = useState<StabilityTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    test_type: 'accelerated_54C' as StabilityTestType,
    duration_days: 14,
    result_status: 'pass' as StabilityResult,
    observations: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await formulationService.listStabilityTests(formulationId);
      setTests(list);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [formulationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await formulationService.addStabilityTest({
        formulation_id: formulationId,
        test_type: form.test_type,
        duration_days: form.duration_days,
        result_status: form.result_status,
        observations: form.observations,
        data_json: '{}',
        tested_by: userId,
        tested_at: new Date().toISOString(),
      });
      setForm((f) => ({ ...f, observations: '' }));
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stability test record?')) return;
    await formulationService.deleteStabilityTest(id);
    await load();
  };

  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      <h4 className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FlaskConical size={16} /> Lab stability tests
      </h4>
      <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 16 }}>
        Record jar tests, accelerated storage, and other lab results (separate from AI risk assessment above).
      </p>

      <form onSubmit={handleAdd} className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Test type</label>
            <select
              className="form-select"
              value={form.test_type}
              onChange={(e) => setForm({ ...form, test_type: e.target.value as StabilityTestType })}
            >
              {Object.entries(STABILITY_TEST_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (days)</label>
            <input
              type="number"
              className="form-input"
              value={form.duration_days}
              onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Result</label>
            <select
              className="form-select"
              value={form.result_status}
              onChange={(e) => setForm({ ...form, result_status: e.target.value as StabilityResult })}
            >
              <option value="pass">Pass</option>
              <option value="marginal">Marginal</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Observations</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={form.observations}
            onChange={(e) => setForm({ ...form, observations: e.target.value })}
            placeholder="Viscosity, phase separation, pH drift…"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          <Plus size={14} /> {saving ? 'Saving…' : 'Add test record'}
        </button>
      </form>

      {loading ? (
        <div className="skeleton" style={{ height: 60 }} />
      ) : tests.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>No lab tests logged yet.</p>
      ) : (
        tests.map((t) => (
          <div key={t.$id} className="card" style={{ marginBottom: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{STABILITY_TEST_LABELS[t.test_type] || t.test_type}</strong>
                <span className={`badge badge-${t.result_status === 'pass' ? 'success' : t.result_status === 'fail' ? 'danger' : 'warning'}`} style={{ marginLeft: 8 }}>
                  {t.result_status}
                </span>
                <div className="text-muted" style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>
                  {t.duration_days} days · {new Date(t.tested_at).toLocaleDateString()}
                </div>
                {t.observations && <p style={{ fontSize: 'var(--text-sm)', marginTop: 8 }}>{t.observations}</p>}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.$id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
