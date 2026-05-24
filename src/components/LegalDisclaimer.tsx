'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const STORAGE_KEY = 'formulab_disclaimer_ack';

export function LegalDisclaimer() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  if (!visible) return null;

  return (
    <div className="legal-disclaimer" role="alert">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Decision support only.</strong>{' '}
          FormuLab assists R&D; it does not replace lab validation, regulatory review, or qualified scientist sign-off.
          Verify all AI outputs against your SOPs and uploaded sources before use in production.
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1');
            setVisible(false);
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
