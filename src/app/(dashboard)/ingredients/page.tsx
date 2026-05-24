'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PEST_CATEGORY_LABELS, PHYSICAL_FORM_LABELS } from '@/lib/constants';
import * as formulationService from '@/lib/services/formulation.service';
import type { ActiveIngredient } from '@/lib/types';
import { Plus, Search, Atom, Trash2, Edit } from 'lucide-react';

export default function IngredientsPage() {
  const { org } = useAuth();
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (org?.$id) loadIngredients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, search]);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const result = await formulationService.listActiveIngredients(org!.$id, search || undefined);
      setIngredients(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      await formulationService.deleteActiveIngredient(id);
      loadIngredients();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Ingredients</h1>
          <p className="page-subtitle">{total} ingredient{total !== 1 ? 's' : ''} in your library</p>
        </div>
        <Link href="/ingredients/new" className="btn btn-primary">
          <Plus size={16} /> Add Ingredient
        </Link>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search by name, CAS number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 56 }} />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Atom size={36} />
          </div>
          <h3 className="empty-state-title">No active ingredients yet</h3>
          <p className="empty-state-description">
            Add your first active ingredient to start building AI-powered formulations.
          </p>
          <Link href="/ingredients/new" className="btn btn-primary">
            <Plus size={16} /> Add Your First Ingredient
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <p className="table-scroll-hint" style={{ padding: '12px 16px 0' }}>Swipe left to see more columns →</p>
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>CAS Number</th>
                <th>Category</th>
                <th>Mol. Weight</th>
                <th>Solubility</th>
                <th>Log P</th>
                <th>Form</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.$id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {ingredient.name}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {ingredient.cas_number}
                  </td>
                  <td>
                    <span className="badge badge-brand">
                      {PEST_CATEGORY_LABELS[ingredient.target_pest_category] || ingredient.target_pest_category}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {ingredient.molecular_weight} g/mol
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {ingredient.solubility_water} mg/L
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {ingredient.log_p}
                  </td>
                  <td>
                    {PHYSICAL_FORM_LABELS[ingredient.physical_form] || ingredient.physical_form}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Link
                        href={`/ingredients/new?edit=${ingredient.$id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => handleDelete(ingredient.$id)}
                        title="Delete"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
