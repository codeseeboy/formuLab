// ============================================================
// FormuLab — Knowledge Base Search & Index
// ============================================================

import { KNOWLEDGE_INGREDIENTS } from './seed/ingredients';
import { KNOWLEDGE_SURFACTANTS } from './seed/surfactants';
import { KNOWLEDGE_FORMULATION_TYPES } from './seed/formulation-types';
import { KNOWLEDGE_ARTICLES, KNOWLEDGE_VOCABULARY } from './seed/articles';
import type {
  KnowledgeEntry,
  KnowledgeIngredient,
  KnowledgeArticle,
  KnowledgeFormulationType,
} from './types';
import type { ActiveIngredient, FormulationRecommendation, FormulationType, TroubleshootDiagnosis } from '../types';

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function scoreText(query: string, ...fields: (string | undefined)[]): number {
  const q = normalize(query);
  if (!q) return 0;
  let score = 0;
  for (const field of fields) {
    if (!field) continue;
    const f = normalize(field);
    if (f === q) score += 100;
    else if (f.startsWith(q)) score += 50;
    else if (f.includes(q)) score += 25;
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      if (f.includes(t)) score += 10;
    }
  }
  return score;
}

function buildIndex(): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];

  for (const ing of KNOWLEDGE_INGREDIENTS) {
    entries.push({
      id: ing.id,
      type: 'ingredient',
      title: ing.name,
      subtitle: ing.cas_number,
      snippet: `${ing.target_pest_category} · log P ${ing.log_p} · ${ing.notes.slice(0, 80)}…`,
      tags: ing.tags,
      payload: ing,
    });
  }

  for (const s of KNOWLEDGE_SURFACTANTS) {
    entries.push({
      id: s.id,
      type: 'surfactant',
      title: s.trade_name,
      subtitle: s.chemical_class,
      snippet: `${s.function} · ${s.typical_level} · ${s.notes}`,
      tags: s.tags,
      payload: s,
    });
  }

  for (const ft of KNOWLEDGE_FORMULATION_TYPES) {
    entries.push({
      id: ft.code,
      type: 'formulation',
      title: `${ft.code} — ${ft.name}`,
      subtitle: ft.description.slice(0, 60),
      snippet: ft.best_for.join(', '),
      tags: ft.tags,
      payload: ft,
    });
  }

  for (const a of KNOWLEDGE_ARTICLES) {
    entries.push({
      id: a.id,
      type: 'troubleshoot',
      title: a.title,
      subtitle: a.source_type,
      snippet: a.summary,
      tags: a.tags,
      payload: a,
    });
  }

  for (const h of KNOWLEDGE_VOCABULARY.hazard_classes) {
    entries.push({
      id: `hazard-${h}`,
      type: 'vocabulary',
      title: h,
      snippet: 'GHS hazard classification',
      tags: ['ghs', 'hazard'],
      payload: h,
    });
  }

  return entries;
}

const INDEX = buildIndex();

export function getKnowledgeStats() {
  return {
    ingredients: KNOWLEDGE_INGREDIENTS.length,
    surfactants: KNOWLEDGE_SURFACTANTS.length,
    formulationTypes: KNOWLEDGE_FORMULATION_TYPES.length,
    articles: KNOWLEDGE_ARTICLES.length,
    vocabulary: Object.values(KNOWLEDGE_VOCABULARY).flat().length,
    total: INDEX.length,
  };
}

export function searchKnowledge(query: string, limit = 20, type?: KnowledgeEntry['type']): KnowledgeEntry[] {
  if (!query.trim()) return INDEX.filter((e) => !type || e.type === type).slice(0, limit);

  const scored = INDEX.map((entry) => {
    const extra =
      entry.type === 'ingredient'
        ? [(entry.payload as KnowledgeIngredient).aliases.join(' ')]
        : [];
    const s = scoreText(query, entry.title, entry.subtitle, entry.snippet, entry.tags.join(' '), ...extra);
    return { ...entry, score: s };
  })
    .filter((e) => e.score > 0)
    .filter((e) => !type || e.type === type)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return scored.slice(0, limit);
}

export function getIngredientById(id: string): KnowledgeIngredient | undefined {
  return KNOWLEDGE_INGREDIENTS.find((i) => i.id === id);
}

export function getIngredientSuggestions(query: string, limit = 12) {
  return searchKnowledge(query, limit, 'ingredient');
}

export function getSurfactantSuggestions(query: string, limit = 12) {
  return searchKnowledge(query, limit, 'surfactant');
}

export function getFormulationTypeSuggestions(query: string, limit = 12) {
  return searchKnowledge(query, limit, 'formulation');
}

export function getHazardClassSuggestions(query: string, limit = 12) {
  const q = normalize(query);
  return KNOWLEDGE_VOCABULARY.hazard_classes
    .filter((h) => !q || normalize(h).includes(q))
    .slice(0, limit)
    .map((h) => ({ id: h, label: h, value: h }));
}

export function getFormulationCodeOptions(query: string, limit = 12) {
  const q = normalize(query);
  return KNOWLEDGE_VOCABULARY.formulation_codes
    .filter((c) => !q || normalize(c).includes(q))
    .slice(0, limit)
    .map((c) => ({ id: c, label: c, value: c }));
}

/** Rule-based formulation recommendations when LLM is offline */
export function recommendFormulationTypesOffline(ingredient: Partial<ActiveIngredient>): FormulationRecommendation[] {
  const sol = ingredient.solubility_water ?? 100;
  const logP = ingredient.log_p ?? 2;
  const form = ingredient.physical_form ?? 'solid';

  const scores: { type: FormulationType; score: number; rationale: string; advantages: string[]; limitations: string[]; range: string }[] = [];

  if (sol > 1000) {
    scores.push({ type: 'SL', score: 88, rationale: 'High water solubility favors soluble liquid.', advantages: ['Easy tank mix', 'No suspension'], limitations: ['Hydrolysis risk'], range: '5-40% w/w' });
  }
  if (logP > 3 && form !== 'solid') {
    scores.push({ type: 'EC', score: 85, rationale: 'High log P liquid AI suits EC.', advantages: ['Proven penetration'], limitations: ['Solvent VOC'], range: '2-25% w/w' });
  }
  if (logP > 2.5) {
    scores.push({ type: 'EC', score: 78, rationale: 'Hydrophobic AI — oil phase delivery.', advantages: ['Stable oil solution'], limitations: ['Emulsion quality critical'], range: '2-25% w/w' });
    scores.push({ type: 'EW', score: 72, rationale: 'Lower solvent vs EC for hydrophobic AI.', advantages: ['Reduced VOC'], limitations: ['Creaming risk'], range: '2-20% w/w' });
  }
  if (form === 'solid' && sol < 500) {
    scores.push({ type: 'SC', score: 90, rationale: 'Solid AI with moderate/low solubility — classic SC.', advantages: ['Water-based'], limitations: ['Milling required'], range: '5-50% w/w' });
    scores.push({ type: 'WDG', score: 75, rationale: 'Solid AI — granule for logistics.', advantages: ['Less dust than WP'], limitations: ['Granulation cost'], range: '10-90% w/w' });
  }
  if (logP > 4) {
    scores.push({ type: 'CS', score: 70, rationale: 'Very hydrophobic/volatile — encapsulation option.', advantages: ['Exposure reduction'], limitations: ['Complex process'], range: '1-15% w/w' });
  }
  scores.push({ type: 'WP', score: 55, rationale: 'Fallback powder option for solids.', advantages: ['Low cost'], limitations: ['Dust'], range: '10-80% w/w' });

  const byType = new Map<FormulationType, typeof scores[0]>();
  for (const s of scores) {
    const prev = byType.get(s.type);
    if (!prev || s.score > prev.score) byType.set(s.type, s);
  }

  return Array.from(byType.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => ({
      type: s.type,
      score: s.score,
      rationale: s.rationale,
      advantages: s.advantages,
      limitations: s.limitations,
      typical_loading_range: s.range,
    }));
}

/** Offline troubleshoot from knowledge articles */
export function diagnoseIssueOffline(category: string, description: string): TroubleshootDiagnosis {
  const articles = KNOWLEDGE_ARTICLES.filter(
    (a) => a.category === category || a.tags.some((t) => description.toLowerCase().includes(t))
  );
  const primary = articles[0] ?? KNOWLEDGE_ARTICLES.find((a) => a.id === 'formulation-selection')!;

  return {
    root_causes: [
      {
        cause: primary.title,
        likelihood: 'high',
        explanation: primary.content.slice(0, 300),
      },
      {
        cause: 'Process or storage variation',
        likelihood: 'medium',
        explanation: 'Check batch records, water quality, and temperature history.',
      },
    ],
    remedies: [
      {
        action: 'Apply knowledge-base remediation',
        priority: 1,
        details: primary.content,
        expected_outcome: 'Stability or performance restored per handbook guidance',
      },
      {
        action: 'Run confirmatory lab test',
        priority: 2,
        details: 'Jar test, particle size, viscosity, or emulsion dilution per formulation type.',
        expected_outcome: 'Validated fix before scale-up',
      },
    ],
    preventive_measures: [
      'Document water quality and pH at dilution',
      'Monitor particle size / emulsion droplet size routinely',
      'Accelerated stability (54°C, 14 days) for new batches',
    ],
  };
}

export function getKnowledgeContextForPrompt(topic: string, limit = 5): string {
  const hits = searchKnowledge(topic, limit);
  if (hits.length === 0) return '';
  return hits.map((h) => `[${h.type}] ${h.title}: ${h.snippet}`).join('\n');
}

export { KNOWLEDGE_INGREDIENTS, KNOWLEDGE_SURFACTANTS, KNOWLEDGE_FORMULATION_TYPES, KNOWLEDGE_ARTICLES, KNOWLEDGE_VOCABULARY };
