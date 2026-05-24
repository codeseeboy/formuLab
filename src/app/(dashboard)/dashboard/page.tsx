'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_CONFIG, FORMULATION_TYPE_LABELS } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import * as formulationService from '@/lib/services/formulation.service';
import type { Formulation, ActiveIngredient } from '@/lib/types';
import {
  FlaskConical,
  Atom,
  CheckCircle2,
  TrendingUp,
  Plus,
  Bug,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const { org } = useAuth();
  const [stats, setStats] = useState({
    totalFormulations: 0,
    activeProjects: 0,
    approvedRecipes: 0,
    totalIngredients: 0,
  });
  const [recentFormulations, setRecentFormulations] = useState<Formulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (org?.$id) {
      loadDashboard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const loadDashboard = async () => {
    try {
      const [dashStats, formulations] = await Promise.all([
        formulationService.getDashboardStats(org!.$id),
        formulationService.listFormulations(org!.$id, {}, 5),
      ]);
      setStats(dashStats);
      setRecentFormulations(formulations.items);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      icon: <FlaskConical size={22} />,
      label: 'Total Formulations',
      value: stats.totalFormulations,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
    },
    {
      icon: <Activity size={22} />,
      label: 'Active Projects',
      value: stats.activeProjects,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
    {
      icon: <CheckCircle2 size={22} />,
      label: 'Approved Recipes',
      value: stats.approvedRecipes,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      icon: <Atom size={22} />,
      label: 'Active Ingredients',
      value: stats.totalIngredients,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.15)',
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your formulation workspace</p>
        </div>
        <Link href="/formulations/new" className="btn btn-primary">
          <Plus size={16} /> New Formulation
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div
              className="stat-card-icon"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-card-value">
              {isLoading ? (
                <div className="skeleton" style={{ width: 60, height: 36 }} />
              ) : (
                stat.value
              )}
            </div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="content-grid-2">
        {/* Recent Formulations */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Formulations</h3>
              <p className="card-subtitle">Latest formulation projects</p>
            </div>
            <Link href="/formulations" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 56 }} />
              ))}
            </div>
          ) : recentFormulations.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <div className="empty-state-icon">
                <FlaskConical size={32} />
              </div>
              <p className="empty-state-title">No formulations yet</p>
              <p className="empty-state-description">
                Create your first formulation to get started with AI-powered recommendations.
              </p>
              <Link href="/formulations/new" className="btn btn-primary">
                <Plus size={16} /> Create Formulation
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recentFormulations.map((formulation) => {
                const statusConfig = STATUS_CONFIG[formulation.status];
                return (
                  <Link
                    key={formulation.$id}
                    href={`/formulations/${formulation.$id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background var(--transition-fast)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                    className="card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-brand-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-brand)',
                        fontWeight: 700,
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {formulation.formulation_type || '—'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {formulation.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          {FORMULATION_TYPE_LABELS[formulation.formulation_type] || formulation.formulation_type} · {timeAgo(formulation.updated_at)}
                        </div>
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: `${statusConfig?.color}20`,
                        color: statusConfig?.color,
                        borderColor: `${statusConfig?.color}40`,
                      }}
                    >
                      {statusConfig?.label || formulation.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common tasks at your fingertips</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link href="/formulations/new" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand)',
                  }}>
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      New Formulation Wizard
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      AI-guided formulation from scratch
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Link>

            <Link href="/ingredients/new" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                  }}>
                    <Atom size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      Add Active Ingredient
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      Register a new AI with properties
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Link>

            <Link href="/troubleshoot" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(236, 72, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ec4899',
                  }}>
                    <Bug size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      Troubleshoot an Issue
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      AI-powered diagnosis & remedies
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Link>

            <Link href="/reports" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8b5cf6',
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      Generate Report
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      Export PDF for any formulation
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Link>
          </div>

          {/* Platform Stats */}
          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-tertiary)',
              marginBottom: 'var(--space-2)',
            }}>
              <TrendingUp size={14} /> Platform Status
            </div>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}>
              FormuLab AI is ready. All modules operational.
              <span style={{ color: 'var(--color-success)', marginLeft: 'var(--space-2)' }}>●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
