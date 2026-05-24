'use client';

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, BookOpen } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
}

interface SmartComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  onSelectOption?: (option: ComboboxOption) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  id?: string;
  disabled?: boolean;
}

type DropdownRect = { top: number; left: number; width: number };

export function SmartCombobox({
  label,
  value,
  onChange,
  options,
  onSelectOption,
  placeholder = 'Type to search…',
  required,
  hint,
  id: idProp,
  disabled,
}: SmartComboboxProps) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => {
    const q = value.toLowerCase().trim();
    if (!q) return true;
    return (
      o.label.toLowerCase().includes(q) ||
      o.sublabel?.toLowerCase().includes(q) ||
      o.hint?.toLowerCase().includes(q)
    );
  });

  const updateDropdownPosition = useCallback(() => {
    const el = inputWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDropdownRect({
      top: r.bottom + 6,
      left: r.left,
      width: r.width,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [value, options.length]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        const portal = document.getElementById(`combobox-portal-${inputId}`);
        if (portal?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [inputId]);

  const pick = (opt: ComboboxOption) => {
    onChange(opt.label);
    onSelectOption?.(opt);
    setOpen(false);
  };

  const dropdownStyle: React.CSSProperties | undefined = dropdownRect
    ? {
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
      }
    : undefined;

  const portalId = `combobox-portal-${inputId}`;

  const dropdownPanel =
    open && dropdownRect && mounted
      ? createPortal(
          <div id={portalId}>
            {filtered.length > 0 ? (
              <ul className="smart-combobox-list" role="listbox" style={dropdownStyle}>
                {filtered.slice(0, 12).map((opt, i) => (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={i === highlight}
                    className={`smart-combobox-option${i === highlight ? ' active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(opt);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    <div className="smart-combobox-option-label">{opt.label}</div>
                    {opt.sublabel && <div className="smart-combobox-option-sub">{opt.sublabel}</div>}
                    {opt.hint && (
                      <div className="smart-combobox-option-hint">
                        <BookOpen size={10} /> {opt.hint}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : value ? (
              <div className="smart-combobox-empty" style={dropdownStyle}>
                No matches — you can still enter a custom value.
              </div>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className={`form-group smart-combobox${open ? ' smart-combobox-open' : ''}`}
      ref={wrapRef}
    >
      <label className="form-label" htmlFor={inputId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="smart-combobox-input-wrap" ref={inputWrapRef}>
        <Search size={16} className="smart-combobox-icon" aria-hidden />
        <input
          id={inputId}
          className="form-input smart-combobox-input"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            updateDropdownPosition();
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) setOpen(true);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
            if (e.key === 'Enter' && filtered[highlight]) {
              e.preventDefault();
              pick(filtered[highlight]);
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <button
          type="button"
          className="smart-combobox-toggle"
          onClick={() => {
            setOpen((o) => {
              const next = !o;
              if (next) updateDropdownPosition();
              return next;
            });
          }}
          tabIndex={-1}
          aria-label="Toggle suggestions"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
      {dropdownPanel}
    </div>
  );
}
