// ============================================================
// FormuLab — Application Constants
// ============================================================

// ---------- Appwrite Collection IDs ----------
export const COLLECTIONS = {
  ORGANIZATIONS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORGANIZATIONS || 'organizations',
  MEMBERS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MEMBERS || 'members',
  ACTIVE_INGREDIENTS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVE_INGREDIENTS || 'active_ingredients',
  FORMULATIONS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_FORMULATIONS || 'formulations',
  RECIPE_INGREDIENTS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RECIPE_INGREDIENTS || 'recipe_ingredients',
  STABILITY_TESTS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_STABILITY_TESTS || 'stability_tests',
  TROUBLESHOOTING: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TROUBLESHOOTING || 'troubleshooting_sessions',
  REPORTS: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_REPORTS || 'reports',
  AUDIT_LOG: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_AUDIT_LOG || 'audit_log',
  ORG_INVITES: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORG_INVITES || 'org_invites',
  KNOWLEDGE_DOCUMENTS: 'knowledge_documents',
  KNOWLEDGE_CHUNKS: 'knowledge_chunks',
} as const;

export const STORAGE_BUCKETS = {
  REPORTS: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_REPORTS || 'reports',
  LOGOS: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_LOGOS || 'org-logos',
} as const;

// ---------- Formulation Type Labels ----------
export const FORMULATION_TYPE_LABELS: Record<string, string> = {
  SC: 'Suspension Concentrate',
  EC: 'Emulsifiable Concentrate',
  WDG: 'Water Dispersible Granule',
  WP: 'Wettable Powder',
  EW: 'Emulsion (Oil in Water)',
  SL: 'Soluble Liquid / Concentrate',
  CS: 'Capsule Suspension',
  SE: 'Suspo-Emulsion',
  OD: 'Oil Dispersion',
  ZC: 'Capsule Suspension (encapsulated)',
  ME: 'Micro-Emulsion',
  DC: 'Dispersible Concentrate',
};

// ---------- Ingredient Role Labels ----------
export const INGREDIENT_ROLE_LABELS: Record<string, string> = {
  active: 'Active Ingredient',
  dispersant: 'Dispersant',
  wetting_agent: 'Wetting Agent',
  thickener: 'Thickener / Rheology Modifier',
  antifoam: 'Antifoam Agent',
  preservative: 'Preservative / Biocide',
  solvent: 'Solvent',
  carrier: 'Carrier / Filler',
  adjuvant: 'Adjuvant',
  other: 'Other',
};

// ---------- Status Labels & Colors ----------
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'var(--color-warning)' },
  in_review: { label: 'In Review', color: 'var(--color-info)' },
  approved: { label: 'Approved', color: 'var(--color-success)' },
  archived: { label: 'Archived', color: 'var(--color-muted)' },
};

// ---------- Stability Test Labels ----------
export const STABILITY_TEST_LABELS: Record<string, string> = {
  accelerated_54C: 'Accelerated (54°C / 14 days)',
  shelf_ambient: 'Shelf Life (Ambient)',
  freeze_thaw: 'Freeze-Thaw Cycling',
  centrifuge: 'Centrifuge Test',
  pH_over_time: 'pH Over Time',
};

// ---------- Issue Category Labels ----------
export const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  sedimentation: 'Sedimentation / Settling',
  phase_separation: 'Phase Separation',
  viscosity: 'Viscosity Issues',
  foam: 'Excessive Foaming',
  crystal_growth: 'Crystal Growth',
  pH_drift: 'pH Drift',
  efficacy_loss: 'Efficacy Loss',
  other: 'Other',
};

// ---------- Pest Category Labels ----------
export const PEST_CATEGORY_LABELS: Record<string, string> = {
  insecticide: 'Insecticide',
  herbicide: 'Herbicide',
  fungicide: 'Fungicide',
  acaricide: 'Acaricide',
  other: 'Other',
};

// ---------- Physical Form Labels ----------
export const PHYSICAL_FORM_LABELS: Record<string, string> = {
  solid: 'Solid',
  liquid: 'Liquid',
  waxy: 'Waxy / Semi-solid',
};

// ---------- Unit Labels ----------
export const UNIT_LABELS: Record<string, string> = {
  percent_ww: '% w/w',
  percent_wv: '% w/v',
  g_per_L: 'g/L',
  ml_per_L: 'mL/L',
};

// ---------- Risk Severity Config ----------
export const RISK_SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: 'Low', color: 'var(--color-success)', icon: '✓' },
  medium: { label: 'Medium', color: 'var(--color-warning)', icon: '⚠' },
  high: { label: 'High', color: 'var(--color-danger)', icon: '⚡' },
  critical: { label: 'Critical', color: 'var(--color-critical)', icon: '🔴' },
};

// ---------- Wizard Steps ----------
export const WIZARD_STEPS = [
  { id: 1, title: 'Active Ingredient', description: 'Select or create the active ingredient' },
  { id: 2, title: 'Formulation Type', description: 'AI-recommended formulation families' },
  { id: 3, title: 'Surfactants & Additives', description: 'Surfactant and additive strategy' },
  { id: 4, title: 'Stability Check', description: 'Risk assessment & stability flags' },
  { id: 5, title: 'Recipe Generation', description: 'AI-generated development recipe' },
  { id: 6, title: 'Review & Save', description: 'Final review and save formulation' },
];

// ---------- Nav Items ----------
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'formulations', label: 'Formulations', href: '/formulations', icon: 'FlaskConical' },
  { id: 'ingredients', label: 'Ingredients', href: '/ingredients', icon: 'Atom' },
  { id: 'knowledge', label: 'Knowledge', href: '/knowledge', icon: 'BookOpen' },
  { id: 'troubleshoot', label: 'Troubleshoot', href: '/troubleshoot', icon: 'Bug' },
  { id: 'reports', label: 'Reports', href: '/reports', icon: 'FileText' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
];

// ---------- App Meta ----------
export const APP_NAME = 'FormuLab';
export const APP_DESCRIPTION = 'AI-powered agrochemical formulation copilot for R&D teams';
export const APP_VERSION = '1.0.0';
