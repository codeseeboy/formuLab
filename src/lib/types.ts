// ============================================================
// FormuLab — TypeScript Type Definitions
// ============================================================

// ---------- Enums ----------

export type PhysicalForm = 'solid' | 'liquid' | 'waxy';
export type PestCategory = 'insecticide' | 'herbicide' | 'fungicide' | 'acaricide' | 'other';
export type FormulationStatus = 'draft' | 'in_review' | 'approved' | 'archived';
export type FormulationType = 'SC' | 'EC' | 'WDG' | 'WP' | 'EW' | 'SL' | 'CS' | 'SE' | 'OD' | 'ZC' | 'ME' | 'DC';
export type IngredientRole = 'active' | 'dispersant' | 'wetting_agent' | 'thickener' | 'antifoam' | 'preservative' | 'solvent' | 'carrier' | 'adjuvant' | 'other';
export type QuantityUnit = 'percent_ww' | 'percent_wv' | 'g_per_L' | 'ml_per_L';
export type StabilityTestType = 'accelerated_54C' | 'shelf_ambient' | 'freeze_thaw' | 'centrifuge' | 'pH_over_time';
export type StabilityResult = 'pass' | 'marginal' | 'fail';
export type IssueCategory = 'sedimentation' | 'phase_separation' | 'viscosity' | 'foam' | 'crystal_growth' | 'pH_drift' | 'efficacy_loss' | 'other';
export type ReportType = 'formulation_summary' | 'stability_report' | 'comparison' | 'regulatory_draft';
export type MemberRole = 'owner' | 'admin' | 'scientist' | 'viewer';
export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

// ---------- Database Models ----------

export interface Organization {
  $id: string;
  name: string;
  slug: string;
  logo_url: string;
  plan: OrgPlan;
  created_at: string;
}

export interface Member {
  $id: string;
  user_id: string;
  org_id: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
  // Populated client-side
  user_name?: string;
  user_email?: string;
}

export interface ActiveIngredient {
  $id: string;
  org_id: string;
  name: string;
  iupac_name: string;
  cas_number: string;
  molecular_weight: number;
  melting_point: number;
  solubility_water: number;
  log_p: number;
  vapor_pressure: number;
  pka: number;
  technical_purity: number;
  physical_form: PhysicalForm;
  particle_size_d50: number;
  hazard_class: string;
  target_pest_category: PestCategory;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface Formulation {
  $id: string;
  org_id: string;
  ai_id: string;
  name: string;
  status: FormulationStatus;
  formulation_type: string;
  target_ai_loading: number;
  recommended_types: string; // JSON string
  surfactant_strategy: string; // JSON string
  stability_assessment: string; // JSON string
  recipe_json: string; // JSON string
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Populated client-side
  active_ingredient?: ActiveIngredient;
}

export interface RecipeIngredient {
  $id: string;
  formulation_id: string;
  ingredient_name: string;
  ingredient_role: IngredientRole;
  quantity: number;
  unit: QuantityUnit;
  supplier: string;
  notes: string;
  sort_order: number;
}

export interface StabilityTest {
  $id: string;
  formulation_id: string;
  test_type: StabilityTestType;
  duration_days: number;
  result_status: StabilityResult;
  observations: string;
  data_json: string; // JSON string
  tested_by: string;
  tested_at: string;
}

export interface TroubleshootingSession {
  $id: string;
  org_id: string;
  formulation_id: string;
  issue_category: IssueCategory;
  description: string;
  ai_diagnosis: string; // JSON string
  resolution_notes: string;
  resolved: boolean;
  created_by: string;
  created_at: string;
}

export interface Report {
  $id: string;
  org_id: string;
  formulation_id: string;
  title: string;
  report_type: ReportType;
  file_id: string;
  generated_by: string;
  generated_at: string;
}

export interface AuditLogEntry {
  $id: string;
  org_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

// ---------- AI Response Types ----------

export interface FormulationRecommendation {
  type: FormulationType;
  score: number; // 0-100
  rationale: string;
  advantages: string[];
  limitations: string[];
  typical_loading_range: string;
}

export interface SurfactantSuggestion {
  category: string;
  chemical_class: string;
  trade_names: string[];
  function: string;
  recommended_level: string;
  hlb_range?: string;
  notes: string;
}

export interface StabilityRisk {
  risk_type: string;
  severity: RiskSeverity;
  probability: string;
  description: string;
  mitigation: string[];
}

export interface GeneratedRecipe {
  ingredients: {
    name: string;
    role: IngredientRole;
    quantity: number;
    unit: QuantityUnit;
    purpose: string;
    alternatives?: string[];
  }[];
  processing_notes: string[];
  expected_properties: {
    property: string;
    value: string;
    unit: string;
  }[];
}

export interface TroubleshootDiagnosis {
  root_causes: {
    cause: string;
    likelihood: 'high' | 'medium' | 'low';
    explanation: string;
  }[];
  remedies: {
    action: string;
    priority: number;
    details: string;
    expected_outcome: string;
  }[];
  preventive_measures: string[];
}

// ---------- UI State Types ----------

export interface WizardState {
  currentStep: number;
  activeIngredient: ActiveIngredient | null;
  formulationName: string;
  targetLoading: number;
  selectedType: FormulationType | null;
  recommendations: FormulationRecommendation[];
  surfactants: SurfactantSuggestion[];
  risks: StabilityRisk[];
  recipe: GeneratedRecipe | null;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardStats {
  totalFormulations: number;
  activeProjects: number;
  approvedRecipes: number;
  totalIngredients: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'formulation_created' | 'formulation_updated' | 'ingredient_added' | 'report_generated' | 'issue_resolved';
  title: string;
  description: string;
  user_name: string;
  timestamp: string;
}

// ---------- Auth Types ----------

export interface AuthUser {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, string>;
}

export interface AuthState {
  user: AuthUser | null;
  org: Organization | null;
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
