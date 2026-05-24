// ============================================================
// FormuLab — AI Service (Gemini Integration)
// ============================================================
// This service handles all AI-powered features using Google Gemini API.
// Each function constructs a domain-specific prompt and parses the response.
// ============================================================

import type {
  ActiveIngredient,
  FormulationRecommendation,
  SurfactantSuggestion,
  StabilityRisk,
  GeneratedRecipe,
  TroubleshootDiagnosis,
  FormulationType,
} from '../types';
import {
  recommendFormulationTypesOffline,
  diagnoseIssueOffline,
  getKnowledgeContextForPrompt,
  KNOWLEDGE_SURFACTANTS,
  KNOWLEDGE_FORMULATION_TYPES,
} from '../knowledge';

const LLM_ENDPOINT = 'https://llm-backend-635x.onrender.com/api/generate/json';

const VERIFIED_JSON_RULES = `
VERIFIED MODE: Use ONLY facts from TRUSTED RAG SOURCES and handbook blocks in the system message.
Do not guess. If data is missing, return empty arrays or generic safe defaults from handbook only.
Forbidden in text fields: might, may, possibly, probably, uncertain, I think, perhaps.`;

export interface RagContextOpts {
  orgId: string;
  userId?: string;
}

export type AiSource = 'llm' | 'offline';

export interface AiResponse<T> {
  data: T;
  source: AiSource;
}

/**
 * Call the Render LLM proxy API and get a structured JSON response
 */
async function callGemini<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const response = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `${userPrompt}\n\nRespond ONLY with valid JSON. No markdown, no HTML, no code blocks, no explanations.`,
      system: systemPrompt,
      preferred_provider: 'gemini',
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`LLM API failed: ${data.error || 'unknown error'}`);
  }

  const text = data.response || '{}';

  // Strip markdown code block fencing if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('Failed to parse LLM response:', cleaned);
    throw new Error('Failed to parse AI response');
  }
}

/** LLM call with RAG + handbook context; runs fallback when API is down */
async function callWithKnowledgeFallback<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: () => T,
  orgId?: string,
  userId?: string
): Promise<AiResponse<T>> {
  let ragBlock = '';
  if (orgId && typeof window !== 'undefined') {
    try {
      const { fetchRagContext } = await import('./rag.service');
      const { context } = await fetchRagContext(userPrompt.slice(0, 500), orgId, userId);
      if (context) ragBlock = context;
    } catch {
      /* use handbook only */
    }
  }
  const kb = getKnowledgeContextForPrompt(userPrompt, 5);
  const system = [
    systemPrompt,
    ragBlock ? `\n\nTRUSTED RAG SOURCES (user docs, Wikipedia, PubChem, web imports — cite facts from here only):\n${ragBlock.slice(0, 12000)}` : '',
    kb ? `\n\nFormuLab handbook:\n${kb}` : '',
    VERIFIED_JSON_RULES,
  ].join('');

  try {
    const data = await callGemini<T>(system, userPrompt);
    return { data, source: 'llm' };
  } catch (err) {
    console.warn('LLM unavailable — using offline knowledge base', err);
    return { data: fallback(), source: 'offline' };
  }
}

// ==================== Formulation Type Recommendation ====================

export async function recommendFormulationType(
  ingredient: ActiveIngredient,
  rag?: RagContextOpts
): Promise<AiResponse<FormulationRecommendation[]>> {
  const systemPrompt = `You are an expert agrochemical formulation scientist with 30+ years of experience.
Given the physico-chemical properties of an active ingredient, recommend the most suitable formulation types.

Consider these key factors:
- Water solubility → high: SL; moderate: SC, EW; low: EC, WDG, WP, CS
- Physical form → solid: WDG, WP, SC (after milling); liquid: EC, SL, EW
- Log P (hydrophobicity) → high (>3): EC, CS; low (<2): SL, SC
- Melting point → high (>100°C): WDG, WP; low: EC, SL
- Vapor pressure → high: CS (encapsulation reduces volatility)
- Particle size → fine: SC; coarse: WDG
- Technical purity → affects processability

Return a JSON array of recommendations, ranked by suitability score (0-100).
Each recommendation must include: type, score, rationale, advantages (array), limitations (array), typical_loading_range.
Return the top 4-5 most suitable types.`;

  const userPrompt = `Active Ingredient Properties:
- Name: ${ingredient.name}
- IUPAC: ${ingredient.iupac_name}
- CAS: ${ingredient.cas_number}
- Molecular Weight: ${ingredient.molecular_weight} g/mol
- Melting Point: ${ingredient.melting_point}°C
- Water Solubility: ${ingredient.solubility_water} mg/L at 20°C
- Log P: ${ingredient.log_p}
- Vapor Pressure: ${ingredient.vapor_pressure} mPa at 25°C
- pKa: ${ingredient.pka}
- Technical Purity: ${ingredient.technical_purity}% w/w
- Physical Form: ${ingredient.physical_form}
- Particle Size (D50): ${ingredient.particle_size_d50} μm
- Hazard Class: ${ingredient.hazard_class}
- Category: ${ingredient.target_pest_category}`;

  return callWithKnowledgeFallback(
    systemPrompt,
    userPrompt,
    () => recommendFormulationTypesOffline(ingredient),
    rag?.orgId,
    rag?.userId
  );
}

// ==================== Surfactant & Additive Advisor ====================

export async function suggestSurfactants(
  ingredient: ActiveIngredient,
  formulationType: FormulationType,
  rag?: RagContextOpts
): Promise<AiResponse<SurfactantSuggestion[]>> {
  const systemPrompt = `You are an expert agrochemical formulation scientist specializing in surfactant chemistry and formulation additives.

Given an active ingredient and the chosen formulation type, recommend a complete surfactant and additive strategy.

For each formulation type, consider:
- SC: Dispersants (polycarboxylates, naphthalene sulfonates), wetting agents, thickeners (xanthan, attapulgite), antifoams, preservatives
- EC: Emulsifiers (calcium dodecylbenzenesulfonate, POE fatty alcohol ethoxylates), co-solvents
- WDG: Binders, dispersants, disintegrants, wetting agents
- EW: Emulsifiers (HLB system), stabilizers, antifreeze agents
- SL: Solubilizers, pH buffers, compatibilizers

Provide specific trade name examples where possible (e.g., Morwet D-425, Atlox 4913, Rhodacal DS-4).

Return a JSON array of surfactant/additive suggestions.
Each item must include: category, chemical_class, trade_names (array), function, recommended_level (e.g., "0.5-2% w/w"), hlb_range (optional), notes.`;

  const userPrompt = `Active Ingredient: ${ingredient.name}
Formulation Type: ${formulationType}
Water Solubility: ${ingredient.solubility_water} mg/L
Log P: ${ingredient.log_p}
Physical Form: ${ingredient.physical_form}
Particle Size D50: ${ingredient.particle_size_d50} μm`;

  return callWithKnowledgeFallback(systemPrompt, userPrompt, () => {
    const matches = KNOWLEDGE_SURFACTANTS.filter((s) =>
      s.formulation_types.includes(formulationType)
    );
    const list = matches.length > 0 ? matches : KNOWLEDGE_SURFACTANTS.slice(0, 6);
    return list.map((s) => ({
      category: s.function,
      chemical_class: s.chemical_class,
      trade_names: [s.trade_name],
      function: s.function,
      recommended_level: s.typical_level,
      hlb_range: s.hlb_range,
      notes: s.notes,
    }));
  }, rag?.orgId, rag?.userId);
}

// ==================== Stability & Risk Assessment ====================

export async function assessStability(
  ingredient: ActiveIngredient,
  formulationType: FormulationType,
  rag?: RagContextOpts
): Promise<AiResponse<StabilityRisk[]>> {
  const systemPrompt = `You are an agrochemical formulation stability expert.

Analyze the active ingredient properties and formulation type to identify potential stability risks.

Common risks by formulation type:
- SC: Sedimentation, Ostwald ripening, crystal growth, viscosity changes
- EC: Phase separation, crystallization at low temps, emulsion breaking
- WDG: Caking, moisture uptake, disintegration failure
- EW: Creaming/sedimentation, coalescence, Ostwald ripening
- CS: Wall degradation, premature release, aggregation
- WP: Caking, dustiness, flowability loss
- SL: Precipitation, crystal formation, pH-driven degradation

For each risk, provide severity (low/medium/high/critical), probability, description, and mitigation strategies.

Return a JSON array of stability risks.
Each item must include: risk_type, severity, probability, description, mitigation (array of strings).`;

  const userPrompt = `Active Ingredient: ${ingredient.name}
Formulation Type: ${formulationType}
Melting Point: ${ingredient.melting_point}°C
Water Solubility: ${ingredient.solubility_water} mg/L
Log P: ${ingredient.log_p}
Vapor Pressure: ${ingredient.vapor_pressure} mPa
pKa: ${ingredient.pka}
Physical Form: ${ingredient.physical_form}
Particle Size D50: ${ingredient.particle_size_d50} μm`;

  return callWithKnowledgeFallback(systemPrompt, userPrompt, () => {
    const ft = KNOWLEDGE_FORMULATION_TYPES.find((f) => f.code === formulationType);
    const risks: StabilityRisk[] = (ft?.limitations ?? ['General stability concerns']).map((lim, i) => ({
      risk_type: lim,
      severity: i === 0 ? 'high' : 'medium',
      probability: 'Medium in typical storage',
      description: `${lim} — monitor during accelerated stability (54°C, 14 days).`,
      mitigation: ft?.processing_notes ?? ['Optimize dispersant and thickener levels', 'Control particle size'],
    }));
    return risks.length > 0 ? risks : [{
      risk_type: 'Storage stability',
      severity: 'medium',
      probability: 'Medium',
      description: 'Validate with jar test and viscosity checks.',
      mitigation: ['Accelerated stability study', 'pH control at dilution'],
    }];
  }, rag?.orgId, rag?.userId);
}

// ==================== Recipe Generation ====================

export async function generateRecipe(
  ingredient: ActiveIngredient,
  formulationType: FormulationType,
  targetLoading: number,
  surfactants: SurfactantSuggestion[],
  rag?: RagContextOpts
): Promise<AiResponse<GeneratedRecipe>> {
  const systemPrompt = `You are an expert agrochemical formulation chemist. Generate a complete development recipe for laboratory trial.

The recipe must:
1. Include the active ingredient at the specified loading
2. Include all necessary functional ingredients (dispersants, wetting agents, thickeners, antifoams, preservatives, carriers/solvents)
3. Total to 100% w/w (or appropriate g/L for liquid formulations)
4. Include realistic quantities based on industry standards
5. Specify the functional purpose of each ingredient
6. Suggest alternatives where applicable
7. Include processing notes (e.g., milling time, mixing order, temperature)
8. Predict expected physical properties (viscosity, pH, density, etc.)

Return a JSON object with:
- ingredients: array of { name, role, quantity, unit, purpose, alternatives }
- processing_notes: array of strings
- expected_properties: array of { property, value, unit }`;

  const surfactantContext = surfactants.map(s =>
    `${s.category}: ${s.trade_names.join(', ')} at ${s.recommended_level}`
  ).join('\n');

  const userPrompt = `Active Ingredient: ${ingredient.name}
Formulation Type: ${formulationType}
Target AI Loading: ${targetLoading}% w/w
Physical Form: ${ingredient.physical_form}
Water Solubility: ${ingredient.solubility_water} mg/L
Log P: ${ingredient.log_p}
Particle Size D50: ${ingredient.particle_size_d50} μm

Recommended Surfactant Strategy:
${surfactantContext}

Generate a complete lab-scale recipe (1 kg batch).`;

  return callWithKnowledgeFallback(systemPrompt, userPrompt, () => ({
    ingredients: [
      {
        name: ingredient.name,
        role: 'active',
        quantity: targetLoading,
        unit: 'percent_ww',
        purpose: 'Active ingredient',
      },
      ...surfactants.slice(0, 4).map((s) => ({
        name: s.trade_names[0] || s.chemical_class,
        role: 'dispersant' as const,
        quantity: 2,
        unit: 'percent_ww' as const,
        purpose: s.function,
      })),
      {
        name: 'Water to balance',
        role: 'carrier' as const,
        quantity: Math.max(0, 100 - targetLoading - surfactants.length * 2),
        unit: 'percent_ww' as const,
        purpose: 'Continuous phase',
      },
    ],
    processing_notes: KNOWLEDGE_FORMULATION_TYPES.find((f) => f.code === formulationType)?.processing_notes ?? [
      'Premix dispersants',
      'Add AI slurry',
      'Adjust viscosity',
    ],
    expected_properties: [
      { property: 'pH (1% dilution)', value: '5.0–7.0', unit: '' },
      { property: 'Viscosity', value: '500–1500', unit: 'cP' },
    ],
  }), rag?.orgId, rag?.userId);
}

// ==================== Troubleshooting ====================

export async function diagnoseIssue(
  issueCategory: string,
  description: string,
  formulationType?: string,
  ingredientName?: string,
  rag?: RagContextOpts
): Promise<AiResponse<TroubleshootDiagnosis>> {
  const systemPrompt = `You are an expert agrochemical formulation troubleshooting specialist.

Given a formulation issue, provide:
1. Root cause analysis with likelihood ranking
2. Remedies ranked by priority
3. Preventive measures for future batches

Draw upon deep knowledge of colloid chemistry, surfactant science, rheology, and agrochemical stability.

Return a JSON object with:
- root_causes: array of { cause, likelihood (high/medium/low), explanation }
- remedies: array of { action, priority (1=highest), details, expected_outcome }
- preventive_measures: array of strings`;

  const userPrompt = `Issue Category: ${issueCategory}
Description: ${description}
${formulationType ? `Formulation Type: ${formulationType}` : ''}
${ingredientName ? `Active Ingredient: ${ingredientName}` : ''}`;

  return callWithKnowledgeFallback(
    systemPrompt,
    userPrompt,
    () => diagnoseIssueOffline(issueCategory, description),
    rag?.orgId,
    rag?.userId
  );
}
