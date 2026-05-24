'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_CONFIG, FORMULATION_TYPE_LABELS } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import * as formulationService from '@/lib/services/formulation.service';
import type { Formulation, FormulationStatus } from '@/lib/types';
import { Plus, Search, FlaskConical, Filter } from 'lucide-react';

export default function FormulationsPage() {
  const { org } = useAuth();
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormulationStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (org?.$id) loadFormulations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, search, statusFilter]);

  const loadFormulations = async () => {
    setIsLoading(true);
    try {
      const result = await formulationService.listFormulations(org!.$id, {
        status: statusFilter as FormulationStatus || undefined,
        search: search || undefined,
      });
      setFormulations(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load formulations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusFilters = ['', 'draft', 'in_review', 'approved', 'archived'];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Formulations</h1>
          <p className="page-subtitle">{total} formulation{total !== 1 ? 's' : ''} in your library</p>
        </div>
        <Link href="/formulations/new" className="btn btn-primary">
          <Plus size={16} /> New Formulation
        </Link>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search formulations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          {statusFilters.map((status) => (
            <button
              key={status || 'all'}
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status as FormulationStatus | '')}
            >
              {status ? STATUS_CONFIG[status]?.label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="content-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : formulations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FlaskConical size={36} />
          </div>
          <h3 className="empty-state-title">No formulations yet</h3>
          <p className="empty-state-description">
            Start your first AI-powered formulation to see it here.
          </p>
          <Link href="/formulations/new" className="btn btn-primary">
            <Plus size={16} /> Create Formulation
          </Link>
        </div>
      ) : (
        <div className="content-grid">
          {formulations.map((formulation) => {
            const statusConfig = STATUS_CONFIG[formulation.status];
            return (
              <Link
                key={formulation.$id}
                href={`/formulations/${formulation.$id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card card-hover" style={{ cursor: 'pointer', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-brand-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-brand)',
                      fontWeight: 800, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
                    }}>
                      {formulation.formulation_type || '?'}
                    </div>
                    <span className="badge" style={{
                      background: `${statusConfig?.color}20`,
                      color: statusConfig?.color,
                      borderColor: `${statusConfig?.color}40`,
                    }}>
                      {statusConfig?.label || formulation.status}
                    </span>
                  </div>

                  <h4 style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                    {formulation.name}
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                    {FORMULATION_TYPE_LABELS[formulation.formulation_type] || 'Formulation'}
                  </p>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-card)',
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      AI Loading: {formulation.target_ai_loading}%
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {timeAgo(formulation.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
