// ============================================================
// FormuLab — Knowledge Base Types
// ============================================================

export type KnowledgeSourceType =
  | 'ingredient'
  | 'surfactant'
  | 'formulation'
  | 'troubleshoot'
  | 'reference'
  | 'vocabulary';

export interface KnowledgeIngredient {
  id: string;
  name: string;
  aliases: string[];
  iupac_name: string;
  cas_number: string;
  molecular_weight: number;
  melting_point: number;
  solubility_water: number;
  log_p: number;
  vapor_pressure: number;
  pka: number;
  technical_purity: number;
  physical_form: 'solid' | 'liquid' | 'waxy';
  particle_size_d50: number;
  hazard_class: string;
  target_pest_category: string;
  notes: string;
  /** Curated from literature / handbooks — not live Wikipedia */
  references: string[];
  tags: string[];
}

export interface KnowledgeSurfactant {
  id: string;
  trade_name: string;
  chemical_class: string;
  function: string;
  hlb_range?: string;
  typical_level: string;
  formulation_types: string[];
  notes: string;
  tags: string[];
}

export interface KnowledgeFormulationType {
  code: string;
  name: string;
  description: string;
  best_for: string[];
  advantages: string[];
  limitations: string[];
  typical_ais: string[];
  processing_notes: string[];
  tags: string[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  source_type: 'research' | 'handbook' | 'regulatory' | 'academic' | 'industry';
  summary: string;
  content: string;
  tags: string[];
}

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  subtitle?: string;
  snippet: string;
  tags: string[];
  payload: unknown;
  score?: number;
}
